import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight, FiDownload } from "react-icons/fi";
import Button from "components/Button";
import FormInput from "components/FormInput";
import { checkRoleAuth, formatAmount } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { SP_STATUS, SP_STATUS_BADGE } from "global/constant";
import {
  fetchSpecialPaymentById,
  showCurrentSpecialPayment,
  showCurrentSpecialPaymentLoading,
  clearCurrentSpecialPayment,
  fetchSpTypes,
  showSpTypes,
  submitSpecialPayment,
  approveSpecialPayment,
  rejectSpecialPayment,
  markSpecialPaymentPaid,
  cancelSpecialPayment,
} from "store/slices/payrollBatchSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { SkeletonDetail } from "components/Skeleton";
import AuditMeta from "components/AuditMeta";

const { view_special_payment, edit_special_payment } = alqadar_role_ids;

const FLOW_STEPS = [
  { key: SP_STATUS.DRAFT, label: "Created" },
  { key: SP_STATUS.PENDING_APPROVAL, label: "Submitted" },
  { key: SP_STATUS.APPROVED, label: "Approved" },
  { key: SP_STATUS.PAID, label: "Paid" },
];

const StatusFlow = ({ status }) => {
  const activeIdx = FLOW_STEPS.findIndex((s) => s.key === status);
  if (status === SP_STATUS.CANCELLED) {
    return <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-rose-100 text-rose-700">Cancelled</span>;
  }
  return (
    <div className="flex items-center gap-0">
      {FLOW_STEPS.map((step, idx) => (
        <div key={step.key} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${idx <= activeIdx ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-400"}`}>
            {idx < activeIdx ? "✓" : idx + 1}. {step.label}
          </div>
          {idx < FLOW_STEPS.length - 1 && (
            <div className={`h-0.5 w-6 ${idx < activeIdx ? "bg-teal-400" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
};

const SPDetail = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const isRTL = i18n.language === "ar";

  const sp = useSelector(showCurrentSpecialPayment);
  const loading = useSelector(showCurrentSpecialPaymentLoading);
  const types = useSelector(showSpTypes);
  const employees = useSelector(showEmployees);
  const departments = useSelector(showDepartments);

  useEffect(() => {
    dispatch(fetchSpecialPaymentById(id));
    dispatch(fetchSpTypes());
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
    return () => dispatch(clearCurrentSpecialPayment());
  }, [dispatch, id]);

  const refresh = () => dispatch(fetchSpecialPaymentById(id));

  const employeesById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const type = useMemo(() => types.find((tp) => tp.id === sp?.typeId), [types, sp]);
  const department = useMemo(() => departments.find((d) => d.id === sp?.departmentId), [departments, sp]);

  const lines = useMemo(() => {
    if (!sp) return [];
    return (sp.employees || []).map((e) => {
      const emp = employeesById[e.employeeId];
      return {
        ...e,
        employeeName: emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "—",
        employeeIdNo: emp?.employeeCode || "—",
      };
    });
  }, [sp, employeesById]);

  if (!checkRoleAuth(view_special_payment)) return null;

  if (loading && !sp) return <SkeletonDetail fields={8} />;

  if (!sp) return (
    <div className="p-8 text-center">
      <p className="text-slate-500">{t("no_record_found")}</p>
      <Button title={t("back")} onClick={() => navigate("/special-payments")} className="mt-4" />
    </div>
  );

  const exportCSV = () => {
    const csvRows = [
      ["Employee", "ID", "Amount", "Status"],
      ...lines.map((e) => [e.employeeName, e.employeeIdNo, e.amount, e.paymentStatus]),
    ];
    const csv = csvRows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${sp.title}.csv`; a.click();
  };

  return (
    <div className="relative min-h-[60vh]">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1] space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/special-payments")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{sp.title}</h1>
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${SP_STATUS_BADGE[sp.status] || ""}`}>{sp.status}</span>
            </div>
            <p className="text-mutedForeground mt-1">{type?.name || "—"} · {lines.length} employees · SAR {formatAmount(sp.totalAmount)}</p>
          </div>
          <Button type="button" title={t("payroll:export_csv")} icon={FiDownload} iconClass="h-4 w-4"
            onClick={exportCSV}
            className="!w-auto !rounded-lg !h-10 !px-4 !border border-slate-200 dark:!border-white/20 !text-slate-700 dark:!text-white !bg-white dark:!bg-white/10" />
        </div>

        {/* Flow tracker */}
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-4 overflow-x-auto">
          <StatusFlow status={sp.status} />
        </div>

        {/* Action bar */}
        {checkRoleAuth(edit_special_payment) && sp.status !== SP_STATUS.PAID && sp.status !== SP_STATUS.CANCELLED && (
          <div className="p-4 rounded-2xl border-2 border-teal-200 bg-teal-50 dark:bg-teal-500/10 dark:border-teal-500/30">
            <p className="text-sm font-semibold text-teal-800 dark:text-teal-300 mb-3">{t("payroll:available_actions")}</p>
            <div className="flex flex-wrap gap-2">
              {sp.status === SP_STATUS.DRAFT && (
                <>
                  <Button type="button" title={t("payroll:submit_approval")}
                    onClick={() => dispatch(submitSpecialPayment({ id })).then(refresh)}
                    className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-amber-500 hover:!bg-amber-600" />
                  <Button type="button" title={t("payroll:cancel_run")}
                    onClick={() => dispatch(cancelSpecialPayment({ id })).then(refresh)}
                    className="!w-auto !rounded-lg !h-9 !px-4 !bg-rose-100 !text-rose-700 dark:!bg-rose-500/20 dark:!text-rose-300" />
                </>
              )}
              {sp.status === SP_STATUS.PENDING_APPROVAL && (
                <>
                  <Button type="button" title={t("payroll:approve")}
                    onClick={() => dispatch(approveSpecialPayment({ id })).then(refresh)}
                    className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-blue-500 hover:!bg-blue-600" />
                  <Button type="button" title={t("payroll:reject")}
                    onClick={() => setShowReject(true)}
                    className="!w-auto !rounded-lg !h-9 !px-4 !bg-rose-100 !text-rose-700" />
                </>
              )}
              {sp.status === SP_STATUS.APPROVED && (
                <Button type="button" title={t("payroll:sp_mark_paid")}
                  onClick={() => dispatch(markSpecialPaymentPaid({ id })).then(refresh)}
                  className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-emerald-500 hover:!bg-emerald-600" />
              )}
            </div>
            {showReject && (
              <div className="mt-3">
                <FormInput
                  value={rejectReason}
                  onValueChange={setRejectReason}
                  placeholder={t("payroll:reject_reason")}
                  inputClass="!h-10 !rounded-lg"
                  wrapperClass="w-full max-w-md mb-2"
                />
                <div className="flex gap-2">
                  <Button type="button" title={t("payroll:confirm_reject")}
                    onClick={() => { dispatch(rejectSpecialPayment({ id, data: { reason: rejectReason } })).then(refresh); setShowReject(false); }}
                    className="!w-auto !rounded-lg !h-8 !px-3 !text-xs !border-0 !text-white !bg-rose-500" />
                  <Button type="button" title={t("cancel")} onClick={() => setShowReject(false)}
                    className="!w-auto !rounded-lg !h-8 !px-3 !text-xs !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: t("payroll:sp_type"), value: type?.name || "—", cls: "text-purple-600 dark:text-purple-400" },
            { label: t("payroll:sp_target"), value: sp.target === "department" ? `Dept: ${department?.name || "—"}` : sp.target === "individual" ? "Individual" : sp.target === "custom" ? "Custom" : "All Employees", cls: "text-slate-700 dark:text-white" },
            { label: t("payroll:sp_employees"), value: lines.length, cls: "text-slate-700 dark:text-white" },
            { label: t("payroll:sp_per_employee"), value: `SAR ${formatAmount(lines.length ? sp.totalAmount / lines.length : 0)}`, cls: "text-teal-600" },
            { label: t("payroll:sp_total"), value: `SAR ${formatAmount(sp.totalAmount)}`, cls: "text-emerald-600 font-bold text-lg" },
          ].map((c) => (
            <div key={c.label} className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-4">
              <p className="text-xs text-slate-500 dark:text-white/60 mb-1">{c.label}</p>
              <p className={`font-bold text-sm ${c.cls}`}>{c.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-4 grid sm:grid-cols-2 gap-4">
          <AuditMeta record={sp} />
        </div>

        {/* Approval trail */}
        {(sp.approvedOn || sp.paidOn || sp.notes) && (
          <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-4 flex flex-wrap gap-6 text-sm">
            {sp.approvedOn && (
              <div>
                <p className="text-xs text-slate-500">{t("payroll:approved_by")}</p>
                <p className="font-semibold text-blue-600">{new Date(sp.approvedOn).toLocaleDateString()}</p>
              </div>
            )}
            {sp.paidOn && (
              <div>
                <p className="text-xs text-slate-500">{t("payroll:sp_paid_on")}</p>
                <p className="font-semibold text-emerald-600">{new Date(sp.paidOn).toLocaleDateString()}</p>
              </div>
            )}
            {sp.notes && (
              <div>
                <p className="text-xs text-slate-500">{t("payroll:notes")}</p>
                <p className="font-medium dark:text-white">{sp.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Employee list */}
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t("payroll:sp_employee_list")}</h3>
            <span className="text-sm text-slate-500 dark:text-white/60">{lines.length} employees</span>
          </div>
          <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  {["#", t("payroll:employee"), t("payroll:sp_amount"), t("payroll:payment_status")].map((h) => (
                    <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs whitespace-nowrap first:pl-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((e, idx) => (
                  <tr key={e.employeeId} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/5">
                    <td className="px-4 py-3 pl-5 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 dark:text-white">{e.employeeName}</p>
                      <p className="text-xs text-slate-400">{e.employeeIdNo}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-purple-600 dark:text-purple-400">SAR {formatAmount(e.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${e.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {e.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-white/5 font-bold border-t-2 border-slate-200">
                  <td colSpan={2} className="px-4 py-3 pl-5 text-slate-700 dark:text-white">{t("payroll:total")}</td>
                  <td className="px-4 py-3 text-purple-600 font-bold">SAR {formatAmount(sp.totalAmount)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {lines.filter((e) => e.paymentStatus === "Paid").length}/{lines.length} paid
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SPDetail;
