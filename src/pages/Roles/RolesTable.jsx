import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { toast } from "react-toastify";
import SelectDropdown from "components/SelectDropdown";
import TableState from "components/TableState";
import Table from "components/Table";
import ActionPopup from "components/ActionPopup";
import { tableRows } from "global/constant";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { deleteRole } from "store/slices/roleSlice";

const { edit_role, delete_role } = alqadar_role_ids;

const RolesTable = ({ data, loading, page = 1, setPage, selRows, setSelRows, totalPages, onChanged }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const popup = useRef();
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const list = data || [];

  const askDelete = (row) => {
    setTarget(row);
    popup.current?.openModal();
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await dispatch(deleteRole(target.id)).unwrap();
      toast.success(t("deleted_successfully"));
      onChanged?.();
    } catch (e) {
      toast.error(e || t("something_went_wrong"));
    } finally {
      setDeleting(false);
      setTarget(null);
      popup.current?.closeModal();
    }
  };

  return (
    <>
      <Table className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-teal-500)] border-none">
              <th className="px-4 py-4 text-start font-semibold text-white/95 pl-6 rounded-tl-md">{t("role")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95">{t("permissions")}</th>
              <th className="px-4 py-4 text-center font-semibold text-white/95">{t("users")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95">{t("status")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 pr-6 rounded-tr-md">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            <TableState loading={loading} data={list} colSpan={5}>
              {list.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors last:[&_td]:border-b-0"
                >
                  <td className="px-4 py-4 align-middle pl-6">
                    <div className="font-medium dark:text-white">{row.role_name}</div>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300">
                      {(row.permissions || []).length} {t("permissions")}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle text-center tabular-nums text-slate-600 dark:text-white/70">
                    {row.userCount ?? 0}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        row.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {row.status === "active" ? t("active") : t("inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle pr-6">
                    <div className="flex items-center gap-3">
                      {checkRoleAuth(edit_role) && (
                        <button
                          onClick={() => navigate(`/roles/edit/${row.id}`)}
                          className="text-slate-400 hover:text-teal-600 transition-colors"
                          title={t("edit")}
                        >
                          <AiOutlineEdit className="h-4 w-4" />
                        </button>
                      )}
                      {checkRoleAuth(delete_role) && (
                        <button
                          onClick={() => askDelete(row)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
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
      </Table>

      <div className="flex items-center flex-wrap gap-4 p-4 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white">
        <div className="flex items-center gap-4">
          <SelectDropdown data={tableRows} selected={selRows} setSelected={setSelRows} hideClear classes="!h-10 !rounded-lg" />
          <span className="whitespace-nowrap">{t("per_page")}</span>
        </div>
        <div className="pagination ltr:ml-auto rtl:mr-auto">
          <Pagination
            breakLabel="..."
            nextLabel={<FaAngleRight />}
            previousLabel={<FaAngleLeft />}
            onPageChange={(e) => setPage?.(e.selected + 1)}
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
        ref={popup}
        title={t("delete_role")}
        description={t("delete_role_confirmation")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={confirmDelete}
        loading={deleting}
      />
    </>
  );
};

export default RolesTable;
