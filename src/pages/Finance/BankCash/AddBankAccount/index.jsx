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
  createBankAccount,
  updateBankAccount,
  showBankAccounts,
} from "store/slices/financeSlice";

const { add_customer, edit_customer } = rafeeqi_role_ids;

const TYPE_OPTS = [
  { id: "Bank", title: "Bank" },
  { id: "Cash", title: "Cash" },
];

// A bank/cash account's type and opening balance are fixed at creation — its
// backing Chart-of-Account entry (and the opening-balance journal entry, if
// any) are posted once, at creation time, so only its descriptive fields
// (name/bank name/account number/status) are ever editable afterward.
const AddBankAccount = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const accounts = useSelector(showBankAccounts);

  useEffect(() => {
    if (!accounts.length) dispatch(fetchBankAccounts());
  }, [dispatch, accounts.length]);

  const existing = useMemo(() => accounts.find((a) => a.id === id), [id, accounts]);

  const [selType, setSelType] = useState(TYPE_OPTS[0]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: "",
      bankName: "",
      accountNumber: "",
      openingBalance: "",
      currency: "SAR",
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        bankName: existing.bankName || "",
        accountNumber: existing.accountNumber || "",
        openingBalance: existing.openingBalance,
        currency: existing.currency,
      });
      const tp = TYPE_OPTS.find((x) => x.id === existing.type);
      setSelType(tp || TYPE_OPTS[0]);
    }
  }, [existing, reset]);

  useEffect(() => {
    if (id && !checkRoleAuth(edit_customer)) {
      toast.error(t("finance:not_authorized"));
      navigate("/finance/bank-cash");
    } else if (!id && !checkRoleAuth(add_customer)) {
      toast.error(t("finance:not_authorized"));
      navigate("/finance/bank-cash");
    }
  }, [id, navigate, t]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (id) {
        const result = await dispatch(
          updateBankAccount({
            id,
            data: { name: data.name, bankName: data.bankName, accountNumber: data.accountNumber },
          }),
        );
        if (result.error) throw new Error(result.payload || t("finance:save_failed"));
        toast.success(t("finance:update_success"));
      } else {
        const result = await dispatch(
          createBankAccount({
            name: data.name,
            bankName: data.bankName || undefined,
            accountNumber: data.accountNumber || undefined,
            type: selType?.id,
            currency: data.currency || "SAR",
            openingBalance: data.openingBalance ? Number(data.openingBalance) : 0,
          }),
        );
        if (result.error) throw new Error(result.payload || t("finance:save_failed"));
        toast.success(t("finance:save_success"));
      }
      navigate("/finance/bank-cash");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if ((id && !checkRoleAuth(edit_customer)) || (!id && !checkRoleAuth(add_customer)))
    return null;

  const isRTL = i18n.language === "ar";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/finance/bank-cash")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
            iconClass="!text-lg"
          />
          <h1 className="text-3xl font-bold tracking-tight">
            {id ? t("finance:edit_bank") : t("finance:add_bank")}
          </h1>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <FormInput label={t("finance:account_name")} name="name" pattern={/[a-zA-Z0-9\s.'&,-]/} minLength={2} maxLength={150} register={register} required />
            <div>
              <label className="text-sm font-medium mb-1 block">{t("finance:acct_type")}</label>
              <SelectDropdown
                data={TYPE_OPTS}
                selected={selType}
                setSelected={setSelType}
                hideClear
                disabled={!!id}
                classes="!h-[46px] !rounded-lg"
              />
            </div>
            <FormInput label={t("finance:bank_name")} name="bankName" pattern={/[a-zA-Z0-9\s.'&,-]/} minLength={2} maxLength={150} register={register} />
            <FormInput label={t("finance:iban")} name="accountNumber" pattern={/[0-9]/} minLength={8} maxLength={20} register={register} />
            <FormInput label={t("finance:balance")} name="openingBalance" type="number" min={0} decimal decimalPlaces={3} maxLength={10} register={register} disabled={!!id} />
            <FormInput label={t("finance:currency")} name="currency" register={register} disabled={!!id} />
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button type="button" title={t("cancel")} onClick={() => navigate("/finance/bank-cash")} />
            <Button type="submit" title={id ? t("update") : t("save")} btn="primary" disabled={submitting} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBankAccount;
