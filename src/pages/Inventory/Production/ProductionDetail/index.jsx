import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight, FiCheck, FiX, FiEdit2, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { FaRegEdit } from "react-icons/fa";
import Button from "components/Button";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { SkeletonDetail } from "components/Skeleton";
import {
  fetchProductionOrderById,
  showCurrentProductionOrder,
  showCurrentProductionOrderLoading,
  clearCurrentProductionOrder,
  updateProductionOrder,
  completeProduction,
} from "store/slices/productionSlice";

const { edit_customer } = rafeeqi_role_ids;

const STATUS_BADGE = {
  Draft: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  InProgress: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

const varKey = (s) => `production:st_${(s || "").toLowerCase().replace(/\s/g, "_")}`;

const fmtNum = (n) => (n == null || n === "") ? "—" : Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

const varianceClass = (planned, actual) => {
  if (actual == null || actual === "") return "";
  const pct = Math.abs((Number(actual) - Number(planned)) / (Number(planned) || 1)) * 100;
  if (pct > 10) return "text-rose-600 dark:text-rose-400";
  if (pct > 0) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
};

const ProductionDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const order = useSelector(showCurrentProductionOrder);
  const orderLoading = useSelector(showCurrentProductionOrderLoading);

  const [editingLine, setEditingLine] = useState(null); // variantId
  const [editingVal, setEditingVal] = useState("");
  const [completing, setCompleting] = useState(false);

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

  const canEdit = checkRoleAuth(edit_customer) && order.status !== "Completed" && order.status !== "Cancelled";

  const handleSaveActual = async (variantId) => {
    const rawLines = (order.rawLines || []).map((l) =>
      l.variantId === variantId ? { ...l, actualQuantity: editingVal === "" ? null : Number(editingVal) } : l,
    );
    try {
      await dispatch(updateProductionOrder({ id, data: { rawLines } })).unwrap();
    } catch (err) {
      toast.error(err || t("product:save_failed"));
    }
    setEditingLine(null);
  };

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

  const allActualEntered = (order.rawLines || []).every((l) => l.actualQuantity !== null && l.actualQuantity !== undefined);

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
            {order.scheduledDate && (
              <p className="text-mutedForeground text-sm mt-1">{t("production:scheduled_date")}: {order.scheduledDate?.slice(0, 10)}</p>
            )}
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <button type="button" onClick={handleComplete} disabled={completing}
                className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-semibold hover:bg-emerald-200 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                <FiCheckCircle className="h-4 w-4" />{t("production:complete_order")}
              </button>
            )}
            {canEdit && checkRoleAuth(edit_customer) && (
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
                { label: t("production:completed_date"), value: order.completedDate ? order.completedDate.slice(0, 10) : "—" },
                { label: t("production:warehouse"), value: order.warehouseName || "—" },
                { label: t("production:batch_unit_cost"), value: fmtNum(order.unitCost) },
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
                <span className="text-slate-500">{t("production:actual_entered")}</span>
                <span className={`font-semibold ${allActualEntered ? "text-emerald-600" : "text-amber-600"}`}>
                  {(order.rawLines || []).filter((l) => l.actualQuantity !== null && l.actualQuantity !== undefined).length} / {(order.rawLines || []).length}
                </span>
              </div>
              {!allActualEntered && order.status !== "Completed" && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                  <FiAlertTriangle className="h-3.5 w-3.5" />{t("production:enter_actual_hint")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={panelCls}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              {t("production:raw_materials")} ({(order.rawLines || []).length})
            </h2>
            {canEdit && (
              <p className="text-xs text-slate-400">{t("production:click_pencil_to_enter")}</p>
            )}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  {[t("production:material_name"), t("production:material_sku"), t("production:planned_qty"), t("production:actual_qty"), t("production:variance"), ""].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(order.rawLines || []).map((line) => {
                  const isEditing = editingLine === line.variantId;
                  const variance = line.actualQuantity !== null && line.actualQuantity !== undefined
                    ? Number(line.actualQuantity) - Number(line.quantity)
                    : null;
                  const varPct = variance !== null && Number(line.quantity)
                    ? ((variance / Number(line.quantity)) * 100).toFixed(1)
                    : null;

                  return (
                    <tr key={line.variantId} className="border-t border-slate-100 dark:border-white/5">
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
                      <td className="px-3 py-2.5 tabular-nums text-slate-700 dark:text-white">{fmtNum(line.quantity)}</td>
                      <td className="px-3 py-2.5">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input type="number" min="0" step="any" value={editingVal}
                              onChange={(e) => setEditingVal(e.target.value)} autoFocus
                              className="w-20 h-7 rounded border border-teal-300 bg-teal-50 dark:bg-teal-500/10 px-1.5 text-xs focus:outline-0" />
                            <button type="button" onClick={() => handleSaveActual(line.variantId)} className="text-emerald-600"><FiCheck className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => setEditingLine(null)} className="text-slate-400"><FiX className="h-3.5 w-3.5" /></button>
                          </div>
                        ) : (
                          <span className={`font-semibold ${line.actualQuantity != null ? varianceClass(line.quantity, line.actualQuantity) : "text-slate-400"}`}>
                            {line.actualQuantity != null ? fmtNum(line.actualQuantity) : t("production:not_entered")}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {variance !== null ? (
                          <div className="text-xs">
                            <span className={`font-semibold ${varianceClass(line.quantity, line.actualQuantity)}`}>
                              {variance >= 0 ? "+" : ""}{fmtNum(variance)}
                            </span>
                            {varPct !== null && <span className="ml-1 text-slate-400">({varPct >= 0 ? "+" : ""}{varPct}%)</span>}
                          </div>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {canEdit && !isEditing && (
                          <button type="button" onClick={() => { setEditingLine(line.variantId); setEditingVal(String(line.actualQuantity ?? "")); }}
                            className="text-slate-400 hover:text-teal-600 transition-colors">
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {t("production:variance_note")}
          </p>
        </div>

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
    </div>
  );
};

export default ProductionDetail;
