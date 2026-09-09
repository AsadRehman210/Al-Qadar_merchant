import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import { FaRegEdit } from "react-icons/fa";
import moment from "moment";
import {
  fetchDepartmentById,
  showCurrentDepartment,
  showCurrentDepartmentLoading,
  clearCurrentDepartment,
} from "store/slices/departmentSlice";
import { SkeletonDetail } from "components/Skeleton";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { view_department, edit_department } = alqadar_role_ids;

const DetailField = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
      {label}
    </p>
    <p className="text-sm text-slate-900 dark:text-white/90 whitespace-pre-wrap">
      {value ?? "—"}
    </p>
  </div>
);

const DepartmentDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const dept = useSelector(showCurrentDepartment);
  const deptLoading = useSelector(showCurrentDepartmentLoading);

  useEffect(() => {
    dispatch(fetchDepartmentById(id));
    return () => dispatch(clearCurrentDepartment());
  }, [id, dispatch]);

  if (!checkRoleAuth(view_department)) return null;

  if (deptLoading && (!dept || dept.id !== id)) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={6} />
      </div>
    );
  }

  if (!dept || dept.id !== id) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("no_record_found")}</p>
        <Button
          title={t("back")}
          onClick={() => navigate("/departments")}
          className="mt-4"
        />
      </div>
    );
  }

  const isRTL = i18n.language === "ar";
  const panelClass =
    "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/departments")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {dept.departmentCode} — {dept.name}
            </h1>
            <p className="text-mutedForeground text-sm">
              {t("department:detail_title")} · {dept.hodName || "—"}
            </p>
          </div>
          {checkRoleAuth(edit_department) && (
            <Button
              title={t("edit")}
              icon={FaRegEdit}
              className="!w-auto !rounded-lg !h-11 !px-5 !border border-slate-200 dark:!border-white/25 !text-white dark:!text-white dark:!bg-white/10 hover:!bg-slate-50 dark:hover:!bg-white/20"
              iconClass="!text-lg"
              onClick={() => navigate(`/departments/edit/${dept.id}`)}
              btn="primary"
            />
          )}
        </div>

        <div className={`${panelClass} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
          <DetailField
            label={t("department:department_code")}
            value={dept.departmentCode}
          />
          <DetailField
            label={t("department:department_name")}
            value={dept.name}
          />
          <DetailField label={t("department:hod_name")} value={dept.hodName} />
          <DetailField label={t("department:hod_email")} value={dept.hodEmail} />
          <DetailField label={t("department:hod_phone")} value={dept.hodPhone} />
          <DetailField label={t("department:location")} value={dept.location} />
          <DetailField
            label={t("department:established_date")}
            value={dept.establishedDate ? moment(dept.establishedDate).format("DD-MM-YYYY") : null}
          />
          <DetailField
            label={t("department:status")}
            value={
              dept.status === "Active"
                ? t("department:status_active")
                : t("department:status_inactive")
            }
          />
          <DetailField
            label={t("department:employee_count")}
            value={dept.employeeCount}
          />
          <div className="md:col-span-2 lg:col-span-3">
            <DetailField
              label={t("department:description")}
              value={dept.description}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetail;
