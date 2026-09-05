import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiPlus, FiSearch, FiEye, FiEdit2, FiStar, FiBarChart2, FiClock, FiUserCheck } from "react-icons/fi";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { useListFilters } from "hooks/useListFilters";
import { getAppraisals, APPRAISAL_STATUS_OPTS, CYCLE_OPTS } from "./performanceFakeData";
import { statusColor, ratingLabelKey, weightedScore } from "./performanceHelpers";

const { view_employee, add_employee } = rafeeqi_role_ids;

const EDITABLE_STATUSES = ["Draft"];

const Stars = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <FiStar key={s} size={13} className={s <= (rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300"} />
    ))}
  </div>
);

const SummaryCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div><p className="text-xs text-slate-500 dark:text-white/50">{label}</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p></div>
  </div>
);

const Performance = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filters, setFilters] = useListFilters("talent-performance", { search: "", statusId: null, cycleId: null });
  const { search } = filters;
  const selStatus = APPRAISAL_STATUS_OPTS.find((o) => o.id === filters.statusId) || null;
  const selCycle = CYCLE_OPTS.find((o) => o.id === filters.cycleId) || null;

  const appraisals = useMemo(() => getAppraisals(), []);
  const filtered = useMemo(() => {
    return appraisals.filter((a) => {
      const q = search.toLowerCase();
      const matchQ = a.employeeName.toLowerCase().includes(q) || a.appraisalNo.toLowerCase().includes(q);
      const matchS = !selStatus || a.status === selStatus.id;
      const matchC = !selCycle || a.cycle === selCycle.id;
      return matchQ && matchS && matchC;
    });
  }, [appraisals, search, selStatus, selCycle]);

  const finalized = appraisals.filter((a) => a.status === "Finalized").length;
  const avgRating = (() => {
    const f = appraisals.filter((a) => a.overallRating);
    return f.length ? (f.reduce((s, a) => s + a.overallRating, 0) / f.length).toFixed(1) : "—";
  })();
  const awaitingReview = appraisals.filter((a) => a.status === "Submitted").length;
  const inReview = appraisals.filter((a) => a.status === "Under Review").length;

  if (!checkRoleAuth(view_employee)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t("performance:title")}</h1>
            <p className="text-slate-500 dark:text-white/50 text-sm mt-1">{t("performance:module_desc")}</p>
          </div>
          {checkRoleAuth(add_employee) && (
            <Button
              type="button"
              title={t("performance:new_appraisal")}
              icon={FiPlus}
              iconClass="h-4 w-4 text-white"
              btn="primary"
              onClick={() => navigate("/performance/add")}
              className="!w-auto !rounded-md !h-10 !px-4 !border-0 !text-white !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)]"
            />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <SummaryCard icon={FiBarChart2} label={t("performance:total_appraisals")} value={appraisals.length} color="bg-teal-500" />
          <SummaryCard icon={FiStar} label={t("performance:finalized")} value={finalized} color="bg-emerald-500" />
          <SummaryCard icon={FiStar} label={t("performance:avg_rating")} value={avgRating} color="bg-amber-500" />
          <SummaryCard icon={FiClock} label={t("performance:awaiting_review")} value={awaitingReview} color="bg-blue-500" />
          <SummaryCard icon={FiUserCheck} label={t("performance:in_review")} value={inReview} color="bg-purple-500" />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-[1]" size={14} />
            <FormInput
              value={search}
              onValueChange={(v) => setFilters({ search: v })}
              placeholder={t("performance:search_placeholder")}
              wrapperClass="w-64"
              inputClass="!h-10 !rounded-xl !pl-9"
            />
          </div>
          <SelectDropdown data={APPRAISAL_STATUS_OPTS} selected={selStatus} setSelected={(v) => setFilters({ statusId: v?.id || null })} placeholder={t("performance:all_statuses")} classes="!h-10 !rounded-md !min-w-[150px]" />
          <SelectDropdown data={CYCLE_OPTS} selected={selCycle} setSelected={(v) => setFilters({ cycleId: v?.id || null })} placeholder={t("performance:all_cycles")} classes="!h-10 !rounded-md !min-w-[150px]" />
        </div>

        <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 dark:text-white/40 border-b border-slate-100 dark:border-white/10">
                  <th className="px-6 py-3">{t("performance:col_appraisal_no")}</th>
                  <th className="px-4 py-3">{t("performance:col_employee")}</th>
                  <th className="px-4 py-3">{t("performance:col_department")}</th>
                  <th className="px-4 py-3">{t("performance:col_cycle")}</th>
                  <th className="px-4 py-3">{t("performance:col_reviewer")}</th>
                  <th className="px-4 py-3">{t("performance:col_score")}</th>
                  <th className="px-4 py-3">{t("performance:col_rating")}</th>
                  <th className="px-4 py-3">{t("performance:col_status")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16 text-slate-400">{t("performance:no_appraisals")}</td></tr>
                ) : filtered.map((a) => {
                  const ws = weightedScore(a.kpis);
                  const labelKey = ratingLabelKey(a.overallRating);
                  return (
                    <tr key={a.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="px-6 py-3 font-mono text-xs text-teal-700 dark:text-teal-300">{a.appraisalNo}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{a.employeeName}</td>
                      <td className="px-4 py-3 text-slate-500">{a.department}</td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{a.cycle} {a.year}</span></td>
                      <td className="px-4 py-3 text-slate-500">{a.reviewerName}</td>
                      <td className="px-4 py-3">{ws ? <span className="font-semibold text-slate-700 dark:text-white/80">{ws} / 5</span> : <span className="text-slate-300 text-xs">{t("performance:pending")}</span>}</td>
                      <td className="px-4 py-3">
                        {a.overallRating ? (
                          <div className="flex items-center gap-1.5">
                            <Stars rating={a.overallRating} />
                            <span className="text-xs text-slate-500 dark:text-white/50">{t(labelKey)}</span>
                          </div>
                        ) : <span className="text-slate-300 text-xs">{t("performance:not_rated_yet")}</span>}
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(a.status)}`}>{a.status}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {checkRoleAuth(add_employee) && EDITABLE_STATUSES.includes(a.status) && (
                            <button onClick={() => navigate(`/performance/edit/${a.id}`)} className="text-slate-400 hover:text-teal-500" title={t("edit")}><FiEdit2 size={14} /></button>
                          )}
                          <button onClick={() => navigate(`/performance/detail/${a.id}`)} className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium flex items-center gap-1"><FiEye size={13} />{t("view")}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
