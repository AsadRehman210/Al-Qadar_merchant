import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { lineTotal } from "../saleInvoiceHelpers";

// A line's own tax rate if it's carrying an override, otherwise the shared
// quote-level rate — mirrors the Add Quotation form / backend exactly.
const effectiveLineTaxPercent = (line, invoiceTaxPercent) =>
  line?.taxPercent !== undefined && line?.taxPercent !== null ? line.taxPercent : (Number(invoiceTaxPercent) || 0);

const QuotationPreviewContent = forwardRef(function QuotationPreviewContent(
  { quote },
  ref,
) {
  const { t } = useTranslation();
  const formatAmount = (v) => (parseFloat(v) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (!quote) return null;

  const lines = quote.lines || [];
  const sub = quote.subtotal ?? lines.reduce((s, l) => s + lineTotal(l), 0);
  const taxAmt = quote.taxAmount ?? sub * ((Number(quote.taxPercent) || 0) / 100);
  const total = quote.total ?? sub + taxAmt;

  return (
    <div
      ref={ref}
      className="quotation-print w-[210mm] max-w-full mx-auto bg-white text-slate-800 font-sans text-[11px] shadow-sm"
    >
      <div className="border border-violet-200 rounded-xl overflow-hidden ring-1 ring-violet-100">
        <div className="relative bg-gradient-to-r from-violet-800 via-purple-700 to-fuchsia-600 px-5 py-4 flex justify-between items-start text-white overflow-hidden">
          <div className="absolute -right-6 -top-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute right-16 -bottom-10 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center font-bold text-sm">
                R
              </div>
              <span className="text-lg font-semibold tracking-tight">Rafeeqi</span>
            </div>
            <p className="text-[10px] text-white/90 max-w-[200px] leading-relaxed">
              {t("salary:company_address")}
            </p>
          </div>
          <div className="relative text-right">
            <h1 className="text-lg font-bold uppercase tracking-[0.15em]">
              {t("sales:quotation_title")}
            </h1>
            <p className="text-[11px] text-white/95 mt-1 font-mono">
              {quote.quoteNumber}
            </p>
            <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-[9px] font-semibold bg-white/20 backdrop-blur uppercase tracking-wide">
              {t("sales:valid_until")}: {quote.validUntil || "—"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-violet-50/60 border-b border-violet-100">
          <div>
            <p className="text-[9px] font-bold text-violet-700 uppercase mb-1 tracking-wide">
              {t("sales:bill_to")}
            </p>
            <p className="text-[11px] font-semibold text-slate-900">
              {quote.customerName || "—"}
            </p>
          </div>
          <div className="text-right sm:text-left sm:ml-auto">
            <p className="text-[10px] text-slate-600">
              <span className="font-semibold text-slate-800">{t("sales:date")}: </span>
              {quote.date || "—"}
            </p>
          </div>
        </div>

        <div className="p-4">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-violet-100/70 border-b border-violet-200">
                <th className="text-left py-2 px-2 font-semibold text-violet-900">
                  {t("sales:product")}
                </th>
                <th className="text-right py-2 px-2 font-semibold text-violet-900 w-12">
                  {t("sales:qty")}
                </th>
                <th className="text-right py-2 px-2 font-semibold text-violet-900 w-14">
                  {t("sales:price")}
                </th>
                <th className="text-center py-2 px-2 font-semibold text-violet-900 w-12">
                  {t("sales:unit")}
                </th>
                <th className="text-right py-2 px-2 font-semibold text-violet-900 w-14">
                  {t("sales:tax_percent")}
                </th>
                <th className="text-right py-2 px-2 font-semibold text-violet-900 w-16">
                  {t("sales:tax_amount")}
                </th>
                <th className="text-right py-2 px-2 font-semibold text-violet-900 w-16">
                  {t("sales:line_total")}
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={line.id || idx} className="border-b border-violet-50">
                  <td className="py-2 px-2 text-slate-800">{line.productName || "—"}</td>
                  <td className="py-2 px-2 text-right">{line.qty}</td>
                  <td className="py-2 px-2 text-right">{formatAmount(line.price)}</td>
                  <td className="py-2 px-2 text-center">{line.unit}</td>
                  <td className="py-2 px-2 text-right">{effectiveLineTaxPercent(line, quote.taxPercent)}%</td>
                  <td className="py-2 px-2 text-right">{formatAmount(line.taxAmount)}</td>
                  <td className="py-2 px-2 text-right font-medium">
                    {formatAmount(lineTotal(line))} {quote.currency || "SAR"}
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
                  {formatAmount(sub)} {quote.currency || "SAR"}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>
                  {t("sales:tax_percent")} ({quote.taxPercent ?? 0}%)
                </span>
                <span>
                  {formatAmount(taxAmt)} {quote.currency || "SAR"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-dashed border-violet-300 bg-violet-100/70 -mx-2 px-2 py-2 rounded-lg">
                <span className="font-bold text-violet-900">{t("sales:total")}</span>
                <span className="font-bold text-base text-violet-800">
                  {formatAmount(total)} {quote.currency || "SAR"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="px-4 pb-4 text-[10px] border-t border-violet-100 pt-3 bg-white">
            <p className="font-semibold text-slate-800 mb-0.5">{t("sales:notes")}</p>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {quote.notes}
            </p>
          </div>
        )}

        <div className="px-4 py-3 bg-violet-50/60 border-t border-violet-100 text-center text-[9px] text-violet-700 italic">
          {t("sales:quotation_disclaimer")}
        </div>
      </div>
    </div>
  );
});

export default QuotationPreviewContent;
