import dayjs from "dayjs";
import { FAKE_EMPLOYEES } from "../Employees/employeesFakeData";

const employees = FAKE_EMPLOYEES.slice(0, 8);

// ── Appraisal Cycles ──────────────────────────────────────────────────────────
let _appraisals = employees.map((emp, i) => {
  const year  = 2025;
  const cycle = i % 2 === 0 ? "Q1" : "Annual";
  const statusOpts = ["Draft", "Submitted", "Under Review", "Finalized"];
  const status = statusOpts[i % 4];
  const overallRating = status === "Finalized" ? (3 + (i % 3)) : null;

  return {
    id: `apr-${i + 1}`,
    appraisalNo: `APR-${year}-${String(i + 1).padStart(3, "0")}`,
    employeeId:   emp._id || emp.id,
    employeeName: emp.name,
    department:   emp.department,
    designation:  emp.role || "Staff",
    reviewerId:   employees[(i + 1) % employees.length]._id || `rv-${i}`,
    reviewerName: employees[(i + 1) % employees.length].name,
    cycle,
    year,
    period:        cycle === "Annual" ? `Jan ${year} — Dec ${year}` : `Jan ${year} — Mar ${year}`,
    status,
    overallRating,
    submittedAt:   status !== "Draft" ? `${year}-02-${String((i * 3 + 5) % 28 + 1).padStart(2, "0")}` : null,
    reviewStartedAt: (status === "Under Review" || status === "Finalized") ? `${year}-02-${String((i * 3 + 12) % 28 + 1).padStart(2, "0")}` : null,
    finalizedAt:   status === "Finalized" ? `${year}-03-${String((i * 5 + 1) % 28 + 1).padStart(2, "0")}` : null,
    kpis: [
      { id: `kpi-${i}-1`, category: "Productivity",  goal: "Complete assigned tasks on time",  targetScore: 5, achievedScore: status !== "Draft" ? (3 + (i % 3)) : null, weight: 30, comments: "" },
      { id: `kpi-${i}-2`, category: "Quality",       goal: "Zero critical defects / errors",    targetScore: 5, achievedScore: status !== "Draft" ? (4 - (i % 2)) : null, weight: 25, comments: "" },
      { id: `kpi-${i}-3`, category: "Collaboration", goal: "Support team and cross-dept goals",  targetScore: 5, achievedScore: status !== "Draft" ? (3 + (i % 2)) : null, weight: 20, comments: "" },
      { id: `kpi-${i}-4`, category: "Initiative",    goal: "Propose process improvements",       targetScore: 5, achievedScore: status !== "Draft" ? (2 + (i % 4)) : null, weight: 15, comments: "" },
      { id: `kpi-${i}-5`, category: "Attendance",    goal: "Maintain 95%+ attendance",           targetScore: 5, achievedScore: status !== "Draft" ? 5 : null,              weight: 10, comments: "" },
    ],
    selfComment:     status !== "Draft" ? "I believe I have met most of my targets this cycle." : "",
    managerComment:  status === "Finalized" ? "Good performance with room to improve in initiative." : "",
    hrComment:       status === "Finalized" ? "Approved." : "",
    createdAt: `${year}-01-10T09:00:00.000Z`,
  };
});

export const getAppraisals    = ()   => [..._appraisals];
export const getAppraisalById = (id) => _appraisals.find((a) => a.id === id) || null;

export function createAppraisal(data) {
  const entry = { ...data, id: `apr-${Date.now()}`, appraisalNo: `APR-${dayjs().year()}-${String(_appraisals.length + 1).padStart(3, "0")}`, status: "Draft", kpis: data.kpis || [], createdAt: dayjs().toISOString() };
  _appraisals = [entry, ..._appraisals];
  return entry;
}

export function updateAppraisal(id, data) {
  _appraisals = _appraisals.map((a) => a.id === id ? { ...a, ...data } : a);
}

export function submitAppraisal(id) {
  _appraisals = _appraisals.map((a) => a.id === id ? { ...a, status: "Submitted", submittedAt: dayjs().format("YYYY-MM-DD") } : a);
}

/** Reviewer acknowledges they've started evaluating — Submitted -> Under Review. */
export function startReview(id) {
  _appraisals = _appraisals.map((a) => a.id === id ? { ...a, status: "Under Review", reviewStartedAt: dayjs().format("YYYY-MM-DD") } : a);
}

export function finalizeAppraisal(id, overallRating, hrComment) {
  _appraisals = _appraisals.map((a) => a.id === id ? { ...a, status: "Finalized", overallRating, hrComment, finalizedAt: dayjs().format("YYYY-MM-DD") } : a);
}
export {
  appraisalStatusOptions as APPRAISAL_STATUS_OPTS,
  appraisalCycleOptions as CYCLE_OPTS,
} from "global/constant";

