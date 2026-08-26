export const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

export const getStatusClass = (status) => {
  const map = {
    Submitted: "bg-slate-100 text-slate-700 dark:bg-slate-500/20",
    Pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    "Pending Manager": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    "Pending HR": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    "Manager Approved": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    Approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    Reimbursed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    "Partially Paid": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  };
  return map[status] || "bg-slate-100 text-slate-700 dark:bg-slate-500/20";
};

export const getStatusBadgeVariant = (status) => {
  const map = {
    Submitted: "secondary",
    Pending: "pending",
    "Pending Manager": "pending",
    "Pending HR": "default",
    "Manager Approved": "default",
    Approved: "success",
    Rejected: "destructive",
    Reimbursed: "success",
    "Partially Paid": "default",
  };
  return map[status] || "secondary";
};

export const PANEL_CLASS =
  "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60";
