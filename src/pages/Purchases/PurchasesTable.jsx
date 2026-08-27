import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { FiEye } from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi2";
import ActionPopup from "components/ActionPopup";
import PurchaseInvoicePreviewModal from "./PurchaseInvoicePreviewModal";
import TableState from "components/TableState";
import Table from "components/Table";
import SelectDropdown from "components/SelectDropdown";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { paymentStatusBadge, tableRows } from "global/constant";

const PurchasesTable = ({
  data,
  loading,
  page = 1,
  setPage,
  selRows,
  setSelRows,
  totalPages = 1,
  onDeleteConfirmed,
}) => {
  const { t } = useTranslation();
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [rowToDelete, setRowToDelete] = useState(null);
  const popupRef = useRef();

  const list = data || [];

  const handlePageClick = (event) => setPage?.(event.selected + 1);

  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  const getStatusClass = (status) => {
    const map = {
      Draft: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
      Ordered: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
      Transit: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
      Received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    };
    return map[status] || "bg-slate-100 text-slate-700 dark:bg-slate-500/20";
  };

  const onDelete = (row) => { setRowToDelete(row); popupRef.current?.openModal?.(row); };
  const onConfirmDelete = async () => {
    if (!rowToDelete) return;
    try {
      await onDeleteConfirmed?.(rowToDelete);
      toast.success(t("purchase:delete_invoice"));
    } catch (err) {
      toast.error(err?.message || err || "");
    }
    popupRef.current?.closeModal?.();
    setRowToDelete(null);
  };

  return (
    <>
      <Table className="overflow-hidden">
        <div className="min-w-[1000px]">
          <table className="w-full border-collapse text-sm mb-0">
            <thead>
              <tr className="bg-[var(--color-teal-500)] border-none">
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">
                  {t("purchase:invoice_number")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("purchase:supplier")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("purchase:date")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("purchase:receiver_name")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("purchase:total")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("purchase:amount_paid")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("purchase:balance_due")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("purchase:payment_status")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("purchase:status")}
                </th>
                <th className="w-[180px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">
                  {t("customers:actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              <TableState loading={loading} data={list} colSpan={10}>
              {list.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                >
                  <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 pl-6 font-semibold">
                    {row.invoiceNumber}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                    {row.supplierName}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                    {String(row.date).slice(0, 10)}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                    {row.receiverName || "—"}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 font-medium">
                    {formatAmount(row.total)} {row.currency || "SAR"}
                  </td>
                  <td className="px-4 py-4 align-middle text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatAmount(row.paidAmount)} {row.currency || "SAR"}
                  </td>
                  <td className="px-4 py-4 align-middle font-medium">
                    <span className={(Number(row.balanceDue) || 0) > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-white/90"}>
                      {formatAmount(row.balanceDue)} {row.currency || "SAR"}
                    </span>
                    {(Number(row.debitedAmount) || 0) > 0 && (
                      <p className="text-[11px] text-teal-600 dark:text-teal-400 font-normal mt-0.5">
                        {t("purchase:debited_amount", { defaultValue: "Returned" })}: {formatAmount(row.debitedAmount)}
                      </p>
                    )}
                    {(Number(row.refundDue) || 0) > 0 && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-normal mt-0.5">
                        {t("purchase:refund_due", { defaultValue: "Refund due" })}: {formatAmount(row.refundDue)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${paymentStatusBadge[row.paymentStatus] || paymentStatusBadge.Pending}`}
                    >
                      {row.paymentStatus === "Cleared" ? "Paid" : row.paymentStatus || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                    {(Number(row.taxAmount) || 0) > 0 && (
                      <p className={`text-[11px] font-normal mt-1 ${row.taxRecoverable === false ? "text-slate-400 dark:text-white/40" : "text-teal-600 dark:text-teal-400"}`}>
                        {row.taxRecoverable === false
                          ? t("purchase:tax_non_recoverable", { defaultValue: "Tax non-recoverable" })
                          : t("purchase:tax_recoverable_tag", { defaultValue: "Tax recoverable" })}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 align-middle pr-6">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/purchases/detail/${row.id}`}
                        className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                        title={t("customers:view")}
                      >
                        <FiEye className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPreviewInvoice(row)}
                        className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                        title={t("purchase:preview_invoice")}
                      >
                        <HiOutlineDocumentText className="h-4 w-4" />
                      </button>
                      <Link
                        to={`/purchases/edit/${row.id}`}
                        className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                        title={t("customers:edit")}
                      >
                        <AiOutlineEdit className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="text-slate-500 dark:text-white/80 transition-all hover:text-red-600 dark:hover:text-red-400"
                        title={t("customers:delete")}
                      >
                        <AiOutlineDelete className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </TableState>
            </tbody>
          </table>
        </div>
      </Table>

      <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white [&_.pagination_li_a:hover]:!text-teal-600 [&_.pagination_li_a:hover]:!bg-teal-50 dark:[&_.pagination_li_a:hover]:!border-teal-500 dark:[&_.pagination_li_a:hover]:!text-teal-300 dark:[&_.pagination_li_a:hover]:!bg-teal-500/20">
        <div className="flex items-center gap-4">
          <SelectDropdown
            data={tableRows}
            selected={selRows}
            setSelected={setSelRows}
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

      <ActionPopup
        ref={popupRef}
        title={t("purchase:delete_invoice")}
        description={t("purchase:confirm_delete")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={onConfirmDelete}
      />

      <PurchaseInvoicePreviewModal
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
      />
    </>
  );
};

export default PurchasesTable;
