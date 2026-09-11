import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineEdit, AiOutlineEye, AiOutlineDelete } from "react-icons/ai";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { toast } from "react-toastify";
import SelectDropdown from "components/SelectDropdown";
import StatusDropdown from "components/StatusDropdown";
import TableState from "components/TableState";
import Table from "components/Table";
import ActionPopup from "components/ActionPopup";
import { tableRows, userRoleStatusOptions } from "global/constant";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { showUserData } from "store/slices/uniqueSlice";
import { deleteUser, setUserStatus } from "store/slices/userSlice";
import { labelOf } from "components/AuditMeta";

const { edit_user, delete_user, view_user } = alqadar_role_ids;

const UsersTable = ({ data, loading, page = 1, setPage, selRows, setSelRows, totalPages, onChanged }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userData = useSelector(showUserData);
  const popup = useRef();
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  // Sub-user session: own row is already omitted by API; belt-and-suspenders on FE.
  const selfId = !userData?.is_default_user ? userData?.userId : null;
  const list = (data || []).filter((row) => !selfId || row.id !== selfId);
  const canEdit = checkRoleAuth(edit_user);

  const fullName = (u) => `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.user_name || "—";

  const askDelete = (row) => {
    setTarget(row);
    popup.current?.openModal();
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await dispatch(deleteUser(target.id)).unwrap();
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

  const changeStatus = async (row, opt) => {
    if (!opt?.id || opt.id === row.status) return;
    setStatusLoadingId(row.id);
    try {
      await dispatch(setUserStatus({ id: row.id, active: opt.id === "active" })).unwrap();
    } catch (e) {
      toast.error(e || t("something_went_wrong"));
    } finally {
      setStatusLoadingId(null);
    }
  };

  return (
    <>
      <Table className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-teal-500)] border-none">
              <th className="px-4 py-4 text-start font-semibold text-white/95 pl-6 rounded-tl-md">{t("name")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95">{t("email")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95">{t("role")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95">{t("status")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                {t("created_by")}
              </th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                {t("updated_by")}
              </th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 pr-6 rounded-tr-md">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            <TableState loading={loading} data={list} colSpan={7}>
              {list.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors last:[&_td]:border-b-0"
                >
                  <td className="px-4 py-4 align-middle pl-6 font-medium dark:text-white">{fullName(row)}</td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/70">{row.email}</td>
                  <td className="px-4 py-4 align-middle">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                      {row.roleName || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <StatusDropdown
                      data={userRoleStatusOptions}
                      selected={userRoleStatusOptions.find((o) => o.id === row.status) || userRoleStatusOptions[0]}
                      onClick={(opt) => changeStatus(row, opt)}
                      viewOnly={!canEdit}
                      loading={statusLoadingId === row.id}
                    />
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "created") || ""}>
                    {labelOf(row, "created") || "—"}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "updated") || ""}>
                    {labelOf(row, "updated") || "—"}
                  </td>
                    <td className="px-4 py-4 align-middle pr-6">
                    <div className="flex items-center gap-3">
                      {checkRoleAuth(view_user) && (
                        <button
                          onClick={() => navigate(`/users/detail/${row.id}`)}
                          className="text-slate-400 hover:text-teal-600 transition-colors"
                          title={t("view")}
                        >
                          <AiOutlineEye className="h-4 w-4" />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => navigate(`/users/edit/${row.id}`)}
                          className="text-slate-400 hover:text-teal-600 transition-colors"
                          title={t("edit")}
                        >
                          <AiOutlineEdit className="h-4 w-4" />
                        </button>
                      )}
                      {checkRoleAuth(delete_user) && (
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
        title={t("delete_user")}
        description={t("delete_user_confirmation")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={confirmDelete}
        loading={deleting}
      />
    </>
  );
};

export default UsersTable;
