import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiPrinter, FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import Button from "components/Button";
import FormInput from "components/FormInput";
import { RUN_STATUS, RUN_STATUS_BADGE } from "global/constant";
import {
  fetchPayrollRunById,
  showCurrentRun,
  showCurrentRunLoading,
  clearCurrentRun,
  recomputePayrollLine,
  submitPayrollRun,
  approvePayrollRun,
  rejectPayrollRun,
  processPayrollRun,
  markPayrollRunPaid,
  cancelPayrollRun,
} from "store/slices/payrollBatchSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { SkeletonDetail } from "components/Skeleton";
import { checkRoleAuth, formatAmount } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import AuditMeta from "components/AuditMeta";

const { view_payroll_run, edit_payroll_run, process_payroll_run } = alqadar_role_ids;

const ActionBar = ({ run, onAction, canEdit, canProcess }) => {
  const { t } = useTranslation();
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const showDraft = run.status === RUN_STATUS.DRAFT && canEdit;
  const showPending = run.status === RUN_STATUS.PENDING_APPROVAL && canEdit;
  const showProcess = run.status === RUN_STATUS.APPROVED && canProcess;
  const showMarkPaid = run.status === RUN_STATUS.PROCESSING && (canEdit || canProcess);

  if (!showDraft && !showPending && !showProcess && !showMarkPaid) return null;

  return (
    <div className="p-4 rounded-2xl border-2 border-teal-200 bg-teal-50 dark:bg-teal-500/10 dark:border-teal-500/30">
      <p className="text-sm font-semibold text-teal-800 dark:text-teal-300 mb-3">{t("payroll:available_actions")}</p>
      <div className="flex flex-wrap gap-2">
        {showDraft && (
          <>
            <Button type="button" title={t("payroll:submit_approval")} btn="primary"
              onClick={() => onAction(submitPayrollRun({ id: run.id }))}
              className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-amber-500 hover:!bg-amber-600" />
            <Button type="button" title={t("payroll:cancel_run")}
              onClick={() => onAction(cancelPayrollRun({ id: run.id }))}
              className="!w-auto !rounded-lg !h-9 !px-4 !bg-rose-100 !text-rose-700 dark:!bg-rose-500/20 dark:!text-rose-300" />
          </>
        )}
        {showPending && (
          <>
            <Button type="button" title={t("payroll:approve")} btn="primary"
              onClick={() => onAction(approvePayrollRun({ id: run.id }))}
              className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-blue-500 hover:!bg-blue-600" />
            <Button type="button" title={t("payroll:reject")}
              onClick={() => setShowReject(true)}
              className="!w-auto !rounded-lg !h-9 !px-4 !bg-rose-100 !text-rose-700 dark:!bg-rose-500/20 dark:!text-rose-300" />
          </>
        )}
        {showProcess && (
          <Button type="button" title={t("payroll:process_payroll")} btn="primary"
            onClick={() => onAction(processPayrollRun({ id: run.id }))}
            className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-purple-500 hover:!bg-purple-600" />
        )}
        {showMarkPaid && (
          <Button type="button" title={t("payroll:mark_paid")} btn="primary"
            onClick={() => onAction(markPayrollRunPaid({ id: run.id }))}
            className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-emerald-500 hover:!bg-emerald-600" />
        )}
      </div>
      {showPending && showReject && (
        <div className="mt-3">
          <FormInput
            value={rejectReason}
            onValueChange={setRejectReason}
            placeholder={t("payroll:reject_reason")}
            inputClass="!h-10 !rounded-lg"
            wrapperClass="w-full mb-2"
          />
          <div className="flex gap-2">
            <Button type="button" title={t("payroll:confirm_reject")}
              onClick={() => { onAction(rejectPayrollRun({ id: run.id, data: { reason: rejectReason } })); setShowReject(false); }}
              className="!w-auto !rounded-lg !h-8 !px-3 !text-xs !border-0 !text-white !bg-rose-500" />
            <Button type="button" title={t("cancel")} onClick={() => setShowReject(false)}
              className="!w-auto !rounded-lg !h-8 !px-3 !text-xs !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

const RunDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isRTL = i18n.language === "ar";
  const [deptFilter, setDeptFilter] = useState("All");
  const [empSearch, setEmpSearch] = useState("");
  const [activeTab, setActiveTab] = useState("employees");
  const [editingOtId, setEditingOtId] = useState(null);
  const [editingOtVal, setEditingOtVal] = useState("");
  const [editingBonusId, setEditingBonusId] = useState(null);
  const [editingBonusVal, setEditingBonusVal] = useState("");

  const run = useSelector(showCurrentRun);
  const loading = useSelector(showCurrentRunLoading);
  const employees = useSelector(showEmployees);
  const departments = useSelector(showDepartments);

  useEffect(() => {
    dispatch(fetchPayrollRunById(id));
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
    return () => dispatch(clearCurrentRun());
  }, [dispatch, id]);

  const onAction = (thunk) => { dispatch(thunk).then(() => dispatch(fetchPayrollRunById(id))); };

  const employeesById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const departmentsById = useMemo(() => Object.fromEntries(departments.map((d) => [d.id, d.name])), [departments]);

  const lines = useMemo(() => {
    if (!run) return [];
    return (run.employees || []).map((e) => {
      const emp = employeesById[e.employeeId];
      const employeeName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "—";
      const department = emp?.departmentId ? departmentsById[emp.departmentId] || "—" : "—";
      return { ...e, employeeName, employeeIdNo: emp?.employeeCode || "—", department };
    });
  }, [run, employeesById, departmentsById]);

  if (!checkRoleAuth(view_payroll_run)) return null;

  if (loading && !run) return <SkeletonDetail fields={9} />;

  if (!run) return (
    <div className="p-8 text-center">
      <p className="text-slate-600 dark:text-white/70">{t("no_record_found")}</p>
      <Button title={t("back")} onClick={() => navigate("/payroll-batch")} className="mt-4" />
    </div>
  );

  const canEdit = checkRoleAuth(edit_payroll_run);
  const canProcess = checkRoleAuth(process_payroll_run);

  const monthLabel = run.month ? new Date(`${run.month}-01`).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—";
  const depts = ["All", ...new Set(lines.map((e) => e.department))];
  const filteredEmps = lines.filter(
    (e) =>
      (deptFilter === "All" || e.department === deptFilter) &&
      (!empSearch || e.employeeName.toLowerCase().includes(empSearch.toLowerCase())),
  );

  const TABS = [
    { id: "employees", label: t("payroll:employees_tab") },
    { id: "summary", label: t("payroll:summary_tab") },
    { id: "bank", label: t("payroll:bank_transfer_tab") },
  ];

  const deptSummary = Object.entries(
    lines.reduce((acc, e) => {
      if (!acc[e.department]) acc[e.department] = { dept: e.department, count: 0, gross: 0, net: 0, ded: 0 };
      acc[e.department].count++;
      acc[e.department].gross += e.grossEarnings || 0;
      acc[e.department].net += e.netPay || 0;
      acc[e.department].ded += e.totalDeductions || 0;
      return acc;
    }, {}),
  ).map(([, v]) => v);

  const submitOt = (employeeId) => {
    dispatch(recomputePayrollLine({ runId: run.id, employeeId, data: { overtimeHours: parseFloat(editingOtVal) || 0 } }))
      .then(() => { dispatch(fetchPayrollRunById(id)); setEditingOtId(null); });
  };
  const submitBonus = (employeeId) => {
    dispatch(recomputePayrollLine({ runId: run.id, employeeId, data: { bonus: parseFloat(editingBonusVal) || 0 } }))
      .then(() => { dispatch(fetchPayrollRunById(id)); setEditingBonusId(null); });
  };

  return (
    <div className="relative min-h-[60vh]">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1] space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/payroll-batch")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{run.runNumber}</h1>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${RUN_STATUS_BADGE[run.status] || ""}`}>
                {run.status}
              </span>
            </div>
            <p className="text-mutedForeground mt-0.5">{monthLabel} · {lines.length} {t("payroll:employees")} · SAR {formatAmount(run.totalNet)} {t("payroll:net")}</p>
          </div>
        </div>

        {/* Action bar */}
        {run.status !== RUN_STATUS.PAID && run.status !== RUN_STATUS.CANCELLED && (
          <ActionBar run={run} onAction={onAction} canEdit={canEdit} canProcess={canProcess} />
        )}

        {/* Summary strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: t("payroll:total_employees"), value: lines.length, cls: "text-slate-700 dark:text-white" },
            { label: t("payroll:total_gross"), value: `SAR ${formatAmount(run.totalGross)}`, cls: "text-slate-700 dark:text-white" },
            { label: t("payroll:total_deductions"), value: `SAR ${formatAmount(run.totalDeductions)}`, cls: "text-rose-600" },
            { label: t("payroll:total_net"), value: `SAR ${formatAmount(run.totalNet)}`, cls: "text-emerald-600 text-lg font-bold" },
            { label: t("payroll:employer_cost"), value: `SAR ${formatAmount(run.totalEmployerCost)}`, cls: "text-purple-600" },
          ].map((c) => (
            <div key={c.label} className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-white/60 mb-1">{c.label}</p>
              <p className={`font-bold text-sm ${c.cls}`}>{c.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-4 grid sm:grid-cols-2 gap-4">
          <AuditMeta record={run} />
        </div>

        {/* Approval trail */}
        {(run.approvedOn || run.processedOn) && (
          <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-4 flex flex-wrap gap-6 text-sm">
            {run.approvedOn && (
              <div>
                <p className="text-xs text-slate-500 dark:text-white/60">{t("payroll:approved_by")}</p>
                <p className="font-semibold text-blue-600">{new Date(run.approvedOn).toLocaleDateString()}</p>
              </div>
            )}
            {run.processedOn && (
              <div>
                <p className="text-xs text-slate-500 dark:text-white/60">{t("payroll:processed_on")}</p>
                <p className="font-semibold text-emerald-600">{new Date(run.processedOn).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-white/5 rounded-xl p-1 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-white/20 text-teal-600 shadow"
                    : "text-slate-600 dark:text-white/60 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Employees ── */}
          {activeTab === "employees" && (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                <FormInput
                  value={empSearch}
                  onValueChange={setEmpSearch}
                  placeholder={t("payroll:search_emp")}
                  inputClass="!h-9 !rounded-lg"
                  wrapperClass="flex-1 min-w-[160px]"
                />
                <div className="flex gap-2 flex-wrap">
                  {depts.map((d) => (
                    <button key={d} type="button" onClick={() => setDeptFilter(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${deptFilter === d ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-teal-50"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
                <table className="w-full text-sm min-w-[1200px]">
                  <thead>
                    <tr className="bg-[var(--color-teal-500)]">
                      {[t("payroll:employee"), t("payroll:basic"), "HRA", t("payroll:allowances"), t("payroll:ot_hours_col"), t("payroll:ot_rate_col"), t("payroll:ot_amount_col"), t("payroll:bonus_col"), t("payroll:gross"), "PF", t("payroll:loan_ded"), t("payroll:tax"), t("payroll:net_pay"), t("payroll:payment_status"), ""].map((h) => (
                        <th key={h} className="px-3 py-3 text-start font-semibold text-white/90 text-xs whitespace-nowrap first:pl-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmps.map((e) => {
                      const canEditLine = canEdit && run.status === RUN_STATUS.DRAFT;
                      const isEditingThisOt = editingOtId === e.employeeId;
                      const isEditingThisBonus = editingBonusId === e.employeeId;
                      return (
                        <tr key={e.employeeId} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10">
                          <td className="px-3 py-3 pl-5">
                            <p className="font-semibold text-slate-800 dark:text-white">{e.employeeName}</p>
                            <p className="text-xs text-slate-400">{e.employeeIdNo} · {e.department}</p>
                          </td>
                          <td className="px-3 py-3 text-xs">{formatAmount(e.basic)}</td>
                          <td className="px-3 py-3 text-xs">{formatAmount(e.hra)}</td>
                          <td className="px-3 py-3 text-xs text-teal-600">{formatAmount((e.medical || 0) + (e.transport || 0) + (e.food || 0) + (e.mobile || 0))}</td>
                          {/* OT Hours — editable */}
                          <td className="px-3 py-3 text-xs">
                            {canEditLine && isEditingThisOt ? (
                              <div className="flex items-center gap-1">
                                <FormInput type="number" min={0} decimal decimalPlaces={2} value={editingOtVal} onValueChange={setEditingOtVal}
                                  inputClass="!w-14 !h-7 !rounded !px-1.5 !py-0 !text-xs !text-center" wrapperClass="w-14" />
                                <button type="button" onClick={() => submitOt(e.employeeId)} className="text-emerald-600"><FiCheck className="h-3.5 w-3.5" /></button>
                                <button type="button" onClick={() => setEditingOtId(null)} className="text-slate-400"><FiX className="h-3.5 w-3.5" /></button>
                              </div>
                            ) : (
                              <span className="flex items-center gap-1 group">
                                <span className="font-medium text-amber-700 dark:text-amber-300">{e.overtimeHours ?? 0} hrs</span>
                                {canEditLine && (
                                  <button type="button" onClick={() => { setEditingOtId(e.employeeId); setEditingOtVal(String(e.overtimeHours ?? 0)); }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-500 transition-opacity">
                                    <FiEdit2 className="h-3 w-3" />
                                  </button>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-500">SAR {formatAmount(e.overtimeRate)}</td>
                          <td className="px-3 py-3 text-xs font-semibold text-amber-600">SAR {formatAmount(e.overtime)}</td>
                          {/* Bonus — editable */}
                          <td className="px-3 py-3 text-xs">
                            {canEditLine && isEditingThisBonus ? (
                              <div className="flex items-center gap-1">
                                <FormInput type="number" min={0} decimal decimalPlaces={2} value={editingBonusVal} onValueChange={setEditingBonusVal}
                                  inputClass="!w-20 !h-7 !rounded !px-1.5 !py-0 !text-xs !text-center" wrapperClass="w-20" />
                                <button type="button" onClick={() => submitBonus(e.employeeId)} className="text-emerald-600"><FiCheck className="h-3.5 w-3.5" /></button>
                                <button type="button" onClick={() => setEditingBonusId(null)} className="text-slate-400"><FiX className="h-3.5 w-3.5" /></button>
                              </div>
                            ) : (
                              <span className="flex items-center gap-1 group">
                                <span className="font-semibold text-purple-600 dark:text-purple-400">SAR {formatAmount(e.bonus)}</span>
                                {canEditLine && (
                                  <button type="button" onClick={() => { setEditingBonusId(e.employeeId); setEditingBonusVal(String(e.bonus ?? 0)); }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-purple-500 transition-opacity">
                                    <FiEdit2 className="h-3 w-3" />
                                  </button>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-xs font-semibold">{formatAmount(e.grossEarnings)}</td>
                          <td className="px-3 py-3 text-xs text-rose-500">{formatAmount(e.pfEmployee)}</td>
                          <td className="px-3 py-3 text-xs text-rose-500">{formatAmount(e.loanDeduction)}</td>
                          <td className="px-3 py-3 text-xs text-rose-500">{formatAmount(e.incomeTax)}</td>
                          <td className="px-3 py-3 font-bold text-emerald-600 text-sm">{formatAmount(e.netPay)}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {e.paymentStatus}
                            </span>
                          </td>
                          <td className="px-3 py-3 pr-5">
                            <Link to={`/payroll-batch/payslip/${run.id}/${e.employeeId}`}
                              className="text-xs text-teal-600 hover:underline flex items-center gap-1">
                              <FiPrinter className="h-3 w-3" />{t("payroll:payslip")}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {canEdit && run.status === RUN_STATUS.DRAFT && (
                <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                  <FiEdit2 className="h-3 w-3" /> {t("payroll:ot_bonus_edit_hint")}
                </p>
              )}
            </>
          )}

          {/* ── Tab: Summary (dept-wise) ── */}
          {activeTab === "summary" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 dark:text-white">{t("payroll:dept_summary")}</h3>
              <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-teal-500)]">
                      {[t("payroll:department"), t("payroll:employees"), t("payroll:gross"), t("payroll:deductions"), t("payroll:net_pay"), "% of Total"].map((h) => (
                        <th key={h} className="px-5 py-3 text-start font-semibold text-white/90 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deptSummary.map((d) => (
                      <tr key={d.dept} className="border-b border-slate-100 dark:border-white/5">
                        <td className="px-5 py-3 font-semibold text-slate-800 dark:text-white">{d.dept}</td>
                        <td className="px-5 py-3 text-center">{d.count}</td>
                        <td className="px-5 py-3">SAR {formatAmount(d.gross)}</td>
                        <td className="px-5 py-3 text-rose-600">SAR {formatAmount(d.ded)}</td>
                        <td className="px-5 py-3 font-bold text-emerald-600">SAR {formatAmount(d.net)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full"
                                style={{ width: `${run.totalNet ? Math.round((d.net / run.totalNet) * 100) : 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-600">{run.totalNet ? Math.round((d.net / run.totalNet) * 100) : 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Component breakdown */}
              <h3 className="font-semibold text-slate-800 dark:text-white mt-6">{t("payroll:component_breakdown")}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { label: t("payroll:basic"), value: lines.reduce((s, e) => s + (e.basic || 0), 0), cls: "text-teal-600" },
                  { label: "HRA", value: lines.reduce((s, e) => s + (e.hra || 0), 0), cls: "text-teal-500" },
                  { label: t("payroll:medical"), value: lines.reduce((s, e) => s + (e.medical || 0), 0), cls: "text-teal-400" },
                  { label: t("payroll:transport"), value: lines.reduce((s, e) => s + (e.transport || 0), 0), cls: "text-teal-400" },
                  { label: t("payroll:overtime"), value: lines.reduce((s, e) => s + (e.overtime || 0), 0), cls: "text-purple-600" },
                  { label: t("payroll:bonus"), value: lines.reduce((s, e) => s + (e.bonus || 0), 0), cls: "text-purple-500" },
                  { label: "PF (Emp)", value: lines.reduce((s, e) => s + (e.pfEmployee || 0), 0), cls: "text-rose-500" },
                  { label: "PF (Emp'r)", value: lines.reduce((s, e) => s + (e.pfEmployer || 0), 0), cls: "text-rose-400" },
                  { label: t("payroll:loan_ded"), value: lines.reduce((s, e) => s + (e.loanDeduction || 0), 0), cls: "text-rose-500" },
                  { label: t("payroll:tax"), value: lines.reduce((s, e) => s + (e.incomeTax || 0), 0), cls: "text-rose-500" },
                  { label: t("payroll:insurance"), value: lines.reduce((s, e) => s + (e.insurance || 0), 0), cls: "text-rose-400" },
                ].map((c) => (
                  <div key={c.label} className="bg-slate-50 dark:bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-slate-500 dark:text-white/60">{c.label}</p>
                    <p className={`font-bold text-sm mt-0.5 ${c.cls}`}>SAR {formatAmount(c.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab: Bank Transfer ── */}
          {activeTab === "bank" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-white">{t("payroll:bank_transfer_list")}</h3>
              </div>
              <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-[var(--color-teal-500)]">
                      {["#", t("payroll:employee"), t("payroll:net_pay"), t("payroll:payment_ref"), t("payroll:payment_status")].map((h) => (
                        <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs whitespace-nowrap first:pl-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((e, idx) => (
                      <tr key={e.employeeId} className="border-b border-slate-100 dark:border-white/5">
                        <td className="px-4 py-3 pl-5 text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 dark:text-white">{e.employeeName}</p>
                          <p className="text-xs text-slate-400">{e.employeeIdNo}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600">SAR {formatAmount(e.netPay)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{e.paymentRef || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {e.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 dark:bg-white/5 font-bold">
                      <td colSpan={2} className="px-4 py-3 pl-5 text-slate-700 dark:text-white">{t("payroll:total")}</td>
                      <td className="px-4 py-3 text-emerald-600">SAR {formatAmount(run.totalNet)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RunDetail;
