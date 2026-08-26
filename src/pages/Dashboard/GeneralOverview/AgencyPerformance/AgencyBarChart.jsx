import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { showDashboard } from "store/slices/dashboardSlice";
import { ChartNoAxesColumn } from "lucide-react";
import Card from "components/Card";

// Color palette (same as pie chart)
import { chartColors as COLORS } from "global/constant";

const AgencyBarChart = () => {
  const { t, i18n } = useTranslation();
  const dashboard_analytics = useSelector(showDashboard);
  const isRTL = i18n.language === "ar";

  // Extract and validate data
  const revenueByAgency = dashboard_analytics?.revenueByAgency || [];

  // Filter and map valid entries
  const chartDataRaw =
    revenueByAgency.length > 0
      ? revenueByAgency
          .filter(
            (agency) =>
              !(agency.total_revenue === 0 && agency.total_bookings === 0)
          )
          .map((agency, index) => {
            const revenue = agency.total_revenue || 0;
            return {
              name: agency.agency_name || t("unknown_agency"),
              revenue,
              logRevenue: revenue > 0 ? Math.log10(revenue) : 0,
              color: COLORS[index % COLORS.length],
            };
          })
      : [];

  const hasData = chartDataRaw.length > 0;

  const chartData = hasData
    ? chartDataRaw
    : [
        {
          name: t("no_data"),
          revenue: 0,
          logRevenue: 0,
          color: "#e5e7eb", // light gray
        },
      ];

  const defaultTicks = [0, 1, 2, 3, 4];
  const maxLogValue = hasData
    ? Math.max(...chartData.map((d) => d.logRevenue))
    : 4;

  const ticks = hasData
    ? Array.from({ length: Math.ceil(maxLogValue) + 1 }, (_, i) => i)
    : defaultTicks;

  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 hover:shadow-lg h-[510px] flex flex-col">
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <h3 className="text-base font-semibold my-4 flex items-center gap-2">
          <ChartNoAxesColumn /> {t("dashboard:revenue_by_agencies_top_10")}
        </h3>
      </div>

      <div className="h-[350px] w-full overflow-auto">
        <ResponsiveContainer width="100%" height={350} minWidth={600}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 10,
              right: isRTL ? 10 : 0,
              left: isRTL ? 0 : 10,
              bottom: 10,
            }}
          >
            <XAxis
              type="number"
              reversed={isRTL}
              domain={[0, Math.max(4, Math.ceil(maxLogValue))]}
              ticks={ticks}
              tick={{ fill: "#374151", fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(value) =>
                value === 0 ? "0" : Math.pow(10, value).toLocaleString()
              }
            />

            <YAxis
              type="category"
              dataKey="name"
              orientation={isRTL ? "right" : "left"}
              tick={{
                fill: "#374151",
                fontSize: 12,
                fontWeight: 500,
                ...(isRTL && { textAnchor: "end", dx: -4 }),
              }}
              axisLine={{ stroke: "#e5e7eb" }}
              width={100}
            />

            {hasData && (
              <Tooltip
                formatter={(value, _, obj) => [
                  `${t("sar")} ${obj.payload.revenue.toLocaleString()}`,
                  t("revenue"),
                ]}
                contentStyle={{
                  backgroundColor: "#fff",
                  borderColor: "#e5e7eb",
                  color: "#111827",
                  fontSize: 10,
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
            )}

            <Bar
              dataKey="logRevenue"
              radius={[0, 4, 4, 0]}
              barSize={hasData ? 20 : 0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default AgencyBarChart;
