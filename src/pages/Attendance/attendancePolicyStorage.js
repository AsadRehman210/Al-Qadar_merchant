export const WEEKLY_DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// Used by the (merchant-only) Shifts module — admin's equivalent Shift
// concept was removed earlier this session in favor of per-employee
// weekly_schedule, but merchant's Shifts page still exists and depends on
// this. Handles overnight shifts (end time earlier than start time).
export const calcShiftWorkingHours = (start, end, breakMinutes = 0) => {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  let minutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (minutes <= 0) minutes += 24 * 60;
  minutes -= Number(breakMinutes) || 0;
  return Math.round((minutes / 60) * 10) / 10;
};

// Not user-configurable anymore (the Weekly Off Days section was removed from
// the policy form) — kept as a fixed default so the employee attendance
// calendar (attendanceResolver.js) still knows which days are recurring
// company off-days.
const DEFAULT_WEEKLY_OFF_DAYS = ["fri", "sat"];

const todayStr = () => new Date().toISOString().slice(0, 10);

// ─────────────────────────────────────────────
// Only one Attendance Policy is ever active at a time. Creating a new one
// automatically closes (sets an end date on) whichever policy was active —
// closed policies remain visible as read-only history, they are never
// deleted.
// ─────────────────────────────────────────────
let _policies = [
  {
    id: "policy-legacy",
    name: "Legacy Policy 2023",
    implementedDate: "2023-01-01",
    endDate: "2023-12-31",
    salaryCalculationDays: 30,
    rules: {
      alwaysPresent: false,
      lateGraceMinutes: 15,
      earlyGraceMinutes: 15,
      deductionPerMinute: 0,
      managerApprovalEnabled: false,
      managerLateFullDay: false,
      managerEarlyFullDay: false,
    },
    weeklyOffDays: DEFAULT_WEEKLY_OFF_DAYS,
    notes: "",
    createdAt: "2023-01-01",
    updatedAt: "2023-01-01",
  },
  {
    id: "policy-standard",
    name: "Standard Office Policy",
    implementedDate: "2024-01-01",
    endDate: null,
    salaryCalculationDays: 30,
    rules: {
      alwaysPresent: false,
      lateGraceMinutes: 10,
      earlyGraceMinutes: 10,
      deductionPerMinute: 0,
      managerApprovalEnabled: true,
      managerLateFullDay: true,
      managerEarlyFullDay: true,
    },
    weeklyOffDays: DEFAULT_WEEKLY_OFF_DAYS,
    notes: "",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
];

export const getAllPolicies = () => [..._policies];

export const getCurrentPolicy = () =>
  _policies.find((p) => !p.endDate) || _policies[_policies.length - 1] || null;

export const getPreviousPolicies = () =>
  _policies
    .filter((p) => !!p.endDate)
    .sort((a, b) => (a.implementedDate < b.implementedDate ? 1 : -1));

export const getPolicyById = (id) => _policies.find((p) => p.id === id) || null;

/**
 * Creates a new policy and closes out whichever one was active — the
 * outgoing policy's endDate is stamped with the new policy's implemented
 * date, so the history table reads as a clean, non-overlapping timeline.
 */
export const createPolicy = (data) => {
  const current = getCurrentPolicy();
  if (current && !current.endDate) {
    _policies = _policies.map((p) =>
      p.id === current.id
        ? { ...p, endDate: data.implementedDate || todayStr(), updatedAt: todayStr() }
        : p,
    );
  }
  const policy = {
    id: `policy-${Date.now()}`,
    endDate: null,
    weeklyOffDays: DEFAULT_WEEKLY_OFF_DAYS,
    createdAt: todayStr(),
    updatedAt: todayStr(),
    ...data,
  };
  _policies = [..._policies, policy];
  return policy;
};

/** In-place edit of an existing policy (current or historical) — does not affect versioning/history. */
export const updatePolicy = (id, data) => {
  _policies = _policies.map((p) =>
    p.id === id ? { ...p, ...data, updatedAt: todayStr() } : p,
  );
  return getPolicyById(id);
};

/**
 * Resolves the effective policy for an employee. There is only ever one
 * active policy company-wide today — callers (attendanceResolver.js,
 * payrollBatchFakeData.js) can keep passing an employee without changes,
 * JS simply ignores the unused argument.
 */
export const getPolicyForEmployee = () => getCurrentPolicy();
