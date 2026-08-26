import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import { SkeletonTable } from "components/Skeleton";
import EmptyState from "components/EmptyState";
import { fetchIncomeEntries, showIncomeEntries, showIncomeEntriesTotal, showIncomeEntriesLoading } from "store/slices/financeSlice";
import FinancePage from "../FinancePage";

const { view_customer, add_customer } = rafeeqi_role_ids;

const fmt = (n) => (parseFloat(n) || 0).toLocaleString();

// Misc revenue that doesn't need a formal Customer Invoice — every row here
// already posted a real Debit Bank / Credit Revenue journal entry, so it's
// never edited afterward, same rule Journal Entries and Payments follow.
const Income = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const entries = useSelector(showIncomeEntries);
  const total = useSelector(showIncomeEntriesTotal);
  const loading = useSelector(showIncomeEntriesLoading);
  const [filters, setFilters] = useListFilters("finance-income", { search: "", page: 1, limitId: tableRows[0].id });
  const { search, page } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  useEffect(() => {
    dispatch(fetchIncomeEntries({ page, limit: selRows.id, search: search || undefined }));
  }, [dispatch, page, selRows.id, search]);

  const rows = useMemo(() => entries, [entries]);
  const totalPages = Math.max(1, Math.ceil((total || 0) / selRows.id));

  return (
    <FinancePage
      title={t("finance:income_title")}
      description={t("finance:income_desc")}
      action={
        checkRoleAuth(add_customer) ? (
          <Button
            className="!w-auto !rounded-lg !h-11 !px-5 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600"
            onClick={() => navigate("/finance/income/add")}
            title={t("finance:add_income")}
            icon={IoAdd}
            btn="primary"
            iconClass="h-4 w-4 text-white"
          />
        ) : null
      }
    >
      {checkRoleAuth(view_customer) && (
        <>
          <div className="mb-6 max-w-md">
            <SearchInput
              placeholder={t("finance:search_placeholder")}
              onSearch={(v) => setFilters({ search: v, page: 1 })}
              initialValue={search}
            />
          </div>
          {loading ? (
            <SkeletonTable rows={6} columns={6} />
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
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:source_label")}</th>
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
                      <td className="px-4 py-4 align-middle">{row.source}</td>
                      <td className="px-4 py-4 align-middle max-w-[200px] truncate">{row.description}</td>
                      <td className="px-4 py-4 align-middle text-xs">{row.revenueAccountCode} — {row.revenueAccountName}</td>
                      <td className="px-4 py-4 align-middle text-xs">{row.bankAccountName}</td>
                      <td className="px-4 py-4 align-middle text-end tabular-nums pr-6">
                        {fmt(row.amount)} {row.currency}
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
              <ReactPaginate
                breakLabel="..."
                nextLabel={<FaAngleRight />}
                previousLabel={<FaAngleLeft />}
                onPageChange={(e) => setFilters({ page: e.selected + 1 })}
                pageRangeDisplayed={3}
                marginPagesDisplayed={1}
                pageCount={totalPages}
                forcePage={page - 1}
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

export default Income;
