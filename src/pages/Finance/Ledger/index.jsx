import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth, formatAmount, formatSignedAmount } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import { SkeletonTable } from "components/Skeleton";
import EmptyState from "components/EmptyState";
import {
  fetchChartOfAccounts,
  fetchLedger,
  fetchLedgerByAccount,
  clearLedgerByAccount,
  showChartOfAccounts,
  showLedger,
  showLedgerTotal,
  showLedgerLoading,
  showLedgerAccount,
  showLedgerOpeningBalance,
  showLedgerAccountLines,
  showLedgerClosingBalance,
  showLedgerAccountLoading,
} from "store/slices/financeSlice";
import FinancePage from "../FinancePage";

const { view_finance_ledger } = alqadar_role_ids;

const Ledger = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const accountId = searchParams.get("accountId") || "";

  const accounts = useSelector(showChartOfAccounts);
  const flatList = useSelector(showLedger);
  const flatTotal = useSelector(showLedgerTotal);
  const flatLoading = useSelector(showLedgerLoading);
  const account = useSelector(showLedgerAccount);
  const openingBalance = useSelector(showLedgerOpeningBalance);
  const accountLines = useSelector(showLedgerAccountLines);
  const closingBalance = useSelector(showLedgerClosingBalance);
  const accountLoading = useSelector(showLedgerAccountLoading);

  const [filters, setFilters] = useListFilters("finance-ledger", { search: "", page: 1, limitId: tableRows[0].id });
  const { search, page } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  useEffect(() => {
    if (!accounts.length) dispatch(fetchChartOfAccounts());
  }, [dispatch, accounts.length]);

  useEffect(() => {
    if (accountId) {
      dispatch(fetchLedgerByAccount({ accountId }));
    } else {
      dispatch(clearLedgerByAccount());
      dispatch(fetchLedger({ page, limit: selRows.id, search: search || undefined }));
    }
  }, [dispatch, accountId, page, selRows.id, search]);

  useEffect(() => {
    return () => dispatch(clearLedgerByAccount());
  }, [dispatch]);

  useEffect(() => {
    setFilters({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  const acctOpts = [{ id: "", title: t("finance:all_accounts") }, ...accounts.map((a) => ({ id: a.id, title: `${a.code} — ${a.name}` }))];

  const loading = accountId ? accountLoading : flatLoading;
  const totalPages = Math.ceil((flatTotal || 0) / selRows.id) || 1;
  const handlePageClick = (event) => setFilters({ page: event.selected + 1 });

  return (
    <FinancePage
      title={t("finance:ledger_title")}
      description={t("finance:ledger_desc")}
    >
      {checkRoleAuth(view_finance_ledger) && (
        <>
          <div className="mb-6 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px] max-w-xs">
              <SelectDropdown
                label={t("finance:account_name")}
                labelClass="!text-xs font-medium text-slate-500"
                data={acctOpts}
                selected={acctOpts.find((o) => o.id === accountId) || acctOpts[0]}
                setSelected={(opt) => setSearchParams(opt?.id ? { accountId: opt.id } : {})}
                hideClear
                classes="!h-11 !rounded-lg"
              />
            </div>
            {!accountId && (
              <div className="flex-1 min-w-[200px] max-w-xs">
                <SearchInput
                  placeholder={t("finance:search_placeholder")}
                  onSearch={(v) => setFilters({ search: v, page: 1 })}
                  initialValue={search}
                />
              </div>
            )}
          </div>

          {accountId && account && (
            <div className="mb-6 grid sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                <dt className="text-sm text-mutedForeground">{t("finance:opening_balance")}</dt>
                <dd className="text-xl font-bold tabular-nums mt-1">{formatSignedAmount(openingBalance)}</dd>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                <dt className="text-sm text-mutedForeground">{account.code} — {account.name}</dt>
                <dd className="text-xs text-slate-500 dark:text-white/60 mt-1">{account.type}</dd>
              </div>
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 p-4">
                <dt className="text-sm text-mutedForeground">{t("finance:closing_balance")}</dt>
                <dd className="text-xl font-bold tabular-nums mt-1 text-emerald-700 dark:text-emerald-300">{formatSignedAmount(closingBalance)}</dd>
              </div>
            </div>
          )}

          {loading ? (
            <SkeletonTable rows={6} columns={6} />
          ) : (accountId ? accountLines : flatList).length === 0 ? (
            <EmptyState />
          ) : (
          <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
            <table className="w-full border-collapse text-sm mb-0 min-w-[900px]">
              <thead>
                <tr className="bg-[var(--color-teal-500)] border-none">
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">{t("finance:posted_date")}</th>
                  {!accountId && <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:account_name")}</th>}
                  <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:debit")}</th>
                  <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:credit")}</th>
                  {accountId && <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:running_balance")}</th>}
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:reference")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">{t("finance:source")}</th>
                </tr>
              </thead>
              <tbody>
                {(accountId ? accountLines : flatList).map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                    >
                      <td className="px-4 py-4 align-middle pl-6 whitespace-nowrap">{row.date ? new Date(row.date).toLocaleDateString() : ""}</td>
                      {!accountId && <td className="px-4 py-4 align-middle">{row.accountCode ? `${row.accountCode} — ${row.accountName}` : "—"}</td>}
                      <td className="px-4 py-4 align-middle text-end tabular-nums">{row.debit ? formatAmount(row.debit) : "—"}</td>
                      <td className="px-4 py-4 align-middle text-end tabular-nums">{row.credit ? formatAmount(row.credit) : "—"}</td>
                      {accountId && <td className="px-4 py-4 align-middle text-end tabular-nums font-semibold">{formatSignedAmount(row.balance)}</td>}
                      <td className="px-4 py-4 align-middle font-mono text-xs">{row.ref}</td>
                      <td className="px-4 py-4 align-middle text-xs text-mutedForeground pr-6">{row.source}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {!accountId && flatList.length > 0 && (
            <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white [&_.pagination_li_a:hover]:!text-teal-600 [&_.pagination_li_a:hover]:!bg-teal-50 dark:[&_.pagination_li_a:hover]:!border-teal-500 dark:[&_.pagination_li_a:hover]:!text-teal-300 dark:[&_.pagination_li_a:hover]:!bg-teal-500/20">
              <div className="flex items-center gap-4">
                <SelectDropdown
                  data={tableRows}
                  selected={selRows}
                  setSelected={(v) => setFilters({ limitId: v.id, page: 1 })}
                  hideClear
                  classes="!h-10 !rounded-lg"
                />
                <span className="whitespace-nowrap text-sm text-slate-500 dark:text-white/50">{t("per_page")}</span>
              </div>
              <div className="pagination ltr:ml-auto rtl:mr-auto">
                <Pagination
                  breakLabel="..."
                  nextLabel={<FaAngleRight />}
                  previousLabel={<FaAngleLeft />}
                  onPageChange={handlePageClick}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={1}
                  pageCount={totalPages}
                  forcePage={page - 1}
                  renderOnZeroPageCount={null}
                  containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
                />
              </div>
            </div>
          )}
        </>
      )}
    </FinancePage>
  );
};

export default Ledger;
