import { useTranslation } from "react-i18next";
import { FiBarChart2 } from "react-icons/fi";

// This page previously pulled its data from the legacy (unrelated
// car-rental) backend's dashboard-analytics endpoint and rendered widgets
// built for that domain (agency/vehicle/route performance) — none of which
// apply to this ERP. Removed the call and the widgets; a real ERP dashboard
// (employee/department/finance summaries) is a separate feature to build
// later, not part of removing the legacy calls.
const GeneralOverview = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="h-14 w-14 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4">
        <FiBarChart2 className="h-7 w-7 text-teal-600 dark:text-teal-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        {t("dashboard:general_overview")}
      </h3>
      <p className="text-mutedForeground mt-1 max-w-sm">
        {t("dashboard:no_data_placeholder")}
      </p>
    </div>
  );
};

export default GeneralOverview;
