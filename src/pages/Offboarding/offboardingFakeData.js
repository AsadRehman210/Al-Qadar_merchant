export const EXIT_TYPES = [
  { id: "Resignation", title: "Resignation" },
  { id: "Retirement", title: "Retirement" },
  { id: "Termination", title: "Termination" },
  { id: "Absconding", title: "Absconding" },
  { id: "Contract End", title: "Contract End" },
];

export const EXIT_STATUS = {
  NOTICE_PERIOD: "Notice Period",
  CLEARANCE: "Clearance",
  SETTLEMENT: "Settlement",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const EXIT_STATUS_BADGE = {
  "Notice Period": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Clearance: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Settlement: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

export const EXIT_INTERVIEW_REASONS = [
  "Better Opportunity",
  "Compensation",
  "Career Growth",
  "Work-Life Balance",
  "Management / Culture",
  "Relocation",
  "Retirement",
  "Contract End",
  "Other",
];

export const CLEARANCE_SECTIONS = ["assets", "finance", "it", "manager"];

export const CLEARANCE_LABELS = {
  assets: "Assets",
  finance: "Finance",
  it: "IT",
  manager: "Manager",
};
