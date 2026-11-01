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
} from "./src/request-store.js";

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

test("createRequest does not infer a missing priority", () => {
  const request = createRequest(validInput);
  assert.equal(Object.hasOwn(request, "priority"), false);
});

test("each assigned valid priority survives storage and reload", () => {
  for (const priority of ["Low", "Normal", "High"]) {
    const storage = new MemoryStorage();
    const request = createRequest({ ...validInput, priority });
    saveRequests([request], storage);
    assert.deepEqual(loadRequests(storage), [request]);
    assert.equal(request.priority, priority);
  }
});

test("unrecognized saved priorities stay unchanged and remain visible under All", () => {
  const storage = new MemoryStorage();
  const request = { ...createRequest(validInput), priority: "Urgent" };
  saveRequests([request], storage);

  const loaded = loadRequests(storage);
  assert.deepEqual(loaded, [request]);
  assert.deepEqual(filterRequestsByPriority(loaded, "All"), [request]);
  assert.deepEqual(filterRequestsByPriority(loaded, "High"), []);
});

test("older stored requests without a priority remain unchanged", () => {
  const storage = new MemoryStorage();
  const legacyRequest = createRequest(validInput);
  saveRequests([legacyRequest], storage);

  const loaded = loadRequests(storage);
  assert.deepEqual(loaded, [legacyRequest]);
  assert.equal(Object.hasOwn(loaded[0], "priority"), false);
  assert.deepEqual(filterRequestsByPriority(loaded, "All"), [legacyRequest]);
});
