// Loan lifecycle statuses. Employee-initiated loans run through the
// Manager → HR chain; HR-created loans skip straight to Approved/Ongoing.
// Real loan records now live behind loanSlice/the backend — this constant
// is still consumed by Requests/MyApprovals for its status filter.
export const LOAN_STATUS = {
  PENDING_MANAGER: "Pending Manager",
  PENDING_HR: "Pending HR",
  PENDING: "Pending",
  APPROVED: "Approved",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};
