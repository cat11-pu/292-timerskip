// timerrun.js：按触发预算触发并留账
import { isDue, pickDue } from "./timers.js";

function fail(spec, key, fallback) {
  const code = (spec && spec[key]) || fallback;
  const error = new Error(code);
  error.code = code;
  return error;
}

function cloneState(source) {
  const s = source || {};
  return {
    tasks: Object.assign({}, s.tasks || {}),
    cancelled: Array.isArray(s.cancelled) ? s.cancelled.slice() : [],
    fired: Array.isArray(s.fired) ? s.fired.slice() : [],
    overdue: Array.isArray(s.overdue) ? s.overdue.slice() : [],
    applied: Array.isArray(s.applied) ? s.applied.slice() : []
  };
}

function validateEvent(event) {
  if (!event || typeof event !== "object" || typeof event.kind !== "string") return false;
  if (event.kind === "schedule") {
    return typeof event.name === "string"
      && event.name.length > 0
      && Number.isFinite(Number(event.due));
  }
  if (event.kind === "cancel") {
    return typeof event.name === "string" && event.name.length > 0;
  }
  if (event.kind === "advance") {
    return Number.isFinite(Number(event.now));
  }
  return false;
}

export function step(spec) {
  const state = cloneState(spec.state);
  const events = Array.isArray(spec.events) ? spec.events : [];
  const applied = new Set(state.applied);
  const budget = Number.isFinite(Number(spec.budget)) ? Math.max(0, Math.trunc(Number(spec.budget))) : 0;
  let remaining = budget;
  let firedCount = 0;
  let judged = 0;

  events.forEach((event) => {
    if (!validateEvent(event)) throw fail(spec, "event_error_code", "E_BAD_EVENT");
    if (event.id !== undefined && applied.has(event.id)) return;

    if (event.kind === "schedule") {
      if (Object.prototype.hasOwnProperty.call(state.tasks, event.name)) {
        throw fail(spec, "task_error_code", "E_DUPLICATE_TASK");
      }
      state.tasks[event.name] = Number(event.due);
    } else if (event.kind === "cancel") {
      if (!Object.prototype.hasOwnProperty.call(state.tasks, event.name)) {
        throw fail(spec, "none_error_code", "E_NO_TASK");
      }
      delete state.tasks[event.name];
      state.cancelled.push(event.name);
    } else if (event.kind === "advance") {
      pickDue(state.tasks, Number(event.now)).forEach((name) => {
        delete state.tasks[name];
        state.overdue.push(name);
      });
      while (remaining > 0 && state.overdue.length > 0) {
        const name = state.overdue.shift();
        state.fired.push(name);
        firedCount += 1;
        remaining -= 1;
      }
    }

    if (event.id !== undefined) applied.add(event.id);
    judged += 1;
  });

  state.applied = Array.from(applied);
  return {
    state,
    fired: firedCount,
    overdue_before: state.overdue.length,
    overdue: state.overdue.slice(),
    judged,
    judged_bound: events.length
  };
}

export function close(spec) {
  const state = cloneState(spec.state);
  let catchup = 0;
  while (state.overdue.length > 0) {
    const name = state.overdue.shift();
    state.fired.push(name);
    catchup += 1;
  }
  return { state, catchup };
}
