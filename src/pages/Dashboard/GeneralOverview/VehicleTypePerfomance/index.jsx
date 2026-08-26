import { useTranslation } from "react-i18next";
import Card from "components/Card";
import VehicleTypePieChart from "./VehicleTypePieChart";
import VehicleTypeTable from "./VehicleTypeTable";

const VehicleTypePerformance = () => {
  const { t } = useTranslation();
  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl p-6 ">
      <div className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            {t("dashboard:vehicle_type_revenue")}
          </h2>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* <VehicleBarChart /> */}
        <div className="lg:col-span-2 h-[500px]">
          <VehicleTypeTable />
        </div>

        {/* Pie chart should take 1 column */}
        <div className="lg:col-span-1 h-[500px]">
          <VehicleTypePieChart />
        </div>
      </div>
    </Card>
  );
};

export default VehicleTypePerformance;
