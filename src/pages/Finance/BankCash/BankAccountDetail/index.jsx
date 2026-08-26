import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { IoAdd } from "react-icons/io5";
import Button from "components/Button";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  fetchBankAccounts,
  fetchLedgerByAccount,
  clearLedgerByAccount,
  showBankAccounts,
  showLedgerAccountLines,
  showLedgerClosingBalance,
  showLedgerAccountLoading,
} from "store/slices/financeSlice";
import FinancePage from "../../FinancePage";
import { SkeletonTable } from "components/Skeleton";
import EmptyState from "components/EmptyState";

const { view_customer, add_customer } = rafeeqi_role_ids;

const fmt = (n) => (parseFloat(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

// A thin wrapper around Ledger's per-account view (getByAccount) — a bank/
// cash account's transaction history IS its chartAccountId's ledger, there
// is no separate bank-transaction record to fetch.
const BankAccountDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { accountId } = useParams();
  const accounts = useSelector(showBankAccounts);
  const lines = useSelector(showLedgerAccountLines);
  const closingBalance = useSelector(showLedgerClosingBalance);
  const loading = useSelector(showLedgerAccountLoading);

  const account = useMemo(() => accounts.find((a) => a.id === accountId), [accounts, accountId]);

  useEffect(() => {
    if (!accounts.length) dispatch(fetchBankAccounts());
  }, [dispatch, accounts.length]);

  useEffect(() => {
    if (account?.chartAccountId) {
      dispatch(fetchLedgerByAccount({ accountId: account.chartAccountId }));
    }
    return () => {
      dispatch(clearLedgerByAccount());
    };
  }, [dispatch, account?.chartAccountId]);

  if (!account) {
    return (
      <FinancePage title={t("finance:bank_title")} description="">
        <p className="text-mutedForeground">{loading ? t("loading") : t("finance:empty_list")}</p>
        <Button type="button" title={t("back")} onClick={() => navigate("/finance/bank-cash")} />
      </FinancePage>
    );
  }

  return (
    <FinancePage
      title={account.name}
      description={`${account.bankName || ""}${account.bankName && account.accountNumber ? " · " : ""}${account.accountNumber || ""}`}
      action={
        checkRoleAuth(add_customer) ? (
          <Button
            className="!w-auto !rounded-lg !h-11 !px-5 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600"
            onClick={() => navigate(`/finance/bank-cash/account/${accountId}/entry/add`)}
            title={t("finance:add_bank_entry")}
            icon={IoAdd}
            btn="primary"
            iconClass="h-4 w-4 text-white"
          />
        ) : null
      }
    >
      {checkRoleAuth(view_customer) && (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-white/15 px-5 py-4 bg-teal-50/80 dark:bg-teal-500/10">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-white/60">
                {t("finance:current_balance")}
              </p>
              <p className="text-2xl font-bold tabular-nums text-[var(--color-teal-500)]">
                {fmt(closingBalance)} {account.currency}
              </p>
              <p className="text-sm text-mutedForeground mt-1">
                {account.type} · {t("finance:bank_ledger_hint")}
              </p>
            </div>
            <Button
              type="button"
              title={t("back")}
              onClick={() => navigate("/finance/bank-cash")}
              className="!rounded-md"
            />
          </div>

          {loading ? (
            <SkeletonTable rows={6} columns={5} />
          ) : lines.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
              <table className="w-full border-collapse text-sm mb-0 min-w-[900px]">
                <thead>
                  <tr className="bg-[var(--color-teal-500)] border-none">
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">
                      {t("finance:posted_date")}
                    </th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("description")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:reference")}</th>
                    <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:debit")}</th>
                    <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:credit")}</th>
                    <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">
                      {t("finance:running_balance")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                    >
                      <td className="px-4 py-4 align-middle pl-6 whitespace-nowrap">{row.date ? new Date(row.date).toLocaleDateString() : ""}</td>
                      <td className="px-4 py-4 align-middle max-w-[220px]">{row.source}</td>
                      <td className="px-4 py-4 align-middle font-mono text-xs">{row.ref || "—"}</td>
                      <td className="px-4 py-4 align-middle text-end tabular-nums">{row.debit ? fmt(row.debit) : "—"}</td>
                      <td className="px-4 py-4 align-middle text-end tabular-nums">{row.credit ? fmt(row.credit) : "—"}</td>
                      <td className="px-4 py-4 align-middle text-end tabular-nums font-semibold pr-6">{fmt(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </FinancePage>
  );
};

export default BankAccountDetail;
