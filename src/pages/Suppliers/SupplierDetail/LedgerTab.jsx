import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import Table from "components/Table";
import {
  fetchSupplierLedger,
  showSupplierLedger,
  showSupplierLedgerTotal,
  showSupplierLedgerOpeningBalance,
} from "store/slices/supplierSlice";

const LIMIT = 10;

/** A single chronological statement of every purchase invoice (debit —
 *  increases what's owed to the supplier) and every payment (credit —
 *  reduces it), oldest first, with a running balance — served by its own
 *  dedicated, paginated ledger endpoint (the running balance is computed
 *  once, server-side, off the complete history), not derived here off the
 *  Supply Invoices tab's own data. */
const LedgerTab = ({ supplier }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const entries = useSelector(showSupplierLedger);
  const total = useSelector(showSupplierLedgerTotal);
  const openingBalance = useSelector(showSupplierLedgerOpeningBalance);
  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  const [page, setPage] = useState(1);

  useEffect(() => {
    if (supplier?.id) dispatch(fetchSupplierLedger({ id: supplier.id, page, limit: LIMIT }));
  }, [dispatch, supplier?.id, page]);

  const totalPages = useMemo(() => Math.ceil((total || 0) / LIMIT) || 1, [total]);

  if (!supplier) return null;

  return (
    <div>
      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
        {t("suppliers:ledger")}
      </h4>
      <p className="text-sm text-slate-500 dark:text-white/60 mb-4">
        {t("suppliers:ledger_desc")}
      </p>
      <Table>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-white/10">
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("suppliers:ledger_date")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("suppliers:ledger_type")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("suppliers:ledger_reference")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("suppliers:ledger_debit")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("suppliers:ledger_credit")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("suppliers:ledger_running_balance")}
              </th>
            </tr>
          </thead>
          <tbody>
            {page === 1 && (
              <tr className="border-t border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/5">
                <td className="px-4 py-3 text-slate-500 dark:text-white/60" colSpan={5}>
                  {t("suppliers:ledger_opening_balance")}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  {formatAmount(openingBalance)} {supplier.currency || "SAR"}
                </td>
              </tr>
            )}
            {entries.length > 0 ? (
              entries.map((e) => (
                <tr key={e.id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                    {e.date ? String(e.date).slice(0, 10) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        e.type === "Invoice"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                      }`}
                    >
                      {e.type === "Invoice" ? t("suppliers:ledger_invoice") : t("suppliers:ledger_payment")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-white/90">{e.reference || "-"}</td>
                  <td className="px-4 py-3 text-rose-600 dark:text-rose-400">
                    {e.debit ? `${formatAmount(e.debit)} ${supplier.currency || "SAR"}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">
                    {e.credit ? `${formatAmount(e.credit)} ${supplier.currency || "SAR"}` : "-"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {formatAmount(e.runningBalance)} {supplier.currency || "SAR"}
                  </td>
                </tr>
              ))
            ) : (
              page === 1 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500 dark:text-white/60"
                  >
                    {t("suppliers:ledger_empty")}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </Table>

      <div className="pagination mt-5 flex justify-end [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white">
        <ReactPaginate
          breakLabel="..."
          nextLabel={<FaAngleRight />}
          previousLabel={<FaAngleLeft />}
          onPageChange={(e) => setPage(e.selected + 1)}
          pageRangeDisplayed={3}
          marginPagesDisplayed={1}
          pageCount={totalPages}
          forcePage={page - 1}
          renderOnZeroPageCount={null}
          containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
        />
      </div>
    </div>
  );
};

export default LedgerTab;
