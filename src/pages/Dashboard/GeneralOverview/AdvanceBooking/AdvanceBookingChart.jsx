import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { showDashboard } from "store/slices/dashboardSlice";
import { ChartPie } from "lucide-react";
import Card from "components/Card";
import { useEffect, useRef, useState } from "react";

// Color palette for the chart
const COLORS = [
  "#dc2626",
  "#2563eb",
  "#166534",
  "#ea580c",
  "#9333ea",
  "#0891b2",
  "#be185d",
  "#16a34a",
  "#475569",
  "#f59e0b",
];

const AdvanceBookingChart = () => {
  const { t, i18n } = useTranslation();
  const dashboard_analytics = useSelector(showDashboard);
  const isRTL = i18n.language === "ar";

  // Safe destructuring with null checking
  const advanceBookings = dashboard_analytics?.advanceBookings || [];

  // Calculate total bookings for percentage calculation
  const totalBookings = advanceBookings.reduce(
    (sum, item) => sum + (item.total_bookings || 0),
    0
  );

  // Filter + format data
  const chartData =
    advanceBookings.length > 0
      ? advanceBookings
          .filter(
            (item) => !(item.total_revenue === 0 && item.total_bookings === 0)
          )
          .map((item, index) => ({
            name: item.category || t("dashboard:unknown_category"),
            value:
              totalBookings > 0
                ? ((item.total_bookings || 0) / totalBookings) * 100
                : 0,
            revenue: item.total_revenue || 0,
            bookings: item.total_bookings || 0,
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

        // Pick the smaller dimension, divide by 2.8 to leave adequate padding
        const radius = Math.max(40, Math.min(width, height) / 2.2);

        setOuterRadius(radius);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 hover:shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3
          className={`text-base font-semibold flex items-center ${
            isRTL ? "gap-3" : "gap-2"
          }`}
        >
          <ChartPie /> {t("dashboard:advance_booking_distribution")}
        </h3>
      </div>

      <div ref={containerRef} className="flex-1 w-full overflow-hidden">
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
                formatter={(value, name, props) => {
                  const payload = props.payload;
                  return [
                    `(${payload.bookings} ${t("bookings")})`,
                    `${t("revenue")}: ${t(
                      "sar"
                    )} ${payload.revenue.toLocaleString()}`,
                    `${t("dashboard:category")}: ${payload.name}`,
                  ];
                }}
                contentStyle={{
                  backgroundColor: "#fff",
                  borderColor: "#e5e7eb",
                  color: "#111827",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  fontSize: 10,
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div
        className={`mt-2 flex flex-wrap text-sm overflow-y-auto ${
          isRTL ? "gap-3 pl-2" : "gap-2 pr-2"
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      >
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
          <span className="text-gray-500 italic">
            {t("dashboard:no_data_available")}
          </span>
        )}
      </div>
    </Card>
  );
};

export default AdvanceBookingChart;
