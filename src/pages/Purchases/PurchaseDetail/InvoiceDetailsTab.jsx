import { useTranslation } from "react-i18next";
import { lineTotal } from "global/helper";
import { paymentStatusBadge, purchaseStatusBadge } from "global/constant";
import DetailField from "./DetailField";

const InvoiceDetailsTab = ({
  invoice,
  panelClass,
  sub,
  taxAmt,
}) => {
  const { t } = useTranslation();

  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  const productTypeLabel = (type) => {
    if (type === "final_product") return t("purchase:final_product");
    return t("purchase:raw_material");
  };

  const products = invoice.products || [];

  // Only Applied debit notes have actually reversed anything — Draft/
  // Approved ones are still just proposals.
  const returnedQtyByVariant = new Map();
  for (const r of invoice.returnedItems || []) {
    if (r.dnStatus !== "Applied") continue;
    returnedQtyByVariant.set(r.variantId, (returnedQtyByVariant.get(r.variantId) || 0) + (r.qty || 0));
  }

  return (
    <div className={panelClass}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
        <DetailField
          label={t("purchase:supplier")}
          value={invoice.supplierName}
        />
        <DetailField
          label={t("purchase:invoice_number")}
          value={invoice.invoiceNumber}
        />
        <DetailField
          label={t("purchase:product_type")}
          value={productTypeLabel(invoice.productType)}
        />
        <DetailField label={t("purchase:date")} value={String(invoice.date).slice(0, 10)} />
        <DetailField
          label={t("purchase:expected_delivery")}
          value={invoice.expectedDelivery ? String(invoice.expectedDelivery).slice(0, 10) : "—"}
        />
        <DetailField
          label={t("purchase:warehouse")}
          value={invoice.warehouseName || "—"}
        />
        <DetailField
          label={t("purchase:receiver_name")}
          value={invoice.receiverName || "—"}
        />
        <DetailField
          label={t("purchase:subtotal")}
          value={`${formatAmount(sub)} ${invoice.currency || "SAR"}`}
        />
        <DetailField
          label={t("purchase:tax_amount")}
          value={`${formatAmount(taxAmt)} ${invoice.currency || "SAR"}`}
        />
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-1">
            {t("purchase:tax_recoverable_label")}
          </p>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
              invoice.taxRecoverable === false
                ? "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70 ring-1 ring-inset ring-slate-200 dark:ring-white/15"
                : "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 ring-1 ring-inset ring-teal-200 dark:ring-teal-500/25"
            }`}
          >
            {invoice.taxRecoverable === false
              ? t("purchase:tax_recoverable_no")
              : t("purchase:tax_recoverable_yes")}
          </span>
        </div>
        <DetailField
          label={t("purchase:total")}
          value={`${formatAmount(invoice.total)} ${invoice.currency || "SAR"}`}
        />
        <DetailField
          label={t("purchase:amount_paid")}
          value={`${formatAmount(invoice.paidAmount)} ${invoice.currency || "SAR"}`}
        />
        <DetailField
          label={t("purchase:balance_due")}
          value={`${formatAmount(invoice.balanceDue)} ${invoice.currency || "SAR"}`}
        />
        {(Number(invoice.debitedAmount) || 0) > 0 && (
          <DetailField
            label={t("purchase:debited_amount", { defaultValue: "Returned Amount" })}
            value={`${formatAmount(invoice.debitedAmount)} ${invoice.currency || "SAR"}`}
          />
        )}
        {(Number(invoice.refundDue) || 0) > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
              {t("purchase:refund_due", { defaultValue: "Refund due" })}
            </p>
            <p className="font-bold text-amber-700 dark:text-amber-300">
              {formatAmount(invoice.refundDue)} {invoice.currency || "SAR"}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-1">
            {t("purchase:status")}
          </p>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${purchaseStatusBadge[invoice.status] || purchaseStatusBadge.Draft}`}
          >
            {invoice.status || "—"}
          </span>
        </div>
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-1">
            {t("purchase:payment_status")}
          </p>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${paymentStatusBadge[invoice.paymentStatus] || paymentStatusBadge.Pending}`}
          >
            {invoice.paymentStatus === "Cleared" ? "Paid" : invoice.paymentStatus || "Pending"}
          </span>
        </div>
      </div>
      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/20">
        <table className="w-full text-sm min-w-[980px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-white/10 text-left">
              <th className="p-3 font-semibold w-12 text-center">
                {t("purchase:sr_no")}
              </th>
              <th className="p-3 font-semibold">{t("purchase:product")}</th>
              <th className="p-3 font-semibold">{t("purchase:qty")}</th>
              <th className="p-3 font-semibold whitespace-nowrap">{t("purchase:returned_qty", { defaultValue: "Returned" })}</th>
              <th className="p-3 font-semibold whitespace-nowrap">{t("purchase:net_qty", { defaultValue: "Net qty" })}</th>
              <th className="p-3 font-semibold">{t("purchase:price")}</th>
              <th className="p-3 font-semibold">{t("purchase:unit")}</th>
              <th className="p-3 font-semibold whitespace-nowrap">{t("purchase:expiry_date")}</th>
              <th className="p-3 font-semibold">{t("purchase:base_amount")}</th>
              <th className="p-3 font-semibold">{t("purchase:tax_percent")}</th>
              <th className="p-3 font-semibold">{t("purchase:tax_amount")}</th>
              <th className="p-3 font-semibold">{t("purchase:unit_cost")}</th>
              <th className="p-3 font-semibold">{t("purchase:subtotal")}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((line, idx) => {
              const base = lineTotal(line);
              const lineTaxAmount = line.taxAmount ?? 0;
              const lineTaxPercent = line.taxPercent ?? invoice.taxPercent ?? 0;
              const returnedQty = returnedQtyByVariant.get(line.variantId) || 0;
              const hasReturn = returnedQty > 0;
              return (
                <tr
                  key={line.id || idx}
                  className={`border-t border-slate-100 dark:border-white/10 ${hasReturn ? "bg-amber-50/60 dark:bg-amber-500/[0.06]" : ""}`}
                >
                  <td className="p-3 text-center tabular-nums text-slate-600 dark:text-white/70 font-medium">
                    {idx + 1}
                  </td>
                  <td className="p-3">{line.productName}</td>
                  <td className="p-3">{line.qty}</td>
                  <td className="p-3">
                    {hasReturn ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        -{returnedQty}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-white/30">—</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold">
                    {hasReturn ? (line.qty || 0) - returnedQty : line.qty}
                  </td>
                  <td className="p-3">{formatAmount(line.price)}</td>
                  <td className="p-3">{line.unit}</td>
                  <td className="p-3 text-slate-600 dark:text-white/80 text-xs whitespace-nowrap">
                    {line.expiryDate ? String(line.expiryDate).slice(0, 10) : "—"}
                  </td>
                  <td className="p-3 font-semibold">{formatAmount(base)}</td>
                  <td className="p-3">{lineTaxPercent}%</td>
                  <td className="p-3">{formatAmount(lineTaxAmount)}</td>
                  <td className="p-3">{formatAmount(line.unitCost)}</td>
                  <td className="p-3 font-semibold">
                    {formatAmount(base + lineTaxAmount)} {invoice.currency || "SAR"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceDetailsTab;
