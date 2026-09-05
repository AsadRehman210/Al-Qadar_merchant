import { useTranslation } from "react-i18next";
import {
  HiOutlineCurrencyDollar,
  HiOutlineMinusCircle,
  HiOutlinePlusCircle,
} from "react-icons/hi2";
import { FiCreditCard, FiCalendar } from "react-icons/fi";

import { salaryAllowanceKeys as ALLOWANCE_KEYS, salaryDeductionKeys as DEDUCTION_KEYS } from "global/constant";
import { formatAmount } from "global/helper";

// `salary` is the employee's real, current /api/salary/employee/:id record —
// allowances/deductions are nested objects there (see salary-model.ts), not
// flat top-level keys, and gross_salary/net_salary are always server-computed.
const SalaryTab = ({ salary }) => {
  const { t } = useTranslation();

  if (!salary) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center mb-4">
          <HiOutlineCurrencyDollar className="h-7 w-7 text-teal-600 dark:text-teal-400" />
        </div>
        <p className="font-semibold text-slate-800 dark:text-white">
          {t("employees:no_salary_record")}
        </p>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
          {t("employees:no_salary_record_hint")}
        </p>
      </div>
    );
  }

  const basicSalary = parseFloat(salary.basic_salary) || 0;
  const totalAllowances = ALLOWANCE_KEYS.reduce(
    (sum, key) => sum + (parseFloat(salary.allowances?.[key]) || 0),
    0,
  );
  const totalDeductions = DEDUCTION_KEYS.reduce(
    (sum, key) => sum + (parseFloat(salary.deductions?.[key]) || 0),
    0,
  );
  const netSalary = salary.net_salary ?? basicSalary + totalAllowances - totalDeductions;

  const allowanceItems = [
    { key: "hra", label: t("employees:hra") },
    { key: "medical_allowance", label: t("employees:medical_allowance") },
    { key: "transport_allowance", label: t("employees:transport_allowance") },
    { key: "food_allowance", label: t("employees:food_allowance") },
    { key: "mobile_allowance", label: t("employees:mobile_allowance") },
    { key: "travel_allowance", label: t("employees:travel_allowance") },
    { key: "other_allowances", label: t("employees:other_allowances") },
  ];

  const deductionItems = [
    { key: "tax", label: t("employees:tax") },
    { key: "provident_fund", label: t("employees:provident_fund") },
    { key: "loan_deduction", label: t("employees:loan_deduction") },
    { key: "advance_salary", label: t("employees:advance_salary") },
    { key: "insurance_deduction", label: t("employees:insurance_deduction") },
    { key: "other_deductions", label: t("employees:other_deductions") },
  ];

  const CardWrapper = ({ children, className = "" }) => (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {children}
    </div>
  );


  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "-");

  return (
    <div className="space-y-6">
      {/* Salary Summary */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-500/20 dark:via-emerald-500/10 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 translate-x-1/4 translate-y-1/4" />
        <div className="relative flex items-center gap-2 mb-4">
          <HiOutlineCurrencyDollar className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("employees:salary_summary")}
          </h3>
        </div>
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">{t("employees:basic_salary")}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{formatAmount(basicSalary)}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase">{t("employees:total")} {t("employees:allowances")}</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">+{formatAmount(totalAllowances)}</p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase">{t("employees:total")} {t("employees:deductions")}</p>
            <p className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-1">-{formatAmount(totalDeductions)}</p>
          </div>
          <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-500/20 border-2 border-teal-500/30 dark:border-teal-500/50">
            <p className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase">{t("employees:net_salary")}</p>
            <p className="text-xl font-bold text-teal-700 dark:text-teal-300 mt-1">{formatAmount(netSalary)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allowances */}
        <CardWrapper>
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 translate-x-1/4 translate-y-1/4" />
          <h3 className="relative flex items-center justify-between mb-4">
            <span className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <span className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
                <HiOutlinePlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </span>
              {t("employees:allowances")}
            </span>
            <span className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
              {formatAmount(totalAllowances)}
            </span>
          </h3>
          <div className="relative space-y-3">
            {allowanceItems.map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/80 dark:bg-white/5 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5 transition-all">
                <span className="text-sm font-medium text-slate-700 dark:text-white/90">{label}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatAmount(salary.allowances?.[key])}</span>
              </div>
            ))}
          </div>
        </CardWrapper>

        {/* Deductions */}
        <CardWrapper>
          <div className="absolute top-0 left-0 w-36 h-36 rounded-full bg-rose-500/20 dark:bg-rose-500/30 -translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-rose-500/15 dark:bg-rose-500/25 translate-x-1/4 translate-y-1/4" />
          <h3 className="relative flex items-center justify-between mb-4">
            <span className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <span className="p-2 rounded-xl bg-rose-500/10 dark:bg-rose-500/20">
                <HiOutlineMinusCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </span>
              {t("employees:deductions")}
            </span>
            <span className="px-3 py-1 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold text-sm">
              {formatAmount(totalDeductions)}
            </span>
          </h3>
          <div className="relative space-y-3">
            {deductionItems.map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/80 dark:bg-white/5 hover:bg-rose-50/30 dark:hover:bg-rose-500/5 transition-all">
                <span className="text-sm font-medium text-slate-700 dark:text-white/90">{label}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatAmount(salary.deductions?.[key])}</span>
              </div>
            ))}
          </div>
        </CardWrapper>
      </div>

      {/* Bank & Payment */}
      <CardWrapper>
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-teal-500/15 dark:bg-teal-500/25 translate-x-1/4 translate-y-1/4" />
        <h3 className="relative flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
          <span className="p-2 rounded-xl bg-teal-500/10 dark:bg-teal-500/20">
            <FiCreditCard className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </span>
          {t("employees:bank_payment_details")}
        </h3>
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: FiCreditCard, label: t("employees:bank_name"), value: salary.bank_name },
            { label: t("employees:account_no"), value: salary.account_no },
            { label: t("employees:ifsc"), value: salary.ifsc },
            { label: t("employees:pf_number"), value: salary.pf_number },
            { icon: FiCalendar, label: t("employees:payment_status"), value: salary.payment_status },
            { icon: FiCalendar, label: t("employees:payment_date"), value: fmtDate(salary.payment_date) },
            { label: t("employees:salary_effective_from"), value: fmtDate(salary.effective_from) },
            { label: t("employees:salary_effective_to"), value: fmtDate(salary.effective_to) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-transparent hover:border-teal-500/20 transition-all">
              {Icon && <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400 mb-1" />}
              <p className="text-xs font-medium text-slate-500 dark:text-white/60">{label}</p>
              <p className="font-medium text-slate-900 dark:text-white mt-0.5 capitalize">{value || "-"}</p>
            </div>
          ))}
        </div>
        {salary.salary_notes && (
          <div className="relative mt-4 p-3 rounded-xl bg-slate-50/80 dark:bg-white/5">
            <p className="text-xs font-medium text-slate-500 dark:text-white/60">{t("employees:notes")}</p>
            <p className="font-medium text-slate-900 dark:text-white mt-1">{salary.salary_notes}</p>
          </div>
        )}
      </CardWrapper>
    </div>
  );
};

export default SalaryTab;
