import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight, FiCheck, FiSave } from "react-icons/fi";
import Button from "components/Button";
import Checkboxes from "components/Checkboxes";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import { SkeletonDetail } from "components/Skeleton";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import {
  fetchAttendancePolicyById,
  fetchCurrentAttendancePolicy,
  createAttendancePolicy,
  updateAttendancePolicy,
  showCurrentAttendancePolicy,
  showCurrentAttendancePolicyLoading,
  clearCurrentAttendancePolicy,
} from "store/slices/attendancePolicySlice";

const { add_attendance_policy, edit_attendance_policy } = alqadar_role_ids;

const SectionTitle = ({ title, hint }) => (
  <div className="pb-4 mb-5 border-b border-slate-100 dark:border-white/10">
    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
    {hint ? <p className="text-sm text-slate-500 dark:text-white/50 mt-1">{hint}</p> : null}
  </div>
);

const BLANK_POLICY = {
  name: "",
  implementedDate: new Date().toISOString().slice(0, 10),
  salaryCalculationDays: 30,
  notes: "",
  rules: {
    alwaysPresent: false,
    lateGraceMinutes: 10,
    earlyGraceMinutes: 10,
    deductionPerMinute: 0,
    managerApprovalEnabled: true,
    managerLateFullDay: true,
    managerEarlyFullDay: true,
  },
};

const PolicyPreviewCard = ({ policy, t }) => {
  const { rules } = policy;

  const lines = useMemo(() => {
    const items = [];
    if (rules.alwaysPresent) {
      items.push(t("attendance:policy_preview_always_present"));
    } else {
      items.push(
        t("attendance:policy_preview_grace", { late: rules.lateGraceMinutes, early: rules.earlyGraceMinutes }),
      );
      items.push(
        rules.deductionPerMinute > 0
          ? t("attendance:policy_preview_deduction", { amount: rules.deductionPerMinute })
          : t("attendance:policy_preview_deduction_none"),
      );
      if (rules.managerApprovalEnabled) {
        items.push(t("attendance:policy_preview_manager_on"));
        if (rules.managerLateFullDay) items.push(t("attendance:policy_preview_manager_late"));
        if (rules.managerEarlyFullDay) items.push(t("attendance:policy_preview_manager_early"));
      } else {
        items.push(t("attendance:policy_preview_manager_off"));
      }
    }
    items.push(t("attendance:policy_preview_salary_days", { days: policy.salaryCalculationDays }));
    return items;
  }, [policy, rules, t]);

  return (
    <div className="rounded-xl border border-teal-200 dark:border-teal-500/30 bg-teal-50/60 dark:bg-teal-500/10 p-5">
      <h3 className="text-sm font-semibold text-teal-900 dark:text-teal-200 mb-3">
        {t("attendance:policy_preview_title")}
      </h3>
      {policy.name ? (
        <p className="text-sm font-medium text-slate-800 dark:text-white mb-3">{policy.name}</p>
      ) : null}
      <ul className="space-y-2">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-white/80">
            <FiCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const AddAttendancePolicy = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";
  const isEditing = Boolean(id);

  const existing = useSelector(showCurrentAttendancePolicy);
  const loading = useSelector(showCurrentAttendancePolicyLoading);
  const [policy, setPolicy] = useState({ ...BLANK_POLICY });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isEditing) dispatch(fetchAttendancePolicyById(id));
    else dispatch(fetchCurrentAttendancePolicy());
    return () => dispatch(clearCurrentAttendancePolicy());
  }, [id, isEditing, dispatch]);

  useEffect(() => {
    if (isEditing && existing && existing.id === id) {
      setPolicy({
        name: existing.name || "",
        implementedDate: existing.implementedDate ? new Date(existing.implementedDate).toISOString().slice(0, 10) : "",
        salaryCalculationDays: existing.salaryCalculationDays ?? 30,
        notes: existing.notes || "",
        rules: { ...BLANK_POLICY.rules, ...(existing.rules || {}) },
      });
    }
  }, [existing, id, isEditing]);

  const setValue = (key, value) => setPolicy((prev) => ({ ...prev, [key]: value }));
  const setRule = (key, value) =>
    setPolicy((prev) => ({ ...prev, rules: { ...prev.rules, [key]: value } }));

  const handleSave = async () => {
    const nextErrors = {};
    if (!policy.name?.trim() || policy.name.trim().length < 2) nextErrors.name = t("attendance:policy_name_required");
    if (!policy.implementedDate) nextErrors.implementedDate = t("attendance:implemented_date_required");
    const today = new Date().toISOString().split("T")[0];
    if (policy.implementedDate && policy.implementedDate > today) {
      nextErrors.implementedDate = t("attendance:implemented_not_future", "Implemented date cannot be in the future");
    }
    if (policy.salaryCalculationDays === "" || policy.salaryCalculationDays == null
      || Number(policy.salaryCalculationDays) < 1 || Number(policy.salaryCalculationDays) > 31) {
      nextErrors.salaryCalculationDays = t("attendance:salary_days_range", "Salary calculation days must be between 1 and 31");
    }
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      if (isEditing) {
        await dispatch(updateAttendancePolicy({ id, data: policy })).unwrap();
      } else {
        await dispatch(createAttendancePolicy(policy)).unwrap();
      }
      toast.success(t("attendance:policy_saved_local"));
      navigate("/attendance-policy");
    } catch (err) {
      toast.error(err || t("attendance:policy_save_failed"));
    } finally {
      setSaving(false);
    }
  };

  const { rules } = policy;
  const showGrace = !rules.alwaysPresent;
  // Not editing => `existing` here is the *current* policy (fetched above),
  // used only to decide whether saving will replace it.
  const current = !isEditing ? existing : null;
  const isReplacingCurrent = !isEditing && current;

  if (!(isEditing ? checkRoleAuth(edit_attendance_policy) : checkRoleAuth(add_attendance_policy))) {
    return null;
  }

  if (isEditing && loading && !existing) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={6} />
      </div>
    );
  }

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1] max-w-full mx-auto space-y-5 pb-10">
        <div className="flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/attendance-policy")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? t("attendance:edit_policy") : t("attendance:create_new_policy")}
            </h1>
            <p className="text-sm text-mutedForeground mt-1">{t("attendance:attendance_policy_desc")}</p>
          </div>
          <Button
            type="button"
            title={t("attendance:save_policy")}
            icon={FiSave}
            btn="primary"
            onClick={handleSave}
            disabled={saving}
            loading={saving}
            className="!w-auto !rounded-lg !h-10 !px-4 !text-white"
            iconClass="h-4 w-4 text-white"
          />
        </div>

        {isReplacingCurrent && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
            {t("attendance:replace_current_notice", { name: current.name })}
          </div>
        )}

        <form
          className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-6 md:p-8 space-y-8 border-l-4 !border-l-teal-500"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label={t("attendance:policy_name_required")}
              name="name"
              value={policy.name}
              onValueChange={(v) => setValue("name", v)}
              placeholder={t("attendance:policy_profile_optional_name")}
              pattern={/[a-zA-Z0-9\s.'-]/}
              minLength={2}
              maxLength={100}
              inputClass="!h-11"
              labelClass="!text-xs"
              errors={formErrors.name ? { name: { message: formErrors.name } } : undefined}
            />
            <FormInput
              label={t("attendance:implemented_date")}
              name="implementedDate"
              type="date"
              value={policy.implementedDate}
              onValueChange={(v) => setValue("implementedDate", v)}
              max={new Date().toISOString().split("T")[0]}
              inputClass="!h-11"
              labelClass="!text-xs"
              errors={formErrors.implementedDate ? { implementedDate: { message: formErrors.implementedDate } } : undefined}
            />
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 p-4">
            <Checkboxes
              enabled={rules.alwaysPresent}
              onChange={(v) => setRule("alwaysPresent", v)}
              label={t("attendance:policy_always_present")}
              labelClass="text-sm font-medium text-slate-800 dark:text-white"
            />
            <p className="text-xs text-slate-500 dark:text-white/50 mt-2 ps-8">
              {t("attendance:policy_always_present_hint")}
            </p>
          </div>

          {showGrace && (
            <section>
              <SectionTitle
                title={t("attendance:policy_grace_section")}
                hint={t("attendance:policy_grace_section_hint")}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label={t("attendance:policy_grace_late")}
                  type="number"
                  min={0}
                  max={180}
                  value={rules.lateGraceMinutes}
                  onValueChange={(v) => setRule("lateGraceMinutes", Number(v))}
                  inputClass="!h-11"
                  labelClass="!text-xs"
                />
                <FormInput
                  label={t("attendance:policy_grace_early")}
                  type="number"
                  min={0}
                  max={180}
                  value={rules.earlyGraceMinutes}
                  onValueChange={(v) => setRule("earlyGraceMinutes", Number(v))}
                  inputClass="!h-11"
                  labelClass="!text-xs"
                />
                <div className="sm:col-span-2">
                  <FormInput
                    label={t("attendance:policy_deduction_per_minute")}
                    type="number"
                    min={0}
                    decimal
                    decimalPlaces={2}
                    value={rules.deductionPerMinute}
                    onValueChange={(v) => setRule("deductionPerMinute", Number(v))}
                    inputClass="!h-11"
                    labelClass="!text-xs"
                  />
                  <p className="text-xs text-slate-500 dark:text-white/45 mt-1">{t("attendance:policy_deduction_hint")}</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10">
                <SectionTitle
                  title={t("attendance:policy_manager_section")}
                  hint={t("attendance:policy_manager_section_hint")}
                />
                <div className="space-y-1">
                  <Checkboxes
                    enabled={rules.managerApprovalEnabled}
                    onChange={(v) => setRule("managerApprovalEnabled", v)}
                    label={t("attendance:policy_manager_enable")}
                    labelClass="text-sm font-medium text-slate-800 dark:text-white"
                  />
                  {rules.managerApprovalEnabled && (
                    <div className="ps-8 space-y-1 pt-2">
                      <Checkboxes
                        enabled={rules.managerLateFullDay}
                        onChange={(v) => setRule("managerLateFullDay", v)}
                        label={t("attendance:policy_manager_late_present")}
                        labelClass="text-sm text-slate-700 dark:text-white/85"
                      />
                      <Checkboxes
                        enabled={rules.managerEarlyFullDay}
                        onChange={(v) => setRule("managerEarlyFullDay", v)}
                        label={t("attendance:policy_manager_early_present")}
                        labelClass="text-sm text-slate-700 dark:text-white/85"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section>
            <SectionTitle
              title={t("attendance:policy_salary_days_label")}
              hint={t("attendance:policy_salary_days_hint")}
            />
            <FormInput
              type="number"
              required
              min={1}
              max={31}
              name="salaryCalculationDays"
              value={policy.salaryCalculationDays}
              onValueChange={(v) => setValue("salaryCalculationDays", Number(v))}
              inputClass="!h-11"
              wrapperClass="max-w-xs"
              errors={formErrors.salaryCalculationDays ? { salaryCalculationDays: { message: formErrors.salaryCalculationDays } } : undefined}
            />
          </section>

          <FormTextarea
            label={t("attendance:policy_notes")}
            rows={3}
            value={policy.notes}
            onValueChange={(v) => setValue("notes", v)}
            maxLength={500}
            labelClass="!text-xs"
          />

          <PolicyPreviewCard policy={policy} t={t} />

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-white/10">
            <Button type="submit" title={t("attendance:save_policy")} btn="primary" disabled={saving} loading={saving} className="!text-white" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAttendancePolicy;
