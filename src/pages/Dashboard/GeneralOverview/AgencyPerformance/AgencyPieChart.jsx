import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { showDashboard } from "store/slices/dashboardSlice";
import { ChartPie } from "lucide-react";
import Card from "components/Card";
import { useEffect, useRef, useState } from "react";

// Color palette for the chart
import { chartColors as COLORS } from "global/constant";

const AgencyPieChart = () => {
  const { t, i18n } = useTranslation();
  const dashboard_analytics = useSelector(showDashboard);
  const isRTL = i18n.language === "ar";

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
            name: agency.agency_name || t("unknown_agency"),
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
            name: t("no_data"),
            value: 1, // dummy slice
            revenue: 0,
            bookings: 0,
            color: "#e5e7eb", // gray
          },
        ];
  // ✅ Track container size
  const containerRef = useRef(null);
  const [outerRadius, setOuterRadius] = useState(100);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;

        // Pick the smaller dimension, divide by 2.5 to leave some padding
        const radius = Math.max(40, Math.min(width, height) / 2.5);

        setOuterRadius(radius);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 hover:shadow-lg h-[510px] flex flex-col">
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <h3
          className={`text-base font-semibold my-4 flex items-center ${
            isRTL ? "gap-3" : "gap-2"
          }`}
        >
          <ChartPie /> {t("dashboard:revenue_distribution")}
        </h3>
      </div>

      <div
        ref={containerRef}
        className="h-[250px] sm:h-[300px] mt-4 w-full flex-1 overflow-auto"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              outerRadius={outerRadius}
              dataKey="value"
              label={false}
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {chartData.length > 0 && (
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div
                      className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-xs"
                      style={{
                        borderColor: "#e5e7eb",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <div className="font-semibold text-gray-800 mb-1">
                        {t("agency_name")}: {p.name}
                      </div>
                      <div className="text-gray-600">
                        {t("revenue")}: {t("sar")}{" "}
                        {p.revenue.toLocaleString()}
                      </div>
                      <div className="text-gray-600">
                        <span dir="ltr">
                          {p.value}% ({p.bookings} {t("bookings")})
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div
        className={`mt-4 flex flex-wrap text-sm flex-1 max-h-18 overflow-y-auto pr-2 ${
          isRTL ? "gap-3" : "gap-2"
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {chartData.length > 0 ? (
          chartData.map((entry, index) => (
            <div
              key={index}
              className={`flex items-center ${isRTL ? "gap-3" : "gap-2"}`}
            >
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
          <span className="text-gray-500 italic">
            {t("dashboard:no_data_available")}
          </span>
        )}
      </div>
    </Card>
  );
};

export default AgencyPieChart;
