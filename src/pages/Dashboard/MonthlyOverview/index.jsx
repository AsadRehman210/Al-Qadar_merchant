import { useTranslation } from "react-i18next";
import { FiCalendar } from "react-icons/fi";

// This page previously pulled its data from the legacy (unrelated
// car-rental) backend's dashboard-analytics-by-date endpoint and rendered
// widgets built for that domain (booking/vehicle performance) — none of
// which apply to this ERP. Removed the call and the widgets; a real ERP
// dashboard is a separate feature to build later.
const MonthlyOverview = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center mt-8">
      <div className="h-14 w-14 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4">
        <FiCalendar className="h-7 w-7 text-teal-600 dark:text-teal-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        {t("dashboard:monthly_overview")}
      </h3>
      <p className="text-mutedForeground mt-1 max-w-sm">
        {t("dashboard:no_data_placeholder")}
      </p>
    </div>
  );
};

export default MonthlyOverview;
