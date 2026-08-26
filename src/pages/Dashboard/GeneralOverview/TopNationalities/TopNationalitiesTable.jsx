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
  const TopNationalities = dashboard_analytics?.topNationalities || [];
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        {t("dashboard:performance_summary")}
      </h3>
      <div className="overflow-x-auto bg-white text-sm flex-1">
        <table className="w-full mb-5 min-w-[800px]">
          {/* Table Header */}
          <thead>
            <tr className="[&_th]:border-b [&_th]:font-medium [&_th]:text-[#64748b] [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:text-start">
              <th className="whitespace-nowrap">{t("sr_no")}</th>
              <th className="min-w-[170px]">{t("nationality")}</th>
              <th>{t("dashboard:total_bookings_label")}</th>
              <th>{t("dashboard:total_revenue_label")}</th>
              <th>{t("dashboard:pct_total_revenue")}</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            <TableState loading={status} data={TopNationalities} colSpan={6}>
              {TopNationalities?.map((item, idx) => {
                return (
                  <tr
                    key={idx}
                    className="hover:bg-gray-100 last:[&_td]:border-b-0 [&_td]:border-b [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:font-medium "
                  >
                    <td className="font-medium text-sm text-linkText">
                      {idx + 1}
                    </td>
                    <td>
                      {item?.nationality_name
                        ? item.nationality_name
                        : t("dashboard:booking_without_nationality")}
                    </td>

                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {formatCommas(item?.total_bookings)}{" "}
                    </td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {formatCommas(item?.total_revenue)}{" "}
                    </td>
                    <td className="font-medium text-sm text-linkText whitespace-nowrap">
                      {item?.percentage_of_total_revenue}{" "}
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

export default VehicleTable;
