import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { FiPlus } from "react-icons/fi";
import Button from "components/Button";
import Table from "components/Table";
import SelectDropdown from "components/SelectDropdown";
import FormInput from "components/FormInput";
import { salesPaymentMethodOptions } from "global/constant";
import { formatAmount } from "global/helper";

const PaymentHistoryTab = ({ invoice, panelClass, onRefresh, onAddPayment }) => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [selMethod, setSelMethod] = useState(salesPaymentMethodOptions[1]);
  const [reference, setReference] = useState("");

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error(t("sales:payment_amount_required"));
      return;
    }
    try {
      await onAddPayment({
        // type="date" already gives a plain "YYYY-MM-DD" string — no time
        // component to strip.
        date,
        amount: Number(amount),
        method: selMethod.id,
        reference,
      });
      toast.success(t("sales:payment_recorded"));
      setDate(new Date().toISOString().slice(0, 10));
      setAmount("");
      setReference("");
      setShowForm(false);
      onRefresh?.();
    } catch (err) {
      toast.error(err?.message || err || t("sales:payment_amount_required"));
    }
  };

  return (
    <div className={panelClass}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("sales:payment_history")}
        </h3>
        <Button
          type="button"
          title={t("sales:record_payment")}
          icon={FiPlus}
          onClick={() => setShowForm((s) => !s)}
          className="!w-auto !rounded-md !h-9 !px-3 !border border-teal-400/40 !text-teal-700 dark:!text-teal-300 !bg-teal-50 dark:!bg-teal-500/10"
        />
      </div>

      {showForm && (
        <div className="mb-5 p-4 rounded-2xl border border-teal-200 dark:border-teal-500/30 bg-teal-50/50 dark:bg-teal-500/5 flex flex-wrap items-end gap-3">
          <div>
            <FormInput
              label={t("sales:payment_date")}
              labelClass="!text-xs"
              name="paymentDate"
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
              name="paymentAmount"
              type="number"
              min={0}
              decimal
              decimalPlaces={3}
              value={amount}
              onValueChange={setAmount}
              inputClass="!h-9 !rounded-md"
            />
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
              name="paymentReference"
              value={reference}
              onValueChange={setReference}
              inputClass="!h-9 !rounded-md"
            />
          </div>
          <button type="button" onClick={handleSave} className="h-9 px-4 rounded-md bg-teal-500 text-white text-sm font-semibold">
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
            {(invoice.paymentHistory || []).map((p, idx) => (
              <tr
                key={p.id || `${p.reference || "pay"}-${idx}`}
                className="border-t border-slate-100 dark:border-white/10"
              >
                <td className="p-3">{p.date ? String(p.date).slice(0, 10) : "-"}</td>
                <td className="p-3 font-medium">
                  {p.amount != null ? `${formatAmount(p.amount)} ${invoice.currency || "SAR"}` : "-"}
                </td>
                <td className="p-3">{p.method || "-"}</td>
                <td className="p-3 font-mono text-xs">{p.reference || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Table>
      {(!invoice.paymentHistory || invoice.paymentHistory.length === 0) && (
        <p className="text-slate-500 dark:text-white/60 text-sm mt-2">{t("sales:no_payment_history")}</p>
      )}
    </div>
  );
};

export default PaymentHistoryTab;
