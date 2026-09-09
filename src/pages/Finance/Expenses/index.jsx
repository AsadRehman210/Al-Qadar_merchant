import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth, formatAmount } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { tableRows } from "global/constant";
import { fetchBusinessExpenses, showBusinessExpenses, showBusinessExpensesTotal, showBusinessExpensesLoading } from "store/slices/financeSlice";
import FinancePage from "../FinancePage";
import { SkeletonTable } from "components/Skeleton";
import EmptyState from "components/EmptyState";
import { useListFilters } from "hooks/useListFilters";

const { view_finance_expense, add_finance_expense } = alqadar_role_ids;


// A business expense paid straight from Bank/Cash that doesn't need a formal
// Vendor Bill — distinct from the HR Employee Expenses module. Every row
// here already posted a real Debit Expense / Credit Bank journal entry, so
// it's never edited afterward, same rule Journal Entries and Payments
// follow.
const FinanceExpenses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const entries = useSelector(showBusinessExpenses);
  const total = useSelector(showBusinessExpensesTotal);
  const loading = useSelector(showBusinessExpensesLoading);
  const [filters, setFilters] = useListFilters("finance-expenses", { search: "", page: 1, limitId: tableRows[0].id });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  useEffect(() => {
    dispatch(fetchBusinessExpenses({ page: filters.page, limit: selRows.id, search: filters.search || undefined }));
  }, [dispatch, filters.page, selRows.id, filters.search]);

  const rows = useMemo(() => entries, [entries]);
  const totalPages = Math.max(1, Math.ceil((total || 0) / selRows.id));

  return (
    <FinancePage
      title={t("finance:fin_exp_title")}
      description={t("finance:fin_exp_desc")}
      action={
        checkRoleAuth(add_finance_expense) ? (
          <Button
            className="!w-auto !rounded-lg !h-11 !px-5 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600"
            onClick={() => navigate("/finance/expenses/add")}
            title={t("finance:add_expense")}
            icon={IoAdd}
            btn="primary"
            iconClass="h-4 w-4 text-white"
          />
        ) : null
      }
    >
      {checkRoleAuth(view_finance_expense) && (
        <>
          <div className="mb-6 max-w-md">
            <SearchInput
              placeholder={t("finance:search_placeholder")}
              onSearch={(v) => setFilters({ search: v, page: 1 })}
              initialValue={filters.search}
            />
          </div>
          {loading ? (
            <SkeletonTable rows={6} columns={5} />
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
            <>
            <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
              <table className="w-full border-collapse text-sm mb-0">
                <thead>
                  <tr className="bg-[var(--color-teal-500)] border-none">
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">
                      {t("finance:posted_date")}
                    </th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:category")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("description")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:account_name")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:bank_name")}</th>
                    <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">{t("finance:amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                    >
                      <td className="px-4 py-4 align-middle pl-6">{row.date ? new Date(row.date).toLocaleDateString() : ""}</td>
                      <td className="px-4 py-4 align-middle">{row.category}</td>
                      <td className="px-4 py-4 align-middle max-w-[200px] truncate">{row.description}</td>
                      <td className="px-4 py-4 align-middle text-xs">{row.expenseAccountCode} — {row.expenseAccountName}</td>
                      <td className="px-4 py-4 align-middle text-xs">{row.bankAccountName}</td>
                      <td className="px-4 py-4 align-middle text-end tabular-nums pr-6">
                        {formatAmount(row.amount)} {row.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white [&_.pagination_li_a:hover]:!text-teal-600 [&_.pagination_li_a:hover]:!bg-teal-50 dark:[&_.pagination_li_a:hover]:!border-teal-500 dark:[&_.pagination_li_a:hover]:!text-teal-300 dark:[&_.pagination_li_a:hover]:!bg-teal-500/20">
              <div className="flex items-center gap-4">
                <SelectDropdown
                  data={tableRows}
                  selected={selRows}
                  setSelected={(v) => setFilters({ limitId: v.id, page: 1 })}
                  hideClear
                  classes="!h-10 !rounded-lg"
                />
                <span className="whitespace-nowrap">{t("per_page")}</span>
              </div>
              <div className="pagination ltr:ml-auto rtl:mr-auto">
                <Pagination
                  breakLabel="..."
                  nextLabel={<FaAngleRight />}
                  previousLabel={<FaAngleLeft />}
                  onPageChange={(e) => setFilters({ page: e.selected + 1 })}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={1}
                  pageCount={totalPages}
                  forcePage={filters.page - 1}
                  renderOnZeroPageCount={null}
                  containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
                />
              </div>
            </div>
            </>
          )}
        </>
      )}
    </FinancePage>
  );
};

export default FinanceExpenses;
