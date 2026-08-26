import { useTranslation } from "react-i18next";
import TableState from "components/TableState";
import { useSelector } from "react-redux";
import { showDashboard, showStatus } from "store/slices/dashboardSlice";
import Card from "components/Card";
import { formatCommas } from "global/helper";

const VehicleTable = () => {
  const { t } = useTranslation();
  const dashboard_analytics = useSelector(showDashboard);
  const status = useSelector(showStatus);

  // Fallback if no data
  const revenueByvehicle = dashboard_analytics?.revenueByVehicle || [];
  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 hover:shadow-lg max-h-[500px] flex flex-col">
      <h3 className="text-lg font-semibold mb-4">
        {t("dashboard:performance_summary")}
      </h3>
      <div className="overflow-x-auto bg-white text-sm flex-1">
        <table className="w-full mb-5 min-w-[800px]">
          {/* Table Header */}
          <thead>
            <tr className="[&_th]:border-b [&_th]:font-medium [&_th]:text-[#64748b] [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:text-start">
              <th className="whitespace-nowrap">{t("sr_no")}</th>
              <th className="min-w-[170px]">{t("dashboard:vehicle_name")}</th>
              <th>{t("dashboard:total_revenue_label")}</th>
              <th>{t("outsource_cost")}</th>
              <th>{t("net_revenue")}</th>
              <th>{t("dashboard:pct_net_revenue")}</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            <TableState loading={status} data={revenueByvehicle} colSpan={6}>
              {revenueByvehicle?.map((item, idx) => {
                return (
                  <tr
                    key={idx}
                    className="hover:bg-gray-100 last:[&_td]:border-b-0 [&_td]:border-b [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:font-medium "
                  >
                    <td className="font-medium text-sm text-linkText">
                      {idx + 1}
                    </td>
                    <td>{item?.vehicle_name}</td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {formatCommas(item?.total_revenue)}{" "}
                    </td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {formatCommas(item?.outsource_amount)}{" "}
                    </td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {formatCommas(item?.net_revenue)}{" "}
                    </td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {item?.percentage_of_net_revenue}{" "}
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

export default VehicleTable;
