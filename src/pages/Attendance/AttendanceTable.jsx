import { useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import ActionPopup from "components/ActionPopup";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SelectDropdown from "components/SelectDropdown";
import TableState from "components/TableState";
import { tableRows } from "global/constant";
import { deleteAttendance } from "store/slices/attendanceSlice";

const AttendanceTable = ({ data, loading, page = 1, setPage, selRows, setSelRows, totalPages, onDeleted }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const popupRef = useRef();

  const list = data || [];

  const onDelete = (row) => {
    popupRef.current?.openModal?.(row);
  };

  const onConfirmDelete = async (row) => {
    try {
      await dispatch(deleteAttendance(row.id)).unwrap();
      await onDeleted?.();
      toast.success(t("attendance:delete_success"));
    } catch (err) {
      toast.error(err || t("attendance:delete_failed"));
    }
    popupRef.current?.closeModal?.();
  };

  const onEdit = (row) => navigate(`/attendance/edit/${row.id}`);

  const handlePageClick = (event) => setPage?.(event.selected + 1);

  const getStatusClass = (status) => {
    const map = {
      Present: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
      Absent: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
      Leave: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
      Holiday: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
      "Half-day": "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
    };
    return map[status] || "bg-slate-100 text-slate-700 dark:bg-slate-500/20";
  };

  return (
    <>
      <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
        <div className="min-w-[900px]">
          <table className="w-full border-collapse text-sm mb-0">
            <thead>
              <tr className="bg-[var(--color-teal-500)] border-none">
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-2xl">
                  {t("attendance:employee")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("attendance:date")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("attendance:status")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("attendance:check_in")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("attendance:check_out")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("attendance:overtime_hours")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("attendance:shift_type")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("attendance:notes")}
                </th>
                <th className="w-[100px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-2xl">
                  {t("attendance:actions")}
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
                    <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 pl-6 font-medium">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {row.employeeName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-white/60">
                          {row.employeeIdNo}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                      {row.date ? new Date(row.date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                      {row.checkIn}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                      {row.checkOut}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                      {row.overtimeHours || "-"}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                      {row.shiftType}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 max-w-[120px] truncate">
                      {row.notes || "-"}
                    </td>
                    <td className="px-4 py-4 align-middle pr-6">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(row)}
                          className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                          title={t("edit")}
                        >
                          <AiOutlineEdit className="h-4 w-4" />
                        </button>
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
            renderOnZeroPageCount={null}
            containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
          />
        </div>
      </div>

      <ActionPopup
        ref={popupRef}
        title={t("attendance:delete_attendance")}
        description={t("attendance:confirm_delete_attendance")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={onConfirmDelete}
      />
    </>
  );
};

export default AttendanceTable;
