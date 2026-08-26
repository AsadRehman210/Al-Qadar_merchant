import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { FiPlus } from "react-icons/fi";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";

const PAYMENT_METHOD_OPTS = [
  { title: "purchase:cash", id: "Cash" },
  { title: "purchase:bank_transfer", id: "Bank Transfer" },
  { title: "purchase:other", id: "Other" },
];

const PaymentHistoryTab = ({ invoice, panelClass, onRefresh, onAddPayment }) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [selMethod, setSelMethod] = useState(PAYMENT_METHOD_OPTS[1]);
  const [reference, setReference] = useState("");

  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error(t("purchase:payment_amount_required"));
      return;
    }
    try {
      await onAddPayment({
        date: new Date().toISOString().slice(0, 10),
        amount: Number(amount),
        method: selMethod.id,
        reference,
      });
      toast.success(t("purchase:payment_recorded"));
      setAmount("");
      setReference("");
      setShowForm(false);
      onRefresh?.();
    } catch (err) {
      toast.error(err?.message || err || "");
    }
  };

  return (
    <div className={panelClass}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("purchase:payment_history")}
        </h3>
        <Button
          type="button"
          title={t("purchase:record_payment")}
          icon={FiPlus}
          onClick={() => setShowForm((s) => !s)}
          className="!w-auto !rounded-lg !h-9 !px-3 !border border-teal-400/40 !text-teal-700 dark:!text-teal-300 !bg-teal-50 dark:!bg-teal-500/10"
        />
      </div>

      {showForm && (
        <div className="mb-5 p-4 rounded-2xl border border-teal-200 dark:border-teal-500/30 bg-teal-50/50 dark:bg-teal-500/5 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-linkText block mb-1">{t("amount")}</label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9 w-32 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0"
            />
          </div>
          <div className="w-40">
            <label className="text-xs font-medium text-linkText block mb-1">{t("purchase:payment_method")}</label>
            <SelectDropdown
              data={PAYMENT_METHOD_OPTS}
              selected={selMethod}
              setSelected={(o) => setSelMethod(o || PAYMENT_METHOD_OPTS[1])}
              valueKey="id"
              hideClear
              classes="!h-9 !rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-linkText block mb-1">{t("purchase:reference")}</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0"
            />
          </div>
          <button type="button" onClick={handleSave} className="h-9 px-4 rounded-lg bg-teal-500 text-white text-sm font-semibold">
            {t("save")}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="h-9 px-4 rounded-lg bg-slate-200 dark:bg-white/20 text-slate-600 dark:text-white text-sm">
            {t("cancel")}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/20">
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
            {(invoice.paymentHistory || []).map((p, idx) => (
              <tr
                key={p.id || `${p.reference || "pay"}-${idx}`}
                className="border-t border-slate-100 dark:border-white/10"
              >
                <td className="p-3">{String(p.date).slice(0, 10)}</td>
                <td className="p-3 font-medium">
                  {formatAmount(p.amount)} {invoice.currency || "SAR"}
                </td>
                <td className="p-3">{p.method}</td>
                <td className="p-3 font-mono text-xs">{p.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(!invoice.paymentHistory || invoice.paymentHistory.length === 0) && (
        <p className="text-slate-500 dark:text-white/60 text-sm mt-2">
          {t("purchase:no_history_found", { defaultValue: "No history found" })}
        </p>
      )}
    </div>
  );
};

export default PaymentHistoryTab;
