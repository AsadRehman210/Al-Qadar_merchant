import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { APPLIED_VIA } from "global/approvalEngine";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  REQUEST_TYPES,
  requestTypeById,
  FIELD_DEFS,
  buildSummary,
} from "../requestsFakeData";
import { applyRequest, triggerRefresh } from "store/slices/requestSlice";

const { add_employee } = rafeeqi_role_ids;

const toOpts = (arr) => arr.map((x) => ({ id: x, title: x }));
const NUMBER_FIELDS = ["hours", "noticePeriodDays", "advanceAmount", "quantity", "cost"];

// Extra per-field validation props for the config-driven fields below.
// `newValue` is deliberately excluded — its real-world meaning (email /
// phone / address / etc.) depends on the `profileField` select value picked
// alongside it, so no single validation rule fits it safely.
const FIELD_VALIDATION_PROPS = {
  hours: { min: 0, max: 24, decimal: true, decimalPlaces: 1 },
  noticePeriodDays: { min: 0, max: 365 },
  advanceAmount: { min: 0, decimal: true, decimalPlaces: 2 },
  quantity: { min: 1 },
  cost: { min: 0, decimal: true, decimalPlaces: 2 },
  purpose: { minLength: 5, maxLength: 500 },
  destination: { minLength: 2, maxLength: 100 },
  courseName: { minLength: 2, maxLength: 150 },
  provider: { minLength: 2, maxLength: 150 },
  proposedDesignation: { pattern: /[a-zA-Z\s.'-]/, minLength: 2, maxLength: 100 },
  proposedDepartment: { pattern: /[a-zA-Z\s.'-]/, minLength: 2, maxLength: 100 },
};

const ApplyRequest = ({ hrMode = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isRTL = i18n.language === "ar";

  const employees = useSelector(showEmployees);
  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const employeesById = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])),
    [employees],
  );
  const empOpts = useMemo(
    () => employees.filter((e) => e.status === "active").map((e) => ({
      id: e.id,
      title: `${e.first_name || ""} ${e.last_name || ""} (${e.employeeCode || ""})`.trim(),
    })),
    [employees],
  );
  const typeOpts = REQUEST_TYPES.map((x) => ({ id: x.id, title: x.name }));

  const [selType, setSelType] = useState(REQUEST_TYPES[0]);
  const [selEmp, setSelEmp] = useState(null);
  // One bag of values for all <select>-type fields, keyed by field name.
  const [selectVals, setSelectVals] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, trigger, formState: { errors } } = useForm({ mode: "onChange" });

  const typeMeta = requestTypeById(selType?.id);
  const fields = useMemo(() => typeMeta?.fields || [], [typeMeta]);
  const manager = selEmp?.id ? employeesById[employeesById[selEmp.id]?.managerEmployeeId] : null;

  useEffect(() => {
    const defaults = {};
    fields.forEach((f) => {
      const def = FIELD_DEFS[f];
      if (def?.type === "select") defaults[f] = def.options[0];
    });
    setSelectVals(defaults);
  }, [fields]);

  const onSubmit = async (data) => {
    if (!selEmp?.id) return;
    const details = {};
    fields.forEach((f) => {
      const def = FIELD_DEFS[f];
      if (!def) return;
      if (def.type === "select") details[f] = selectVals[f] ?? def.options[0];
      else if (NUMBER_FIELDS.includes(f)) details[f] = Number(data[f]) || 0;
      else details[f] = data[f];
    });

    setSubmitting(true);
    try {
      await dispatch(applyRequest({
        type: selType.id,
        employeeId: selEmp.id,
        appliedVia: hrMode ? APPLIED_VIA.HR : APPLIED_VIA.EMPLOYEE,
        details,
        summary: buildSummary(selType.id, details),
      })).unwrap();
      dispatch(triggerRefresh());
      toast.success(t("requests:apply_success", "Request submitted."));
      navigate("/requests");
    } catch (err) {
      toast.error(err || t("requests:apply_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (f) => {
    const def = FIELD_DEFS[f];
    if (!def) return null;
    const label = t(def.labelKey);

    if (f === "reason") {
      return (
        <div key={f} className="lg:col-span-3">
          <label className="text-sm font-medium text-linkText leading-6 mb-1 block">
            {label} <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            {...register("reason", { required: true, minLength: { value: 5, message: "Minimum length is 5 characters" }, maxLength: { value: 500, message: "Maximum length is 500 characters" } })}
            placeholder={t("requests:reason_placeholder")}
            className="w-full rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-0"
          />
          {errors.reason && errors.reason.type !== "required" && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.reason.message}</p>
          )}
        </div>
      );
    }

    if (def.type === "select") {
      const val = selectVals[f] ?? def.options[0];
      return (
        <SelectDropdown
          key={f}
          label={label}
          data={toOpts(def.options)}
          selected={{ id: val, title: val }}
          setSelected={(v) => setSelectVals((prev) => ({ ...prev, [f]: v?.id ?? def.options[0] }))}
          hideClear
        />
      );
    }

    const wide = f === "purpose" || f === "newValue" || f === "destination" || f === "courseName";
    return (
      <div key={f} className={wide ? "lg:col-span-2" : ""}>
        <FormInput
          label={label}
          name={f}
          type={def.type === "text" ? undefined : def.type}
          register={register}
          errors={errors}
          required={f !== "proposedDesignation" && f !== "proposedDepartment"}
          {...(FIELD_VALIDATION_PROPS[f] || {})}
        />
      </div>
    );
  };

  if (hrMode && !checkRoleAuth(add_employee)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/requests")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-1 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {hrMode ? t("requests:hr_entry_title") : t("requests:apply_title")}
            </h1>
            <p className="text-mutedForeground">{hrMode ? t("requests:hr_entry_desc") : t("requests:apply_desc")}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60"
        >
          {/* Flow banner */}
          <div className={`mb-6 p-4 rounded-2xl border ${hrMode ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30" : "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30"}`}>
            {hrMode ? (
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {t("requests:no_approval_needed")}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                {[t("requests:step_submit"), t("requests:step_manager"), t("requests:step_hr"), t("requests:step_approved")].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-teal-500 text-white" : "bg-blue-200 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300"}`}>{i + 1}</div>
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">{step}</span>
                    {i < 3 && <span className="text-blue-300">→</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Request type */}
            <SelectDropdown
              label={t("requests:request_type")}
              data={typeOpts}
              selected={{ id: selType.id, title: selType.name }}
              setSelected={(v) => setSelType(REQUEST_TYPES.find((x) => x.id === v?.id) || REQUEST_TYPES[0])}
              hideClear
            />

            {/* Employee */}
            <div className="lg:col-span-2">
              <SelectDropdown
                label={t("requests:employee")}
                data={empOpts}
                selected={selEmp || {}}
                setSelected={(v) => setSelEmp(v?.id ? v : null)}
                name="employeeId"
                register={register}
                setValue={setValue}
                trigger={trigger}
                required
              />
              {selEmp && (
                <p className="text-xs text-slate-500 dark:text-white/60 mt-1.5">
                  {t("requests:routed_to")}: <span className="font-semibold">{manager ? `${manager.first_name || ""} ${manager.last_name || ""}`.trim() : "HR"}</span>
                </p>
              )}
            </div>

            {/* Type-specific fields (config-driven) */}
            {fields.map((f) => renderField(f))}
          </div>

          <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button
              type="button"
              title={t("cancel")}
              onClick={() => navigate("/requests")}
              className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
            />
            <Button
              type="submit"
              title={hrMode ? t("requests:save_hr_entry") : t("requests:submit_request")}
              btn="primary"
              disabled={!selEmp || submitting}
              className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyRequest;
