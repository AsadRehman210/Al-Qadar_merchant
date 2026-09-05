import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { FiPlus } from "react-icons/fi";
import Button from "components/Button";
import Table from "components/Table";
import SelectDropdown from "components/SelectDropdown";
import FormInput from "components/FormInput";
import { noteStatusBadge as CN_STATUS_BADGE, salesPaymentMethodOptions } from "global/constant";
import { formatAmount } from "global/helper";

const ReturnsTab = ({ invoice, panelClass, onRefresh, onAddRefund }) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [selMethod, setSelMethod] = useState(salesPaymentMethodOptions[1]);
  const [reference, setReference] = useState("");
  const refundDue = Number(invoice.refundDue) || 0;
  const returnedItems = invoice.returnedItems || [];
  const returnTotals = returnedItems.reduce(
    (acc, r) => {
      const subtotal = Number(r.subtotal) || (Number(r.qty) || 0) * (Number(r.price) || 0);
      const taxAmount = Number(r.taxAmount) || 0;
      acc.subtotal += subtotal;
      acc.taxAmount += taxAmount;
      acc.total += Number(r.lineTotal) || subtotal + taxAmount;
      return acc;
    },
    { subtotal: 0, taxAmount: 0, total: 0 }
  );

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error(t("sales:payment_amount_required"));
      return;
    }
    try {
      await onAddRefund({ date, amount: Number(amount), method: selMethod.id, reference });
      toast.success(t("sales:refund_recorded", { defaultValue: "Refund recorded." }));
      setDate(new Date().toISOString().slice(0, 10));
      setAmount("");
      setReference("");
      setShowForm(false);
      onRefresh?.();
    } catch (err) {
      toast.error(err?.message || err || "");
    }
  };

  return (
    <div className="space-y-6">
      <div className={panelClass}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {t("sales:returned_items")}
        </h3>
        <Table>
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-[var(--color-teal-500)] text-left text-white/95 border-none">
                <th className="p-3 font-semibold">{t("sales:product")}</th>
                <th className="p-3 font-semibold">{t("sales:qty")}</th>
                <th className="p-3 font-semibold">{t("sales:price")}</th>
                <th className="p-3 font-semibold">{t("sales:unit")}</th>
                <th className="p-3 font-semibold">{t("sales:subtotal")}</th>
                <th className="p-3 font-semibold">{t("sales:tax_percent")}</th>
                <th className="p-3 font-semibold">{t("sales:tax_amount")}</th>
                <th className="p-3 font-semibold">{t("sales:total")}</th>
                <th className="p-3 font-semibold">{t("sales:credit_note")}</th>
                <th className="p-3 font-semibold">{t("sales:status")}</th>
                <th className="p-3 font-semibold">{t("sales:reason")}</th>
                <th className="p-3 font-semibold">{t("sales:date")}</th>
              </tr>
            </thead>
            <tbody>
              {returnedItems.map((r, idx) => {
                const subtotal = r.subtotal ?? (Number(r.qty) || 0) * (Number(r.price) || 0);
                const taxAmount = Number(r.taxAmount) || 0;
                const total = r.lineTotal ?? subtotal + taxAmount;
                return (
                  <tr key={`${r.cnId}-${idx}`} className="border-t border-slate-100 dark:border-white/10">
                    <td className="p-3">{r.productName}</td>
                    <td className="p-3 tabular-nums">{r.qty}</td>
                    <td className="p-3 tabular-nums">{formatAmount(r.price)}</td>
                    <td className="p-3">{r.unit || "—"}</td>
                    <td className="p-3 tabular-nums">{formatAmount(subtotal)}</td>
                    <td className="p-3 tabular-nums">{r.taxPercent != null ? `${r.taxPercent}%` : "—"}</td>
                    <td className="p-3 tabular-nums">{formatAmount(taxAmount)}</td>
                    <td className="p-3 tabular-nums font-medium">{formatAmount(total)}</td>
                    <td className="p-3">
                      <Link to={`/credit-notes/detail/${r.cnId}`} className="font-mono text-teal-600 hover:underline">
                        {r.cnNumber}
                      </Link>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CN_STATUS_BADGE[r.cnStatus] || ""}`}>{r.cnStatus}</span>
                    </td>
                    <td className="p-3 text-xs text-slate-500">{r.reason}</td>
                    <td className="p-3 text-xs text-slate-500">{r.date ? String(r.date).slice(0, 10) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Table>
        {returnedItems.length > 0 && (
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-slate-900/40 dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]">
              <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 px-5 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90">
                  {t("sales:return_summary")}
                </p>
              </div>
              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/10">
                  <div className="px-4 py-3 text-center">
                    <p className="mb-1 text-xs font-medium text-slate-500 dark:text-white/55">
                      {t("sales:subtotal")}
                    </p>
                    <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-white">
                      {formatAmount(returnTotals.subtotal)} {invoice.currency || "SAR"}
                    </p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <p className="mb-1 text-xs font-medium text-slate-500 dark:text-white/55">
                      {t("sales:tax_amount")}
                    </p>
                    <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-white">
                      {formatAmount(returnTotals.taxAmount)} {invoice.currency || "SAR"}
                    </p>
                  </div>
                  <div className="px-4 py-3 text-center bg-rose-50/70 dark:bg-rose-500/10 rounded-lg">
                    <p className="mb-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
                      {t("sales:total")}
                    </p>
                    <p className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400">
                      {formatAmount(returnTotals.total)} {invoice.currency || "SAR"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {returnedItems.length === 0 && (
          <p className="text-slate-500 dark:text-white/60 text-sm mt-2">
            {t("sales:no_returns", { defaultValue: "No items returned against this invoice." })}
          </p>
        )}
      </div>

      <div className={panelClass}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: t("sales:credited_amount", { defaultValue: "Returned Amount" }), value: invoice.creditedAmount, color: "border-slate-200 bg-white dark:bg-white/10 dark:border-white/20" },
            { label: t("sales:refunded_amount", { defaultValue: "Refunded so far" }), value: invoice.refundedAmount, color: "border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10" },
            { label: t("sales:refund_due", { defaultValue: "Refund due" }), value: invoice.refundDue, color: refundDue > 0 ? "border-rose-400 bg-rose-50 dark:bg-rose-500/10" : "border-slate-200 bg-white dark:bg-white/10 dark:border-white/20" },
          ].map((c) => (
            <div key={c.label} className={`p-4 rounded-2xl border ${c.color}`}>
              <p className="text-xs text-slate-500">{c.label}</p>
              <p className="font-bold text-lg text-slate-900 dark:text-white mt-0.5">{formatAmount(c.value)} {invoice.currency || "SAR"}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("sales:refund_history", { defaultValue: "Refund history" })}
          </h3>
          {refundDue > 0 && (
            <Button
              type="button"
              title={t("sales:record_refund", { defaultValue: "Record refund" })}
              icon={FiPlus}
              onClick={() => setShowForm((s) => !s)}
              className="!w-auto !rounded-md !h-9 !px-3 !border border-rose-400/40 !text-rose-700 dark:!text-rose-300 !bg-rose-50 dark:!bg-rose-500/10"
            />
          )}
        </div>

        {showForm && (
          <div className="mb-5 p-4 pb-8 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/5 flex flex-wrap items-end gap-3">
            <div>
              <FormInput
                label={t("sales:payment_date")}
                labelClass="!text-xs"
                name="refundDate"
                type="date"
                value={date}
                onValueChange={setDate}
                inputClass="!h-9 !rounded-md"
              />
            </div>
            <div className="relative w-32">
              <FormInput
                label={t("amount")}
                labelClass="!text-xs"
                name="refundAmount"
                type="number"
                min={0}
                max={refundDue}
                decimal
                decimalPlaces={3}
                value={amount}
                onValueChange={setAmount}
                inputClass="!h-9 !rounded-md"
              />
              <p className="absolute left-0 top-full mt-0.5 text-[11px] text-slate-400 whitespace-nowrap">
                {t("sales:max_refund_hint", { defaultValue: "Max" })}: {formatAmount(refundDue)} {invoice.currency || "SAR"}
              </p>
            </div>
            <div className="w-44">
              <SelectDropdown
                label={t("sales:payment_method")}
                labelClass="!text-xs"
                data={salesPaymentMethodOptions}
                selected={selMethod}
                setSelected={(o) => setSelMethod(o || salesPaymentMethodOptions[1])}
                valueKey="id"
                hideClear
                classes="!h-9 !rounded-md"
              />
            </div>
            <div>
              <FormInput
                label={t("sales:reference")}
                labelClass="!text-xs"
                name="refundReference"
                value={reference}
                onValueChange={setReference}
                inputClass="!h-9 !rounded-md"
              />
            </div>
            <button type="button" onClick={handleSave} className="h-9 px-4 rounded-md bg-rose-500 text-white text-sm font-semibold">
              {t("save")}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 rounded-md bg-slate-200 dark:bg-white/20 text-slate-600 dark:text-white text-sm">
              {t("cancel")}
            </button>
          </div>
        )}

        <Table>
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-[var(--color-teal-500)] text-left text-white/95 border-none">
                <th className="p-3 font-semibold">{t("sales:date")}</th>
                <th className="p-3 font-semibold">{t("amount")}</th>
                <th className="p-3 font-semibold">{t("sales:payment_method")}</th>
                <th className="p-3 font-semibold">{t("sales:reference")}</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.refundHistory || []).map((p, idx) => (
                <tr key={p.id || `${p.reference || "refund"}-${idx}`} className="border-t border-slate-100 dark:border-white/10">
                  <td className="p-3">{p.date ? String(p.date).slice(0, 10) : "-"}</td>
                  <td className="p-3 font-medium">{p.amount != null ? `${formatAmount(p.amount)} ${invoice.currency || "SAR"}` : "-"}</td>
                  <td className="p-3">{p.method || "-"}</td>
                  <td className="p-3 font-mono text-xs">{p.reference || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Table>
        {(!invoice.refundHistory || invoice.refundHistory.length === 0) && (
          <p className="text-slate-500 dark:text-white/60 text-sm mt-2">
            {t("sales:no_refund_history", { defaultValue: "No refunds recorded." })}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReturnsTab;
