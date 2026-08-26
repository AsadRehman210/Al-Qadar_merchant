import { useTranslation } from "react-i18next";
import TableState from "components/TableState";
import { useSelector } from "react-redux";
import { showDashboard, showStatus } from "store/slices/dashboardSlice";
import { formatCommas } from "global/helper";
import Card from "components/Card";

const AdvanceBookingTable = () => {
  const { t } = useTranslation();
  const dashboard_analytics = useSelector(showDashboard);
  const status = useSelector(showStatus);

  const AdvanceBooking = dashboard_analytics?.advanceBookings || [];

  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 hover:shadow-lg h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">{t("dashboard:performance_summary")}</h3>
      <div className="overflow-x-auto bg-white text-sm w-full max-h-[400px] overflow-auto">
        <table className="w-full mb-5 min-w-[500px]">
          {/* Table Header */}
          <thead>
            <tr className="[&_th]:border-b [&_th]:font-medium [&_th]:text-[#64748b] [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:text-start">
              <th className="whitespace-nowrap">{t("sr_no")}</th>
              <th className="min-w-[170px]">{t("dashboard:category")}</th>
              <th>{t("dashboard:total_bookings_label")}</th>
              <th>{t("total_revenue")}</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            <TableState loading={status} data={AdvanceBooking} colSpan={4}>
              {AdvanceBooking?.map((item, idx) => {
                return (
                  <tr
                    key={idx}
                    className="hover:bg-gray-100 last:[&_td]:border-b-0 [&_td]:border-b [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:font-medium "
                  >
                    <td className="font-medium text-sm text-linkText">
                      {idx + 1}
                    </td>
                    <td>{item?.category}</td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {formatCommas(item?.total_bookings)}{" "}
                    </td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {formatCommas(item?.total_revenue)}
                    </td>
                  </tr>
                );
              })}
            </TableState>
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default AdvanceBookingTable;
