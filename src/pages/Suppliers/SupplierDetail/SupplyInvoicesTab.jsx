import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { FiX } from "react-icons/fi";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import Table from "components/Table";
import { tableRows } from "global/constant";
import { fetchSupplierInvoices, showSupplierInvoices, showSupplierInvoicesTotal, showSupplierTabLoading } from "store/slices/supplierSlice";
import { DateRangePicker } from "components/DateRangePicker";
import TableState from "components/TableState";

const toIsoDate = (d) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10) : undefined);

const SupplyInvoicesTab = ({ supplier }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const invoices = useSelector(showSupplierInvoices);
  const total = useSelector(showSupplierInvoicesTotal);
  const loading = useSelector(showSupplierTabLoading);
  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  const [page, setPage] = useState(1);
  const [selRows, setSelRows] = useState(tableRows[0]);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  useEffect(() => {
    if (!supplier?.id) return;
    dispatch(
      fetchSupplierInvoices({
        id: supplier.id,
        page,
        limit: selRows.id,
        fromDate: toIsoDate(dateRange.from),
        toDate: toIsoDate(dateRange.to),
        amount: amount !== "" ? amount : undefined,
        invoiceNumber: invoiceNumber || undefined,
      }),
    );
  }, [dispatch, supplier?.id, page, selRows, dateRange, amount, invoiceNumber]);

  const totalPages = useMemo(() => Math.ceil((total || 0) / selRows.id) || 1, [total, selRows]);

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setAmount("");
    setInvoiceNumber("");
    setPage(1);
  };

  if (!supplier) return null;

  const hasActiveFilters = !!(dateRange.from || dateRange.to || amount !== "" || invoiceNumber);

  return (
    <div>
      <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
        {t("suppliers:supply_orders")}
      </h4>

      <div className="flex flex-wrap items-center gap-3 p-3 mb-4 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5">
        <div className="w-72">
          <DateRangePicker
            value={dateRange.from || dateRange.to ? dateRange : undefined}
            onChange={(range) => { setDateRange(range || { from: undefined, to: undefined }); setPage(1); }}
            numberOfMonths={1}
          />
        </div>
        <div className="w-36">
          <SearchInput
            onSearch={(v) => { setAmount(v); setPage(1); }}
            initialValue={amount}
            placeholder={t("customers:filter_by_amount")}
            inputProps={{ type: "number" }}
          />
        </div>
        <div className="w-48">
          <SearchInput
            onSearch={(v) => { setInvoiceNumber(v); setPage(1); }}
            initialValue={invoiceNumber}
            placeholder={t("customers:filter_by_invoice")}
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 h-10 px-3 rounded-md text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 ml-auto"
          >
            <FiX className="h-3.5 w-3.5" /> {t("customers:clear_filters")}
          </button>
        )}
      </div>

      <Table>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 dark:bg-white/10">
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("suppliers:po_number")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("customers:invoice_date")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("customers:amount")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("suppliers:returned")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("suppliers:net_amount")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("customers:invoice_status")}
              </th>
            </tr>
          </thead>
          <tbody>
            <TableState loading={loading} data={invoices} colSpan={6}>
              {invoices.map((inv) => {
                const status = inv.paymentStatus === "Cleared" ? "Paid" : inv.paymentStatus || "Pending";
                const returned = Number(inv.debitedAmount) || 0;
                const net = (Number(inv.total) || 0) - returned;
                return (
                  <tr
                    key={inv.id}
                    className="border-t border-slate-100 dark:border-white/5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                    onClick={() => navigate(`/purchases/detail/${inv.id}`)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                      {inv.date ? String(inv.date).slice(0, 10) : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                      {formatAmount(inv.total)} {supplier.currency || "SAR"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                      {returned ? `${formatAmount(returned)} ${supplier.currency || "SAR"}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                      {formatAmount(net)} {supplier.currency || "SAR"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          status === "Paid"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </TableState>
          </tbody>
        </table>
      </Table>

      <div className="flex items-center flex-wrap gap-4 mt-5 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white">
        <div className="flex items-center gap-4">
          <SelectDropdown
            data={tableRows}
            selected={selRows}
            setSelected={(v) => { setSelRows(v); setPage(1); }}
            hideClear
            classes="!h-10 !rounded-md"
          />
          <span className="whitespace-nowrap">{t("per_page")}</span>
        </div>
        <div className="pagination ltr:ml-auto rtl:mr-auto">
          <Pagination
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
    </div>
  );
};

export default SupplyInvoicesTab;
