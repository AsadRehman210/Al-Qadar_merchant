import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { LuShieldAlert, LuCalendarClock } from "react-icons/lu";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { useListFilters } from "hooks/useListFilters";

const { view_employee } = rafeeqi_role_ids;

const WINDOW_OPTS = [30, 60, 90];

const DOC_FIELDS = [
  { key: "national_id_expiry", labelKey: "orgHr:national_id" },
  { key: "work_permit_expiry", labelKey: "orgHr:work_permit" },
];

const Compliance = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filters, setFilters] = useListFilters("hr-compliance", { windowDays: 60, docFilter: "all" });
  const { windowDays, docFilter } = filters;

  const employees = useSelector(showEmployees);
  const departments = useSelector(showDepartments);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const departmentsById = useMemo(() => Object.fromEntries(departments.map((d) => [d.id, d])), [departments]);

  const today = dayjs();

  const rows = useMemo(() => {
    const out = [];
    employees.filter((e) => e.status === "active").forEach((emp) => {
      DOC_FIELDS.forEach(({ key, labelKey }) => {
        const dateStr = emp[key];
        if (!dateStr) return;
        const expiry = dayjs(dateStr);
        const daysLeft = expiry.diff(today, "day");
        if (daysLeft > windowDays) return;
        out.push({
          employeeId: emp.id,
          employeeName: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
          employeeIdNo: emp.employeeCode,
          department: departmentsById[emp.departmentId]?.name || "—",
          docKey: key,
          docLabel: t(labelKey),
          expiryDate: dayjs(dateStr).format("YYYY-MM-DD"),
          daysLeft,
        });
      });
    });
    return out.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [employees, departmentsById, windowDays, today, t]);

  const filtered = docFilter === "all" ? rows : rows.filter((r) => r.docKey === docFilter);
  const expiredCount = filtered.filter((r) => r.daysLeft < 0).length;
  const soonCount = filtered.filter((r) => r.daysLeft >= 0).length;

  const statusFor = (daysLeft) => {
    if (daysLeft < 0) return { label: t("orgHr:expired"), cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" };
    return { label: t("orgHr:expiring_soon"), cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" };
  };

  if (!checkRoleAuth(view_employee)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1] space-y-6">
        <div className="dark:text-white">
          <h1 className="text-3xl font-bold tracking-tight">{t("orgHr:compliance")}</h1>
          <p className="text-mutedForeground mt-1">{t("orgHr:compliance_desc")}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white">
            <p className="text-xs font-medium opacity-80 mb-1">{t("orgHr:expired")}</p>
            <p className="text-2xl font-bold flex items-center gap-2"><LuShieldAlert className="h-5 w-5" /> {expiredCount}</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <p className="text-xs font-medium opacity-80 mb-1">{t("orgHr:expiring_soon")}</p>
            <p className="text-2xl font-bold flex items-center gap-2"><LuCalendarClock className="h-5 w-5" /> {soonCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-xl text-slate-900 dark:text-white">{t("orgHr:all_documents")}</h2>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1">
                {[{ id: "all", label: t("orgHr:all_documents") }, ...DOC_FIELDS.map((d) => ({ id: d.key, label: t(d.labelKey) }))].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFilters({ docFilter: opt.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${docFilter === opt.id ? "bg-white dark:bg-white/20 text-teal-600 shadow" : "text-slate-600 dark:text-white/60 hover:text-slate-800"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1">
                {WINDOW_OPTS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFilters({ windowDays: d })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${windowDays === d ? "bg-white dark:bg-white/20 text-teal-600 shadow" : "text-slate-600 dark:text-white/60 hover:text-slate-800"}`}
                  >
                    {t("orgHr:within_days", { count: d })}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-white/60 py-12">{t("orgHr:no_expiring_documents")}</p>
          ) : (
            <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="bg-[var(--color-teal-500)]">
                    {[t("employees:employee_name"), t("employees:department"), t("orgHr:document_type"), t("orgHr:expiry_date"), t("orgHr:days_left"), t("status")].map((h) => (
                      <th key={h} className="px-4 py-4 text-start font-semibold text-white/95 whitespace-nowrap first:pl-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const status = statusFor(r.daysLeft);
                    return (
                      <tr
                        key={`${r.employeeId}-${r.docKey}`}
                        className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 cursor-pointer"
                        onClick={() => navigate(`/employees/details/${r.employeeId}`)}
                      >
                        <td className="px-4 py-4 pl-6">
                          <p className="font-semibold text-slate-900 dark:text-white">{r.employeeName}</p>
                          <p className="text-xs text-slate-500 dark:text-white/60">{r.employeeIdNo}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-white/70">{r.department}</td>
                        <td className="px-4 py-4 text-slate-600 dark:text-white/70">{r.docLabel}</td>
                        <td className="px-4 py-4 text-slate-600 dark:text-white/70">{r.expiryDate}</td>
                        <td className={`px-4 py-4 font-semibold ${r.daysLeft < 0 ? "text-rose-600" : "text-amber-600"}`}>
                          {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)}d ago` : `${r.daysLeft}d`}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${status.cls}`}>{status.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Compliance;
