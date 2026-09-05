import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { FiPlus } from "react-icons/fi";
import Button from "components/Button";
import Table from "components/Table";
import SelectDropdown from "components/SelectDropdown";
import FormInput from "components/FormInput";
import { noteStatusBadge as DN_STATUS_BADGE, purchasePaymentMethodOptions } from "global/constant";
import { formatAmount } from "global/helper";

const ReturnsTab = ({ invoice, panelClass, onRefresh, onAddRefund }) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [reference, setReference] = useState("");
  const refundDue = Number(invoice.refundDue) || 0;

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error(t("purchase:payment_amount_required"));
      return;
    }
    try {
      await onAddRefund({ date, amount: Number(amount), method, reference });
      toast.success(t("purchase:refund_recorded", { defaultValue: "Refund recorded." }));
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
          {t("purchase:returned_items")}
        </h3>
        <Table>
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-white/10 text-left">
                <th className="p-3 font-semibold">{t("purchase:product")}</th>
                <th className="p-3 font-semibold">{t("purchase:qty")}</th>
                <th className="p-3 font-semibold">{t("purchase:price")}</th>
                <th className="p-3 font-semibold">{t("purchase:tax_percent")}</th>
                <th className="p-3 font-semibold">{t("purchase:tax_amount")}</th>
                <th className="p-3 font-semibold">{t("purchase:subtotal")}</th>
                <th className="p-3 font-semibold">{t("purchase:debit_note")}</th>
                <th className="p-3 font-semibold">{t("purchase:status")}</th>
                <th className="p-3 font-semibold">{t("purchase:reason")}</th>
                <th className="p-3 font-semibold">{t("purchase:date")}</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.returnedItems || []).map((r, idx) => (
                <tr key={`${r.dnId}-${idx}`} className="border-t border-slate-100 dark:border-white/10">
                  <td className="p-3">{r.productName}</td>
                  <td className="p-3 tabular-nums">{r.qty}</td>
                  <td className="p-3 tabular-nums">{formatAmount(r.price)}</td>
                  <td className="p-3 tabular-nums">{r.taxPercent != null ? `${r.taxPercent}%` : "—"}</td>
                  <td className="p-3 tabular-nums">{formatAmount(r.taxAmount)}</td>
                  <td className="p-3 tabular-nums font-medium">{formatAmount(r.lineTotal ?? (Number(r.qty) || 0) * (Number(r.price) || 0) + (Number(r.taxAmount) || 0))}</td>
                  <td className="p-3">
                    <Link to={`/debit-notes/detail/${r.dnId}`} className="font-mono text-teal-600 hover:underline">
                      {r.dnNumber}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${DN_STATUS_BADGE[r.dnStatus] || ""}`}>{r.dnStatus}</span>
                  </td>
                  <td className="p-3 text-xs text-slate-500">{r.reason}</td>
                  <td className="p-3 text-xs text-slate-500">{r.date ? String(r.date).slice(0, 10) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Table>
        {(!invoice.returnedItems || invoice.returnedItems.length === 0) && (
          <p className="text-slate-500 dark:text-white/60 text-sm mt-2">
            {t("purchase:no_returns", { defaultValue: "No items returned against this invoice." })}
          </p>
        )}
      </div>

      <div className={panelClass}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: t("purchase:debited_amount", { defaultValue: "Returned Amount" }), value: invoice.debitedAmount, color: "border-slate-200 bg-white dark:bg-white/10 dark:border-white/20" },
            { label: t("purchase:refunded_amount", { defaultValue: "Refunded so far" }), value: invoice.refundedAmount, color: "border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10" },
            { label: t("purchase:refund_due", { defaultValue: "Refund due" }), value: invoice.refundDue, color: refundDue > 0 ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10" : "border-slate-200 bg-white dark:bg-white/10 dark:border-white/20" },
          ].map((c) => (
            <div key={c.label} className={`p-4 rounded-2xl border ${c.color}`}>
              <p className="text-xs text-slate-500">{c.label}</p>
              <p className="font-bold text-lg text-slate-900 dark:text-white mt-0.5">{formatAmount(c.value)} {invoice.currency || "SAR"}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("purchase:refund_history", { defaultValue: "Refund history" })}
          </h3>
          {refundDue > 0 && (
            <Button
              type="button"
              title={t("purchase:record_refund", { defaultValue: "Record refund" })}
              icon={FiPlus}
              onClick={() => setShowForm((s) => !s)}
              className="!w-auto !rounded-md !h-9 !px-3 !border border-amber-400/40 !text-amber-700 dark:!text-amber-300 !bg-amber-50 dark:!bg-amber-500/10"
            />
          )}
        </div>

        {showForm && (
          <div className="mb-5 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5 flex flex-wrap items-end gap-3">
            <div>
              <FormInput
                label={t("purchase:date")}
                labelClass="!text-xs"
                name="refundDate"
                type="date"
                value={date}
                onValueChange={setDate}
                inputClass="!h-9 !rounded-md"
              />
            </div>
            <div className="w-32">
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
              <p className="mt-1 text-[11px] text-slate-400">
                {t("purchase:max_refund_hint", { defaultValue: "Max" })}: {formatAmount(refundDue)} {invoice.currency || "SAR"}
              </p>
            </div>
            <div className="w-44">
              <SelectDropdown
                label={t("purchase:payment_method")}
                labelClass="!text-xs"
                data={purchasePaymentMethodOptions}
                selected={purchasePaymentMethodOptions.find((o) => o.id === method) || purchasePaymentMethodOptions[1]}
                setSelected={(o) => setMethod(o?.id || "Bank Transfer")}
                valueKey="id"
                hideClear
                classes="!h-9 !rounded-md"
              />
            </div>
            <div>
              <FormInput
                label={t("purchase:reference")}
                labelClass="!text-xs"
                name="refundReference"
                value={reference}
                onValueChange={setReference}
                inputClass="!h-9 !rounded-md"
              />
            </div>
            <button type="button" onClick={handleSave} className="h-9 px-4 rounded-md bg-amber-500 text-white text-sm font-semibold">
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
              <tr className="bg-slate-100 dark:bg-white/10 text-left">
                <th className="p-3 font-semibold">{t("purchase:date")}</th>
                <th className="p-3 font-semibold">{t("amount")}</th>
                <th className="p-3 font-semibold">{t("purchase:payment_method")}</th>
                <th className="p-3 font-semibold">{t("purchase:reference")}</th>
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
            {t("purchase:no_refund_history", { defaultValue: "No refunds recorded." })}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReturnsTab;
