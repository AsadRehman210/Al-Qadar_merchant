import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { FiArrowLeft, FiArrowRight, FiCheck, FiSettings } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { fetchSpTypes, showSpTypes, createSpecialPayment } from "store/slices/payrollBatchSlice";
import { specialPaymentTargetOptions, specialPaymentModeOptions } from "global/constant";

const { add_special_payment } = alqadar_role_ids;

const MODE_BADGE = {
  fixed: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  pct_basic: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  pct_gross: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

const CreateSpecialPayment = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isRTL = i18n.language === "ar";

  const types = useSelector(showSpTypes);
  const employees = useSelector(showEmployees);
  const departments = useSelector(showDepartments);

  useEffect(() => {
    dispatch(fetchSpTypes());
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const [selType, setSelType] = useState(null);
  const [target, setTarget] = useState(specialPaymentTargetOptions[0]);
  const [selDept, setSelDept] = useState(null);
  const [selEmp, setSelEmp] = useState(null);
  const [selectedCustomIds, setSelectedCustomIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (types.length && !selType) setSelType(types[0]); }, [types]);
  useEffect(() => { if (departments.length && !selDept) setSelDept(departments[0].id); }, [departments]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { title: "", notes: "" },
  });
  const watchedTitle = watch("title");

  // Probation employees are already drawing salary and are eligible for
  // special payments too — only genuinely inactive statuses are excluded.
  const activeEmps = employees.filter((e) => e.status === "active" || e.status === "probation");
  const empOptions = activeEmps.map((e) => ({ id: e.id, title: `${e.first_name || ""} ${e.last_name || ""}`.trim() }));
  const deptOptions = departments.map((d) => ({ id: d.id, title: d.name }));
  const typeOptions = types.map((tp) => ({ id: tp.id, title: tp.name }));

  const targetEmps = useMemo(() => {
    if (target.id === "all") return activeEmps;
    if (target.id === "department") return activeEmps.filter((e) => e.departmentId === selDept);
    if (target.id === "individual") return selEmp ? activeEmps.filter((e) => e.id === selEmp.id) : [];
    return activeEmps.filter((e) => selectedCustomIds.has(e.id));
  }, [target.id, selDept, selEmp, selectedCustomIds.size, activeEmps]);

  const toggleCustom = (id) => {
    const next = new Set(selectedCustomIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedCustomIds(next);
  };

  const handleTypeChange = (opt) => {
    const found = types.find((tp) => tp.id === opt.id);
    setSelType(found || null);
  };

  const onSubmit = async (data) => {
    if (!selType) return;
    if (targetEmps.length === 0) {
      toast.error(t("payroll:sp_select_target", "Select at least one employee or department"));
      return;
    }
    setSubmitting(true);
    const result = await dispatch(createSpecialPayment({
      title: data.title,
      typeId: selType.id,
      target: target.id,
      departmentId: target.id === "department" ? selDept : undefined,
      employeeId: target.id === "individual" ? selEmp?.id : undefined,
      customEmployeeIds: target.id === "custom" ? [...selectedCustomIds] : undefined,
      notes: data.notes,
    }));
    setSubmitting(false);
    if (createSpecialPayment.fulfilled.match(result) && result.payload?.id) {
      navigate(`/special-payments/details/${result.payload.id}`);
    }
  };

  const amountHint = selType
    ? selType.amountMode === "fixed"
      ? `SAR ${(selType.amountValue || 0).toLocaleString()} — same for every employee`
      : selType.amountMode === "pct_basic"
      ? `${selType.amountValue}% of each employee's basic salary`
      : `${selType.amountValue}% of each employee's gross salary`
    : "";

  if (!checkRoleAuth(add_special_payment)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1]">
        <div className="flex items-center gap-4 mb-7 dark:text-white">
          <Button type="button" onClick={() => navigate("/special-payments")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{t("payroll:create_sp")}</h1>
            <p className="text-mutedForeground">{t("payroll:create_sp_desc")}</p>
          </div>
          <Button type="button" title={t("payroll:sp_manage_types")} icon={FiSettings} iconClass="h-4 w-4"
            onClick={() => navigate("/special-payments/types")}
            className="!w-auto !rounded-md !h-10 !px-4 !border border-slate-200 dark:!border-white/20 !text-slate-700 dark:!text-white !bg-white dark:!bg-white/10 text-sm" />
        </div>

        {types.length === 0 && (
          <div className="p-6 mb-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 text-amber-700 dark:text-amber-300 text-sm flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold">{t("payroll:sp_no_types")}</p>
              <button type="button" onClick={() => navigate("/special-payments/types")}
                className="underline text-xs mt-0.5">{t("payroll:sp_go_create_types")}</button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-5">{t("payroll:sp_basic_info")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput label={t("payroll:sp_title")} name="title" register={register} errors={errors} required
                pattern={/[a-zA-Z0-9\s.'-]/} minLength={2} maxLength={100}
                placeholder="e.g. Eid ul-Fitr 2025 Bonus" className="md:col-span-2" />

              {/* Payment Type dropdown */}
              {typeOptions.length === 0 ? (
                <div>
                  <p className="text-sm font-medium text-linkText leading-6 mb-1">
                    {t("payroll:sp_type")} <span className="text-[#EC1212]">*</span>
                  </p>
                  <div className="h-11 rounded-xl border-2 border-dashed border-slate-300 flex items-center px-4 text-sm text-slate-400">
                    {t("payroll:sp_no_types")}
                  </div>
                </div>
              ) : (
                <SelectDropdown
                  label={t("payroll:sp_type")}
                  required
                  data={typeOptions}
                  selected={selType ? typeOptions.find((x) => x.id === selType.id) : null}
                  setSelected={handleTypeChange}
                />
              )}

              {/* Amount rule pill — auto-set from type */}
              <div className="flex flex-col justify-end pb-0.5">
                {selType ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-linkText">{t("payroll:sp_amount_rule")}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${MODE_BADGE[selType.amountMode]}`}>
                        {selType.amountMode === "fixed"
                          ? `SAR ${(selType.amountValue || 0).toLocaleString()}`
                          : `${selType.amountValue}%`}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-white/60">
                        {specialPaymentModeOptions.find((m) => m.id === selType.amountMode)?.title || selType.amountMode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{amountHint}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">{t("payroll:sp_select_type_first")}</p>
                )}
              </div>

              <FormInput label={t("payroll:notes")} name="notes" register={register} errors={errors}
                maxLength={500}
                className="md:col-span-2" placeholder={t("payroll:sp_notes_placeholder")} />
            </div>
          </div>

          {/* Target Selection */}
          <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-purple-500">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-5">{t("payroll:sp_target")}</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {specialPaymentTargetOptions.map((opt) => (
                <button key={opt.id} type="button" onClick={() => setTarget(opt)}
                  className={`p-4 rounded-2xl border-2 text-sm font-medium text-start transition-all ${target.id === opt.id ? "border-purple-400 bg-purple-50 dark:bg-purple-500/10 text-purple-700" : "border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:border-purple-300"}`}>
                  {t(opt.title)}
                </button>
              ))}
            </div>

            {target.id === "department" && (
              <div className="w-[240px]">
                <SelectDropdown
                  label={t("payroll:department")}
                  data={deptOptions}
                  selected={deptOptions.find((x) => x.id === selDept) || null}
                  setSelected={(v) => setSelDept(v.id)}
                />
              </div>
            )}

            {target.id === "individual" && (
              <div className="w-[340px]">
                <SelectDropdown
                  label={t("payroll:sp_select_employee")}
                  data={empOptions}
                  selected={selEmp}
                  setSelected={setSelEmp}
                />
              </div>
            )}

            {/* Custom — select employees */}
            {target.id === "custom" && (
              <div>
                <p className="text-xs text-slate-500 dark:text-white/60 mb-3">{t("payroll:sp_custom_hint")}</p>
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {activeEmps.map((emp) => {
                    const checked = selectedCustomIds.has(emp.id);
                    return (
                      <div key={emp.id}
                        className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all ${checked ? "border-purple-300 bg-purple-50 dark:bg-purple-500/10" : "border-slate-100 dark:border-white/5"}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCustom(emp.id)}
                          className="accent-purple-500 w-4 h-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 dark:text-white text-sm truncate">{`${emp.first_name || ""} ${emp.last_name || ""}`.trim()}</p>
                          <p className="text-xs text-slate-400">{emp.employeeCode}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total summary */}
            {targetEmps.length > 0 && selType && (
              <div className="mt-5 p-4 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200">
                <div className="flex flex-wrap gap-6 text-sm items-end">
                  <div>
                    <p className="text-xs text-teal-600 uppercase font-medium">{t("payroll:sp_employees")}</p>
                    <p className="text-2xl font-bold text-teal-700">{targetEmps.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600 uppercase font-medium">{t("payroll:sp_amount_rule")}</p>
                    <p className="text-lg font-bold text-teal-700">
                      {selType.amountMode === "fixed"
                        ? `SAR ${(selType.amountValue || 0).toLocaleString()} each`
                        : `${selType.amountValue}% ${selType.amountMode === "pct_basic" ? "of Basic" : "of Gross"}`}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-teal-600/80 mt-2">{t("payroll:sp_amount_computed_hint")}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button type="button" title={t("cancel")} onClick={() => navigate("/special-payments")}
              className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white !border-0" />
            <Button type="submit" title={t("payroll:save_sp")} icon={FiCheck} iconClass="h-4 w-4 text-white"
              btn="primary" className="!rounded-md !bg-teal-500 !border-0"
              disabled={!watchedTitle || targetEmps.length === 0 || !selType || submitting} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSpecialPayment;
