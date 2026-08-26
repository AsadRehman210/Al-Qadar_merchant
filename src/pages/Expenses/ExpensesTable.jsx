import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { FiEye } from "react-icons/fi";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SelectDropdown from "components/SelectDropdown";
import TableState from "components/TableState";
import { tableRows } from "global/constant";

const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

const getStatusClass = (status) => {
  const map = {
    Pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    "Pending Manager":
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    "Pending HR":
      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    Approved:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    Rejected:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  };
  return map[status] || "bg-slate-100 text-slate-700 dark:bg-slate-500/20";
};

const getPaymentStatusClass = (status) => {
  const map = {
    Pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    Reimbursed:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    "Partially Paid":
      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  };
  return map[status] || "bg-slate-100 text-slate-700 dark:bg-slate-500/20";
};

const ExpensesTable = ({ data, loading, page = 1, setPage, selRows, setSelRows, totalPages }) => {
  const { t } = useTranslation();
  const list = data || [];

  const handlePageClick = (event) => setPage?.(event.selected + 1);

  return (
    <>
      <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
        <div className="min-w-[1100px]">
          <table className="w-full border-collapse text-sm mb-0">
            <thead>
              <tr className="bg-[var(--color-teal-500)] border-none">
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-2xl">
                  {t("expenses:expense_number")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("expenses:employee")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("expenses:department")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("expenses:project_name")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("expenses:expense_type")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("expenses:date")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("expenses:amount")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("expenses:approval_status")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("expenses:payment_status")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("expenses:notes")}
                </th>
                <th className="w-[120px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-2xl">
                  {t("expenses:actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              <TableState loading={loading} data={list} colSpan={11}>
              {list.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                >
                  <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 pl-6 font-semibold">
                    {row.expenseNumber || "-"}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 font-medium">
                    <div className="whitespace-nowrap">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {row.employeeName || "—"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        {row.employeeCode}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                    {row.department || "-"}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 max-w-[120px] truncate">
                    {row.projectName || "-"}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 max-w-[180px] truncate">
                    {row.expenseType ? t(`expenses:${row.expenseType}`) : "-"}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap">
                    {row.expenseDate}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 font-medium whitespace-nowrap">
                    {formatAmount(row.amount)} {row.currency}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(row.approvalStatus)}`}
                    >
                      {row.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusClass(row.paymentStatus)}`}
                    >
                      {row.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 max-w-[120px] truncate">
                    {row.notes || row.description || "-"}
                  </td>
                  <td className="px-4 py-4 align-middle pr-6">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/expenses/details/${row.id}`}
                        className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                        title={t("view")}
                      >
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
    </>
  );
};

export default ExpensesTable;
