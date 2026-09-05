import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { AiOutlineEdit, AiOutlineEye } from "react-icons/ai";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SelectDropdown from "components/SelectDropdown";
import TableState from "components/TableState";
import { tableRows } from "global/constant";
import { checkRoleAuth, formatAmount } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import Table from "components/Table";

const { add_employee, view_employee } = rafeeqi_role_ids;

const LEVEL_COLORS = {
  "C-Level":    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  "Director":   "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "Manager":    "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  "Supervisor": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "Staff":      "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/70",
  "Intern":     "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
};

const DesignationsTable = ({ data, loading, page = 1, setPage, selRows, setSelRows, totalPages }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const list = data || [];

  const handlePageClick = (event) => setPage?.(event.selected + 1);

  return (
    <>
      <Table className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-teal-500)] border-none">
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">{t("designation:code")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("designation:title")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("designation:department")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("designation:level")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("designation:grade")}</th>
              <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("designation:salary_range")}</th>
              <th className="px-4 py-4 text-center font-semibold text-white/95 border-none whitespace-nowrap">{t("designation:employees")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("designation:status")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">{t("designation:actions")}</th>
            </tr>
          </thead>
          <tbody>
            <TableState loading={loading} data={list} colSpan={9}>
              {list.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors last:[&_td]:border-b-0">
                  <td className="px-4 py-4 align-middle pl-6 font-mono text-xs font-semibold text-slate-500">{row.code}</td>
                  <td className="px-4 py-4 align-middle">
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-slate-400">{row.shortName}</div>
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/70">{row.departmentName || "—"}</td>
                  <td className="px-4 py-4 align-middle">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${LEVEL_COLORS[row.level] || "bg-slate-100 text-slate-600"}`}>
                      {row.level}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle text-xs text-slate-500">{row.grade}</td>
                  <td className="px-4 py-4 align-middle text-end tabular-nums text-xs text-slate-600 dark:text-white/70">
                    {formatAmount(row.minSalary)} – {formatAmount(row.maxSalary)} {row.currency}
                  </td>
                  <td className="px-4 py-4 align-middle text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 text-xs font-bold">
                      {row.employeeCount ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle pr-6">
                    <div className="flex items-center gap-2">
                      {checkRoleAuth(view_employee) && (
                        <button
                          onClick={() => navigate(`/designations/detail/${row.id}`)}
                          className="text-slate-400 hover:text-teal-600 transition-colors"
                          title={t("view")}
                        >
                          <AiOutlineEye className="h-4 w-4" />
                        </button>
                      )}
                      {checkRoleAuth(add_employee) && (
                        <button
                          onClick={() => navigate(`/designations/edit/${row.id}`)}
                          className="text-slate-400 hover:text-teal-600 transition-colors"
                          title={t("edit")}
                        >
                          <AiOutlineEdit className="h-4 w-4" />
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
    </>
  );
};

export default DesignationsTable;
