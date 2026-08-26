import { useTranslation } from "react-i18next";
import {
  Award,
  BarChart3,
  Calendar,
  Car,
  SaudiRiyal,
  TrendingUp,
  Users,
  Globe,
} from "lucide-react";
import Card from "components/Card";
import { FiBookOpen } from "react-icons/fi";
import { useSelector } from "react-redux";
import { showDashboard } from "store/slices/dashboardSlice";
import Badge from "components/Badge";
import { formatCommas } from "../../../global/helper";

// Generic card component
const DashboardCardItem = ({
  title,
  icon: Icon,
  value,
  breakdown,
  isRevenue = false,
  extraInfo,
  t,
}) => (
  <Card className="shadow-sm hover:shadow-lg hover:bg-primary/10">
    <div className="flex items-center justify-between pb-2">
      <p className="text-linkText text-sm font-medium">{title}</p>
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </div>
    <div>
      <div className="text-xl font-bold">{value}</div>
      {breakdown && (
        <ul className="mt-2 text-xs text-gray-600 space-y-1 flex flex-wrap gap-2">
          {Object.entries(breakdown).map(([key, val]) =>
            key !== "total_revenue" && key !== "total_bookings" ? (
              <li key={key} className="flex justify-between">
                <div className="flex items-center gap-1">
                  <Badge
                    variant={
                      key.includes("complete")
                        ? "success"
                        : key.includes("pending") && key.includes("approval")
                        ? "pendingApproval"
                        : key.includes("pending")
                        ? "secondary"
                        : key.includes("cancelled")
                        ? "destructive"
                        : key.includes("ongoing")
                        ? "ongoing"
                        : key === "non_repeated_customers"
                        ? "secondary"
                        : key === "repeated_customers"
                        ? "success"
                        : key === "tourists"
                        ? "default"
                        : key === "residents"
                        ? "success"
                        : key === "with_nationality"
                        ? "duplicate"
                        : key === "duplicate_revenue"
                        ? "duplicateRevenue"
                        : key === "duplicate_bookings"
                        ? "duplicateBookings"
                        : "default"
                    }
                  />{" "}
                  <span className="capitalize">
                    {key.includes("completed")
                      ? t("dashboard:completed_label")
                      : key.includes("pending") && key.includes("approval")
                      ? t("pending_approval")
                      : key.includes("pending")
                      ? t("dashboard:pending_label")
                      : key.includes("ongoing")
                      ? t("ongoing")
                      : key.includes("cancelled")
                      ? t("cancelled")
                      : key === "repeated_customers"
                      ? t("dashboard:repeated_customers")
                      : key === "non_repeated_customers"
                      ? t("dashboard:non_repeated_customers")
                      : key === "tourists"
                      ? t("dashboard:tourists")
                      : key === "residents"
                      ? t("dashboard:residents")
                      : key === "with_nationality"
                      ? t("dashboard:without_nationality")
                      : key === "duplicate_revenue"
                      ? t("dashboard:duplicate_revenue")
                      : key === "duplicate_bookings"
                      ? t("dashboard:duplicate_bookings")
                      : key.replace(/_/g, " ")}
                    :
                  </span>
                </div>
                <div className="font-medium items-center flex">
                  {isRevenue
                    ? `${t("sar")} ${formatCommas(val ?? 0)}`
                    : formatCommas(val ?? 0)}
                </div>
              </li>
            ) : null
          )}
        </ul>
      )}
      {extraInfo && <p className="text-xs text-gray-500 mt-1">{extraInfo}</p>}
    </div>
  </Card>
);

export default function Dashboard() {
  const { t } = useTranslation();
  const dashboard_analytics = useSelector(showDashboard);
  const {
    dailyRevenue,
    monthToDateRevenue,
    yearToDateRevenue,
    dailyBookings,
    monthToDateBookings,
    yearToDateBookings,
    activeVehiclesCount,
    revenueByDirectCustomerBookings,
    revenueByDirectCustomerRevenue,
    revenueByAgencyBookings,
    revenueByAgencyRevenue,
    customerStats,
    touristAndResidentCustomerStats,
  } = dashboard_analytics;

  const cards = [
    {
      title: t("dashboard:daily_revenue"),
      icon: SaudiRiyal,
      value: `${t("sar")} ${dailyRevenue?.total_revenue ?? 0}`,
      breakdown: dailyRevenue,
      isRevenue: true,
    },
    {
      title: t("dashboard:month_to_date_revenue"),
      icon: TrendingUp,
      value: `${t("sar")} ${formatCommas(
        monthToDateRevenue?.total_revenue ?? 0
      )}`,
      breakdown: monthToDateRevenue,
      isRevenue: true,
    },
    {
      title: t("dashboard:year_to_date_revenue"),
      icon: Award,
      value: `${t("sar")} ${formatCommas(
        yearToDateRevenue?.total_revenue ?? 0
      )}`,
      breakdown: yearToDateRevenue,
      isRevenue: true,
    },
    {
      title: t("dashboard:daily_bookings"),
      icon: FiBookOpen,
      value: formatCommas(dailyBookings?.total_bookings ?? 0),
      breakdown: dailyBookings,
    },
    {
      title: t("dashboard:month_to_date_bookings"),
      icon: Calendar,
      value: formatCommas(monthToDateBookings?.total_bookings ?? 0),
      breakdown: monthToDateBookings,
    },
    {
      title: t("dashboard:year_to_date_bookings"),
      icon: BarChart3,
      value: formatCommas(yearToDateBookings?.total_bookings ?? 0),
      breakdown: yearToDateBookings,
    },
    {
      title: t("agency_bookings"),
      icon: FiBookOpen,
      value: formatCommas(revenueByAgencyBookings?.total_bookings ?? 0),
      breakdown: revenueByAgencyBookings,
    },
    {
      title: t("dashboard:agency_revenue"),
      icon: SaudiRiyal,
      value: formatCommas(revenueByAgencyRevenue?.total_revenue ?? 0),
      breakdown: revenueByAgencyRevenue,
    },

    {
      title: t("dashboard:direct_customer_bookings"),
      icon: FiBookOpen,
      value: formatCommas(revenueByDirectCustomerBookings?.total_bookings ?? 0),
      breakdown: revenueByDirectCustomerBookings,
    },
    {
      title: t("dashboard:direct_customer_revenue"),
      icon: TrendingUp,
      value: formatCommas(revenueByDirectCustomerRevenue?.total_revenue ?? 0),
      breakdown: revenueByDirectCustomerRevenue,
    },
    {
      title: t("dashboard:customer_statistics"),
      icon: Users,
      value: formatCommas(customerStats?.total_customers ?? 0),
      breakdown: {
        repeated_customers: customerStats?.repeated_customers_count ?? 0,
        non_repeated_customers:
          customerStats?.non_repeated_customers_count ?? 0,
      },
    },
    {
      title: t("dashboard:tourist_resident_stats"),
      icon: Globe,
      breakdown: {
        tourists: touristAndResidentCustomerStats?.tourists_count ?? 0,
        residents: touristAndResidentCustomerStats?.residents_count ?? 0,
        with_nationality:
          touristAndResidentCustomerStats?.withOut_nationality_count ?? 0,
      },
    },
    {
      title: t("active_vehicles"),
      icon: Car,
      value: `${activeVehiclesCount?.total_active_vehicles ?? 0} / ${
        activeVehiclesCount?.total_vehicles ?? 0
      }`,
      extraInfo: t("dashboard:active_vs_total"),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <DashboardCardItem key={card.title} {...card} t={t} />
      ))}
    </div>
  );
}
