// timers.js：到期判定与挑账（基线：一律说没到期、给空表）
export function isDue(task, now) {
  return false;
}

export function pickDue(tasks, now) {
  return [];
}
