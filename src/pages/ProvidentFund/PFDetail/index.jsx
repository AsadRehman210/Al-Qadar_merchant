import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiCheck, FiX, FiPlusCircle } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import SelectDropdown from "components/SelectDropdown";
import ActionPopup from "components/ActionPopup";
import { checkRoleAuth, formatAmount } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import {
  fetchPfPolicy,
  fetchPfAccountByEmployee,
  postPfContribution,
  fetchPfContributionHistory,
  applyPfWithdrawal,
  fetchPfWithdrawalsByEmployee,
  approvePfWithdrawal,
  rejectPfWithdrawal,
  markPfWithdrawalPaid,
  clearPfDetail,
  showPfPolicy,
  showPfCurrentAccount,
  showPfContributionHistory,
  showPfWithdrawalsByEmployee,
  showPfCurrentAccountLoading,
} from "store/slices/providentFundSlice";
import { SkeletonCards, SkeletonDetail } from "components/Skeleton";
import { fetchEmployees, showEmployees, showEmployeesLoading } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { pfWithdrawalTypeOptions } from "global/constant";
import AuditMeta from "components/AuditMeta";

const { view_provident_fund, edit_provident_fund } = alqadar_role_ids;

const WD_BADGE = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-blue-100 text-blue-700",
  Rejected: "bg-rose-100 text-rose-700",
  Paid: "bg-emerald-100 text-emerald-700",
};

const PFDetail = () => {
  const { t, i18n } = useTranslation();
  const { empId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("contributions");
  const [showContribForm, setShowContribForm] = useState(false);
  const [showWdForm, setShowWdForm] = useState(false);
  const [submittingContrib, setSubmittingContrib] = useState(false);
  const [submittingWd, setSubmittingWd] = useState(false);
  const rejectRef = useRef();
  const [rejectingId, setRejectingId] = useState(null);
  const isRTL = i18n.language === "ar";

  const policy = useSelector(showPfPolicy);
  const account = useSelector(showPfCurrentAccount);
  const contributions = useSelector(showPfContributionHistory);
  const withdrawals = useSelector(showPfWithdrawalsByEmployee);
  const employees = useSelector(showEmployees);
  const departments = useSelector(showDepartments);
  const employeesLoading = useSelector(showEmployeesLoading);
  const accountLoading = useSelector(showPfCurrentAccountLoading);

  const employee = employees.find((e) => e.id === empId);

  useEffect(() => {
    dispatch(fetchPfPolicy());
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
    dispatch(fetchPfAccountByEmployee(empId));
    dispatch(fetchPfContributionHistory(empId));
    dispatch(fetchPfWithdrawalsByEmployee(empId));
    return () => dispatch(clearPfDetail());
  }, [empId, dispatch]);

  const { register: regC, handleSubmit: hsC, reset: resetC, formState: { errors: errC } } = useForm();
  const { register: regW, handleSubmit: hsW, reset: resetW, formState: { errors: errW } } = useForm();
  const [wdType, setWdType] = useState(pfWithdrawalTypeOptions[0]);

  // `employee` is resolved out of the employees list, so an in-flight fetch
  // looks identical to a genuinely missing employee — only claim "no record"
  // once both the list and the PF account have actually come back.
  if (!checkRoleAuth(view_provident_fund)) return null;

  if (employeesLoading || accountLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCards count={4} columns="grid-cols-2 lg:grid-cols-4" />
        <SkeletonDetail fields={8} />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center">
        <p>{t("no_record_found")}</p>
        <Button title={t("back")} onClick={() => navigate("/provident-fund")} className="mt-4" />
      </div>
    );
  }

  const departmentName = departments.find((d) => d.id === employee.departmentId)?.name;

  const onAddContrib = async (data) => {
    setSubmittingContrib(true);
    try {
      await dispatch(postPfContribution({
        employeeId: empId,
        month: data.month,
        basic: data.basic ? Number(data.basic) : undefined,
      })).unwrap();
      await dispatch(fetchPfAccountByEmployee(empId));
      await dispatch(fetchPfContributionHistory(empId));
      toast.success(t("pf:contribution_saved"));
      resetC();
      setShowContribForm(false);
    } catch (err) {
      toast.error(err || t("pf:contribution_save_failed"));
    } finally {
      setSubmittingContrib(false);
    }
  };

  const onAddWithdrawal = async (data) => {
    if (!wdType?.id) {
      toast.error(t("pf:withdrawal_type_required", "Withdrawal type is required"));
      return;
    }
    if (Number(data.amount) > (account?.currentBalance || 0)) {
      toast.error(t("pf:amount_exceeds_balance", "Amount cannot exceed current balance"));
      return;
    }
    setSubmittingWd(true);
    try {
      await dispatch(applyPfWithdrawal({
        employeeId: empId,
        amount: Number(data.amount),
        reason: data.reason,
        type: wdType.id,
      })).unwrap();
      await dispatch(fetchPfWithdrawalsByEmployee(empId));
      toast.success(t("pf:withdrawal_requested"));
      resetW();
      setShowWdForm(false);
    } catch (err) {
      toast.error(err || t("pf:withdrawal_request_failed"));
    } finally {
      setSubmittingWd(false);
    }
  };

  const onApprove = async (id) => {
    try {
      await dispatch(approvePfWithdrawal(id)).unwrap();
      await dispatch(fetchPfWithdrawalsByEmployee(empId));
      toast.success(t("pf:withdrawal_approved"));
    } catch (err) {
      toast.error(err || t("pf:action_failed"));
    }
  };

  const onMarkPaid = async (id) => {
    try {
      await dispatch(markPfWithdrawalPaid(id)).unwrap();
      await dispatch(fetchPfAccountByEmployee(empId));
      await dispatch(fetchPfWithdrawalsByEmployee(empId));
      toast.success(t("pf:withdrawal_paid"));
    } catch (err) {
      toast.error(err || t("pf:action_failed"));
    }
  };

  const onConfirmReject = async () => {
    if (rejectingId) {
      try {
        await dispatch(rejectPfWithdrawal({ id: rejectingId, remarks: "Rejected by HR" })).unwrap();
        await dispatch(fetchPfWithdrawalsByEmployee(empId));
        toast.success(t("pf:withdrawal_rejected"));
      } catch (err) {
        toast.error(err || t("pf:action_failed"));
      }
    }
    rejectRef.current?.closeModal?.();
  };

  const employeeName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
  const totalEmployeeContrib = account?.totalEmployeeContrib || 0;
  const totalEmployerContrib = account?.totalEmployerContrib || 0;
  const totalContrib = totalEmployeeContrib + totalEmployerContrib;
  const currentBalance = account?.currentBalance || 0;

  const TABS = [
    { id: "contributions", label: t("pf:contributions_tab") },
    { id: "withdrawals", label: t("pf:withdrawals_tab") },
    { id: "summary", label: t("pf:summary_tab") },
  ];

  return (
    <div className="relative min-h-[60vh]">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1] space-y-6">

        <div className="flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/provident-fund")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{employeeName}</h1>
            <p className="text-mutedForeground text-sm">{account?.pfAccountNo || t("pf:no_account_yet")} · {employee.employeeCode} · {departmentName || "—"}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${account?.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
{account?.status || t("pf:no_account_yet")}
          </span>
        </div>
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-4 grid sm:grid-cols-2 gap-4">
          <AuditMeta record={account} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t("pf:total_employee_contrib"), value: `SAR ${formatAmount(totalEmployeeContrib)}`, color: "text-blue-600" },
            { label: t("pf:total_employer_contrib"), value: `SAR ${formatAmount(totalEmployerContrib)}`, color: "text-purple-600" },
            { label: t("pf:total_contributions"), value: `SAR ${formatAmount(totalContrib)}`, color: "text-slate-700 dark:text-white" },
            { label: t("pf:current_balance"), value: `SAR ${formatAmount(currentBalance)}`, color: "text-emerald-600 font-bold text-lg" },
          ].map((c) => (
            <div key={c.label} className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-white/60 mb-1">{c.label}</p>
              <p className={`font-bold text-sm ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 w-fit">
              {TABS.map((tab) => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-white dark:bg-white/20 text-teal-600 shadow" : "text-slate-600 dark:text-white/60 hover:text-slate-800"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {checkRoleAuth(edit_provident_fund) && activeTab === "contributions" && (
                <Button type="button" title={t("pf:add_contribution")} icon={FiPlusCircle} iconClass="h-4 w-4 text-white"
                  onClick={() => setShowContribForm((v) => !v)}
                  className="!w-auto !rounded-lg !h-9 !px-3 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600" />
              )}
              {checkRoleAuth(edit_provident_fund) && activeTab === "withdrawals" && (
                <Button type="button" title={t("pf:request_withdrawal")} icon={FiPlusCircle} iconClass="h-4 w-4 text-white"
                  onClick={() => setShowWdForm((v) => !v)}
                  className="!w-auto !rounded-lg !h-9 !px-3 !border-0 !text-white !bg-rose-500 hover:!bg-rose-600" />
              )}
            </div>
          </div>

          {activeTab === "contributions" && (
            <>
              {showContribForm && (
                <form onSubmit={hsC(onAddContrib)} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 mb-5 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200">
                  <FormInput
                    label={t("pf:month")}
                    name="month"
                    type="month"
                    register={regC}
                    errors={errC}
                    required={t("pf:month_required")}
                    max={new Date().toISOString().slice(0, 7)}
                    inputClass="!h-[46px] !rounded-lg"
                    labelClass="!text-xs"
                  />
                  <FormInput label={`${t("pf:basic")} (${t("pf:optional")})`} name="basic" type="number" min={0} decimal decimalPlaces={3} maxLength={10} register={regC} errors={errC} placeholder={t("pf:basic_from_salary_hint")} />
                  <div className="flex items-end">
                    <p className="text-xs text-slate-400">
                      {policy ? `${policy.employeeRate}% + ${policy.employerRate}% ${t("pf:of_basic")}` : ""}
                    </p>
                  </div>
                  <div className="md:col-span-3 flex gap-2 justify-end">
                    <Button type="button" title={t("cancel")} onClick={() => setShowContribForm(false)} className="!rounded-lg !h-9 !px-4 !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
                    <Button type="submit" title={t("save")} btn="primary" disabled={submittingContrib} loading={submittingContrib} className="!rounded-lg !h-9 !px-4 !bg-teal-500 !border-0" />
                  </div>
                </form>
              )}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-[var(--color-teal-500)]">
                      {["#", t("pf:month"), t("pf:basic"), t("pf:employee_contrib"), t("pf:employer_contrib"), t("pf:total"), t("pf:running_balance"), t("pf:status")].map((h) => (
                        <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs whitespace-nowrap first:pl-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">{t("pf:no_contributions")}</td></tr>
                    ) : contributions.map((m, idx) => (
                      <tr key={m.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10">
                        <td className="px-4 py-3 pl-5 text-slate-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{m.month}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-white/70">SAR {formatAmount(m.basic)}</td>
                        <td className="px-4 py-3 text-blue-600">SAR {formatAmount(m.employeeContribution)}</td>
                        <td className="px-4 py-3 text-purple-600">SAR {formatAmount(m.employerContribution)}</td>
                        <td className="px-4 py-3 font-semibold">SAR {formatAmount(m.totalContribution)}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">SAR {formatAmount(m.balanceAfter)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.status === "Manual" ? "bg-amber-100 text-amber-700" : m.status === "Payroll" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>{m.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "withdrawals" && (
            <>
              {showWdForm && (
                <form onSubmit={hsW(onAddWithdrawal)} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 mb-5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200">
                  <FormInput label={t("pf:withdrawal_amount")} name="amount" type="number" min={0.01} decimal decimalPlaces={3} maxLength={10} register={regW} errors={errW} required />
                  <SelectDropdown
                    label={t("pf:withdrawal_type")}
                    data={pfWithdrawalTypeOptions}
                    selected={wdType}
                    setSelected={(v) => setWdType(v || pfWithdrawalTypeOptions[0])}
                    required
                    hideClear
                    labelClass="!text-xs"
                  />
                  <FormTextarea
                    label={t("pf:reason")}
                    name="reason"
                    register={regW}
                    errors={errW}
                    required={t("pf:reason_required")}
                    rows={2}
                    minLength={{ value: 5, message: "Minimum length is 5 characters" }}
                    maxLength={{ value: 500, message: "Maximum length is 500 characters" }}
                    placeholder={t("pf:withdrawal_reason_placeholder")}
                    labelClass="!text-xs"
                    wrapperClass="md:col-span-2"
                  />
                  <div className="md:col-span-2 flex gap-2 justify-end">
                    <Button type="button" title={t("cancel")} onClick={() => setShowWdForm(false)} className="!rounded-lg !h-9 !px-4 !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
                    <Button type="submit" title={t("pf:submit_request")} btn="primary" disabled={submittingWd} loading={submittingWd} className="!rounded-lg !h-9 !px-4 !bg-rose-500 !border-0" />
                  </div>
                </form>
              )}

              {withdrawals.length === 0 ? (
                <div className="text-center py-10 text-slate-500">{t("pf:no_withdrawals")}</div>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map((wd) => (
                    <div key={wd.id} className="rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">SAR {formatAmount(wd.amount)} — {wd.type}</p>
                          <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">{t("pf:requested")}: {wd.createdAt ? new Date(wd.createdAt).toLocaleDateString() : ""}</p>
                          <p className="text-sm text-slate-700 dark:text-white/80 mt-1">{wd.reason}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${WD_BADGE[wd.status]}`}>{wd.status}</span>
                          {wd.approvedOn && <p className="text-xs text-slate-400 mt-1">{new Date(wd.approvedOn).toLocaleDateString()}</p>}
                          {wd.paidOn && <p className="text-xs text-emerald-600 mt-0.5">{t("pf:mark_paid")}: {new Date(wd.paidOn).toLocaleDateString()}</p>}
                          {wd.remarks && <p className="text-xs italic text-slate-400 mt-0.5">&quot;{wd.remarks}&quot;</p>}
                        </div>
                      </div>
                      {checkRoleAuth(edit_provident_fund) && wd.status === "Pending" && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                          <Button type="button" title={t("pf:approve")} icon={FiCheck} iconClass="h-3 w-3"
                            onClick={() => onApprove(wd.id)}
                            className="!w-auto !rounded-lg !h-8 !px-3 !text-xs !border-0 !text-white !bg-blue-500" />
                          <Button type="button" title={t("pf:reject")} icon={FiX} iconClass="h-3 w-3"
                            onClick={() => { setRejectingId(wd.id); rejectRef.current?.openModal?.(); }}
                            className="!w-auto !rounded-lg !h-8 !px-3 !text-xs !border-0 !text-white !bg-rose-500" />
                        </div>
                      )}
                      {checkRoleAuth(edit_provident_fund) && wd.status === "Approved" && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                          <Button type="button" title={t("pf:mark_paid")}
                            onClick={() => onMarkPaid(wd.id)}
                            className="!w-auto !rounded-lg !h-8 !px-3 !text-xs !border-0 !text-white !bg-emerald-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "summary" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: t("pf:total_employee_contrib"), value: `SAR ${formatAmount(totalEmployeeContrib)}`, color: "bg-blue-50 border-blue-200 text-blue-700" },
                  { label: t("pf:total_employer_contrib"), value: `SAR ${formatAmount(totalEmployerContrib)}`, color: "bg-purple-50 border-purple-200 text-purple-700" },
                  { label: t("pf:total_contributions"), value: `SAR ${formatAmount(totalContrib)}`, color: "bg-teal-50 border-teal-200 text-teal-700" },
                  { label: t("pf:total_withdrawn"), value: `SAR ${formatAmount(account?.totalWithdrawn || 0)}`, color: "bg-rose-50 border-rose-200 text-rose-700" },
                  { label: t("pf:current_balance"), value: `SAR ${formatAmount(currentBalance)}`, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                ].map((c) => (
                  <div key={c.label} className={`p-5 rounded-2xl border ${c.color}`}>
                    <p className="text-xs opacity-70 mb-1">{c.label}</p>
                    <p className="text-xl font-bold">{c.value}</p>
                  </div>
                ))}
              </div>
              {policy && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/20 text-sm space-y-2">
                  <p className="font-semibold text-slate-800 dark:text-white">{t("pf:pf_rates")}</p>
                  <p className="text-slate-600 dark:text-white/70">Employee Rate: <strong>{policy.employeeRate}%</strong> of Basic</p>
                  <p className="text-slate-600 dark:text-white/70">Employer Rate: <strong>{policy.employerRate}%</strong> of Basic</p>
                  <p className="text-slate-600 dark:text-white/70">PF Account: <strong>{account?.pfAccountNo || t("pf:no_account_yet")}</strong></p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ActionPopup ref={rejectRef} title={t("pf:reject_withdrawal")} description={t("pf:reject_withdrawal_reason")}
        confirm={t("pf:reject")} cancel={t("cancel")}
        onClick={onConfirmReject} />
    </div>
  );
};

export default PFDetail;
