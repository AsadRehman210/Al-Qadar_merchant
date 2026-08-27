import { useEffect } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import TableState from "components/TableState";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import {
  fetchRecoverableTaxReport,
  showRecoverableTax,
  showRecoverableTaxTotal,
  showRecoverableTaxTotalAmount,
  showRecoverableTaxLoading,
} from "store/slices/purchaseInvoiceSlice";
import FinancePage from "../FinancePage";

const { view_customer } = rafeeqi_role_ids;

const fmt = (n) => (parseFloat(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RecoverableTax = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const rows = useSelector(showRecoverableTax);
  const total = useSelector(showRecoverableTaxTotal);
  const totalAmount = useSelector(showRecoverableTaxTotalAmount);
  const loading = useSelector(showRecoverableTaxLoading);
  const [filters, setFilters] = useListFilters("finance-recoverable-tax", { search: "", page: 1, limitId: tableRows[0].id });
  const { search, page } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  useEffect(() => {
    dispatch(fetchRecoverableTaxReport({ page, limit: selRows.id, search: search || undefined }));
  }, [dispatch, page, selRows.id, search]);

  const totalPages = Math.ceil((total || 0) / selRows.id) || 1;
  const handlePageClick = (event) => setFilters({ page: event.selected + 1 });

  return (
    <FinancePage title={t("finance:recoverable_tax_title")} description={t("finance:recoverable_tax_desc")}>
      {checkRoleAuth(view_customer) && (
        <>
          <div className="mb-6 max-w-xs">
            <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50 dark:bg-teal-500/10 dark:border-teal-500/20">
              <p className="text-xs text-slate-500">{t("finance:total_recoverable_tax")}</p>
              <p className="font-bold text-lg text-slate-900 dark:text-white mt-0.5">{fmt(totalAmount)}</p>
            </div>
          </div>

          <div className="mb-5 max-w-md">
            <SearchInput placeholder={t("finance:search_placeholder")} onSearch={(v) => setFilters({ search: v, page: 1 })} initialValue={search} />
          </div>

          <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
            <table className="w-full border-collapse text-sm mb-0 min-w-[900px]">
              <thead>
                <tr className="bg-[var(--color-teal-500)] border-none">
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">{t("purchase:invoice_number")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("purchase:supplier")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("purchase:date")}</th>
                  <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("purchase:subtotal")}</th>
                  <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">{t("purchase:tax_amount")}</th>
                </tr>
              </thead>
              <tbody>
                <TableState loading={loading} data={rows} colSpan={5}>
                  {rows.map((row) => (
                    <tr key={row.id} className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0">
                      <td className="px-4 py-4 align-middle pl-6 font-mono text-xs">
                        <Link to={`/purchases/detail/${row.id}`} className="text-teal-700 hover:underline dark:text-teal-400">{row.invoiceNumber}</Link>
                      </td>
                      <td className="px-4 py-4 align-middle">{row.supplierName}</td>
                      <td className="px-4 py-4 align-middle">{row.date ? String(row.date).slice(0, 10) : "—"}</td>
                      <td className="px-4 py-4 align-middle text-end tabular-nums">{fmt(row.subtotal)} {row.currency}</td>
                      <td className="px-4 py-4 align-middle text-end tabular-nums font-semibold pr-6">{fmt(row.taxAmount)} {row.currency}</td>
                    </tr>
                  ))}
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
              <span className="whitespace-nowrap text-sm text-slate-500 dark:text-white/50">{t("per_page")}</span>
            </div>
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
        </>
      )}
    </FinancePage>
  );
};

export default RecoverableTax;
