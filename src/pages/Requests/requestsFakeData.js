export { APPROVAL_STATUS, APPLIED_VIA } from "global/approvalEngine";

// ─────────────────────────────────────────────
// Request type catalogue
// Each employee-initiated HR flow is modelled as a "request type" that runs
// through the same Employee → Manager → HR approval engine.
// ─────────────────────────────────────────────
export const REQUEST_TYPES = [
  {
    id: "regularization",
    name: "Attendance Regularization",
    icon: "clock",
    color: "from-sky-500 to-sky-600",
    desc: "Fix a missed punch or wrong attendance entry.",
    fields: ["date", "checkIn", "checkOut", "reason"],
  },
  {
    id: "overtime",
    name: "Overtime Request",
    icon: "timer",
    color: "from-indigo-500 to-indigo-600",
    desc: "Claim approved extra working hours.",
    fields: ["date", "hours", "reason"],
  },
  {
    id: "document",
    name: "Document / Letter Request",
    icon: "file",
    color: "from-teal-500 to-teal-600",
    desc: "Salary certificate, experience letter, NOC, etc.",
    fields: ["docType", "purpose"],
  },
  {
    id: "resignation",
    name: "Resignation",
    icon: "logout",
    color: "from-rose-500 to-rose-600",
    desc: "Submit resignation and start the exit workflow.",
    fields: ["lastWorkingDate", "noticePeriodDays", "reason"],
  },
  {
    id: "probation",
    name: "Probation Confirmation",
    icon: "badge",
    color: "from-amber-500 to-amber-600",
    desc: "Confirm or extend an employee after probation.",
    fields: ["outcome", "effectiveDate", "reason"],
  },
  {
    id: "promotion",
    name: "Promotion / Transfer",
    icon: "trending",
    color: "from-violet-500 to-violet-600",
    desc: "Recommend a promotion, increment or transfer.",
    fields: ["changeType", "proposedDesignation", "proposedDepartment", "effectiveDate", "reason"],
  },
  {
    id: "short_leave",
    name: "Short Leave / Gate Pass",
    icon: "door",
    color: "from-cyan-500 to-cyan-600",
    desc: "Early-out, late-arrival or gate pass for part of a day.",
    fields: ["shortLeaveType", "date", "fromTime", "toTime", "reason"],
  },
  {
    id: "shift_change",
    name: "Shift Change / Swap",
    icon: "repeat",
    color: "from-fuchsia-500 to-fuchsia-600",
    desc: "Change your shift or swap with a colleague.",
    fields: ["currentShift", "requestedShift", "effectiveDate", "reason"],
  },
  {
    id: "travel",
    name: "Business Travel + Advance",
    icon: "plane",
    color: "from-orange-500 to-orange-600",
    desc: "Request a business trip and a travel advance.",
    fields: ["destination", "travelFrom", "travelTo", "advanceAmount", "purpose", "reason"],
  },
  {
    id: "asset_request",
    name: "Asset Request",
    icon: "laptop",
    color: "from-emerald-500 to-emerald-600",
    desc: "Request a laptop, phone, access card and more.",
    fields: ["assetType", "quantity", "reason"],
  },
  {
    id: "profile_update",
    name: "Profile Update",
    icon: "usercog",
    color: "from-blue-500 to-blue-600",
    desc: "Request a change to your personal HR record.",
    fields: ["profileField", "newValue", "reason"],
  },
  {
    id: "training",
    name: "Training / Nomination",
    icon: "graduation",
    color: "from-teal-500 to-teal-600",
    desc: "Nominate yourself / a team member for training.",
    fields: ["courseName", "provider", "cost", "reason"],
  },
  {
    id: "grievance",
    name: "Grievance / Complaint",
    icon: "alert",
    color: "from-rose-500 to-rose-600",
    desc: "Raise a workplace concern or complaint.",
    fields: ["grievanceCategory", "reason"],
  },
  {
    id: "disciplinary",
    name: "Disciplinary / Warning",
    icon: "shield",
    color: "from-red-500 to-red-600",
    desc: "Issue a warning or disciplinary action (HR/Manager).",
    fields: ["disciplinaryType", "effectiveDate", "reason"],
  },
  {
    id: "helpdesk",
    name: "HR Helpdesk Ticket",
    icon: "lifebuoy",
    color: "from-indigo-500 to-indigo-600",
    desc: "Raise an IT / facilities / payroll support ticket.",
    fields: ["helpdeskCategory", "priority", "reason"],
  },
];

export const requestTypeById = (id) => REQUEST_TYPES.find((t) => t.id === id) || null;

export const DOCUMENT_TYPES = [
  "Salary Certificate",
  "Experience Letter",
  "No Objection Certificate (NOC)",
  "Employment Verification",
  "Bank Account Letter",
];

export const PROBATION_OUTCOMES = ["Confirm", "Extend", "Terminate"];
export const PROMOTION_CHANGE_TYPES = ["Promotion", "Increment", "Transfer"];
export const SHORT_LEAVE_TYPES = ["Early Out", "Late Arrival", "Gate Pass"];
export const SHIFT_TYPES = ["Day", "Night", "Morning", "Evening", "Rotational"];
export const ASSET_TYPES = ["Laptop", "Desktop", "Monitor", "Phone", "SIM Card", "Access Card", "Furniture", "Other"];
export const PROFILE_FIELDS = ["Phone Number", "Address", "Bank Account", "Emergency Contact", "Marital Status", "Email"];
export const GRIEVANCE_CATEGORIES = ["Workplace", "Harassment", "Payroll", "Management", "Facilities", "Other"];
export const DISCIPLINARY_TYPES = ["Verbal Warning", "Written Warning", "Final Warning", "Suspension"];
export const HELPDESK_CATEGORIES = ["IT Support", "Facilities", "Payroll", "Access / Security", "Other"];
export const HELPDESK_PRIORITIES = ["Low", "Medium", "High", "Urgent"];

// Field renderer config — each form field key maps to a type (and options for
// selects). The ApplyRequest form renders type.fields generically from here.
export const FIELD_DEFS = {
  date: { labelKey: "requests:field_date", type: "date" },
  checkIn: { labelKey: "requests:field_check_in", type: "time" },
  checkOut: { labelKey: "requests:field_check_out", type: "time" },
  hours: { labelKey: "requests:field_hours", type: "number" },
  docType: { labelKey: "requests:field_doc_type", type: "select", options: DOCUMENT_TYPES },
  purpose: { labelKey: "requests:field_purpose", type: "text" },
  lastWorkingDate: { labelKey: "requests:field_last_working_date", type: "date" },
  noticePeriodDays: { labelKey: "requests:field_notice_period", type: "number" },
  outcome: { labelKey: "requests:field_outcome", type: "select", options: PROBATION_OUTCOMES },
  effectiveDate: { labelKey: "requests:field_effective_date", type: "date" },
  changeType: { labelKey: "requests:field_change_type", type: "select", options: PROMOTION_CHANGE_TYPES },
  proposedDesignation: { labelKey: "requests:field_proposed_designation", type: "text" },
  proposedDepartment: { labelKey: "requests:field_proposed_department", type: "text" },
  shortLeaveType: { labelKey: "requests:field_short_leave_type", type: "select", options: SHORT_LEAVE_TYPES },
  fromTime: { labelKey: "requests:field_from_time", type: "time" },
  toTime: { labelKey: "requests:field_to_time", type: "time" },
  currentShift: { labelKey: "requests:field_current_shift", type: "select", options: SHIFT_TYPES },
  requestedShift: { labelKey: "requests:field_requested_shift", type: "select", options: SHIFT_TYPES },
  destination: { labelKey: "requests:field_destination", type: "text" },
  travelFrom: { labelKey: "requests:field_travel_from", type: "date" },
  travelTo: { labelKey: "requests:field_travel_to", type: "date" },
  advanceAmount: { labelKey: "requests:field_advance_amount", type: "number" },
  assetType: { labelKey: "requests:field_asset_type", type: "select", options: ASSET_TYPES },
  quantity: { labelKey: "requests:field_quantity", type: "number" },
  profileField: { labelKey: "requests:field_profile_field", type: "select", options: PROFILE_FIELDS },
  newValue: { labelKey: "requests:field_new_value", type: "text" },
  courseName: { labelKey: "requests:field_course_name", type: "text" },
  provider: { labelKey: "requests:field_provider", type: "text" },
  cost: { labelKey: "requests:field_cost", type: "number" },
  grievanceCategory: { labelKey: "requests:field_grievance_category", type: "select", options: GRIEVANCE_CATEGORIES },
  disciplinaryType: { labelKey: "requests:field_disciplinary_type", type: "select", options: DISCIPLINARY_TYPES },
  helpdeskCategory: { labelKey: "requests:field_helpdesk_category", type: "select", options: HELPDESK_CATEGORIES },
  priority: { labelKey: "requests:field_priority", type: "select", options: HELPDESK_PRIORITIES },
  reason: { labelKey: "requests:reason", type: "textarea" },
};

// ─────────────────────────────────────────────
// Build a human readable summary per request type
// ─────────────────────────────────────────────
export const buildSummary = (type, d = {}) => {
  switch (type) {
    case "regularization":
      return `${d.date || "—"} · ${d.checkIn || "--:--"} → ${d.checkOut || "--:--"}`;
    case "overtime":
      return `${d.date || "—"} · ${d.hours || 0} hrs`;
    case "document":
      return d.docType || "Document";
    case "resignation":
      return `Last day: ${d.lastWorkingDate || "—"} · Notice ${d.noticePeriodDays || 0}d`;
    case "probation":
      return `${d.outcome || "—"} · w.e.f ${d.effectiveDate || "—"}`;
    case "promotion":
      return `${d.changeType || "Change"} → ${d.proposedDesignation || d.proposedDepartment || "—"}`;
    case "short_leave":
      return `${d.shortLeaveType || "Short Leave"} · ${d.date || "—"} ${d.fromTime || ""}${d.toTime ? `–${d.toTime}` : ""}`;
    case "shift_change":
      return `${d.currentShift || "—"} → ${d.requestedShift || "—"}`;
    case "travel":
      return `${d.destination || "—"} · ${d.travelFrom || "?"}→${d.travelTo || "?"}${d.advanceAmount ? ` · Adv ${d.advanceAmount}` : ""}`;
    case "asset_request":
      return `${d.assetType || "Asset"}${d.quantity ? ` × ${d.quantity}` : ""}`;
    case "profile_update":
      return `${d.profileField || "Field"} → ${d.newValue || "—"}`;
    case "training":
      return `${d.courseName || "Course"}${d.provider ? ` · ${d.provider}` : ""}`;
    case "grievance":
      return `${d.grievanceCategory || "Grievance"}`;
    case "disciplinary":
      return `${d.disciplinaryType || "Warning"}`;
    case "helpdesk":
      return `${d.helpdeskCategory || "Ticket"} · ${d.priority || "—"}`;
    default:
      return "";
  }
};

