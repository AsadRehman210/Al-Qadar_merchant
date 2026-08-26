import { FAKE_EMPLOYEES } from "../Employees/employeesFakeData";

// Picks a real Head of Department instead of a fictional name: prefer an
// active employee whose title reads as a leadership role, then any active
// employee in the department, then whoever's on record at all (so a
// currently-unstaffed-by-active-people department is still honest about it
// rather than hiding behind a made-up person).
const getHod = (deptName) => {
  const deptEmps = FAKE_EMPLOYEES.filter((e) => e.department === deptName);
  const leader = deptEmps.find((e) => e.status === "active" && /manager|lead|chief|head|director/i.test(e.role || ""));
  const activeFirst = deptEmps.find((e) => e.status === "active");
  return leader || activeFirst || deptEmps[0] || null;
};

const emailFor = (name) => (name ? `${name.trim().toLowerCase().replace(/\s+/g, ".")}@company.com` : "");

const DEPARTMENT_SEEDS = [
  {
    id: "1",
    departmentCode: "HR-001",
    name: "Human Resources",
    hodPhone: "+966501234567",
    description: "Recruitment, payroll coordination, policies, and employee relations.",
    location: "Building A — Floor 2",
    status: "Active",
    establishedDate: "2018-03-01",
  },
  {
    id: "2",
    departmentCode: "FIN-002",
    name: "Finance & Accounting",
    hodPhone: "+966507654321",
    description: "Financial reporting, budgeting, invoicing, and compliance.",
    location: "Building A — Floor 3",
    status: "Active",
    establishedDate: "2017-06-15",
  },
  {
    id: "3",
    departmentCode: "OPS-003",
    name: "Operations",
    hodPhone: "+966509998877",
    description: "Day-to-day operations, logistics, and process improvement.",
    location: "Building B — Ground floor",
    status: "Active",
    establishedDate: "2019-01-10",
  },
  {
    id: "4",
    departmentCode: "IT-004",
    name: "Information Technology",
    hodPhone: "+966504443322",
    description: "Infrastructure, applications, security, and user support.",
    location: "Building A — Floor 4",
    status: "Inactive",
    establishedDate: "2016-11-20",
  },
  {
    id: "5",
    departmentCode: "ENG-005",
    name: "Engineering",
    hodPhone: "+966502221111",
    description: "Product development, platform engineering, and QA.",
    location: "Building B — Floor 1",
    status: "Active",
    establishedDate: "2018-01-15",
  },
  {
    id: "6",
    departmentCode: "MKT-006",
    name: "Marketing",
    hodPhone: "+966503334444",
    description: "Brand, content, and demand generation.",
    location: "Building A — Floor 1",
    status: "Active",
    establishedDate: "2019-05-01",
  },
  {
    id: "7",
    departmentCode: "EXE-007",
    name: "Executive",
    hodPhone: "",
    description: "Company leadership and strategic direction.",
    location: "Building A — Floor 5",
    status: "Active",
    establishedDate: "2016-01-01",
  },
  {
    id: "8",
    departmentCode: "SLS-008",
    name: "Sales",
    hodPhone: "",
    description: "Client acquisition and revenue growth.",
    location: "Building B — Floor 2",
    status: "Active",
    establishedDate: "2020-01-01",
  },
];

// hodName/hodEmail/employeeCount are lazy getters, not eagerly computed here:
// this module and Employees/employeesFakeData.js import from each other, and
// eagerly reading FAKE_EMPLOYEES at module-evaluation time hits it mid-init
// (ReferenceError: Cannot access 'FAKE_EMPLOYEES' before initialization).
// Deferring the read into a getter means it only runs once both modules have
// finished loading.
export const FAKE_DEPARTMENTS = DEPARTMENT_SEEDS.map((d) => {
  const obj = { ...d };
  Object.defineProperties(obj, {
    hodName: { enumerable: true, get: () => getHod(d.name)?.name || "—" },
    hodEmail: {
      enumerable: true,
      get: () => {
        const hod = getHod(d.name);
        return hod ? hod.email || emailFor(hod.name) : "";
      },
    },
    employeeCount: {
      enumerable: true,
      get: () => FAKE_EMPLOYEES.filter((e) => e.department === d.name && e.status === "active").length,
    },
  });
  return obj;
});
