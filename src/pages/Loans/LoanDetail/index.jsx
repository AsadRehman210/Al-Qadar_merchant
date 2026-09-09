import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight, FiCheck, FiX, FiFileText, FiAlertTriangle } from "react-icons/fi";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import Button from "components/Button";
import FormInput from "components/FormInput";
import { checkRoleAuth, formatAmount } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import {
  fetchLoanById,
  showCurrentLoan,
  showCurrentLoanLoading,
  clearCurrentLoan,
  managerApprove,
  managerReject,
  hrApprove,
  hrReject,
  disburseLoan,
  preCloseLoan,
  recordRepayment,
} from "store/slices/loanSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { SkeletonDetail } from "components/Skeleton";

const { view_loan, edit_loan, approve_loan } = alqadar_role_ids;

const TAB_CLASS =
  "min-w-[140px] whitespace-nowrap cursor-pointer py-3 px-5 rounded-lg h-11 flex justify-center items-center font-medium text-sm text-slate-500 dark:text-white/70 transition-all outline-none data-[selected]:bg-[var(--color-teal-500)] data-[selected]:text-white data-[selected]:font-semibold hover:text-teal-700 hover:bg-teal-500/10 dark:hover:text-white dark:hover:bg-teal-500/20";

import { loanStatusBadge as STATUS_BADGE } from "global/constant";

const StatusFlow = ({ status, appliedVia }) => {
  if (status === "Rejected") {
    return <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-rose-100 text-rose-700 flex items-center gap-1"><FiX /> Rejected</span>;
  }
  const FLOW_STEPS = appliedVia === "employee"
    ? ["Pending Manager", "Pending HR", "Approved", "Ongoing", "Completed"]
    : ["Pending", "Approved", "Ongoing", "Completed"];
  const activeIdx = FLOW_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-0 flex-wrap">
      {FLOW_STEPS.map((step, idx) => (
        <div key={step} className="flex items-center">
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold ${idx <= activeIdx ? "bg-teal-500 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-400"}`}>
            {idx < activeIdx ? <FiCheck className="h-3 w-3" /> : <span>{idx + 1}.</span>} {step}
          </div>
          {idx < FLOW_STEPS.length - 1 && <div className={`h-0.5 w-5 ${idx < activeIdx ? "bg-teal-400" : "bg-slate-200 dark:bg-white/10"}`} />}
        </div>
      ))}
    </div>
  );
};

// This loan's workflow is entirely server-driven state transitions (manager
// approve/reject -> hr approve/reject -> disburse -> repayment/preclose) —
// there is no edit or delete endpoint, and no document upload/download
// endpoint (documents are metadata set once at apply time), so those actions
// from the old fake-data version are gone rather than left silently broken.
const LoanDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const loan = useSelector(showCurrentLoan);
  const loanLoading = useSelector(showCurrentLoanLoading);
  const employees = useSelector(showEmployees);

  useEffect(() => {
    dispatch(fetchLoanById(id));
    dispatch(fetchEmployees());
    return () => dispatch(clearCurrentLoan());
  }, [id, dispatch]);

  const employee = useMemo(() => employees.find((e) => e.id === loan?.employeeId), [employees, loan]);

  const [busy, setBusy] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showPreClose, setShowPreClose] = useState(false);
  const [pcAmount, setPcAmount] = useState("");

  if (!checkRoleAuth(view_loan)) return null;

  if (loanLoading && (!loan || loan.id !== id)) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!loan || loan.id !== id) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("no_record_found")}</p>
        <Button title={t("back")} onClick={() => navigate("/loans")} className="mt-4" />
      </div>
    );
  }

  const panelClass = "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60";

  const runAction = async (thunk, data, successMsg) => {
    setBusy(true);
    try {
      await dispatch(thunk({ id, data })).unwrap();
      await dispatch(fetchLoanById(id));
      toast.success(successMsg);
    } catch (err) {
      toast.error(err || t("loans:action_failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = () => runAction(hrApprove, undefined, t("loans:loan_approved")).then(() => setShowApproveModal(false));
  const handleReject = () => runAction(hrReject, { rejectionReason: rejectReason }, t("loans:loan_rejected")).then(() => setShowRejectModal(false));
  const handleManagerApprove = () => runAction(managerApprove, undefined, t("loans:loan_approved"));
  const handleManagerReject = () => runAction(managerReject, { comments: t("loans:rejected_by_manager") }, t("loans:loan_rejected"));
  const handleDisburse = () => runAction(disburseLoan, undefined, t("loans:loan_disbursed"));
  const handlePreClose = () =>
    runAction(preCloseLoan, pcAmount ? { preClosureAmount: parseFloat(pcAmount) } : undefined, t("loans:loan_preclosed")).then(() =>
      setShowPreClose(false),
    );
  const handleRepay = async (installmentNo) => {
    setBusy(true);
    try {
      await dispatch(recordRepayment({ id, installmentNo })).unwrap();
      await dispatch(fetchLoanById(id));
      toast.success(t("loans:installment_paid"));
    } catch (err) {
      toast.error(err || t("loans:action_failed"));
    } finally {
      setBusy(false);
    }
  };

  const schedule = loan.emiSchedule || [];
  const paidAmount = schedule.filter((r) => r.paid).reduce((s, r) => s + (r.emiAmount || 0), 0);
  const remainingAmount = schedule.length
    ? schedule.filter((r) => !r.paid).reduce((s, r) => s + (r.emiAmount || 0), 0)
    : loan.loanAmount || 0;
  const progressPct = loan.loanAmount > 0 ? Math.min(100, Math.round((paidAmount / loan.loanAmount) * 100)) : 0;
  const employeeName = employee ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim() : loan.employeeId;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/loans")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{loan.loanNumber} — {employeeName}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[loan.status] || ""}`}>{loan.status}</span>
            </div>
            <p className="text-mutedForeground text-sm mt-1">{loan.loanType} · {loan.loanPurpose} · {loan.numberOfInstallments} months</p>
          </div>
        </div>

        {/* Status flow */}
        <div className="mb-5 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl px-5 py-3 overflow-x-auto">
          <StatusFlow status={loan.status} appliedVia={loan.appliedVia} />
        </div>

        {/* Action bar — Line manager stage (employee-applied loans) */}
        {checkRoleAuth(approve_loan) && loan.status === "Pending Manager" && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-200 dark:border-amber-500/30">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
              <FiAlertTriangle className="h-4 w-4" /> {t("requests:manager_approvals")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" title={t("loans:approve_loan")} disabled={busy} onClick={handleManagerApprove}
                className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-emerald-500 hover:!bg-emerald-600" />
              <Button type="button" title={t("loans:reject_loan")} disabled={busy} onClick={handleManagerReject}
                className="!w-auto !rounded-lg !h-9 !px-4 !bg-rose-100 !text-rose-700 dark:!bg-rose-500/20 dark:!text-rose-300" />
            </div>
          </div>
        )}

        {/* Action bar — HR stage (Pending HR or HR-direct Pending) */}
        {checkRoleAuth(approve_loan) && (loan.status === "Pending" || loan.status === "Pending HR") && (
          <div className="mb-5 p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-200 dark:border-blue-500/30">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
              <FiAlertTriangle className="h-4 w-4" /> {loan.status === "Pending HR" ? t("requests:hr_approvals") : t("loans:awaiting_approval")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" title={t("loans:approve_loan")} onClick={() => setShowApproveModal(true)}
                className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-emerald-500 hover:!bg-emerald-600" />
              <Button type="button" title={t("loans:reject_loan")} onClick={() => setShowRejectModal(true)}
                className="!w-auto !rounded-lg !h-9 !px-4 !bg-rose-100 !text-rose-700 dark:!bg-rose-500/20 dark:!text-rose-300" />
            </div>

            {showApproveModal && (
              <div className="mt-4 p-4 bg-white dark:bg-white/10 rounded-xl border border-emerald-300">
                <p className="text-sm font-semibold text-slate-800 dark:text-white mb-2">{t("loans:approve_loan")}?</p>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={busy} onClick={handleApprove} className="h-9 px-3 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600"><FiCheck /></button>
                  <button type="button" onClick={() => setShowApproveModal(false)} className="h-9 px-3 rounded-lg bg-slate-200 dark:bg-white/20 text-slate-600 dark:text-white text-sm hover:bg-slate-300"><FiX /></button>
                </div>
              </div>
            )}
            {showRejectModal && (
              <div className="mt-4 p-4 bg-white dark:bg-white/10 rounded-xl border border-rose-300">
                <p className="text-sm font-semibold text-slate-800 dark:text-white mb-2">{t("loans:reject_reason")}</p>
                <div className="flex gap-2">
                  <FormInput
                    value={rejectReason}
                    onValueChange={setRejectReason}
                    placeholder={t("loans:reject_reason_placeholder")}
                    inputClass="!h-9"
                    wrapperClass="flex-1"
                  />
                  <button type="button" disabled={busy} onClick={handleReject} className="h-9 px-3 rounded-lg bg-rose-500 text-white text-sm font-semibold"><FiCheck /></button>
                  <button type="button" onClick={() => setShowRejectModal(false)} className="h-9 px-3 rounded-lg bg-slate-200 dark:bg-white/20 text-slate-600 dark:text-white text-sm"><FiX /></button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action bar — Approved, awaiting disbursement */}
        {checkRoleAuth(edit_loan) && loan.status === "Approved" && (
          <div className="mb-5 p-4 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border-2 border-teal-200 dark:border-teal-500/30 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">{t("loans:ready_to_disburse")}</p>
            <Button type="button" title={t("loans:disburse_loan")} disabled={busy} onClick={handleDisburse}
              className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-teal-600 hover:!bg-teal-700" />
          </div>
        )}

        {/* Rejection banner */}
        {loan.status === "Rejected" && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2"><FiX /> {t("loans:loan_rejected")}</p>
            {loan.rejectionReason && <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">{t("loans:reject_reason")}: {loan.rejectionReason}</p>}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10">
            <p className="text-xs text-slate-500 dark:text-white/60">{t("loans:loan_amount")}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">SAR {formatAmount(loan.loanAmount)}</p>
          </div>
          <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10">
            <p className="text-xs text-emerald-600">{t("loans:paid_amount")}</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">SAR {formatAmount(paidAmount)}</p>
          </div>
          <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/10">
            <p className="text-xs text-rose-600">{t("loans:remaining_amount")}</p>
            <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">SAR {formatAmount(remainingAmount)}</p>
          </div>
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10">
            <p className="text-xs text-slate-500 dark:text-white/60">{t("loans:progress")}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{progressPct}%</p>
            <div className="mt-1.5 h-1.5 bg-slate-200 dark:bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* Pre-closure CTA */}
        {checkRoleAuth(edit_loan) && loan.status === "Ongoing" && (
          <div className="mb-5">
            <button type="button" onClick={() => setShowPreClose(!showPreClose)}
              className="px-5 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-sm font-semibold hover:bg-purple-200 transition-colors">
              {showPreClose ? t("loans:cancel") : t("loans:pre_close_loan")}
            </button>
            {showPreClose && (
              <div className="mt-3 p-5 rounded-2xl bg-white dark:bg-white/10 border-2 border-purple-200 dark:border-purple-500/30 space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-white">{t("loans:pre_closure_form")}</h4>
                <div>
                  <FormInput
                    label={t("loans:pre_closure_amount")}
                    type="number"
                    decimal
                    decimalPlaces={2}
                    min={0}
                    value={pcAmount}
                    onValueChange={setPcAmount}
                    placeholder={`Max: SAR ${formatAmount(remainingAmount)}`}
                    inputClass="!h-10"
                    labelClass="!text-xs"
                  />
                  <p className="text-xs text-slate-400 mt-1">{t("loans:pre_closure_amount_hint")}</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="button" title={t("loans:confirm_pre_close")} disabled={busy} onClick={handlePreClose}
                    className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-purple-500 hover:!bg-purple-600 disabled:opacity-40" />
                  <Button type="button" title={t("cancel")} onClick={() => setShowPreClose(false)}
                    className="!w-auto !rounded-lg !h-9 !px-4 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <TabGroup>
          <TabList className="inline-flex items-center gap-1.5 p-1.5 rounded-lg mb-6 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20">
            <Tab className={TAB_CLASS}>{t("loans:loan_info")}</Tab>
            <Tab className={TAB_CLASS}>
              {t("loans:documents")}
              {loan.documents?.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-teal-500 text-white">{loan.documents.length}</span>
              )}
            </Tab>
            <Tab className={TAB_CLASS}>{t("loans:emi_schedule")}</Tab>
          </TabList>

          <TabPanels>
            {/* Loan Info tab */}
            <TabPanel>
              <div className={panelClass}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: t("loans:employee"), value: employeeName },
                    { label: t("loans:loan_type"), value: loan.loanType },
                    { label: t("loans:loan_purpose"), value: loan.loanPurpose },
                    { label: t("loans:interest_percent"), value: loan.interestPercent ? `${loan.interestPercent}%` : "-" },
                    { label: t("loans:per_month_installment"), value: `SAR ${formatAmount(loan.monthlyDeduction)}` },
                    { label: t("loans:applied_via"), value: loan.appliedVia === "employee" ? t("loans:self_service") : t("loans:hr_direct") },
                  ].map((f) => (
                    <div key={f.label}>
                      <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">{f.label}</p>
                      <p className="font-semibold text-slate-900 dark:text-white mt-1">{f.value}</p>
                    </div>
                  ))}
                </div>

                {/* Guarantor */}
                {loan.guarantor?.name && (
                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/20">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4">{t("loans:guarantor")}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <p><span className="text-slate-500 dark:text-white/60">{t("loans:guarantor_name")}:</span> {loan.guarantor.name}</p>
                      <p><span className="text-slate-500 dark:text-white/60">{t("loans:guarantor_contact")}:</span> {loan.guarantor.contact || "-"}</p>
                      <p><span className="text-slate-500 dark:text-white/60">{t("loans:guarantor_address")}:</span> {loan.guarantor.address || "-"}</p>
                    </div>
                  </div>
                )}

                {/* Pre-closure record */}
                {loan.preClosureAmount != null && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/20">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-purple-600">{t("loans:pre_closure")}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <p><span className="text-slate-500 dark:text-white/60">{t("loans:pre_closure_amount")}:</span><br /><strong>SAR {formatAmount(loan.preClosureAmount)}</strong></p>
                      <p><span className="text-slate-500 dark:text-white/60">{t("loans:pre_closure_date")}:</span><br />{loan.preClosureDate ? new Date(loan.preClosureDate).toLocaleDateString() : "-"}</p>
                    </div>
                  </div>
                )}
              </div>
            </TabPanel>

            {/* Documents tab — read-only, metadata set at apply time only */}
            <TabPanel>
              <div className={panelClass}>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-5">{t("loans:documents")}</h4>
                {(!loan.documents || loan.documents.length === 0) ? (
                  <div className="text-center py-12">
                    <FiFileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 dark:text-white/60">{t("loans:no_documents")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loan.documents.map((doc, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5">
                        <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center shrink-0">
                          <FiFileText className="h-5 w-5 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{doc.name}</p>
                          <p className="text-xs text-slate-400">{doc.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabPanel>

            {/* EMI schedule tab, with per-installment repayment action */}
            <TabPanel>
              <div className={panelClass}>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{t("loans:emi_schedule")}</h4>
                <p className="text-sm text-slate-500 dark:text-white/70 mb-4">
                  {t("loans:paid_amount")}: SAR {formatAmount(paidAmount)} · {t("loans:remaining_amount")}: SAR {formatAmount(remainingAmount)}
                </p>
                {schedule.length === 0 ? (
                  <p className="text-slate-500 dark:text-white/60 py-8 text-center">{t("loans:not_disbursed_yet")}</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/20">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--color-teal-500)]">
                          {[t("loans:installment_no"), t("loans:due_date"), t("loans:emi_amount"), t("loans:principal"), t("loans:interest"), t("loans:balance"), t("loans:status"), t("loans:actions")].map((h) => (
                            <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.map((row) => (
                          <tr key={row.installmentNo} className={`border-t border-slate-100 dark:border-white/5 ${row.paid ? "bg-emerald-50/50 dark:bg-emerald-500/5" : ""}`}>
                            <td className="px-4 py-2.5">{row.installmentNo}</td>
                            <td className="px-4 py-2.5">{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "-"}</td>
                            <td className="px-4 py-2.5">SAR {formatAmount(row.emiAmount)}</td>
                            <td className="px-4 py-2.5">{formatAmount(row.principal)}</td>
                            <td className="px-4 py-2.5">{formatAmount(row.interest)}</td>
                            <td className="px-4 py-2.5">{formatAmount(row.balance)}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                {row.paid ? t("loans:paid") : t("loans:pending")}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {!row.paid && loan.status === "Ongoing" && checkRoleAuth(edit_loan) && (
                                <button type="button" disabled={busy} onClick={() => handleRepay(row.installmentNo)}
                                  className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-50">
                                  {t("loans:mark_paid")}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
};

export default LoanDetail;
