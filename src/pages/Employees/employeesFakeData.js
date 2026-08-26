// Real employee records now live behind employeeSlice/the backend. What's
// left here is genuinely still needed:
//  - EMPLOYEE_STATUS_OPTIONS / EMPLOYEE_STATUS_BADGE / weekly-schedule
//    helpers are real, portal-wide constants (Employees, Attendance, Loans,
//    Expenses, Payroll, Leave Management, Assets, Requests all filter
//    employees down to these lifecycle states).
//  - FAKE_EMPLOYEES / getActiveEmployeeOptions are still the live data
//    source for the Performance module, which has no backend of its own yet
//    (see Performance/performanceFakeData.js).
// ─────────────────────────────────────────────
export const EMPLOYEE_STATUS_OPTIONS = [
  { id: "probation", title: "Probation" },
  { id: "active", title: "Active" },
  { id: "resigned", title: "Resigned" },
  { id: "retired", title: "Retired" },
  { id: "terminated", title: "Terminated" },
  { id: "absconding", title: "Absconding" },
];

// Per-employee weekly schedule — each employee can have their own hours per
// day, and their own days off. Sun–Thu working / Fri–Sat off matches the
// region's standard work week and the Attendance Policy's own default
// weeklyOffDays.
export const WEEK_DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export const DEFAULT_WEEKLY_SCHEDULE = WEEK_DAY_KEYS.map((day) => ({
  day,
  isWorking: day !== "fri" && day !== "sat",
  start: "09:00",
  end: "18:00",
}));

export const isWeeklyScheduleValid = (schedule) =>
  Array.isArray(schedule) &&
  schedule.some((d) => d.isWorking) &&
  schedule.every((d) => !d.isWorking || (d.start && d.end && d.start < d.end));

export const EMPLOYEE_STATUS_BADGE = {
  probation: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  resigned: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70",
  retired: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  terminated: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  absconding: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

// ─────────────────────────────────────────────
// Performance module's data source (still fake — no backend yet).
// ─────────────────────────────────────────────
export const FAKE_EMPLOYEES = [
  {
    _id: "emp001",
    employee_id: "EMP-2024-001",
    name: "Ahmed Hassan",
    email: "ahmed.hassan@company.com",
    department: "Engineering",
    role: "Senior Developer",
    status: "active",
    image: null,
    createdAt: "2024-01-15",
  },
  {
    _id: "emp002",
    employee_id: "EMP-2024-002",
    name: "Sara Mohammed",
    email: "sara.mohammed@company.com",
    department: "Human Resources",
    role: "HR Manager",
    status: "active",
    image: null,
    createdAt: "2024-02-20",
  },
  {
    _id: "emp003",
    employee_id: "EMP-2024-003",
    name: "Omar Khalid",
    email: "omar.khalid@company.com",
    department: "Finance & Accounting",
    role: "Accountant",
    status: "resigned",
    image: null,
    createdAt: "2024-03-10",
  },
  {
    _id: "emp004",
    employee_id: "EMP-2024-004",
    name: "Fatima Ali",
    email: "fatima.ali@company.com",
    department: "Marketing",
    role: "Marketing Lead",
    status: "active",
    image: null,
    createdAt: "2024-04-05",
  },
  {
    _id: "emp005",
    employee_id: "EMP-2024-005",
    name: "Youssef Ibrahim",
    email: "youssef.ibrahim@company.com",
    department: "Engineering",
    role: "DevOps Engineer",
    status: "active",
    image: null,
    createdAt: "2024-05-12",
  },
  {
    _id: "emp006",
    employee_id: "EMP-2024-006",
    name: "Layla Hassan",
    email: "layla.hassan@company.com",
    department: "Human Resources",
    role: "Recruitment Specialist",
    status: "active",
    image: null,
    createdAt: "2024-06-01",
  },
  {
    _id: "emp007",
    employee_id: "EMP-2024-007",
    name: "Khalid Mansour",
    email: "khalid.mansour@company.com",
    department: "Finance & Accounting",
    role: "Financial Analyst",
    status: "terminated",
    image: null,
    createdAt: "2024-06-15",
  },
  {
    _id: "emp008",
    employee_id: "EMP-2024-008",
    name: "Noor Abdullah",
    email: "noor.abdullah@company.com",
    department: "Marketing",
    role: "Content Writer",
    status: "active",
    image: null,
    createdAt: "2024-07-01",
  },
  {
    _id: "emp009",
    employee_id: "EMP-2024-009",
    name: "Rashid Al-Otaibi",
    email: "rashid.otaibi@company.com",
    department: "Engineering",
    role: "QA Engineer",
    status: "active",
    image: null,
    createdAt: "2024-07-20",
  },
  {
    _id: "emp010",
    employee_id: "EMP-2024-010",
    name: "Maha Al-Mutairi",
    email: "maha.mutairi@company.com",
    department: "Operations",
    role: "Operations Manager",
    status: "active",
    image: null,
    createdAt: "2024-08-08",
  },
];

// Reporting hierarchy (line managers) — maps an employee _id -> their
// line-manager's _id, purely for Performance's appraisal-cycle dropdown.
const EMPLOYEE_MANAGER_MAP = {
  emp010: null,
  emp002: "emp010",
  emp004: "emp010",
  emp001: "emp010",
  emp005: "emp001",
  emp009: "emp001",
  emp003: "emp010",
  emp007: "emp010",
  emp006: "emp002",
  emp008: "emp004",
};

FAKE_EMPLOYEES.forEach((emp) => {
  emp.reportsTo = EMPLOYEE_MANAGER_MAP[emp._id] ?? null;
  const mgr = FAKE_EMPLOYEES.find((m) => m._id === emp.reportsTo);
  emp.managerName = mgr ? mgr.name : "";
});

/** Dropdown-ready options for active employees (Performance's AddAppraisal). */
export const getActiveEmployeeOptions = () =>
  FAKE_EMPLOYEES.filter((e) => e.status === "active").map((e) => ({
    _id: e._id,
    id: e._id,
    title: `${e.name} (${e.employee_id})`,
    name: e.name,
    employee_id: e.employee_id,
    department: e.department,
    designation: e.role,
    reportsTo: e.reportsTo,
    managerName: e.managerName,
  }));
