import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { FiShield, FiTool, FiChevronDown, FiAlertTriangle } from "react-icons/fi";
import { FaRegClock } from "react-icons/fa6";

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diffMs = new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

const Group = ({ icon: Icon, title, rows, emptyLabel, dueLabel, t }) => {
  const [open, setOpen] = useState(false);
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="font-semibold text-sm text-slate-700 dark:text-white/90">{title}</p>
          <p className="text-xs text-slate-400 dark:text-white/50">{emptyLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800 dark:text-white">{title}</p>
          <p className="text-xs text-amber-700 dark:text-amber-300">{rows.length} {dueLabel}</p>
        </div>
        <FiChevronDown className={`h-4 w-4 text-amber-600 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-amber-200 dark:border-amber-500/20 divide-y divide-amber-200/60 dark:divide-amber-500/10">
          {rows.map(({ asset, dueDate, daysLeft }) => (
            <Link
              key={asset.id}
              to={`/assets/detail/${asset.id}`}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-amber-100/60 dark:hover:bg-amber-500/10 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">{asset.name}</p>
                <p className="text-xs text-slate-500 dark:text-white/50 font-mono">{asset.assetTag}</p>
              </div>
              <div className="text-end shrink-0">
                <p className="text-xs text-slate-600 dark:text-white/70">{dueDate}</p>
                <p className={`text-xs font-semibold ${daysLeft < 0 ? "text-rose-600" : "text-amber-700 dark:text-amber-300"}`}>
                  {daysLeft < 0
                    ? t("asset:overdue_by_days", { count: Math.abs(daysLeft) })
                    : t("asset:due_in_days", { count: daysLeft })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// Purely a client-side scan over the currently-loaded asset list (same
// data Assets/index.jsx already fetched for the register + summary cards) —
// no dedicated backend endpoint needed, mirrors the depreciation schedule's
// own "stays client-computed" decision.
const AssetAlerts = ({ assets = [] }) => {
  const { t } = useTranslation();

  const expiringInsurance = useMemo(
    () =>
      assets
        .filter((a) => a.status !== "Disposed" && a.insurance?.expiryDate)
        .map((a) => ({ asset: a, dueDate: a.insurance.expiryDate, daysLeft: daysUntil(a.insurance.expiryDate) }))
        .filter((r) => r.daysLeft <= 60)
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [assets],
  );
  const expiringWarranty = useMemo(
    () =>
      assets
        .filter((a) => a.status !== "Disposed" && a.warrantyUntil)
        .map((a) => ({ asset: a, dueDate: a.warrantyUntil, daysLeft: daysUntil(a.warrantyUntil) }))
        .filter((r) => r.daysLeft <= 60)
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [assets],
  );
  const dueMaintenance = useMemo(
    () =>
      assets
        .filter((a) => a.status !== "Disposed" && (a.maintenanceHistory || [])[0]?.nextMaintenanceDate)
        .map((a) => ({ asset: a, dueDate: a.maintenanceHistory[0].nextMaintenanceDate, daysLeft: daysUntil(a.maintenanceHistory[0].nextMaintenanceDate) }))
        .filter((r) => r.daysLeft <= 30)
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [assets],
  );

  const totalAlerts = expiringInsurance.length + expiringWarranty.length + dueMaintenance.length;

  return (
    <div className="mb-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-6 border-l-4 !border-l-amber-400">
      <div className="flex items-center gap-2 mb-4">
        <FiAlertTriangle className="h-4 w-4 text-amber-500" />
        <h2 className="text-base font-bold text-slate-800 dark:text-white">{t("asset:renewals_alerts")}</h2>
        {totalAlerts > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white">{totalAlerts}</span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Group
          icon={FiShield}
          title={t("asset:insurance_expiring")}
          rows={expiringInsurance}
          emptyLabel={t("asset:no_insurance_expiring")}
          dueLabel={t("asset:need_attention")}
          t={t}
        />
        <Group
          icon={FaRegClock}
          title={t("asset:warranty_expiring")}
          rows={expiringWarranty}
          emptyLabel={t("asset:no_warranty_expiring")}
          dueLabel={t("asset:need_attention")}
          t={t}
        />
        <Group
          icon={FiTool}
          title={t("asset:maintenance_due")}
          rows={dueMaintenance}
          emptyLabel={t("asset:no_maintenance_due")}
          dueLabel={t("asset:need_attention")}
          t={t}
        />
      </div>
    </div>
  );
};

export default AssetAlerts;
