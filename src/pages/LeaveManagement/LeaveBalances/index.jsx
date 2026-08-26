import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import { fetchLeaveBalance, showLeaveBalance, showLeaveBalanceLoading } from "store/slices/leaveSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { SkeletonTable } from "components/Skeleton";

// No bulk "every employee's balance" endpoint exists on the backend — only
// a per-employee lookup (balances are computed live from that employee's
// own leave records) — so this is an employee-picker rather than a matrix
// of every employee at once (avoids an N+1 fetch loop; matches the Salary
// module's same-constraint redesign earlier this session).
const LeaveBalances = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  const employees = useSelector(showEmployees);
  const departments = useSelector(showDepartments);
  const balance = useSelector(showLeaveBalance);
  const balanceLoading = useSelector(showLeaveBalanceLoading);
  const [selEmployee, setSelEmployee] = useState(null);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const departmentsById = useMemo(
    () => Object.fromEntries(departments.map((d) => [d.id, d.name])),
    [departments],
  );

  const employeeOpts = useMemo(
    () => employees.map((e) => ({
      id: e.id,
      title: `${e.first_name || ""} ${e.last_name || ""} (${e.employeeCode || ""})`.trim(),
      department: departmentsById[e.departmentId] || "—",
    })),
    [employees, departmentsById],
  );

  useEffect(() => {
    if (selEmployee?.id) dispatch(fetchLeaveBalance(selEmployee.id));
  }, [selEmployee, dispatch]);

  const totalTaken = balance.reduce((s, b) => s + (b.taken || 0), 0);

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1] space-y-6">
        <div className="flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/leave-management")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("leave:leave_balances")}</h1>
            <p className="text-mutedForeground">{t("leave:balances_desc")} — {t("leave:year")}: {new Date().getFullYear()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-4">
          <label className="text-sm font-medium text-linkText mb-1 block">{t("leave:employee")}</label>
          <SelectDropdown
            data={employeeOpts}
            selected={selEmployee}
            setSelected={setSelEmployee}
            classes="!h-[46px] !rounded-lg max-w-md"
          />
        </div>

        {!selEmployee ? (
          <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-12 text-center text-slate-400">
            {t("leave:select_employee_hint")}
          </div>
        ) : balanceLoading ? (
          <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-md overflow-hidden p-4">
            <SkeletonTable rows={5} columns={5} />
          </div>
        ) : (
          <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--color-teal-500)]">
                    <th className="px-4 py-4 text-start font-semibold text-white/95 pl-6">{t("leave:leave_type")}</th>
                    <th className="px-4 py-4 text-center font-semibold text-white/95">{t("leave:entitled")}</th>
                    <th className="px-4 py-4 text-center font-semibold text-white/95">{t("leave:taken")}</th>
                    <th className="px-4 py-4 text-center font-semibold text-white/95">{t("leave:pending")}</th>
                    <th className="px-4 py-4 text-center font-semibold text-white/95">{t("leave:remaining")}</th>
                  </tr>
                </thead>
                <tbody>
                  {balance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500">{t("no_record_found")}</td>
                    </tr>
                  )}
                  {balance.map((b) => (
                    <tr key={b.leaveTypeId} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10">
                      <td className="px-4 py-4 pl-6 font-semibold text-slate-900 dark:text-white">{b.leaveTypeName}</td>
                      <td className="px-4 py-4 text-center text-slate-600 dark:text-white/70">{b.entitled}</td>
                      <td className="px-4 py-4 text-center font-semibold text-rose-600">{b.taken}</td>
                      <td className="px-4 py-4 text-center text-amber-600">{b.pending}</td>
                      <td className={`px-4 py-4 text-center font-semibold ${b.remaining <= 3 ? "text-amber-600" : "text-emerald-600"}`}>{b.remaining}</td>
                    </tr>
                  ))}
                </tbody>
                {balance.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-white/5">
                      <td className="px-4 py-3 pl-6 font-bold text-slate-700 dark:text-white" colSpan={4}>{t("leave:total_taken")}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-white">{totalTaken}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveBalances;
