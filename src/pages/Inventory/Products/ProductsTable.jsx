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
import { deleteProduct } from "store/slices/productSlice";
import { labelOf } from "components/AuditMeta";

const formatTs = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const ProductsTable = ({ data, loading, page = 1, setPage, selRows, setSelRows, totalPages, onDeleted }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const popupRef = useRef();

  const list = data || [];

  const handlePageClick = (event) => setPage?.(event.selected + 1);

  const onDelete = (row) => popupRef.current?.openModal?.(row);
  const onConfirmDelete = async (row) => {
    try {
      await dispatch(deleteProduct(row.id)).unwrap();
      await onDeleted?.();
      toast.success(t("product:delete_success"));
    } catch (err) {
      toast.error(err || t("product:delete_failed"));
    }
    popupRef.current?.closeModal?.();
  };

  return (
    <>
      <Table className="overflow-hidden">
        <div className="min-w-[900px]">
          <table className="w-full border-collapse text-sm mb-0">
            <thead>
              <tr className="bg-[var(--color-teal-500)] border-none">
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">
                  {t("product:product_name")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("product:category")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("product:product_type")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("product:stock_title")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("product:updated_at")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("created_by")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("updated_by")}
                </th>
                <th className="w-[120px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">
                  {t("product:actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              <TableState loading={loading} data={list} colSpan={8}>
                {list.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                  >
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 font-medium max-w-[220px] truncate pl-6">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {row.productName}
                        {row.productType === "Raw Material" && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                            {t("product:raw_material")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                      {row.categoryName || "—"}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap">
                      {row.productType === "Raw Material"
                        ? t("product:raw_material")
                        : t("product:finished_product")}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap">
                      {!row.variantCount ? (
                        <Link
                          to="/inventory/variants/add"
                          className="text-xs font-normal text-teal-600 dark:text-teal-300 hover:underline"
                        >
                          {t("product:see_variants_hint")}
                        </Link>
                      ) : (
                        <>
                          <span className="font-medium tabular-nums">{(row.totalStock || 0).toLocaleString()}</span>
                          <span className="text-xs text-slate-400 dark:text-white/40">
                            {" "}· {t("product:n_variants", { count: row.variantCount })}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-500 dark:text-white/70 text-xs whitespace-nowrap">
                      {formatTs(row.updatedAt)}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "created") || ""}>
                      {labelOf(row, "created") || "—"}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "updated") || ""}>
                      {labelOf(row, "updated") || "—"}
                    </td>
                    <td className="px-4 py-4 align-middle pr-6">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/inventory/products/detail/${row.id}`}
                          className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                          title={t("view")}
                        >
                          <FiEye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/inventory/products/edit/${row.id}`}
                          className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                          title={t("edit")}
                        >
                          <AiOutlineEdit className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          className="text-slate-500 dark:text-white/80 transition-all hover:text-red-600 dark:hover:text-red-400"
                          title={t("delete")}
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
        title={t("product:delete_product")}
        description={t("product:confirm_delete_product")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={onConfirmDelete}
      />
    </>
  );
};

export default ProductsTable;
