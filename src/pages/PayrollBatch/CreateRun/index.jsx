import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiCheck } from "react-icons/fi";
import Button from "components/Button";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { createPayrollRun } from "store/slices/payrollBatchSlice";

const STEPS = ["payroll:step_config", "payroll:step_employees"];

const CreateRun = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isRTL = i18n.language === "ar";
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const employees = useSelector(showEmployees);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Probation employees are already drawing salary and should be payable
  // too — only genuinely inactive statuses (resigned/retired/terminated/
  // absconding) are excluded.
  const activeEmps = employees.filter((e) => e.status === "active" || e.status === "probation");

  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [notes, setNotes] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSelectedIds(new Set(activeEmps.map((e) => e.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees.length]);

  const filteredEmps = activeEmps.filter(
    (e) =>
      !search ||
      `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeCode?.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleAll = () => {
    if (selectedIds.size === activeEmps.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(activeEmps.map((e) => e.id)));
  };

  const toggle = (id) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleCreate = async () => {
    setSubmitting(true);
    const result = await dispatch(
      createPayrollRun({ month, employeeIds: [...selectedIds], notes }),
    );
    setSubmitting(false);
    if (createPayrollRun.fulfilled.match(result) && result.payload?.id) {
      navigate(`/payroll-batch/details/${result.payload.id}`);
    }
  };

  const panelCls = "bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]";

  return (
    <div className="relative min-h-[60vh]">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1]">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/payroll-batch")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("payroll:new_run")}</h1>
            <p className="text-mutedForeground">{t("payroll:create_desc")}</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  i === step
                    ? "bg-teal-500 text-white"
                    : i < step
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"
                }`}
                onClick={() => i < step && setStep(i)}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    i < step ? "bg-emerald-500 text-white" : i === step ? "bg-white/30 text-white" : "bg-slate-300 text-slate-600"
                  }`}
                >
                  {i < step ? <FiCheck /> : i + 1}
                </span>
                {t(s)}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 ${i < step ? "bg-emerald-400" : "bg-slate-200 dark:bg-white/20"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 0: Config ── */}
        {step === 0 && (
          <div className={panelCls}>
            <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-5">{t("payroll:run_config")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-linkText leading-6 mb-1 block">
                  {t("payroll:payroll_month")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  max={new Date().toISOString().slice(0, 7)}
                  className="w-full h-[46px] rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-0"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-linkText leading-6 mb-1 block">
                  {t("payroll:notes")}
                </label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("payroll:notes_placeholder")}
                  className="w-full h-[46px] rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm text-slate-900 dark:text-white focus:border-teal-500 focus:outline-0"
                />
              </div>
            </div>

            {/* auto-deductions note */}
            <div className="mt-6 p-4 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: "💰", label: t("payroll:auto_loan"), desc: t("payroll:auto_loan_desc") },
                { icon: "🏦", label: t("payroll:auto_pf"), desc: t("payroll:auto_pf_desc") },
                { icon: "📅", label: t("payroll:auto_attend"), desc: t("payroll:auto_attend_desc") },
              ].map((item) => (
                <div key={item.label} className="flex gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">{item.label}</p>
                    <p className="text-xs text-teal-700 dark:text-teal-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-7 pt-5 border-t border-slate-200 dark:border-white/20">
              <Button
                type="button"
                title={t("payroll:next_employees")}
                onClick={() => setStep(1)}
                btn="primary"
                className="!rounded-md !bg-teal-500 !border-0"
              />
            </div>
          </div>
        )}

        {/* ── STEP 1: Select Employees ── */}
        {step === 1 && (
          <div className={panelCls}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h3 className="font-semibold text-lg text-slate-800 dark:text-white">{t("payroll:select_employees")}</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 dark:text-white/60">
                  {selectedIds.size} {t("payroll:selected")}
                </span>
                <button type="button" onClick={toggleAll} className="text-xs text-teal-600 underline">
                  {selectedIds.size === activeEmps.length ? t("payroll:deselect_all") : t("payroll:select_all")}
                </button>
              </div>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("payroll:search_emp")}
              className="w-full h-10 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm mb-4 focus:border-teal-500 focus:outline-0"
            />

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {filteredEmps.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">{t("no_record_found")}</p>
              )}
              {filteredEmps.map((emp) => {
                const checked = selectedIds.has(emp.id);
                return (
                  <label
                    key={emp.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      checked
                        ? "border-teal-400 bg-teal-50 dark:bg-teal-500/10"
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(emp.id)}
                      className="accent-teal-500 w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">{`${emp.first_name || ""} ${emp.last_name || ""}`.trim()}</p>
                      <p className="text-xs text-slate-500 dark:text-white/60">{emp.employeeCode}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      {emp.status}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-between mt-7 pt-5 border-t border-slate-200 dark:border-white/20">
              <Button
                type="button"
                title={t("back")}
                onClick={() => setStep(0)}
                className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
              />
              <Button
                type="button"
                title={t("payroll:create_run")}
                onClick={handleCreate}
                disabled={selectedIds.size === 0 || submitting}
                icon={FiCheck}
                iconClass="h-4 w-4 text-white"
                btn="primary"
                className="!rounded-md !bg-teal-500 !border-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateRun;
