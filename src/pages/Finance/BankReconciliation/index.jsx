import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { checkRoleAuth, formatAmount } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import SelectDropdown from "components/SelectDropdown";
import FormInput from "components/FormInput";
import Button from "components/Button";
import FinancePage from "../FinancePage";
import { labelOf } from "components/AuditMeta";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { financeReconciliationStatusBadge, tableRows } from "global/constant";
import {
  fetchBankAccounts,
  fetchStatementLines,
  createStatementLine,
  matchStatementLine,
  unmatchStatementLine,
  fetchLedgerByAccount,
  clearLedgerByAccount,
  fetchReconciliationSessions,
  createReconciliationSession,
  closeReconciliationSession,
  showBankAccounts,
  showStatementLines,
  showStatementLinesTotal,
  showStatementLinesLoading,
  showLedgerAccountLines,
  showReconciliationSessions,
  showReconciliationSessionsLoading,
} from "store/slices/financeSlice";
import { SkeletonTable } from "components/Skeleton";
import EmptyState from "components/EmptyState";
import { useListFilters } from "hooks/useListFilters";

const { view_finance_reconciliation, add_finance_reconciliation } = alqadar_role_ids;

const EMPTY_LINE = { date: new Date().toISOString().slice(0, 10), description: "", amount: "", reference: "" };
const EMPTY_SESSION = { periodStart: "", periodEnd: "", statementEndingBalance: "" };

// Statement lines the user enters/imports are matched by hand against that
// account's real Ledger lines — a Reconciliation Session then compares the
// bank's stated ending balance against the account's real ledger closing
// balance, never a separately-tracked "book balance".
const BankReconciliation = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const bankAccounts = useSelector(showBankAccounts);
  const statementLines = useSelector(showStatementLines);
  const statementLinesTotal = useSelector(showStatementLinesTotal);
  const statementLinesLoading = useSelector(showStatementLinesLoading);
  const ledgerLines = useSelector(showLedgerAccountLines);
  const sessions = useSelector(showReconciliationSessions);
  const sessionsLoading = useSelector(showReconciliationSessionsLoading);

  const [filters, setFilters] = useListFilters("finance-bank-reconciliation", { accountId: null, page: 1, limitId: tableRows[0].id });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const statementLinesTotalPages = Math.max(1, Math.ceil((statementLinesTotal || 0) / selRows.id));
  const [newLine, setNewLine] = useState(EMPTY_LINE);
  const [newSession, setNewSession] = useState(EMPTY_SESSION);
  const [matchPicks, setMatchPicks] = useState({});

  useEffect(() => {
    dispatch(fetchBankAccounts());
  }, [dispatch]);

  const accountOpts = useMemo(() => bankAccounts.map((a) => ({ id: a.id, title: a.name, chartAccountId: a.chartAccountId })), [bankAccounts]);
  const selAccount = useMemo(() => accountOpts.find((a) => a.id === filters.accountId) || null, [accountOpts, filters.accountId]);

  useEffect(() => {
    if (!selAccount && accountOpts.length) setFilters({ accountId: accountOpts[0].id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountOpts, selAccount]);

  useEffect(() => {
    if (!selAccount?.id) return;
    dispatch(fetchStatementLines({ bankAccountId: selAccount.id, page: filters.page, limit: selRows.id }));
    dispatch(fetchReconciliationSessions({ bankAccountId: selAccount.id }));
    if (selAccount.chartAccountId) {
      dispatch(fetchLedgerByAccount({ accountId: selAccount.chartAccountId }));
    }
    return () => dispatch(clearLedgerByAccount());
  }, [dispatch, selAccount, filters.page, selRows.id]);

  const ledgerOpts = useMemo(
    () => ledgerLines.map((l) => ({ id: l.id, title: `${new Date(l.date).toLocaleDateString()} · ${l.source} · ${l.debit || -l.credit}` })),
    [ledgerLines],
  );

  const handleAddLine = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const desc = String(newLine.description || "").trim();
    const amt = parseFloat(newLine.amount);
    if (!selAccount?.id || !newLine.date || !desc || desc.length < 2) {
      toast.error(t("finance:invalid_data"));
      return;
    }
    if (newLine.date > today) {
      toast.error(t("finance:date_not_future", { defaultValue: "Date cannot be in the future" }));
      return;
    }
    if (!Number.isFinite(amt) || amt === 0) {
      toast.error(t("finance:amount_required", { defaultValue: "Amount must not be zero" }));
      return;
    }
    const result = await dispatch(
      createStatementLine({ bankAccountId: selAccount.id, ...newLine, amount: parseFloat(newLine.amount) || 0 }),
    );
    if (result.error) {
      toast.error(result.payload || t("finance:save_failed"));
      return;
    }
    toast.success(t("finance:save_success"));
    setNewLine(EMPTY_LINE);
  };

  const handleMatch = async (lineId) => {
    const pick = matchPicks[lineId];
    if (!pick?.id) {
      toast.error(t("finance:invalid_data"));
      return;
    }
    const result = await dispatch(matchStatementLine({ id: lineId, ledgerLineId: pick.id }));
    if (result.error) {
      toast.error(result.payload || t("finance:save_failed"));
      return;
    }
    toast.success(t("finance:recon_matched"));
  };

  const handleUnmatch = async (lineId) => {
    const result = await dispatch(unmatchStatementLine(lineId));
    if (result.error) {
      toast.error(result.payload || t("finance:save_failed"));
      return;
    }
    toast.success(t("finance:recon_unmatched"));
  };

  const handleCreateSession = async () => {
    if (!selAccount?.id || !newSession.periodStart || !newSession.periodEnd || newSession.statementEndingBalance === "") {
      toast.error(t("finance:invalid_data"));
      return;
    }
    const result = await dispatch(
      createReconciliationSession({
        bankAccountId: selAccount.id,
        periodStart: newSession.periodStart,
        periodEnd: newSession.periodEnd,
        statementEndingBalance: parseFloat(newSession.statementEndingBalance) || 0,
      }),
    );
    if (result.error) {
      toast.error(result.payload || t("finance:save_failed"));
      return;
    }
    toast.success(t("finance:save_success"));
    setNewSession(EMPTY_SESSION);
  };

  const handleCloseSession = async (id) => {
    const result = await dispatch(closeReconciliationSession(id));
    if (result.error) {
      toast.error(result.payload || t("finance:save_failed"));
      return;
    }
    toast.success(t("finance:recon_balanced"));
  };

  const totalMatched = statementLines.filter((l) => l.matched).reduce((s, l) => s + l.amount, 0);
  const totalUnmatched = statementLines.filter((l) => !l.matched).reduce((s, l) => s + l.amount, 0);

  return (
    <FinancePage title={t("finance:recon_title")} description={t("finance:recon_desc")}>
      {checkRoleAuth(view_finance_reconciliation) && (
        <>
          <div className="mb-6 flex flex-wrap gap-4 items-end">
            <div className="min-w-[260px]">
              <SelectDropdown
                label={t("finance:bank_account")}
                labelClass="!text-xs font-medium text-slate-500"
                data={accountOpts}
                selected={selAccount}
                setSelected={(opt) => setFilters({ accountId: opt?.id || null, page: 1 })}
                hideClear
                classes="!h-[46px] !rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/10 p-4">
              <p className="text-xs text-slate-500 dark:text-white/60 mb-1">{t("finance:recon_cleared")}</p>
              <p className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{formatAmount(totalMatched)}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/10 p-4">
              <p className="text-xs text-slate-500 dark:text-white/60 mb-1">{t("finance:recon_uncleared")}</p>
              <p className="text-xl font-bold tabular-nums text-amber-700 dark:text-amber-300">{formatAmount(totalUnmatched)}</p>
            </div>
          </div>

          {checkRoleAuth(add_finance_reconciliation) && (
            <div className="mb-6 bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
              <p className="text-sm font-semibold mb-3">{t("finance:recon_add_line")}</p>
              <div className="grid md:grid-cols-5 gap-3 items-end">
                <FormInput
                  label={t("finance:recon_date")}
                  labelClass="!text-xs font-medium text-slate-500"
                  name="reconDate"
                  type="date"
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  value={newLine.date}
                  onValueChange={(v) => setNewLine({ ...newLine, date: v })}
                  wrapperClass="w-full"
                  inputClass="!h-10 !rounded-lg"
                />
                <FormInput
                  label={t("finance:recon_description")}
                  labelClass="!text-xs font-medium text-slate-500"
                  name="reconDescription"
                  required
                  minLength={2}
                  maxLength={500}
                  value={newLine.description}
                  onValueChange={(v) => setNewLine({ ...newLine, description: v })}
                  wrapperClass="md:col-span-2 w-full"
                  inputClass="!h-10 !rounded-lg"
                />
                <FormInput
                  label={t("finance:amount")}
                  labelClass="!text-xs font-medium text-slate-500"
                  name="reconAmount"
                  type="number"
                  decimal
                  decimalPlaces={3}
                  maxLength={10}
                  allowNegative
                  required
                  value={newLine.amount}
                  onValueChange={(v) => setNewLine({ ...newLine, amount: v })}
                  wrapperClass="w-full"
                  inputClass="!h-10 !rounded-lg"
                />
                <Button type="button" title={t("save")} btn="primary" onClick={handleAddLine} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">{t("finance:recon_amount_hint")}</p>
            </div>
          )}

          {statementLinesLoading ? (
            <div className="mb-8"><SkeletonTable rows={5} columns={4} /></div>
          ) : statementLines.length === 0 ? (
            <div className="mb-8"><EmptyState /></div>
          ) : (
            <div className="mb-8">
            <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
              <table className="w-full border-collapse text-sm mb-0">
                <thead>
                  <tr className="bg-[var(--color-teal-500)] border-none">
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">{t("finance:recon_date")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:recon_description")}</th>
                    <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:amount")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:reference")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">{t("finance:recon_matched")}</th>
                  </tr>
                </thead>
                <tbody>
                  {statementLines.map((row) => (
                    <tr key={row.id} className={`transition-colors border-b border-slate-100 dark:border-white/5 last:[&_td]:border-b-0 ${row.matched ? "bg-emerald-50/40 dark:bg-emerald-500/5" : ""}`}>
                      <td className="px-4 py-4 align-middle pl-6 text-slate-500">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="px-4 py-4 align-middle">{row.description}</td>
                      <td className={`px-4 py-4 align-middle text-end tabular-nums ${row.amount >= 0 ? "text-emerald-600" : "text-red-500"}`}>{formatAmount(row.amount)}</td>
                      <td className="px-4 py-4 align-middle font-mono text-xs">{row.reference || "—"}</td>
                      <td className="px-4 py-4 align-middle pr-6">
                        {row.matched ? (
                          checkRoleAuth(add_finance_reconciliation) && (
                            <button onClick={() => handleUnmatch(row.id)} className="text-xs font-medium text-teal-600 hover:underline">
                              {t("finance:recon_unmatch")}
                            </button>
                          )
                        ) : (
                          checkRoleAuth(add_finance_reconciliation) && (
                            <div className="flex items-center gap-2 min-w-[220px]">
                              <SelectDropdown
                                data={ledgerOpts}
                                selected={matchPicks[row.id] || null}
                                setSelected={(opt) => setMatchPicks({ ...matchPicks, [row.id]: opt })}
                                hideClear
                                placeholder={t("finance:recon_select_ledger_line")}
                                classes="!h-9 !rounded-lg !text-xs"
                              />
                              <button onClick={() => handleMatch(row.id)} className="text-xs font-medium text-teal-600 hover:underline whitespace-nowrap">
                                {t("finance:recon_match")}
                              </button>
                            </div>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white [&_.pagination_li_a:hover]:!text-teal-600 [&_.pagination_li_a:hover]:!bg-teal-50 dark:[&_.pagination_li_a:hover]:!border-teal-500 dark:[&_.pagination_li_a:hover]:!text-teal-300 dark:[&_.pagination_li_a:hover]:!bg-teal-500/20">
              <div className="flex items-center gap-4">
                <SelectDropdown
                  data={tableRows}
                  selected={selRows}
                  setSelected={(v) => setFilters({ limitId: v.id, page: 1 })}
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
                  onPageChange={(e) => setFilters({ page: e.selected + 1 })}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={1}
                  pageCount={statementLinesTotalPages}
                  forcePage={filters.page - 1}
                  renderOnZeroPageCount={null}
                  containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
                />
              </div>
            </div>
            </div>
          )}

          <h3 className="font-semibold text-slate-700 dark:text-white mb-3">{t("finance:recon_sessions")}</h3>
          {checkRoleAuth(add_finance_reconciliation) && (
            <div className="mb-4 bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
              <div className="grid md:grid-cols-4 gap-3 items-end">
                <FormInput
                  label={t("finance:date_from")}
                  labelClass="!text-xs font-medium text-slate-500"
                  name="sessionFrom"
                  type="date"
                  value={newSession.periodStart}
                  onValueChange={(v) => setNewSession({ ...newSession, periodStart: v })}
                  wrapperClass="w-full"
                  inputClass="!h-10 !rounded-lg"
                />
                <FormInput
                  label={t("finance:date_to")}
                  labelClass="!text-xs font-medium text-slate-500"
                  name="sessionTo"
                  type="date"
                  value={newSession.periodEnd}
                  onValueChange={(v) => setNewSession({ ...newSession, periodEnd: v })}
                  wrapperClass="w-full"
                  inputClass="!h-10 !rounded-lg"
                />
                <FormInput
                  label={t("finance:recon_statement_balance")}
                  labelClass="!text-xs font-medium text-slate-500"
                  name="sessionBalance"
                  type="number"
                  decimal
                  decimalPlaces={2}
                  allowNegative
                  value={newSession.statementEndingBalance}
                  onValueChange={(v) => setNewSession({ ...newSession, statementEndingBalance: v })}
                  wrapperClass="w-full"
                  inputClass="!h-10 !rounded-lg"
                />
                <Button type="button" title={t("finance:recon_start_session")} btn="primary" onClick={handleCreateSession} />
              </div>
            </div>
          )}
          {sessionsLoading ? (
            <SkeletonTable rows={4} columns={6} />
          ) : sessions.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
              <table className="w-full border-collapse text-sm mb-0">
                <thead>
                  <tr className="bg-[var(--color-teal-500)] border-none">
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">{t("finance:date_from")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:date_to")}</th>
                    <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:recon_statement_balance")}</th>
                    <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:recon_book_balance")}</th>
                    <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:recon_difference")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("product:status")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                      {t("created_by")}
                    </th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                      {t("updated_by")}
                    </th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md w-24" />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0">
                      <td className="px-4 py-4 align-middle pl-6 text-slate-500">{new Date(s.periodStart).toLocaleDateString()}</td>
                      <td className="px-4 py-4 align-middle text-slate-500">{new Date(s.periodEnd).toLocaleDateString()}</td>
                      <td className="px-4 py-4 align-middle text-end tabular-nums">{formatAmount(s.statementEndingBalance)}</td>
                      <td className="px-4 py-4 align-middle text-end tabular-nums">{formatAmount(s.bookBalance)}</td>
                      <td className={`px-4 py-4 align-middle text-end tabular-nums font-medium ${s.difference !== 0 ? "text-red-500" : "text-emerald-600"}`}>
                        {s.difference !== 0 ? formatAmount(s.difference) : "✓ 0.00"}
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${financeReconciliationStatusBadge[s.status] || ""}`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(s, "created") || ""}>
                        {labelOf(s, "created") || "—"}
                      </td>
                      <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(s, "updated") || ""}>
                        {labelOf(s, "updated") || "—"}
                      </td>
                      <td className="px-4 py-4 align-middle pr-6">
                        {s.status === "Open" && checkRoleAuth(add_finance_reconciliation) && (
                          <button onClick={() => handleCloseSession(s.id)} className="text-xs font-medium text-teal-600 hover:underline">
                            {t("finance:recon_close_session")}
                          </button>
                        )}
                      </td>
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

export default BankReconciliation;
