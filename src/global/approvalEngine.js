/**
 * Reusable approval engine for HR flows.
 *
 * Business rule (shared across modules):
 *  - If HR creates a record directly  -> no approval needed (auto-approved).
 *  - If an employee submits a request -> goes to the employee's line manager,
 *    once the manager approves it moves to HR, and HR's approval finalizes it.
 *
 * Statuses follow the chain: Draft -> Pending Manager -> Pending HR -> Approved
 * (with Rejected / Cancelled as terminal side states).
 *
 * The helpers below are pure: they take a record and return a NEW record with the
 * approval fields updated, so they work with the mutable fake-data stores used in
 * this prototype as well as with redux/state if needed later.
 */
import dayjs from "dayjs";

export const APPROVAL_STATUS = {
  DRAFT: "Draft",
  PENDING_MANAGER: "Pending Manager",
  PENDING_HR: "Pending HR",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const APPLIED_VIA = {
  EMPLOYEE: "employee",
  HR: "hr",
};

export const APPROVAL_STATUS_BADGE = {
  Draft: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
  "Pending Manager": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "Pending HR": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  Cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400",
};

const today = () => dayjs().format("YYYY-MM-DD");

/**
 * Returns the initial approval block for a new record.
 * appliedVia === "hr"  -> auto approved, no chain.
 * appliedVia === "employee" -> Pending Manager.
 */
export function initApproval({ appliedVia = APPLIED_VIA.EMPLOYEE, actorName = "", managerName = "Line Manager" } = {}) {
  if (appliedVia === APPLIED_VIA.HR) {
    return {
      appliedVia,
      status: APPROVAL_STATUS.APPROVED,
      managerApproval: {
        status: "Skipped",
        approvedBy: "",
        approvedOn: "",
        comments: "Created directly by HR — manager approval not required.",
      },
      hrApproval: {
        status: "Approved",
        approvedBy: actorName || "HR",
        approvedOn: today(),
        comments: "Auto-approved (HR entry).",
      },
      history: [
        {
          stage: "HR",
          status: "Approved",
          by: actorName || "HR",
          on: today(),
          comments: "Created directly by HR — approval not required.",
        },
      ],
    };
  }

  return {
    appliedVia,
    status: APPROVAL_STATUS.PENDING_MANAGER,
    managerApproval: { status: "Pending", approvedBy: "", approvedOn: "", comments: "" },
    hrApproval: { status: "Pending", approvedBy: "", approvedOn: "", comments: "" },
    history: [
      {
        stage: "Submitted",
        status: "Submitted",
        by: actorName || "Employee",
        on: today(),
        comments: `Submitted${managerName ? ` — routed to ${managerName}` : ""}.`,
      },
    ],
  };
}

const pushHistory = (record, entry) => [...(record.history || []), entry];

export function managerApproveRecord(record, { by = "Line Manager", comments = "" } = {}) {
  return {
    ...record,
    status: APPROVAL_STATUS.PENDING_HR,
    managerApproval: { status: "Approved", approvedBy: by, approvedOn: today(), comments },
    history: pushHistory(record, { stage: "Manager", status: "Approved", by, on: today(), comments }),
  };
}

export function managerRejectRecord(record, { by = "Line Manager", comments = "" } = {}) {
  return {
    ...record,
    status: APPROVAL_STATUS.REJECTED,
    managerApproval: { status: "Rejected", approvedBy: by, approvedOn: today(), comments },
    history: pushHistory(record, { stage: "Manager", status: "Rejected", by, on: today(), comments }),
  };
}

export function hrApproveRecord(record, { by = "HR Manager", comments = "" } = {}) {
  return {
    ...record,
    status: APPROVAL_STATUS.APPROVED,
    hrApproval: { status: "Approved", approvedBy: by, approvedOn: today(), comments },
    history: pushHistory(record, { stage: "HR", status: "Approved", by, on: today(), comments }),
  };
}

export function hrRejectRecord(record, { by = "HR Manager", comments = "" } = {}) {
  return {
    ...record,
    status: APPROVAL_STATUS.REJECTED,
    hrApproval: { status: "Rejected", approvedBy: by, approvedOn: today(), comments },
    history: pushHistory(record, { stage: "HR", status: "Rejected", by, on: today(), comments }),
  };
}

export function cancelRecord(record, { by = "Employee" } = {}) {
  return {
    ...record,
    status: APPROVAL_STATUS.CANCELLED,
    history: pushHistory(record, { stage: "Cancelled", status: "Cancelled", by, on: today(), comments: "Cancelled by requester." }),
  };
}

export const isPendingManager = (r) => r?.status === APPROVAL_STATUS.PENDING_MANAGER;
export const isPendingHR = (r) => r?.status === APPROVAL_STATUS.PENDING_HR;
export const isApproved = (r) => r?.status === APPROVAL_STATUS.APPROVED;
export const isRejected = (r) => r?.status === APPROVAL_STATUS.REJECTED;
export const isPending = (r) => isPendingManager(r) || isPendingHR(r);

/** Four-step visual chain used by detail pages. */
export const APPROVAL_STEPS = ["Submitted", "Pending Manager", "Pending HR", "Approved"];

/** Index of the current step in APPROVAL_STEPS (for progress UIs). */
export function stepIndex(status) {
  switch (status) {
    case APPROVAL_STATUS.PENDING_MANAGER:
      return 1;
    case APPROVAL_STATUS.PENDING_HR:
      return 2;
    case APPROVAL_STATUS.APPROVED:
      return 3;
    default:
      return 0;
  }
}
