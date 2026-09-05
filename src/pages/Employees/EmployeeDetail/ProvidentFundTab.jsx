import { useEffect, useState } from "react";
import { formatAmount } from "global/helper";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { FiExternalLink, FiPlusCircle } from "react-icons/fi";
import { HiOutlineBanknotes } from "react-icons/hi2";
import Button from "components/Button";
import {
  fetchPfPolicy,
  fetchPfAccountByEmployee,
  fetchPfContributionHistory,
  fetchPfWithdrawalsByEmployee,
  clearPfDetail,
  showPfPolicy,
  showPfCurrentAccount,
  showPfContributionHistory,
  showPfWithdrawalsByEmployee,
} from "store/slices/providentFundSlice";


const WD_BADGE = {
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Approved: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  Paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
};

const ProvidentFundTab = ({ data }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [tab, setTab] = useState("monthly");

  const policy = useSelector(showPfPolicy);
  const account = useSelector(showPfCurrentAccount);
  const contributions = useSelector(showPfContributionHistory);
  const withdrawals = useSelector(showPfWithdrawalsByEmployee);

  useEffect(() => {
    if (!data?._id) return;
    dispatch(fetchPfPolicy());
    dispatch(fetchPfAccountByEmployee(data._id));
    dispatch(fetchPfContributionHistory(data._id));
    dispatch(fetchPfWithdrawalsByEmployee(data._id));
    return () => dispatch(clearPfDetail());
  }, [data?._id, dispatch]);

  const totalEmployeeContrib = account?.totalEmployeeContrib || 0;
  const totalEmployerContrib = account?.totalEmployerContrib || 0;
  const totalContrib = totalEmployeeContrib + totalEmployerContrib;
  const currentBalance = account?.currentBalance || 0;

  if (!account) {
    return (
      <div className="py-12 text-center text-slate-500">
        <HiOutlineBanknotes className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>{t("pf:no_pf_record")}</p>
      </div>
    );
  }

  const TABS = [
    { id: "monthly", label: t("pf:monthly_contributions") },
    { id: "withdrawals", label: t("pf:withdrawals_tab") },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-500/20 dark:via-emerald-500/10 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-emerald-500/15 translate-x-1/4 translate-y-1/4" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <HiOutlineBanknotes className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("pf:provident_fund")}</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-white/60">
              {t("pf:pf_account")}: <span className="font-mono font-semibold">{account.pfAccountNo}</span>
              {policy && <>&nbsp;·&nbsp;Employee {policy.employeeRate}% | Employer {policy.employerRate}%</>}
            </p>
          </div>
          <Button type="button" title={t("pf:full_pf_details")} icon={FiExternalLink} iconClass="h-4 w-4"
            onClick={() => navigate(`/provident-fund/details/${data._id}`)}
            className="!w-auto !rounded-lg !h-9 !px-4 !border border-teal-200 dark:!border-teal-500/30 !text-teal-700 dark:!text-teal-300 !bg-teal-50 dark:!bg-teal-500/10 hover:!bg-teal-100" />
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-3 gap-4 mt-5">
          {[
            { label: t("pf:total_employee_contrib"), value: `SAR ${formatAmount(totalEmployeeContrib)}`, color: "text-slate-800 dark:text-white" },
            { label: t("pf:total_employer_contrib"), value: `SAR ${formatAmount(totalEmployerContrib)}`, color: "text-slate-800 dark:text-white" },
            { label: t("pf:current_balance"), value: `SAR ${formatAmount(currentBalance)}`, color: "text-emerald-600 dark:text-emerald-300 text-xl font-bold" },
          ].map((c) => (
            <div key={c.label} className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
              <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase tracking-wide mb-1">{c.label}</p>
              <p className={`font-bold text-sm ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1 w-fit mb-5">
          {TABS.map((t2) => (
            <button key={t2.id} type="button" onClick={() => setTab(t2.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t2.id ? "bg-white dark:bg-white/20 text-teal-600 shadow" : "text-slate-600 dark:text-white/60 hover:text-slate-800"}`}>
              {t2.label}
            </button>
          ))}
        </div>

        {/* Monthly contributions */}
        {tab === "monthly" && (
          <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  {["#", t("pf:month"), t("pf:basic"), t("pf:employee_contrib"), t("pf:employer_contrib"), t("pf:total"), t("pf:running_balance"), t("pf:status")].map((h) => (
                    <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs whitespace-nowrap first:pl-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contributions.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">{t("pf:no_contributions")}</td></tr>
                ) : contributions.map((m, idx) => (
                  <tr key={m.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/5 transition-colors">
                    <td className="px-4 py-3 pl-5 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{m.month}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-white/70">SAR {formatAmount(m.basic)}</td>
                    <td className="px-4 py-3 text-blue-600 dark:text-blue-400">SAR {formatAmount(m.employeeContribution)}</td>
                    <td className="px-4 py-3 text-purple-600 dark:text-purple-400">SAR {formatAmount(m.employerContribution)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">SAR {formatAmount(m.totalContribution)}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">SAR {formatAmount(m.balanceAfter)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.status === "Manual" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-teal-50 dark:bg-teal-500/10 font-bold border-t-2 border-teal-200">
                  <td colSpan={3} className="px-4 py-3 pl-5 text-slate-700 dark:text-white">{t("pf:total")}</td>
                  <td className="px-4 py-3 text-blue-600 dark:text-blue-400">SAR {formatAmount(totalEmployeeContrib)}</td>
                  <td className="px-4 py-3 text-purple-600 dark:text-purple-400">SAR {formatAmount(totalEmployerContrib)}</td>
                  <td className="px-4 py-3">SAR {formatAmount(totalContrib)}</td>
                  <td className="px-4 py-3 text-emerald-600">SAR {formatAmount(currentBalance)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Withdrawals */}
        {tab === "withdrawals" && (
          <>
            {withdrawals.length === 0 ? (
              <div className="text-center py-10 text-slate-500 dark:text-white/50">{t("pf:no_withdrawals")}</div>
            ) : (
              <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-[var(--color-teal-500)]">
                      {[t("pf:request_date"), t("pf:amount"), t("pf:type"), t("pf:reason"), t("pf:status"), t("pf:paid_on")].map((h) => (
                        <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs whitespace-nowrap first:pl-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((wd) => (
                      <tr key={wd.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/5 transition-colors">
                        <td className="px-4 py-3 pl-5 text-slate-600 dark:text-white/70">{wd.createdAt ? new Date(wd.createdAt).toLocaleDateString() : "-"}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">SAR {formatAmount(wd.amount)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-white/70">{wd.type}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-white/80 max-w-[200px] truncate">{wd.reason}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${WD_BADGE[wd.status] || "bg-slate-100 text-slate-600"}`}>{wd.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-white/60">{wd.paidOn ? new Date(wd.paidOn).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4">
              <Button type="button" title={t("pf:manage_withdrawals")} icon={FiPlusCircle} iconClass="h-4 w-4"
                onClick={() => navigate(`/provident-fund/details/${data._id}`)}
                className="!w-auto !rounded-lg !h-9 !px-4 !border border-slate-200 dark:!border-white/20 !text-slate-700 dark:!text-white !bg-white dark:!bg-white/10" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProvidentFundTab;
