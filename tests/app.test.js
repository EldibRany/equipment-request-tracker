import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { STORAGE_KEY } from "../src/request-store.js";

test("filter options match the existing Normal priority used by the form", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const options = html.match(/<select id="priority-filter">([\s\S]*?)<\/select>/)[1];
  assert.deepEqual([...options.matchAll(/value="([^"]+)"/g)].map((match) => match[1]),
    ["All", "High", "Normal", "Low"]);
});

test("direct-file startup explains server requirement even when modules cannot load", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const message = { classList: { add() {} } };
  const button = { disabled: false };
  let submit;
  const document = {
    querySelector(selector) {
      if (selector === "#form-message") return message;
      if (selector === "#request-form") return { addEventListener(type, handler) { submit = handler; } };
      return button;
    },
  };
  runInNewContext(script, { window: { location: { protocol: "file:" } }, document });
  assert.match(message.textContent, /http:\/\/127\.0\.0\.1:8000/);
  assert.equal(button.disabled, true);
  let prevented = false;
  submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  runInNewContext(script, {
    window: { location: { protocol: "http:" } },
    document: { querySelector() { assert.fail("HTTP startup must remain unchanged"); } },
  });
});

// Minimal DOM doubles exercise the real submit and filter handlers without dependencies.
test("submit validates, handles a failed save and retry, filters, and reloads", async () => {
  function element() {
    return {
      value: "", textContent: "", hidden: false, children: [], handlers: {},
      classList: { toggle() {} },
      addEventListener(type, handler) { this.handlers[type] = handler; },
      replaceChildren(...children) { this.children = children; },
      append(child) { this.children.push(child); },
      setAttribute() {}, removeAttribute() {}, focus() {},
    };
  }
  const selectors = ["#request-form", "#form-message", "#needed-by", "#request-count",
    "#empty-state", "#request-table-wrapper", "#request-table-body", "#priority-filter",
    "#no-priority-matches", "#requester"];
  const elements = Object.fromEntries(selectors.map((selector) => [selector, element()]));
  const form = elements["#request-form"];
  form.elements = [];
  let input = {};
  form.reset = () => { input = {}; };
  let stored = null;
  let failWrite = false;
  const globals = ["document", "FormData", "localStorage"];
  const originals = globals.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
  const replacements = {
    document: { querySelector: (selector) => elements[selector], createElement: element },
    FormData: class { entries() { return Object.entries(input); } },
    localStorage: {
      getItem(key) { assert.equal(key, STORAGE_KEY); return stored; },
      setItem(key, value) {
        assert.equal(key, STORAGE_KEY);
        if (failWrite) throw new Error("Quota exceeded");
        stored = value;
      },
    },
  };
  const originalConsoleError = console.error;
  try {
    for (const name of globals) {
      Object.defineProperty(globalThis, name, { configurable: true, value: replacements[name] });
    }
    console.error = () => {};
    await import("../src/app.js?submit-test");
    const submit = () => {
      let prevented = false;
      form.handlers.submit({ preventDefault() { prevented = true; } });
      assert.equal(prevented, true);
    };
    const filter = (value) => {
      elements["#priority-filter"].value = value;
      elements["#priority-filter"].handlers.change();
    };
    submit();
    assert.equal(elements["#form-message"].textContent, "Complete all required fields.");
    assert.equal(stored, null);
    input = { requester: "Test manager", department: "Operations", equipment: "Laptop",
      neededBy: "2026-12-01", reason: "Replacement", priority: "High" };
    failWrite = true;
    submit();
    assert.match(elements["#form-message"].textContent, /could not be saved/);
    assert.equal(elements["#request-count"].textContent, "0 requests");
    assert.equal(input.requester, "Test manager");
    failWrite = false;
    submit();
    assert.equal(JSON.parse(stored).length, 1);
    assert.equal(elements["#request-count"].textContent, "1 request");
    assert.equal(elements["#request-table-body"].children.length, 1);
    assert.equal(elements["#form-message"].textContent, "Request added.");
    filter("Low");
    assert.equal(elements["#request-count"].textContent, "0 requests");
    assert.equal(elements["#no-priority-matches"].hidden, false);
    filter("High");
    assert.equal(elements["#request-table-body"].children.length, 1);
    filter("Normal");
    input = { requester: "Normal manager", department: "Operations", equipment: "Monitor",
      neededBy: "2026-12-01", reason: "Replacement", priority: "Normal" };
    submit();
    assert.equal(elements["#priority-filter"].value, "Normal");
    assert.equal(elements["#request-count"].textContent, "1 request");
    assert.equal(elements["#request-table-body"].children[0].children[0].textContent, "Normal manager");
    filter("All");
    assert.deepEqual(elements["#request-table-body"].children.map((row) => row.children[0].textContent),
      ["Normal manager", "Test manager"]);
    const before = stored;
    await import("../src/app.js?reload-test");
    assert.equal(elements["#priority-filter"].value, "All");
    assert.equal(elements["#request-count"].textContent, "2 requests");
    assert.equal(stored, before);
  } finally {
    console.error = originalConsoleError;
    globals.forEach((name, index) => {
      if (originals[index]) Object.defineProperty(globalThis, name, originals[index]);
      else delete globalThis[name];
    });
  }
});
