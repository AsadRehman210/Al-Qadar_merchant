import { useTranslation } from "react-i18next";
import { lineTotal, lineProfit, computeInvoiceProfit } from "global/helper";
import { salePaymentStatusBadge, saleDeliveryStatusBadge } from "global/constant";
import DetailField from "./DetailField";
import Table from "components/Table";

const InvoiceDetailsTab = ({
  invoice,
  panelClass,
  sub,
  taxAmt,
}) => {
  const { t } = useTranslation();

  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  const lines = invoice.products || [];
  // "Different per product" mode leaves a real (non-null) taxPercent
  // override on at least one line — same detection rule the add/edit form
  // uses to reconstruct its own tax-mode toggle from saved data.
  const hasDifferentTax = lines.some((l) => l.taxPercent !== null && l.taxPercent !== undefined);

  // Only Applied credit notes have actually reversed anything — Draft/
  // Approved ones are still just proposals and shouldn't shrink what this
  // table (or the profit figure below) shows as sold.
  const appliedReturns = (invoice.returnedItems || []).filter((r) => r.cnStatus === "Applied");
  const returnedQtyByVariant = new Map();
  for (const r of appliedReturns) {
    returnedQtyByVariant.set(r.variantId, (returnedQtyByVariant.get(r.variantId) || 0) + (r.qty || 0));
  }
  const returnedProfitImpact = appliedReturns.reduce((sum, r) => sum + r.qty * ((r.price || 0) - (r.costPrice || 0)), 0);
  const grossProfit = computeInvoiceProfit(invoice.products);
  const netProfit = grossProfit - returnedProfitImpact;

  return (
    <div className={panelClass}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
        <DetailField
          label={t("sales:customer")}
          value={invoice.customerName}
        />
        <DetailField
          label={t("sales:invoice_number")}
          value={invoice.invoiceNumber}
        />
        <DetailField label={t("sales:date")} value={invoice.date ? String(invoice.date).slice(0, 10) : null} />
        <DetailField label={t("sales:warehouse")} value={invoice.warehouseName || "—"} />
        <DetailField label={t("sales:receiver_name")} value={invoice.receiverName || "—"} />
        <DetailField
          label={t("sales:subtotal")}
          value={`${formatAmount(sub)} ${invoice.currency || "SAR"}`}
        />
        <DetailField
          label={t("sales:tax_percent")}
          value={`${invoice.taxPercent ?? 0}%`}
        />
        <DetailField
          label={t("sales:tax_amount")}
          value={`${formatAmount(taxAmt)} ${invoice.currency || "SAR"}`}
        />
        <DetailField
          label={t("sales:total")}
          value={`${formatAmount(invoice.total)} ${invoice.currency || "SAR"}`}
        />
        <DetailField
          label={t("sales:amount_paid")}
          value={`${formatAmount(invoice.paidAmount)} ${invoice.currency || "SAR"}`}
        />
        <DetailField
          label={t("sales:balance_due")}
          value={`${formatAmount(invoice.balanceDue)} ${invoice.currency || "SAR"}`}
        />
        {(Number(invoice.creditedAmount) || 0) > 0 && (
          <DetailField
            label={t("sales:credited_amount", { defaultValue: "Returned Amount" })}
            value={`${formatAmount(invoice.creditedAmount)} ${invoice.currency || "SAR"}`}
          />
        )}
        {(Number(invoice.refundDue) || 0) > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
              {t("sales:refund_due", { defaultValue: "Refund due" })}
            </p>
            <p className="font-bold text-amber-700 dark:text-amber-300">
              {formatAmount(invoice.refundDue)} {invoice.currency || "SAR"}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-1">
            {t("sales:profit")}
          </p>
          <p className={`font-semibold ${netProfit >= 0 ? "text-slate-900 dark:text-white/95" : "text-rose-600 dark:text-rose-400"}`}>
            {formatAmount(netProfit)} {invoice.currency || "SAR"}
          </p>
          {returnedProfitImpact !== 0 && (
            <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">
              {t("sales:profit_before_returns", { defaultValue: "Before returns" })}: {formatAmount(grossProfit)} {invoice.currency || "SAR"}
            </p>
          )}
        </div>
        <DetailField
          label={t("sales:shipping_address")}
          value={invoice.shippingAddress}
        />
        <DetailField
          label={t("sales:delivery_date")}
          value={invoice.deliveryDate ? String(invoice.deliveryDate).slice(0, 10) : null}
        />
        <DetailField
          label={t("sales:reverse_charge")}
          value={invoice.reverseCharge ? t("yes") : t("sales:no")}
        />
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-1">
            {t("sales:payment_status")}
          </p>
          {invoice.paymentStatus ? (
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                salePaymentStatusBadge[invoice.paymentStatus] || salePaymentStatusBadge.Pending
              }`}
            >
              {invoice.paymentStatus}
            </span>
          ) : (
            <p className="text-slate-900 dark:text-white/95">—</p>
          )}
        </div>
        <DetailField
          label={t("sales:tracking_number")}
          value={invoice.trackingNumber}
        />
        <DetailField
          label={t("sales:transporter_name")}
          value={invoice.transporterName}
        />
        <div>
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wide mb-1">
            {t("sales:delivery_status")}
          </p>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
              saleDeliveryStatusBadge[invoice.deliveryStatus] || saleDeliveryStatusBadge.Pending
            }`}
          >
            {invoice.deliveryStatus || "Pending"}
          </span>
        </div>
      </div>
      <Table className="mt-8">
        <table className="w-full text-sm min-w-[1080px]">
          <thead>
            <tr className="bg-[var(--color-teal-500)] text-left text-white/95 border-none">
              <th className="p-3 font-semibold w-12 text-center">
                {t("sales:sr_no")}
              </th>
              <th className="p-3 font-semibold">{t("sales:product")}</th>
              <th className="p-3 font-semibold">{t("sales:qty")}</th>
              <th className="p-3 font-semibold whitespace-nowrap">{t("sales:returned_qty", { defaultValue: "Returned" })}</th>
              <th className="p-3 font-semibold whitespace-nowrap">{t("sales:net_qty", { defaultValue: "Net qty" })}</th>
              <th className="p-3 font-semibold">{t("sales:price")}</th>
              <th className="p-3 font-semibold">{t("sales:cost")}</th>
              <th className="p-3 font-semibold">{t("sales:unit")}</th>
              <th className="p-3 font-semibold whitespace-nowrap">{t("sales:expiry_date", { defaultValue: "Expiry date" })}</th>
              <th className="p-3 font-semibold">{t("sales:base_amount")}</th>
              {hasDifferentTax && (
                <th className="p-3 font-semibold">{t("sales:tax_percent")}</th>
              )}
              <th className="p-3 font-semibold">{t("sales:tax_amount")}</th>
              <th className="p-3 font-semibold">{t("sales:subtotal")}</th>
              <th className="p-3 font-semibold">{t("sales:profit")}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => {
              const profit = lineProfit(line);
              const base = lineTotal(line);
              const lineTaxAmount = line.taxAmount ?? 0;
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
                  <td className="p-3 text-slate-500 dark:text-white/60">{formatAmount(line.costPrice)}</td>
                  <td className="p-3">{line.unit}</td>
                  <td className="p-3 text-slate-600 dark:text-white/80 text-xs whitespace-nowrap">
                    {line.expiryDate ? String(line.expiryDate).slice(0, 10) : "—"}
                  </td>
                  <td className="p-3 font-semibold">{formatAmount(base)}</td>
                  {hasDifferentTax && (
                    <td className="p-3">
                      {line.taxPercent !== null && line.taxPercent !== undefined ? `${line.taxPercent}%` : "—"}
                    </td>
                  )}
                  <td className="p-3">{formatAmount(lineTaxAmount)}</td>
                  <td className="p-3 font-semibold">
                    {formatAmount(base + lineTaxAmount)} {invoice.currency || "SAR"}
                  </td>
                  <td className={`p-3 font-semibold ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {formatAmount(profit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Table>
    </div>
  );
};

export default InvoiceDetailsTab;
