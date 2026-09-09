import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { fetchSupplierDebitCreditSummary, showSupplierDebitCreditSummary, showSupplierTabLoading } from "store/slices/supplierSlice";
import { SkeletonCards } from "components/Skeleton";

const DebitCreditBalanceTab = ({ supplier }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const summary = useSelector(showSupplierDebitCreditSummary);
  const loading = useSelector(showSupplierTabLoading);
  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  useEffect(() => {
    if (supplier?.id) dispatch(fetchSupplierDebitCreditSummary(supplier.id));
  }, [dispatch, supplier?.id]);

  if (!supplier) return null;

  if (loading && !summary) {
    return (
      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
          {t("suppliers:debit_credit_balance")}
        </h4>
        <SkeletonCards count={3} columns="grid-cols-1 sm:grid-cols-3" />
      </div>
    );
  }

  const openingBalance = summary?.openingBalance ?? 0;
  const totalPaid = summary?.totalPaid ?? 0;
  const balanceDue = summary?.balanceDue ?? 0;
  const currency = "SAR";

  return (
    <div>
      <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
        {t("suppliers:debit_credit_balance")}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5">
          <p className="text-sm font-medium text-slate-500 dark:text-white/70">
            {t("suppliers:opening_balance")}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatAmount(openingBalance)} {currency}
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {t("suppliers:amount_paid")}
          </p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            {formatAmount(totalPaid)} {currency}
          </p>
        </div>
        <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/10">
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
            {t("suppliers:balance_due")}
          </p>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">
            {formatAmount(balanceDue)} {currency}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DebitCreditBalanceTab;
