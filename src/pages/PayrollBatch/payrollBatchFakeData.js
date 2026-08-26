// ─────────────────────────────────────────────
// Status constants — Payroll Runs and Special Payments both run through the
// backend now (payroll-run-service.ts / payroll-run-controller.ts), but
// these lifecycle-status enums and their badge color maps are still owned
// here since real pages and Requests/MyApprovals all import them.
// ─────────────────────────────────────────────
export const RUN_STATUS = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  PROCESSING: "Processing",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const RUN_STATUS_BADGE = {
  Draft: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
  "Pending Approval": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Approved: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Processing: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

export const SP_STATUS = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const SP_STATUS_BADGE = {
  Draft: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
  "Pending Approval": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Approved: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};
