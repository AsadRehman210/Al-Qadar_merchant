import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import ExportButton from "components/ExportButton";
import { SkeletonTable } from "components/Skeleton";
import { fetchAssets, showAssets, showAssetsLoading } from "store/slices/assetSlice";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { view_asset } = alqadar_role_ids;

const fmt = (n) => `${(parseFloat(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const sectionCls = "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]";

// Mirrors the server's calcBookValueAt (asset-service.ts) — evaluated at an
// arbitrary "as of" date, not just "today", so the Disposal report can show
// the book value that was actually realized at disposal time.
const calcBookValueAt = (asset, asOfDate) => {
  const cost = parseFloat(asset.purchaseCost) || parseFloat(asset.currentValue) || 0;
  const salvage = parseFloat(asset.salvageValue) || 0;
  const years = parseInt(asset.usefulLifeYears, 10) || 5;
  const method = asset.depreciationMethod || "straight_line";
  const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date();

  const rows = [];
  if (method === "straight_line") {
    const annualDep = (cost - salvage) / years;
    let bookValue = cost;
    for (let y = 1; y <= years; y++) {
      bookValue = Math.max(salvage, Math.round((bookValue - Math.round(annualDep * 100) / 100) * 100) / 100);
      rows.push(bookValue);
    }
  } else {
    const rate = 2 / years;
    let bookValue = cost;
    for (let y = 1; y <= years; y++) {
      const dep = Math.max(0, Math.round(Math.min(bookValue * rate, bookValue - salvage) * 100) / 100);
      bookValue = Math.max(salvage, Math.round((bookValue - dep) * 100) / 100);
      rows.push(bookValue);
    }
  }
  const asOf = asOfDate ? new Date(asOfDate) : new Date();
  let yearsElapsed = asOf.getFullYear() - purchaseDate.getFullYear();
  const anniversaryPassed =
    asOf.getMonth() > purchaseDate.getMonth() ||
    (asOf.getMonth() === purchaseDate.getMonth() && asOf.getDate() >= purchaseDate.getDate());
  if (!anniversaryPassed) yearsElapsed -= 1;
  if (yearsElapsed <= 0) return cost;
  const idx = Math.min(yearsElapsed, rows.length) - 1;
  return rows[idx] ?? rows[rows.length - 1] ?? 0;
};

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.round((new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
};

const AssetReports = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  const assets = useSelector(showAssets);
  const loading = useSelector(showAssetsLoading);

  useEffect(() => {
    dispatch(fetchAssets({ limit: 1000 }));
  }, [dispatch]);

  const depreciationRows = useMemo(
    () =>
      assets
        .filter((a) => a.status !== "Disposed")
        .map((a) => {
          const cost = parseFloat(a.purchaseCost) || parseFloat(a.currentValue) || 0;
          const bookValue = calcBookValueAt(a, new Date());
          return { ...a, cost, bookValue, accDep: Math.max(0, cost - bookValue) };
        }),
    [assets],
  );
  const depreciationTotals = useMemo(
    () =>
      depreciationRows.reduce(
        (acc, r) => ({ cost: acc.cost + r.cost, accDep: acc.accDep + r.accDep, bookValue: acc.bookValue + r.bookValue }),
        { cost: 0, accDep: 0, bookValue: 0 },
      ),
    [depreciationRows],
  );

  const disposalRows = useMemo(
    () =>
      assets
        .filter((a) => a.disposal)
        .map((a) => {
          const cost = parseFloat(a.purchaseCost) || parseFloat(a.currentValue) || 0;
          const salePrice = parseFloat(a.disposal.salePrice) || 0;
          const bookValueAtDisposal = calcBookValueAt(a, a.disposal.date);
          return { ...a, cost, salePrice, gain: salePrice - bookValueAtDisposal };
        }),
    [assets],
  );

  const insuranceRows = useMemo(
    () =>
      assets
        .filter((a) => a.insurance)
        .map((a) => {
          const daysLeft = a.insurance.expiryDate ? daysUntil(a.insurance.expiryDate) : null;
          const insStatus = daysLeft === null ? "—" : daysLeft < 0 ? t("asset:ins_expired") : daysLeft <= 60 ? t("asset:ins_expiring") : t("asset:ins_active");
          return { ...a, daysLeft, insStatus };
        }),
    [assets, t],
  );

  if (!checkRoleAuth(view_asset)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/assets")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold">{t("asset:reports_title")}</h1>
            <p className="text-mutedForeground">{t("asset:reports_desc")}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className={sectionCls}><SkeletonTable rows={5} columns={6} /></div>
            <div className={sectionCls}><SkeletonTable rows={3} columns={6} /></div>
            <div className={sectionCls}><SkeletonTable rows={3} columns={6} /></div>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Depreciation summary */}
          <div className={sectionCls}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t("asset:depreciation_report")}</h2>
                <p className="text-xs text-slate-400 dark:text-white/40 mt-1">{t("asset:post_depreciation_hint")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ExportButton
                  data={depreciationRows}
                  filename="asset-depreciation-report.xlsx"
                  title={t("asset:export_assets")}
                  columns={[
                    { label: t("asset:asset_tag"), key: "assetTag" },
                    { label: t("asset:asset_name"), key: "name" },
                    { label: t("asset:category"), key: "categoryName" },
                    { label: t("asset:purchase_cost"), value: (r) => fmt(r.cost) },
                    { label: t("asset:accumulated_dep"), value: (r) => fmt(r.accDep) },
                    { label: t("asset:book_value"), value: (r) => fmt(r.bookValue) },
                  ]}
                />
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-teal-500)]">
                    {[t("asset:asset_tag"), t("asset:asset_name"), t("asset:category"), t("asset:purchase_cost"), t("asset:accumulated_dep"), t("asset:book_value")].map((h) => (
                      <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {depreciationRows.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-4 py-2.5 font-mono text-xs">{r.assetTag}</td>
                      <td className="px-4 py-2.5">{r.name}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{r.categoryName || "—"}</td>
                      <td className="px-4 py-2.5">{fmt(r.cost)}</td>
                      <td className="px-4 py-2.5 text-rose-600">{fmt(r.accDep)}</td>
                      <td className="px-4 py-2.5 text-teal-600 font-semibold">{fmt(r.bookValue)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-300 dark:border-white/20 font-bold bg-slate-50 dark:bg-white/5">
                    <td className="px-4 py-3" colSpan={3}>{t("asset:total")}</td>
                    <td className="px-4 py-3">{fmt(depreciationTotals.cost)}</td>
                    <td className="px-4 py-3 text-rose-600">{fmt(depreciationTotals.accDep)}</td>
                    <td className="px-4 py-3 text-teal-600">{fmt(depreciationTotals.bookValue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Disposal report */}
          <div className={sectionCls.replace("!border-l-[var(--color-teal-500)]", "!border-l-rose-500")}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t("asset:disposal_report")}</h2>
              <ExportButton
                data={disposalRows}
                filename="asset-disposal-report.xlsx"
                title={t("asset:export_assets")}
                columns={[
                  { label: t("asset:asset_tag"), key: "assetTag" },
                  { label: t("asset:asset_name"), key: "name" },
                  { label: t("asset:disposal_date"), value: (r) => (r.disposal.date ? String(r.disposal.date).slice(0, 10) : "") },
                  { label: t("asset:disposal_method"), value: (r) => r.disposal.method },
                  { label: t("asset:sale_price"), value: (r) => fmt(r.salePrice) },
                  { label: t("asset:gain_loss"), value: (r) => fmt(r.gain) },
                ]}
              />
            </div>
            {!disposalRows.length ? (
              <p className="text-slate-400 text-sm py-6 text-center">{t("asset:no_disposals")}</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-rose-500">
                      {[t("asset:asset_tag"), t("asset:asset_name"), t("asset:disposal_date"), t("asset:disposal_method"), t("asset:sale_price"), t("asset:gain_loss")].map((h) => (
                        <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {disposalRows.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100 dark:border-white/5">
                        <td className="px-4 py-2.5 font-mono text-xs">{r.assetTag}</td>
                        <td className="px-4 py-2.5">{r.name}</td>
                        <td className="px-4 py-2.5 text-xs">{r.disposal.date ? String(r.disposal.date).slice(0, 10) : "—"}</td>
                        <td className="px-4 py-2.5 text-xs">{r.disposal.method}</td>
                        <td className="px-4 py-2.5">{fmt(r.salePrice)}</td>
                        <td className={`px-4 py-2.5 font-semibold ${r.gain < 0 ? "text-rose-600" : "text-emerald-600"}`}>{fmt(r.gain)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Insurance report */}
          <div className={sectionCls.replace("!border-l-[var(--color-teal-500)]", "!border-l-blue-500")}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t("asset:insurance_report")}</h2>
              <ExportButton
                data={insuranceRows}
                filename="asset-insurance-report.xlsx"
                title={t("asset:export_assets")}
                columns={[
                  { label: t("asset:asset_tag"), key: "assetTag" },
                  { label: t("asset:asset_name"), key: "name" },
                  { label: t("asset:insurer"), value: (r) => r.insurance.provider },
                  { label: t("asset:policy_expiry"), value: (r) => (r.insurance.expiryDate ? String(r.insurance.expiryDate).slice(0, 10) : "") },
                  { label: t("asset:coverage_amount"), value: (r) => fmt(r.insurance.coverageAmount) },
                  { label: t("asset:status"), key: "insStatus" },
                ]}
              />
            </div>
            {!insuranceRows.length ? (
              <p className="text-slate-400 text-sm py-6 text-center">{t("asset:no_insurance_records")}</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-500">
                      {[t("asset:asset_tag"), t("asset:asset_name"), t("asset:insurer"), t("asset:policy_expiry"), t("asset:coverage_amount"), t("asset:status")].map((h) => (
                        <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {insuranceRows.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100 dark:border-white/5">
                        <td className="px-4 py-2.5 font-mono text-xs">{r.assetTag}</td>
                        <td className="px-4 py-2.5">{r.name}</td>
                        <td className="px-4 py-2.5 text-xs">{r.insurance.provider}</td>
                        <td className="px-4 py-2.5 text-xs">{r.insurance.expiryDate ? String(r.insurance.expiryDate).slice(0, 10) : "—"}</td>
                        <td className="px-4 py-2.5">{fmt(r.insurance.coverageAmount)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.insStatus === t("asset:ins_expired") ? "bg-rose-100 text-rose-700" : r.insStatus === t("asset:ins_expiring") ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {r.insStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default AssetReports;
