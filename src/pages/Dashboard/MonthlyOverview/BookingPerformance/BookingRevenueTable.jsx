import { useTranslation } from "react-i18next";
import TableState from "components/TableState";
import { useSelector } from "react-redux";
import {
  showDashboardByDate,
  showStatusByDate,
} from "store/slices/dashboardSlice";
import { formatCommas } from "global/helper";

const BookingRevenueTable = () => {
  const { t } = useTranslation();
  const dashboard_analytics_by_date = useSelector(showDashboardByDate);
  const status = useSelector(showStatusByDate);

  const revenueByBooking = dashboard_analytics_by_date?.revenueByDate || [];

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
              <th className="min-w-[170px]">{t("start_date")}</th>
              <th>{t("revenue")}</th>
              <th>{t("dashboard:out_source_cost")}</th>
              <th>{t("net_revenue")}</th>
              <th>{t("dashboard:pct_net_revenue")}</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            <TableState loading={status} data={revenueByBooking} colSpan={6}>
              {revenueByBooking?.map((item, idx) => {
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
                      {formatCommas(item?.outsource_amount)}
                    </td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {formatCommas(item?.net_revenue)}
                    </td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {item?.percentage_of_net_revenue}
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

export default BookingRevenueTable;
