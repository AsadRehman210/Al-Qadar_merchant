import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { HiOutlineDocumentText, HiOutlineArrowDownTray, HiOutlineCurrencyDollar } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import ReactPaginate from "react-paginate";
import SelectDropdown from "components/SelectDropdown";
import { rows } from "global/constant";
import { formatAmount } from "global/helper";
import dayjs from "dayjs";

import { numberWordsOnes as ONES, numberWordsTens as TENS, numberWordsTeens as TEENS } from "global/constant";

const numberToWords = (n) => {
  if (n === 0) return "Zero";
  const num = Math.floor(Math.abs(n));
  if (num >= 1000000) return `${numberToWords(Math.floor(num / 1000000))} Million ${numberToWords(num % 1000000)}`.trim();
  if (num >= 1000) return `${numberToWords(Math.floor(num / 1000))} Thousand ${numberToWords(num % 1000)}`.trim();
  if (num >= 100) return `${ONES[Math.floor(num / 100)]} Hundred ${numberToWords(num % 100)}`.trim();
  if (num >= 20) return `${TENS[Math.floor(num / 10)]} ${ONES[num % 10]}`.trim();
  if (num >= 10) return TEENS[num - 10];
  return ONES[num] || "";
};

// Earnings/deductions breakdown shown on the slip — sourced straight from
// the real payroll line's own component fields (see payroll-run-model.ts),
// not an estimate.
const EARNING_ITEMS = [
  { key: "basic", label: "basic_pay" },
  { key: "hra", label: "hra" },
  { key: "medical", label: "medical_allowance" },
  { key: "transport", label: "transport_allowance" },
  { key: "food", label: "food_allowance" },
  { key: "mobile", label: "mobile_allowance" },
  { key: "overtime", label: "overtime" },
  { key: "bonus", label: "bonus" },
  { key: "arrears", label: "arrears" },
];
const DEDUCTION_ITEMS = [
  { key: "pfEmployee", label: "pf_employee" },
  { key: "incomeTax", label: "tax" },
  { key: "insurance", label: "insurance_deduction" },
  { key: "loanDeduction", label: "loan_deduction" },
  { key: "advance", label: "advance_salary" },
  { key: "attendanceDeduction", label: "attendance_deduction" },
  { key: "otherDeductions", label: "other_deductions" },
];
const SLIP_ROWS = Math.max(EARNING_ITEMS.length, DEDUCTION_ITEMS.length);

// `payrollHistory` is this employee's real line across every non-draft,
// non-cancelled Payroll Run (see payroll-run-service.getByEmployee) —
// [{ runId, runNumber, month, runStatus, line }], newest first. `employee`
// supplies the identity fields (name/department/designation) the slip
// header needs.
const MonthWiseSalaryTab = ({ employee, payrollHistory }) => {
  const { t } = useTranslation();
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [page, setPage] = useState(1);
  const [selRows, setSelRows] = useState(rows[0]);
  const slipRef = useRef(null);

  const fullList = payrollHistory || [];
  const totalPages = Math.ceil(fullList.length / selRows?.id) || 1;
  const startIndex = (page - 1) * selRows?.id;
  const pageRecords = fullList.slice(startIndex, startIndex + selRows?.id);

  const handlePageClick = (event) => {
    setPage(event.selected + 1);
  };
  const fmtMonth = (m) => (m ? dayjs(`${m}-01`).format("MMMM YYYY") : "-");

  const openSlip = (record) => {
    setSelectedSlip(record);
  };

  const closeSlip = () => setSelectedSlip(null);

  const handleDownload = async () => {
    if (!slipRef.current || !selectedSlip) return;
    setIsDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(slipRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = 210;
      const pdfH = 297;
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = Math.min((pdfW - 20) / imgW, (pdfH - 30) / imgH);
      const w = imgW * ratio;
      const h = imgH * ratio;
      pdf.addImage(imgData, "PNG", 10, 10, w, h);
      pdf.save(`Salary_Slip_${(selectedSlip.month || "").replace("-", "_")}.pdf`);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const fullName = [employee?.first_name, employee?.last_name].filter(Boolean).join(" ") || "-";

  if (!fullList.length) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center mb-4">
          <HiOutlineCurrencyDollar className="h-7 w-7 text-teal-600 dark:text-teal-400" />
        </div>
        <p className="font-semibold text-slate-800 dark:text-white">
          {t("employees:no_payroll_history")}
        </p>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
          {t("employees:no_payroll_history_hint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
        <div className="min-w-[900px]">
          <table className="w-full border-collapse text-sm mb-0">
            <thead>
              <tr className="bg-[var(--color-teal-500)] border-none">
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-2xl">
                  {t("employees:date")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("employees:basic_salary")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("employees:gross_earnings")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("employees:total_deductions")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("employees:net_pay")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("employees:payment_status")}
                </th>
                <th className="w-[100px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-2xl">
                  {t("employees:salary_slip")}
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRecords.map((record) => {
                const line = record.line || {};
                return (
                  <tr
                    key={record.runId}
                    className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                  >
                    <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 pl-6 font-medium">
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
                          line.paymentStatus === "Paid"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                        }`}
                      >
                        {line.paymentStatus || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle pr-6">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => openSlip(record)}
                          className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                          title={t("employees:view_salary_slip")}
                        >
                          <HiOutlineDocumentText className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* Salary Slip Popup */}
      <Transition show={!!selectedSlip}>
        <Dialog
          as="div"
          className="relative z-[9999]"
          onClose={closeSlip}
        >
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
            <TransitionChild
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative w-full max-w-[210mm] rounded-2xl bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {t("employees:salary_slip")} - {fmtMonth(selectedSlip?.month)}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 disabled:opacity-60 transition-colors"
                    >
                      <HiOutlineArrowDownTray className="h-5 w-5" />
                      {isDownloading ? t("employees:downloading") : t("employees:download")}
                    </button>
                    <button
                      type="button"
                      onClick={closeSlip}
                      className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      <IoClose className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                <div className="p-6 overflow-x-auto">
                  <div
                    ref={slipRef}
                    className="salary-slip-content w-[210mm] max-w-full mx-auto bg-white text-slate-800 font-sans text-[11px]"
                  >
                    {/* Professional Salary Slip - Reference Design */}
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      {/* Header */}
                      <div className="flex justify-between items-start p-4 pb-3 border-b border-slate-200">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center text-white font-bold text-[10px]">
                              R
                            </div>
                            <span className="text-sm font-semibold text-slate-900 lowercase tracking-tight">
                              rafeeqi
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            {t("employees:company_address")}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {t("employees:company_phone")} • {t("employees:company_email")}
                          </p>
                        </div>
                        <div className="text-right">
                          <h1 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                            {t("employees:salary_slip")}
                          </h1>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {t("employees:pay_period")}: {fmtMonth(selectedSlip?.month)}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {t("employees:payroll_run")}: {selectedSlip?.runNumber || "-"}
                          </p>
                        </div>
                      </div>

                      {/* Employee Info - Two columns */}
                      <div className="grid grid-cols-2 gap-4 p-4 pb-3">
                        <div className="space-y-1">
                          <p className="text-[10px]"><span className="font-semibold text-slate-900">{t("employees:employee_name")}:</span> <span className="text-slate-700">{fullName}</span></p>
                          <p className="text-[10px]"><span className="font-semibold text-slate-900">{t("employees:employee_id")}:</span> <span className="text-slate-700">{employee?.employeeCode || "-"}</span></p>
                          <p className="text-[10px]"><span className="font-semibold text-slate-900">{t("employees:designation")}:</span> <span className="text-slate-700">{employee?.role || "-"}</span></p>
                          <p className="text-[10px]"><span className="font-semibold text-slate-900">{t("employees:date")}:</span> <span className="text-slate-700">{fmtMonth(selectedSlip?.month)}</span></p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px]"><span className="font-semibold text-slate-900">{t("employees:department")}:</span> <span className="text-slate-700">{employee?.department || "-"}</span></p>
                          <p className="text-[10px]"><span className="font-semibold text-slate-900">{t("employees:join_date")}:</span> <span className="text-slate-700">{employee?.joining_date || "-"}</span></p>
                        </div>
                      </div>

                      {/* Earnings & Deductions Table */}
                      <div className="px-4 pb-3">
                        <div className="grid grid-cols-4 border-b border-slate-300">
                          <div className="py-2 px-2 font-semibold text-slate-900 text-[10px]">{t("employees:earnings")}</div>
                          <div className="py-2 px-2 font-semibold text-slate-900 text-[10px] text-right">{t("employees:amount_pkr")}</div>
                          <div className="py-2 px-2 font-semibold text-slate-900 text-[10px]">{t("employees:deductions")}</div>
                          <div className="py-2 px-2 font-semibold text-slate-900 text-[10px] text-right">{t("employees:amount_pkr")}</div>
                        </div>
                        {Array.from({ length: SLIP_ROWS }, (_, i) => {
                          const earning = EARNING_ITEMS[i];
                          const deduction = DEDUCTION_ITEMS[i];
                          return (
                            <div key={i} className="grid grid-cols-4 border-b border-slate-100">
                              <div className="py-1.5 px-2 text-slate-700 text-[10px]">{earning ? t(`employees:${earning.label}`) : ""}</div>
                              <div className="py-1.5 px-2 text-slate-900 text-[10px] text-right font-medium">{earning ? formatAmount(selectedSlip?.line?.[earning.key]) : ""}</div>
                              <div className="py-1.5 px-2 text-slate-700 text-[10px]">{deduction ? t(`employees:${deduction.label}`) : ""}</div>
                              <div className="py-1.5 px-2 text-slate-900 text-[10px] text-right font-medium">{deduction ? formatAmount(selectedSlip?.line?.[deduction.key]) : ""}</div>
                            </div>
                          );
                        })}
                        <div className="grid grid-cols-4 border-t border-slate-300 bg-slate-50/50">
                          <div className="py-2 px-2 font-semibold text-slate-900 text-[10px]">{t("employees:gross_pay")}</div>
                          <div className="py-2 px-2 font-semibold text-slate-900 text-[10px] text-right">{formatAmount(selectedSlip?.line?.grossEarnings)}</div>
                          <div className="py-2 px-2 font-semibold text-slate-900 text-[10px]">{t("employees:total_deductions")}</div>
                          <div className="py-2 px-2 font-semibold text-slate-900 text-[10px] text-right">{formatAmount(selectedSlip?.line?.totalDeductions)}</div>
                        </div>
                      </div>

                      {/* Net Pay */}
                      <div className="mx-4 mb-3 p-3 bg-slate-100 rounded border border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 text-[10px]">{t("employees:net_pay_transfer")}</span>
                          <span className="font-bold text-sm text-slate-900">{formatAmount(selectedSlip?.line?.netPay)}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 border-t border-slate-200 space-y-1">
                        <p className="text-[10px] font-semibold text-slate-900">
                          {t("employees:in_words")}: {numberToWords(Math.floor(selectedSlip?.line?.netPay || 0))} {t("employees:rupees_only")}.
                        </p>
                        <p className="text-[9px] text-slate-500 italic text-center pt-1">
                          *{t("employees:salary_slip_footer")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default MonthWiseSalaryTab;
