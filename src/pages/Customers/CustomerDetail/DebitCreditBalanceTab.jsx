import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { fetchCustomerDebitCreditSummary, showCustomerDebitCreditSummary, showSalesCustomerTabLoading } from "store/slices/salesCustomerSlice";
import { SkeletonCards } from "components/Skeleton";

const DebitCreditBalanceTab = ({ customer }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const summary = useSelector(showCustomerDebitCreditSummary);
  const loading = useSelector(showSalesCustomerTabLoading);
  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  useEffect(() => {
    if (customer?.id) dispatch(fetchCustomerDebitCreditSummary(customer.id));
  }, [dispatch, customer?.id]);

  if (!customer) return null;

  if (loading && !summary) {
    return (
      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
          {t("customers:debit_credit_balance")}
        </h4>
        <SkeletonCards count={4} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
      </div>
    );
  }

  const openingBalance = summary?.openingBalance ?? 0;
  const totalPaid = summary?.totalPaid ?? 0;
  const totalCredited = summary?.totalCredited ?? 0;
  const balanceDue = summary?.balanceDue ?? 0;
  const isRefund = balanceDue < 0;
  const currency = "SAR";

  return (
    <div>
      <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
        {t("customers:debit_credit_balance")}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5">
          <p className="text-sm font-medium text-slate-500 dark:text-white/70">
            {t("customers:opening_balance")}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatAmount(openingBalance)} {currency}
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {t("customers:amount_paid")}
          </p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            {formatAmount(totalPaid)} {currency}
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {t("customers:credited")}
          </p>
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-200 mt-1">
            {formatAmount(totalCredited)} {currency}
          </p>
        </div>
        <div className={`p-6 rounded-2xl border ${
          isRefund
            ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10"
            : "border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/10"
        }`}>
          <p className={`text-sm font-medium ${isRefund ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {isRefund ? t("customers:refund_due") : t("customers:balance_due")}
          </p>
          <p className={`text-2xl font-bold mt-1 ${isRefund ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
            {formatAmount(Math.abs(balanceDue))} {currency}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DebitCreditBalanceTab;
