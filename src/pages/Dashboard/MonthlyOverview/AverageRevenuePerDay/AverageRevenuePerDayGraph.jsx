import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { ChartNoAxesColumn } from "lucide-react";
import {
  showDashboardByDate,
  showMonthlyStartDate,
  showMonthlyEndDate,
} from "store/slices/dashboardSlice";
import moment from "moment-timezone";

const AverageRevenuePerDayGraph = () => {
  const { t, i18n } = useTranslation();
  const dashboard_analytics_by_date = useSelector(showDashboardByDate);
  const isRTL = i18n.language === "ar";
  const startDate = useSelector(showMonthlyStartDate);
  const endDate = useSelector(showMonthlyEndDate);

  const start_date = moment
    .tz(startDate, "D MMM YYYY", "Asia/Riyadh")
    .format("YYYY-MM-DD");
  const end_date = moment
    .tz(endDate, "D MMM YYYY", "Asia/Riyadh")
    .format("YYYY-MM-DD");

  const revenueRevenuePerDay =
    dashboard_analytics_by_date?.averageRevenueByDatePerDay || [];

  const revenueMap = revenueRevenuePerDay.reduce((acc, item) => {
    acc[item.date] = {
      average_revenue_per_ride: item?.average_per_ride || 0,
      total_revenue: item?.total_revenue || 0,
    };
    return acc;
  }, {});

  const allDates = [];
  let currentDate = moment(start_date);
  const lastDate = moment(end_date);

  while (currentDate.isSameOrBefore(lastDate)) {
    const dateStr = currentDate.format("YYYY-MM-DD");
    const data = revenueMap[dateStr] || {
      average_revenue_per_ride: 0,
      total_revenue: 0,
    };

    allDates.push({
      date: dateStr,
      average_revenue_per_ride: data.average_revenue_per_ride,
      total_revenue: data.total_revenue,
      logAverageRevenuePerRide:
        data.average_revenue_per_ride > 0
          ? Math.log10(data.average_revenue_per_ride)
          : 0,
      logTotalRevenue:
        data.total_revenue > 0 ? Math.log10(data.total_revenue) : 0,
    });

    currentDate.add(1, "day");
  }

  const maxLogValue = Math.max(
    ...allDates.map((d) =>
      Math.max(d.logAverageRevenuePerRide, d.logTotalRevenue)
    )
  );

  const yTicks = [0];
  for (let i = 1; i <= Math.ceil(maxLogValue); i++) {
    yTicks.push(i);
  }

  // Check if average revenue per ride and total revenue are the same for any data point
  const hasSameRevenue = allDates.some(
    (item) =>
      item.average_revenue_per_ride === item.total_revenue &&
      item.average_revenue_per_ride > 0
  );

  return (
    <div>
      <h3
        className={`text-base font-semibold my-4 flex items-center ${
          isRTL ? "gap-3" : "gap-2"
        }`}
      >
        <ChartNoAxesColumn /> {t("dashboard:average_revenue_overview")}
      </h3>
      <div className="items-center justify-center w-full h-[400px] overflow-auto">
        <ResponsiveContainer width="100%" height={400} minWidth={600}>
          <AreaChart
            data={allDates}
            margin={{
              top: 0,
              right: isRTL ? 0 : 10,
              left: isRTL ? 10 : 0,
              bottom: 10,
            }}
          >
            {/* Gradient definitions */}
            <defs>
              {hasSameRevenue ? (
                <linearGradient id="shadowNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                </linearGradient>
              ) : (
                <>
                  <linearGradient id="shadowNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="shadowTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#41ED5B" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#41ED5B" stopOpacity={0} />
                  </linearGradient>
                </>
              )}
            </defs>

            <XAxis
              dataKey="date"
              reversed={isRTL}
              tickMargin={isRTL ? 24 : 8}
              tick={{
                fill: "#374151",
                fontSize: 12,
                fontWeight: 500,
                ...(isRTL && { dx: -14 }),
              }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
              angle={-45}
              textAnchor="end"
              height={80}
            />

            <YAxis
              type="number"
              orientation={isRTL ? "right" : "left"}
              domain={[0, maxLogValue]}
              ticks={yTicks}
              tick={{
                fill: "#374151",
                fontSize: 12,
                fontWeight: 500,
                ...(isRTL && { textAnchor: "end", dx: -4 }),
              }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(value) => {
                if (value === 0) return `${t("sar")} 0`;
                return `${t("sar")} ${Math.pow(
                  10,
                  value
                ).toLocaleString()}`;
              }}
            />

            <Tooltip
              content={({ payload, label }) => {
                if (!payload || !payload.length) return null;
                const p = payload[0].payload;
                return (
                  <div
                    className="bg-white border border-gray-200 p-2 text-xs"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <div className="font-semibold">
                      {new Date(label).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-[#60A5FA]">
                      {t("dashboard:average_revenue_per_ride")}:{" "}
                      {t("sar")}{" "}
                      {p.average_revenue_per_ride.toLocaleString()}
                    </div>
                    <div className="text-[#41ED5B]">
                      {t("dashboard:total_revenue_label")}: {t("sar")}{" "}
                      {p.total_revenue.toLocaleString()}
                    </div>
                  </div>
                );
              }}
            />

            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{
                gap: isRTL ? 16 : 8,
              }}
              formatter={(value) => (
                <span style={{ marginInlineStart: isRTL ? 12 : 8 }}>
                  {value}
                </span>
              )}
            />

            {/* Average Revenue per Ride Area */}
            <Area
              type="monotone"
              dataKey="logAverageRevenuePerRide"
              stroke="#60A5FA"
              strokeWidth={3}
              fill="url(#shadowNet)"
              dot={false}
              activeDot={{ r: 5 }}
              name={t("dashboard:average_revenue_per_ride")}
            />

            {/* Total Revenue Area */}
            <Area
              type="monotone"
              dataKey="logTotalRevenue"
              stroke="#41ED5B"
              strokeWidth={3}
              fill="url(#shadowTotal)"
              dot={false}
              activeDot={{ r: 5 }}
              name={t("dashboard:total_revenue_label")}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AverageRevenuePerDayGraph;
