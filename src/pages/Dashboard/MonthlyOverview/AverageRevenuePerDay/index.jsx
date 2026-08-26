import { useTranslation } from "react-i18next";
import Card from "components/Card";
import AverageRevenuePerDayTable from "./AverageRevenuePerDayTable";
import AverageRevenuePerDayGraph from "./AverageRevenuePerDayGraph";

const AverageRevenuePerDay = () => {
  const { t } = useTranslation();
  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 hover:shadow-lg">
      <div className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            {t("dashboard:average_revenue_per_day")}
          </h2>
        </div>
      </div>
      <div className="mt-4 flex flex-col">
        <AverageRevenuePerDayGraph />
        <AverageRevenuePerDayTable />
      </div>
    </Card>
  );
};

export default AverageRevenuePerDay;
