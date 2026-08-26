import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
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
  createIncomeEntry,
  showBankAccounts,
  showChartOfAccounts,
} from "store/slices/financeSlice";

const { add_customer } = rafeeqi_role_ids;

// A quick misc-revenue entry — posts Debit Bank / Credit Revenue immediately
// on save, so there's no edit mode: it's already part of the permanent
// ledger the moment it's created (same rule Journal Entries follow).
const AddIncome = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const bankAccounts = useSelector(showBankAccounts);
  const coaAccounts = useSelector(showChartOfAccounts);

  useEffect(() => {
    if (!bankAccounts.length) dispatch(fetchBankAccounts());
    if (!coaAccounts.length) dispatch(fetchChartOfAccounts());
  }, [dispatch, bankAccounts.length, coaAccounts.length]);

  const bankOpts = useMemo(() => bankAccounts.map((a) => ({ id: a.id, title: `${a.name} (${a.currency})` })), [bankAccounts]);
  const [selBank, setSelBank] = useState(null);

  const revenueOpts = useMemo(
    () => coaAccounts.filter((a) => a.type === "Revenue").map((a) => ({ id: a.id, title: `${a.code} — ${a.name}` })),
    [coaAccounts],
  );
  const [selRevenue, setSelRevenue] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: { date: new Date().toISOString().slice(0, 10), source: "", description: "", amount: "" },
  });

  useEffect(() => {
    if (!checkRoleAuth(add_customer)) {
      toast.error(t("finance:not_authorized"));
      navigate("/finance/income");
    }
  }, [navigate, t]);

  const onSubmit = async (data) => {
    if (!selBank?.id || !selRevenue?.id) {
      toast.error(t("finance:invalid_data"));
      return;
    }
    setSubmitting(true);
    try {
      const result = await dispatch(
        createIncomeEntry({
          date: data.date,
          source: data.source,
          description: data.description,
          amount: parseFloat(data.amount) || 0,
          bankAccountId: selBank.id,
          revenueAccountId: selRevenue.id,
        }),
      );
      if (result.error) throw new Error(result.payload || t("finance:save_failed"));
      toast.success(t("finance:save_success"));
      navigate("/finance/income");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!checkRoleAuth(add_customer)) return null;
  const isRTL = i18n.language === "ar";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/finance/income")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
            iconClass="!text-lg"
          />
          <h1 className="text-3xl font-bold tracking-tight">{t("finance:add_income")}</h1>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <FormInput label={t("finance:posted_date")} name="date" type="date" register={register} required />
            <FormInput label={t("finance:source_label")} name="source" maxLength={200} register={register} required />
            <div className="md:col-span-2">
              <FormInput label={t("description")} name="description" maxLength={500} register={register} />
            </div>
            <FormInput label={t("finance:amount")} name="amount" type="number" step="0.01" min={0} decimal decimalPlaces={3} maxLength={10} register={register} required />
            <div>
              <label className="text-sm font-medium mb-1 block">{t("finance:bank_title")}</label>
              <SelectDropdown data={bankOpts} selected={selBank} setSelected={setSelBank} hideClear classes="!h-[46px] !rounded-lg" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t("finance:revenue")}</label>
              <SelectDropdown data={revenueOpts} selected={selRevenue} setSelected={setSelRevenue} hideClear classes="!h-[46px] !rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button type="button" title={t("cancel")} onClick={() => navigate("/finance/income")} />
            <Button type="submit" title={t("save")} btn="primary" disabled={submitting} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIncome;
