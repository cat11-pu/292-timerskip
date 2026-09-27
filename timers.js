// timers.js：到期判定与挑账
// 任务支持 [名字, 到期时刻] 数组形式，也支持 { name, due } 对象形式。
export function isDue(task, now) {
  if (!task) return false;
  const due = Array.isArray(task) ? task[1] : task.due;
  if (typeof due !== "number" || typeof now !== "number") return false;
  return due <= now;
}

// tasks 为 { 名字: 到期时刻 } 的在册表，挑出已到期任务的名字并按名字升序返回。
export function pickDue(tasks, now) {
  const table = tasks || {};
  return Object.keys(table)
    .filter(function (name) { return isDue([name, table[name]], now); })
    .sort();
}
