import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { FiEye } from "react-icons/fi";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import ImageWithFallback from "components/ImageWithFallback";
import ActionPopup from "components/ActionPopup";
import TableState from "components/TableState";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SelectDropdown from "components/SelectDropdown";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { tableRows } from "global/constant";
import {
  EMPLOYEE_STATUS_BADGE,
  EMPLOYEE_STATUS_OPTIONS,
} from "./employeesFakeData";
import { deleteEmployee } from "store/slices/employeeSlice";

const statusLabel = (id) =>
  EMPLOYEE_STATUS_OPTIONS.find((s) => s.id === id)?.title || id;

const { view_employee, edit_employee, delete_employee } = rafeeqi_role_ids;

const EmployeesTable = ({ data, loading, page = 1, setPage, selRows, setSelRows, totalPages, onDeleted }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const popup = useRef();
  const list = data || [];

  const handlePageClick = (event) => {
    setPage?.(event.selected + 1);
  };

  const onDeleteEmployee = async (id) => {
    try {
      await dispatch(deleteEmployee(id)).unwrap();
      await onDeleted?.();
      toast.success(t("employees:delete_success"));
    } catch (err) {
      toast.error(err || t("employees:delete_failed"));
    }
    popup.current?.closeModal();
  };

  return (
    <>
      <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
        <div className="min-w-[1020px]">
          <table className="w-full border-collapse text-sm mb-0">
            <thead>
              <tr className="bg-[var(--color-teal-500)] border-none">
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-2xl">
                  {t("employees:employee_id")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("name")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("email")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("employees:department")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("employees:role")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("employees:net_salary")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("status")}
                </th>
                <th className="w-[100px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-2xl">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              <TableState loading={loading} data={list} colSpan={8}>
                {list.map((emp) => (
                  <tr
                    key={emp.id}
                    className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                  >
                    <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 pl-6 font-medium">
                      {emp.employeeCode}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback
                          src={emp.image}
                          alt={`${emp.first_name || ""} ${emp.last_name || ""}`}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-teal-500/20 dark:border-teal-500/40"
                        />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {emp.first_name} {emp.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                      {emp.email}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                      {emp.departmentName || "—"}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                      {emp.designationName || "—"}
                    </td>
                    <td className="px-4 py-4 align-middle font-medium text-slate-700 dark:text-white/90">
                      {emp.net_salary != null ? emp.net_salary.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          EMPLOYEE_STATUS_BADGE[emp.status] ||
                          "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70"
                        }`}
                      >
                        {statusLabel(emp.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle pr-6">
                      <div className="flex items-center justify-center gap-3">
                        {checkRoleAuth(view_employee) && (
                          <Link
                            to={`/employees/details/${emp.id}`}
                            className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                            title={t("view")}
                          >
                            <FiEye className="h-4 w-4" />
                          </Link>
                        )}
                        {checkRoleAuth(edit_employee) && (
                          <Link
                            to={`/employees/edit/${emp.id}`}
                            className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                            title={t("edit")}
                          >
                            <AiOutlineEdit className="h-4 w-4" />
                          </Link>
                        )}
                        {checkRoleAuth(delete_employee) && (
                          <button
                            type="button"
                            onClick={() => popup.current?.openModal(emp.id)}
                            className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
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
      </div>

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
            currentPage={page}
            renderOnZeroPageCount={null}
            containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
          />
        </div>
      </div>

      <ActionPopup
        ref={popup}
        title={t("employees:delete_employee")}
        description={t("employees:confirm_delete_employee")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={onDeleteEmployee}
      />
    </>
  );
};

export default EmployeesTable;
