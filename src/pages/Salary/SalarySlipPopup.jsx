import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { HiOutlineArrowDownTray } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";

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

const SalarySlipPopup = ({ isOpen, onClose, row }) => {
  const { t } = useTranslation();
  const slipRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  const handleDownload = async () => {
    if (!slipRef.current || !row) return;
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
      pdf.save(`Salary_Slip_${row.employeeName}_${row.monthLabel?.replace(/\s/g, "_")}.pdf`);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!row) return null;

  const hasDetailAllowances = row.hra != null || row.medical_allowance != null;
  const hasDetailDeductions = row.tax != null || row.provident_fund != null;

  const earningsList = hasDetailAllowances
    ? [
        { key: "basic_pay", val: row.basic },
        { key: "hra", val: row.hra },
        { key: "medical_allowance", val: row.medical_allowance },
        { key: "transport_allowance", val: row.transport_allowance },
        { key: "food_allowance", val: row.food_allowance },
        { key: "mobile_allowance", val: row.mobile_allowance },
        { key: "travel_allowance", val: row.travel_allowance },
        { key: "other_allowances", val: row.other_allowances },
        { key: "arrears", val: row.arrears },
        { key: "overtime_amount", val: row.overtime },
        { key: "bonus_incentive", val: row.bonus },
      ].filter((e) => (parseFloat(e.val) || 0) > 0)
    : [
        { key: "basic_pay", val: row.basic },
        ...((row.allowances || 0) > 0 ? [{ key: "allowances", val: row.allowances }] : []),
        ...((row.arrears || 0) > 0 ? [{ key: "arrears", val: row.arrears }] : []),
        ...((row.overtime || 0) > 0 ? [{ key: "overtime_amount", val: row.overtime }] : []),
        ...((row.bonus || 0) > 0 ? [{ key: "bonus_incentive", val: row.bonus }] : []),
      ];

  const deductionsList = hasDetailDeductions
    ? [
        { key: "tax", val: row.tax },
        { key: "provident_fund", val: row.provident_fund },
        { key: "loan_deduction", val: row.loan_deduction },
        { key: "advance_salary", val: row.advance_salary },
        { key: "insurance_deduction", val: row.insurance_deduction },
        { key: "other_deductions", val: row.other_deductions },
        { key: "tds_deduction", val: row.tds },
      ].filter((d) => (parseFloat(d.val) || 0) > 0)
    : [
        ...((row.deductions || 0) > 0 ? [{ key: "deductions", val: row.deductions }] : []),
        ...((row.tds || 0) > 0 ? [{ key: "tds_deduction", val: row.tds }] : []),
      ];

  const totalEarnings = earningsList.reduce((s, e) => s + (parseFloat(e.val) || 0), 0);
  const totalDeductions = deductionsList.reduce((s, d) => s + (parseFloat(d.val) || 0), 0);
  const grossPay = totalEarnings;
  const netPay = (row.netPay ?? (grossPay - totalDeductions));

  const maxRows = Math.max(earningsList.length, deductionsList.length, 1);

  return (
    <Transition show={isOpen}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
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
                  {t("salary:salary_slip")} - {row.monthLabel}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 disabled:opacity-60 transition-colors"
                  >
                    <HiOutlineArrowDownTray className="h-5 w-5" />
                    {isDownloading ? t("salary:downloading") : t("salary:download")}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
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
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
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
                          {t("salary:company_address")}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {t("salary:company_phone")} • {t("salary:company_email")}
                        </p>
                      </div>
                      <div className="text-right">
                        <h1 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                          {t("salary:salary_slip")}
                        </h1>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {t("salary:pay_period")}: {row.monthLabel}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 pb-3">
                      <div className="space-y-1">
                        <p className="text-[10px]"><span className="font-semibold text-slate-900">{t("salary:employee_name")}:</span> <span className="text-slate-700">{row.employeeName}</span></p>
                        <p className="text-[10px]"><span className="font-semibold text-slate-900">{t("salary:employee_id")}:</span> <span className="text-slate-700">{row.employeeIdNo || "-"}</span></p>
                        <p className="text-[10px]"><span className="font-semibold text-slate-900">{t("salary:designation")}:</span> <span className="text-slate-700">{row.role || "-"}</span></p>
                        <p className="text-[10px]"><span className="font-semibold text-slate-900">{t("salary:date")}:</span> <span className="text-slate-700">{row.monthLabel}</span></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px]"><span className="font-semibold text-slate-900">{t("salary:department")}:</span> <span className="text-slate-700">{row.department || "-"}</span></p>
                        <p className="text-[10px]"><span className="font-semibold text-slate-900">{t("salary:bank_ac_no")}:</span> <span className="text-slate-700">{row.accountNo || "-"}</span></p>
                        <p className="text-[10px]"><span className="font-semibold text-slate-900">{t("salary:join_date")}:</span> <span className="text-slate-700">{row.joiningDate || "-"}</span></p>
                      </div>
                    </div>

                    <div className="px-4 pb-3">
                      <div className="grid grid-cols-4 border-b border-slate-300">
                        <div className="py-2 px-2 font-semibold text-slate-900 text-[10px]">{t("salary:earnings")}</div>
                        <div className="py-2 px-2 font-semibold text-slate-900 text-[10px] text-right">{t("salary:amount_pkr")}</div>
                        <div className="py-2 px-2 font-semibold text-slate-900 text-[10px]">{t("salary:deductions")}</div>
                        <div className="py-2 px-2 font-semibold text-slate-900 text-[10px] text-right">{t("salary:amount_pkr")}</div>
                      </div>
                      {Array.from({ length: maxRows }, (_, i) => (
                        <div key={i} className="grid grid-cols-4 border-b border-slate-100">
                          <div className="py-1.5 px-2 text-slate-700 text-[10px]">
                            {earningsList[i] ? t(`salary:${earningsList[i].key}`) : ""}
                          </div>
                          <div className="py-1.5 px-2 text-slate-900 text-[10px] text-right font-medium">
                            {earningsList[i] ? formatAmount(earningsList[i].val) : ""}
                          </div>
                          <div className="py-1.5 px-2 text-slate-700 text-[10px]">
                            {deductionsList[i] ? t(`salary:${deductionsList[i].key}`) : ""}
                          </div>
                          <div className="py-1.5 px-2 text-slate-900 text-[10px] text-right font-medium">
                            {deductionsList[i] ? formatAmount(deductionsList[i].val) : ""}
                          </div>
                        </div>
                      ))}
                      <div className="grid grid-cols-4 border-t border-slate-300 bg-slate-50/50">
                        <div className="py-2 px-2 font-semibold text-slate-900 text-[10px]">{t("salary:gross_pay")}</div>
                        <div className="py-2 px-2 font-semibold text-slate-900 text-[10px] text-right">{formatAmount(grossPay)}</div>
                        <div className="py-2 px-2 font-semibold text-slate-900 text-[10px]">{t("salary:total_deductions")}</div>
                        <div className="py-2 px-2 font-semibold text-slate-900 text-[10px] text-right">{formatAmount(totalDeductions)}</div>
                      </div>
                    </div>

                    <div className="mx-4 mb-3 p-3 bg-slate-100 rounded border border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 text-[10px]">{t("salary:net_pay_transfer")}</span>
                        <span className="font-bold text-sm text-slate-900">{formatAmount(row.netPay ?? netPay)}</span>
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-slate-200 space-y-1">
                      <p className="text-[10px] font-semibold text-slate-900">
                        {t("salary:in_words")}: {numberToWords(Math.floor(row.netPay ?? netPay))} {t("salary:rupees_only")}.
                      </p>
                      <p className="text-[9px] text-slate-500 italic text-center pt-1">
                        *{t("salary:salary_slip_footer")}
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
  );
};

export default SalarySlipPopup;
