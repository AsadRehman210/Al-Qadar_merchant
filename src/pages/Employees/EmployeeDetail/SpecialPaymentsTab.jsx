import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { HiOutlineGift } from "react-icons/hi2";
import { SP_STATUS_BADGE } from "../../PayrollBatch/payrollBatchFakeData";
import { fetchSpecialPayments, showSpecialPayments } from "store/slices/payrollBatchSlice";

const SpecialPaymentsTab = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const employeeId = data?.id;
  const payments = useSelector(showSpecialPayments);

  useEffect(() => {
    dispatch(fetchSpecialPayments());
  }, [dispatch]);

  const history = useMemo(() => {
    return payments
      .filter((p) => p.employees?.some((e) => e.employeeId === employeeId))
      .map((p) => ({ ...p, myEntry: p.employees.find((e) => e.employeeId === employeeId) }))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [payments, employeeId]);

  const fmt = (n) => (n || 0).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-500/20 dark:via-emerald-500/10 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HiOutlineGift className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("payroll:special_payments")}
            </h3>
          </div>
          <Link
            to="/special-payments"
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
          >
            {t("payroll:view_in_special_payments")}
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-md overflow-hidden">
        {history.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500 dark:text-white/60">
            {t("no_record_found")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("employees:description")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("employees:amount")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("payroll:status")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("payment_status")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90" />
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 dark:border-white/10 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-white/5"
                  >
                    <td className="py-2.5 px-4 text-slate-800 dark:text-white/90">{p.title}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      SAR {fmt(p.myEntry?.amount)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          SP_STATUS_BADGE[p.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-white/70">
                      {p.myEntry?.paymentStatus}
                    </td>
                    <td className="py-2.5 px-4">
                      <Link
                        to={`/special-payments/details/${p.id}`}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        {t("view_details")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialPaymentsTab;
