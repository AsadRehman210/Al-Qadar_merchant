import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  fetchTrialBalance,
  fetchProfitAndLoss,
  fetchBalanceSheet,
  fetchCashFlow,
  fetchChartOfAccounts,
  fetchBudgetVsActual,
  upsertBudget,
  showTrialBalance,
  showTrialBalanceLoading,
  showProfitAndLoss,
  showProfitAndLossLoading,
  showBalanceSheet,
  showBalanceSheetLoading,
  showCashFlow,
  showCashFlowLoading,
  showChartOfAccounts,
  showBudgetVsActual,
  showBudgetVsActualLoading,
} from "store/slices/financeSlice";
import FinancePage from "../FinancePage";
import { SkeletonDetail } from "components/Skeleton";
import TableState from "components/TableState";

const { view_customer } = rafeeqi_role_ids;

const TAB = "min-w-[120px] whitespace-nowrap cursor-pointer py-3 px-4 rounded-lg h-11 flex justify-center items-center font-medium text-sm text-slate-500 dark:text-white/70 transition-all outline-none data-[selected]:bg-[var(--color-teal-500)] data-[selected]:text-white data-[selected]:font-semibold hover:bg-teal-500/10 dark:hover:bg-teal-500/20";

const fmt = (n) => (parseFloat(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
const fmtC = (n) => { const v = parseFloat(n) || 0; return `${v >= 0 ? "" : "-"}${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`; };

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const FinancialReports = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const today = new Date().toISOString().slice(0, 10);
  const firstOfYear = today.slice(0, 4) + "-01-01";

  const [fromDate, setFromDate] = useState(firstOfYear);
  const [toDate, setToDate]     = useState(today);

  const trialBalance = useSelector(showTrialBalance);
  const tbLoading = useSelector(showTrialBalanceLoading);
  const pl = useSelector(showProfitAndLoss);
  const plLoading = useSelector(showProfitAndLossLoading);
  const balanceSheet = useSelector(showBalanceSheet);
  const bsLoading = useSelector(showBalanceSheetLoading);
  const cashFlow = useSelector(showCashFlow);
  const cfLoading = useSelector(showCashFlowLoading);
  const chartOfAccounts = useSelector(showChartOfAccounts);
  const budgetVsActual = useSelector(showBudgetVsActual);
  const budgetLoading = useSelector(showBudgetVsActualLoading);

  const currentYear = new Date().getFullYear();
  const [budgetYear, setBudgetYear] = useState(String(currentYear));
  const [budgetForm, setBudgetForm] = useState({ accountId: "", period: today.slice(0, 7), budgetAmount: "" });
  const [budgetSaving, setBudgetSaving] = useState(false);

  const budgetableAccounts = (chartOfAccounts || []).filter((a) => a.type === "Revenue" || a.type === "Expense");

  useEffect(() => {
    dispatch(fetchTrialBalance({ fromDate, toDate }));
    dispatch(fetchProfitAndLoss({ fromDate, toDate }));
    dispatch(fetchBalanceSheet({ asOfDate: toDate }));
    dispatch(fetchCashFlow({ fromDate, toDate }));
    dispatch(fetchChartOfAccounts());
  }, [dispatch, fromDate, toDate]);

  useEffect(() => {
    dispatch(fetchBudgetVsActual({ year: budgetYear }));
  }, [dispatch, budgetYear]);

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!budgetForm.accountId || !budgetForm.period || budgetForm.budgetAmount === "") return;
    setBudgetSaving(true);
    try {
      await dispatch(upsertBudget({
        accountId: budgetForm.accountId,
        period: budgetForm.period,
        budgetAmount: parseFloat(budgetForm.budgetAmount) || 0,
      })).unwrap();
      setBudgetForm((f) => ({ ...f, budgetAmount: "" }));
      const year = budgetForm.period.slice(0, 4);
      if (year === budgetYear) dispatch(fetchBudgetVsActual({ year: budgetYear }));
      else setBudgetYear(year);
    } catch {
      // upsert rejection surfaces via redux state elsewhere; nothing extra to do here
    } finally {
      setBudgetSaving(false);
    }
  };

  return (
    <FinancePage title={t("finance:reports_title")} description={t("finance:reports_desc")}>
      {checkRoleAuth(view_customer) && (
        <>
          {/* Date range filter */}
          <div className="flex flex-wrap gap-4 items-end mb-6 bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">{t("finance:from_date")}</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">{t("finance:to_date")}</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <button onClick={() => { setFromDate(firstOfYear); setToDate(today); }}
              className="h-10 px-4 rounded-lg bg-slate-200 dark:bg-white/20 text-sm font-medium hover:bg-slate-300 transition-colors">
              {t("finance:reset_filter")}
            </button>
          </div>

          <TabGroup>
            <TabList className="flex flex-wrap gap-2 mb-6">
              <Tab className={TAB}>{t("finance:tab_trial")}</Tab>
              <Tab className={TAB}>{t("finance:tab_pl")}</Tab>
              <Tab className={TAB}>{t("finance:tab_bs")}</Tab>
              <Tab className={TAB}>{t("finance:tab_cashflow")}</Tab>
              <Tab className={TAB}>{t("finance:tab_budget")}</Tab>
            </TabList>
            <TabPanels>
              {/* Trial Balance */}
              <TabPanel>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/5 text-left">
                        <th className="px-4 py-2 font-semibold">{t("finance:account_code")}</th>
                        <th className="px-4 py-2 font-semibold">{t("finance:account_name")}</th>
                        <th className="px-4 py-2 font-semibold text-end">{t("finance:debit")}</th>
                        <th className="px-4 py-2 font-semibold text-end">{t("finance:credit")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <TableState loading={tbLoading} data={trialBalance.rows} colSpan={4}>
                        {(trialBalance.rows || []).map((row) => (
                          <tr key={row.accountId} className="border-t border-slate-100 dark:border-white/10">
                            <td className="px-4 py-2 font-mono text-xs">{row.code}</td>
                            <td className="px-4 py-2">{row.name}</td>
                            <td className="px-4 py-2 text-end tabular-nums">{fmt(row.totalDebit)}</td>
                            <td className="px-4 py-2 text-end tabular-nums">{fmt(row.totalCredit)}</td>
                          </tr>
                        ))}
                      </TableState>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-white/5 font-bold border-t-2 border-slate-200 dark:border-white/20">
                        <td colSpan={2} className="px-4 py-2">{t("finance:totals")}</td>
                        <td className="px-4 py-2 text-end tabular-nums">{fmt(trialBalance.totalDebit)}</td>
                        <td className="px-4 py-2 text-end tabular-nums">{fmt(trialBalance.totalCredit)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </TabPanel>

              {/* P&L */}
              <TabPanel>
                {plLoading ? (
                  <SkeletonDetail fields={3} />
                ) : (
                  <dl className="grid sm:grid-cols-2 gap-4 max-w-lg">
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                      <dt className="text-sm text-mutedForeground">{t("finance:revenue")}</dt>
                      <dd className="text-2xl font-bold tabular-nums mt-1">{fmt(pl.totalRevenue)} SAR</dd>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                      <dt className="text-sm text-mutedForeground">{t("finance:expenses")}</dt>
                      <dd className="text-2xl font-bold tabular-nums mt-1">{fmt(pl.totalExpenses)} SAR</dd>
                    </div>
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 p-4 sm:col-span-2">
                      <dt className="text-sm text-mutedForeground">{t("finance:net_income")}</dt>
                      <dd className={`text-2xl font-bold tabular-nums mt-1 ${pl.netProfit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600"}`}>{fmtC(pl.netProfit)} SAR</dd>
                    </div>
                  </dl>
                )}
              </TabPanel>

              {/* Balance Sheet */}
              <TabPanel>
                {bsLoading ? (
                  <SkeletonDetail fields={3} />
                ) : (
                  <dl className="grid sm:grid-cols-3 gap-4">
                    {[
                      { label: t("finance:total_assets"),      val: balanceSheet.totalAssets },
                      { label: t("finance:total_liabilities"), val: balanceSheet.totalLiabilities },
                      { label: t("finance:equity"),            val: balanceSheet.totalEquity },
                    ].map(({ label, val }) => (
                      <div key={label} className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                        <dt className="text-sm text-mutedForeground">{label}</dt>
                        <dd className="text-xl font-bold tabular-nums mt-1">{fmtC(val)} SAR</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </TabPanel>

              {/* Cash Flow Statement — derived live from Cash on Hand (1000) +
                  Bank - Main (1010) ledger lines for the selected period.
                  Only Operating Activities are shown: this app tracks no
                  Investing (fixed-asset) or Financing (loan/equity) cash
                  movements anywhere, so those sections would always be zero. */}
              <TabPanel>
                {cfLoading ? (
                  <SkeletonDetail fields={4} />
                ) : (
                  <div className="space-y-6 max-w-2xl">
                    <dl className="grid sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                        <dt className="text-sm text-mutedForeground">{t("finance:opening_balance")}</dt>
                        <dd className="text-xl font-bold tabular-nums mt-1">{fmtC(cashFlow.openingBalance)} SAR</dd>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                        <dt className="text-sm text-mutedForeground">{t("finance:closing_balance")}</dt>
                        <dd className="text-xl font-bold tabular-nums mt-1">{fmtC(cashFlow.closingBalance)} SAR</dd>
                      </div>
                    </dl>

                    <div className="rounded-2xl border border-teal-200 dark:border-teal-500/20 overflow-hidden">
                      <div className="bg-teal-50 dark:bg-teal-500/10 px-5 py-3 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-800 dark:text-white">{t("finance:cf_operating")}</h3>
                        <span className={`font-bold tabular-nums text-sm ${cashFlow.netChange >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                          {fmtC(cashFlow.netChange)} SAR
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {(cashFlow.categories || []).length === 0 ? (
                          <div className="px-5 py-4 text-sm text-slate-400">{t("finance:empty_list")}</div>
                        ) : cashFlow.categories.map((cat) => (
                          <div key={cat.label} className="flex justify-between items-center px-5 py-2 text-sm">
                            <span className="text-slate-600 dark:text-white/70">{cat.label}</span>
                            <span className={`tabular-nums font-medium ${cat.net >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmtC(cat.net)} SAR</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-white/10 px-5 py-3 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                      <span className="font-semibold">{t("finance:cf_net_change")}</span>
                      <span className={`font-bold tabular-nums ${cashFlow.netChange >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                        {fmtC(cashFlow.netChange)} SAR
                      </span>
                    </div>
                  </div>
                )}
              </TabPanel>

              {/* Budget vs Actual — Budget rows are set per account per
                  month below; the comparison table joins them against that
                  same account's real ledger activity for the chosen year
                  (see budget-service.getBudgetVsActual on the backend). */}
              <TabPanel>
                <form onSubmit={handleBudgetSubmit} className="flex flex-wrap gap-3 items-end mb-6 bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">{t("finance:account_name")}</label>
                    <select
                      value={budgetForm.accountId}
                      onChange={(e) => setBudgetForm((f) => ({ ...f, accountId: e.target.value }))}
                      className="h-10 px-3 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[220px]"
                    >
                      <option value="">{t("finance:all_accounts")}</option>
                      {budgetableAccounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">{t("finance:budget_month")}</label>
                    <input type="month" value={budgetForm.period}
                      onChange={(e) => setBudgetForm((f) => ({ ...f, period: e.target.value }))}
                      className="h-10 px-3 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">{t("finance:budget_annual")}</label>
                    <input type="number" step="0.01" min="0" value={budgetForm.budgetAmount}
                      onChange={(e) => setBudgetForm((f) => ({ ...f, budgetAmount: e.target.value }))}
                      className="h-10 px-3 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-32" />
                  </div>
                  <button type="submit" disabled={budgetSaving || !budgetForm.accountId}
                    className="h-10 px-4 rounded-lg bg-[var(--color-teal-500)] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
                    {t("save")}
                  </button>
                </form>

                <div className="mb-4 flex items-center gap-3">
                  <label className="text-xs font-medium text-slate-500">{t("finance:budget_year")}</label>
                  <select value={budgetYear} onChange={(e) => setBudgetYear(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                  <table className="w-full text-xs min-w-[900px]">
                    <thead>
                      <tr className="bg-[var(--color-teal-500)] text-white">
                        <th className="px-3 py-2 text-start font-semibold rounded-tl-xl">{t("finance:account_name")}</th>
                        <th className="px-3 py-2 text-end font-semibold">{t("finance:budget_annual")}</th>
                        {MONTH_LABELS.map((m) => (
                          <th key={m} className="px-2 py-2 text-end font-semibold">{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <TableState loading={budgetLoading} data={budgetVsActual.rows} colSpan={14}>
                        {(budgetVsActual.rows || []).map((row) => (
                        <tr key={row.accountId} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50/40">
                          <td className="px-3 py-2 font-medium">{row.accountCode} — {row.accountName}</td>
                          <td className="px-3 py-2 text-end tabular-nums">{fmt(row.budgetAnnual)}</td>
                          {row.months.map((m) => {
                            const diff = row.accountType === "Revenue" ? m.actual - m.budget : m.budget - m.actual;
                            return (
                              <td key={m.month} className="px-2 py-2 text-end tabular-nums">
                                {m.budget > 0 ? (
                                  <div>
                                    <div className="text-slate-600 dark:text-white/70">{fmt(m.actual)}</div>
                                    <div className={`text-[10px] ${diff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                      {diff >= 0 ? "▲" : "▼"} {fmt(Math.abs(diff))}
                                    </div>
                                  </div>
                                ) : m.actual !== 0 ? (
                                  <div className="text-slate-600 dark:text-white/70">{fmt(m.actual)}</div>
                                ) : <span className="text-slate-300">—</span>}
                              </td>
                            );
                          })}
                        </tr>
                        ))}
                      </TableState>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-2">{t("finance:budget_legend")}</p>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </>
      )}
    </FinancePage>
  );
};

export default FinancialReports;
