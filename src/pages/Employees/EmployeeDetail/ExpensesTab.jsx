import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { Receipt } from "lucide-react";
import { HiOutlineCurrencyDollar } from "react-icons/hi2";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import Pagination from "components/Pagination";
import SelectDropdown from "components/SelectDropdown";
import { rows } from "global/constant";
import { formatAmount } from "global/helper";
import { EXPENSE_STATUS } from "global/constant";
import { fetchExpensesByEmployee, showEmployeeExpenses, showEmployeeExpensesLoading, clearEmployeeExpenses } from "store/slices/expenseSlice";
import { SkeletonCards, SkeletonTable } from "components/Skeleton";

const ExpensesTab = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [selRows, setSelRows] = useState(rows[0]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const employeeExpenses = useSelector(showEmployeeExpenses);
  const isLoading = useSelector(showEmployeeExpensesLoading);

  useEffect(() => {
    if (data?._id) dispatch(fetchExpensesByEmployee(data._id));
    return () => dispatch(clearEmployeeExpenses());
  }, [data?._id, dispatch]);

  const fullList = employeeExpenses || [];
  const totalPages = Math.ceil(fullList.length / selRows?.id) || 1;
  const startIndex = (page - 1) * selRows?.id;
  const paginatedList = fullList.slice(startIndex, startIndex + selRows?.id);

  const handlePageClick = (event) => setPage(event.selected + 1);

  // Dates come back from the API as full ISO timestamps — show just the date.
  const fmtDate = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "-");

  const totalAmount = fullList.reduce((s, e) => s + (e.amount || 0), 0);
  const approvedAmount = fullList
    .filter((e) => e.approvalStatus === EXPENSE_STATUS.APPROVED)
    .reduce((s, e) => s + (e.amount || 0), 0);
  const pendingAmount = fullList
    .filter((e) => [EXPENSE_STATUS.PENDING_MANAGER, EXPENSE_STATUS.PENDING_HR].includes(e.approvalStatus))
    .reduce((s, e) => s + (e.amount || 0), 0);

  const getStatusClass = (status) => {
    if (status === EXPENSE_STATUS.APPROVED) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
    if (status === EXPENSE_STATUS.REJECTED) return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-500/20 dark:via-emerald-500/10 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 translate-x-1/4 translate-y-1/4" />
        <div className="relative flex items-center gap-2 mb-4">
          <HiOutlineCurrencyDollar className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("employees:expenses")}
          </h3>
        </div>
        {isLoading ? (
          <div className="relative">
            <SkeletonCards count={4} columns="grid-cols-2 md:grid-cols-4" />
          </div>
        ) : (
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
                {t("employees:total_expenses")}
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {fullList.length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase">
                {t("employees:approved")}
              </p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {formatAmount(approvedAmount)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase">
                {t("employees:pending")}
              </p>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-1">
                {formatAmount(pendingAmount)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-500/20 border-2 border-teal-500/30 dark:border-teal-500/50">
              <p className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase">
                {t("employees:total_amount")}
              </p>
              <p className="text-xl font-bold text-teal-700 dark:text-teal-300 mt-1">
                {formatAmount(totalAmount)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : fullList.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-10 text-center text-slate-500 dark:text-white/60">
          {t("no_record_found")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
          <div className="min-w-[900px]">
            <table className="w-full border-collapse text-sm mb-0">
              <thead>
                <tr className="bg-[var(--color-teal-500)] border-none">
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-2xl">
                    {t("employees:date")}
                  </th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                    {t("employees:description")}
                  </th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                    {t("employees:category")}
                  </th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                    {t("employees:amount")}
                  </th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                    {t("employees:payment_method")}
                  </th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-2xl">
                    {t("employees:status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((exp) => (
                  <tr
                    key={exp.id}
                    onClick={() => setSelectedExpense(selectedExpense?.id === exp.id ? null : exp)}
                    className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0 cursor-pointer"
                  >
                    <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 pl-6 font-medium">
                      {fmtDate(exp.expenseDate)}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {exp.description || "-"}
                        </p>
                        {exp.notes && (
                          <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5 line-clamp-1">
                            {exp.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 max-w-[160px] truncate">
                      {exp.expenseType ? t(`expenses:${exp.expenseType}`) : "-"}
                    </td>
                    <td className="px-4 py-4 align-middle font-semibold text-teal-600 dark:text-teal-400">
                      {formatAmount(exp.amount)} {exp.currency}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                      {exp.paymentMethod || "-"}
                    </td>
                    <td className="px-4 py-4 align-middle pr-6">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(exp.approvalStatus)}`}
                      >
                        {exp.approvalStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Detail Panel */}
      {selectedExpense && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-teal-500/15 dark:bg-teal-500/25 translate-x-1/4 translate-y-1/4" />
          <div className="relative flex items-center justify-between mb-4">
            <h4 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <Receipt className="h-5 w-5 text-teal-500" />
              {t("employees:expense_details")}
            </h4>
            <button
              type="button"
              onClick={() => setSelectedExpense(null)}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-white/80"
            >
              {t("employees:close")}
            </button>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: t("employees:date"), value: fmtDate(selectedExpense.expenseDate) },
              { label: t("employees:description"), value: selectedExpense.description || "-" },
              { label: t("employees:category"), value: selectedExpense.expenseType ? t(`expenses:${selectedExpense.expenseType}`) : "-" },
              { label: t("employees:amount"), value: `${formatAmount(selectedExpense.amount)} ${selectedExpense.currency}` },
              { label: t("employees:payment_method"), value: selectedExpense.paymentMethod || "-" },
              { label: t("employees:status"), value: selectedExpense.approvalStatus || "-" },
              { label: t("expenses:payment_status"), value: selectedExpense.paymentStatus || "-" },
              { label: t("employees:approved_by"), value: selectedExpense.approvedBy || "-" },
              { label: t("employees:approved_date"), value: fmtDate(selectedExpense.approvalDate) },
              { label: t("employees:notes"), value: selectedExpense.notes || "-" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-transparent hover:border-teal-500/20 transition-all"
              >
                <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
                  {label}
                </p>
                <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {fullList.length > 0 && (
        <div className="flex items-center flex-wrap gap-4 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white [&_.pagination_li_a:hover]:!text-teal-600 [&_.pagination_li_a:hover]:!bg-teal-50 dark:[&_.pagination_li_a:hover]:!border-teal-500 dark:[&_.pagination_li_a:hover]:!text-teal-300 dark:[&_.pagination_li_a:hover]:!bg-teal-500/20">
          <div className="flex items-center gap-4">
            <SelectDropdown
              data={rows}
              selected={selRows}
              setSelected={(newVal) => {
                setSelRows(newVal);
                setPage(1);
              }}
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
    </div>
  );
};

export default ExpensesTab;
