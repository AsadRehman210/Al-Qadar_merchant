import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  fetchAssetCategories,
  fetchAssetById,
  createAsset,
  updateAsset,
  updateAssetInsurance,
  showAssetCategories,
  showCurrentAsset,
} from "store/slices/assetSlice";

const { add_customer, edit_customer } = rafeeqi_role_ids;

const DEPR_METHOD_OPTS = [
  { id: "straight_line", title: "asset:straight_line" },
  { id: "declining",     title: "asset:declining_balance" },
];

const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");

const AddAsset = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";
  const [submitting, setSubmitting] = useState(false);

  const categories = useSelector(showAssetCategories);
  const existing = useSelector(showCurrentAsset);

  useEffect(() => {
    dispatch(fetchAssetCategories());
  }, [dispatch]);

  useEffect(() => {
    if (id) dispatch(fetchAssetById(id));
  }, [dispatch, id]);

  const categoryOpts = useMemo(
    () => categories.filter((c) => c.status === "Active").map((c) => ({ id: c.id, title: `${c.code} — ${c.name}` })),
    [categories],
  );

  const [selCategory, setSelCategory] = useState(null);
  const [selDeprMethod, setSelDeprMethod] = useState(DEPR_METHOD_OPTS[0]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    mode: "onChange",
    defaultValues: {
      name: "", categoryId: "", serialNumber: "", location: "",
      purchaseDate: "", warrantyUntil: "",
      purchaseCost: "", currentValue: "", currency: "SAR",
      usefulLifeYears: 5, salvageValue: 0,
      insPolicyNo: "", insProvider: "", insStartDate: "", insExpiryDate: "", insPremium: "", insCoverage: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (id && existing && existing.id === id) {
      reset({
        name: existing.name || "",
        categoryId: existing.categoryId || "",
        serialNumber: existing.serialNumber || "",
        location: existing.location || "",
        purchaseDate: toDateInput(existing.purchaseDate),
        warrantyUntil: toDateInput(existing.warrantyUntil),
        purchaseCost: existing.purchaseCost ?? "",
        currentValue: existing.currentValue ?? "",
        currency: existing.currency || "SAR",
        usefulLifeYears: existing.usefulLifeYears ?? 5,
        salvageValue: existing.salvageValue ?? 0,
        insPolicyNo: existing.insurance?.policyNo || "",
        insProvider: existing.insurance?.provider || "",
        insStartDate: toDateInput(existing.insurance?.startDate),
        insExpiryDate: toDateInput(existing.insurance?.expiryDate),
        insPremium: existing.insurance?.premiumAmount || "",
        insCoverage: existing.insurance?.coverageAmount || "",
        notes: existing.notes || "",
      });
      setSelCategory(categoryOpts.find((o) => o.id === existing.categoryId) || null);
      setSelDeprMethod(DEPR_METHOD_OPTS.find((o) => o.id === existing.depreciationMethod) || DEPR_METHOD_OPTS[0]);
    }
  }, [id, existing, reset, categoryOpts]);

  useEffect(() => {
    if (id && !checkRoleAuth(edit_customer)) { toast.error(t("asset:not_authorized")); navigate("/assets"); }
    else if (!id && !checkRoleAuth(add_customer)) { toast.error(t("asset:not_authorized")); navigate("/assets"); }
  }, [id, navigate, t]);

  const onSubmit = async (data) => {
    if (!selCategory?.id) { toast.error(t("asset:category_required")); return; }
    if (!String(data.name || "").trim()) { toast.error(t("asset:name_required")); return; }

    const payload = {
      name: data.name,
      categoryId: selCategory.id,
      serialNumber: data.serialNumber || undefined,
      location: data.location || undefined,
      purchaseDate: data.purchaseDate || undefined,
      warrantyUntil: data.warrantyUntil || undefined,
      purchaseCost: data.purchaseCost === "" ? undefined : parseFloat(data.purchaseCost),
      currentValue: data.currentValue === "" ? undefined : parseFloat(data.currentValue),
      currency: data.currency || "SAR",
      depreciationMethod: selDeprMethod?.id || "straight_line",
      usefulLifeYears: data.usefulLifeYears === "" ? undefined : parseInt(data.usefulLifeYears, 10),
      salvageValue: data.salvageValue === "" ? undefined : parseFloat(data.salvageValue),
      notes: data.notes || undefined,
    };

    setSubmitting(true);
    try {
      let assetId = id;
      if (id) {
        await dispatch(updateAsset({ id, data: payload })).unwrap();
      } else {
        const created = await dispatch(createAsset(payload)).unwrap();
        assetId = created?.id;
      }
      // Insurance is set through its own endpoint (updateAssetInsurance) —
      // only call it if the user actually filled something in, so a bare
      // create doesn't post an empty insurance object.
      const hasInsurance = data.insPolicyNo || data.insProvider || data.insExpiryDate || data.insPremium || data.insCoverage;
      if (assetId && hasInsurance) {
        await dispatch(updateAssetInsurance({
          id: assetId,
          data: {
            policyNo: data.insPolicyNo || undefined,
            provider: data.insProvider || undefined,
            startDate: data.insStartDate || undefined,
            expiryDate: data.insExpiryDate || undefined,
            premiumAmount: data.insPremium === "" ? undefined : parseFloat(data.insPremium),
            coverageAmount: data.insCoverage === "" ? undefined : parseFloat(data.insCoverage),
          },
        })).unwrap();
      }
      toast.success(id ? t("asset:update_success") : t("asset:save_success"));
      navigate("/assets");
    } catch (message) {
      toast.error(message || t("asset:save_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (id && !checkRoleAuth(edit_customer)) return null;
  if (!id && !checkRoleAuth(add_customer)) return null;

  const sectionCls = "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/assets")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold">{id ? t("asset:edit_asset") : t("asset:add_asset")}</h1>
            <p className="text-mutedForeground">{t("asset:assets_desc")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className={sectionCls}>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-5">{t("asset:basic_info")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput label={t("asset:asset_name")} name="name" register={register} errors={errors} required
                pattern={/[a-zA-Z0-9\s.'-]/} minLength={2} maxLength={150} />
              <div>
                <label className="text-sm font-medium text-linkText mb-1 block">{t("asset:category")}</label>
                <SelectDropdown data={categoryOpts} selected={selCategory}
                  setSelected={(opt) => { setSelCategory(opt || null); setValue("categoryId", opt?.id ?? ""); }}
                  placeholder={t("asset:select_category")} hideClear classes="!h-[46px] !rounded-lg" />
              </div>
              <FormInput label={t("asset:serial_number")} name="serialNumber" register={register} errors={errors}
                pattern={/[A-Za-z0-9\-_/]/} minLength={2} maxLength={100} />
              <FormInput label={t("asset:location")} name="location" register={register} errors={errors}
                pattern={/[a-zA-Z0-9\s.'-]/} minLength={2} maxLength={150} />
              <FormInput label={t("asset:purchase_date")} name="purchaseDate" type="date" register={register} />
              <FormInput label={t("asset:warranty_until")} name="warrantyUntil" type="date" register={register} />
              <FormInput label={t("asset:currency")} name="currency" register={register} errors={errors}
                placeholder="SAR" pattern={/[A-Za-z]/} maxLength={3} />
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-linkText mb-1 block">{t("asset:notes")}</label>
                <textarea {...register("notes", { maxLength: { value: 500, message: t("asset:max_length_500", { defaultValue: "Maximum length is 500 characters" }) } })} rows={3}
                  className="w-full rounded-lg border border-[#E0E5F2] bg-white px-3 py-2 text-sm text-black focus:border-[#ffba32] focus:outline-0 dark:bg-white/10 dark:border-white/20 dark:text-white" />
                {errors.notes && <p className="text-red text-xs mt-1 font-medium">{errors.notes.message}</p>}
              </div>
            </div>
          </div>

          {/* Valuation & Depreciation */}
          <div className={sectionCls.replace("!border-l-[var(--color-teal-500)]", "!border-l-purple-500")}>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-5">{t("asset:valuation_depreciation")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormInput label={t("asset:purchase_cost")} name="purchaseCost" type="number" register={register} errors={errors}
                placeholder="0" min={0} decimal decimalPlaces={3} maxLength={10} />
              <FormInput label={t("asset:current_value")} name="currentValue" type="number" register={register} errors={errors}
                placeholder="0" min={0} decimal decimalPlaces={3} maxLength={10} />
              <div>
                <label className="text-sm font-medium text-linkText mb-1 block">{t("asset:depr_method")}</label>
                <SelectDropdown data={DEPR_METHOD_OPTS} selected={selDeprMethod} setSelected={setSelDeprMethod} hideClear classes="!h-[46px] !rounded-lg" />
              </div>
              <FormInput label={t("asset:useful_life")} name="usefulLifeYears" type="number" register={register} errors={errors}
                placeholder="5" min={1} max={50} />
              <FormInput label={t("asset:salvage_value")} name="salvageValue" type="number" register={register} errors={errors}
                placeholder="0" min={0} decimal decimalPlaces={3} maxLength={10} />
            </div>
            <div className="mt-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 text-xs text-purple-700 dark:text-purple-300">
              {t("asset:depr_hint")}
            </div>
            {!id && (
              <div className="mt-4 p-3 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 text-xs text-teal-700 dark:text-teal-300">
                {t("asset:acquisition_journal_hint")}
              </div>
            )}
          </div>

          {/* Insurance */}
          <div className={sectionCls.replace("!border-l-[var(--color-teal-500)]", "!border-l-blue-500")}>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">{t("asset:insurance")}</h3>
            <p className="text-sm text-mutedForeground mb-5">{t("asset:insurance_optional")}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <FormInput label={t("asset:policy_no")}      name="insPolicyNo"  register={register} errors={errors}
                pattern={/[A-Za-z0-9\-_/]/} minLength={2} maxLength={100} />
              <FormInput label={t("asset:insurer")}         name="insProvider"  register={register} errors={errors}
                pattern={/[a-zA-Z0-9\s.'-]/} minLength={2} maxLength={150} />
              <FormInput label={t("asset:policy_start")}    name="insStartDate" type="date" register={register} />
              <FormInput label={t("asset:policy_expiry")}   name="insExpiryDate" type="date" register={register} />
              <FormInput label={t("asset:premium_amount")}  name="insPremium"   type="number" register={register} errors={errors}
                min={0} decimal decimalPlaces={3} maxLength={10} />
              <FormInput label={t("asset:coverage_amount")} name="insCoverage"  type="number" register={register} errors={errors}
                min={0} decimal decimalPlaces={3} maxLength={10} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-end pt-2">
            <Button type="button" title={t("cancel")} onClick={() => navigate("/assets")}
              className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
            <Button type="submit" title={id ? t("update") : t("save")} btn="primary" disabled={submitting}
              className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAsset;
