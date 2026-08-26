import { useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router";
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
import { fetchCustomerInvoices, showCustomerInvoices, showCustomerInvoicesTotal, showCustomerInvoicesLoading } from "store/slices/financeSlice";
import FinancePage from "../FinancePage";
import { SkeletonTable } from "components/Skeleton";
import EmptyState from "components/EmptyState";
import { useListFilters } from "hooks/useListFilters";

const { view_customer, add_customer } = rafeeqi_role_ids;

const fmt = (n) => (parseFloat(n) || 0).toLocaleString();

import { financeInvoiceStatusBadge as STATUS_BADGE } from "global/constant";

// Sales invoices only — vendor bills (Purchase side) live in the separate
// Payable module; one model each side, matching how Payable/Bills relate.
const FinanceInvoices = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const invoices = useSelector(showCustomerInvoices);
  const total = useSelector(showCustomerInvoicesTotal);
  const loading = useSelector(showCustomerInvoicesLoading);
  const [filters, setFilters] = useListFilters("finance-invoices", { search: "", statusFilter: "All", page: 1, limitId: tableRows[0].id });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  useEffect(() => {
    dispatch(fetchCustomerInvoices({
      page: filters.page,
      limit: selRows.id,
      search: filters.search || undefined,
      status: filters.statusFilter !== "All" ? filters.statusFilter : undefined,
    }));
  }, [dispatch, filters.page, selRows.id, filters.search, filters.statusFilter]);

  const statusOpts = ["All", "Draft", "Sent", "Partial", "Paid", "Cancelled"];
  const rows = useMemo(() => invoices, [invoices]);
  const totalPages = Math.max(1, Math.ceil((total || 0) / selRows.id));

  return (
    <FinancePage
      title={t("finance:inv_title")}
      description={t("finance:inv_desc")}
      action={
        checkRoleAuth(add_customer) ? (
          <Button
            className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700"
            onClick={() => navigate("/finance/invoices/add")}
            type="button"
            title={t("finance:add_invoice")}
            icon={IoAdd}
            btn="primary"
            iconClass="h-4 w-4 text-white"
          />
        ) : null
      }
    >
      {checkRoleAuth(view_customer) && (
        <>
          <div className="mb-5 flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px] max-w-xs">
              <SearchInput placeholder={t("finance:search_placeholder")} onSearch={(v) => setFilters({ search: v, page: 1 })} initialValue={filters.search} />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusOpts.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilters({ statusFilter: s, page: 1 })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filters.statusFilter === s ? "bg-teal-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-teal-50"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <SkeletonTable rows={6} columns={4} />
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
            <>
            <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
              <table className="w-full border-collapse text-sm mb-0 min-w-[900px]">
                <thead>
                  <tr className="bg-[var(--color-teal-500)] border-none">
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">{t("purchase:invoice_number")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:party")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("purchase:date")}</th>
                    <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:inv_total")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">{t("purchase:status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                    >
                      <td className="px-4 py-4 align-middle pl-6 font-mono font-semibold">
                        <Link to={`/finance/invoices/${row.id}`} className="text-teal-700 hover:underline dark:text-teal-400">
                          {row.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-4 align-middle">{row.customerName}</td>
                      <td className="px-4 py-4 align-middle">{row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-4 align-middle text-end tabular-nums">
                        {fmt(row.total)} {row.currency}
                      </td>
                      <td className="px-4 py-4 align-middle pr-6">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[row.status] || ""}`}>{row.status}</span>
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

export default FinanceInvoices;
