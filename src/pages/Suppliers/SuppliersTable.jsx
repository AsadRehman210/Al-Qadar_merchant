import { useRef } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { FiEye } from "react-icons/fi";
import { toast } from "react-toastify";
import ActionPopup from "components/ActionPopup";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SelectDropdown from "components/SelectDropdown";
import TableState from "components/TableState";
import Table from "components/Table";
import { tableRows } from "global/constant";
import { deleteSupplier } from "store/slices/supplierSlice";

const SuppliersTable = ({ data, loading, page = 1, setPage, selRows, setSelRows, totalPages, onDeleted }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const popupRef = useRef();

  const list = data || [];

  const handlePageClick = (event) => setPage?.(event.selected + 1);

  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  const getStatusClass = (status) => {
    const map = {
      Active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
      Inactive: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
      Suspended: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    };
    return map[status] || "bg-slate-100 text-slate-700 dark:bg-slate-500/20";
  };

  const onDelete = (row) => popupRef.current?.openModal?.(row);
  const onConfirmDelete = async (row) => {
    try {
      const deleted = await dispatch(deleteSupplier(row.id)).unwrap();
      await onDeleted?.();
      toast.success(deleted.message);
    } catch (err) {
      toast.error(err);
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
                  {t("suppliers:name")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("suppliers:email")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("suppliers:phone")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("suppliers:supplier_type")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("suppliers:balance_due")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("suppliers:status")}
                </th>
                <th className="w-[140px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">
                  {t("suppliers:actions")}
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
                    <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 pl-6 font-semibold">
                      <p className="font-semibold text-slate-900 dark:text-white">{row.name}</p>
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">{row.email || "-"}</td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">{row.phone || "-"}</td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">{row.supplierType || "-"}</td>
                    <td className="px-4 py-4 align-middle text-rose-600 dark:text-rose-400 font-medium">
                      {formatAmount(row.currentBalance)} SAR
                    </td>
                    <td className="px-4 py-4 align-middle">
                      {row.status ? (
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(row.status)}`}>
                          {row.status}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle pr-6">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/suppliers/detail/${row.id}`}
                          className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                          title={t("suppliers:view")}
                        >
                          <FiEye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/suppliers/edit/${row.id}`}
                          className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                          title={t("suppliers:edit")}
                        >
                          <AiOutlineEdit className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          className="text-slate-500 dark:text-white/80 transition-all hover:text-red-600 dark:hover:text-red-400"
                          title={t("suppliers:delete")}
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
        title={t("suppliers:delete_supplier")}
        description={t("suppliers:confirm_delete_supplier")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={onConfirmDelete}
      />
    </>
  );
};

export default SuppliersTable;
