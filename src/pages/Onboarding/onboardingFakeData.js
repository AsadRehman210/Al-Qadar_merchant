export const ONBOARDING_STATUS = {
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const TASK_CATEGORIES = [
  { id: "documentation", label: "Documentation" },
  { id: "it_access", label: "IT & Access" },
  { id: "workplace", label: "Workplace Setup" },
  { id: "payroll", label: "Payroll & Compliance" },
  { id: "orientation", label: "Orientation" },
];

export const categoryLabel = (id) =>
  TASK_CATEGORIES.find((c) => c.id === id)?.label || id;

export const progressOf = (o) => {
  const tasks = o.tasks || [];
  const required = tasks.filter((t) => t.required);
  const optional = tasks.filter((t) => !t.required);
  const done = tasks.filter((t) => t.done).length;
  return {
    done,
    total: tasks.length,
    pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    requiredDone: required.filter((t) => t.done).length,
    requiredTotal: required.length,
    optionalDone: optional.filter((t) => t.done).length,
    optionalTotal: optional.length,
  };
};
