import { useTranslation } from "react-i18next";
import TableState from "components/TableState";
import { useSelector } from "react-redux";
import { showDashboard, showStatus } from "store/slices/dashboardSlice";
import Card from "components/Card";

const AgencyMonthlyTable = () => {
  const { t, i18n } = useTranslation();
  const dashboard_analytics = useSelector(showDashboard);
  const status = useSelector(showStatus);
  const isRTL = i18n.language === "ar";

  // Fallback if no data
  const revenueByAgencyMonthWise =
    dashboard_analytics?.revenueByAgencyMonthWise || [];

  // Extract unique months and sort them
  const uniqueMonths = [
    ...new Set(revenueByAgencyMonthWise?.map((item) => item?.month)),
  ].sort((a, b) => new Date(a) - new Date(b));

  // Format month for display (e.g., "2025-02" -> "Feb-25")
  const formatMonth = (monthString) => {
    if (!monthString) return monthString;
    const date = new Date(monthString);
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear().toString().slice(-2);
    return `${month}-${year}`;
  };

  // Get unique agencies
  const uniqueAgencies = [
    ...new Set(revenueByAgencyMonthWise?.map((item) => item?.agency_name)),
  ];

  // Create a map for quick lookup of data by agency and month
  const dataMap = {};
  revenueByAgencyMonthWise?.forEach((item) => {
    const key = `${item.agency_name}_${item.month}`;
    dataMap[key] = {
      total_bookings: item.total_bookings || 0,
      total_revenue: item.total_revenue || 0,
    };
  });

  // Calculate grand totals for each month
  const grandTotals = {};
  uniqueMonths.forEach((month) => {
    const monthData = revenueByAgencyMonthWise?.filter(
      (item) => item.month === month
    );
    grandTotals[month] = {
      total_bookings:
        monthData?.reduce((sum, item) => sum + (item.total_bookings || 0), 0) ||
        0,
      total_revenue:
        monthData?.reduce((sum, item) => sum + (item.total_revenue || 0), 0) ||
        0,
    };
  });

  return (
    <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 hover:shadow-lg max-h-[500px] flex flex-col">
      <h3 className="text-lg font-semibold mb-4">{t("dashboard:performance_summary")}</h3>
      <div
        className="overflow-x-auto bg-white text-sm flex-1"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <table className="w-full mb-5 min-w-[800px]">
          {/* Table Header */}
          <thead>
            <tr className="[&_th]:border-b [&_th]:font-medium [&_th]:text-[#64748b] [&_th]:border-gray-300 [&_th]:px-4 [&_th]:py-2 [&_th]:text-start">
              <th className="min-w-[170px]">{t("agency_name")}</th>
              {uniqueMonths.map((month, idx) => (
                <th key={idx} className="min-w-[130px] text-center">
                  {formatMonth(month)}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            <TableState
              loading={status}
              data={revenueByAgencyMonthWise}
              colSpan={uniqueMonths.length + 1}
            >
              {uniqueAgencies.map((agency, agencyIdx) => (
                <tr
                  key={agencyIdx}
                  className="hover:bg-gray-100 last:[&_td]:border-b-0 [&_td]:border-b [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2 [&_td]:font-medium"
                >
                  <td className="font-medium">{agency}</td>
                  {uniqueMonths.map((month, monthIdx) => {
                    const key = `${agency}_${month}`;
                    const data = dataMap[key] || {
                      total_bookings: 0,
                      total_revenue: 0,
                    };
                    return (
                      <td
                        key={monthIdx}
                        className="font-medium text-sm text-linkText whitespace-nowrap"
                      >
                        <div className="space-y-1">
                          <div>
                            {t("bookings")}:{" "}
                            {data.total_bookings > 0
                              ? data.total_bookings.toLocaleString()
                              : "0"}
                          </div>
                          <div>
                            {t("revenue")}:{" "}
                            {data.total_revenue > 0
                              ? data.total_revenue.toLocaleString()
                              : "0"}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Grand Total Row */}
              <tr className="bg-gray-50 font-bold [&_td]:border-b [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2">
                <td className="font-bold">{t("dashboard:grand_total")}</td>
                {uniqueMonths.map((month, idx) => (
                  <td key={idx} className="font-bold text-sm">
                    <div className="space-y-1">
                      <div>
                        {t("bookings")}:{" "}
                        {grandTotals[month]?.total_bookings > 0
                          ? grandTotals[month].total_bookings.toLocaleString()
                          : "-"}
                      </div>
                      <div>
                        {t("revenue")}:{" "}
                        {grandTotals[month]?.total_revenue > 0
                          ? grandTotals[month].total_revenue.toLocaleString()
                          : "-"}
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            </TableState>
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default AgencyMonthlyTable;
