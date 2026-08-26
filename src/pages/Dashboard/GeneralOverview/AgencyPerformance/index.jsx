import { useTranslation } from "react-i18next";
import Card from "components/Card";
import AgencyPieChart from "./AgencyPieChart";
import AgencyBarChart from "./AgencyBarChart";
import AgencyTable from "./AgencyTable";

const AgencyPerformance = () => {
  const { t } = useTranslation();
  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl p-6 ">
      <div className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            {t("dashboard:agencies_revenue")}
          </h2>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 ">
          <AgencyBarChart />
        </div>
        <div className="lg:col-span-1 ">
          <AgencyPieChart />
        </div>
      </div>

      <AgencyTable />
    </Card>
  );
};

export default AgencyPerformance;
