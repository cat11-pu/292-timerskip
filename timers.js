// timers.js：到期判定与挑账
export function isDue(task, now) {
  if (!Array.isArray(task) || task.length < 2) return false;
  if (!Number.isFinite(Number(task[1])) || !Number.isFinite(Number(now))) return false;
  return Number(task[1]) <= Number(now);
}

export function pickDue(tasks, now) {
  const registry = tasks || {};
  return Object.keys(registry)
    .filter((name) => isDue([name, registry[name]], now))
    .sort();
}
