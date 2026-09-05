import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiCheck, FiX, FiRefreshCw } from "react-icons/fi";
import { HiOutlineArrowDownTray } from "react-icons/hi2";
import { FaRegEdit } from "react-icons/fa";
import Button from "components/Button";
import { toast } from "react-toastify";
import {
  fetchQuotationById,
  updateQuotationStatus,
  showCurrentQuotation,
  showCurrentQuotationLoading,
} from "store/slices/quotationSlice";
import QuotationPreviewModal from "../QuotationPreviewModal";
import dayjs from "dayjs";
import { SkeletonDetail } from "components/Skeleton";
import { checkRoleAuth, lineTotal, lineProfit, computeInvoiceProfit, formatAmount } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { quotationStatusBadge as STATUS_BADGE, quotationStatusList } from "global/constant";

const { status_sales_quotation } = rafeeqi_role_ids;

const QUOTE_STATUS = quotationStatusList;

const fmt = formatAmount;

const QuotationDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate     = useNavigate();
  const dispatch     = useDispatch();
  const { id }       = useParams();
  const isRTL        = i18n.language === "ar";

  const [showConvert, setShowConvert] = useState(false);
  const [showStatusEdit, setShowStatusEdit] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const quote = useSelector(showCurrentQuotation);
  const quoteLoading = useSelector(showCurrentQuotationLoading);
  const refresh = () => dispatch(fetchQuotationById(id));

  useEffect(() => {
    if (id) dispatch(fetchQuotationById(id));
  }, [id, dispatch]);

  if (quoteLoading && !quote) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("no_record_found")}</p>
        <Button title={t("back")} onClick={() => navigate("/quotation")} className="mt-4" />
      </div>
    );
  }

  const canConvert = !["Converted", "Rejected", "Expired"].includes(quote.status);
  const isExpired  = quote.validUntil && dayjs(quote.validUntil).isBefore(dayjs());
  const lines = quote.lines || [];
  const totalProfit = computeInvoiceProfit(lines);
  // "Different per product" mode leaves a real (non-null) taxPercent
  // override on at least one line — same detection rule the add/edit form
  // uses to reconstruct its own tax-mode toggle from saved data.
  const hasDifferentTax = lines.some((l) => l.taxPercent !== null && l.taxPercent !== undefined);

  // Conversion is manual now — hand off to Add Sale Invoice, prefilled with
  // this quote's customer/warehouse/line items, so the user picks each
  // line's batch themselves (same picker a normal sale uses). The quote only
  // actually flips to Converted once that form is submitted and a real
  // invoice exists (see AddSaleInvoice's onSubmit).
  const handleContinueToInvoice = () => {
    navigate("/sales/add", { state: { fromQuotationId: quote.id } });
  };

  const handleStatusSave = async () => {
    try {
      await dispatch(updateQuotationStatus({ id, status: newStatus })).unwrap();
      setShowStatusEdit(false);
      refresh();
    } catch (err) {
      toast.error(err?.message || err || "");
    }
  };

  const panelCls = "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/quotation")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{quote.quoteNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[quote.status] || ""}`}>{quote.status}</span>
              {isExpired && quote.status !== "Converted" && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-600">Expired</span>
              )}
            </div>
            <p className="text-mutedForeground text-sm mt-1">{quote.customerName} · {quote.date}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              title={t("sales:download_pdf")}
              icon={HiOutlineArrowDownTray}
              className="!w-auto !rounded-lg !h-11 !px-4 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700"
              iconClass="!text-lg"
              onClick={() => setPreviewOpen(true)}
            />
            {/* Convert to Invoice */}
            {canConvert && (
              <button type="button" onClick={() => setShowConvert(!showConvert)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 transition-colors">
                <FiRefreshCw className="h-4 w-4" /> {t("sales:convert_to_invoice")}
              </button>
            )}
            {checkRoleAuth(status_sales_quotation) && (
              <button type="button" onClick={() => { setNewStatus(quote.status); setShowStatusEdit(!showStatusEdit); }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm font-semibold text-slate-700 dark:text-white hover:bg-slate-50">
                {t("sales:update_status")}
              </button>
            )}
            <Button title={t("edit")} icon={FaRegEdit} type="button"
              onClick={() => navigate(`/quotation/edit/${quote.id}`)}
              className="!w-auto !rounded-md !h-10 !px-4 !border border-slate-200 dark:!border-white/25 !text-white dark:!text-white dark:!bg-white/10 hover:!bg-teal-600 dark:hover:!bg-white/20"
              btn="primary" />
          </div>
        </div>

        {/* Convert panel */}
        {showConvert && (
          <div className="mb-5 p-5 rounded-2xl border-2 border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/5">
            <p className="font-semibold text-purple-700 dark:text-purple-300 mb-2">{t("sales:convert_confirm")}</p>
            <p className="text-sm text-slate-600 dark:text-white/70 mb-4">{t("sales:convert_hint")}</p>
            <div className="flex gap-2">
              <Button type="button" title={t("sales:continue_to_invoice", { defaultValue: "Continue to Sale Invoice" })} onClick={handleContinueToInvoice}
                className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-purple-500 hover:!bg-purple-600" />
              <Button type="button" title={t("cancel")} onClick={() => setShowConvert(false)}
                className="!w-auto !rounded-lg !h-9 !px-4 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white" />
            </div>
          </div>
        )}

        {/* Already converted banner */}
        {quote.status === "Converted" && quote.convertedInvoiceId && (
          <div className="mb-5 p-4 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              {t("sales:already_converted")}
            </p>
            <button type="button" onClick={() => navigate(`/sales/detail/${quote.convertedInvoiceId}`)}
              className="text-sm text-purple-600 underline">{t("sales:view_invoice")}</button>
          </div>
        )}

        {/* Status edit */}
        {checkRoleAuth(status_sales_quotation) && showStatusEdit && (
          <div className="mb-5 p-4 rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-500/10 flex items-end gap-3">
            <div>
              <label className="text-xs font-medium text-linkText block mb-1">{t("sales:status")}</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0">
                {QUOTE_STATUS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button type="button" onClick={handleStatusSave} className="h-9 px-3 rounded-lg bg-teal-500 text-white text-sm font-semibold"><FiCheck className="h-4 w-4" /></button>
            <button type="button" onClick={() => setShowStatusEdit(false)} className="h-9 px-3 rounded-lg bg-slate-200 dark:bg-white/20 text-slate-600 dark:text-white text-sm"><FiX className="h-4 w-4" /></button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: t("sales:subtotal"), value: `${quote.currency} ${fmt(quote.subtotal)}`,   color: "border-slate-200 bg-white dark:bg-white/10 dark:border-white/20" },
            { label: t("sales:tax"),      value: `${quote.currency} ${fmt(quote.taxAmount)}`,  color: "border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30" },
            { label: t("sales:profit"),   value: `${quote.currency} ${fmt(totalProfit)}`,      color: "border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30" },
            { label: t("sales:total"),    value: `${quote.currency} ${fmt(quote.total)}`,      color: "border-teal-200 bg-teal-50 dark:bg-teal-500/10 dark:border-teal-500/30" },
          ].map((c) => (
            <div key={c.label} className={`p-4 rounded-2xl border ${c.color}`}>
              <p className="text-xs text-slate-500 dark:text-white/60">{c.label}</p>
              <p className="font-bold text-lg text-slate-900 dark:text-white mt-0.5">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Details */}
        <div className={panelCls}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 text-sm mb-7">
            {[
              { label: t("sales:customer"),     value: quote.customerName },
              { label: t("sales:date"),         value: quote.date },
              { label: t("sales:valid_until"),  value: quote.validUntil || "—" },
              { label: t("sales:warehouse"),    value: quote.warehouseName || "—" },
              { label: t("sales:currency"),     value: quote.currency },
              { label: t("sales:tax_percent"),  value: `${quote.taxPercent}%` },
              { label: t("sales:created_by"),   value: quote.createdBy || "—" },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-xs font-medium text-slate-400 uppercase">{f.label}</p>
                <p className="font-semibold text-slate-800 dark:text-white mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Line items */}
          <h3 className="font-bold text-slate-800 dark:text-white mb-3">{t("sales:line_items")}</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  {[
                    t("sales:product"), t("sales:qty"), t("sales:unit"), t("sales:price"), t("sales:cost"),
                    t("sales:expiry_date", { defaultValue: "Expiry date" }),
                    t("sales:base_amount"),
                    ...(hasDifferentTax ? [t("sales:tax_percent")] : []),
                    t("sales:tax_amount"), t("sales:subtotal"), t("sales:profit"),
                  ].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-start text-xs font-semibold text-white/90">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => {
                  const base = lineTotal(l);
                  const lineTaxAmount = l.taxAmount ?? 0;
                  return (
                    <tr key={l.id || l.variantId || idx} className="border-t border-slate-100 dark:border-white/5">
                      <td className="px-4 py-2.5">{l.productName}</td>
                      <td className="px-4 py-2.5 tabular-nums">{l.qty}</td>
                      <td className="px-4 py-2.5">{l.unit}</td>
                      <td className="px-4 py-2.5 tabular-nums">{fmt(l.price)}</td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-500">{fmt(l.costPrice)}</td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-white/80 text-xs whitespace-nowrap">
                        {l.expiryDate ? String(l.expiryDate).slice(0, 10) : "—"}
                      </td>
                      <td className="px-4 py-2.5 font-semibold tabular-nums">{fmt(base)}</td>
                      {hasDifferentTax && (
                        <td className="px-4 py-2.5 tabular-nums">
                          {l.taxPercent !== null && l.taxPercent !== undefined ? `${l.taxPercent}%` : "—"}
                        </td>
                      )}
                      <td className="px-4 py-2.5 tabular-nums">{fmt(lineTaxAmount)}</td>
                      <td className="px-4 py-2.5 font-semibold tabular-nums">{fmt(base + lineTaxAmount)}</td>
                      <td className={`px-4 py-2.5 font-semibold tabular-nums ${lineProfit(l) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {fmt(lineProfit(l))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {quote.notes && (
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-white/15">
              <p className="text-sm text-slate-500 mb-1">{t("sales:notes")}</p>
              <p className="text-sm text-slate-700 dark:text-white">{quote.notes}</p>
            </div>
          )}
        </div>

        <QuotationPreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          quote={quote}
        />
      </div>
    </div>
  );
};

export default QuotationDetail;
