import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
} from "recharts";
import { ChartNoAxesColumn, Calendar } from "lucide-react";
import {
  showDashboardByDate,
  showMonthlyStartDate,
  showMonthlyEndDate,
} from "store/slices/dashboardSlice";
import moment from "moment-timezone";

const PeakBookingByDateGraph = () => {
  const { t, i18n } = useTranslation();
  const dashboard_analytics_by_date = useSelector(showDashboardByDate);
  const startDate = useSelector(showMonthlyStartDate);
  const endDate = useSelector(showMonthlyEndDate);
  const isRTL = i18n.language === "ar";

  const start_date = moment
    .tz(startDate, "D MMM YYYY", "Asia/Riyadh")
    .format("YYYY-MM-DD");
  const end_date = moment
    .tz(endDate, "D MMM YYYY", "Asia/Riyadh")
    .format("YYYY-MM-DD");

  const bookingsByDatePeak =
    dashboard_analytics_by_date?.bookingsByDatePeak || [];

  const bookingMap = bookingsByDatePeak.reduce((acc, item) => {
    acc[item.date] = {
      total_daily_bookings: item?.total_daily_bookings || 0,
    };
    return acc;
  }, {});

  const allDates = [];
  let currentDate = moment(start_date);
  const lastDate = moment(end_date);

  while (currentDate.isSameOrBefore(lastDate)) {
    const dateStr = currentDate.format("YYYY-MM-DD");
    const data = bookingMap[dateStr] || {
      total_daily_bookings: 0,
    };

    allDates.push({
      date: dateStr,
      total_daily_bookings: data.total_daily_bookings,
      formattedDate: currentDate.format("MMM DD"),
      dayOfWeek: currentDate.day(), // 0 = Sunday, 1 = Monday, etc.
      weekOfYear: currentDate.week(),
    });

    currentDate.add(1, "day");
  }

  const maxBookings = Math.max(...allDates.map((d) => d.total_daily_bookings));

  // Find the day with highest bookings in the entire month
  const monthlyPeakDay = allDates.reduce((max, current) =>
    current.total_daily_bookings > max.total_daily_bookings ? current : max
  );

  // Group dates by week and find peak day for each week
  const weeklyData = {};
  allDates.forEach((dateItem) => {
    // Create week key starting from Monday
    const weekStart = moment(dateItem.date).startOf("isoWeek");
    const weekKey = weekStart.format("YYYY-WW");

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = [];
    }
    weeklyData[weekKey].push(dateItem);
  });

  // Find peak booking day for each week
  const weeklyPeaks = {};
  Object.keys(weeklyData).forEach((weekKey) => {
    const weekDays = weeklyData[weekKey];
    const weekPeak = weekDays.reduce((max, current) =>
      current.total_daily_bookings > max.total_daily_bookings ? current : max
    );
    weeklyPeaks[weekPeak.date] = true;
  });

  // Add color information to each date
  const enhancedDates = allDates.map((dateItem, index) => {
    const weekStart = moment(dateItem.date).startOf("isoWeek");
    const weekEnd = moment(dateItem.date).endOf("isoWeek");
    const weekNumber = Math.floor(index / 7) + 1;

    return {
      ...dateItem,
      isMonthlyPeak: dateItem.date === monthlyPeakDay.date,
      isWeeklyPeak:
        weeklyPeaks[dateItem.date] && dateItem.date !== monthlyPeakDay.date,
      isRegular:
        !weeklyPeaks[dateItem.date] && dateItem.date !== monthlyPeakDay.date,
      weekNumber: weekNumber,
      weekStart: weekStart.format("MMM DD"),
      weekEnd: weekEnd.format("MMM DD"),
      isWeekStart: moment(dateItem.date).day() === 1, // Monday
      isWeekEnd: moment(dateItem.date).day() === 0, // Sunday
    };
  });

  // Get unique weeks for display
  const weekRanges = [];
  const seenWeeks = new Set();

  enhancedDates.forEach((dateItem) => {
    const weekKey = `${dateItem.weekStart}-${dateItem.weekEnd}`;
    if (!seenWeeks.has(weekKey)) {
      seenWeeks.add(weekKey);
      weekRanges.push({
        weekNumber: dateItem.weekNumber,
        weekStart: dateItem.weekStart,
        weekEnd: dateItem.weekEnd,
        range: `${dateItem.weekStart} - ${dateItem.weekEnd}`,
      });
    }
  });

  // Create nice Y-axis ticks based on max value
  const getYAxisTicks = (max) => {
    if (max <= 10) return [0, 2, 4, 6, 8, 10];
    if (max <= 50) return [0, 10, 20, 30, 40, 50];
    if (max <= 100) return [0, 20, 40, 60, 80, 100];
    return [0, 25, 50, 75, 100, Math.ceil(max / 25) * 25];
  };

  const yTicks = getYAxisTicks(maxBookings);

  return (
    <div>
      <h3
        className={`text-base font-semibold my-4 flex items-center ${
          isRTL ? "gap-3" : "gap-2"
        }`}
      >
        <ChartNoAxesColumn /> {t("dashboard:peak_booking_overview")}
      </h3>

      <div className="items-center justify-center w-full h-[450px] overflow-auto">
        <ResponsiveContainer width="100%" height={450} minWidth={600}>
          <BarChart
            data={enhancedDates}
            margin={{
              top: 20,
              right: isRTL ? 0 : 30,
              left: isRTL ? 20 : 0,
              bottom: 20,
            }}
          >
            {/* Week Separators - Between Sunday and Monday (LTR/RTL aware) */}
            {enhancedDates.map((dateItem, index) => {
              if (dateItem.isWeekEnd && index < enhancedDates.length - 1) {
                const mondayDate = enhancedDates[index + 1]?.date;
                if (!mondayDate) return null;
                return (
                  <ReferenceLine
                    key={`week-sep-${index}-${isRTL}`}
                    x={mondayDate}
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    strokeOpacity={0.5}
                    ifOverflow="visible"
                    position={isRTL ? "end" : "start"}
                  />
                );
              }
              return null;
            })}

            <XAxis
              dataKey="date"
              reversed={isRTL}
              tickMargin={isRTL ? 40 : 8}
              tick={{
                fill: "#374151",
                fontSize: 11,
                fontWeight: 500,
                ...(isRTL && { dx: -30 }),
              }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(value) => {
                const date = new Date(value);
                const month = date.toLocaleDateString("en-US", {
                  month: "short",
                });
                const dayName = date.toLocaleDateString("en-US", {
                  weekday: "short",
                });
                const dayNum = date.toLocaleDateString("en-US", {
                  day: "numeric",
                });
                return `${month} ${dayNum}, ${dayName}`;
              }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />

            <YAxis
              type="number"
              orientation={isRTL ? "right" : "left"}
              domain={[0, Math.max(...yTicks)]}
              ticks={yTicks}
              tick={{
                fill: "#374151",
                fontSize: 12,
                fontWeight: 500,
                ...(isRTL && { textAnchor: "end", dx: -0 }),
              }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(value) => {
                return value.toLocaleString();
              }}
              label={{
                value: t("dashboard:total_bookings_label"),
                angle: -90,
                position: isRTL ? "insideRight" : "insideLeft",
                style: {
                  textAnchor: "middle",
                  fill: "#374151",
                  fontSize: "12px",
                  fontWeight: "500",
                },
              }}
            />

            <Tooltip
              content={({ payload, label }) => {
                if (!payload || !payload.length) return null;
                const data = payload[0].payload;
                const getStatusText = () => {
                  if (data.isMonthlyPeak)
                    return `🏆 ${t("dashboard:highest_of_month")}`;
                  if (data.isWeeklyPeak)
                    return `⭐ ${t("dashboard:weekly_peak")}`;
                  return `📊 ${t("dashboard:regular_day")}`;
                };
                const getStatusColor = () => {
                  if (data.isMonthlyPeak) return "text-amber-600";
                  if (data.isWeeklyPeak) return "text-green-600";
                  return "text-blue-600";
                };
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-sm max-w-xs">
                    <div className="font-semibold text-gray-800 mb-2 text-xs">
                      {new Date(label).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "long",
                      })}
                    </div>

                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-blue-600 font-medium text-xs">
                        {t("dashboard:total_bookings_label")}:{" "}
                        {data.total_daily_bookings.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className={`text-xs font-medium ${getStatusColor()} flex items-center gap-1`}
                    >
                      {getStatusText()}
                    </div>
                  </div>
                );
              }}
              cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
            />

            <Legend
              verticalAlign="top"
              height={60}
              iconType="rect"
              wrapperStyle={{
                paddingBottom: "20px",
                fontSize: "12px",
                fontWeight: "500",
                gap: isRTL ? 16 : 8,
              }}
              formatter={(value) => (
                <span style={{ marginInlineStart: isRTL ? 20 : 8 }}>
                  {value}
                </span>
              )}
              payload={[
                {
                  value: t("dashboard:regular_days"),
                  type: "rect",
                  color: "#3B82F6",
                },
                {
                  value: t("dashboard:weekly_peaks"),
                  type: "rect",
                  color: "#10B981",
                },
                {
                  value: t("dashboard:monthly_peak"),
                  type: "rect",
                  color: "#F59E0B",
                },
              ]}
            />

            {/* Regular bars with enhanced styling */}
            <Bar
              dataKey="total_daily_bookings"
              name={t("dashboard:daily_bookings_label")}
              radius={[4, 4, 0, 0]}
              strokeWidth={0}
              shape={(props) => {
                const { payload, x, y, width, height } = props;
                let fillColor = "#3B82F6"; // Blue for regular days

                if (payload.isMonthlyPeak) {
                  fillColor = "#F59E0B"; // Amber for monthly peak
                } else if (payload.isWeeklyPeak) {
                  fillColor = "#10B981"; // Green for weekly peak
                }

                return (
                  <g>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fillColor}
                      rx={4}
                      ry={4}
                    />
                  </g>
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PeakBookingByDateGraph;
