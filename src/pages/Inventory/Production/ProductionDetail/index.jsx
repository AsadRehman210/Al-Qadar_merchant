import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiRotateCcw } from "react-icons/fi";
import { FaRegEdit } from "react-icons/fa";
import Button from "components/Button";
import ActionPopup from "components/ActionPopup";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { SkeletonDetail } from "components/Skeleton";
import {
  fetchProductionOrderById,
  showCurrentProductionOrder,
  showCurrentProductionOrderLoading,
  clearCurrentProductionOrder,
  completeProduction,
  reverseProduction,
} from "store/slices/productionSlice";

const { edit_inventory_production } = alqadar_role_ids;

const STATUS_BADGE = {
  Draft: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  InProgress: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  Reversed: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
};

const varKey = (s) => `production:st_${(s || "").toLowerCase().replace(/\s/g, "_")}`;

const fmtNum = (n) => (n == null || n === "") ? "—" : Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

const ProductionDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const order = useSelector(showCurrentProductionOrder);
  const orderLoading = useSelector(showCurrentProductionOrderLoading);

  const [completing, setCompleting] = useState(false);
  const [reversing, setReversing] = useState(false);
  const reversePopupRef = useRef();

  useEffect(() => {
    dispatch(fetchProductionOrderById(id));
    return () => dispatch(clearCurrentProductionOrder());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (orderLoading && !order) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("production:no_record")}</p>
        <Button title={t("back")} onClick={() => navigate("/inventory/production")} className="mt-4" />
      </div>
    );
  }

  const canEdit = checkRoleAuth(edit_inventory_production) && order.status !== "Completed" && order.status !== "Cancelled" && order.status !== "Reversed";
  const canReverse = checkRoleAuth(edit_inventory_production) && order.status === "Completed";

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await dispatch(completeProduction(id)).unwrap();
      toast.success(t("production:complete_success"));
    } catch (err) {
      toast.error(err || t("production:complete_failed"));
    } finally {
      setCompleting(false);
    }
  };

  const handleReverse = async () => {
    setReversing(true);
    try {
      await dispatch(reverseProduction(id)).unwrap();
      toast.success(t("production:reverse_success"));
    } catch (err) {
      toast.error(err || t("production:reverse_failed"));
    } finally {
      setReversing(false);
      reversePopupRef.current?.closeModal?.();
    }
  };

  const totalConsumedQty = (order.rawLines || []).reduce((s, l) => s + (Number(l.quantity) || 0), 0);
  const orderDate = order.completedDate
    ? String(order.completedDate).slice(0, 10)
    : order.scheduledDate
      ? String(order.scheduledDate).slice(0, 10)
      : null;

  const panelCls = "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-6 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/inventory/production")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[order.status] || ""}`}>
                {t(varKey(order.status))}
              </span>
            </div>
            {orderDate && (
              <p className="text-mutedForeground text-sm mt-1">{t("production:completed_date")}: {orderDate}</p>
            )}
          </div>
          <div className="flex gap-2">
            {canReverse && (
              <button type="button" onClick={() => reversePopupRef.current?.openModal?.(order)} disabled={reversing}
                className="px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-sm font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                <FiRotateCcw className="h-4 w-4" />{t("production:reverse_order")}
              </button>
            )}
            {canEdit && (
              <button type="button" onClick={handleComplete} disabled={completing}
                className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-semibold hover:bg-emerald-200 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                <FiCheckCircle className="h-4 w-4" />{t("production:complete_order")}
              </button>
            )}
            {canEdit && checkRoleAuth(edit_inventory_production) && (
              <Button title={t("edit")} icon={FaRegEdit} type="button"
                onClick={() => navigate(`/inventory/production/edit/${order.id}`)}
                className="!w-auto !rounded-md !h-11 !px-5 !border-0 !text-white !bg-teal-500" />
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <div className={panelCls}>
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">{t("production:preview_output")}</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-mutedForeground">{t("production:finished_output")}</dt>
                <dd className="font-medium text-slate-800 dark:text-white/90 text-end">
                  {order.outputVariantId ? (
                    <Link
                      to={`/inventory/variants/detail/${order.outputVariantId}`}
                      className="text-teal-700 dark:text-teal-300 hover:underline"
                    >
                      {order.outputVariantName || "—"}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              {[
                { label: t("production:output_quantity"), value: order.outputQuantity ?? "—" },
                { label: t("production:completed_date"), value: orderDate || "—" },
                { label: t("production:total_raw_cost"), value: fmtNum(order.totalRawCost) },
                { label: t("production:total_other_cost"), value: fmtNum(order.totalOtherCost) },
                { label: t("production:total_cost"), value: fmtNum(order.totalCost) },
                { label: t("production:batch_unit_cost"), value: fmtNum(order.unitCost) },
                ...(order.quarantineLotId
                  ? [
                      {
                        label: t("production:quarantine_lot"),
                        value: order.quarantineLotNumber
                          ? `${order.quarantineLotNumber}${order.quarantineQty ? ` × ${order.quarantineQty}` : ""}`
                          : "—",
                      },
                      {
                        label: t("production:quarantine_cost"),
                        value: fmtNum(
                          (Number(order.quarantineQty) || 0) * (Number(order.quarantineCostPrice) || 0),
                        ),
                      },
                    ]
                  : []),
              ].map((f) => (
                <div key={f.label} className="flex justify-between gap-4">
                  <dt className="text-mutedForeground">{f.label}</dt>
                  <dd className="font-medium text-slate-800 dark:text-white/90 text-end">{f.value}</dd>
                </div>
              ))}
            </dl>
            {order.notes && (
              <div className="mt-5 pt-5 border-t border-slate-200 dark:border-white/15">
                <p className="text-sm text-mutedForeground mb-1">{t("production:notes")}</p>
                <p className="text-slate-700 dark:text-white/85 text-sm whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>

          <div className={panelCls.replace("!border-l-[var(--color-teal-500)]", "!border-l-purple-400")}>
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">{t("production:consumption_summary")}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t("production:total_materials")}</span>
                <span className="font-semibold">{(order.rawLines || []).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t("production:total_consumed_qty")}</span>
                <span className="font-semibold">{fmtNum(totalConsumedQty)}</span>
              </div>
            </div>
          </div>
        </div>

        {(order.outputLines || []).length > 0 && (
          <div className={`${panelCls} mb-6`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                {t("production:output_destinations")} ({order.outputLines.length})
              </h2>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="bg-[var(--color-teal-500)]">
                    {[t("production:output_warehouse"), t("production:output_quantity"), t("production:output_expiry_date")].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {order.outputLines.map((line, idx) => (
                    <tr key={`${line.warehouseId}-${idx}`} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-3 py-2.5 font-medium">{line.warehouseName || "—"}</td>
                      <td className="px-3 py-2.5 tabular-nums font-semibold">{fmtNum(line.quantity)}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                        {line.expiryDate ? String(line.expiryDate).slice(0, 10) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className={panelCls}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              {t("production:raw_materials")} ({(order.rawLines || []).length})
            </h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  {[
                    t("production:material_name"),
                    t("production:material_sku"),
                    t("production:raw_warehouse"),
                    t("production:per_unit_cost"),
                    t("production:actual_qty"),
                    t("production:line_cost"),
                  ].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(order.rawLines || []).map((line, idx) => {
                  const lineCost = (Number(line.costPrice) || 0) * (Number(line.quantity) || 0);
                  return (
                  <tr key={`${line.variantId}-${line.warehouseId}-${idx}`} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-3 py-2.5 font-medium">
                      {line.variantId ? (
                        <Link
                          to={`/inventory/variants/detail/${line.variantId}`}
                          className="text-teal-700 dark:text-teal-300 hover:underline"
                        >
                          {line.variantName || "—"}
                        </Link>
                      ) : (
                        line.variantName || "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{line.sku || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-white/80">{line.warehouseName || "—"}</td>
                    <td className="px-3 py-2.5 tabular-nums">{fmtNum(line.costPrice)}</td>
                    <td className="px-3 py-2.5 tabular-nums font-semibold text-slate-700 dark:text-white">{fmtNum(line.quantity)}</td>
                    <td className="px-3 py-2.5 tabular-nums font-semibold text-slate-700 dark:text-white">{fmtNum(lineCost)}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {(order.consumedBatches || []).length > 0 && (
          <div className={`${panelCls} mt-6`}>
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-5">
              {t("production:consumed_batches")} ({order.consumedBatches.length})
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-[var(--color-teal-500)]">
                    {[t("production:material_name"), t("production:material_sku"), t("production:quantity"), t("production:batch_unit_cost"), t("sales:expiry_date")].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {order.consumedBatches.map((line, idx) => (
                    <tr key={`${line.batchId}-${idx}`} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-3 py-2.5 font-medium">{line.variantName || "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{line.sku || "—"}</td>
                      <td className="px-3 py-2.5 tabular-nums">{fmtNum(line.qty)}</td>
                      <td className="px-3 py-2.5 tabular-nums">{fmtNum(line.unitCost)}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                        {line.expiryDate ? String(line.expiryDate).slice(0, 10) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(order.otherCostLines || []).some((l) => l.label || l.amount) && (
          <div className={`${panelCls} mt-6`}>
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-5">
              {t("production:other_costs")} ({(order.otherCostLines || []).length})
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="bg-[var(--color-teal-500)]">
                    {[t("production:other_cost_label"), t("production:other_cost_amount")].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(order.otherCostLines || []).map((line, idx) => (
                    <tr key={idx} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-3 py-2.5 font-medium">{line.label || "—"}</td>
                      <td className="px-3 py-2.5 tabular-nums">{fmtNum(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <ActionPopup
        ref={reversePopupRef}
        title={t("production:reverse_order")}
        description={t("production:confirm_reverse")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={handleReverse}
        loading={reversing}
      />
    </div>
  );
};

export default ProductionDetail;
