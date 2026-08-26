import { useState, useMemo, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiAlertTriangle } from "react-icons/fi";
import Button from "components/Button";
import SearchablePaginatedDropdown from "components/SearchablePaginatedDropdown";
import { toast } from "react-toastify";
import { fetchVariantsDropdown } from "store/slices/variantSlice";
import { fetchWarehousesDropdown } from "store/slices/warehouseSlice";
import {
  fetchStock,
  showStock,
  adjustStock as adjustStockThunk,
  fetchAdjustmentHistory,
  showAdjustmentHistory,
  showAdjustmentHistoryLoading,
} from "store/slices/stockSlice";
import { computeStatus } from "../stockHelpers";
import { SkeletonTable } from "components/Skeleton";
import EmptyState from "components/EmptyState";

const ADJ_TYPES = [
  { id: "add", title: "product:adj_add" },
  { id: "subtract", title: "product:adj_subtract" },
  { id: "set", title: "product:adj_set" },
];

const TYPE_COLORS = {
  add: "text-emerald-600 dark:text-emerald-400",
  subtract: "text-rose-600 dark:text-rose-400",
  set: "text-blue-600 dark:text-blue-400",
};

const variantTitle = (v) => `${v.productName || ""} — ${v.variantName || ""} (${v.sku})`.trim();

const StockAdjust = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isRTL = i18n.language === "ar";

  const stockRows = useSelector(showStock);
  const history = useSelector(showAdjustmentHistory);
  const historyLoading = useSelector(showAdjustmentHistoryLoading);

  const [selVariant, setSelVariant] = useState(null);
  const [selWarehouse, setSelWarehouse] = useState(null);
  const [selType, setSelType] = useState(ADJ_TYPES[0]);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");

  // Variant picker — real backend search + infinite scroll.
  const [variantOptions, setVariantOptions] = useState([]);
  const [variantPage, setVariantPage] = useState(1);
  const [variantHasMore, setVariantHasMore] = useState(false);
  const [variantLoading, setVariantLoading] = useState(false);
  const loadVariants = useCallback(
    async (page, search) => {
      setVariantLoading(true);
      const result = await dispatch(fetchVariantsDropdown({ page, search })).unwrap();
      const mapped = (result.result || []).map((v) => ({ ...v, title: variantTitle(v) }));
      setVariantOptions((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
      setVariantPage(page);
      setVariantHasMore(page < (result.total_pages || 0));
      setVariantLoading(false);
    },
    [dispatch],
  );

  // Warehouse picker — same pattern.
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [warehousePage, setWarehousePage] = useState(1);
  const [warehouseHasMore, setWarehouseHasMore] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const loadWarehouses = useCallback(
    async (page, search) => {
      setWarehouseLoading(true);
      const result = await dispatch(fetchWarehousesDropdown({ page, search })).unwrap();
      const mapped = (result.result || []).map((w) => ({ ...w, title: `${w.code} — ${w.name}` }));
      setWarehouseOptions((prev) => (page === 1 ? mapped : [...prev, ...mapped]));
      setWarehousePage(page);
      setWarehouseHasMore(page < (result.total_pages || 0));
      setWarehouseLoading(false);
    },
    [dispatch],
  );

  useEffect(() => {
    loadVariants(1, "");
    loadWarehouses(1, "");
    dispatch(fetchAdjustmentHistory({ limit: 20 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only this one variant's stock — never the whole catalog.
  useEffect(() => {
    if (selVariant) {
      dispatch(fetchStock({ variantId: selVariant.id, limit: 1 }));
    }
  }, [dispatch, selVariant]);

  const refresh = () => {
    dispatch(fetchAdjustmentHistory({ limit: 20 }));
    if (selVariant) dispatch(fetchStock({ variantId: selVariant.id, limit: 1 }));
  };

  const currentRow = useMemo(() => {
    if (!selVariant) return null;
    const row = stockRows.find((r) => r.variantId === selVariant.id);
    if (!row) return null;
    return { ...row, stockStatus: computeStatus(Number(row.totalQty) || 0, row.minQty || 0) };
  }, [selVariant, stockRows]);

  useEffect(() => {
    if (selVariant && warehouseOptions.length && !selWarehouse) {
      const primary = currentRow?.byWarehouse?.slice().sort((a, b) => b.qty - a.qty)[0]?.warehouseId;
      setSelWarehouse(warehouseOptions.find((w) => w.id === primary) || warehouseOptions[0] || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selVariant, warehouseOptions, currentRow]);

  const previewBalance = () => {
    if (!currentRow || !qty) return null;
    const n = Number(qty);
    if (selType.id === "add") return currentRow.totalQty + n;
    if (selType.id === "subtract") return Math.max(0, currentRow.totalQty - n);
    return Math.max(0, n);
  };
  const preview = previewBalance();

  const handleSubmit = async () => {
    if (!selVariant) { toast.error(t("product:adj_select_variant")); return; }
    if (!selWarehouse) { toast.error(t("product:adj_warehouse")); return; }
    if (!qty || Number(qty) < 0) { toast.error(t("product:adj_qty_required")); return; }
    if (!reason.trim()) { toast.error(t("product:adj_reason_required")); return; }

    try {
      await dispatch(adjustStockThunk({
        variantId: selVariant.id,
        warehouseId: selWarehouse.id,
        type: selType.id,
        qty: Number(qty),
        reason,
      })).unwrap();
      toast.success(t("product:adj_saved"));
      setSelVariant(null);
      setSelWarehouse(null);
      setQty("");
      setReason("");
      refresh();
    } catch (err) {
      toast.error(err || t("product:save_failed"));
    }
  };

  const panelCls = "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-6 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/inventory/stock")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{t("product:stock_adjustment")}</h1>
            <p className="text-mutedForeground text-sm mt-1">{t("product:stock_adjustment_desc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className={`${panelCls} lg:col-span-2`}>
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-5">{t("product:adj_form_title")}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-linkText block mb-1">{t("product:adj_variant")} *</label>
                <SearchablePaginatedDropdown
                  data={variantOptions}
                  selected={selVariant}
                  setSelected={setSelVariant}
                  enableApiSearch
                  onApiSearch={(v) => loadVariants(1, v)}
                  hasMore={variantHasMore}
                  onLoadMore={() => { if (variantHasMore && !variantLoading) loadVariants(variantPage + 1, ""); }}
                  paginationLoading={variantLoading}
                  loading={variantLoading && variantPage === 1}
                  placeholder={t("product:adj_select_variant")}
                  classes="!rounded-lg"
                />
              </div>

              {selVariant && (
                <div>
                  <label className="text-sm font-medium text-linkText block mb-1">{t("product:adj_warehouse")} *</label>
                  <SearchablePaginatedDropdown
                    data={warehouseOptions}
                    selected={selWarehouse}
                    setSelected={setSelWarehouse}
                    enableApiSearch
                    onApiSearch={(v) => loadWarehouses(1, v)}
                    hasMore={warehouseHasMore}
                    onLoadMore={() => { if (warehouseHasMore && !warehouseLoading) loadWarehouses(warehousePage + 1, ""); }}
                    paginationLoading={warehouseLoading}
                    loading={warehouseLoading && warehousePage === 1}
                    hideClear
                    classes="!rounded-lg"
                  />
                </div>
              )}

              {currentRow && (
                <div className={`p-3 rounded-xl border text-sm ${currentRow.stockStatus === "out_of_stock" ? "border-rose-300 bg-rose-50 dark:bg-rose-500/10" : currentRow.stockStatus === "low_stock" ? "border-amber-300 bg-amber-50 dark:bg-amber-500/10" : "border-teal-200 bg-teal-50 dark:bg-teal-500/10"}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-white/70">{t("product:adj_current_qty")}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{currentRow.totalQty} {t("product:adj_units")}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-slate-600 dark:text-white/70">{t("product:stock_min_level")}</span>
                    <span className="text-xs font-medium text-amber-600">{currentRow.minQty} {t("product:adj_units")}</span>
                  </div>
                  {currentRow.stockStatus !== "in_stock" && (
                    <p className="text-xs flex items-center gap-1 mt-1 text-amber-600"><FiAlertTriangle className="h-3 w-3" />
                      {currentRow.stockStatus === "out_of_stock" ? t("product:stock_status_out_of_stock") : t("product:stock_status_low_stock")}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-linkText block mb-1">{t("product:adj_type")} *</label>
                <div className="flex gap-2">
                  {ADJ_TYPES.map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setSelType(opt)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${selType.id === opt.id ? "border-teal-400 bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300" : "border-slate-200 dark:border-white/20 text-slate-500 dark:text-white/60 hover:border-slate-300"}`}>
                      {t(opt.title)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-linkText block mb-1">{t("product:adj_qty")} *</label>
                <input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500" />
                {preview !== null && (
                  <p className="text-xs mt-1">
                    {t("product:adj_new_balance")}: <span className={`font-bold ${TYPE_COLORS[selType.id]}`}>{preview} {t("product:adj_units")}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-linkText block mb-1">{t("product:adj_reason")} *</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                  placeholder={t("product:adj_reason_placeholder")}
                  className="w-full rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-sm focus:outline-0 focus:border-teal-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" title={t("product:adj_confirm")} onClick={handleSubmit}
                  className="flex-1 !rounded-md !border-0 !text-white !bg-teal-500 hover:!bg-teal-600 !h-11" />
                <Button type="button" title={t("cancel")} onClick={() => navigate("/inventory/stock")}
                  className="!rounded-md !h-11 !px-5 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white" />
              </div>
            </div>
          </div>

          <div className={`${panelCls.replace("!border-l-[var(--color-teal-500)]", "!border-l-slate-300")} lg:col-span-3`}>
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-5">{t("product:adj_history")} ({history.length})</h2>
            {historyLoading ? (
              <SkeletonTable rows={6} columns={8} />
            ) : history.length === 0 ? (
              <EmptyState title={t("product:adj_no_history")} />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="bg-[var(--color-teal-500)]">
                      {[t("product:adj_date"), t("product:adj_variant"), t("product:adj_warehouse"), t("product:adj_type"), t("product:adj_qty"), t("product:adj_before"), t("product:adj_after"), t("product:adj_reason")].map((h) => (
                        <th key={h} className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100 dark:border-white/5">
                        <td className="px-3 py-2 text-xs text-slate-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-800 dark:text-white text-xs">{r.variantName || "—"}</p>
                          <p className="text-xs font-mono text-slate-400">{r.sku}</p>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500">{r.warehouseName || "—"}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-bold ${TYPE_COLORS[r.type]}`}>{t(`product:adj_${r.type}`)}</span>
                        </td>
                        <td className="px-3 py-2 font-semibold tabular-nums">{r.qty}</td>
                        <td className="px-3 py-2 tabular-nums text-slate-500">{r.balanceBefore}</td>
                        <td className={`px-3 py-2 font-bold tabular-nums ${TYPE_COLORS[r.type]}`}>{r.balanceAfter}</td>
                        <td className="px-3 py-2 text-xs text-slate-500 max-w-[160px] truncate" title={r.reason}>{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAdjust;
