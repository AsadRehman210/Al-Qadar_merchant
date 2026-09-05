import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import Button from "components/Button";
import FormTextarea from "components/FormTextarea";
import SelectDropdown from "components/SelectDropdown";
import { SkeletonDetail } from "components/Skeleton";
import {
  CLEARANCE_SECTIONS,
  CLEARANCE_LABELS,
  EXIT_STATUS,
  EXIT_STATUS_BADGE,
  exitInterviewReasonOptions,
  wouldRehireOptions,
} from "global/constant";
import { formatAmount } from "global/helper";
import { fetchAssets, showAssets, returnAsset } from "store/slices/assetSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { fetchDesignations, showDesignations } from "store/slices/designationSlice";
import {
  fetchExitById,
  showCurrentExit,
  showCurrentExitLoading,
  clearCurrentExit,
  fetchSettlementPreview,
  showSettlementPreview,
  updateClearanceItem,
  saveExitInterview,
  processSettlement,
  cancelExit,
} from "store/slices/offboardingSlice";

const STEPS = [EXIT_STATUS.NOTICE_PERIOD, EXIT_STATUS.CLEARANCE, EXIT_STATUS.SETTLEMENT, EXIT_STATUS.COMPLETED];


const ClearanceCard = ({ title, section, item, onCleared, extra }) => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState(item?.notes || "");
  const cleared = item?.status === "Cleared";

  return (
    <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            cleared
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
          }`}
        >
          {item?.status || "Pending"}
        </span>
      </div>

      {extra}

      {cleared ? (
        <p className="text-xs text-slate-500 dark:text-white/50">
          {t("offboarding:cleared_by")} {item.clearedBy} ù {item.clearedOn ? dayjs(item.clearedOn).format("YYYY-MM-DD") : ""}
          {item.notes ? ` ù ${item.notes}` : ""}
        </p>
      ) : (
        <div className="space-y-2">
          <FormTextarea
            value={notes}
            onValueChange={setNotes}
            rows={2}
            placeholder={t("offboarding:notes_placeholder")}
          />
          <Button
            type="button"
            title={t("offboarding:mark_cleared")}
            icon={FiCheckCircle}
            onClick={() => onCleared(section, notes)}
            className="!w-full !rounded-lg !h-10 !bg-teal-600 hover:!bg-teal-700 !border-0 !text-white !text-sm"
          />
        </div>
      )}
    </div>
  );
};

const ExitInterviewCard = ({ exit, onSaved }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [reasonCategory, setReasonCategory] = useState(exitInterviewReasonOptions[0]?.id);
  const [wouldRehire, setWouldRehire] = useState(wouldRehireOptions[0]?.id);
  const [comments, setComments] = useState("");

  if (exit.exitInterview) {
    return (
      <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">{t("offboarding:exit_interview")}</h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-slate-500 dark:text-white/50">{t("offboarding:exit_reason_category")}</span>
          <span className="font-medium text-slate-800 dark:text-white">{exit.exitInterview.reasonCategory}</span>
          <span className="text-slate-500 dark:text-white/50">{t("offboarding:would_rehire")}</span>
          <span className="font-medium text-slate-800 dark:text-white">{exit.exitInterview.wouldRehire ? "Yes" : "No"}</span>
        </div>
        {exit.exitInterview.comments && (
          <p className="text-sm text-slate-600 dark:text-white/70 mt-3 italic">&quot;{exit.exitInterview.comments}&quot;</p>
        )}
        <p className="text-xs text-slate-400 mt-3">
          {t("offboarding:submitted_on")} {exit.exitInterview.submittedOn ? dayjs(exit.exitInterview.submittedOn).format("YYYY-MM-DD") : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl p-5">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-3">{t("offboarding:exit_interview")}</h3>
      <div className="space-y-3">
        <SelectDropdown
          label={t("offboarding:exit_reason_category")}
          labelClass="!text-xs"
          data={exitInterviewReasonOptions}
          selected={exitInterviewReasonOptions.find((r) => r.id === reasonCategory) || exitInterviewReasonOptions[0]}
          setSelected={(opt) => setReasonCategory(opt?.id ?? exitInterviewReasonOptions[0].id)}
          hideClear
          classes="!h-10 !rounded-lg"
        />
        <div>
          <label className="text-xs font-medium text-linkText mb-1 block">{t("offboarding:would_rehire")}</label>
          <div className="flex gap-2">
            {wouldRehireOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setWouldRehire(opt.id)}
                className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                  wouldRehire === opt.id
                    ? "bg-teal-500 text-white"
                    : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-slate-200"
                }`}
              >
                {opt.title}
              </button>
            ))}
          </div>
        </div>
        <FormTextarea
          label={t("offboarding:exit_interview_notes")}
          labelClass="!text-xs"
          value={comments}
          onValueChange={setComments}
          rows={3}
          placeholder={t("offboarding:exit_interview_notes_placeholder")}
        />
        <Button
          type="button"
          title={t("offboarding:save_exit_interview")}
          onClick={async () => {
            try {
              await dispatch(saveExitInterview({
                id: exit.id,
                data: { reasonCategory, wouldRehire: wouldRehire === "Yes", comments },
              })).unwrap();
              await onSaved();
            } catch (err) {
              toast.error(err || "Failed to save exit interview.");
            }
          }}
          className="!w-full !rounded-lg !h-10 !bg-teal-600 hover:!bg-teal-700 !border-0 !text-white !text-sm"
        />
      </div>
    </div>
  );
};

const ExitDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const exit = useSelector(showCurrentExit);
  const exitLoading = useSelector(showCurrentExitLoading);
  const settlementPreview = useSelector(showSettlementPreview);
  const employees = useSelector(showEmployees);
  const departments = useSelector(showDepartments);
  const designations = useSelector(showDesignations);
  const assignedAssets = useSelector(showAssets);

  useEffect(() => {
    dispatch(fetchExitById(id));
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
    dispatch(fetchDesignations());
    return () => dispatch(clearCurrentExit());
  }, [dispatch, id]);

  useEffect(() => {
    if (exit && !exit.settlement && exit.status !== "Cancelled") {
      dispatch(fetchSettlementPreview(id));
    }
  }, [dispatch, id, exit]);

  useEffect(() => {
    if (exit?.employeeId) dispatch(fetchAssets({ assignedToId: exit.employeeId }));
  }, [dispatch, exit?.employeeId]);

  const employeesById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const departmentsById = useMemo(() => Object.fromEntries(departments.map((d) => [d.id, d])), [departments]);
  const designationsById = useMemo(() => Object.fromEntries(designations.map((d) => [d.id, d])), [designations]);

  if (exitLoading && !exit) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!exit) {
    return (
      <div className="p-10 text-center text-slate-400">{t("offboarding:not_found")}</div>
    );
  }

  const emp = employeesById[exit.employeeId];
  const employeeName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "ù";
  const department = emp ? departmentsById[emp.departmentId]?.name || "ù" : "ù";
  const designation = emp ? designationsById[emp.designationId]?.title || "ù" : "ù";

  const clearance = exit.clearance || {};
  const allCleared = CLEARANCE_SECTIONS.every((s) => clearance[s]?.status === "Cleared");
  const currentStepIdx = STEPS.indexOf(exit.status);

  const handleClear = async (section, notes) => {
    try {
      await dispatch(updateClearanceItem({ id: exit.id, section, data: { status: "Cleared", notes } })).unwrap();
      await dispatch(fetchExitById(id));
      toast.success(t("offboarding:section_cleared", { section: CLEARANCE_LABELS[section] }));
    } catch (err) {
      toast.error(err || "Failed to clear section.");
    }
  };

  const handleReturnAsset = async (assetId) => {
    try {
      await dispatch(returnAsset({
        id: assetId,
        data: { returnDate: dayjs().format("YYYY-MM-DD"), notes: t("offboarding:returned_on_exit") },
      })).unwrap();
      dispatch(fetchAssets({ assignedToId: exit.employeeId }));
    } catch (err) {
      toast.error(err || "Failed to return asset.");
    }
  };

  const handleProcessSettlement = async () => {
    try {
      await dispatch(processSettlement(exit.id)).unwrap();
      await dispatch(fetchExitById(id));
      toast.success(t("offboarding:exit_completed"));
    } catch (err) {
      toast.error(err || "Failed to process settlement.");
    }
  };

  const handleCancel = async () => {
    try {
      await dispatch(cancelExit(exit.id)).unwrap();
      await dispatch(fetchExitById(id));
      toast.success(t("offboarding:exit_cancelled"));
    } catch (err) {
      toast.error(err || "Failed to cancel exit.");
    }
  };

  const settlement = exit.settlement || settlementPreview;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 dark:text-white">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={() => navigate("/offboarding")}
              icon={isRTL ? FiArrowRight : FiArrowLeft}
              className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20 dark:text-white/90 transition-all"
              iconClass="!text-lg"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{employeeName}</h1>
              <p className="text-mutedForeground text-sm mt-1">
                {emp?.employeeCode} ù {designation} ù {department}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${EXIT_STATUS_BADGE[exit.status]}`}>
            {exit.status}
          </span>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-7">
          {STEPS.map((step, idx) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx <= currentStepIdx || exit.status === EXIT_STATUS.COMPLETED
                    ? "bg-teal-500 text-white"
                    : "bg-slate-100 dark:bg-white/10 text-slate-400"
                }`}
              >
                {idx + 1}
              </div>
              <span className="ltr:ml-2 rtl:mr-2 text-xs font-medium text-slate-600 dark:text-white/70 whitespace-nowrap">
                {step}
              </span>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-3 ${idx < currentStepIdx ? "bg-teal-500" : "bg-slate-100 dark:bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]">
              <h2 className="font-semibold text-slate-800 dark:text-white mb-4">{t("offboarding:exit_info")}</h2>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-slate-500 dark:text-white/50">{t("offboarding:exit_type")}</span>
                <span className="font-medium text-slate-800 dark:text-white">{exit.exitType}</span>
                <span className="text-slate-500 dark:text-white/50">{t("offboarding:resignation_date")}</span>
                <span className="font-medium text-slate-800 dark:text-white">{exit.resignationDate ? dayjs(exit.resignationDate).format("YYYY-MM-DD") : "ù"}</span>
                <span className="text-slate-500 dark:text-white/50">{t("offboarding:last_working_day")}</span>
                <span className="font-medium text-slate-800 dark:text-white">{exit.lastWorkingDay ? dayjs(exit.lastWorkingDay).format("YYYY-MM-DD") : "ù"}</span>
                <span className="text-slate-500 dark:text-white/50">{t("offboarding:notice_period_days")}</span>
                <span className="font-medium text-slate-800 dark:text-white">{exit.noticePeriodDays}</span>
                <span className="text-slate-500 dark:text-white/50">{t("offboarding:reason")}</span>
                <span className="font-medium text-slate-800 dark:text-white col-span-1">{exit.reason || "ù"}</span>
              </div>
            </div>

            <h2 className="font-semibold text-slate-800 dark:text-white">{t("offboarding:clearance_checklist")}</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <ClearanceCard
                title={t("offboarding:assets")}
                section="assets"
                item={clearance.assets}
                onCleared={handleClear}
                extra={
                  assignedAssets.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {assignedAssets.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 text-sm">
                          <span className="text-slate-700 dark:text-white/80">{a.name}</span>
                          <button
                            type="button"
                            onClick={() => handleReturnAsset(a.id)}
                            className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-300"
                          >
                            {t("offboarding:mark_returned")}
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                }
              />
              <ClearanceCard title={t("offboarding:finance")} section="finance" item={clearance.finance} onCleared={handleClear} />
              <ClearanceCard title={t("offboarding:it")} section="it" item={clearance.it} onCleared={handleClear} />
              <ClearanceCard title={t("offboarding:manager")} section="manager" item={clearance.manager} onCleared={handleClear} />
            </div>

            <ExitInterviewCard exit={exit} onSaved={() => dispatch(fetchExitById(id))} />
          </div>

          {/* Settlement summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
              <h2 className="font-semibold text-slate-800 dark:text-white mb-5">{t("offboarding:settlement_summary")}</h2>
              {settlement ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-white/50">{t("offboarding:pending_salary")} ({settlement.pendingSalaryDays}d)</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{formatAmount(settlement.pendingSalaryAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-white/50">{t("offboarding:leave_encashment")} ({settlement.encashableDays}d)</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-300">+{formatAmount(settlement.leaveEncashmentAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-white/50">{t("offboarding:pf_balance")}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-300">+{formatAmount(settlement.pfBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-white/50">{t("offboarding:loan_recovery")}</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-300">-{formatAmount(settlement.loanOutstanding)}</span>
                  </div>
                  <div className="pt-3 mt-2 border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
                    <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">{t("offboarding:net_settlement")}</span>
                    <span className="text-xl font-bold text-teal-700 dark:text-teal-300">{formatAmount(settlement.netSettlement)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">{t("offboarding:no_settlement_yet")}</p>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 space-y-3">
                {exit.status === EXIT_STATUS.COMPLETED ? (
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                    <FiCheckCircle className="h-4 w-4" /> {t("offboarding:processed_on")} {exit.settlement?.processedOn ? dayjs(exit.settlement.processedOn).format("YYYY-MM-DD") : ""}
                  </div>
                ) : exit.status === EXIT_STATUS.CANCELLED ? (
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400">
                    <FiXCircle className="h-4 w-4" /> {t("offboarding:cancelled")}
                  </div>
                ) : (
                  <>
                    <Button
                      type="button"
                      title={t("offboarding:process_settlement")}
                      icon={FiCheckCircle}
                      disabled={!allCleared}
                      onClick={handleProcessSettlement}
                      className="!w-full !rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0 !text-white disabled:!opacity-50"
                    />
                    {!allCleared && (
                      <p className="text-xs text-center text-slate-400">{t("offboarding:complete_clearance_hint")}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full text-center text-xs font-medium text-slate-400 hover:text-rose-500"
                    >
                      {t("offboarding:cancel_exit")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitDetail;
