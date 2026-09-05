import { useEffect, useMemo } from "react";
import { formatAmount } from "global/helper";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight, FiPrinter } from "react-icons/fi";
import Button from "components/Button";
import {
  fetchPayrollRunById,
  showCurrentRun,
  showCurrentRunLoading,
} from "store/slices/payrollBatchSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { fetchDesignations, showDesignations } from "store/slices/designationSlice";
import { SkeletonDetail } from "components/Skeleton";


const Row = ({ label, value, bold, positive, negative, separator }) => (
  <>
    {separator && <tr><td colSpan={2} className="py-1"><div className="border-t border-dashed border-slate-300 dark:border-white/20" /></td></tr>}
    <tr className={bold ? "font-bold" : ""}>
      <td className={`py-1 pr-4 text-sm ${bold ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-white/70"}`}>{label}</td>
      <td className={`py-1 text-right text-sm ${positive ? "text-emerald-600" : negative ? "text-rose-600" : "text-slate-800 dark:text-white"}`}>
        SAR {formatAmount(value)}
      </td>
    </tr>
  </>
);

const Payslip = () => {
  const { t, i18n } = useTranslation();
  const { runId, empId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isRTL = i18n.language === "ar";

  const run = useSelector(showCurrentRun);
  const loading = useSelector(showCurrentRunLoading);
  const employees = useSelector(showEmployees);
  const departments = useSelector(showDepartments);
  const designations = useSelector(showDesignations);

  useEffect(() => {
    dispatch(fetchPayrollRunById(runId));
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
    dispatch(fetchDesignations());
  }, [dispatch, runId]);

  const emp = useMemo(() => {
    const line = run?.employees?.find((e) => e.employeeId === empId);
    if (!line) return null;
    const employee = employees.find((e) => e.id === empId);
    const department = departments.find((d) => d.id === employee?.departmentId)?.name || "—";
    const designation = designations.find((d) => d.id === employee?.designationId)?.title || "—";
    return {
      ...line,
      employeeName: employee ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim() : "—",
      employeeIdNo: employee?.employeeCode || "—",
      department,
      designation,
    };
  }, [run, empId, employees, departments, designations]);

  if (loading && !run) return <SkeletonDetail fields={8} />;

  if (!run || !emp) return (
    <div className="p-8 text-center">
      <p className="text-slate-600 dark:text-white/70">{t("no_record_found")}</p>
      <Button title={t("back")} onClick={() => navigate("/payroll-batch")} className="mt-4" />
    </div>
  );

  const monthLabel = run.month ? new Date(`${run.month}-01`).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—";

  return (
    <div className="relative min-h-[60vh]">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1]">
        <div className="mb-6 flex items-center gap-4 dark:text-white no-print">
          <Button type="button" onClick={() => navigate(`/payroll-batch/details/${runId}`)}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{t("payroll:payslip")} — {emp.employeeName}</h1>
            <p className="text-mutedForeground text-sm">{monthLabel} · {run.runNumber}</p>
          </div>
          <Button type="button" title={t("payroll:print")} icon={FiPrinter} iconClass="h-4 w-4"
            onClick={() => window.print()}
            className="!w-auto !rounded-lg !h-10 !px-4 no-print !border border-slate-200 dark:!border-white/25 !bg-white dark:!bg-white/10 !text-slate-700 dark:!text-white" />
        </div>

        {/* ── Payslip Document ── */}
        <div id="payslip" className="bg-white dark:bg-[#1e2535] border border-slate-200 dark:border-white/20 rounded-3xl p-8 max-w-3xl mx-auto print:max-w-full print:rounded-none print:border-0 print:p-6">
          {/* Company Header */}
          <div className="flex items-center justify-between pb-6 border-b-2 border-teal-500 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-teal-600">PAYSLIP</h2>
              <p className="text-slate-500 dark:text-white/60 text-sm">{monthLabel}</p>
              <p className="text-slate-500 dark:text-white/60 text-xs mt-0.5">Ref: {run.runNumber}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800 dark:text-white text-lg">Company Name</p>
              <p className="text-slate-500 dark:text-white/60 text-xs">Riyadh, Saudi Arabia</p>
            </div>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
            {[
              { label: t("payroll:employee_name"), value: emp.employeeName },
              { label: t("payroll:employee_id"), value: emp.employeeIdNo },
              { label: t("payroll:department"), value: emp.department },
              { label: t("payroll:designation"), value: emp.designation },
              { label: t("payroll:payment_date"), value: emp.paymentDate ? new Date(emp.paymentDate).toLocaleDateString() : "—" },
              { label: t("payroll:payment_ref"), value: emp.paymentRef || "—" },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-xs text-slate-500 dark:text-white/60">{f.label}</p>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Earnings & Deductions side by side */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Earnings */}
            <div>
              <div className="bg-teal-500 text-white px-4 py-2 rounded-t-xl">
                <p className="font-bold text-sm">{t("payroll:earnings")}</p>
              </div>
              <div className="border border-t-0 border-slate-200 dark:border-white/15 rounded-b-xl p-4">
                <table className="w-full">
                  <tbody>
                    <Row label={t("payroll:basic")} value={emp.basic} />
                    <Row label="HRA" value={emp.hra} />
                    <Row label={t("payroll:medical")} value={emp.medical} />
                    <Row label={t("payroll:transport")} value={emp.transport} />
                    <Row label={t("payroll:food")} value={emp.food} />
                    <Row label={t("payroll:mobile")} value={emp.mobile} />
                    {emp.overtime > 0 && <Row label={t("payroll:overtime")} value={emp.overtime} />}
                    {emp.bonus > 0 && <Row label={t("payroll:bonus")} value={emp.bonus} />}
                    {emp.arrears > 0 && <Row label={t("payroll:arrears")} value={emp.arrears} />}
                    <Row label={t("payroll:gross_earnings")} value={emp.grossEarnings} bold positive separator />
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <div className="bg-rose-500 text-white px-4 py-2 rounded-t-xl">
                <p className="font-bold text-sm">{t("payroll:deductions")}</p>
              </div>
              <div className="border border-t-0 border-slate-200 dark:border-white/15 rounded-b-xl p-4">
                <table className="w-full">
                  <tbody>
                    <Row label="PF (Employee)" value={emp.pfEmployee} negative />
                    <Row label={t("payroll:income_tax")} value={emp.incomeTax} negative />
                    <Row label={t("payroll:insurance")} value={emp.insurance} negative />
                    {emp.loanDeduction > 0 && <Row label={t("payroll:loan_ded")} value={emp.loanDeduction} negative />}
                    {emp.advance > 0 && <Row label={t("payroll:advance")} value={emp.advance} negative />}
                    {emp.attendanceDeduction > 0 && <Row label={t("payroll:attendance_ded")} value={emp.attendanceDeduction} negative />}
                    {emp.otherDeductions > 0 && <Row label={t("payroll:deductions")} value={emp.otherDeductions} negative />}
                    <Row label={t("payroll:total_deductions")} value={emp.totalDeductions} bold negative separator />
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Net Pay Banner */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">{t("payroll:net_pay")}</p>
              <p className="text-3xl font-extrabold">SAR {formatAmount(emp.netPay)}</p>
            </div>
            <div className="text-right text-sm opacity-80">
              <p>{t("payroll:employer_contribution")}</p>
              <p className="font-semibold">PF: SAR {formatAmount(emp.pfEmployer)}</p>
              <p className="font-semibold">{t("payroll:total_cost")}: SAR {formatAmount(emp.employerCost)}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-dashed border-slate-300 dark:border-white/20 flex items-center justify-between text-xs text-slate-400">
            <p>{t("payroll:generated_on")}: {new Date().toLocaleDateString()}</p>
            <p>{t("payroll:computer_generated")}</p>
            <p>{t("payroll:confidential")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payslip;
