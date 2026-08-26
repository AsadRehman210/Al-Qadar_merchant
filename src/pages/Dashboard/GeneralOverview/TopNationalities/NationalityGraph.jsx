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

// Color palette for bars
import { chartColors as COLORS } from "global/constant";

const NationalityGraph = () => {
  const { t, i18n } = useTranslation();
  const dashboard_analytics = useSelector(showDashboard);
  const isRTL = i18n.language === "ar";
  const TopNationalities = dashboard_analytics?.topNationalities || [];

  // Filter and map valid entries
  const chartDataRaw =
    TopNationalities.length > 0
      ? TopNationalities.filter(
          (nationality) => nationality.total_revenue > 0
        ).map((nationality, index) => {
          const revenue = nationality.total_revenue || 0;
          const name =
            nationality.nationality_name || t("dashboard:without_nationality");
          return {
            name,
            revenue,
            logRevenue: revenue > 0 ? Math.log10(revenue) : 0,
            color: COLORS[index % COLORS.length],
            flagImage: nationality.nationality_flag
              ? nationality.nationality_flag.startsWith("data:")
                ? nationality.nationality_flag
                : `data:image/png;base64,${nationality.nationality_flag}`
              : null,
            bookings: nationality.total_bookings || 0,
            percentage: nationality.percentage_of_total_revenue || "0",
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
          color: "#e5e7eb",
          bookings: 0,
          percentage: "0",
        },
      ];

  const defaultTicks = [0, 1, 2, 3, 4, 5, 6, 7];
  const maxLogValue = hasData
    ? Math.max(...chartData.map((d) => d.logRevenue))
    : 7;

  const ticks = hasData
    ? Array.from({ length: Math.ceil(maxLogValue) + 1 }, (_, i) => i)
    : defaultTicks;

  // Custom label component for flags (positioned on top of bars)
  const CustomLabel = (props) => {
    const { x, y, width, index } = props;
    if (!hasData || index === undefined) return null;

    // Get the data item using the index
    const dataItem = chartData[index];
    const flagSrc = dataItem?.flagImage;

    if (flagSrc) {
      return (
        <g>
          <image
            x={x + width / 2 - 26} // adjust center alignment
            y={y - 40} // move higher so it doesn't overlap bar
            width={60} // bigger width
            height={25} // bigger height
            href={flagSrc}
            style={{ borderRadius: "3px" }}
          />
        </g>
      );
    }

    // Return null when no flag is present - don't show any text
    return null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <h3
          className={`text-base font-semibold my-4 flex items-center ${
            isRTL ? "gap-3" : "gap-2"
          }`}
        >
          <ChartNoAxesColumn /> {t("dashboard:revenue_by_nationalities_top_10")}
        </h3>
      </div>

      <div className="h-[350px] w-full overflow-auto relative">
        <ResponsiveContainer width="100%" height={350} minWidth={600}>
          <BarChart
            data={chartData}
            margin={{
              top: 50,
              right: isRTL ? 0 : 20,
              left: isRTL ? 20 : 0,
              bottom: 60,
            }}
          >
            <XAxis
              type="category"
              dataKey="name"
              reversed={isRTL}
              tick={{
                fill: "#374151",
                fontSize: 10,
                fontWeight: 500,
                ...(isRTL && { textAnchor: "start", dx: 8 }),
              }}
              axisLine={{ stroke: "#e5e7eb" }}
              angle={-45}
              textAnchor="end"
              height={60}
            />

            <YAxis
              type="number"
              orientation={isRTL ? "right" : "left"}
              domain={[0, Math.max(7, Math.ceil(maxLogValue))]}
              ticks={ticks}
              tick={{
                fill: "#374151",
                fontSize: 12,
                fontWeight: 500,
                ...(isRTL && { textAnchor: "end", dx: -4 }),
              }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(value) =>
                value === 0 ? "0" : `${Math.pow(10, value).toLocaleString()}`
              }
            />

            {hasData && (
              <Tooltip
                formatter={(value, _, obj) => [
                  `${t(
                    "dashboard:sar"
                  )} ${obj.payload.revenue.toLocaleString()}`,
                  t("revenue"),
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{label}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {t("bookings")}: {data.bookings} |{" "}
                          {t("dashboard:share")}:{" "}
                          <span dir="ltr">{data.percentage}%</span>
                        </div>
                      </div>
                    );
                  }
                  return label;
                }}
                contentStyle={{
                  backgroundColor: "#fff",
                  borderColor: "#e5e7eb",
                  color: "#111827",
                  fontSize: 12,
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
            )}

            <Bar
              dataKey="logRevenue"
              radius={[4, 4, 0, 0]}
              barSize={hasData ? 25 : 0}
              label={<CustomLabel />}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NationalityGraph;
