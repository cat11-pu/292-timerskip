// timerrun.js：按触发预算触发并留账（基线：一律给空表）
import { isDue, pickDue } from "./timers.js";

export function step(spec) {
  return { state: spec.state, fired: 0, overdue_before: 0, overdue: [], judged: 0, judged_bound: 0 };
}

export function close(spec) {
  return { state: spec.state, catchup: 0 };
}
