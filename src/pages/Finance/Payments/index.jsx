import { useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router";
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
import { useListFilters } from "hooks/useListFilters";
import { SkeletonTable } from "components/Skeleton";
import EmptyState from "components/EmptyState";
import { fetchPayments, showPayments, showPaymentsTotal, showPaymentsLoading } from "store/slices/financeSlice";
import FinancePage from "../FinancePage";
import { labelOf } from "components/AuditMeta";

const { view_finance_payment, add_finance_payment } = alqadar_role_ids;

// A real combined feed of every cash-in/cash-out event — every Payment here
// came from the same shared write path (invoice/bill "record payment" or a
// standalone entry), never edited once posted, same rule Journal Entries
// follow.
const Payments = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const payments = useSelector(showPayments);
  const total = useSelector(showPaymentsTotal);
  const loading = useSelector(showPaymentsLoading);
  const [filters, setFilters] = useListFilters("finance-payments", { search: "", page: 1, limitId: tableRows[0].id });
  const { search, page } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  useEffect(() => {
    dispatch(fetchPayments({ page, limit: selRows.id, search: search || undefined }));
  }, [dispatch, page, selRows.id, search]);

  const rows = useMemo(() => payments, [payments]);
  const totalPages = Math.max(1, Math.ceil((total || 0) / selRows.id));

  const allocationLabel = (row) => {
    if (row.invoiceNumber) return row.invoiceNumber;
    if (row.billNumber) return row.billNumber;
    if (row.contraAccountCode) return `${row.contraAccountCode} — ${row.contraAccountName}`;
    return "—";
  };

  return (
    <FinancePage
      title={t("finance:pay_title")}
      description={t("finance:pay_desc")}
      action={
        checkRoleAuth(add_finance_payment) ? (
          <Button
            className="!w-auto !rounded-lg !h-11 !px-5 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600"
            onClick={() => navigate("/finance/payments/add")}
            title={t("finance:add_payment")}
            icon={IoAdd}
            btn="primary"
            iconClass="h-4 w-4 text-white"
          />
        ) : null
      }
    >
      {checkRoleAuth(view_finance_payment) && (
        <>
          <div className="mb-6 max-w-md">
            <SearchInput
              placeholder={t("finance:search_placeholder")}
              onSearch={(v) => setFilters({ search: v, page: 1 })}
              initialValue={search}
            />
          </div>
          {loading ? (
            <SkeletonTable rows={6} columns={7} />
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
          <>
          <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
            <table className="w-full border-collapse text-sm mb-0 min-w-[1000px]">
              <thead>
                <tr className="bg-[var(--color-teal-500)] border-none">
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">
                    {t("finance:posted_date")}
                  </th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:direction")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:party")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:bank_name")}</th>
                  <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:amount")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:reference")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:allocation")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                    {t("created_by")}
                  </th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                    {t("updated_by")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                    >
                      <td className="px-4 py-4 align-middle pl-6 whitespace-nowrap">{row.date ? new Date(row.date).toLocaleDateString() : ""}</td>
                      <td className="px-4 py-4 align-middle">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            row.direction === "receipt"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                          }`}
                        >
                          {row.direction === "receipt" ? t("finance:receipt") : t("finance:disbursement")}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle">{row.party || "—"}</td>
                      <td className="px-4 py-4 align-middle">{row.bankAccountName || "—"}</td>
                      <td
                        className={`px-4 py-4 align-middle text-end tabular-nums font-medium ${
                          row.direction === "receipt" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {row.direction === "receipt" ? "+" : "-"}{formatAmount(row.amount)}
                      </td>
                      <td className="px-4 py-4 align-middle font-mono text-xs">{row.reference || "—"}</td>
                      <td className="px-4 py-4 align-middle text-xs">
                        {row.billId ? (
                          <Link to={`/finance/payable/${row.billId}`} className="text-teal-700 hover:underline dark:text-teal-400">{allocationLabel(row)}</Link>
                        ) : (
                          allocationLabel(row)
                        )}
                      </td>
                      <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "created") || ""}>
                        {labelOf(row, "created") || "—"}
                      </td>
                      <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "updated") || ""}>
                        {labelOf(row, "updated") || "—"}
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

export default Payments;
