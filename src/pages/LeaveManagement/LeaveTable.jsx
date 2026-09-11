import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { FiEye } from "react-icons/fi";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SelectDropdown from "components/SelectDropdown";
import TableState from "components/TableState";
import { tableRows, leaveStatusBadge } from "global/constant";
import { labelOf } from "components/AuditMeta";

// No PUT/DELETE endpoint exists for leave requests on the backend — only
// apply/approve/reject/cancel — so Edit/Delete row actions were removed
// (cancel lives on the Detail page instead, matching the Loan/Expense
// precedent of dropping UI capabilities the backend doesn't support).
const LeaveTable = ({ data = [], loading, page = 1, setPage, selRows, setSelRows, totalPages, baseUrl = "/leave-management" }) => {
  const { t } = useTranslation();
  const list = data;

  return (
    <>
      <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
        <div className="min-w-[1100px]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--color-teal-500)]">
                {[
                  t("leave:leave_number"),
                  t("leave:employee"),
                  t("leave:leave_type"),
                  t("leave:from_date"),
                  t("leave:to_date"),
                  t("leave:days"),
                  t("leave:applied_via"),
                  t("leave:status"),
                  t("created_by"),
                  t("updated_by"),
                  t("leave:actions"),
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-4 text-start font-semibold text-white/95 whitespace-nowrap ${i === 0 ? "pl-6" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TableState loading={loading} data={list} colSpan={11}>
              {list.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10"
                >
                  <td className="px-4 py-4 pl-6 font-semibold text-slate-800 dark:text-white">
                    {row.leaveNumber}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{row.employeeName}</p>
                    <p className="text-xs text-slate-500 dark:text-white/60">{row.employeeCode}</p>
                    <p className="text-xs text-slate-400 dark:text-white/40">{row.department}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-700 dark:text-white/80">{row.leaveTypeName}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-white/80">{row.fromDate}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-white/80">{row.toDate}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700 dark:text-white">{row.days}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        row.appliedVia === "employee"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                          : "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300"
                      }`}
                    >
                      {row.appliedVia === "employee" ? t("leave:self_applied") : t("leave:hr_applied")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        leaveStatusBadge[row.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "created") || ""}>
                    {labelOf(row, "created") || "—"}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "updated") || ""}>
                    {labelOf(row, "updated") || "—"}
                  </td>
                    <td className="px-4 py-4 pr-6">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-white/70">
                      <Link to={`${baseUrl}/details/${row.id}`} title={t("view")} className="hover:text-teal-600">
                        <FiEye className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              </TableState>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!text-white [&_.pagination_li_a:hover]:!text-teal-600">
        <div className="flex items-center gap-3">
          <SelectDropdown
            data={tableRows}
            selected={selRows}
            setSelected={setSelRows}
            hideClear
            classes="!h-10 !rounded-lg"
          />
          <span className="text-sm text-slate-600 dark:text-white/70">{t("per_page")}</span>
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
    </>
  );
};

export default LeaveTable;
