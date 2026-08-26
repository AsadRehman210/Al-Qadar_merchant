import { useSelector } from "react-redux";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { showDashboard } from "../../store/slices/dashboardSlice";
import { ChartPie } from "lucide-react";

// Color palette for the chart
import { chartColors as COLORS } from "global/constant";

const AgencyRevenueDistributionCard = () => {
  const dashboard_analytics = useSelector(showDashboard);

  // Safe destructuring with null checking
  const revenueByAgency = dashboard_analytics?.revenueByAgency || [];

  // Filter + format data
  const chartData =
    revenueByAgency.length > 0
      ? revenueByAgency
          .filter(
            (agency) =>
              !(agency.total_revenue === 0 && agency.total_bookings === 0)
          )
          .map((agency, index) => ({
            name: agency.agency_name || "Unknown Agency",
            value: parseFloat(agency.percentage_of_total_bookings) || 0,
            revenue: agency.total_revenue || 0,
            bookings: agency.total_bookings || 0,
            color: COLORS[index % COLORS.length],
          }))
      : [];

  // If all entries are filtered out → show empty placeholder slice
  const displayData =
    chartData.length > 0
      ? chartData
      : [
          {
            name: "No Data",
            value: 1, // dummy slice
            revenue: 0,
            bookings: 0,
            color: "#e5e7eb", // gray
          },
        ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <h3 className="text-base font-semibold my-4 flex items-center gap-2">
          <ChartPie /> Revenue Distribution
        </h3>
      </div>

      <div className="h-[250px] sm:h-[300px] mt-4 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={false}
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {chartData.length > 0 && (
              <Tooltip
                formatter={(value, name, props) => {
                  const payload = props.payload;
                  return [
                    `${value}% (${payload.bookings} bookings)`,
                    `Revenue: SAR ${payload.revenue.toLocaleString()}`,
                    `Agency: ${payload.name}`,
                  ];
                }}
                contentStyle={{
                  backgroundColor: "#fff",
                  borderColor: "#e5e7eb",
                  color: "#111827",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {chartData.length > 0 ? (
          chartData.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 dark:text-gray-300">
                {entry.name}
              </span>
            </div>
          ))
        ) : (
          <span className="text-gray-500 italic">No data available</span>
        )}
      </div>
    </div>
  );
};

export default AgencyRevenueDistributionCard;
