import { useTranslation } from "react-i18next";
import Card from "components/Card";
import VehicleRevenueTable from "./VehicleRevenueTable";

const VehiclePerformance = () => {
  const { t } = useTranslation();
  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 hover:shadow-lg">
      <div className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            {t("dashboard:vehicle_performance")}
          </h2>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-16">
        <VehicleRevenueTable />
      </div>
    </Card>
  );
};

export default VehiclePerformance;
