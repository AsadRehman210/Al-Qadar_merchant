import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { checkRoleAuth, formatAmount, formatSignedAmount } from "global/helper";
import { monthShortLabels } from "global/constant";
import { alqadar_role_ids } from "global/alqadarRoles";
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
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";

const { view_finance_reports } = alqadar_role_ids;

const TAB = "min-w-[120px] whitespace-nowrap cursor-pointer py-3 px-4 rounded-lg h-11 flex justify-center items-center font-medium text-sm text-slate-500 dark:text-white/70 transition-all outline-none data-[selected]:bg-[var(--color-teal-500)] data-[selected]:text-white data-[selected]:font-semibold hover:bg-teal-500/10 dark:hover:bg-teal-500/20";

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
  const budgetAcctOpts = [
    { id: "", title: t("finance:all_accounts") },
    ...budgetableAccounts.map((a) => ({ id: a.id, title: `${a.code} — ${a.name}` })),
  ];
  const budgetYearOpts = [currentYear, currentYear - 1, currentYear - 2].map((y) => ({ id: String(y), title: String(y) }));

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
    const todayMonth = new Date().toISOString().slice(0, 7);
    if (!budgetForm.accountId || !budgetForm.period || budgetForm.budgetAmount === "") return;
    if (budgetForm.period > todayMonth) {
      toast.error(t("finance:date_not_future", { defaultValue: "Period cannot be in the future" }));
      return;
    }
    if (!(parseFloat(budgetForm.budgetAmount) > 0)) {
      toast.error(t("finance:amount_required", { defaultValue: "Amount must be greater than 0" }));
      return;
    }
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
      {checkRoleAuth(view_finance_reports) && (
        <>
          {/* Date range filter */}
          <div className="flex flex-wrap gap-4 items-end mb-6 bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
            <FormInput
              label={t("finance:from_date")}
              labelClass="!text-xs font-medium text-slate-500"
              name="reportFrom"
              type="date"
              value={fromDate}
              onValueChange={setFromDate}
              wrapperClass="min-w-[160px]"
              inputClass="!h-10 !rounded-lg"
            />
            <FormInput
              label={t("finance:to_date")}
              labelClass="!text-xs font-medium text-slate-500"
              name="reportTo"
              type="date"
              value={toDate}
              onValueChange={setToDate}
              wrapperClass="min-w-[160px]"
              inputClass="!h-10 !rounded-lg"
            />
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
                            <td className="px-4 py-2 text-end tabular-nums">{formatAmount(row.totalDebit)}</td>
                            <td className="px-4 py-2 text-end tabular-nums">{formatAmount(row.totalCredit)}</td>
                          </tr>
                        ))}
                      </TableState>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 dark:bg-white/5 font-bold border-t-2 border-slate-200 dark:border-white/20">
                        <td colSpan={2} className="px-4 py-2">{t("finance:totals")}</td>
                        <td className="px-4 py-2 text-end tabular-nums">{formatAmount(trialBalance.totalDebit)}</td>
                        <td className="px-4 py-2 text-end tabular-nums">{formatAmount(trialBalance.totalCredit)}</td>
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
                      <dd className="text-2xl font-bold tabular-nums mt-1">{formatAmount(pl.totalRevenue)} SAR</dd>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                      <dt className="text-sm text-mutedForeground">{t("finance:expenses")}</dt>
                      <dd className="text-2xl font-bold tabular-nums mt-1">{formatAmount(pl.totalExpenses)} SAR</dd>
                    </div>
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 p-4 sm:col-span-2">
                      <dt className="text-sm text-mutedForeground">{t("finance:net_income")}</dt>
                      <dd className={`text-2xl font-bold tabular-nums mt-1 ${pl.netProfit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600"}`}>{formatSignedAmount(pl.netProfit)} SAR</dd>
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
                        <dd className="text-xl font-bold tabular-nums mt-1">{formatSignedAmount(val)} SAR</dd>
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
                        <dd className="text-xl font-bold tabular-nums mt-1">{formatSignedAmount(cashFlow.openingBalance)} SAR</dd>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                        <dt className="text-sm text-mutedForeground">{t("finance:closing_balance")}</dt>
                        <dd className="text-xl font-bold tabular-nums mt-1">{formatSignedAmount(cashFlow.closingBalance)} SAR</dd>
                      </div>
                    </dl>

                    <div className="rounded-2xl border border-teal-200 dark:border-teal-500/20 overflow-hidden">
                      <div className="bg-teal-50 dark:bg-teal-500/10 px-5 py-3 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-800 dark:text-white">{t("finance:cf_operating")}</h3>
                        <span className={`font-bold tabular-nums text-sm ${cashFlow.netChange >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                          {formatSignedAmount(cashFlow.netChange)} SAR
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-white/5">
                        {(cashFlow.categories || []).length === 0 ? (
                          <div className="px-5 py-4 text-sm text-slate-400">{t("finance:empty_list")}</div>
                        ) : cashFlow.categories.map((cat) => (
                          <div key={cat.label} className="flex justify-between items-center px-5 py-2 text-sm">
                            <span className="text-slate-600 dark:text-white/70">{cat.label}</span>
                            <span className={`tabular-nums font-medium ${cat.net >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatSignedAmount(cat.net)} SAR</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-white/10 px-5 py-3 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                      <span className="font-semibold">{t("finance:cf_net_change")}</span>
                      <span className={`font-bold tabular-nums ${cashFlow.netChange >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                        {formatSignedAmount(cashFlow.netChange)} SAR
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
                  <div className="min-w-[220px]">
                    <SelectDropdown
                      label={t("finance:account_name")}
                      labelClass="!text-xs font-medium text-slate-500"
                      data={budgetAcctOpts}
                      selected={budgetAcctOpts.find((o) => o.id === budgetForm.accountId) || budgetAcctOpts[0]}
                      setSelected={(opt) => setBudgetForm((f) => ({ ...f, accountId: opt?.id || "" }))}
                      hideClear
                      classes="!h-10 !rounded-lg"
                    />
                  </div>
                  <FormInput
                    label={t("finance:budget_month")}
                    labelClass="!text-xs font-medium text-slate-500"
                    name="budgetPeriod"
                    type="month"
                    required
                    max={new Date().toISOString().slice(0, 7)}
                    value={budgetForm.period}
                    onValueChange={(v) => setBudgetForm((f) => ({ ...f, period: v }))}
                    wrapperClass="min-w-[160px]"
                    inputClass="!h-10 !rounded-lg"
                  />
                  <FormInput
                    label={t("finance:budget_annual")}
                    labelClass="!text-xs font-medium text-slate-500"
                    name="budgetAmount"
                    type="number"
                    min={0.01}
                    decimal
                    decimalPlaces={3}
                    maxLength={10}
                    required
                    value={budgetForm.budgetAmount}
                    onValueChange={(v) => setBudgetForm((f) => ({ ...f, budgetAmount: v }))}
                    wrapperClass="w-32"
                    inputClass="!h-10 !rounded-lg"
                  />
                  <button type="submit" disabled={budgetSaving || !budgetForm.accountId}
                    className="h-10 px-4 rounded-lg bg-[var(--color-teal-500)] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
                    {t("save")}
                  </button>
                </form>

                <div className="mb-4 flex items-end gap-3">
                  <div className="w-36">
                    <SelectDropdown
                      label={t("finance:budget_year")}
                      labelClass="!text-xs font-medium text-slate-500"
                      data={budgetYearOpts}
                      selected={budgetYearOpts.find((o) => o.id === budgetYear) || budgetYearOpts[0]}
                      setSelected={(opt) => setBudgetYear(opt?.id || budgetYear)}
                      hideClear
                      classes="!h-9 !rounded-lg"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                  <table className="w-full text-xs min-w-[900px]">
                    <thead>
                      <tr className="bg-[var(--color-teal-500)] text-white">
                        <th className="px-3 py-2 text-start font-semibold rounded-tl-xl">{t("finance:account_name")}</th>
                        <th className="px-3 py-2 text-end font-semibold">{t("finance:budget_annual")}</th>
                        {monthShortLabels.map((m) => (
                          <th key={m} className="px-2 py-2 text-end font-semibold">{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <TableState loading={budgetLoading} data={budgetVsActual.rows} colSpan={14}>
                        {(budgetVsActual.rows || []).map((row) => (
                        <tr key={row.accountId} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50/40">
                          <td className="px-3 py-2 font-medium">{row.accountCode} — {row.accountName}</td>
                          <td className="px-3 py-2 text-end tabular-nums">{formatAmount(row.budgetAnnual)}</td>
                          {row.months.map((m) => {
                            const diff = row.accountType === "Revenue" ? m.actual - m.budget : m.budget - m.actual;
                            return (
                              <td key={m.month} className="px-2 py-2 text-end tabular-nums">
                                {m.budget > 0 ? (
                                  <div>
                                    <div className="text-slate-600 dark:text-white/70">{formatAmount(m.actual)}</div>
                                    <div className={`text-[10px] ${diff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                      {diff >= 0 ? "▲" : "▼"} {formatAmount(Math.abs(diff))}
                                    </div>
                                  </div>
                                ) : m.actual !== 0 ? (
                                  <div className="text-slate-600 dark:text-white/70">{formatAmount(m.actual)}</div>
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
