// Leave approval lifecycle. Real leave requests and leave types now live
// behind leaveSlice/leaveTypeSlice/the backend — this constant is still
// consumed by LeaveFilter for its status filter.
export const LEAVE_STATUS = {
  DRAFT: "Draft",
  PENDING_MANAGER: "Pending Manager",
  PENDING_HR: "Pending HR",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};
