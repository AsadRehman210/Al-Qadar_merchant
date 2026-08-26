import { useTranslation } from "react-i18next";
import TableState from "components/TableState";
import { useSelector } from "react-redux";
import {
  showDashboardByDate,
  showStatusByDate,
} from "store/slices/dashboardSlice";
import { formatCommas } from "global/helper";

const AverageRevenuePerDayTable = () => {
  const { t } = useTranslation();
  const dashboard_analytics_by_date = useSelector(showDashboardByDate);
  const status = useSelector(showStatusByDate);

  const revenueByBooking =
    dashboard_analytics_by_date?.averageRevenueByDatePerDay || [];

  // Sort data by date (smallest date first)
  const sortedAverageRevenuePerDate = [...revenueByBooking].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });

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
              <th>{t("revenue")}</th>
              <th>{t("dashboard:ride_count")}</th>
              <th>{t("dashboard:average_revenue_per_ride")}</th>
              <th>{t("outsource_cost")}</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            <TableState
              loading={status}
              data={sortedAverageRevenuePerDate}
              colSpan={6}
            >
              {sortedAverageRevenuePerDate?.map((item, idx) => {
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
                      {formatCommas(item?.total_revenue)}{" "}
                    </td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {formatCommas(item?.ride_count)}
                    </td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {formatCommas(item?.average_per_ride)}
                    </td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {item?.outsource_amount}
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

export default AverageRevenuePerDayTable;
