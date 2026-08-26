import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineDocumentText } from "react-icons/hi2";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import dayjs from "dayjs";
import SelectDropdown from "components/SelectDropdown";
import { tableRows } from "global/constant";
import SalarySlipPopup from "./SalarySlipPopup";

const fmtMonth = (m) => (m ? dayjs(`${m}-01`).format("MMMM YYYY") : "-");

const PAYMENT_BADGE = {
  Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

// `data` is real payroll history — one row per real, processed Payroll Run
// line (see payroll-run-service's getByEmployee/getAllEmployeesHistory) —
// never a manually-entered salary record. When no employee filter is picked
// (`serverPaginated`), `data` is already one server-paginated page of every
// employee's lines combined (see Salary/index.jsx), each carrying its own
// `employee`; otherwise every record belongs to the single `employee` prop,
// `showEmployeeColumn` is false, and pagination stays client-side over the
// one employee's own (backend-unpaginated, inherently small) history.
const SalaryTable = ({
  data,
  employee,
  showEmployeeColumn = false,
  page = 1,
  setPage,
  serverPaginated = false,
  selRows: selRowsProp,
  setSelRows: setSelRowsProp,
  totalPages: totalPagesProp,
}) => {
  const { t } = useTranslation();
  const [localSelRows, setLocalSelRows] = useState(tableRows[0]);
  const [slipRow, setSlipRow] = useState(null);

  const selRows = serverPaginated ? selRowsProp : localSelRows;
  const setSelRows = serverPaginated ? setSelRowsProp : setLocalSelRows;

  const fullList = data || [];

  const totalPages = serverPaginated ? (totalPagesProp || 1) : (Math.ceil(fullList.length / selRows?.id) || 1);
  const startIndex = (page - 1) * (selRows?.id || 1);
  const paginatedList = serverPaginated ? fullList : fullList.slice(startIndex, startIndex + selRows?.id);

  const handlePageClick = (event) => setPage?.(event.selected + 1);

  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();
  const nameOf = (emp) => (emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "");

  const openSlip = (record) => {
    const line = record.line || {};
    const emp = record.employee || employee;
    setSlipRow({
      hra: line.hra,
      medical_allowance: line.medical,
      transport_allowance: line.transport,
      food_allowance: line.food,
      mobile_allowance: line.mobile,
      arrears: line.arrears,
      overtime: line.overtime,
      bonus: line.bonus,
      tax: line.incomeTax,
      provident_fund: line.pfEmployee,
      loan_deduction: line.loanDeduction,
      advance_salary: line.advance,
      insurance_deduction: line.insurance,
      other_deductions: line.otherDeductions,
      basic: line.basic,
      netPay: line.netPay,
      employeeName: nameOf(emp),
      employeeIdNo: emp?.employeeCode,
      role: emp?.designationName,
      department: emp?.departmentName,
      accountNo: line.accountNo,
      joiningDate: emp?.joining_date || "-",
      monthLabel: fmtMonth(record.month),
    });
  };
  const closeSlip = () => setSlipRow(null);

  const colCount = showEmployeeColumn ? 8 : 7;

  return (
    <>
      <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
        <div className="min-w-[900px]">
          <table className="w-full border-collapse text-sm mb-0">
            <thead>
              <tr className="bg-[var(--color-teal-500)] border-none">
                {showEmployeeColumn && (
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-2xl">
                    {t("salary:employee")}
                  </th>
                )}
                <th
                  className={`px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap ${
                    showEmployeeColumn ? "" : "pl-6 rounded-tl-2xl"
                  }`}
                >
                  {t("salary:month")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("salary:basic")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("salary:gross_salary")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("salary:deductions")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("salary:net_pay")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("salary:status")}
                </th>
                <th className="w-[80px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-2xl">
                  {t("salary:actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-slate-400">
                    {t("salary:no_salary_records")}
                  </td>
                </tr>
              ) : (
                paginatedList.map((record) => {
                  const line = record.line || {};
                  return (
                    <tr
                      key={record.runId}
                      className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                    >
                      {showEmployeeColumn && (
                        <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 pl-6 font-medium whitespace-nowrap">
                          {nameOf(record.employee) || "-"}
                        </td>
                      )}
                      <td
                        className={`px-4 py-4 align-middle text-slate-700 dark:text-white/90 font-medium ${
                          showEmployeeColumn ? "" : "pl-6"
                        }`}
                      >
                        {fmtMonth(record.month)}
                      </td>
                      <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90">
                        {formatAmount(line.basic)}
                      </td>
                      <td className="px-4 py-4 align-middle text-emerald-600 dark:text-emerald-400">
                        {formatAmount(line.grossEarnings)}
                      </td>
                      <td className="px-4 py-4 align-middle text-rose-600 dark:text-rose-400">
                        -{formatAmount(line.totalDeductions)}
                      </td>
                      <td className="px-4 py-4 align-middle font-semibold text-teal-600 dark:text-teal-400">
                        {formatAmount(line.netPay)}
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            PAYMENT_BADGE[line.paymentStatus] || PAYMENT_BADGE.Pending
                          }`}
                        >
                          {line.paymentStatus || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle pr-6">
                        <button
                          type="button"
                          onClick={() => openSlip(record)}
                          className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                          title={t("salary:view_salary_slip")}
                        >
                          <HiOutlineDocumentText className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white [&_.pagination_li_a:hover]:!text-teal-600 [&_.pagination_li_a:hover]:!bg-teal-50 dark:[&_.pagination_li_a:hover]:!border-teal-500 dark:[&_.pagination_li_a:hover]:!text-teal-300 dark:[&_.pagination_li_a:hover]:!bg-teal-500/20">
        <div className="flex items-center gap-4">
          <SelectDropdown
            data={tableRows}
            selected={selRows}
            setSelected={(newVal) => {
              setSelRows(newVal);
              setPage?.(1);
            }}
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

      <SalarySlipPopup isOpen={!!slipRow} onClose={closeSlip} row={slipRow} />
    </>
  );
};

export default SalaryTable;
