/* Shared badge + status helpers for Leave Management */
export const LEAVE_STATUS_BADGE = {
  "Pending Manager": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "Pending HR": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "Approved": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "Rejected": "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "Cancelled": "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
  "Draft": "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
};

export const stepStatus = (s) => ({
  done: s === "Approved",
  rejected: s === "Rejected",
  active: s === "Pending",
});
