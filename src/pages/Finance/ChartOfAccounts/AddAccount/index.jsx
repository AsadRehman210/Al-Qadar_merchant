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
  fetchChartOfAccounts,
  createChartOfAccount,
  updateChartOfAccount,
  showChartOfAccounts,
} from "store/slices/financeSlice";

const { add_customer, edit_customer } = rafeeqi_role_ids;

const TYPE_OPTS = [
  { id: "Asset",     title: "finance:type_asset" },
  { id: "Liability", title: "finance:type_liability" },
  { id: "Equity",    title: "finance:type_equity" },
  { id: "Revenue",   title: "finance:type_revenue" },
  { id: "Expense",   title: "finance:type_expense" },
];

const SUB_TYPE_OPTS = [
  { id: "current_asset",       title: "Current Asset",        forTypes: ["Asset"] },
  { id: "fixed_asset",         title: "Fixed Asset",          forTypes: ["Asset"] },
  { id: "vat_receivable",      title: "VAT Receivable",       forTypes: ["Asset"] },
  { id: "current_liability",   title: "Current Liability",    forTypes: ["Liability"] },
  { id: "long_term_liability", title: "Long-Term Liability",  forTypes: ["Liability"] },
  { id: "vat_payable",         title: "VAT Payable",          forTypes: ["Liability"] },
  { id: "retained_earnings",   title: "Retained Earnings",    forTypes: ["Equity"] },
  { id: "other_equity",        title: "Other Equity",         forTypes: ["Equity"] },
  { id: "operating_revenue",   title: "Operating Revenue",    forTypes: ["Revenue"] },
  { id: "other_revenue",       title: "Other Revenue",        forTypes: ["Revenue"] },
  { id: "cogs",                title: "Cost of Goods Sold",   forTypes: ["Expense"] },
  { id: "operating_expense",   title: "Operating Expense",    forTypes: ["Expense"] },
  { id: "tax_expense",         title: "Tax Expense",          forTypes: ["Expense"] },
];

const STATUS_OPTS = [
  { id: "Active",   title: "product:status_active" },
  { id: "Inactive", title: "product:status_inactive" },
];

const AddAccount = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const accounts = useSelector(showChartOfAccounts);

  useEffect(() => {
    if (!accounts.length) dispatch(fetchChartOfAccounts());
  }, [dispatch, accounts.length]);

  const existing = useMemo(() => accounts.find((a) => a.id === id), [id, accounts]);

  const [selType, setSelType]     = useState(TYPE_OPTS[0]);
  const [selSubType, setSelSubType] = useState(null);
  const [selParent, setSelParent] = useState(null);
  const [selStatus, setSelStatus] = useState(STATUS_OPTS[0]);
  const [submitting, setSubmitting] = useState(false);

  const filteredSubTypes = useMemo(
    () => SUB_TYPE_OPTS.filter((s) => s.forTypes.includes(selType?.id)),
    [selType],
  );

  const parentOpts = useMemo(
    () => [
      { id: "", title: "— None (root account) —" },
      ...accounts
        .filter((a) => !a.parentId && a.id !== id)
        .map((a) => ({ id: a.id, title: `${a.code} — ${a.name}` })),
    ],
    [id, accounts],
  );

  const { register, handleSubmit, reset } = useForm({ defaultValues: { code: "", name: "" } });

  useEffect(() => {
    if (existing) {
      reset({ code: existing.code, name: existing.name });
      setSelType(TYPE_OPTS.find((x) => x.id === existing.type) || TYPE_OPTS[0]);
      setSelSubType(SUB_TYPE_OPTS.find((x) => x.id === existing.subType) || null);
      setSelParent(parentOpts.find((x) => x.id === existing.parentId) || parentOpts[0]);
      setSelStatus(STATUS_OPTS.find((x) => x.id === existing.status) || STATUS_OPTS[0]);
    }
  }, [existing, reset, parentOpts]);

  useEffect(() => {
    if (id && !checkRoleAuth(edit_customer)) {
      toast.error(t("finance:not_authorized"));
      navigate("/finance/coa");
    } else if (!id && !checkRoleAuth(add_customer)) {
      toast.error(t("finance:not_authorized"));
      navigate("/finance/coa");
    }
  }, [id, navigate, t]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (id) {
        // Code/type/parent are permanently fixed once an account exists —
        // every ledger posting references accounts by code, so only the
        // display name and active/inactive status are ever editable.
        const result = await dispatch(
          updateChartOfAccount({ id, data: { name: data.name, status: selStatus?.id } }),
        );
        if (result.error) throw new Error(result.payload || t("finance:save_failed"));
        toast.success(t("finance:update_success"));
      } else {
        const result = await dispatch(
          createChartOfAccount({
            code: data.code,
            name: data.name,
            type: selType?.id,
            subType: selSubType?.id || undefined,
            parentId: selParent?.id || undefined,
            status: selStatus?.id,
          }),
        );
        if (result.error) throw new Error(result.payload || t("finance:save_failed"));
        toast.success(t("finance:save_success"));
      }
      navigate("/finance/coa");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if ((id && !checkRoleAuth(edit_customer)) || (!id && !checkRoleAuth(add_customer))) return null;
  const isRTL = i18n.language === "ar";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/finance/coa")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
            iconClass="!text-lg"
          />
          <h1 className="text-3xl font-bold tracking-tight">
            {id ? t("finance:edit_account") : t("finance:add_account")}
          </h1>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <FormInput label={t("finance:account_code")} name="code" pattern={/[A-Za-z0-9\-_/]/} minLength={2} maxLength={50} register={register} required disabled={!!id} />
            <FormInput label={t("finance:account_name")} name="name" pattern={/[a-zA-Z0-9\s.'&,-]/} minLength={2} maxLength={150} register={register} required />

            {/* Account Type */}
            <div>
              <label className="text-sm font-medium text-linkText mb-1 block">{t("finance:account_type")}</label>
              <SelectDropdown
                data={TYPE_OPTS}
                selected={selType}
                setSelected={(opt) => { setSelType(opt); setSelSubType(null); }}
                hideClear
                disabled={!!id}
                classes="!h-[46px] !rounded-lg"
              />
            </div>

            {/* Sub-type */}
            <div>
              <label className="text-sm font-medium text-linkText mb-1 block">{t("finance:coa_sub_type")}</label>
              <SelectDropdown
                data={filteredSubTypes}
                selected={selSubType}
                setSelected={setSelSubType}
                classes="!h-[46px] !rounded-lg"
                placeholder={t("finance:select_sub_type")}
                disabled={!!id}
              />
            </div>

            {/* Parent Account */}
            <div>
              <label className="text-sm font-medium text-linkText mb-1 block">{t("finance:coa_parent")}</label>
              <SelectDropdown
                data={parentOpts}
                selected={selParent || parentOpts[0]}
                setSelected={setSelParent}
                hideClear
                disabled={!!id}
                classes="!h-[46px] !rounded-lg"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-linkText mb-1 block">{t("product:status")}</label>
              <SelectDropdown
                data={STATUS_OPTS}
                selected={selStatus}
                setSelected={setSelStatus}
                hideClear
                classes="!h-[46px] !rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button type="button" title={t("cancel")} onClick={() => navigate("/finance/coa")} />
            <Button type="submit" title={id ? t("update") : t("save")} btn="primary" disabled={submitting} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccount;
