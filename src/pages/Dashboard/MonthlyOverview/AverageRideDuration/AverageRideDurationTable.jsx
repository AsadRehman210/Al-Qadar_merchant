import { useTranslation } from "react-i18next";
import TableState from "components/TableState";
import { useSelector } from "react-redux";
import {
  showDashboardByDate,
  showStatusByDate,
} from "store/slices/dashboardSlice";
import { formatCommas } from "global/helper";

const AverageRideDurationTable = () => {
  const { t } = useTranslation();
  const dashboard_analytics_by_date = useSelector(showDashboardByDate);
  const status = useSelector(showStatusByDate);

  const AverageRideDuration =
    dashboard_analytics_by_date?.averageRideDurationByDate || [];

  // Sort data by date (smallest date first)
  const sortedAverageRideDuration = [...AverageRideDuration].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });
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
      return `${fmt(minutes)} ${
        Math.abs(minutes) === 1 ? t("dashboard:minute") : t("minutes")
      }`;
    } else if (Math.abs(minutes) < 1440) {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes - hrs * 60; // keep fractional part
      return `${hrs} ${
        hrs === 1 ? t("dashboard:hour") : t("hours")
      } ${fmt(mins)} ${
        Math.abs(mins) === 1 ? t("dashboard:minute") : t("minutes")
      }`;
    } else {
      const days = Math.floor(minutes / 1440);
      const rem = minutes - days * 1440;
      const hrs = Math.floor(rem / 60);
      const mins = rem - hrs * 60; // keep fractional part
      return `${days} ${
        days === 1 ? t("day") : t("days")
      } ${hrs} ${hrs === 1 ? t("dashboard:hour") : t("hours")} ${fmt(
        mins
      )} ${
        Math.abs(mins) === 1 ? t("dashboard:minute") : t("minutes")
      }`;
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        {t("dashboard:performance_summary")}
      </h3>
      <div className="overflow-x-auto bg-white text-sm w-full max-h-[400px] overflow-auto">
        <table className="w-full mb-5 min-w-[800px]">
          {/* Table Header */}
          <thead>
            <tr className="[&_th]:border-b [&_th]:font-medium [&_th]:text-[#64748b] [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:text-start">
              <th className="whitespace-nowrap">{t("sr_no")}</th>
              <th className="min-w-[170px]">{t("date")}</th>
              <th>{t("dashboard:average_ride_duration_label")}</th>
              <th>{t("dashboard:total_bookings_label")}</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            <TableState
              loading={status}
              data={sortedAverageRideDuration}
              colSpan={6}
            >
              {sortedAverageRideDuration?.map((item, idx) => {
                return (
                  <tr
                    key={idx}
                    className="hover:bg-gray-100 last:[&_td]:border-b-0 [&_td]:border-b [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:font-medium "
                  >
                    <td className="font-medium text-sm text-linkText">
                      {idx + 1}
                    </td>
                    <td>{item?.date}</td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {formatRideDuration(
                        item?.average_ride_duration_in_minutes
                      )}
                    </td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {formatCommas(item?.total_bookings)}
                    </td>
                  </tr>
                );
              })}
            </TableState>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AverageRideDurationTable;
