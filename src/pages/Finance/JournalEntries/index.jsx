import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import SearchInput from "components/SearchInput";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import { SkeletonCards } from "components/Skeleton";
import EmptyState from "components/EmptyState";
import { fetchJournalEntries, showJournalEntries, showJournalEntriesTotal, showJournalEntriesLoading } from "store/slices/financeSlice";
import FinancePage from "../FinancePage";

const { view_customer, add_customer } = rafeeqi_role_ids;

const fmt = (n) => (parseFloat(n) || 0).toLocaleString();

const JournalEntries = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const journals = useSelector(showJournalEntries);
  const total = useSelector(showJournalEntriesTotal);
  const loading = useSelector(showJournalEntriesLoading);
  const [filters, setFilters] = useListFilters("finance-journal-entries", { search: "", page: 1 });
  const { search, page } = filters;
  const selRows = tableRows[0];

  useEffect(() => {
    dispatch(fetchJournalEntries({ page, limit: selRows.id, search: search || undefined }));
  }, [dispatch, page, selRows.id, search]);

  const totalPages = Math.ceil((total || 0) / selRows.id) || 1;
  const handlePageClick = (event) => setFilters({ page: event.selected + 1 });

  return (
    <FinancePage
      title={t("finance:journal_title")}
      description={t("finance:journal_desc")}
      action={
        checkRoleAuth(add_customer) ? (
          <Button
            className="!w-auto !rounded-lg !h-11 !px-5 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600"
            onClick={() => navigate("/finance/journal/add")}
            title={t("finance:add_journal")}
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
            <SkeletonCards count={4} columns="grid-cols-1" />
          ) : journals.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {journals.map((j) => (
                <div
                  key={j.id}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2 mb-3">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {j.journalNo}
                      </span>
                      <span className="text-mutedForeground text-sm ms-3">
                        {j.date ? new Date(j.date).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          j.status === "Posted"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20"
                            : "bg-slate-200 text-slate-700 dark:bg-white/10"
                        }`}
                      >
                        {j.status === "Posted" ? t("finance:posted") : t("finance:draft")}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-mutedForeground mb-3">{j.memo}</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-mutedForeground">
                        <th className="pb-1">{t("finance:account_name")}</th>
                        <th className="pb-1 text-end">{t("finance:debit")}</th>
                        <th className="pb-1 text-end">{t("finance:credit")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(j.lines || []).map((ln, idx) => (
                        <tr key={idx}>
                          <td className="py-1">{ln.accountCode ? `${ln.accountCode} — ${ln.accountName}` : "—"}</td>
                          <td className="py-1 text-end tabular-nums">
                            {ln.debit ? fmt(ln.debit) : "—"}
                          </td>
                          <td className="py-1 text-end tabular-nums">
                            {ln.credit ? fmt(ln.credit) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {total > selRows.id && (
            <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white [&_.pagination_li_a:hover]:!text-teal-600 [&_.pagination_li_a:hover]:!bg-teal-50 dark:[&_.pagination_li_a:hover]:!border-teal-500 dark:[&_.pagination_li_a:hover]:!text-teal-300 dark:[&_.pagination_li_a:hover]:!bg-teal-500/20">
              <div className="pagination ltr:ml-auto rtl:mr-auto">
                <ReactPaginate
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

export default JournalEntries;
