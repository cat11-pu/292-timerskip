// timerrun.js：按触发预算推进并留账，收尾时不限预算补齐
import { pickDue } from "./timers.js";

const DEFAULT_TASK_ERROR = "E_DUPLICATE_TASK";
const DEFAULT_NONE_ERROR = "E_NO_TASK";
const DEFAULT_EVENT_ERROR = "E_BAD_EVENT";

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function cloneState(state) {
  const source = state || {};
  return {
    tasks: Object.assign({}, source.tasks || {}),
    cancelled: (source.cancelled || []).slice(),
    fired: (source.fired || []).slice(),
    overdue: (source.overdue || []).slice(),
    applied: (source.applied || []).slice()
  };
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

// 校验事件形状；不合法抛 E_BAD_EVENT。
function validate(event, eventCode) {
  if (!event || typeof event !== "object") fail(eventCode);
  if (event.kind === "schedule") {
    if (typeof event.name !== "string" || event.name === "" || !isFiniteNumber(event.due)) {
      fail(eventCode);
    }
  } else if (event.kind === "cancel") {
    if (typeof event.name !== "string" || event.name === "") fail(eventCode);
  } else if (event.kind === "advance") {
    if (!isFiniteNumber(event.now)) fail(eventCode);
  } else {
    fail(eventCode);
  }
}

function normalizeBudget(budget) {
  if (!isFiniteNumber(budget)) return 0;
  return Math.max(0, Math.floor(budget));
}

// 按预算处理一批事件；返回推进后的跨轮状态与本轮计数。
export function step(spec) {
  spec = spec || {};
  const taskCode = spec.task_error_code || DEFAULT_TASK_ERROR;
  const noneCode = spec.none_error_code || DEFAULT_NONE_ERROR;
  const eventCode = spec.event_error_code || DEFAULT_EVENT_ERROR;

  const state = cloneState(spec.state);
  const events = Array.isArray(spec.events) ? spec.events : [];
  let remaining = normalizeBudget(spec.budget);
  let judged = 0;
  let firedCount = 0;

  for (const event of events) {
    // 重放：已处理过的事件整段跳过，不重复触发。
    if (event && Object.prototype.hasOwnProperty.call(event, "id")
        && state.applied.indexOf(event.id) !== -1) {
      continue;
    }
    validate(event, eventCode);
    state.applied.push(event.id);
    judged += 1;

    if (event.kind === "schedule") {
      if (Object.prototype.hasOwnProperty.call(state.tasks, event.name)) fail(taskCode);
      state.tasks[event.name] = event.due;
    } else if (event.kind === "cancel") {
      // 只打取消标记（记入已取消序列并移出在册表），不花预算、不触发。
      if (!Object.prototype.hasOwnProperty.call(state.tasks, event.name)) fail(noneCode);
      delete state.tasks[event.name];
      state.cancelled.push(event.name);
    } else {
      // 到期任务按名字升序挑进到期账，并移出在册表。
      const dueNames = pickDue(state.tasks, event.now);
      for (const name of dueNames) {
        delete state.tasks[name];
        state.overdue.push(name);
      }
      // 账上任务按入帐顺序逐个触发，每个花一次预算；用尽后剩下的压在账上。
      while (remaining > 0 && state.overdue.length > 0) {
        const name = state.overdue.shift();
        state.fired.push(name);
        firedCount += 1;
        remaining -= 1;
      }
    }
  }

  return {
    state: state,
    fired: firedCount,
    overdue_before: state.overdue.length,
    overdue: state.overdue.slice(),
    judged: judged,
    judged_bound: events.length
  };
}

// 收尾：不限预算，把到期账上剩余任务按入帐顺序全部触发。
export function close(spec) {
  spec = spec || {};
  const state = cloneState(spec.state);
  let catchup = 0;
  while (state.overdue.length > 0) {
    const name = state.overdue.shift();
    state.fired.push(name);
    catchup += 1;
  }
  return { state: state, catchup: catchup };
}
