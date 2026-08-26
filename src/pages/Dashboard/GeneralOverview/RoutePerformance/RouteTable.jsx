import { useTranslation } from "react-i18next";
import TableState from "components/TableState";
import { useSelector } from "react-redux";
import { showDashboard, showStatus } from "store/slices/dashboardSlice";
import Card from "components/Card";
import { MoveRight, MoveLeft } from "lucide-react";
import { formatCommas } from "global/helper";

const RouteTable = () => {
  const { t, i18n } = useTranslation();
  const dashboard_analytics = useSelector(showDashboard);
  const status = useSelector(showStatus);
  const isRTL = i18n.language === "ar";

  // Fallback if no data
  const revenueByRoute = dashboard_analytics?.revenueByRoute || [];
  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 hover:shadow-lg max-h-[500px] flex flex-col">
      <h3 className="text-lg font-semibold mb-4">
        {t("dashboard:performance_summary")}
      </h3>
      <div
        className="overflow-x-auto bg-white text-sm flex-1"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <table className="w-full mb-5 min-w-[800px]">
          {/* Table Header */}
          <thead>
            <tr className="[&_th]:border-b [&_th]:font-medium [&_th]:text-[#64748b] [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:text-start">
              <th className="whitespace-nowrap">{t("sr_no")}</th>
              <th className="min-w-[400px] whitespace-nowrap">
                {t("route")}
              </th>
              <th className="whitespace-nowrap">
                {t("dashboard:total_revenue_label")}
              </th>
              <th className="whitespace-nowrap">
                {t("outsource_cost")}
              </th>
              <th className="whitespace-nowrap">
                {t("net_revenue")}
              </th>
              <th className="whitespace-nowrap">
                {t("dashboard:pct_net_revenue")}
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            <TableState loading={status} data={revenueByRoute} colSpan={6}>
              {revenueByRoute?.map((item, idx) => {
                return (
                  <tr
                    key={idx}
                    className="hover:bg-gray-100 last:[&_td]:border-b-0 [&_td]:border-b [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:font-medium "
                  >
                    <td className="font-medium text-sm text-linkText">
                      {idx + 1}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <p className="flex-1">{item?.pickup_point}</p>
                        <p className="shrink-0">
                          {isRTL ? <MoveLeft /> : <MoveRight />}
                        </p>
                        <p className="flex-1">{item?.drop_point}</p>
                      </div>
                    </td>
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

export default RouteTable;
