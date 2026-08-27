import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { fetchVatSummary, showVatSummary, showVatSummaryLoading } from "store/slices/financeSlice";
import { SkeletonDetail } from "components/Skeleton";
import FinancePage from "../FinancePage";

const { view_customer } = rafeeqi_role_ids;

const fmt = (n) => (parseFloat(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Collected tax (Output VAT, from Sales) minus recoverable tax (Input VAT,
// from Purchases) for a date range — read live off the Ledger's VAT
// Payable/Receivable accounts (see getVatSummary in reports-service.ts), the
// exact same figures the Recoverable Tax / Collected Tax modules total up
// per-invoice. Never a separate manual calculation.
const TaxPayment = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 7) + "-01";
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);

  const vatSummary = useSelector(showVatSummary);
  const vatSummaryLoading = useSelector(showVatSummaryLoading);

  useEffect(() => {
    dispatch(fetchVatSummary({ fromDate, toDate }));
  }, [dispatch, fromDate, toDate]);

  return (
    <FinancePage title={t("finance:tax_payment_title")} description={t("finance:tax_payment_desc")}>
      {checkRoleAuth(view_customer) && (
        <>
          <div className="flex flex-wrap gap-4 items-end mb-6 bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">{t("finance:from_date")}</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">{t("finance:to_date")}</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {vatSummaryLoading ? (
            <SkeletonDetail fields={3} />
          ) : (
            <dl className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                <dt className="text-sm text-mutedForeground">{t("finance:vat_output")}</dt>
                <dd className="text-2xl font-bold tabular-nums mt-1 text-emerald-700 dark:text-emerald-300">{fmt(vatSummary.outputVat)}</dd>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                <dt className="text-sm text-mutedForeground">{t("finance:vat_input")}</dt>
                <dd className="text-2xl font-bold tabular-nums mt-1 text-blue-700 dark:text-blue-300">{fmt(vatSummary.inputVat)}</dd>
              </div>
              <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10 p-4">
                <dt className="text-sm text-mutedForeground">{t("finance:vat_net")}</dt>
                <dd className={`text-2xl font-bold tabular-nums mt-1 ${vatSummary.netVat >= 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(vatSummary.netVat)}</dd>
              </div>
            </dl>
          )}
        </>
      )}
    </FinancePage>
  );
};

export default TaxPayment;
