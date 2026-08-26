// Expense approval lifecycle. Employee-submitted claims run through the
// Manager → HR chain; HR-created entries are auto-approved. Real expense
// records now live behind expenseSlice/the backend — these two constants
// are still consumed by the filter/detail/add pages and Requests/MyApprovals.
export const EXPENSE_STATUS = {
  PENDING_MANAGER: "Pending Manager",
  PENDING_HR: "Pending HR",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const EXPENSE_TYPE_IDS = [
  "travel_transportation",
  "office_supplies",
  "meals_refreshments",
  "equipment_machinery",
  "miscellaneous_operational",
  "client_entertainment",
  "travel_lodging",
  "mobile_internet_allowance",
  "marketing_promotion",
  "gifts_incentives",
  "training_certification",
  "hardware_purchase",
  "software_licenses",
  "cloud_hosting",
  "bank_charges",
  "accounting_software",
  "travel_audit_finance",
  "communication_costs",
  "travel_client_visits",
  "training_workshops",
];
