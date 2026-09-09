import { FiPackage } from "react-icons/fi";
import { MdOutlineInventory2 } from "react-icons/md";
import { IoWarningOutline } from "react-icons/io5";
import { TbAlertTriangle } from "react-icons/tb";
import Card from "components/Card";
import { SkeletonCards } from "components/Skeleton";
import { useTranslation } from "react-i18next";

const StockCards = ({ summary, loading = false }) => {
  const { t } = useTranslation();

  if (loading) {
    return <SkeletonCards count={4} columns="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" />;
  }

  const s = summary || {
    totalSkus: 0,
    totalUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };

  const cards = [
    {
      key: "skus",
      label: t("product:stock_total_skus"),
      value: s.totalSkus,
      sub: null,
      icon: FiPackage,
    },
    {
      key: "units",
      label: t("product:stock_total_units"),
      value: s.totalUnits.toLocaleString(),
      sub: null,
      icon: MdOutlineInventory2,
    },
    {
      key: "low",
      label: t("product:stock_low_stock"),
      value: s.lowStockCount,
      sub: null,
      icon: IoWarningOutline,
      iconWrap: "bg-amber-500/15",
      iconClass: "text-amber-600 dark:text-amber-400",
    },
    {
      key: "out",
      label: t("product:stock_out_of_stock"),
      value: s.outOfStockCount,
      sub: null,
      icon: TbAlertTriangle,
      iconWrap: "bg-red-500/15",
      iconClass: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-[partners-cardIn_0.45s_ease-out]">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Card
            key={c.key}
            className="shadow-sm border border-slate-200 dark:border-white/15 bg-white/90 dark:bg-white/5"
          >
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-slate-700 dark:text-white/90 leading-none tracking-tight">
                {c.label}
              </div>
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                  c.iconWrap || "bg-teal-500/15"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${c.iconClass || "text-teal-600 dark:text-teal-400"}`}
                />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {c.value}
              </div>
              {c.sub && (
                <p className="text-xs text-mutedForeground mt-2">{c.sub}</p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default StockCards;
