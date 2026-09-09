import { useEffect } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth, formatAmount } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import TableState from "components/TableState";
import { SkeletonCards } from "components/Skeleton";
import {
  fetchReceivables,
  showReceivables,
  showReceivablesTotal,
  showReceivablesTotalBalanceDue,
  showReceivablesTotalRefundDue,
  showReceivablesLoading,
} from "store/slices/saleInvoiceSlice";
import FinancePage from "../FinancePage";

const { view_finance_receivable } = alqadar_role_ids;


// The real Accounts Receivable view — every Sale Invoice this tenant is
// actually still owed on (or owes a refund back for), sourced live from the
// real Sales module (balanceDue/refundDue, already computed server-side
// factoring in Credit Notes) rather than a separate manually entered
// "Customer Invoice" record that never overlapped with real sales.
const Receivable = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const rows = useSelector(showReceivables);
  const total = useSelector(showReceivablesTotal);
  const totalBalanceDue = useSelector(showReceivablesTotalBalanceDue);
  const totalRefundDue = useSelector(showReceivablesTotalRefundDue);
  const loading = useSelector(showReceivablesLoading);
  const [filters, setFilters] = useListFilters("finance-receivable", { search: "", page: 1, limitId: tableRows[0].id });
  const { search, page } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  useEffect(() => {
    dispatch(fetchReceivables({ page, limit: selRows.id, search: search || undefined }));
  }, [dispatch, page, selRows.id, search]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / selRows.id));

  return (
    <FinancePage title={t("finance:ar_title")} description={t("finance:ar_desc")}>
      {checkRoleAuth(view_finance_receivable) && (
        <>
          {loading ? (
            <div className="mb-6 max-w-2xl">
              <SkeletonCards count={2} columns="grid-cols-2 sm:grid-cols-3" />
            </div>
          ) : (
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl">
              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/20">
                <p className="text-xs text-slate-500">{t("finance:total_receivable", { defaultValue: "Total receivable" })}</p>
                <p className="font-bold text-lg text-slate-900 dark:text-white mt-0.5">{formatAmount(totalBalanceDue)}</p>
              </div>
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20">
                <p className="text-xs text-slate-500">{t("finance:total_refund_due", { defaultValue: "Refund due to customers" })}</p>
                <p className="font-bold text-lg text-slate-900 dark:text-white mt-0.5">{formatAmount(totalRefundDue)}</p>
              </div>
            </div>
          )}

          <div className="mb-6 max-w-md">
            <SearchInput
              placeholder={t("finance:search_placeholder")}
              onSearch={(v) => setFilters({ search: v, page: 1 })}
              initialValue={search}
            />
          </div>
          <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
            <table className="w-full border-collapse text-sm mb-0 min-w-[900px]">
              <thead>
                <tr className="bg-[var(--color-teal-500)] border-none">
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">{t("finance:customer")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:reference")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("sales:date")}</th>
                  <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:balance_due")}</th>
                  <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">{t("finance:refund_due", { defaultValue: "Refund due" })}</th>
                </tr>
              </thead>
              <tbody>
                <TableState loading={loading} data={rows} colSpan={5}>
                  {rows.map((row) => {
                    const isOpening = row.source === "opening" || String(row.id || "").startsWith("opening-");
                    return (
                      <tr key={row.id} className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0">
                        <td className="px-4 py-4 align-middle pl-6 font-medium">
                          <Link to={`/customers/detail/${row.customerId}`} className="text-teal-700 hover:underline dark:text-teal-400">
                            {row.customerName}
                          </Link>
                        </td>
                        <td className="px-4 py-4 align-middle font-mono text-xs">
                          {isOpening ? (
                            <Link to={`/customers/detail/${row.customerId}`} className="hover:underline">
                              {t("finance:opening_balance", { defaultValue: row.invoiceNumber || "Opening balance" })}
                            </Link>
                          ) : (
                            <Link to={`/sales/detail/${row.id}`} className="hover:underline">{row.invoiceNumber}</Link>
                          )}
                        </td>
                        <td className="px-4 py-4 align-middle">{row.date ? String(row.date).slice(0, 10) : "—"}</td>
                        <td className="px-4 py-4 align-middle text-end tabular-nums font-semibold">
                          {(Number(row.balanceDue) || 0) > 0 ? `${formatAmount(row.balanceDue)} ${row.currency}` : "—"}
                        </td>
                        <td className="px-4 py-4 align-middle text-end tabular-nums font-semibold text-amber-600 dark:text-amber-400 pr-6">
                          {(Number(row.refundDue) || 0) > 0 ? `${formatAmount(row.refundDue)} ${row.currency}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </TableState>
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
                forcePage={page - 1}
                renderOnZeroPageCount={null}
                containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
              />
            </div>
          </div>
        </>
      )}
    </FinancePage>
  );
};

export default Receivable;
