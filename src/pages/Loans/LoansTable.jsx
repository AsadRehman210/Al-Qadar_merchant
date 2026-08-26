import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { FiEye } from "react-icons/fi";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SelectDropdown from "components/SelectDropdown";
import TableState from "components/TableState";
import { tableRows, loanStatusBadge } from "global/constant";

const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

const getStatusClass = (status) => {
  return loanStatusBadge[status] || "bg-slate-100 text-slate-700 dark:bg-slate-500/20";
};

// Repayment progress is derived from the real emiSchedule (no `paidAmount`/
// `remainingAmount` fields exist server-side) — undisbursed loans (no
// schedule yet) show 0 paid / full amount remaining.
const paidAmountOf = (loan) => (loan.emiSchedule || []).filter((r) => r.paid).reduce((s, r) => s + (r.emiAmount || 0), 0);
const remainingAmountOf = (loan) => {
  const schedule = loan.emiSchedule || [];
  if (!schedule.length) return loan.loanAmount || 0;
  return schedule.filter((r) => !r.paid).reduce((s, r) => s + (r.emiAmount || 0), 0);
};

const LoansTable = ({ data, loading, page = 1, setPage, selRows, setSelRows, totalPages }) => {
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
                  {t("loans:loan_number")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("loans:employee")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("loans:loan_type")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("loans:loan_purpose")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("loans:loan_amount")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("loans:paid_amount")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("loans:remaining_amount")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("loans:number_of_installments")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("loans:interest_percent")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("loans:status")}
                </th>
                <th className="w-[80px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-2xl">
                  {t("loans:actions")}
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
                    {row.loanNumber || "-"}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 font-medium">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {row.employeeName || "—"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/60">
                        {row.employeeCode}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                    {row.loanType}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                    {row.loanPurpose}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 font-medium">
                    {formatAmount(row.loanAmount)}
                  </td>
                  <td className="px-4 py-4 align-middle text-emerald-600 dark:text-emerald-400">
                    {formatAmount(paidAmountOf(row))}
                  </td>
                  <td className="px-4 py-4 align-middle text-rose-600 dark:text-rose-400 font-medium">
                    {formatAmount(remainingAmountOf(row))}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                    {row.numberOfInstallments}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                    {row.interestPercent ? `${row.interestPercent}%` : "-"}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle pr-6">
                    <Link
                      to={`/loans/details/${row.id}`}
                      className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                      title={t("view")}
                    >
                      <FiEye className="h-4 w-4" />
                    </Link>
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

export default LoansTable;
