// app.js：渲染结果
import { isDue, pickDue } from "./timers.js";
import { step, close } from "./timerrun.js";

export function render(spec) {
  const events = spec.events || [];
  const half = Math.ceil(events.length / 2);
  const first = step(spec);
  const closed = close(Object.assign({}, spec, { state: first.state }));
  const r1 = step(Object.assign({}, spec, { events: events.slice(0, half) }));
  const r2 = step(Object.assign({}, spec, { state: r1.state, events: events.slice(half) }));
  const closedTwo = close(Object.assign({}, spec, { state: r2.state }));
  const replay = step(Object.assign({}, spec, { state: closed.state }));
  const wide = step(Object.assign({}, spec, { budget: spec.budget + 2 }));
  const full = step(Object.assign({}, spec, { events: events, budget: events.length + 2 }));
  const fullClosed = close(Object.assign({}, spec, { state: full.state }));
  const fingerprint = function (state) {
    return JSON.stringify({
      tasks: state.tasks, cancelled: state.cancelled.slice().sort(), fired: state.fired,
      overdue: state.overdue, applied: state.applied.length
    });
  };
  const names = Object.keys(closed.state.tasks).sort();
  return { pending: names.map(function (name) { return [name, closed.state.tasks[name]]; }),
           overdue: closed.state.overdue.slice(), fired: closed.state.fired.slice(),
           cancelled: closed.state.cancelled.slice(), fired_first: first.fired,
           fired_wide: wide.fired, pair_differs: first.fired !== wide.fired,
           overdue_before: first.overdue_before, overdue_after: closed.state.overdue.length,
           catchup: closed.catchup,
           mid_differs: fingerprint(r2.state) !== fingerprint(first.state),
           closed_equal: fingerprint(closedTwo.state) === fingerprint(closed.state),
           replay_new: replay.fired, judged: first.judged, judged_bound: first.judged_bound,
           full_diff: fingerprint(closed.state) === fingerprint(fullClosed.state) ? 0 : 1,
           count: events.length,
           tail: (isDue([1, 5], 9) ? 1 : 0) + pickDue({}, 0).length };
}
