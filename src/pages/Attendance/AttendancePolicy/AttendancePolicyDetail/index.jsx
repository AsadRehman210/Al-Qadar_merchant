import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { AiOutlineEdit } from "react-icons/ai";
import Button from "components/Button";
import {
  fetchAttendancePolicyById,
  showCurrentAttendancePolicy,
  showCurrentAttendancePolicyLoading,
  clearCurrentAttendancePolicy,
} from "store/slices/attendancePolicySlice";
import { SkeletonDetail } from "components/Skeleton";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { view_attendance_policy, edit_attendance_policy } = alqadar_role_ids;

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/10 last:border-b-0">
    <span className="text-sm text-slate-500 dark:text-white/60">{label}</span>
    <span className="text-sm font-medium text-slate-900 dark:text-white">{value ?? "—"}</span>
  </div>
);

const AttendancePolicyDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const policy = useSelector(showCurrentAttendancePolicy);
  const policyLoading = useSelector(showCurrentAttendancePolicyLoading);

  useEffect(() => {
    dispatch(fetchAttendancePolicyById(id));
    return () => dispatch(clearCurrentAttendancePolicy());
  }, [id, dispatch]);

  // "Current" is simply the one policy with no endDate yet — no separate
  // lookup needed, the fetched record already carries that.
  const isCurrent = policy && policy.id === id && !policy.endDate;

  if (!checkRoleAuth(view_attendance_policy)) return null;

  if (policyLoading && (!policy || policy.id !== id)) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={6} />
      </div>
    );
  }

  if (!policy || policy.id !== id) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-white/60">
        {t("attendance:policy_not_found")}
      </div>
    );
  }

  const { rules } = policy;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1] space-y-6">
        <div className="flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/attendance-policy")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{policy.name}</h1>
            <p className="text-sm text-mutedForeground mt-1">
              {isCurrent
                ? t("attendance:policy_active_since", { date: new Date(policy.implementedDate).toLocaleDateString() })
                : t("attendance:policy_ended_range", {
                    start: new Date(policy.implementedDate).toLocaleDateString(),
                    end: policy.endDate ? new Date(policy.endDate).toLocaleDateString() : "",
                  })}
            </p>
          </div>
          {isCurrent && checkRoleAuth(edit_attendance_policy) && (
            <Button
              type="button"
              title={t("edit")}
              icon={AiOutlineEdit}
              onClick={() => navigate(`/attendance-policy/edit/${policy.id}`)}
              className="!w-auto !rounded-lg !h-11 !px-5 !border border-slate-200 dark:!border-white/25 !text-slate-700 dark:!text-white dark:!bg-white/10"
              iconClass="!text-lg"
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
              <h2 className="font-semibold text-slate-800 dark:text-white mb-3">
                {t("attendance:policy_grace_section")}
              </h2>
              {rules.alwaysPresent ? (
                <p className="text-sm text-slate-600 dark:text-white/70">
                  {t("attendance:policy_preview_always_present")}
                </p>
              ) : (
                <>
                  <InfoRow label={t("attendance:policy_grace_late")} value={`${rules.lateGraceMinutes} min`} />
                  <InfoRow label={t("attendance:policy_grace_early")} value={`${rules.earlyGraceMinutes} min`} />
                  <InfoRow
                    label={t("attendance:policy_deduction_per_minute")}
                    value={rules.deductionPerMinute}
                  />
                </>
              )}
            </div>

            <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
              <h2 className="font-semibold text-slate-800 dark:text-white mb-3">
                {t("attendance:policy_manager_section")}
              </h2>
              <InfoRow
                label={t("attendance:policy_manager_enable")}
                value={rules.managerApprovalEnabled ? t("yes") : t("no")}
              />
              {rules.managerApprovalEnabled && (
                <>
                  <InfoRow
                    label={t("attendance:policy_manager_late_present")}
                    value={rules.managerLateFullDay ? t("yes") : t("no")}
                  />
                  <InfoRow
                    label={t("attendance:policy_manager_early_present")}
                    value={rules.managerEarlyFullDay ? t("yes") : t("no")}
                  />
                </>
              )}
            </div>

            {policy.notes && (
              <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
                <h2 className="font-semibold text-slate-800 dark:text-white mb-3">
                  {t("attendance:policy_notes")}
                </h2>
                <p className="text-sm text-slate-600 dark:text-white/70">{policy.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
              <h2 className="font-semibold text-slate-800 dark:text-white mb-3">{t("attendance:summary")}</h2>
              <InfoRow label={t("attendance:implemented_date")} value={policy.implementedDate ? new Date(policy.implementedDate).toLocaleDateString() : null} />
              <InfoRow label={t("attendance:end_date")} value={policy.endDate ? new Date(policy.endDate).toLocaleDateString() : t("attendance:current_policy")} />
              <InfoRow label={t("attendance:policy_salary_days_label")} value={policy.salaryCalculationDays} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePolicyDetail;
