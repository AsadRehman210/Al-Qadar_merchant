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
} from "recharts";
import { ChartNoAxesColumn } from "lucide-react";
import {
  showDashboardByDate,
  showMonthlyStartDate,
  showMonthlyEndDate,
} from "store/slices/dashboardSlice";
import moment from "moment-timezone";

const formatRideDuration = (minutesInput) => {
  if (
    minutesInput === null ||
    minutesInput === undefined ||
    minutesInput === ""
  )
    return "-";
  const minutes = Number(minutesInput);
  if (Number.isNaN(minutes)) return "-";

  // Format a number to max 2 decimals, removing trailing zeros (e.g. "4.00" -> "4", "4.50" -> "4.5", "4.88" -> "4.88")
  const fmt = (n) => n.toFixed(2).replace(/\.?0+$/, "");

  if (Math.abs(minutes) < 60) {
    return `${fmt(minutes)} min`;
  } else if (Math.abs(minutes) < 1440) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes - hrs * 60; // keep fractional part
    return `${hrs}h ${fmt(mins)} min`;
  } else {
    const days = Math.floor(minutes / 1440);
    const rem = minutes - days * 1440;
    const hrs = Math.floor(rem / 60);
    const mins = rem - hrs * 60; // keep fractional part
    return `${days}d ${hrs}h ${fmt(mins)} min`;
  }
};

const AverageRideDurationGraph = () => {
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

  const AverageRideDuration =
    dashboard_analytics_by_date?.averageRideDurationByDate || [];

  const durationMap = AverageRideDuration.reduce((acc, item) => {
    acc[item.date] = {
      average_ride_duration_in_minutes: parseFloat(
        item?.average_ride_duration_in_minutes || 0
      ),
      total_bookings: parseInt(item?.total_bookings || 0),
    };
    return acc;
  }, {});

  const allDates = [];
  let currentDate = moment(start_date);
  const lastDate = moment(end_date);

  while (currentDate.isSameOrBefore(lastDate)) {
    const dateStr = currentDate.format("YYYY-MM-DD");
    const data = durationMap[dateStr] || {
      average_ride_duration_in_minutes: 0,
      total_bookings: 0,
    };

    // Handle negative durations by setting them to 0 for visualization
    const safeDuration = Math.max(0, data.average_ride_duration_in_minutes);

    allDates.push({
      date: dateStr,
      average_ride_duration_in_minutes: data.average_ride_duration_in_minutes,
      total_bookings: data.total_bookings,
      safe_duration: safeDuration,
      // Convert minutes to hours for better readability
      duration_in_hours: safeDuration / 60,
    });

    currentDate.add(1, "day");
  }

  // These values could be used for custom domain settings if needed
  // const maxDuration = Math.max(...allDates.map((d) => d.safe_duration));
  // const maxBookings = Math.max(...allDates.map((d) => d.total_bookings));

  return (
    <div>
      <h3
        className={`text-base font-semibold my-4 flex items-center ${
          isRTL ? "gap-3" : "gap-2"
        }`}
      >
        <ChartNoAxesColumn /> {t("dashboard:average_ride_duration_overview")}
      </h3>
      <div className="items-center justify-center w-full h-[400px] overflow-auto">
        <ResponsiveContainer width="100%" height={400} minWidth={600}>
          <BarChart
            data={allDates}
            margin={{
              top: 20,
              right: isRTL ? 0 : 20,
              left: isRTL ? 20 : 0,
              bottom: 30,
            }}
          >
            {/* Custom gradient definition */}
            <defs>
              <linearGradient id="customGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="5.56%" stopColor="rgba(67, 24, 255, 0.28)" />
                <stop offset="80%" stopColor="#00FDC2" />
              </linearGradient>
            </defs>
            {/* <CartesianGrid strokeDasharray="3 3" /> */}
            <XAxis
              dataKey="date"
              reversed={isRTL}
              tickMargin={isRTL ? 24 : 8}
              tick={{
                fill: "#374151",
                fontSize: 12,
                fontWeight: 500,
                ...(isRTL && { dx: -20 }),
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
              orientation={isRTL ? "right" : "left"}
              tick={{
                fill: "#374151",
                fontSize: 12,
                fontWeight: 500,
                ...(isRTL && { textAnchor: "end", dx: 0 }),
              }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(value) => {
                if (value === 0) return "0";
                // For Y-axis, use format without minutes for cleaner labels
                const minutes = Number(value);
                if (Number.isNaN(minutes)) return "-";

                if (Math.abs(minutes) < 60) {
                  return `${minutes.toFixed(0)}m`;
                } else if (Math.abs(minutes) < 1440) {
                  const hrs = Math.floor(minutes / 60);
                  return `${hrs}h`;
                } else {
                  const days = Math.floor(minutes / 1440);
                  const rem = minutes - days * 1440;
                  const hrs = Math.floor(rem / 60);

                  let result = `${days}d`;
                  if (hrs > 0) result += ` ${hrs}h`;
                  return result;
                }
              }}
            />

            <Tooltip
              content={({ payload, label }) => {
                if (!payload || !payload.length) return null;
                const p = payload[0].payload;

                // Use the same formatting function as the table

                return (
                  <div className="bg-white border border-gray-200 p-2 text-xs shadow-lg rounded">
                    <div className="font-medium mb-2 text-xs">
                      {new Date(label).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-blue-600 text-xs">
                      {t("dashboard:average_ride_duration_label")}:{" "}
                      {formatRideDuration(p.average_ride_duration_in_minutes)}
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

            {/* Average Ride Duration Bar */}
            <Bar
              dataKey="safe_duration"
              fill="url(#customGradient)"
              name={t("dashboard:average_ride_duration_label")}
              radius={[10, 10, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AverageRideDurationGraph;
