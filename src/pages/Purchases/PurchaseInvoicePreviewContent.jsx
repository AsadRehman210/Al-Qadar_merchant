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

    const productTypeLabel = (type) => {
      if (type === "final_product") return t("purchase:final_product");
      return t("purchase:raw_material");
    };
    const sub = invoice.subtotal ?? lines.reduce((s, l) => s + lineTotal(l), 0);
    const total = invoice.total ?? sub;

    return (
      <div
        ref={ref}
        className="purchase-invoice-print w-[210mm] max-w-full mx-auto bg-white text-slate-800 font-sans text-[11px] shadow-sm"
      >
        <div className="border border-slate-300 rounded-xl overflow-hidden ring-1 ring-slate-200/80">
          <div className="bg-gradient-to-r from-slate-700 via-teal-600 to-teal-500 px-5 py-4 flex justify-between items-start text-white">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center font-bold text-sm">
                  R
                </div>
                <span className="text-lg font-semibold tracking-tight">
                  Rafeeqi
                </span>
              </div>
              <p className="text-[10px] text-white/90 max-w-[200px] leading-relaxed">
                {t("salary:company_address")}
              </p>
            </div>
            <div className="text-right">
              <h1 className="text-lg font-bold uppercase tracking-wider">
                {t("purchase:purchase_invoice")}
              </h1>
              <p className="text-[11px] text-white/95 mt-1 font-mono">
                {invoice.invoiceNumber}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/80 border-b border-slate-200">
            <div>
              <p className="text-[9px] font-bold text-teal-700 uppercase mb-1">
                {t("purchase:supplier_section")}
              </p>
              <p className="text-[11px] font-semibold text-slate-900">
                {invoice.supplierName || "—"}
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                {t("purchase:grn_number")}: {invoice.grnNumber || "—"}
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                {t("purchase:product_type")}: {productTypeLabel(invoice.productType)}
              </p>
            </div>
            <div className="text-right sm:text-left sm:ml-auto space-y-1">
              <p className="text-[10px] text-slate-600">
                <span className="font-semibold text-slate-800">
                  {t("purchase:date")}:{" "}
                </span>
                {invoice.date || "—"}
              </p>
              <p className="text-[10px] text-slate-600">
                <span className="font-semibold text-slate-800">
                  {t("purchase:payment_status")}:{" "}
                </span>
                {invoice.paymentStatus === "Cleared" ? "Paid" : invoice.paymentStatus || "Pending"}
              </p>
              <p className="text-[10px] text-slate-600">
                <span className="font-semibold text-slate-800">
                  {t("purchase:payment_type")}:{" "}
                </span>
                {invoice.paymentType || "—"}
              </p>
              <p className="text-[10px] text-slate-600">
                <span className="font-semibold text-slate-800">
                  {t("purchase:payment_method")}:{" "}
                </span>
                {invoice.paymentMethod || "—"}
              </p>
            </div>
          </div>

          <div className="p-4">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="text-left py-2 px-2 font-semibold text-slate-800">
                    {t("purchase:product")}
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-800 w-12">
                    {t("purchase:qty")}
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-800 w-14">
                    {t("purchase:price")}
                  </th>
                  <th className="text-center py-2 px-2 font-semibold text-slate-800 w-12">
                    {t("purchase:unit")}
                  </th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-800 w-16">
                    {t("purchase:line_total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr
                    key={line.id || idx}
                    className="border-b border-slate-100"
                  >
                    <td className="py-2 px-2 text-slate-800">
                      {line.productName || "—"}
                    </td>
                    <td className="py-2 px-2 text-right">{line.qty}</td>
                    <td className="py-2 px-2 text-right">
                      {formatAmount(line.price)}
                    </td>
                    <td className="py-2 px-2 text-center">{line.unit}</td>
                    <td className="py-2 px-2 text-right font-medium">
                      {formatAmount(lineTotal(line))}{" "}
                      {invoice.currency || "SAR"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-[240px] space-y-1 text-[10px]">
                <div className="flex justify-between text-slate-600">
                  <span>{t("purchase:subtotal")}</span>
                  <span className="font-medium text-slate-900">
                    {formatAmount(sub)} {invoice.currency || "SAR"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t("purchase:tax_percent")} ({invoice.taxPercent ?? 0}%)</span>
                  <span className="font-medium text-slate-900">
                    {formatAmount(invoice.taxAmount)} {invoice.currency || "SAR"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-teal-200 bg-teal-50/80 -mx-2 px-2 py-2 rounded-lg">
                  <span className="font-bold text-teal-900">
                    {t("purchase:total")}
                  </span>
                  <span className="font-bold text-base text-teal-800">
                    {formatAmount(total)} {invoice.currency || "SAR"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-600 flex flex-wrap justify-between gap-2">
            <span>
              <span className="font-semibold text-slate-800">
                {t("purchase:status")}:{" "}
              </span>
              {invoice.status || "—"}
            </span>
            <span>
              <span className="font-semibold text-slate-800">
                {t("purchase:payment_status")}:{" "}
              </span>
              {invoice.paymentStatus === "Cleared" ? "Paid" : invoice.paymentStatus || "—"}
            </span>
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center text-[9px] text-slate-500 italic">
            {t("purchase:thank_you")}
          </div>
        </div>
      </div>
    );
  },
);

export default PurchaseInvoicePreviewContent;
