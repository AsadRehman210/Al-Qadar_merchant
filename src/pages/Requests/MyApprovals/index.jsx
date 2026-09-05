import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { LuCalendarCheck, LuHandCoins, LuReceipt, LuClipboardList, LuBanknote, LuGift } from "react-icons/lu";
import { APPROVAL_STATUS_BADGE } from "global/approvalEngine";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { LOAN_STATUS, EXPENSE_STATUS, RUN_STATUS, SP_STATUS } from "global/constant";
import { APPROVAL_STATUS, requestTypeById } from "pages/Requests/requestsFakeData";
import {
  showLastUpdated as requestUpdated,
  fetchRequests,
  showRequests,
} from "store/slices/requestSlice";
import {
  showLastUpdated as payrollUpdated,
  fetchPayrollRuns,
  showRuns,
  fetchSpecialPayments,
  showSpecialPayments,
} from "store/slices/payrollBatchSlice";
import { fetchLoans, showLoans } from "store/slices/loanSlice";
import { fetchExpenses, showExpenses } from "store/slices/expenseSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { fetchLeaves, showLeaves } from "store/slices/leaveSlice";
import { fetchLeaveTypes, showLeaveTypes } from "store/slices/leaveTypeSlice";

const { add_employee } = rafeeqi_role_ids;

const TAB_CLASS =
  "min-w-[150px] whitespace-nowrap cursor-pointer py-3 px-5 rounded-lg h-11 flex justify-center items-center gap-2 font-medium text-sm text-slate-500 dark:text-white/70 transition-all outline-none data-[selected]:bg-[var(--color-teal-500)] data-[selected]:text-white data-[selected]:font-semibold hover:text-teal-700 hover:bg-teal-500/10";

const MODULE_META = {
  leave: { icon: LuCalendarCheck, label: "Leave", color: "text-purple-600" },
  loan: { icon: LuHandCoins, label: "Loan", color: "text-teal-600" },
  expense: { icon: LuReceipt, label: "Expense", color: "text-amber-600" },
  request: { icon: LuClipboardList, label: "Request", color: "text-blue-600" },
  payroll: { icon: LuBanknote, label: "Payroll", color: "text-emerald-600" },
  specialPayment: { icon: LuGift, label: "Special Payment", color: "text-rose-600" },
};

const collectItems = (loans, expenses, leaves, runs, specialPayments, requests, employeesById, leaveTypesById) => {
  const managerItems = [];
  const hrItems = [];

  leaves.forEach((l) => {
    const emp = employeesById[l.employeeId];
    const employeeName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "—";
    const base = { module: "leave", id: l.id, title: leaveTypesById[l.leaveTypeId] || "—", employeeName, status: l.status, link: `/leave-management/details/${l.id}`, sub: `${l.fromDate} → ${l.toDate}` };
    if (l.status === "Pending Manager") managerItems.push(base);
    else if (l.status === "Pending HR") hrItems.push(base);
  });

  loans.forEach((l) => {
    const emp = employeesById[l.employeeId];
    const employeeName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "—";
    const base = { module: "loan", id: l.id, title: `${l.loanType} · SAR ${l.loanAmount?.toLocaleString?.() || l.loanAmount}`, employeeName, status: l.status, link: `/loans/details/${l.id}`, sub: l.loanPurpose };
    if (l.status === LOAN_STATUS.PENDING_MANAGER) managerItems.push(base);
    else if (l.status === LOAN_STATUS.PENDING_HR || l.status === "Pending") hrItems.push(base);
  });

  expenses.forEach((e) => {
    const emp = employeesById[e.employeeId];
    const employeeName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "—";
    const base = { module: "expense", id: e.id, title: `${e.expenseNumber} · SAR ${e.amount?.toLocaleString?.() || e.amount}`, employeeName, status: e.approvalStatus, link: `/expenses/details/${e.id}`, sub: e.description };
    if (e.approvalStatus === EXPENSE_STATUS.PENDING_MANAGER) managerItems.push(base);
    else if (e.approvalStatus === EXPENSE_STATUS.PENDING_HR) hrItems.push(base);
  });

  requests.forEach((r) => {
    const emp = employeesById[r.employeeId];
    const employeeName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "—";
    const base = { module: "request", id: r.id, title: requestTypeById(r.type)?.name || r.type, employeeName, status: r.status, link: `/requests/details/${r.id}`, sub: r.summary };
    if (r.status === APPROVAL_STATUS.PENDING_MANAGER) managerItems.push(base);
    else if (r.status === APPROVAL_STATUS.PENDING_HR) hrItems.push(base);
  });

  // Payroll runs and Special Payments are single-stage (CFO/HR) approvals,
  // not the two-stage Manager→HR chain the tabs were built around — bucket
  // them into the HR/final-approver tab rather than inventing a fake
  // manager stage for them.
  runs.forEach((r) => {
    if (r.status !== RUN_STATUS.PENDING_APPROVAL) return;
    hrItems.push({
      module: "payroll",
      id: r.id,
      title: `${r.runNumber} · SAR ${r.totalNet?.toLocaleString?.() || r.totalNet}`,
      employeeName: `${r.employees?.length || 0} employees`,
      status: r.status,
      link: `/payroll-batch/details/${r.id}`,
      sub: r.month,
    });
  });

  specialPayments.forEach((p) => {
    if (p.status !== SP_STATUS.PENDING_APPROVAL) return;
    hrItems.push({
      module: "specialPayment",
      id: p.id,
      title: `${p.title} · SAR ${p.totalAmount?.toLocaleString?.() || p.totalAmount}`,
      employeeName: `${p.employees?.length || 0} employees`,
      status: p.status,
      link: `/special-payments/details/${p.id}`,
      sub: "",
    });
  });

  return { managerItems, hrItems };
};

const ApprovalCard = ({ item, onOpen }) => {
  const meta = MODULE_META[item.module];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={() => onOpen(item.link)}
      className="w-full text-start flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/10 hover:border-teal-400 hover:shadow-sm transition-all"
    >
      <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
        <Icon className={`h-5 w-5 ${meta.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wide text-slate-400">{meta.label}</span>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${APPROVAL_STATUS_BADGE[item.status] || "bg-slate-100 text-slate-600"}`}>{item.status}</span>
        </div>
        <p className="font-semibold text-slate-800 dark:text-white truncate">{item.title}</p>
        <p className="text-xs text-slate-500 dark:text-white/60 truncate">{item.employeeName} · {item.sub}</p>
      </div>
    </button>
  );
};

const MyApprovals = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useSelector(requestUpdated);
  useSelector(payrollUpdated);
  const [tick] = useState(0);

  const loans = useSelector(showLoans);
  const expenses = useSelector(showExpenses);
  const employees = useSelector(showEmployees);
  const leaves = useSelector(showLeaves);
  const leaveTypes = useSelector(showLeaveTypes);
  const runs = useSelector(showRuns);
  const specialPayments = useSelector(showSpecialPayments);
  const requests = useSelector(showRequests);

  useEffect(() => {
    dispatch(fetchLoans());
    dispatch(fetchExpenses());
    dispatch(fetchEmployees());
    dispatch(fetchLeaves());
    dispatch(fetchLeaveTypes());
    dispatch(fetchPayrollRuns());
    dispatch(fetchSpecialPayments());
    dispatch(fetchRequests());
  }, [dispatch]);

  const employeesById = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])),
    [employees],
  );
  const leaveTypesById = useMemo(
    () => Object.fromEntries(leaveTypes.map((x) => [x.id, x.name])),
    [leaveTypes],
  );

  const { managerItems, hrItems } = collectItems(loans, expenses, leaves, runs, specialPayments, requests, employeesById, leaveTypesById);
  void tick;

  if (!checkRoleAuth(add_employee)) return null;

  const EmptyState = () => (
    <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-12 text-center">
      <div className="text-5xl mb-3">✅</div>
      <p className="font-semibold text-slate-700 dark:text-white">{t("requests:all_clear")}</p>
      <p className="text-slate-500 dark:text-white/60 text-sm">{t("requests:no_pending")}</p>
    </div>
  );

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1] space-y-6">
        <div className="dark:text-white">
          <h1 className="text-3xl font-bold tracking-tight">{t("sidebar_my_approvals")}</h1>
          <p className="text-mutedForeground mt-1">
            {t("requests:manager_approvals_desc")} — Leave · Loans · Expenses · Requests
          </p>
        </div>

        <TabGroup>
          <TabList className="inline-flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20">
            <Tab className={TAB_CLASS}>
              {t("requests:manager_approvals")}
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-500 text-white">{managerItems.length}</span>
            </Tab>
            <Tab className={TAB_CLASS}>
              {t("requests:hr_approvals")}
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-blue-500 text-white">{hrItems.length}</span>
            </Tab>
          </TabList>
          <TabPanels className="mt-6">
            <TabPanel>
              {managerItems.length === 0 ? <EmptyState /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {managerItems.map((it) => <ApprovalCard key={`${it.module}-${it.id}`} item={it} onOpen={navigate} />)}
                </div>
              )}
            </TabPanel>
            <TabPanel>
              {hrItems.length === 0 ? <EmptyState /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hrItems.map((it) => <ApprovalCard key={`${it.module}-${it.id}`} item={it} onOpen={navigate} />)}
                </div>
              )}
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
};

export default MyApprovals;
