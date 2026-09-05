import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { getAppraisalById, createAppraisal, updateAppraisal } from "../performanceFakeData";
import { appraisalCycleOptions, kpiCategoryOptions } from "global/constant";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";

const { add_employee } = rafeeqi_role_ids;

const yearOpts = [2024, 2025, 2026].map((y) => ({ id: y, title: String(y) }));

const EDITABLE_STATUSES = ["Draft"];

const AddAppraisal = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const existing = useMemo(() => (id ? getAppraisalById(id) : null), [id]);
  const isRTL = i18n.language === "ar";

  const employees = useSelector(showEmployees);
  const departments = useSelector(showDepartments);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const empOpts = useMemo(
    () =>
      (employees || [])
        .filter((e) => e.status === "active")
        .map((e) => ({
          id: e.id || e._id,
          title: `${e.first_name || ""} ${e.last_name || ""} (${e.employeeCode || e.employee_id || ""})`.trim(),
          name: `${e.first_name || ""} ${e.last_name || ""}`.trim(),
        })),
    [employees],
  );

  const deptOpts = useMemo(
    () =>
      (departments || []).map((d) => ({
        id: d.name || d.title,
        title: d.name || d.title,
      })),
    [departments],
  );

  const [selEmployee, setSelEmployee] = useState(null);
  const [selReviewer, setSelReviewer] = useState(null);
  const [selDept, setSelDept] = useState(null);
  const [selCycle, setSelCycle] = useState(appraisalCycleOptions[0]);
  const [selYear, setSelYear] = useState(yearOpts[1]);
  const [kpis, setKpis] = useState([
    { category: "Productivity", goal: "", targetScore: 5, weight: 20 },
    { category: "Quality", goal: "", targetScore: 5, weight: 20 },
  ]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { period: "", selfComment: "" },
  });

  useEffect(() => {
    if (existing) {
      reset({ period: existing.period, selfComment: existing.selfComment || "" });
      setSelEmployee(empOpts.find((e) => e.id === existing.employeeId) || null);
      setSelReviewer(empOpts.find((e) => e.id === existing.reviewerId) || null);
      setSelDept(deptOpts.find((d) => d.id === existing.department) || null);
      setSelCycle(appraisalCycleOptions.find((c) => c.id === existing.cycle) || appraisalCycleOptions[0]);
      setSelYear(yearOpts.find((y) => y.id === existing.year) || yearOpts[1]);
      if (existing.kpis?.length) setKpis(existing.kpis.map((k) => ({ category: k.category, goal: k.goal, targetScore: k.targetScore, weight: k.weight })));
    }
  }, [existing, reset, empOpts, deptOpts]);

  const addKpi = () => setKpis((p) => [...p, { category: "Productivity", goal: "", targetScore: 5, weight: 10 }]);
  const removeKpi = (i) => setKpis((p) => p.filter((_, idx) => idx !== i));
  const updateKpi = (i, k, v) => setKpis((p) => p.map((item, idx) => (idx === i ? { ...item, [k]: v } : item)));

  const totalWeight = kpis.reduce((s, k) => s + Number(k.weight || 0), 0);
  const weightValid = totalWeight === 100;
  const isSelfReview = selEmployee && selReviewer && selEmployee.id === selReviewer.id;
  const canSubmit = !!selEmployee && !!selReviewer && weightValid && !isSelfReview;

  const onSubmit = (data) => {
    if (!selEmployee) { toast.error(t("performance:err_select_employee")); return; }
    if (!selReviewer) { toast.error(t("performance:err_select_reviewer", "Reviewer is required")); return; }
    if (isSelfReview) { toast.error(t("performance:err_self_review")); return; }
    if (kpis.some((k) => !k.goal?.trim() || k.goal.trim().length < 5)) {
      toast.error(t("performance:err_kpi_goal", "Each KPI goal is required (min 5 characters)"));
      return;
    }
    if (!weightValid) { toast.error(t("performance:err_weight_total", { total: totalWeight })); return; }

    const payload = {
      ...data,
      employeeId: selEmployee.id,
      employeeName: selEmployee.name || selEmployee.title,
      reviewerId: selReviewer?.id || "",
      reviewerName: selReviewer?.name || selReviewer?.title || "—",
      department: selDept?.id || "",
      cycle: selCycle?.id || "Annual",
      year: selYear?.id || 2025,
      kpis: kpis.map((k, i) => ({ ...k, id: `kpi-new-${i}`, achievedScore: null, comments: "" })),
    };

    if (isEdit) {
      if (existing && !EDITABLE_STATUSES.includes(existing.status)) {
        toast.error(t("performance:not_found"));
        navigate("/performance");
        return;
      }
      updateAppraisal(id, payload);
      toast.success(t("performance:appraisal_updated"));
    } else {
      createAppraisal(payload);
      toast.success(t("performance:appraisal_created"));
    }
    navigate("/performance");
  };

  const sH = "text-lg font-semibold text-slate-900 dark:text-white pb-2 mb-6 border-b border-slate-200 dark:border-white/10";

  if (!checkRoleAuth(add_employee)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/performance")} icon={isRTL ? FiArrowRight : FiArrowLeft} className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90" iconClass="!text-lg" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{isEdit ? t("performance:edit_appraisal") : t("performance:new_appraisal")}</h1>
            <p className="text-slate-500 dark:text-white/50 text-sm mt-1">{t("performance:appraisal_setup_desc")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white dark:bg-white/10 rounded-3xl border border-slate-200 dark:border-white/20 p-8 border-l-4 !border-l-[var(--color-teal-500)]">
            <h3 className={sH}>{t("performance:appraisal_details")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SelectDropdown
                label={t("performance:employee_label")}
                required
                data={empOpts}
                selected={selEmployee}
                setSelected={setSelEmployee}
                placeholder={t("performance:select_employee")}
                classes="!h-[46px] !rounded-md"
              />
              <div>
                <SelectDropdown
                  label={t("performance:reviewer_label")}
                  required
                  data={empOpts}
                  selected={selReviewer}
                  setSelected={setSelReviewer}
                  placeholder={t("performance:select_reviewer")}
                  classes="!h-[46px] !rounded-md"
                />
                {isSelfReview && <p className="text-xs text-red-500 mt-1.5">{t("performance:err_self_review")}</p>}
              </div>
              <SelectDropdown
                label={t("performance:department_label")}
                data={deptOpts}
                selected={selDept}
                setSelected={setSelDept}
                placeholder={t("performance:select_department")}
                classes="!h-[46px] !rounded-md"
              />
              <SelectDropdown
                label={t("performance:cycle_label")}
                data={appraisalCycleOptions}
                selected={selCycle}
                setSelected={setSelCycle}
                hideClear
                classes="!h-[46px] !rounded-md"
              />
              <SelectDropdown
                label={t("performance:year_label")}
                data={yearOpts}
                selected={selYear}
                setSelected={setSelYear}
                hideClear
                classes="!h-[46px] !rounded-md"
              />
              <FormInput label={t("performance:period_label")} name="period" register={register} errors={errors} pattern={/[a-zA-Z0-9\s.'-]/} maxLength={50} placeholder={t("performance:period_placeholder")} />
              <div className="md:col-span-2 lg:col-span-3">
                <FormInput label={t("performance:self_comment_label")} name="selfComment" register={register} errors={errors} maxLength={500} placeholder={t("performance:self_comment_placeholder")} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-white/10 rounded-3xl border border-slate-200 dark:border-white/20 p-8 border-l-4 !border-l-blue-400">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200 dark:border-white/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("performance:kpis_goals")}</h3>
              <span className={`text-sm font-medium ${weightValid ? "text-emerald-600" : "text-red-500"}`}>
                {t("performance:total_weight")}: {totalWeight}% {!weightValid && `(${t("performance:weight_must_be_100")})`}
              </span>
            </div>
            <div className="space-y-4 mb-4">
              {kpis.map((kpi, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                  <SelectDropdown
                    label={t("performance:category_label")}
                    labelClass="!text-xs font-medium text-slate-500"
                    data={kpiCategoryOptions}
                    selected={kpiCategoryOptions.find((c) => c.id === kpi.category) || kpiCategoryOptions[0]}
                    setSelected={(opt) => updateKpi(i, "category", opt?.id ?? kpiCategoryOptions[0].id)}
                    hideClear
                    classes="!h-10 !rounded-lg"
                  />
                  <FormInput
                    wrapperClass="md:col-span-2"
                    label={t("performance:goal_label")}
                    labelClass="!text-xs font-medium text-slate-500"
                    required
                    minLength={5}
                    maxLength={200}
                    value={kpi.goal}
                    onValueChange={(v) => updateKpi(i, "goal", v)}
                    placeholder={t("performance:goal_placeholder")}
                    inputClass="!h-10 !rounded-lg"
                  />
                  <SelectDropdown
                    label={t("performance:target_label")}
                    labelClass="!text-xs font-medium text-slate-500"
                    data={[1, 2, 3, 4, 5].map((v) => ({ id: v, title: String(v) }))}
                    selected={{ id: kpi.targetScore, title: String(kpi.targetScore) }}
                    setSelected={(opt) => updateKpi(i, "targetScore", Number(opt?.id ?? 3))}
                    hideClear
                    classes="!h-10 !rounded-lg"
                  />
                  <div className="flex items-end gap-2">
                    <FormInput
                      wrapperClass="flex-1"
                      label={t("performance:weight_label")}
                      labelClass="!text-xs font-medium text-slate-500"
                      type="number"
                      min={1}
                      max={100}
                      value={kpi.weight}
                      onValueChange={(v) => updateKpi(i, "weight", Number(v))}
                      inputClass="!h-10 !rounded-lg"
                    />
                    <button type="button" onClick={() => removeKpi(i)} disabled={kpis.length === 1} className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-100 disabled:opacity-30 shrink-0">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" title={t("performance:add_kpi")} icon={FiPlus} iconClass="h-3.5 w-3.5" onClick={addKpi} className="!w-auto !h-9 !px-3 !rounded-lg !bg-teal-50 dark:!bg-teal-500/10 !text-teal-600 dark:!text-teal-300 !border-0 !text-sm" />
          </div>

          <div className="flex flex-wrap gap-3 justify-end">
            <Button type="button" title={t("cancel")} onClick={() => navigate("/performance")} className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
            <Button
              type="submit"
              title={isEdit ? t("performance:update_appraisal") : t("performance:create_appraisal")}
              btn="primary"
              disabled={!canSubmit}
              className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0 disabled:!opacity-50"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAppraisal;
