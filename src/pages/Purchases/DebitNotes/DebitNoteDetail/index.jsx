import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiCheck, FiX } from "react-icons/fi";
import Button from "components/Button";
import { toast } from "react-toastify";
import {
  fetchDebitNoteById,
  updateDebitNoteStatus,
  showCurrentDebitNote,
  showCurrentDebitNoteLoading,
} from "store/slices/debitNoteSlice";
import { lineTotal } from "../../purchaseInvoiceHelpers";
import { SkeletonDetail } from "components/Skeleton";

const fmt = (n) => (parseFloat(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

import { noteStatusBadge as STATUS_BADGE } from "global/constant";

// Mirrors the backend's VALID_NEXT_STATUS guard in debit-note-service.ts —
// Applied/Voided are terminal (stock/journal effects already fired), so
// once reached there is nothing left to transition to.
const NEXT_STATUS = {
  Draft: ["Approved", "Voided"],
  Approved: ["Applied", "Voided"],
};

// Mirrors NO_STOCK_MOVEMENT_REASONS in debit-note-service.ts — these two
// reasons never move stock when Applied.
const NO_STOCK_MOVEMENT_REASONS = new Set(["Price discrepancy", "Short shipment"]);

const DebitNoteDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate     = useNavigate();
  const dispatch      = useDispatch();
  const { id }       = useParams();
  const isRTL        = i18n.language === "ar";

  const [showStatusEdit, setShowStatusEdit] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const dn = useSelector(showCurrentDebitNote);
  const dnLoading = useSelector(showCurrentDebitNoteLoading);

  useEffect(() => {
    if (id) dispatch(fetchDebitNoteById(id));
  }, [id, dispatch]);

  if (dnLoading && !dn) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!dn) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("no_record_found")}</p>
        <Button title={t("back")} onClick={() => navigate("/debit-notes")} className="mt-4" />
      </div>
    );
  }

  const handleStatusSave = async () => {
    try {
      await dispatch(updateDebitNoteStatus({ id, status: newStatus })).unwrap();
      toast.success(t("purchase:status_updated"));
      setShowStatusEdit(false);
    } catch (err) {
      toast.error(err?.message || err || "");
    }
  };

  const panelCls = "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-amber-400";
  // "Different per product" mode leaves a real (non-null) taxPercent override
  // on at least one line — same detection rule Purchase Detail's own table uses.
  const hasDifferentTax = (dn.products || []).some((l) => l.taxPercent !== null && l.taxPercent !== undefined);

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-6 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/debit-notes")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{dn.dnNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[dn.status] || ""}`}>{dn.status}</span>
            </div>
            <p className="text-mutedForeground text-sm mt-1">{dn.supplierName} · {String(dn.date).slice(0, 10)}</p>
          </div>
          {dn.status === "Draft" && (
            <button type="button" onClick={() => { setNewStatus("Approved"); setShowStatusEdit(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600">
              <FiCheck className="h-4 w-4" /> {t("purchase:approve_dn")}
            </button>
          )}
          {!!(NEXT_STATUS[dn.status] || []).length && (
            <button type="button" onClick={() => { setNewStatus(NEXT_STATUS[dn.status][0]); setShowStatusEdit(!showStatusEdit); }}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/20 text-sm font-semibold">
              {t("purchase:update_status")}
            </button>
          )}
        </div>

        {showStatusEdit && (
          <div className="mb-5 p-4 rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-500/10 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-linkText block mb-1">{t("purchase:status")}</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0">
                {(NEXT_STATUS[dn.status] || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button type="button" onClick={handleStatusSave} className="h-9 px-3 rounded-lg bg-teal-500 text-white text-sm font-semibold"><FiCheck className="h-4 w-4" /></button>
            <button type="button" onClick={() => setShowStatusEdit(false)} className="h-9 px-3 rounded-lg bg-slate-200 dark:bg-white/20 text-slate-600 dark:text-white text-sm"><FiX className="h-4 w-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: t("purchase:subtotal"), value: `${dn.currency} ${fmt(dn.subtotal)}`,  color: "border-slate-200 bg-white dark:bg-white/10 dark:border-white/20" },
            { label: t("purchase:tax"),      value: `${dn.currency} ${fmt(dn.taxAmount)}`, color: "border-amber-200 bg-amber-50 dark:bg-amber-500/10" },
            { label: t("purchase:discount"), value: `${dn.currency} ${fmt(dn.discount)}`,  color: "border-rose-200 bg-rose-50 dark:bg-rose-500/10" },
            { label: t("purchase:total"),    value: `${dn.currency} ${fmt(dn.total)}`,     color: "border-amber-400 bg-amber-50 dark:bg-amber-500/10" },
          ].map((c) => (
            <div key={c.label} className={`p-4 rounded-2xl border ${c.color}`}>
              <p className="text-xs text-slate-500">{c.label}</p>
              <p className="font-bold text-lg text-slate-900 dark:text-white mt-0.5">{c.value}</p>
            </div>
          ))}
        </div>

        <div className={panelCls}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 text-sm mb-7">
            {[
              { label: t("purchase:supplier"),          value: dn.supplierName },
              { label: t("purchase:date"),              value: String(dn.date).slice(0, 10) },
              { label: t("purchase:original_invoice"),  value: dn.originalInvoiceNumber || "—" },
              { label: t("purchase:reason"),            value: dn.reason },
              { label: t("purchase:warehouse"),         value: dn.warehouseName || "—" },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-xs font-medium text-slate-400 uppercase">{f.label}</p>
                <p className="font-semibold text-slate-800 dark:text-white mt-0.5">{f.value}</p>
              </div>
            ))}
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">{t("purchase:stock_effect", { defaultValue: "Stock effect" })}</p>
              <p className={`font-semibold mt-0.5 ${NO_STOCK_MOVEMENT_REASONS.has(dn.reason) ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {NO_STOCK_MOVEMENT_REASONS.has(dn.reason)
                  ? t("purchase:no_stock_movement", { defaultValue: "No stock movement (billing only)" })
                  : t("purchase:stock_leaves_on_apply", { defaultValue: "Leaves warehouse on Apply" })}
              </p>
            </div>
          </div>

          <h3 className="font-bold mb-3">{t("purchase:line_items")}</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-amber-500">
                  {[
                    t("purchase:product"),
                    t("purchase:expiry_date", { defaultValue: "Expiry date" }),
                    t("purchase:qty"),
                    t("purchase:unit"),
                    t("purchase:price"),
                    ...(hasDifferentTax ? [t("purchase:tax_percent")] : []),
                    t("purchase:tax_amount"),
                    t("purchase:line_total"),
                  ].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-start text-xs font-semibold text-white/90">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(dn.products || []).map((l, idx) => (
                  <tr key={l.id || l.variantId || idx} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-4 py-2.5">{l.productName}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{l.expiryDate ? String(l.expiryDate).slice(0, 10) : "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums">{l.qty}</td>
                    <td className="px-4 py-2.5">{l.unit}</td>
                    <td className="px-4 py-2.5 tabular-nums">{fmt(l.price)}</td>
                    {hasDifferentTax && (
                      <td className="px-4 py-2.5">{l.taxPercent !== null && l.taxPercent !== undefined ? `${l.taxPercent}%` : "—"}</td>
                    )}
                    <td className="px-4 py-2.5 tabular-nums text-slate-500">{fmt(l.taxAmount)}</td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-amber-700">{fmt(lineTotal(l) + (l.taxAmount || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {dn.originalInvoiceId && (
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-white/15 flex items-center justify-between">
              <p className="text-sm text-slate-500">{t("purchase:linked_invoice")}: <span className="font-medium">{dn.originalInvoiceNumber}</span></p>
              <button type="button" onClick={() => navigate(`/purchases/detail/${dn.originalInvoiceId}`)}
                className="text-sm text-teal-600 hover:underline">{t("purchase:view_invoice")}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebitNoteDetail;
