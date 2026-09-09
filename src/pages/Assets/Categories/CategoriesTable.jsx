import { useState, useRef } from "react";
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
import { tableRows } from "global/constant";
import { deleteAssetCategory } from "store/slices/assetSlice";
import { SkeletonTable } from "components/Skeleton";
import EmptyState from "components/EmptyState";

const getStatusClass = (status) =>
  status === "Active"
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
    : "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300";

// `data` is already the server's one page — pagination itself (page/limit)
// is owned by the parent (AssetCategories).
const CategoriesTable = ({ data, loading, page = 1, setPage, selRows, setSelRows, totalPages = 1 }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const popupRef = useRef();
  const [deleting, setDeleting] = useState(null);

  const paginatedList = data || [];

  const handlePageClick = (event) => setPage?.(event.selected + 1);
  const onDelete = (row) => {
    setDeleting(row);
    popupRef.current?.openModal?.(row);
  };
  const onConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await dispatch(deleteAssetCategory(deleting.id)).unwrap();
      toast.success(t("asset:category_deleted"));
    } catch (message) {
      toast.error(message || t("asset:cannot_delete_category_in_use", { count: 1 }));
    }
    popupRef.current?.closeModal?.();
    setDeleting(null);
  };

  return (
    <>
      <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
        <div className="min-w-[900px]">
          <table className="w-full border-collapse text-sm mb-0">
            <thead>
              <tr className="bg-[var(--color-teal-500)] border-none">
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-2xl">
                  {t("asset:code")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("asset:category_name")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap max-w-[280px]">
                  {t("asset:description")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("asset:status")}
                </th>
                <th className="w-[140px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-2xl">
                  {t("product:actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTable rows={6} columns={5} />
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <EmptyState title={t("asset:list_empty_cat")} />
                  </td>
                </tr>
              ) : null}
              {!loading && paginatedList.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                >
                  <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 pl-6 font-semibold whitespace-nowrap">
                    {row.code}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                    {row.name}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-500 dark:text-white/70 text-xs max-w-[280px] truncate">
                    {row.description || "—"}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(row.status)}`}
                    >
                      {row.status === "Active"
                        ? t("asset:active")
                        : t("asset:inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle pr-6">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/assets-categories/detail/${row.id}`}
                        className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                        title={t("view")}
                      >
                        <FiEye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/assets-categories/edit/${row.id}`}
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
            </tbody>
          </table>
        </div>
      </div>

      {paginatedList.length > 0 && (
        <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white [&_.pagination_li_a:hover]:!text-teal-600 [&_.pagination_li_a:hover]:!bg-teal-50 dark:[&_.pagination_li_a:hover]:!border-teal-500 dark:[&_.pagination_li_a:hover]:!text-teal-300 dark:[&_.pagination_li_a:hover]:!bg-teal-500/20">
          <div className="flex items-center gap-4">
            <SelectDropdown
              data={tableRows}
              selected={selRows}
              setSelected={(newVal) => setSelRows?.(newVal)}
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
      )}

      <ActionPopup
        ref={popupRef}
        title={t("asset:delete_category")}
        description={t("asset:confirm_delete_category")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={onConfirmDelete}
      />
    </>
  );
};

export default CategoriesTable;
