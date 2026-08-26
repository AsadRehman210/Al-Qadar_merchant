import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { FiX } from "react-icons/fi";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import Table from "components/Table";
import { tableRows } from "global/constant";
import { fetchCustomerPayments, showCustomerPayments, showCustomerPaymentsTotal } from "store/slices/salesCustomerSlice";
import { DateRangePicker } from "components/DateRangePicker";

const toIsoDate = (d) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10) : undefined);

const PaymentHistoryTab = ({ customer }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const paymentHistory = useSelector(showCustomerPayments);
  const total = useSelector(showCustomerPaymentsTotal);
  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  const [page, setPage] = useState(1);
  const [selRows, setSelRows] = useState(tableRows[0]);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  useEffect(() => {
    if (!customer?.id) return;
    dispatch(
      fetchCustomerPayments({
        id: customer.id,
        page,
        limit: selRows.id,
        fromDate: toIsoDate(dateRange.from),
        toDate: toIsoDate(dateRange.to),
        amount: amount !== "" ? amount : undefined,
        invoiceNumber: invoiceNumber || undefined,
      }),
    );
  }, [dispatch, customer?.id, page, selRows, dateRange, amount, invoiceNumber]);

  const totalPages = useMemo(() => Math.ceil((total || 0) / selRows.id) || 1, [total, selRows]);

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setAmount("");
    setInvoiceNumber("");
    setPage(1);
  };

  if (!customer) return null;

  const hasActiveFilters = !!(dateRange.from || dateRange.to || amount !== "" || invoiceNumber);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h4 className="font-semibold text-slate-900 dark:text-white">
          {t("customers:payment_history")}
        </h4>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-3 mb-4 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5">
        <div className="w-72">
          <DateRangePicker
            // The pasted component's placeholder styling (`text-muted-foreground`)
            // is gated on `!value` — the whole DateRange object, not `!value?.from`
            // — so an empty-but-truthy `{ from: undefined, to: undefined }` would
            // never read as "empty" to it. Passing `undefined` outright when
            // nothing's picked yet is what actually triggers its own placeholder color.
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
                {t("customers:payment_date")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("customers:amount")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("customers:payment_method")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("customers:reference")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("customers:invoice_number")}
              </th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.length > 0 ? (
              paymentHistory.map((pay, idx) => (
                <tr
                  key={`${pay.invoiceId}-${idx}`}
                  className="border-t border-slate-100 dark:border-white/5"
                >
                  <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                    {pay.date ? String(pay.date).slice(0, 10) : "-"}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {formatAmount(pay.amount)} {customer.currency || "SAR"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                    {pay.method || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                    {pay.reference || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                    {pay.invoiceNumber || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500 dark:text-white/60"
                >
                  {t("no_record_found")}
                </td>
              </tr>
            )}
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
    </div>
  );
};

export default PaymentHistoryTab;
