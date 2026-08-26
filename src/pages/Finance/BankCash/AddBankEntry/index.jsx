import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  fetchBankAccounts,
  fetchChartOfAccounts,
  postBankEntry,
  showBankAccounts,
  showChartOfAccounts,
} from "store/slices/financeSlice";

const { add_customer } = rafeeqi_role_ids;

const TX_TYPES = (t) => [
  { id: "deposit", title: t("finance:tx_deposit") },
  { id: "withdrawal", title: t("finance:tx_withdrawal") },
  { id: "bank_charge", title: t("finance:tx_bank_charge") },
];

// A bank entry is a manual journal entry between the bank/cash account and a
// contra account the user picks — it always posts through the same
// createJournalEntry engine, so once posted it's part of the permanent
// ledger, not an editable record of its own.
const AddBankEntry = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { accountId } = useParams();
  const accounts = useSelector(showBankAccounts);
  const coaAccounts = useSelector(showChartOfAccounts);

  useEffect(() => {
    if (!accounts.length) dispatch(fetchBankAccounts());
    if (!coaAccounts.length) dispatch(fetchChartOfAccounts());
  }, [dispatch, accounts.length, coaAccounts.length]);

  const account = useMemo(() => accounts.find((a) => a.id === accountId), [accounts, accountId]);

  const typeOpts = useMemo(() => TX_TYPES(t), [t]);
  const [selType, setSelType] = useState(typeOpts[0]);

  const contraOpts = useMemo(
    () =>
      coaAccounts
        .filter((a) => a.id !== account?.chartAccountId)
        .map((a) => ({ id: a.id, title: `${a.code} — ${a.name}` })),
    [coaAccounts, account],
  );
  const [selContra, setSelContra] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      amount: "",
      description: "",
      reference: "",
    },
  });

  useEffect(() => {
    setSelType((prev) => typeOpts.find((x) => x.id === prev.id) || typeOpts[0]);
  }, [i18n.language, typeOpts]);

  useEffect(() => {
    if (!checkRoleAuth(add_customer)) {
      toast.error(t("finance:not_authorized"));
      navigate(`/finance/bank-cash/account/${accountId}`);
    }
  }, [navigate, t, accountId]);

  const onSubmit = async (data) => {
    if (!selContra?.id) {
      toast.error(t("finance:invalid_data"));
      return;
    }
    setSubmitting(true);
    try {
      const result = await dispatch(
        postBankEntry({
          id: accountId,
          data: {
            date: data.date,
            type: selType?.id,
            amount: Number(data.amount),
            contraAccountId: selContra.id,
            description: data.description,
            reference: data.reference,
          },
        }),
      );
      if (result.error) throw new Error(result.payload || t("finance:save_failed"));
      toast.success(t("finance:save_success"));
      navigate(`/finance/bank-cash/account/${accountId}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!account) {
    return (
      <div className="p-8 dark:text-white">
        <p>{t("finance:empty_list")}</p>
        <Button type="button" title={t("back")} onClick={() => navigate("/finance/bank-cash")} />
      </div>
    );
  }

  if (!checkRoleAuth(add_customer)) return null;

  const isRTL = i18n.language === "ar";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate(`/finance/bank-cash/account/${accountId}`)}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
            iconClass="!text-lg"
          />
          <h1 className="text-3xl font-bold tracking-tight">{t("finance:add_bank_entry")}</h1>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]"
        >
          <p className="text-sm text-mutedForeground mb-6">
            {account.name} · {account.currency}
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-1 block">{t("finance:tx_type")}</label>
              <SelectDropdown
                data={typeOpts}
                selected={selType}
                setSelected={setSelType}
                hideClear
                classes="!h-[46px] !rounded-lg"
              />
            </div>
            <FormInput label={t("finance:posted_date")} name="date" type="date" register={register} required />
            <FormInput label={t("finance:amount")} name="amount" type="number" step="any" min={0} decimal decimalPlaces={3} maxLength={10} register={register} required />
            <div>
              <label className="text-sm font-medium mb-1 block">{t("finance:contra_account")}</label>
              <SelectDropdown
                data={contraOpts}
                selected={selContra}
                setSelected={setSelContra}
                hideClear
                placeholder={t("finance:select_contra_account")}
                classes="!h-[46px] !rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <FormInput label={t("description")} name="description" maxLength={500} register={register} required />
            </div>
            <FormInput label={t("finance:reference")} name="reference" pattern={/[A-Za-z0-9\-/]/} maxLength={100} register={register} />
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button type="button" title={t("cancel")} onClick={() => navigate(`/finance/bank-cash/account/${accountId}`)} />
            <Button type="submit" title={t("save")} btn="primary" disabled={submitting} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBankEntry;
