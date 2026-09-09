import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { FiEye } from "react-icons/fi";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { toast } from "react-toastify";
import ActionPopup from "components/ActionPopup";
import InvoicePreviewModal from "./InvoicePreviewModal";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SelectDropdown from "components/SelectDropdown";
import TableState from "components/TableState";
import Table from "components/Table";
import { tableRows, salePaymentStatusBadge, saleDeliveryStatusBadge } from "global/constant";
import { deleteSaleInvoice } from "store/slices/saleInvoiceSlice";

const SalesTable = ({ data, loading, page = 1, setPage, selRows, setSelRows, totalPages, onDeleted }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const popupRef = useRef();

  const list = data || [];

  const handlePageClick = (event) => setPage?.(event.selected + 1);

  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  const onDelete = (row) => popupRef.current?.openModal?.(row);
  const onConfirmDelete = async (row) => {
    try {
      await dispatch(deleteSaleInvoice(row.id)).unwrap();
      await onDeleted?.();
      toast.success(t("sales:delete_success"));
    } catch (err) {
      toast.error(err || t("sales:delete_failed"));
    }
    popupRef.current?.closeModal?.();
  };

  return (
    <>
      <Table className="overflow-hidden">
        <div className="min-w-[1120px]">
          <table className="w-full border-collapse text-sm mb-0">
            <thead>
              <tr className="bg-[var(--color-teal-500)] border-none">
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">
                  {t("sales:invoice_number")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("sales:customer")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("sales:date")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("sales:warehouse")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("sales:total")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("sales:balance_due")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("sales:payment_status")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("sales:delivery_status")}
                </th>
                <th className="w-[180px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">
                  {t("customers:actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              <TableState loading={loading} data={list} colSpan={9}>
                {list.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                  >
                    <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 pl-6 font-semibold">
                      {row.invoiceNumber}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">{row.customerName}</td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                      {row.date ? new Date(row.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">{row.warehouseName}</td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 font-medium">
                      {formatAmount(row.total)} {row.currency || "SAR"}
                    </td>
                    <td className="px-4 py-4 align-middle font-medium">
                      <span className={(Number(row.balanceDue) || 0) > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-white/90"}>
                        {formatAmount(row.balanceDue)} {row.currency || "SAR"}
                      </span>
                      {(Number(row.creditedAmount) || 0) > 0 && (
                        <p className="text-[11px] text-teal-600 dark:text-teal-400 font-normal mt-0.5">
                          {t("sales:credited_amount", { defaultValue: "Returned" })}: {formatAmount(row.creditedAmount)}
                        </p>
                      )}
                      {(Number(row.refundDue) || 0) > 0 && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-normal mt-0.5">
                          {t("sales:refund_due", { defaultValue: "Refund due" })}: {formatAmount(row.refundDue)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${salePaymentStatusBadge[row.paymentStatus] || salePaymentStatusBadge.Pending}`}>
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${saleDeliveryStatusBadge[row.deliveryStatus] || saleDeliveryStatusBadge.Pending}`}>
                        {row.deliveryStatus || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle pr-6">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/sales/detail/${row.id}`}
                          className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                          title={t("customers:view")}
                        >
                          <FiEye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPreviewInvoice(row)}
                          className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                          title={t("sales:preview_invoice")}
                        >
                          <HiOutlineDocumentText className="h-4 w-4" />
                        </button>
                        <Link
                          to={`/sales/edit/${row.id}`}
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
            classes="!h-10 !rounded-md"
          />
          <span className="whitespace-nowrap">{t("per_page")}</span>
        </div>
        <div className="pagination ltr:ml-auto rtl:mr-auto">
          <Pagination
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
        title={t("sales:delete_invoice")}
        description={t("sales:confirm_delete")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={onConfirmDelete}
      />

      <InvoicePreviewModal
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
      />
    </>
  );
};

export default SalesTable;
