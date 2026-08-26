import { useTranslation } from "react-i18next";
import { formatAmount, getStatusClass, PANEL_CLASS } from "./expenseDetailUtils";

const PaymentHistoryTab = ({ expense }) => {
  const { t } = useTranslation();

  return (
    <div className={PANEL_CLASS}>
      <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
        {t("expenses:payment_history")}
      </h4>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/20">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-white/10">
              <th className="px-4 py-3 text-start font-semibold">{t("expenses:date")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("expenses:paid_amount")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("expenses:method")}</th>
              <th className="px-4 py-3 text-start font-semibold">{t("expenses:status")}</th>
            </tr>
          </thead>
          <tbody>
            {expense.paymentHistory?.map((row, idx) => (
              <tr key={idx} className="border-t border-slate-100 dark:border-white/5">
                <td className="px-4 py-3">{row.date}</td>
                <td className="px-4 py-3">{formatAmount(row.amount)}</td>
                <td className="px-4 py-3">{row.method || "-"}</td>
                <td className="px-4 py-3">
                  <span className={getStatusClass(row.status)}>{row.status}</span>
                </td>
              </tr>
            ))}
            {(!expense.paymentHistory || expense.paymentHistory.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  {t("no_record_found")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistoryTab;
