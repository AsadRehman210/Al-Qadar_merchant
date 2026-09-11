import { forwardRef } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { lineTotal, tenantLetterhead } from "global/helper";
import { showUserData } from "store/slices/uniqueSlice";

const InvoicePreviewContent = forwardRef(function InvoicePreviewContent(
  { invoice },
  ref,
) {
  const { t } = useTranslation();
  const letter = tenantLetterhead(useSelector(showUserData));
  const formatAmount = (v) => (parseFloat(v) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (!invoice) return null;

  const lines = invoice.products || [];
  const sub =
    invoice.subtotal ??
    lines.reduce((s, l) => s + lineTotal(l), 0);
  const total = invoice.total ?? sub;

  return (
    <div
      ref={ref}
      className="sale-invoice-print w-[210mm] max-w-full mx-auto bg-white text-slate-800 font-sans text-[11px] shadow-sm"
    >
      <div className="border border-slate-300 rounded-xl overflow-hidden ring-1 ring-slate-200/80">
        <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 px-5 py-4 flex justify-between items-start text-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center font-bold text-sm">
                {letter.initial}
              </div>
              <span className="text-lg font-semibold tracking-tight">{letter.companyName}</span>
            </div>
            <div className="text-[10px] text-white/90 max-w-[220px] leading-relaxed space-y-0.5">
              {letter.address ? <p>{letter.address}</p> : null}
              {letter.contact ? <p>{letter.contact}</p> : null}
              {letter.taxNumber ? <p>{letter.taxNumber}</p> : null}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-lg font-bold uppercase tracking-wider">
              {t("sales:sale_invoice")}
            </h1>
            <p className="text-[11px] text-white/95 mt-1 font-mono">
              {invoice.invoiceNumber}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/80 border-b border-slate-200">
          <div>
            <p className="text-[9px] font-bold text-teal-700 uppercase mb-1">
              {t("sales:bill_to")}
            </p>
            <p className="text-[11px] font-semibold text-slate-900">
              {invoice.customerName || "—"}
            </p>
          </div>
          <div className="text-right sm:text-left sm:ml-auto">
            <p className="text-[10px] text-slate-600">
              <span className="font-semibold text-slate-800">{t("sales:date")}: </span>
              {invoice.date || "—"}
            </p>
            <p className="text-[10px] text-slate-600 mt-1">
              <span className="font-semibold text-slate-800">
                {t("sales:payment_type")}:{" "}
              </span>
              {invoice.paymentType || "—"}
            </p>
            <p className="text-[10px] text-slate-600 mt-1">
              <span className="font-semibold text-slate-800">
                {t("sales:payment_method")}:{" "}
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
                  {t("sales:product")}
                </th>
                <th className="text-right py-2 px-2 font-semibold text-slate-800 w-12">
                  {t("sales:qty")}
                </th>
                <th className="text-right py-2 px-2 font-semibold text-slate-800 w-14">
                  {t("sales:price")}
                </th>
                <th className="text-center py-2 px-2 font-semibold text-slate-800 w-12">
                  {t("sales:unit")}
                </th>
                <th className="text-right py-2 px-2 font-semibold text-slate-800 w-16">
                  {t("sales:line_total")}
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={line.id || idx} className="border-b border-slate-100">
                  <td className="py-2 px-2 text-slate-800">{line.productName || "—"}</td>
                  <td className="py-2 px-2 text-right">{line.qty}</td>
                  <td className="py-2 px-2 text-right">{formatAmount(line.price)}</td>
                  <td className="py-2 px-2 text-center">{line.unit}</td>
                  <td className="py-2 px-2 text-right font-medium">
                    {formatAmount(lineTotal(line))} {invoice.currency || "SAR"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-[240px] space-y-1 text-[10px]">
              <div className="flex justify-between text-slate-600">
                <span>{t("sales:subtotal")}</span>
                <span className="font-medium text-slate-900">
                  {formatAmount(sub)} {invoice.currency || "SAR"}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  {t("sales:tax_percent")} ({invoice.taxPercent ?? 0}%)
                </span>
                <span>
                  {formatAmount(sub * ((Number(invoice.taxPercent) || 0) / 100))}{" "}
                  {invoice.currency || "SAR"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-teal-200 bg-teal-50/80 -mx-2 px-2 py-2 rounded-lg">
                <span className="font-bold text-teal-900">{t("sales:total")}</span>
                <span className="font-bold text-base text-teal-800">
                  {formatAmount(total)} {invoice.currency || "SAR"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] border-t border-slate-200 pt-3 bg-white">
          <div>
            <p className="font-semibold text-slate-800 mb-0.5">{t("sales:ship_to")}</p>
            <p className="text-slate-600 leading-relaxed">
              {invoice.shippingAddress || "—"}
            </p>
          </div>
          <div className="space-y-1 text-slate-600">
            <p>
              <span className="font-semibold text-slate-800">
                {t("sales:delivery_date")}:{" "}
              </span>
              {invoice.deliveryDate || "—"}
            </p>
            <p>
              <span className="font-semibold text-slate-800">
                {t("sales:eway_bill")}:{" "}
              </span>
              {invoice.eWayBillNumber || "—"}
            </p>
            <p>
              <span className="font-semibold text-slate-800">
                {t("sales:tracking_number")}:{" "}
              </span>
              {invoice.trackingNumber || "—"}
            </p>
          </div>
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center text-[9px] text-slate-500 italic">
          {t("sales:thank_you")}
        </div>
      </div>
    </div>
  );
});

export default InvoicePreviewContent;
