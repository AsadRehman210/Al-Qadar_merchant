import { useTranslation } from "react-i18next";
import TableState from "components/TableState";
import { useSelector } from "react-redux";
import {
  showDashboardByDate,
  showStatusByDate,
} from "store/slices/dashboardSlice";

const VehicleRevenueTable = () => {
  const { t } = useTranslation();
  const dashboard_analytics_by_date = useSelector(showDashboardByDate);
  const status = useSelector(showStatusByDate);

  const revenueByVehicle =
    dashboard_analytics_by_date?.revenueByDateForVehicle || [];

  // Extract unique dates and sort them
  const uniqueDates = [
    ...new Set(revenueByVehicle?.map((item) => item?.date)),
  ].sort((a, b) => new Date(a) - new Date(b));

  // Format dates for display (e.g., "10-Aug", "11-Aug")
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day}-${month}, ${year}`;
  };

  // Get unique vehicles
  const uniqueVehicles = [
    ...new Set(revenueByVehicle?.map((item) => item?.vehicle_plate_no)),
  ];

  // Create a map for quick lookup of revenue by vehicle and date
  const revenueMap = {};
  revenueByVehicle?.forEach((item) => {
    const key = `${item.vehicle_plate_no}_${item.date}`;
    revenueMap[key] = item.total_revenue || 0;
  });

  // Calculate grand totals for each date
  const grandTotals = {};
  uniqueDates.forEach((date) => {
    grandTotals[date] =
      revenueByVehicle
        ?.filter((item) => item.date === date)
        ?.reduce((sum, item) => sum + (item.total_revenue || 0), 0) || 0;
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
              <th className="min-w-[170px]">{t("vehicle")}</th>
              {uniqueDates.map((date, idx) => (
                <th key={idx} className="min-w-[130px] text-center" dir="ltr">
                  {formatDate(date)}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            <TableState
              loading={status}
              data={revenueByVehicle}
              colSpan={uniqueDates.length + 1}
            >
              {uniqueVehicles.map((vehicle, vehicleIdx) => (
                <tr
                  key={vehicleIdx}
                  className="hover:bg-gray-100 last:[&_td]:border-b-0 [&_td]:border-b [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:font-medium"
                >
                  <td className="font-medium">{vehicle}</td>
                  {uniqueDates.map((date, dateIdx) => {
                    const key = `${vehicle}_${date}`;
                    const revenue = revenueMap[key] || 0;
                    return (
                      <td
                        key={dateIdx}
                        className="font-medium text-sm text-linkText whitespace-nowrap text-center"
                      >
                        {revenue > 0 ? revenue.toLocaleString() : "0"}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Grand Total Row */}
              <tr className="bg-gray-50 font-bold [&_td]:border-b [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2">
                <td className="font-bold">{t("dashboard:grand_total")}</td>
                {uniqueDates.map((date, idx) => (
                  <td key={idx} className="font-bold text-sm text-center">
                    {grandTotals[date] > 0
                      ? grandTotals[date].toLocaleString()
                      : "0"}
                  </td>
                ))}
              </tr>
            </TableState>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VehicleRevenueTable;
