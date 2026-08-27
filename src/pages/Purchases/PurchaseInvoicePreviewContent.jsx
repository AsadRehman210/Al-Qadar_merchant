import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { lineTotal } from "./purchaseInvoiceHelpers";

const PurchaseInvoicePreviewContent = forwardRef(
  function PurchaseInvoicePreviewContent({ invoice }, ref) {
    const { t } = useTranslation();
    const formatAmount = (v) =>
      (parseFloat(v) || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    if (!invoice) return null;

    const lines = invoice.products || [];
    const currency = invoice.currency || "SAR";

    const productTypeLabel = (type) => {
      if (type === "final_product") return t("purchase:final_product");
      return t("purchase:raw_material");
    };

    const paymentLabel =
      invoice.paymentStatus === "Cleared"
        ? "Paid"
        : invoice.paymentStatus || "Pending";

    const sub = invoice.subtotal ?? lines.reduce((s, l) => s + lineTotal(l), 0);
    const taxAmt = invoice.taxAmount ?? 0;
    const total = invoice.total ?? sub;
    const paid = invoice.paidAmount ?? 0;
    const balance = invoice.balanceDue ?? Math.max(0, total - paid);

    return (
      <div
        ref={ref}
        className="purchase-invoice-print w-[210mm] max-w-full mx-auto bg-white text-slate-800 font-sans text-[11px]"
      >
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(15,23,42,0.08)]">
          <div className="relative bg-gradient-to-br from-slate-800 via-teal-700 to-teal-500 px-6 py-5 text-white overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute -right-2 bottom-0 w-24 h-24 rounded-full bg-white/5" />
            <div className="relative flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center font-bold text-base ring-1 ring-white/20">
                    R
                  </div>
                  <div>
                    <span className="text-xl font-bold tracking-tight block leading-none">
                      Rafeeqi
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/70 mt-1 block">
                      {t("purchase:purchase_invoice")}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-white/85 max-w-[220px] leading-relaxed">
                  {t("salary:company_address")}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-block px-3 py-1 rounded-lg bg-white/15 ring-1 ring-white/20 mb-2">
                  <p className="text-[9px] uppercase tracking-wider text-white/80">
                    {t("purchase:invoice_number")}
                  </p>
                  <p className="text-sm font-bold font-mono tracking-wide">
                    {invoice.invoiceNumber}
                  </p>
                </div>
                <p className="text-[10px] text-white/90">
                  <span className="text-white/70">{t("purchase:date")}: </span>
                  {invoice.date ? String(invoice.date).slice(0, 10) : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50/90 border-b border-slate-200">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-[9px] font-bold text-teal-700 uppercase tracking-wider mb-2">
                {t("purchase:supplier_section")}
              </p>
              <p className="text-[12px] font-semibold text-slate-900">
                {invoice.supplierName || "—"}
              </p>
              <div className="mt-2 space-y-1 text-[10px] text-slate-600">
                <p>
                  <span className="font-medium text-slate-700">
                    {t("purchase:product_type")}:{" "}
                  </span>
                  {productTypeLabel(invoice.productType)}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-[9px] font-bold text-teal-700 uppercase tracking-wider mb-2">
                {t("purchase:invoice_summary_header")}
              </p>
              <div className="space-y-1 text-[10px] text-slate-600">
                <p>
                  <span className="font-medium text-slate-700">
                    {t("purchase:status")}:{" "}
                  </span>
                  {invoice.status || "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-700">
                    {t("purchase:payment_status")}:{" "}
                  </span>
                  {paymentLabel}
                </p>
                <p>
                  <span className="font-medium text-slate-700">
                    {t("purchase:payment_type")}:{" "}
                  </span>
                  {invoice.paymentType || "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-700">
                    {t("purchase:payment_method")}:{" "}
                  </span>
                  {invoice.paymentMethod || "—"}
                </p>
              </div>
            </div>
          </div>

          {(invoice.warehouseName ||
            invoice.expectedDelivery ||
            invoice.receiverName) && (
            <div className="grid grid-cols-3 gap-3 px-4 py-3 border-b border-slate-200 bg-white text-[10px]">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                  {t("purchase:warehouse")}
                </p>
                <p className="font-medium text-slate-800">
                  {invoice.warehouseName || "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                  {t("purchase:expected_delivery")}
                </p>
                <p className="font-medium text-slate-800">
                  {invoice.expectedDelivery
                    ? String(invoice.expectedDelivery).slice(0, 10)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                  {t("purchase:receiver_name")}
                </p>
                <p className="font-medium text-slate-800">
                  {invoice.receiverName || "—"}
                </p>
              </div>
            </div>
          )}

          <div className="p-4">
            <table className="w-full text-[10px] border-collapse overflow-hidden rounded-lg">
              <thead>
                <tr className="bg-gradient-to-r from-teal-600 to-teal-500 text-white">
                  <th className="text-left py-2.5 px-3 font-semibold rounded-tl-lg">
                    {t("purchase:product")}
                  </th>
                  <th className="text-right py-2.5 px-2 font-semibold w-12">
                    {t("purchase:qty")}
                  </th>
                  <th className="text-right py-2.5 px-2 font-semibold w-16">
                    {t("purchase:price_per_unit")}
                  </th>
                  <th className="text-center py-2.5 px-2 font-semibold w-12">
                    {t("purchase:unit")}
                  </th>
                  <th className="text-right py-2.5 px-2 font-semibold w-14">
                    {t("purchase:tax_percent")}
                  </th>
                  <th className="text-right py-2.5 px-2 font-semibold w-16">
                    {t("purchase:tax_amount")}
                  </th>
                  <th className="text-right py-2.5 px-3 font-semibold w-20 rounded-tr-lg">
                    {t("purchase:line_total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => {
                  const base = lineTotal(line);
                  const linePct = line.taxPercent ?? invoice.taxPercent ?? 0;
                  const lineTaxAmt = line.taxAmount ?? (base * linePct) / 100;
                  return (
                    <tr
                      key={line.id || idx}
                      className={`border-b border-slate-100 ${
                        idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-slate-800 font-medium">
                        {line.productName || "—"}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-700">
                        {line.qty}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-700">
                        {formatAmount(line.price)}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-600">
                        {line.unit}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-600">
                        {linePct}%
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-600">
                        {formatAmount(lineTaxAmt)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        {formatAmount(base + lineTaxAmt)} {currency}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-5 flex justify-end">
              <div className="w-full max-w-[280px] rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 space-y-2 text-[10px] bg-white">
                  <div className="flex justify-between text-slate-600">
                    <span>{t("purchase:subtotal")}</span>
                    <span className="font-medium text-slate-900">
                      {formatAmount(sub)} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t("purchase:tax_amount")}</span>
                    <span className="font-medium text-slate-900">
                      {formatAmount(taxAmt)} {currency}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white">
                  <span className="font-bold text-[11px] uppercase tracking-wide">
                    {t("purchase:total")}
                  </span>
                  <span className="font-bold text-lg">
                    {formatAmount(total)} {currency}
                  </span>
                </div>
                <div className="px-4 py-3 space-y-1.5 text-[10px] bg-slate-50 border-t border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>{t("purchase:amount_paid")}</span>
                    <span className="font-medium text-emerald-700">
                      {formatAmount(paid)} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">
                      {t("purchase:balance_due")}
                    </span>
                    <span
                      className={`font-bold ${
                        balance > 0 ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {formatAmount(balance)} {currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center text-[9px] text-slate-500">
            <p className="italic">{t("purchase:thank_you")}</p>
          </div>
        </div>
      </div>
    );
  },
);

export default PurchaseInvoicePreviewContent;
