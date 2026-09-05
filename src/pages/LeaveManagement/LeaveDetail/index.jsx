import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiCheck, FiX } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormTextarea from "components/FormTextarea";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  fetchLeaveById,
  clearCurrentLeave,
  showCurrentLeave,
  showCurrentLeaveLoading,
  managerApproveLeave,
  managerRejectLeave,
  hrApproveLeave,
  hrRejectLeave,
  cancelLeaveRequest,
} from "store/slices/leaveSlice";
import { fetchLeaveTypes, showLeaveTypes } from "store/slices/leaveTypeSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { leaveStatusBadge } from "global/constant";
import { SkeletonDetail } from "components/Skeleton";

const { add_employee } = rafeeqi_role_ids;

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-sm text-slate-900 dark:text-white/90 whitespace-pre-wrap">{value || "—"}</p>
  </div>
);

const ApprovalActionPanel = ({ title, onApprove, onReject, color }) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (confirm) {
    return (
      <div className={`p-4 rounded-2xl border-2 ${color === "amber" ? "border-amber-300 bg-amber-50 dark:bg-amber-500/10" : "border-blue-300 bg-blue-50 dark:bg-blue-500/10"}`}>
        <p className="font-semibold text-sm mb-2">
          {confirm === "approve" ? t("leave:confirm_approve") : t("leave:confirm_reject")}
        </p>
        <FormTextarea
          rows={3}
          value={comments}
          onValueChange={setComments}
          placeholder={t("leave:comments_placeholder")}
          wrapperClass="mb-3"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            title={confirm === "approve" ? t("leave:approve") : t("leave:reject")}
            btn="primary"
            disabled={submitting}
            className={`!rounded-lg !h-9 !px-4 !border-0 !text-white ${confirm === "approve" ? "!bg-emerald-500 hover:!bg-emerald-600" : "!bg-rose-500 hover:!bg-rose-600"}`}
            onClick={async () => {
              setSubmitting(true);
              if (confirm === "approve") await onApprove(comments);
              else await onReject(comments);
              setSubmitting(false);
            }}
          />
          <Button
            type="button"
            title={t("cancel")}
            onClick={() => setConfirm(null)}
            className="!rounded-lg !h-9 !px-4 !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl border-2 ${color === "amber" ? "border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30" : "border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/30"}`}>
      <p className="font-semibold text-sm mb-3 text-slate-800 dark:text-white">{title}</p>
      <div className="flex gap-2">
        <Button
          type="button"
          title={t("leave:approve")}
          icon={FiCheck}
          iconClass="h-4 w-4"
          onClick={() => setConfirm("approve")}
          className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-emerald-500 hover:!bg-emerald-600"
        />
        <Button
          type="button"
          title={t("leave:reject")}
          icon={FiX}
          iconClass="h-4 w-4"
          onClick={() => setConfirm("reject")}
          className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-rose-500 hover:!bg-rose-600"
        />
      </div>
    </div>
  );
};

const LeaveDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const raw = useSelector(showCurrentLeave);
  const rawLoading = useSelector(showCurrentLeaveLoading);
  const employees = useSelector(showEmployees);
  const leaveTypes = useSelector(showLeaveTypes);
  const departments = useSelector(showDepartments);

  useEffect(() => {
    dispatch(fetchLeaveById(id));
    dispatch(fetchEmployees());
    dispatch(fetchLeaveTypes());
    dispatch(fetchDepartments());
    return () => { dispatch(clearCurrentLeave()); };
  }, [dispatch, id]);

  const employeesById = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])),
    [employees],
  );
  const leaveTypesById = useMemo(
    () => Object.fromEntries(leaveTypes.map((x) => [x.id, x.name])),
    [leaveTypes],
  );
  const departmentsById = useMemo(
    () => Object.fromEntries(departments.map((d) => [d.id, d.name])),
    [departments],
  );

  const item = useMemo(() => {
    if (!raw) return null;
    const emp = employeesById[raw.employeeId];
    const manager = employeesById[emp?.managerEmployeeId];
    return {
      ...raw,
      employeeName: emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "—",
      employeeIdNo: emp?.employeeCode || "",
      department: departmentsById[emp?.departmentId] || "—",
      managerName: manager ? `${manager.first_name || ""} ${manager.last_name || ""}`.trim() : "—",
      leaveTypeName: leaveTypesById[raw.leaveTypeId] || "—",
    };
  }, [raw, employeesById, departmentsById, leaveTypesById]);

  if (rawLoading && !item) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("no_record_found")}</p>
        <Button title={t("back")} onClick={() => navigate("/leave-management")} className="mt-4" />
      </div>
    );
  }

  const isRTL = i18n.language === "ar";
  const panelCls = "bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]";

  const doCancel = async () => {
    try {
      await dispatch(cancelLeaveRequest(item.id)).unwrap();
      await dispatch(fetchLeaveById(item.id));
      toast.success(t("leave:cancel_success"));
    } catch (err) {
      toast.error(err || t("leave:action_failed"));
    }
  };

  const doManager = async (approve, comments) => {
    try {
      await dispatch(approve ? managerApproveLeave({ id: item.id, comments }) : managerRejectLeave({ id: item.id, comments })).unwrap();
      await dispatch(fetchLeaveById(item.id));
      toast.success(t("leave:action_success"));
    } catch (err) {
      toast.error(err || t("leave:action_failed"));
    }
  };

  const doHr = async (approve, comments) => {
    try {
      await dispatch(approve ? hrApproveLeave({ id: item.id, comments }) : hrRejectLeave({ id: item.id, comments })).unwrap();
      await dispatch(fetchLeaveById(item.id));
      toast.success(t("leave:action_success"));
    } catch (err) {
      toast.error(err || t("leave:action_failed"));
    }
  };

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1] space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/leave-management")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{item.leaveNumber}</h1>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${leaveStatusBadge[item.status] || ""}`}>
                {item.status}
              </span>
            </div>
            <p className="text-mutedForeground mt-0.5">{item.employeeName} · {item.leaveTypeName} · {item.days} {t("leave:days")}</p>
          </div>
          {["Pending Manager", "Pending HR"].includes(item.status) && (
            <Button
              title={t("leave:cancel_request")}
              onClick={doCancel}
              className="!w-auto !rounded-lg !h-10 !px-4 !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
            />
          )}
        </div>

        {/* Approval progress tracker */}
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-6">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-5">{t("leave:approval_progress")}</h3>
          <div className="flex items-start gap-0">
            {[
              {
                label: t("leave:step_apply"),
                sublabel: item.appliedAt,
                status: "Approved",
                icon: "✓",
                active: true,
              },
              {
                label: t("leave:step_manager"),
                sublabel: item.managerApproval?.approvedOn || "",
                status: item.managerApproval?.status,
                icon: item.managerApproval?.status === "Approved" ? "✓" : item.managerApproval?.status === "Rejected" ? "✗" : "2",
                active: true,
                comments: item.managerApproval?.comments,
                by: item.managerApproval?.approvedBy,
              },
              {
                label: t("leave:step_hr"),
                sublabel: item.hrApproval?.approvedOn || "",
                status: item.hrApproval?.status,
                icon: item.hrApproval?.status === "Approved" ? "✓" : item.hrApproval?.status === "Rejected" ? "✗" : "3",
                active: item.status === "Pending HR" || item.status === "Approved",
                comments: item.hrApproval?.comments,
                by: item.hrApproval?.approvedBy,
              },
              {
                label: t("leave:step_approved"),
                sublabel: "",
                status: item.status === "Approved" ? "Approved" : "Pending",
                icon: item.status === "Approved" ? "✓" : "4",
                active: item.status === "Approved",
              },
            ].map((step, idx) => (
              <div key={step.label} className="flex items-start flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step.status === "Approved"
                        ? "bg-emerald-500 text-white"
                        : step.status === "Rejected"
                        ? "bg-rose-500 text-white"
                        : step.active
                        ? "bg-amber-400 text-white"
                        : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-white/40"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-white/90">{step.label}</p>
                    {step.sublabel && <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">{step.sublabel}</p>}
                    {step.by && <p className="text-xs text-slate-400 dark:text-white/40">{step.by}</p>}
                    {step.comments && (
                      <p className="text-xs text-slate-500 dark:text-white/50 italic mt-0.5 max-w-[120px]">
                        &quot;{step.comments}&quot;
                      </p>
                    )}
                  </div>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-0.5 mt-5 mx-1 ${step.status === "Approved" ? "bg-emerald-400" : "bg-slate-200 dark:bg-white/15"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Approval action panels — only HR/managers with add_employee can act, the record view itself stays open */}
        {checkRoleAuth(add_employee) && item.status === "Pending Manager" && (
          <ApprovalActionPanel
            title={t("leave:manager_action_title")}
            onApprove={(c) => doManager(true, c)}
            onReject={(c) => doManager(false, c)}
            color="amber"
          />
        )}
        {checkRoleAuth(add_employee) && item.status === "Pending HR" && (
          <ApprovalActionPanel
            title={t("leave:hr_action_title")}
            onApprove={(c) => doHr(true, c)}
            onReject={(c) => doHr(false, c)}
            color="blue"
          />
        )}

        {/* Details */}
        <div className={`${panelCls} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
          <Field label={t("leave:employee")} value={`${item.employeeName} (${item.employeeIdNo})`} />
          <Field label={t("leave:department")} value={item.department} />
          <Field label={t("leave:manager_label")} value={item.managerName} />
          <Field label={t("leave:leave_type")} value={item.leaveTypeName} />
          <Field label={t("leave:from_date")} value={item.fromDate} />
          <Field label={t("leave:to_date")} value={item.toDate} />
          <Field label={t("leave:days")} value={`${item.days} ${t("leave:days")}`} />
          <Field label={t("leave:applied_on")} value={item.appliedAt} />
          <Field label={t("leave:applied_via")} value={item.appliedVia === "employee" ? t("leave:self_applied") : t("leave:hr_applied")} />
          <Field label={t("leave:handover_to")} value={employeesById[item.handoverToEmployeeId] ? `${employeesById[item.handoverToEmployeeId].first_name || ""} ${employeesById[item.handoverToEmployeeId].last_name || ""}`.trim() : ""} />
          <Field label={t("leave:emergency_contact")} value={item.emergencyContact} />
          <Field label={t("leave:status")} value={item.status} />
          <div className="lg:col-span-3">
            <Field label={t("leave:reason")} value={item.reason} />
          </div>
          {item.attachments?.length > 0 && (
            <div className="lg:col-span-3">
              <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase tracking-wide mb-1">
                {t("leave:attachments")}
              </p>
              <div className="flex gap-2 flex-wrap">
                {item.attachments.map((f) => (
                  <a
                    key={f.url || f.name}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-medium text-slate-700 dark:text-white/80 hover:bg-slate-200"
                  >
                    📎 {f.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveDetail;
