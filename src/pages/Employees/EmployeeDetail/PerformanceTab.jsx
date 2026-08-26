import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { HiOutlineStar } from "react-icons/hi2";
import { getAppraisals } from "../../Performance/performanceFakeData";
import { statusColor, ratingLabelKey, weightedScore } from "../../Performance/performanceHelpers";

const PerformanceTab = ({ data }) => {
  const { t } = useTranslation();
  const employeeId = data?._id;
  const history = getAppraisals()
    .filter((a) => a.employeeId === employeeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-500/20 dark:via-emerald-500/10 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HiOutlineStar className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("performance:title")}
            </h3>
          </div>
          <Link
            to="/performance"
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
          >
            {t("performance:view_in_performance")}
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-md overflow-hidden">
        {history.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500 dark:text-white/60">
            {t("no_record_found")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("performance:col_appraisal_no")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("performance:col_cycle")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("performance:col_score")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("performance:overall_rating")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("performance:col_status")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90" />
                </tr>
              </thead>
              <tbody>
                {history.map((a) => {
                  const ws = weightedScore(a.kpis);
                  const rk = ratingLabelKey(a.overallRating);
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-slate-100 dark:border-white/10 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-white/5"
                    >
                      <td className="py-2.5 px-4 text-slate-800 dark:text-white/90">{a.appraisalNo}</td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-white/70">{a.cycle} {a.year}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-white">
                        {ws ? `${ws} / 5` : t("performance:pending")}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-white/70">
                        {rk ? t(rk) : "—"}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(a.status)}`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <Link
                          to={`/performance/detail/${a.id}`}
                          className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                        >
                          {t("view_details")}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceTab;
