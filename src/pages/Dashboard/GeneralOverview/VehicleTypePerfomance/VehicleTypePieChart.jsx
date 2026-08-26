import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { showDashboard } from "store/slices/dashboardSlice";
import { ChartPie } from "lucide-react";
import Card from "components/Card";

// Generate dynamic colors (HSL gives unlimited unique shades)
const generateColors = (count) =>
  Array.from(
    { length: count },
    (_, i) => `hsl(${(i * 137.5) % 360}, 65%, 50%)`
  );

const VehicleTypePieChart = () => {
  const { t } = useTranslation();
  const dashboard_analytics = useSelector(showDashboard);

  const revenueByVehicleType = dashboard_analytics?.revenueByVehicleType || [];

  // Prepare raw chart data
  let chartData = revenueByVehicleType
    .filter((vehicleType) => vehicleType?.net_revenue > 0)
    .map((vehicleType) => ({
      name: vehicleType?.vehicle_type_name,
      value: vehicleType?.net_revenue || 0,
    }));

  // Sort by value descending
  chartData.sort((a, b) => b.value - a.value);

  // Handle >10 items (top 9 + Other)
  let otherItems = [];
  if (chartData.length > 10) {
    otherItems = chartData.slice(9);
    const otherTotal = otherItems.reduce((sum, item) => sum + item.value, 0);

    chartData = [
      ...chartData.slice(0, 9),
      { name: "Other", value: otherTotal, isOther: true, details: otherItems },
    ];
  }

  // If no data available, show empty placeholder slice
  const displayData =
    chartData.length > 0
      ? chartData
      : [
          {
            name: t("no_data"),
            value: 1,
            color: "#e5e7eb",
          },
        ];

  const COLORS = generateColors(displayData.length);

  // Custom Tooltip (handles "Other" and empty state)
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && chartData.length > 0) {
      const data = payload[0].payload;

      if (data.isOther) {
        return (
          <div className="bg-white border border-gray-200 shadow-md p-3 rounded-md text-sm">
            <p className="font-semibold mb-1">
              {t("dashboard:other_categories")}
            </p>
            {data.details.map((d, i) => (
              <p key={i} className="text-gray-700">
                {d.name}: SAR {d.value.toLocaleString()}
              </p>
            ))}
          </div>
        );
      }

      return (
        <div className="bg-white border border-gray-200 shadow-md p-3 rounded-md text-xs">
          <p className="font-semibold">{data.name}</p>
          <p className="text-gray-700">
            {t("revenue")}: {t("sar")}{" "}
            {data.value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 hover:shadow-lg h-full flex flex-col">
      <h3 className="text-base font-semibold my-4 flex items-center gap-2">
        <ChartPie /> {t("dashboard:revenue_by_vehicle_type")}
      </h3>

      <div className="w-full h-[350px] sm:h-[400px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              innerRadius="40%"
              outerRadius="70%"
              paddingAngle={0}
              stroke="#fff"
              strokeWidth={2}
            >
              {displayData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            {chartData.length > 0 && <Tooltip content={<CustomTooltip />} />}
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              content={({ payload }) => (
                <div className="flex flex-wrap justify-center gap-2 text-sm mt-2">
                  {chartData.length > 0 ? (
                    payload?.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-700 dark:text-gray-300">
                          {entry.value}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">
                      {t("dashboard:no_data_available")}
                    </span>
                  )}
                </div>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default VehicleTypePieChart;
