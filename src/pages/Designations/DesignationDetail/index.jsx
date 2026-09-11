import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { AiOutlineEdit } from "react-icons/ai";
import Button from "components/Button";
import { checkRoleAuth, formatAmount } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import {
  fetchDesignationById,
  showCurrentDesignation,
  showCurrentDesignationLoading,
  clearCurrentDesignation,
} from "store/slices/designationSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { SkeletonDetail } from "components/Skeleton";

const { edit_designation, view_designation } = alqadar_role_ids;

const LEVEL_COLORS = {
  "C-Level":    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  "Director":   "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "Manager":    "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  "Supervisor": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "Staff":      "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70",
  "Intern":     "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
};

const InfoRow = ({ label, value }) => (
  <div className="py-3 border-b border-slate-100 dark:border-white/5 last:border-0 flex gap-3">
    <span className="w-48 shrink-0 text-sm text-slate-500 dark:text-white/50">{label}</span>
    <span className="text-sm font-medium text-slate-800 dark:text-white">{value || "—"}</span>
  </div>
);

const DesignationDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isRTL = i18n.language === "ar";

  const des = useSelector(showCurrentDesignation);
  const desLoading = useSelector(showCurrentDesignationLoading);
  const departments = useSelector(showDepartments);

  useEffect(() => {
    dispatch(fetchDesignationById(id));
    dispatch(fetchDepartments());
    return () => dispatch(clearCurrentDesignation());
  }, [id, dispatch]);

  const departmentName = useMemo(
    () => departments.find((d) => d.id === des?.departmentId)?.name,
    [departments, des],
  );

  if (!checkRoleAuth(view_designation)) return null;
  if (desLoading && (!des || des.id !== id)) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={6} />
      </div>
    );
  }
  if (!des || des.id !== id) return (
    <div className="p-10 text-center text-slate-400">{t("designation:not_found")}</div>
  );

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 dark:text-white">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={() => navigate("/designations")}
              icon={isRTL ? FiArrowRight : FiArrowLeft}
              className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 transition-all"
              iconClass="!text-lg"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{des.title}</h1>
              <p className="text-mutedForeground text-sm">{des.code} · {departmentName || "—"}</p>
            </div>
          </div>
          {checkRoleAuth(edit_designation) && (
            <Button
              type="button"
              onClick={() => navigate(`/designations/edit/${des.id}`)}
              icon={AiOutlineEdit}
              title={t("edit")}
              className="!w-auto !rounded-lg !h-10 !px-4 flex-row !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600"
              iconClass="h-4 w-4 text-white"
            />
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Main info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]">
              <h2 className="font-semibold text-slate-800 dark:text-white mb-4">{t("designation:basic_info")}</h2>
              <InfoRow label={t("designation:code")} value={des.code} />
              <InfoRow label={t("designation:title")} value={des.title} />
              <InfoRow label={t("designation:short_name")} value={des.shortName} />
              <InfoRow label={t("designation:department")} value={departmentName} />
              <InfoRow label={t("designation:grade")} value={des.grade} />
              <InfoRow label={t("designation:created_at")} value={des.createdAt ? new Date(des.createdAt).toLocaleDateString() : null} />
              <InfoRow label={t("created_by")} value={des.createdByName} />
              <InfoRow label={t("updated_by")} value={des.updatedByName} />
            </div>
          </div>

          {/* Right: Summary cards */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
              <h2 className="font-semibold text-slate-800 dark:text-white mb-5">{t("designation:summary")}</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{t("designation:level")}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${LEVEL_COLORS[des.level] || "bg-slate-100 text-slate-600"}`}>
                    {des.level}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{t("designation:status")}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${des.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                    {des.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{t("designation:employees")}</span>
                  <span className="text-sm font-bold text-teal-700 dark:text-teal-300">{des.employeeCount ?? "—"}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
                <p className="text-xs text-slate-400 mb-1">{t("designation:salary_range")}</p>
                <p className="text-lg font-bold tabular-nums text-slate-800 dark:text-white">
                  {formatAmount(des.minSalary)} – {formatAmount(des.maxSalary)}
                  <span className="text-sm font-normal text-slate-400 ml-1">{des.currency}</span>
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
                <p className="text-xs text-slate-400 mb-1">{t("designation:overtime_rate")}</p>
                <p className="text-lg font-bold tabular-nums text-slate-800 dark:text-white">
                  {formatAmount(des.overtimeRate)}
                  <span className="text-sm font-normal text-slate-400 ml-1">{des.currency}/hr</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignationDetail;
