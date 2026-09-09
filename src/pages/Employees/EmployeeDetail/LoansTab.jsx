import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { HiOutlineCurrencyDollar, HiOutlineCalendar } from "react-icons/hi2";
import { FiCreditCard } from "react-icons/fi";
import { fetchLoansByEmployee, showEmployeeLoans, showEmployeeLoansLoading, clearEmployeeLoans } from "store/slices/loanSlice";
import { formatAmount } from "global/helper";
import { SkeletonCards, SkeletonList } from "components/Skeleton";

// Real loans have no `remainingAmount`/`paidAmount`/`startDate` fields —
// derived from `emiSchedule` (empty until disbursed) and `createdAt` instead.
const paidAmountOf = (loan) => (loan.emiSchedule || []).filter((r) => r.paid).reduce((s, r) => s + (r.emiAmount || 0), 0);
// Once paid, show the date it was actually paid (e.g. by payroll) rather
// than the original due date — and just the date, not the full ISO
// timestamp the API returns.
const installmentDateOf = (inst) => {
  const d = inst.paid && inst.paidDate ? inst.paidDate : inst.dueDate;
  return d ? dayjs(d).format("DD MMM YYYY") : "-";
};
const remainingAmountOf = (loan) => {
  const schedule = loan.emiSchedule || [];
  return schedule.length ? schedule.filter((r) => !r.paid).reduce((s, r) => s + (r.emiAmount || 0), 0) : loan.loanAmount || 0;
};

const LoansTab = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const loans = useSelector(showEmployeeLoans);
  const isLoading = useSelector(showEmployeeLoansLoading);

  useEffect(() => {
    if (data?.id) dispatch(fetchLoansByEmployee(data.id));
    return () => dispatch(clearEmployeeLoans());
  }, [data?.id, dispatch]);

  const ACTIVE_STATUSES = ["Pending Manager", "Pending HR", "Pending", "Approved", "Ongoing"];

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-500/20 dark:via-emerald-500/10 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 translate-x-1/4 translate-y-1/4" />
        <div className="relative flex items-center gap-2 mb-4">
          <HiOutlineCurrencyDollar className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("employees:loans")}
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
              {t("employees:total_loans")}
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {loans.length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20">
            <p className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase">
              {t("employees:active_loans")}
            </p>
            <p className="text-lg font-bold text-teal-700 dark:text-teal-300 mt-1">
              {loans.filter((l) => ACTIVE_STATUSES.includes(l.status)).length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase">
              {t("employees:cleared_loans")}
            </p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {loans.filter((l) => l.status === "Completed").length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase">
              {t("employees:total_remaining")}
            </p>
            <p className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-1">
              {formatAmount(loans.reduce((s, l) => s + remainingAmountOf(l), 0))}
            </p>
          </div>
        </div>
        )}
      </div>

      {/* Loan Cards */}
      {isLoading ? (
        <SkeletonList rows={3} />
      ) : loans.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/20 p-10 text-center text-slate-500 dark:text-white/60">
          {t("no_record_found")}
        </div>
      ) : (
        <div className="space-y-6">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-teal-500/15 dark:bg-teal-500/25 translate-x-1/4 translate-y-1/4" />

              {/* Loan Header */}
              <div className="relative flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-teal-500/10 dark:bg-teal-500/20">
                    <FiCreditCard className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </span>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      {t("employees:loan_amount")}: {formatAmount(loan.loanAmount)}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-white/70 flex items-center gap-1 mt-0.5">
                      <HiOutlineCalendar className="h-4 w-4" />
                      {t("employees:start_date")}: {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-white/60">
                      {t("employees:monthly_installment")}
                    </p>
                    <p className="font-semibold text-teal-600 dark:text-teal-400">
                      {formatAmount(loan.monthlyDeduction)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      ACTIVE_STATUSES.includes(loan.status)
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                        : loan.status === "Rejected"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    }`}
                  >
                    {loan.status}
                  </span>
                </div>
              </div>

              {/* Loan Summary Row */}
              <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/5">
                  <p className="text-xs font-medium text-slate-500 dark:text-white/60">
                    {t("employees:remaining")}
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatAmount(remainingAmountOf(loan))}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/5">
                  <p className="text-xs font-medium text-slate-500 dark:text-white/60">
                    {t("employees:tenure")}
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {loan.numberOfInstallments} {t("employees:months")}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {t("employees:paid_amount")}
                  </p>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatAmount(paidAmountOf(loan))}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/5">
                  <p className="text-xs font-medium text-slate-500 dark:text-white/60">
                    {t("employees:installments_paid")}
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {loan.emiSchedule?.filter((i) => i.paid).length || 0} /{" "}
                    {loan.emiSchedule?.length || 0}
                  </p>
                </div>
              </div>

              {/* Installment History */}
              {loan.emiSchedule?.length > 0 && (
                <div className="relative">
                  <h5 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <HiOutlineCalendar className="h-4 w-4 text-teal-500" />
                    {t("employees:installment_history")}
                  </h5>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/20">
                    <table className="w-full text-sm min-w-[400px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/20">
                          <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                            #
                          </th>
                          <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                            {t("employees:installment_date")}
                          </th>
                          <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                            {t("employees:installment_amount")}
                          </th>
                          <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                            {t("employees:payment_status")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loan.emiSchedule.map((inst) => (
                          <tr
                            key={inst.installmentNo}
                            className="border-b border-slate-100 dark:border-white/10 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                          >
                            <td className="py-2.5 px-4 text-slate-700 dark:text-white/90 font-medium">
                              {inst.installmentNo}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700 dark:text-white/90">
                              {installmentDateOf(inst)}
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                              {formatAmount(inst.emiAmount)}
                            </td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                                  inst.paid
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                }`}
                              >
                                {inst.paid ? t("employees:paid") : t("employees:pending")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoansTab;
