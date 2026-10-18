import assert from "node:assert/strict";
import test from "node:test";

import {
  RequestValidationError,
  STORAGE_KEY,
  appendRequest,
  createRequest,
  filterRequestsByPriority,
  loadRequests,
  saveRequests,
} from "../src/request-store.js";

const validInput = {
  requester: "  Jordan Lee  ",
  department: "Operations",
  equipment: "  Laptop  ",
  neededBy: "2026-09-15",
  reason: "  Replace a failed field computer.  ",
};

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

test("createRequest trims input and adds system fields", () => {
  const request = createRequest(validInput, {
    id: "request-1",
    now: new Date("2026-08-17T12:00:00.000Z"),
  });

  assert.deepEqual(request, {
    id: "request-1",
    requester: "Jordan Lee",
    department: "Operations",
    equipment: "Laptop",
    neededBy: "2026-09-15",
    reason: "Replace a failed field computer.",
    createdAt: "2026-08-17T12:00:00.000Z",
  });
});

test("createRequest reports missing required fields", () => {
  assert.throws(
    () => createRequest({ ...validInput, requester: "", equipment: " " }),
    (error) => {
      assert.ok(error instanceof RequestValidationError);
      assert.deepEqual(Object.keys(error.errors), ["requester", "equipment"]);
      return true;
    },
  );
});

test("appendRequest returns a new list with the newest request first", () => {
  const original = [{ id: "old" }];
  const result = appendRequest(original, { id: "new" });

  assert.deepEqual(result.map((request) => request.id), ["new", "old"]);
  assert.deepEqual(original.map((request) => request.id), ["old"]);
});

test("saveRequests and loadRequests round-trip valid records", () => {
  const storage = new MemoryStorage();
  const request = createRequest(validInput, {
    id: "request-2",
    now: new Date("2026-08-17T12:00:00.000Z"),
  });

  saveRequests([request], storage);

  assert.deepEqual(loadRequests(storage), [request]);
});

test("loadRequests safely handles damaged stored data", () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, "not-json");

  assert.deepEqual(loadRequests(storage), []);
});

test("priority filtering preserves order, counts, records, and storage across switches", () => {
  const priorities = ["High", "Normal", "Low", "High", "Low", "Normal", undefined, "Unknown"];
  const requests = priorities.map((priority, index) => Object.freeze({
    ...createRequest(validInput, { id: String(index) }),
    ...(priority === undefined ? {} : { priority }),
  }));
  Object.freeze(requests);
  const storage = new MemoryStorage();
  saveRequests(requests, storage);
  const before = storage.getItem(STORAGE_KEY);
  const loaded = loadRequests(storage);
  assert.deepEqual(loaded, requests);
  for (const priority of ["All", "High", "Normal", "Low", "Normal", "High", "High", "All"]) {
    const expectedIds = {
      All: ["0", "1", "2", "3", "4", "5", "6", "7"],
      High: ["0", "3"], Normal: ["1", "5"], Low: ["2", "4"],
    }[priority];
    const result = filterRequestsByPriority(loaded, priority);
    assert.deepEqual(result.map((request) => request.id), expectedIds);
    assert.equal(result.length, expectedIds.length);
    result.forEach((request) => assert.equal(request, loaded.find((original) => original.id === request.id)));
  }
  assert.deepEqual(loaded, requests);
  assert.equal(storage.getItem(STORAGE_KEY), before);
});

test("priority filtering handles empty lists and no matches", () => {
  for (const priority of ["All", "High", "Normal", "Low"]) {
    assert.deepEqual(filterRequestsByPriority([], priority), []);
  }
  assert.deepEqual(filterRequestsByPriority([{ priority: "High" }, {}], "Normal"), []);
});

test("creation preserves the existing form priority without changing legacy records", () => {
  for (const priority of ["High", "Normal", "Low"]) {
    assert.equal(createRequest({ ...validInput, priority }).priority, priority);
  }
  assert.equal(Object.hasOwn(createRequest(validInput), "priority"), false);
});

test("denied localStorage access does not prevent loading, but saving reports failure", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() { throw new Error("Storage access denied"); },
  });
  try {
    assert.deepEqual(loadRequests(), []);
    assert.throws(() => saveRequests([]), /Storage access denied/);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  }
});

test("unavailable storage and failed writes never report a successful save", () => {
  assert.deepEqual(loadRequests(null), []);
  assert.throws(() => saveRequests([], null), /storage is unavailable/);
  const storage = new MemoryStorage();
  const requests = [createRequest(validInput)];
  saveRequests(requests, storage);
  const before = storage.getItem(STORAGE_KEY);
  storage.setItem = () => { throw new Error("Quota exceeded"); };
  assert.throws(() => saveRequests([], storage), /Quota exceeded/);
  assert.equal(storage.getItem(STORAGE_KEY), before);
});
