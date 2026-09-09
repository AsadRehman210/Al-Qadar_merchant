import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiEdit2, FiEye, FiPlus, FiUsers } from "react-icons/fi";
import Button from "components/Button";
import { SkeletonDetail, SkeletonTable } from "components/Skeleton";
import {
  fetchAttendancePolicies,
  fetchCurrentAttendancePolicy,
  clearCurrentAttendancePolicy,
  showAttendancePolicies,
  showAttendancePoliciesLoading,
  showCurrentAttendancePolicy,
  showCurrentAttendancePolicyLoading,
} from "store/slices/attendancePolicySlice";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { view_attendance_policy, add_attendance_policy, edit_attendance_policy } = alqadar_role_ids;

const AttendancePolicyOverview = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isRTL = i18n.language === "ar";

  const current = useSelector(showCurrentAttendancePolicy);
  const currentLoading = useSelector(showCurrentAttendancePolicyLoading);
  const allPolicies = useSelector(showAttendancePolicies);
  const listLoading = useSelector(showAttendancePoliciesLoading);
  const previous = allPolicies.filter((p) => p.endDate);

  useEffect(() => {
    dispatch(fetchCurrentAttendancePolicy());
    dispatch(fetchAttendancePolicies());
    return () => dispatch(clearCurrentAttendancePolicy());
  }, [dispatch]);

  if (!checkRoleAuth(view_attendance_policy)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1] space-y-6">
        <div className="flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/attendance")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{t("attendance:attendance_policy")}</h1>
            <p className="text-sm text-mutedForeground mt-1">{t("attendance:attendance_policy_desc")}</p>
          </div>
          {checkRoleAuth(add_attendance_policy) && (
          <Button
            type="button"
            title={t("attendance:create_new_policy")}
            icon={FiPlus}
            btn="primary"
            onClick={() => navigate("/attendance-policy/add")}
            className="!w-auto !rounded-lg !h-10 !px-4 !text-white"
            iconClass="h-4 w-4 text-white"
          />
          )}
        </div>

        {currentLoading ? (
          <SkeletonDetail fields={4} />
        ) : current ? (
          <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-6 md:p-8 border-l-4 !border-l-teal-500">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div>
                <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-semibold mb-2">
                  {t("attendance:current_policy")}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{current.name}</h2>
                <p className="text-sm text-slate-500 dark:text-white/60 mt-1">
                  {t("attendance:policy_active_since", { date: current.implementedDate ? new Date(current.implementedDate).toLocaleDateString() : "" })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/attendance-policy/detail/${current.id}`)}
                  className="h-10 px-4 rounded-lg bg-slate-50 dark:bg-white/10 text-sm font-semibold text-slate-700 dark:text-white flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/20"
                >
                  <FiEye className="h-4 w-4" /> {t("view")}
                </button>
                {checkRoleAuth(edit_attendance_policy) && (
                <button
                  type="button"
                  onClick={() => navigate(`/attendance-policy/edit/${current.id}`)}
                  className="h-10 px-4 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-sm font-semibold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 hover:bg-teal-100 dark:hover:bg-teal-500/20"
                >
                  <FiEdit2 className="h-4 w-4" /> {t("edit")}
                </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5">
                <p className="text-xs font-medium text-slate-500 dark:text-white/50 uppercase">
                  {t("attendance:policy_grace_late")}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {current.rules.alwaysPresent ? "—" : `${current.rules.lateGraceMinutes} min`}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5">
                <p className="text-xs font-medium text-slate-500 dark:text-white/50 uppercase">
                  {t("attendance:policy_deduction_per_minute")}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {current.rules.alwaysPresent ? "—" : `${current.rules.deductionPerMinute}`}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5">
                <p className="text-xs font-medium text-slate-500 dark:text-white/50 uppercase flex items-center gap-1.5">
                  <FiUsers className="h-3.5 w-3.5" /> {t("attendance:policy_manager_enable")}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {current.rules.managerApprovalEnabled ? t("yes") : t("no")}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5">
                <p className="text-xs font-medium text-slate-500 dark:text-white/50 uppercase">
                  {t("attendance:policy_salary_days_label")}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {current.salaryCalculationDays}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            {t("attendance:previous_policies_title")}
          </h3>
          <p className="text-sm text-slate-500 dark:text-white/50 mb-5">
            {t("attendance:previous_policies_desc")}
          </p>

          {listLoading ? (
            <SkeletonTable rows={4} columns={3} />
          ) : previous.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-white/40 py-6 text-center">
              {t("attendance:no_previous_policies")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-[var(--color-teal-500)]">
                    <th className="px-4 py-3 text-start font-semibold text-white/95 first:pl-6 first:rounded-tl-xl">
                      {t("name")}
                    </th>
                    <th className="px-4 py-3 text-start font-semibold text-white/95">
                      {t("attendance:implemented_date")}
                    </th>
                    <th className="px-4 py-3 text-start font-semibold text-white/95">
                      {t("attendance:end_date")}
                    </th>
                    <th className="px-4 py-3 text-start font-semibold text-white/95 last:pr-6 last:rounded-tr-xl">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previous.map((policy) => (
                    <tr key={policy.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10">
                      <td className="px-4 py-3 pl-6 font-medium text-slate-900 dark:text-white">{policy.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-white/70">{policy.implementedDate ? new Date(policy.implementedDate).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-white/70">{policy.endDate ? new Date(policy.endDate).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-3 pr-6">
                        <button
                          type="button"
                          onClick={() => navigate(`/attendance-policy/detail/${policy.id}`)}
                          className="text-xs font-semibold text-teal-600 dark:text-teal-300 hover:underline flex items-center gap-1"
                        >
                          <FiEye className="h-3.5 w-3.5" /> {t("view")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePolicyOverview;
