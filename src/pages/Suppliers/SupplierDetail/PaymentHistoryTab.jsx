import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { FiPlus, FiX } from "react-icons/fi";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import FormInput from "components/FormInput";
import Table from "components/Table";
import { purchasePaymentMethodOptions, tableRows } from "global/constant";
import {
  addSupplierOpeningPayment,
  fetchSupplierById,
  fetchSupplierDebitCreditSummary,
  fetchSupplierPayments,
  showSupplierDebitCreditSummary,
  showSupplierPayments,
  showSupplierPaymentsTotal,
  showSupplierTabLoading,
} from "store/slices/supplierSlice";
import { DateRangePicker } from "components/DateRangePicker";
import TableState from "components/TableState";

const toIsoDate = (d) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10) : undefined);

const PaymentHistoryTab = ({ supplier }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const paymentHistory = useSelector(showSupplierPayments);
  const total = useSelector(showSupplierPaymentsTotal);
  const summary = useSelector(showSupplierDebitCreditSummary);
  const loading = useSelector(showSupplierTabLoading);
  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  const [page, setPage] = useState(1);
  const [selRows, setSelRows] = useState(tableRows[0]);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payAmount, setPayAmount] = useState("");
  const [selMethod, setSelMethod] = useState(purchasePaymentMethodOptions[1]);
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const remainingOpening = Number(
    summary?.remainingOpeningBalance ??
      supplier?.remainingOpeningBalance ??
      Math.max(
        0,
        (Number(summary?.openingBalance ?? supplier?.openingBalance) || 0) -
          (Number(summary?.openingBalancePaid ?? supplier?.openingBalancePaid) || 0),
      ),
  );

  const reload = () => {
    if (!supplier?.id) return;
    dispatch(
      fetchSupplierPayments({
        id: supplier.id,
        page,
        limit: selRows.id,
        fromDate: toIsoDate(dateRange.from),
        toDate: toIsoDate(dateRange.to),
        amount: amount !== "" ? amount : undefined,
        invoiceNumber: invoiceNumber || undefined,
      }),
    );
    dispatch(fetchSupplierDebitCreditSummary(supplier.id));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, supplier?.id, page, selRows, dateRange, amount, invoiceNumber]);

  const totalPages = useMemo(() => Math.ceil((total || 0) / selRows.id) || 1, [total, selRows]);

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setAmount("");
    setInvoiceNumber("");
    setPage(1);
  };

  const handleSaveOpeningPayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error(t("suppliers:opening_payment_amount_required"));
      return;
    }
    setSaving(true);
    try {
      const res = await dispatch(
        addSupplierOpeningPayment({
          id: supplier.id,
          data: {
            date: payDate,
            amount: Number(payAmount),
            method: selMethod.id,
            reference,
          },
        }),
      ).unwrap();
      toast.success(res.message || t("suppliers:opening_payment_recorded"));
      setPayAmount("");
      setReference("");
      setShowForm(false);
      dispatch(fetchSupplierById(supplier.id));
      reload();
    } catch (err) {
      toast.error(err?.message || err || "");
    } finally {
      setSaving(false);
    }
  };

  if (!supplier) return null;

  const hasActiveFilters = !!(dateRange.from || dateRange.to || amount !== "" || invoiceNumber);
  const methodOptions = purchasePaymentMethodOptions.map((o) => ({ ...o, title: t(o.title) }));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h4 className="font-semibold text-slate-900 dark:text-white">
          {t("suppliers:payment_history")}
        </h4>
        {remainingOpening > 0 && (
          <Button
            type="button"
            title={t("suppliers:record_opening_payment")}
            icon={FiPlus}
            onClick={() => setShowForm((s) => !s)}
            className="!w-auto !rounded-lg !h-9 !px-3 !border border-teal-400/40 !text-teal-700 dark:!text-teal-300 !bg-teal-50 dark:!bg-teal-500/10"
          />
        )}
      </div>

      {remainingOpening > 0 && showForm && (
        <div className="mb-5 p-4 rounded-2xl border border-teal-200 dark:border-teal-500/30 bg-teal-50/50 dark:bg-teal-500/5">
          <p className="text-xs text-slate-600 dark:text-white/70 mb-3">
            {t("suppliers:opening_payment_remaining_hint", {
              amount: formatAmount(remainingOpening),
            })}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <FormInput
                label={t("customers:payment_date")}
                labelClass="!text-xs"
                name="openingPayDate"
                type="date"
                value={payDate}
                onValueChange={setPayDate}
                inputClass="!h-9 !rounded-lg"
              />
            </div>
            <div className="w-32">
              <FormInput
                label={t("amount")}
                labelClass="!text-xs"
                name="openingPayAmount"
                type="number"
                min={0}
                decimal
                decimalPlaces={3}
                value={payAmount}
                onValueChange={setPayAmount}
                inputClass="!h-9 !rounded-lg"
              />
            </div>
            <div className="w-40">
              <SelectDropdown
                label={t("customers:payment_method")}
                labelClass="!text-xs"
                data={methodOptions}
                selected={selMethod}
                setSelected={(o) => setSelMethod(o || purchasePaymentMethodOptions[1])}
                valueKey="id"
                hideClear
                classes="!h-9 !rounded-lg"
              />
            </div>
            <div>
              <FormInput
                label={t("customers:reference")}
                labelClass="!text-xs"
                name="openingPayRef"
                type="text"
                value={reference}
                onValueChange={setReference}
                inputClass="!h-9 !rounded-lg"
              />
            </div>
            <Button
              type="button"
              title={t("save")}
              btn="primary"
              loading={saving}
              disabled={saving}
              onClick={handleSaveOpeningPayment}
              className="!rounded-md !h-9"
            />
          </div>
        </div>
      )}

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
            <TableState loading={loading} data={paymentHistory} colSpan={5}>
              {paymentHistory.map((pay, idx) => (
                <tr
                  key={`${pay.source || "inv"}-${pay.invoiceId || "ob"}-${idx}`}
                  className="border-t border-slate-100 dark:border-white/5"
                >
                  <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                    {pay.date ? String(pay.date).slice(0, 10) : "-"}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {formatAmount(pay.amount)} {supplier.currency || "SAR"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                    {pay.method}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                    {pay.reference || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-white/90">
                    {pay.source === "opening"
                      ? t("suppliers:opening_balance")
                      : pay.invoiceNumber || "-"}
                  </td>
                </tr>
              ))}
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

export default PaymentHistoryTab;
