import assert from "node:assert";
import { isDue, pickDue } from "../timers.js";
import { step, close } from "../timerrun.js";
import { render } from "../app.js";

const base = {
  budget: 1,
  state: { tasks: {}, cancelled: [], fired: [], overdue: [], applied: [] },
  events: [],
  task_error_code: "E_DUPLICATE_TASK", none_error_code: "E_NO_TASK",
  event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("isDue returns a flag", () => {
  assert.strictEqual(typeof isDue([1, 5], 9), "boolean");
});

check("pickDue returns a list", () => {
  assert.ok(Array.isArray(pickDue({}, 0)));
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
