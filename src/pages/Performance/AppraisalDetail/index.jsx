import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/react";
import { FiArrowLeft, FiArrowRight, FiEdit2, FiBarChart2, FiStar, FiMessageSquare, FiCheck, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormTextarea from "components/FormTextarea";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { getAppraisalById, submitAppraisal, startReview, finalizeAppraisal } from "../performanceFakeData";
import { statusColor, ratingLabelKey, ratingColor, weightedScore } from "../performanceHelpers";
import AuditMeta from "components/AuditMeta";

const { view_performance, edit_performance } = alqadar_role_ids;

const FLOW_STEPS = [
  { key: "Draft", labelKey: "performance:step_draft" },
  { key: "Submitted", labelKey: "performance:step_submitted" },
  { key: "Under Review", labelKey: "performance:step_under_review" },
  { key: "Finalized", labelKey: "performance:step_finalized" },
];

const EDITABLE_STATUSES = ["Draft"];

const StatusFlow = ({ status, t }) => {
  const activeIdx = FLOW_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center gap-0 flex-wrap">
      {FLOW_STEPS.map((step, idx) => (
        <div key={step.key} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${idx <= activeIdx ? "bg-teal-500 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-400"}`}>
            {idx < activeIdx ? <FiCheck className="h-3 w-3" /> : <span>{idx + 1}.</span>} {t(step.labelKey)}
          </div>
          {idx < FLOW_STEPS.length - 1 && <div className={`h-0.5 w-6 mx-1 ${idx < activeIdx ? "bg-teal-400" : "bg-slate-200 dark:bg-white/10"}`} />}
        </div>
      ))}
    </div>
  );
};

const Stars = ({ rating, max = 5, t }) => {
  const labelKey = ratingLabelKey(rating);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <FiStar key={i} size={15} className={i < (rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-white/20"} />
      ))}
      {labelKey && <span className={`text-sm font-bold ml-1 ${ratingColor(rating)}`}>{rating}/5 — {t(labelKey)}</span>}
    </div>
  );
};

const AppraisalDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const [appraisal, setAppraisal] = useState(() => getAppraisalById(id));
  const [hrRating, setHrRating] = useState(appraisal?.overallRating || 3);
  const [hrComment, setHrComment] = useState(appraisal?.hrComment || "");
  const ws = useMemo(() => weightedScore(appraisal?.kpis), [appraisal?.kpis]);

  if (!checkRoleAuth(view_performance)) return null;

  if (!appraisal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <FiAlertCircle size={48} className="text-red-400" />
        <p className="text-lg text-slate-500">{t("performance:not_found")}</p>
        <Button type="button" title={t("back")} onClick={() => navigate("/performance")} btn="primary" />
      </div>
    );
  }

  const canManage = checkRoleAuth(edit_performance);

  const handleSubmit = () => {
    submitAppraisal(id);
    setAppraisal((p) => ({ ...p, status: "Submitted", submittedAt: new Date().toISOString().split("T")[0] }));
    toast.success(t("performance:appraisal_submitted_toast"));
  };

  const handleStartReview = () => {
    startReview(id);
    setAppraisal((p) => ({ ...p, status: "Under Review", reviewStartedAt: new Date().toISOString().split("T")[0] }));
    toast.success(t("performance:review_started_toast"));
  };

  const handleFinalize = () => {
    finalizeAppraisal(id, hrRating, hrComment);
    setAppraisal((p) => ({ ...p, status: "Finalized", overallRating: hrRating, hrComment, finalizedAt: new Date().toISOString().split("T")[0] }));
    toast.success(t("performance:appraisal_finalized_toast"));
  };

  const tabCls = ({ selected }) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all outline-none ${selected ? "bg-[var(--color-teal-500)] text-white shadow-sm" : "text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10"}`;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-6 flex flex-wrap items-start gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/performance")} icon={isRTL ? FiArrowRight : FiArrowLeft} className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 mt-1" iconClass="!text-lg" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">{appraisal.employeeName}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(appraisal.status)}`}>{appraisal.status}</span>
            </div>
            <p className="text-slate-500 dark:text-white/50 text-sm">{appraisal.appraisalNo} · {appraisal.cycle} {appraisal.year} · {appraisal.department}</p>
          </div>
          <div className="flex gap-2">
            {canManage && appraisal.status === "Draft" && (
              <Button type="button" title={t("performance:submit_for_review")} icon={FiCheck} onClick={handleSubmit} className="!rounded-md !bg-blue-600 hover:!bg-blue-700 !border-0 !text-white" />
            )}
            {canManage && EDITABLE_STATUSES.includes(appraisal.status) && (
              <Button type="button" title={t("edit")} icon={FiEdit2} onClick={() => navigate(`/performance/edit/${id}`)} btn="primary" className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0" />
            )}
          </div>
        </div>

        {/* Progress stepper */}
        <div className="mb-6 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl px-5 py-4 overflow-x-auto">
          <StatusFlow status={appraisal.status} t={t} />
        </div>

        <TabGroup>
          <TabList className="flex flex-wrap gap-1 p-1.5 bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 mb-6">
            <Tab className={tabCls}><FiBarChart2 size={14} />{t("performance:overview_tab")}</Tab>
            <Tab className={tabCls}><FiStar size={14} />{t("performance:kpis_tab")}</Tab>
            <Tab className={tabCls}><FiMessageSquare size={14} />{t("performance:feedback_tab")}</Tab>
          </TabList>

          <TabPanels>
            {/* Overview */}
            <TabPanel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: t("performance:field_cycle"), value: `${appraisal.cycle} ${appraisal.year}` },
                  { label: t("performance:field_period"), value: appraisal.period },
                  { label: t("performance:field_reviewer"), value: appraisal.reviewerName },
                  { label: t("performance:field_submitted"), value: appraisal.submittedAt || "—" },
                  { label: t("performance:field_review_started"), value: appraisal.reviewStartedAt || "—" },
                  { label: t("performance:field_finalized"), value: appraisal.finalizedAt || "—" },
                  { label: t("performance:field_kpi_score"), value: ws ? `${ws} / 5` : t("performance:pending") },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-4">
                    <p className="text-xs text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
                  </div>
                ))}
                <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-4 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AuditMeta record={appraisal} />
                </div>
              </div>
              {appraisal.overallRating && (
                <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t("performance:overall_rating")}</h3>
                  <Stars rating={appraisal.overallRating} t={t} />
                </div>
              )}
            </TabPanel>

            {/* KPIs */}
            <TabPanel>
              <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{t("performance:kpis_goals")}</h3>
                  {ws && <span className="text-sm font-bold text-teal-600">{t("performance:weighted_score")}: {ws} / 5</span>}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-medium text-slate-500 dark:text-white/40 border-b border-slate-100 dark:border-white/10">
                        <th className="px-6 py-3">{t("performance:category_label")}</th>
                        <th className="px-4 py-3">{t("performance:col_goal")}</th>
                        <th className="px-4 py-3">{t("performance:col_weight")}</th>
                        <th className="px-4 py-3">{t("performance:col_target")}</th>
                        <th className="px-4 py-3">{t("performance:col_achieved")}</th>
                        <th className="px-4 py-3">{t("performance:col_progress")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appraisal.kpis.map((kpi) => {
                        const rawPct = kpi.achievedScore ? Math.round((kpi.achievedScore / kpi.targetScore) * 100) : 0;
                        const barPct = Math.min(100, rawPct);
                        return (
                          <tr key={kpi.id} className="border-b border-slate-50 dark:border-white/5">
                            <td className="px-6 py-4"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{kpi.category}</span></td>
                            <td className="px-4 py-4 text-slate-700 dark:text-white/80 max-w-[200px]">{kpi.goal}</td>
                            <td className="px-4 py-4 text-slate-500">{kpi.weight}%</td>
                            <td className="px-4 py-4"><Stars rating={kpi.targetScore} t={t} /></td>
                            <td className="px-4 py-4">{kpi.achievedScore ? <Stars rating={kpi.achievedScore} t={t} /> : <span className="text-slate-300 text-xs">{t("performance:pending")}</span>}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${barPct >= 80 ? "bg-emerald-500" : barPct >= 60 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${barPct}%` }} />
                                </div>
                                <span className="text-xs text-slate-500">{rawPct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabPanel>

            {/* Feedback */}
            <TabPanel>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">{t("performance:self_assessment")}</h3>
                    <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{appraisal.selfComment || t("performance:no_self_assessment")}</p>
                  </div>
                  <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">{t("performance:manager_comment")}</h3>
                    <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{appraisal.managerComment || t("performance:no_manager_comment")}</p>
                  </div>
                  {canManage && appraisal.status === "Submitted" && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-200 dark:border-amber-500/30 rounded-2xl p-5">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3">{t("performance:step_submitted")} → {t("performance:step_under_review")}</p>
                      <Button type="button" title={t("performance:start_review")} icon={FiCheck} onClick={handleStartReview} className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-amber-500 hover:!bg-amber-600" />
                    </div>
                  )}
                </div>
                <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t("performance:hr_final_review")}</h3>
                  {appraisal.status === "Finalized" ? (
                    <div>
                      <Stars rating={appraisal.overallRating} t={t} />
                      <p className="text-sm text-slate-600 dark:text-white/70 mt-3 leading-relaxed">{appraisal.hrComment || "—"}</p>
                    </div>
                  ) : canManage ? (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-500 dark:text-white/50 -mt-1">{t("performance:rating_scale_legend")}</p>
                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-white/60 mb-2 block">{t("performance:overall_rating_label")}</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} type="button" onClick={() => setHrRating(s)} className={`w-9 h-9 rounded-xl font-bold text-sm transition-colors ${s === hrRating ? "bg-[var(--color-teal-500)] text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-200"}`}>{s}</button>
                          ))}
                          <span className={`text-sm font-medium ml-2 ${ratingColor(hrRating)}`}>{t(ratingLabelKey(hrRating))}</span>
                        </div>
                      </div>
                      <FormTextarea
                        label={t("performance:hr_comment_label")}
                        labelClass="!text-xs font-medium text-slate-600 dark:text-white/60"
                        value={hrComment}
                        onValueChange={setHrComment}
                        rows={4}
                        placeholder={t("performance:hr_comment_placeholder")}
                      />
                      {(appraisal.status === "Submitted" || appraisal.status === "Under Review") && (
                        <Button type="button" title={t("performance:finalize_appraisal")} icon={FiCheck} onClick={handleFinalize} className="!w-auto !rounded-md !h-10 !px-5 !border-0 !text-white !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)]" />
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">{t("performance:pending")}</p>
                  )}
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
};

export default AppraisalDetail;
