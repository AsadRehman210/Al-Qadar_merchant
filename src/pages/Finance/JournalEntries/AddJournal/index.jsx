import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { IoAdd, IoTrash } from "react-icons/io5";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import {
  fetchChartOfAccounts,
  createJournalEntry,
  showChartOfAccounts,
} from "store/slices/financeSlice";

const { add_finance_journal } = alqadar_role_ids;

const emptyLine = () => ({ key: `${Date.now()}-${Math.random()}`, account: null, debit: "", credit: "" });

// A manual journal entry is always created fresh, never edited afterward —
// once posted it's part of the permanent ledger (see journal-service's
// createJournalEntry), so correcting a mistake means posting a reversing
// entry, not mutating history.
const AddJournal = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const accounts = useSelector(showChartOfAccounts);

  useEffect(() => {
    if (!accounts.length) dispatch(fetchChartOfAccounts());
  }, [dispatch, accounts.length]);

  const acctOpts = useMemo(
    () => accounts.map((a) => ({ id: a.id, title: `${a.code} — ${a.name}` })),
    [accounts],
  );

  const [lines, setLines] = useState([emptyLine(), emptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: { date: new Date().toISOString().slice(0, 10), memo: "" },
  });

  useEffect(() => {
    if (!checkRoleAuth(add_finance_journal)) {
      toast.error(t("finance:not_authorized"));
      navigate("/finance/journal");
    }
  }, [navigate, t]);

  const updateLine = (key, patch) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (key) => setLines((prev) => (prev.length > 2 ? prev.filter((l) => l.key !== key) : prev));

  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const difference = Math.round((totalDebit - totalCredit) * 100) / 100;
  const linesValid = lines.every((l) => l.account?.id && ((parseFloat(l.debit) || 0) > 0) !== ((parseFloat(l.credit) || 0) > 0));
  const isBalanced = difference === 0 && totalDebit > 0 && linesValid;

  const onSubmit = async (data) => {
    if (!isBalanced) {
      toast.error(t("finance:journal_not_balanced"));
      return;
    }
    setSubmitting(true);
    try {
      const result = await dispatch(
        createJournalEntry({
          date: data.date,
          memo: data.memo,
          lines: lines.map((l) => ({
            accountId: l.account.id,
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
          })),
        }),
      );
      if (result.error) throw new Error(result.payload || t("finance:save_failed"));
      toast.success(t("finance:save_success"));
      navigate("/finance/journal");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!checkRoleAuth(add_finance_journal)) return null;
  const isRTL = i18n.language === "ar";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/finance/journal")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
            iconClass="!text-lg"
          />
          <h1 className="text-3xl font-bold tracking-tight">{t("finance:add_journal")}</h1>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]"
        >
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <FormInput label={t("finance:posted_date")} name="date" type="date" register={register} required max={new Date().toISOString().slice(0, 10)} />
            <FormInput label={t("finance:memo")} name="memo" maxLength={500} register={register} />
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700 dark:text-white/90">
              {t("finance:lines")} ({t("finance:double_entry")})
            </span>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              <IoAdd className="h-4 w-4" /> {t("finance:add_line")}
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line) => (
              <div key={line.key} className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_36px] gap-3 items-end">
                <SelectDropdown
                  label={t("finance:account_name")}
                  labelClass="!text-xs"
                  data={acctOpts}
                  selected={line.account}
                  setSelected={(opt) => updateLine(line.key, { account: opt })}
                  hideClear
                  classes="!h-[46px] !rounded-lg"
                />
                <FormInput
                  label={t("finance:debit")}
                  labelClass="!text-xs"
                  name={`debit-${line.key}`}
                  type="number"
                  min={0}
                  decimal
                  decimalPlaces={3}
                  maxLength={10}
                  value={line.debit}
                  onValueChange={(v) => updateLine(line.key, { debit: v, credit: v ? "" : line.credit })}
                  wrapperClass="w-full"
                  inputClass="!h-[46px] !rounded-lg"
                />
                <FormInput
                  label={t("finance:credit")}
                  labelClass="!text-xs"
                  name={`credit-${line.key}`}
                  type="number"
                  min={0}
                  decimal
                  decimalPlaces={3}
                  maxLength={10}
                  value={line.credit}
                  onValueChange={(v) => updateLine(line.key, { credit: v, debit: v ? "" : line.debit })}
                  wrapperClass="w-full"
                  inputClass="!h-[46px] !rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeLine(line.key)}
                  disabled={lines.length <= 2}
                  className="h-[46px] w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title={t("finance:remove_line")}
                >
                  <IoTrash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className={`mt-4 flex flex-wrap gap-6 rounded-xl px-4 py-3 text-sm font-medium ${isBalanced ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>
            <span>{t("finance:total_debit")}: {totalDebit.toLocaleString()}</span>
            <span>{t("finance:total_credit")}: {totalCredit.toLocaleString()}</span>
            <span>{isBalanced ? t("finance:balanced") : t("finance:unbalanced")} {difference !== 0 ? `(${difference > 0 ? "+" : ""}${difference.toLocaleString()})` : ""}</span>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button type="button" title={t("cancel")} onClick={() => navigate("/finance/journal")} />
            <Button type="submit" title={t("save")} btn="primary" disabled={submitting || !isBalanced} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJournal;
