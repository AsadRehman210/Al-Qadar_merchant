import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight, FiCheck, FiX } from "react-icons/fi";
import Button from "components/Button";
import { SkeletonDetail } from "components/Skeleton";
import { APPROVAL_STATUS_BADGE, APPROVAL_STATUS, stepIndex } from "global/approvalEngine";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { FIELD_DEFS, requestTypeById } from "../requestsFakeData";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import {
  fetchRequestById,
  showCurrentRequest,
  showCurrentRequestLoading,
  clearCurrentRequest,
  managerApproveRequest,
  managerRejectRequest,
  hrApproveRequest,
  hrRejectRequest,
  cancelRequest,
} from "store/slices/requestSlice";

const { add_employee } = rafeeqi_role_ids;
const DETAIL_LABELS = Object.fromEntries(
  Object.entries(FIELD_DEFS).map(([k, def]) => [k, def.labelKey]),
);

const ActionForm = ({ stage, onApprove, onReject }) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEmpty = !comments.trim();

  const handle = async (fn) => {
    if (isEmpty) { setTouched(true); return; }
    setSubmitting(true);
    try {
      await fn(comments.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5">
      <label className="text-sm font-medium text-slate-700 dark:text-white/80 mb-1 block">
        {t("requests:decision_note")} <span className="text-red-500">*</span>
      </label>
      <textarea
        rows={2}
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        placeholder={t("requests:decision_note_placeholder")}
        className={`w-full rounded-lg border bg-white dark:bg-white/10 p-2 text-sm mb-1 ${touched && isEmpty ? "border-rose-400" : "border-slate-200 dark:border-white/20"}`}
      />
      {touched && isEmpty && (
        <p className="text-xs text-rose-500 mb-2">{t("requests:decision_note_required")}</p>
      )}
      <div className="flex gap-2 mt-2">
        <Button
          type="button"
          title={`${t("requests:approve")} (${stage})`}
          icon={FiCheck}
          iconClass="h-4 w-4"
          onClick={() => handle(onApprove)}
          disabled={submitting}
          className={`!w-auto !rounded-lg !h-10 !px-4 !border-0 !text-white !bg-emerald-500 hover:!bg-emerald-600 ${isEmpty ? "!opacity-50" : ""}`}
        />
        <Button
          type="button"
          title={t("requests:reject")}
          icon={FiX}
          iconClass="h-4 w-4"
          onClick={() => handle(onReject)}
          disabled={submitting}
          className={`!w-auto !rounded-lg !h-10 !px-4 !border-0 !text-white !bg-rose-500 hover:!bg-rose-600 ${isEmpty ? "!opacity-50" : ""}`}
        />
      </div>
    </div>
  );
};

const RequestDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const req = useSelector(showCurrentRequest);
  const reqLoading = useSelector(showCurrentRequestLoading);
  const employees = useSelector(showEmployees);

  useEffect(() => {
    dispatch(fetchRequestById(id));
    dispatch(fetchEmployees());
    return () => dispatch(clearCurrentRequest());
  }, [dispatch, id]);

  const employeesById = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])),
    [employees],
  );

  if (reqLoading && !req) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!req) {
    return (
      <div className="p-10 text-center text-slate-500">
        {t("requests:no_requests")}
      </div>
    );
  }

  const emp = employeesById[req.employeeId];
  const employeeName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "—";
  const manager = emp ? employeesById[emp.managerEmployeeId] : null;
  const managerName = manager ? `${manager.first_name || ""} ${manager.last_name || ""}`.trim() : "HR";
  const typeName = requestTypeById(req.type)?.name || req.type;

  const refresh = () => dispatch(fetchRequestById(id));
  const currentStep = stepIndex(req.status);

  const detailEntries = Object.entries(req.details || {}).filter(([, v]) => v !== "" && v != null);

  // No stored history log on the backend record (managerApproval/hrApproval
  // are the source of truth) — synthesize the timeline from those two stages
  // plus the original submission, matching the same three/four checkpoints
  // the progress chain above already shows.
  const history = [
    { stage: "Submitted", status: "Submitted", by: employeeName, on: req.createdAt },
    ...(req.managerApproval?.status && req.managerApproval.status !== "Pending" && req.managerApproval.status !== "Skipped"
      ? [{ stage: "Manager", status: req.managerApproval.status, by: managerName, on: req.managerApproval.approvedOn, comments: req.managerApproval.comments }]
      : []),
    ...(req.hrApproval?.status && req.hrApproval.status !== "Pending"
      ? [{ stage: "HR", status: req.hrApproval.status, by: "HR", on: req.hrApproval.approvedOn, comments: req.hrApproval.comments }]
      : []),
  ];

  const steps = [
    { key: "submit", label: t("requests:step_submit") },
    { key: "manager", label: t("requests:step_manager") },
    { key: "hr", label: t("requests:step_hr") },
    { key: "approved", label: t("requests:step_approved") },
  ];

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1] space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/requests")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{typeName}</h1>
            <p className="text-mutedForeground">{req.requestNumber} · {employeeName}</p>
          </div>
          <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold ${APPROVAL_STATUS_BADGE[req.status]}`}>{req.status}</span>
        </div>

        {/* Progress chain */}
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-6">
          <div className="flex flex-wrap items-center gap-2">
            {steps.map((s, i) => {
              const done = req.status === APPROVAL_STATUS.APPROVED ? true : i <= currentStep;
              const isRejected = req.status === APPROVAL_STATUS.REJECTED && i > currentStep;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isRejected ? "bg-rose-200 text-rose-700" : done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-white/50"
                  }`}>{i + 1}</div>
                  <span className="text-xs font-medium text-slate-600 dark:text-white/70">{s.label}</span>
                  {i < steps.length - 1 && <span className="text-slate-300 mx-1">→</span>}
                </div>
              );
            })}
          </div>
          {req.appliedVia === "hr" && (
            <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {t("requests:no_approval_needed")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t("requests:request_details")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-white/60">{t("requests:employee")}</p>
                  <p className="font-medium text-slate-800 dark:text-white">{employeeName} · {emp?.employeeCode}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-white/60">{t("requests:manager")}</p>
                  <p className="font-medium text-slate-800 dark:text-white">{managerName}</p>
                </div>
                {detailEntries.map(([k, v]) => (
                  <div key={k} className={k === "reason" || k === "purpose" ? "sm:col-span-2" : ""}>
                    <p className="text-xs text-slate-500 dark:text-white/60">{DETAIL_LABELS[k] ? t(DETAIL_LABELS[k]) : k}</p>
                    <p className="font-medium text-slate-800 dark:text-white break-words">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action panels */}
            {checkRoleAuth(add_employee) && req.status === APPROVAL_STATUS.PENDING_MANAGER && (
              <div className="bg-white dark:bg-white/10 border-2 border-amber-200 dark:border-amber-500/30 rounded-3xl p-7">
                <h3 className="font-semibold text-amber-700 dark:text-amber-300 mb-3">{t("requests:manager_approvals")}</h3>
                <ActionForm
                  stage={t("requests:step_manager")}
                  onApprove={(c) => dispatch(managerApproveRequest({ id: req.id, data: { comments: c } })).unwrap().then(refresh)}
                  onReject={(c) => dispatch(managerRejectRequest({ id: req.id, data: { comments: c } })).unwrap().then(refresh)}
                />
              </div>
            )}
            {checkRoleAuth(add_employee) && req.status === APPROVAL_STATUS.PENDING_HR && (
              <div className="bg-white dark:bg-white/10 border-2 border-blue-200 dark:border-blue-500/30 rounded-3xl p-7">
                <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">{t("requests:hr_approvals")}</h3>
                <ActionForm
                  stage={t("requests:step_hr")}
                  onApprove={(c) => dispatch(hrApproveRequest({ id: req.id, data: { comments: c } })).unwrap().then(refresh)}
                  onReject={(c) => dispatch(hrRejectRequest({ id: req.id, data: { comments: c } })).unwrap().then(refresh)}
                />
              </div>
            )}
          </div>

          {/* Right: timeline */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t("requests:approval_timeline")}</h3>
              <ol className="relative border-s border-slate-200 dark:border-white/15 ms-3 space-y-5">
                {history.map((h, idx) => (
                  <li key={idx} className="ms-5">
                    <span className={`absolute -start-2.5 w-5 h-5 rounded-full flex items-center justify-center ${
                      h.status === "Rejected" ? "bg-rose-500" : h.status === "Approved" ? "bg-emerald-500" : "bg-slate-400"
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-white" />
                    </span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{h.stage} · {h.status}</p>
                    <p className="text-xs text-slate-500 dark:text-white/60">{h.by} · {h.on ? new Date(h.on).toLocaleDateString() : ""}</p>
                    {h.comments && <p className="text-xs text-slate-600 dark:text-white/70 italic mt-0.5">&quot;{h.comments}&quot;</p>}
                  </li>
                ))}
              </ol>
            </div>

            {checkRoleAuth(add_employee) && (req.status === APPROVAL_STATUS.PENDING_MANAGER || req.status === APPROVAL_STATUS.PENDING_HR) && (
              <Button
                type="button"
                title={t("requests:cancel_request")}
                onClick={() => dispatch(cancelRequest({ id: req.id })).unwrap().then(refresh)}
                className="!rounded-md !bg-slate-200 dark:!bg-white/15 !text-slate-700 dark:!text-white"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
