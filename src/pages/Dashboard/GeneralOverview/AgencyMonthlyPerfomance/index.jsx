import { useTranslation } from "react-i18next";
import Card from "components/Card";
import AgencyMonthlyTable from "./AgencyMonthlyTable";

const AgencyMonthlyPerformance = () => {
  const { t } = useTranslation();
  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl p-6 ">
      <div className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            {t("dashboard:agency_monthly_revenue")}
          </h2>
        </div>
      </div>
      <div className="mt-4">
        <AgencyMonthlyTable />
      </div>
    </Card>
  );
};

export default AgencyMonthlyPerformance;
