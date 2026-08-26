import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { FiPlus } from "react-icons/fi";
import Button from "components/Button";
import Table from "components/Table";
import { noteStatusBadge as CN_STATUS_BADGE } from "global/constant";

const ReturnsTab = ({ invoice, panelClass, onRefresh, onAddRefund }) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [reference, setReference] = useState("");

  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();
  const refundDue = Number(invoice.refundDue) || 0;

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error(t("sales:payment_amount_required"));
      return;
    }
    try {
      await onAddRefund({ date, amount: Number(amount), method, reference });
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
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-white/10 text-left">
                <th className="p-3 font-semibold">{t("sales:product")}</th>
                <th className="p-3 font-semibold">{t("sales:qty")}</th>
                <th className="p-3 font-semibold">{t("sales:price")}</th>
                <th className="p-3 font-semibold">{t("sales:credit_note")}</th>
                <th className="p-3 font-semibold">{t("sales:status")}</th>
                <th className="p-3 font-semibold">{t("sales:reason")}</th>
                <th className="p-3 font-semibold">{t("sales:date")}</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.returnedItems || []).map((r, idx) => (
                <tr key={`${r.cnId}-${idx}`} className="border-t border-slate-100 dark:border-white/10">
                  <td className="p-3">{r.productName}</td>
                  <td className="p-3 tabular-nums">{r.qty}</td>
                  <td className="p-3 tabular-nums">{formatAmount(r.price)}</td>
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
              ))}
            </tbody>
          </table>
        </Table>
        {(!invoice.returnedItems || invoice.returnedItems.length === 0) && (
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
          <div className="mb-5 p-4 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/5 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-linkText block mb-1">{t("sales:payment_date")}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 rounded-md border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-linkText block mb-1">{t("amount")}</label>
              <input
                type="number"
                step="any"
                max={refundDue}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 w-32 rounded-md border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {t("sales:max_refund_hint", { defaultValue: "Max" })}: {formatAmount(refundDue)} {invoice.currency || "SAR"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-linkText block mb-1">{t("sales:payment_method")}</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="h-9 rounded-md border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0"
              >
                {["Cash", "Bank Transfer", "Other"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-linkText block mb-1">{t("sales:reference")}</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="h-9 rounded-md border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0"
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
              <tr className="bg-slate-100 dark:bg-white/10 text-left">
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
