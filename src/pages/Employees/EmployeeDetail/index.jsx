import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaRegEdit } from "react-icons/fa";
import { LuUserMinus, LuListChecks, LuNetwork } from "react-icons/lu";
import moment from "moment";
import Button from "components/Button";
import { useTranslation } from "react-i18next";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import PersonalDetailsTab from "./PersonalDetailsTab";
import OfficialDetailsTab from "./OfficialDetailsTab";
import QualificationTab from "./QualificationTab";
import DocumentsTab from "./DocumentsTab";
import SalaryTab from "./SalaryTab";
import MonthWiseSalaryTab from "./MonthWiseSalaryTab";
import AttendanceTab from "./AttendanceTab";
import LeaveTab from "./LeaveTab";
import LoansTab from "./LoansTab";
import ExpensesTab from "./ExpensesTab";
import ProvidentFundTab from "./ProvidentFundTab";
import AssetsTab from "./AssetsTab";
import PerformanceTab from "./PerformanceTab";
import RequestsTab from "./RequestsTab";
import SpecialPaymentsTab from "./SpecialPaymentsTab";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployeeById, fetchEmployees, showCurrentEmployee, showEmployees, setCurrentEmployee } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { fetchDesignations, showDesignations } from "store/slices/designationSlice";
import { fetchCurrentSalary, showCurrentSalary, clearCurrentSalary } from "store/slices/salarySlice";
import { fetchPayrollHistoryByEmployee, showEmployeePayrollHistory, clearEmployeeHistory } from "store/slices/payrollBatchSlice";
import { SkeletonDetail } from "components/Skeleton";
import { progressOf, ONBOARDING_STATUS } from "../../Onboarding/onboardingFakeData";
import { fetchOnboardingByEmployee, showOnboardingByEmployee } from "store/slices/onboardingSlice";

const TAB_CLASS =
  "min-w-[120px] whitespace-nowrap cursor-pointer py-3 px-5 rounded-lg h-11 flex justify-center items-center font-medium text-[0.9375rem] text-slate-500 dark:text-white/70 transition-all outline-none data-[selected]:bg-[var(--color-teal-500)] data-[selected]:from-teal-500 data-[selected]:to-teal-600 data-[selected]:text-white data-[selected]:font-semibold hover:text-teal-700 hover:bg-teal-500/10 dark:hover:text-white dark:hover:bg-teal-500/20";
const panelClass =
  "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 pl-9 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60 dark:[&_label]:!text-white/90 dark:[&_.font-medium]:!text-white/90 dark:[&_input]:!bg-white/10 dark:[&_input]:!border-white/20 dark:[&_input]:!text-white dark:[&_select]:!bg-white/10 dark:[&_select]:!border-white/20 dark:[&_select]:!text-white dark:[&_textarea]:!bg-white/10 dark:[&_textarea]:!border-white/20 dark:[&_textarea]:!text-white";

export default function EmployeeDetail() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const currentEmployee = useSelector(showCurrentEmployee);
  const departments = useSelector(showDepartments);
  const designations = useSelector(showDesignations);
  const employees = useSelector(showEmployees);
  const salary = useSelector(showCurrentSalary);
  const payrollHistory = useSelector(showEmployeePayrollHistory);

  useEffect(() => {
    if (id) {
      dispatch(fetchEmployeeById(id));
      dispatch(fetchOnboardingByEmployee(id));
      dispatch(fetchCurrentSalary(id));
      dispatch(fetchPayrollHistoryByEmployee(id));
    }
    dispatch(fetchDepartments());
    dispatch(fetchDesignations());
    dispatch(fetchEmployees());
    return () => {
      dispatch(setCurrentEmployee(null));
      dispatch(clearCurrentSalary());
      dispatch(clearEmployeeHistory());
    };
  }, [dispatch, id]);

  const onboarding = useSelector(showOnboardingByEmployee(id));

  // `_id`/`employee_id` aliases keep the not-yet-API-wired cross-module tabs
  // (Loans/Expenses/Attendance/etc. — each its own later task) from crashing;
  // they'll just show an empty state against a real id until their turn.
  // department/role/manager are resolved here (Official Details needs the
  // human-readable name, not the raw id it's stored as).
  const fmtDate = (d) => (d ? moment(d).format("DD-MM-YYYY") : d);

  const emp = useMemo(() => {
    if (!currentEmployee || currentEmployee.id !== id) return null;
    const manager = employees.find((e) => e.id === currentEmployee.managerEmployeeId);
    return {
      ...currentEmployee,
      _id: currentEmployee.id,
      employee_id: currentEmployee.employeeCode,
      department: departments.find((d) => d.id === currentEmployee.departmentId)?.name,
      role: designations.find((d) => d.id === currentEmployee.designationId)?.title,
      manager: manager ? `${manager.first_name || ""} ${manager.last_name || ""}`.trim() : null,
      resume: currentEmployee.documents?.resume,
      id_proof: currentEmployee.documents?.id_proof,
      certificate_documents: currentEmployee.documents?.certificate_documents,
      dob: fmtDate(currentEmployee.dob),
      joining_date: fmtDate(currentEmployee.joining_date),
      national_id_expiry: fmtDate(currentEmployee.national_id_expiry),
      work_permit_expiry: fmtDate(currentEmployee.work_permit_expiry),
      probation_end: fmtDate(currentEmployee.probation_end),
      resignation_date: fmtDate(currentEmployee.resignation_date),
      retirement_date: fmtDate(currentEmployee.retirement_date),
      termination_date: fmtDate(currentEmployee.termination_date),
      last_seen_date: fmtDate(currentEmployee.last_seen_date),
    };
  }, [currentEmployee, id, departments, designations, employees]);

  if (!emp) {
    return <SkeletonDetail fields={9} />;
  }

  const onboardingInProgress =
    emp.status === "probation" &&
    onboarding &&
    onboarding.status === ONBOARDING_STATUS.IN_PROGRESS;
  const onboardingDone = onboarding && onboarding.status === ONBOARDING_STATUS.COMPLETED;
  const showOnboardingCallout = onboardingInProgress || onboardingDone;
  const onboardingProgress = showOnboardingCallout ? progressOf(onboarding) : null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="flex flex-col gap-6">
          <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
            <Link
              to="/employees"
              className="inline-flex items-center justify-center w-11 h-11 rounded-lg shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 hover:-translate-x-0.5 rtl:hover:translate-x-0.5 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
              aria-label={t("back")}
            >
              {isRTL ? (
                <FiArrowRight className="text-lg" />
              ) : (
                <FiArrowLeft className="text-lg" />
              )}
            </Link>
            <div className="flex flex-col space-y-2 min-w-0 flex-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {(emp.first_name || emp.name || "") +
                  " " +
                  (emp.last_name || "")}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-mutedForeground text-sm">
                  {t("employees:employee_id")}: {emp.employee_id}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Button
                title={t("employees:view_in_org_chart")}
                icon={LuNetwork}
                className="!w-auto !rounded-lg !h-11 !px-5 !border border-slate-200 dark:!border-white/25 !text-slate-700 dark:!text-white dark:!bg-white/10 hover:!bg-slate-50 dark:hover:!bg-white/20"
                iconClass="!text-lg"
                onClick={() => navigate("/org-chart")}
              />
              {["probation", "active"].includes(emp.status) && (
                <Button
                  title={t("offboarding:initiate_exit")}
                  icon={LuUserMinus}
                  className="!w-auto !rounded-lg !h-11 !px-5 !border border-rose-200 dark:!border-rose-500/30 !text-rose-600 dark:!text-rose-300 !bg-rose-50 dark:!bg-rose-500/10 hover:!bg-rose-100 dark:hover:!bg-rose-500/20"
                  iconClass="!text-lg"
                  onClick={() => navigate(`/offboarding/add?employeeId=${id}`)}
                />
              )}
              <Button
                title={t("edit")}
                icon={FaRegEdit}
                className="!w-auto !rounded-lg !h-11 !px-5 !border border-slate-200 dark:!border-white/25 !text-slate-700 dark:!text-white dark:!bg-white/10 hover:!bg-slate-50 dark:hover:!bg-white/20"
                iconClass="!text-lg"
                onClick={() => navigate(`/employees/edit/${id}`)}
              />
            </div>
          </div>

          {showOnboardingCallout && (
            <div
              className={`flex flex-wrap items-center gap-4 p-4 rounded-2xl border ${
                onboardingDone
                  ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10"
                  : "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10"
              }`}
            >
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  onboardingDone ? "bg-emerald-500/15 dark:bg-emerald-500/20" : "bg-amber-500/15 dark:bg-amber-500/20"
                }`}
              >
                <LuListChecks
                  className={`h-5 w-5 ${onboardingDone ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
                />
              </div>
              <div className="flex-1 min-w-[220px]">
                <p
                  className={`text-sm font-semibold ${
                    onboardingDone ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"
                  }`}
                >
                  {t(onboardingDone ? "hrhub:onboarding_completed" : "hrhub:onboarding_in_progress")}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div
                    className={`h-1.5 w-40 rounded-full overflow-hidden ${
                      onboardingDone ? "bg-emerald-200/60 dark:bg-white/10" : "bg-amber-200/60 dark:bg-white/10"
                    }`}
                  >
                    <div
                      className={`h-full rounded-full ${onboardingDone ? "bg-emerald-500" : "bg-amber-500"}`}
                      style={{ width: `${onboardingProgress.pct}%` }}
                    />
                  </div>
                  <span className={`text-xs ${onboardingDone ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                    {t("hrhub:required_progress", {
                      done: onboardingProgress.requiredDone,
                      total: onboardingProgress.requiredTotal,
                    })}
                  </span>
                </div>
              </div>
              <Link
                to="/onboarding"
                className={`text-sm font-semibold hover:underline shrink-0 ${
                  onboardingDone ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
                }`}
              >
                {t("hrhub:view_checklist")}
              </Link>
            </div>
          )}

          <TabGroup>
            <div className="overflow-x-auto">
              <TabList className="inline-flex items-center gap-1.5 p-1.5 rounded-lg mb-0 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20">
                <Tab className={TAB_CLASS}>
                  {t("employees:personal_details")}
                </Tab>
                <Tab className={TAB_CLASS}>
                  {t("employees:official_details")}
                </Tab>
                <Tab className={TAB_CLASS}>{t("employees:qualification")}</Tab>
                <Tab className={TAB_CLASS}>{t("employees:documents")}</Tab>
                <Tab className={TAB_CLASS}>{t("employees:salary_details")}</Tab>
                <Tab className={TAB_CLASS}>
                  {t("employees:month_wise_salary")}
                </Tab>
                <Tab className={TAB_CLASS}>
                  {t("employees:attendance_calendar")}
                </Tab>
                <Tab className={TAB_CLASS}>{t("employees:leave")}</Tab>
                <Tab className={TAB_CLASS}>{t("employees:loans")}</Tab>
                <Tab className={TAB_CLASS}>{t("employees:expenses")}</Tab>
                <Tab className={TAB_CLASS}>{t("pf:provident_fund")}</Tab>
                <Tab className={TAB_CLASS}>{t("employees:assets")}</Tab>
                <Tab className={TAB_CLASS}>{t("employees:performance")}</Tab>
                <Tab className={TAB_CLASS}>{t("employees:requests")}</Tab>
                <Tab className={TAB_CLASS}>{t("employees:special_payments")}</Tab>
              </TabList>
            </div>
            <TabPanels className="mt-6">
              <TabPanel>
                <div className={panelClass}>
                  <PersonalDetailsTab data={emp} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <OfficialDetailsTab data={emp} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <QualificationTab data={emp} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <DocumentsTab data={emp} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <SalaryTab salary={salary} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <MonthWiseSalaryTab employee={emp} payrollHistory={payrollHistory} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <AttendanceTab data={emp} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <LeaveTab data={emp} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <LoansTab data={emp} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <ExpensesTab data={emp} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <ProvidentFundTab data={emp} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <AssetsTab data={emp} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <PerformanceTab data={emp} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <RequestsTab data={emp} />
                </div>
              </TabPanel>
              <TabPanel>
                <div className={panelClass}>
                  <SpecialPaymentsTab data={emp} />
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </div>
  );
}
