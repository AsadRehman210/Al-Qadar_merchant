import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { FiX } from "react-icons/fi";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import Table from "components/Table";
import { tableRows, salePaymentStatusBadge, saleDeliveryStatusBadge, customerDeliveryStatusFilterOptions, salePaymentStatusFilterOptions } from "global/constant";
import { fetchCustomerInvoices, showCustomerInvoices, showCustomerInvoicesTotal, showSalesCustomerTabLoading } from "store/slices/salesCustomerSlice";
import InvoicePreviewModal from "../../Sales/InvoicePreviewModal";
import { DateRangePicker } from "components/DateRangePicker";
import TableState from "components/TableState";

const toIsoDate = (d) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10) : undefined);

const OrdersInvoicesTab = ({ customer }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const invoices = useSelector(showCustomerInvoices);
  const total = useSelector(showCustomerInvoicesTotal);
  const loading = useSelector(showSalesCustomerTabLoading);
  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  const [page, setPage] = useState(1);
  const [selRows, setSelRows] = useState(tableRows[0]);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selDelivery, setSelDelivery] = useState(customerDeliveryStatusFilterOptions[0]);
  const [selPayment, setSelPayment] = useState(salePaymentStatusFilterOptions[0]);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  // Every filter is applied server-side via the query string, never
  // client-side over an already-fetched page — so pagination and filters
  // stay correct together.
  useEffect(() => {
    if (!customer?.id) return;
    dispatch(
      fetchCustomerInvoices({
        id: customer.id,
        page,
        limit: selRows.id,
        fromDate: toIsoDate(dateRange.from),
        toDate: toIsoDate(dateRange.to),
        amount: amount !== "" ? amount : undefined,
        invoiceNumber: invoiceNumber || undefined,
        deliveryStatus: selDelivery.id || undefined,
        paymentStatus: selPayment.id || undefined,
      }),
    );
  }, [dispatch, customer?.id, page, selRows, dateRange, amount, invoiceNumber, selDelivery, selPayment]);

  const totalPages = useMemo(() => Math.ceil((total || 0) / selRows.id) || 1, [total, selRows]);

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setAmount("");
    setInvoiceNumber("");
    setSelDelivery(customerDeliveryStatusFilterOptions[0]);
    setSelPayment(salePaymentStatusFilterOptions[0]);
    setPage(1);
  };

  if (!customer) return null;

  const hasActiveFilters = !!(dateRange.from || dateRange.to || amount !== "" || invoiceNumber || selDelivery.id || selPayment.id);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h4 className="font-semibold text-slate-900 dark:text-white">
          {t("customers:invoices")}
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
        <div className="w-44">
          <SelectDropdown
            data={customerDeliveryStatusFilterOptions}
            selected={selDelivery}
            setSelected={(o) => { setSelDelivery(o || customerDeliveryStatusFilterOptions[0]); setPage(1); }}
            hideClear
            classes="!h-10 !rounded-md"
          />
        </div>
        <div className="w-44">
          <SelectDropdown
            data={salePaymentStatusFilterOptions}
            selected={selPayment}
            setSelected={(o) => { setSelPayment(o || salePaymentStatusFilterOptions[0]); setPage(1); }}
            hideClear
            classes="!h-10 !rounded-md"
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
                {t("customers:invoice_number")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("customers:invoice_date")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("customers:amount")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("customers:returned")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("customers:net_amount")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("sales:payment_status")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white">
                {t("sales:delivery_status")}
              </th>
              <th className="px-4 py-3 text-start font-semibold text-slate-900 dark:text-white w-16">
                {t("customers:view_invoice")}
              </th>
            </tr>
          </thead>
          <tbody>
            <TableState loading={loading} data={invoices} colSpan={8}>
            {invoices.length > 0 ? (
              invoices.map((inv) => {
                const payStatus = inv.paymentStatus === "Cleared" ? "Paid" : inv.paymentStatus || "Pending";
                const deliveryStatus = inv.deliveryStatus || "Pending";
                const returned = Number(inv.creditedAmount) || 0;
                const net = (Number(inv.total) || 0) - returned;
                return (
                  <tr
                    key={inv.id}
                    className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                      {inv.date ? String(inv.date).slice(0, 10) : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                      {formatAmount(inv.total)} {customer.currency || "SAR"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                      {returned ? `${formatAmount(returned)} ${customer.currency || "SAR"}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                      {formatAmount(net)} {customer.currency || "SAR"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          salePaymentStatusBadge[payStatus] || salePaymentStatusBadge.Pending
                        }`}
                      >
                        {payStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          saleDeliveryStatusBadge[deliveryStatus] || saleDeliveryStatusBadge.Pending
                        }`}
                      >
                        {deliveryStatus === "InTransit" ? t("sales:in_transit") : deliveryStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setPreviewInvoice(inv)}
                        className="text-slate-500 dark:text-white/70 hover:text-teal-600 dark:hover:text-teal-300"
                        title={t("customers:view_invoice")}
                      >
                        <HiOutlineDocumentText className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-slate-500 dark:text-white/60"
                >
                  {t("no_record_found")}
                </td>
              </tr>
            )}
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

      <InvoicePreviewModal
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
      />
    </div>
  );
};

export default OrdersInvoicesTab;
