import { useRef } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { FiEye } from "react-icons/fi";
import { toast } from "react-toastify";
import ActionPopup from "components/ActionPopup";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SelectDropdown from "components/SelectDropdown";
import TableState from "components/TableState";
import Table from "components/Table";
import { tableRows } from "global/constant";
import { deleteProductionOrder } from "store/slices/productionSlice";

const fmtNum = (n) => (n == null || n === "") ? "—" : Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

const statusLabel = (status, t) => {
  const map = {
    Draft: "production:st_draft",
    InProgress: "production:st_in_progress",
    Completed: "production:st_completed",
    Cancelled: "production:st_cancelled",
  };
  const key = map[status];
  return key ? t(key) : status;
};

const getStatusClass = (status) => {
  const map = {
    Draft: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
    InProgress: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
    Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    Cancelled: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  };
  return map[status] || "bg-slate-100 text-slate-700 dark:bg-slate-500/20";
};

const ProductionTable = ({ data, loading, page = 1, setPage, selRows, setSelRows, totalPages, onDeleted }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const popupRef = useRef();

  const list = data || [];

  const handlePageClick = (event) => setPage?.(event.selected + 1);
  const onDelete = (row) => popupRef.current?.openModal?.(row);
  const onConfirmDelete = async (row) => {
    try {
      await dispatch(deleteProductionOrder(row.id)).unwrap();
      await onDeleted?.();
      toast.success(t("production:delete_success"));
    } catch (err) {
      toast.error(err || t("production:delete_failed"));
    }
    popupRef.current?.closeModal?.();
  };

  return (
    <>
      <Table className="overflow-hidden">
        <div className="min-w-[1000px]">
          <table className="w-full border-collapse text-sm mb-0">
            <thead>
              <tr className="bg-[var(--color-teal-500)] border-none">
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">
                  {t("production:order_number")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("product:variant_name")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("production:output_quantity")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("production:scheduled_date")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("production:status")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("production:batch_unit_cost")}
                </th>
                <th className="w-[160px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">
                  {t("product:actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              <TableState loading={loading} data={list} colSpan={7}>
                {list.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                  >
                    <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 pl-6 font-semibold whitespace-nowrap">
                      {row.orderNumber}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 max-w-[220px] truncate">
                      {row.outputVariantName || "—"}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 tabular-nums">
                      {row.outputQuantity ?? "—"}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap">
                      {row.scheduledDate ? row.scheduledDate.slice(0, 10) : "—"}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(row.status)}`}
                      >
                        {statusLabel(row.status, t)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 tabular-nums">
                      {fmtNum(row.unitCost)}
                    </td>
                    <td className="px-4 py-4 align-middle pr-6">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/inventory/production/detail/${row.id}`}
                          className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                          title={t("view")}
                        >
                          <FiEye className="h-4 w-4" />
                        </Link>
                        {row.status === "Draft" && (
                          <Link
                            to={`/inventory/production/edit/${row.id}`}
                            className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                            title={t("edit")}
                          >
                            <AiOutlineEdit className="h-4 w-4" />
                          </Link>
                        )}
                        {row.status === "Draft" && (
                          <button
                            type="button"
                            onClick={() => onDelete(row)}
                            className="text-slate-500 dark:text-white/80 transition-all hover:text-red-600 dark:hover:text-red-400"
                            title={t("delete")}
                          >
                            <AiOutlineDelete className="h-4 w-4" />
                          </button>
                        )}
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
        title={t("production:delete_order")}
        description={t("production:confirm_delete")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={onConfirmDelete}
      />
    </>
  );
};

export default ProductionTable;
