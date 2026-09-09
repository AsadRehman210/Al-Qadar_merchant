import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiCheck, FiX } from "react-icons/fi";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import { toast } from "react-toastify";
import { fetchCreditNoteById, updateCreditNoteStatus, showCurrentCreditNote, showCurrentCreditNoteLoading, clearCurrentCreditNote } from "store/slices/creditNoteSlice";
import { SkeletonDetail } from "components/Skeleton";
import { checkRoleAuth, lineTotal } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { status_sales_credit_note } = alqadar_role_ids;

const fmt = (n) => (parseFloat(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

import { noteStatusBadge as STATUS_BADGE, noteNextStatusMap } from "global/constant";

// Mirrors the backend's VALID_NEXT_STATUS guard in credit-note-service.ts —
// Applied/Voided are terminal (stock/journal effects already fired), so
// once reached there is nothing left to transition to.
const NEXT_STATUS = noteNextStatusMap;

// Mirrors RESTOCK_REASONS in credit-note-service.ts — only these reasons put
// the returned goods back on the shelf when the credit note is Applied.
const RESTOCK_REASONS = new Set(["Customer return", "Wrong item delivered"]);
const BILLING_ONLY_REASONS = new Set(["Wrong entry"]);

const CreditNoteDetail = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    return () => {
      dispatch(clearCurrentCreditNote());
    };
  }, [dispatch]);

  const [showStatusEdit, setShowStatusEdit] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const cn = useSelector(showCurrentCreditNote);
  const cnLoading = useSelector(showCurrentCreditNoteLoading);

  useEffect(() => {
    if (id) dispatch(fetchCreditNoteById(id));
  }, [id, dispatch]);

  if (cnLoading && !cn) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!cn) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("no_record_found")}</p>
        <Button title={t("back")} onClick={() => navigate("/credit-notes")} className="mt-4" />
      </div>
    );
  }

  const handleStatusSave = async () => {
    try {
      await dispatch(updateCreditNoteStatus({ id, status: newStatus })).unwrap();
      toast.success(t("sales:status_updated"));
      setShowStatusEdit(false);
    } catch (err) {
      toast.error(err?.message || err || "");
    }
  };

  const panelCls = "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-rose-400";
  const lineTaxPercent = (l) =>
    l?.taxPercent !== undefined && l?.taxPercent !== null ? Number(l.taxPercent) || 0 : Number(cn.taxPercent) || 0;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-6 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/credit-notes")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{cn.cnNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[cn.status] || ""}`}>{cn.status}</span>
            </div>
            <p className="text-mutedForeground text-sm mt-1">{cn.customerName} · {String(cn.date).slice(0, 10)}</p>
          </div>
          {checkRoleAuth(status_sales_credit_note) && cn.status === "Draft" && (
            <button type="button" onClick={() => { setNewStatus("Approved"); setShowStatusEdit(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600">
              <FiCheck className="h-4 w-4" /> {t("sales:approve_cn")}
            </button>
          )}
          {checkRoleAuth(status_sales_credit_note) && !!(NEXT_STATUS[cn.status] || []).length && (
            <button type="button" onClick={() => { setNewStatus(NEXT_STATUS[cn.status][0]); setShowStatusEdit(!showStatusEdit); }}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/20 text-sm font-semibold">
              {t("sales:update_status")}
            </button>
          )}
        </div>

        {/* Status form */}
        {checkRoleAuth(status_sales_credit_note) && showStatusEdit && (
          <div className="mb-5 p-4 rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-500/10 flex flex-wrap items-end gap-3">
            <div className="w-44">
              <SelectDropdown
                label={t("sales:status")}
                labelClass="!text-xs"
                data={(NEXT_STATUS[cn.status] || []).map((s) => ({ id: s, title: s }))}
                selected={{ id: newStatus, title: newStatus }}
                setSelected={(o) => setNewStatus(o?.id || newStatus)}
                valueKey="id"
                hideClear
                classes="!h-9 !rounded-lg"
              />
            </div>
            <button type="button" onClick={handleStatusSave} className="h-9 px-3 rounded-lg bg-teal-500 text-white text-sm font-semibold"><FiCheck className="h-4 w-4" /></button>
            <button type="button" onClick={() => setShowStatusEdit(false)} className="h-9 px-3 rounded-lg bg-slate-200 dark:bg-white/20 text-slate-600 dark:text-white text-sm"><FiX className="h-4 w-4" /></button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: t("sales:subtotal"), value: `${cn.currency} ${fmt(cn.subtotal)}`,  color: "border-slate-200 bg-white dark:bg-white/10 dark:border-white/20" },
            { label: t("sales:tax"),      value: `${cn.currency} ${fmt(cn.taxAmount)}`, color: "border-amber-200 bg-amber-50 dark:bg-amber-500/10" },
            { label: t("sales:total"),    value: `${cn.currency} ${fmt(cn.total)}`,     color: "border-rose-400 bg-rose-50 dark:bg-rose-500/10" },
          ].map((c) => (
            <div key={c.label} className={`p-4 rounded-2xl border ${c.color}`}>
              <p className="text-xs text-slate-500">{c.label}</p>
              <p className="font-bold text-lg text-slate-900 dark:text-white mt-0.5">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className={panelCls}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 text-sm mb-7">
            {[
              { label: t("sales:customer"),          value: cn.customerName },
              { label: t("sales:date"),              value: String(cn.date).slice(0, 10) },
              { label: t("sales:original_invoice"),  value: cn.originalInvoiceNumber || "—" },
              { label: t("sales:reason"),            value: cn.reason },
              { label: t("sales:return_type"),       value: cn.returnType || "—" },
              { label: t("sales:warehouse"),         value: cn.warehouseName || "—" },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-xs font-medium text-slate-400 uppercase">{f.label}</p>
                <p className="font-semibold text-slate-800 dark:text-white mt-0.5">{f.value}</p>
              </div>
            ))}
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">{t("sales:stock_effect", { defaultValue: "Stock effect" })}</p>
              <p className={`font-semibold mt-0.5 ${RESTOCK_REASONS.has(cn.reason) ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {RESTOCK_REASONS.has(cn.reason)
                  ? t("sales:restock_yes")
                  : BILLING_ONLY_REASONS.has(cn.reason)
                    ? t("sales:restock_billing")
                    : t("sales:restock_no")}
              </p>
            </div>
          </div>

          <h3 className="font-bold mb-3">{t("sales:line_items")}</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm min-w-[1200px]">
              <thead>
                <tr className="bg-rose-500">
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90 w-12">{t("sales:sr_no")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("sales:product")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90 whitespace-nowrap">{t("sales:qty_to_return")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("sales:price")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("sales:cost")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("sales:unit")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90 whitespace-nowrap">{t("sales:expiry_date")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("sales:base_amount")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("sales:tax_percent")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("sales:tax_amount")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("sales:subtotal")}</th>
                </tr>
              </thead>
              <tbody>
                {(cn.products || []).map((l, idx) => {
                  const base = lineTotal(l);
                  const taxAmt = l.taxAmount ?? base * (lineTaxPercent(l) / 100);
                  return (
                    <tr key={l.id || l.variantId || idx} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-3 py-2.5 tabular-nums text-slate-600 dark:text-white/70 font-medium">{idx + 1}</td>
                      <td className="px-3 py-2.5">{l.productName}</td>
                      <td className="px-3 py-2.5 tabular-nums">{l.qty}</td>
                      <td className="px-3 py-2.5 tabular-nums">{fmt(l.price)}</td>
                      <td className="px-3 py-2.5 tabular-nums text-slate-500">{fmt(l.costPrice)}</td>
                      <td className="px-3 py-2.5">{l.unit}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{l.expiryDate ? String(l.expiryDate).slice(0, 10) : "—"}</td>
                      <td className="px-3 py-2.5 tabular-nums font-semibold">{fmt(base)}</td>
                      <td className="px-3 py-2.5 tabular-nums text-slate-500">{lineTaxPercent(l)}%</td>
                      <td className="px-3 py-2.5 tabular-nums text-slate-500">{fmt(taxAmt)}</td>
                      <td className="px-3 py-2.5 tabular-nums font-semibold">{fmt(base + taxAmt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {cn.notes && (
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-white/15">
              <p className="text-sm text-slate-500 mb-1">{t("sales:notes")}</p>
              <p className="text-sm">{cn.notes}</p>
            </div>
          )}

          {/* Reference to original invoice */}
          {cn.originalInvoiceId && (
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-white/15 flex items-center justify-between">
              <p className="text-sm text-slate-500">{t("sales:linked_invoice")}: <span className="font-medium">{cn.originalInvoiceNumber}</span></p>
              <button type="button" onClick={() => navigate(`/sales/detail/${cn.originalInvoiceId}`)}
                className="text-sm text-teal-600 hover:underline">{t("sales:view_invoice")}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditNoteDetail;
