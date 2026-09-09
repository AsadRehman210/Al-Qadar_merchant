import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import PhoneNumberInput from "components/PhoneNumberInput";
import PaginatedSelectBox from "components/PaginatedSelectBox";
import { SkeletonDetail } from "components/Skeleton";
import { erpGet, buildQuery } from "api/erpClient";
import { erpUrls } from "global/config";
import { businessCategoryOptions } from "global/constant";
import {
  createMerchantErp,
  updateMerchantErp,
  showMerchantById,
  fetchMerchantById,
  showMerchantLoading,
  clearCurrentMerchant,
} from "store/slices/merchantSlice";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { add_merchant_management, edit_merchant_management } = alqadar_role_ids;

const AddMerchant = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";
  const isEdit = Boolean(id);

  const existing = useSelector(showMerchantById(id));
  const loading = useSelector(showMerchantLoading);

  useEffect(() => {
    // Always fetch full detail when editing ? the list page's Redux cache
    // only carries the lighter list DTO (see merchant-service.getAll),
    // missing fields this form needs to hydrate (country, city, address,
    // phone, etc).
    if (isEdit) dispatch(fetchMerchantById(id));
    return () => dispatch(clearCurrentMerchant());
  }, [dispatch, isEdit, id]);

  const [selCategory,  setSelCategory]  = useState(businessCategoryOptions[0]);
  const [showChangePw, setShowChangePw] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  // Left empty, this Merchant's portal falls back to its parent Admin's
  // color (or the platform default) ? only set via this form at creation,
  // never editable by the Merchant themselves.
  const [themeColor, setThemeColor] = useState("");
  const DEFAULT_THEME_COLOR = "#3643AB";
  // Set at creation, then only ever moved forward via Record Payment ?
  // locked (disabled) in this form once editing, same as Currency.
  const [portalExpiry, setPortalExpiry] = useState("");

  const { register, handleSubmit, reset, watch, setValue, trigger, getValues, formState: { errors } } = useForm({
    defaultValues: {
      name: "", email: "", phone: "",
      country: "", city: "", address: "", taxNumber: "", website: "",
      password: "", confirm_password: "",
    },
  });

  const password = watch("password");

  // Currency, backed by the /geo/currencies endpoint via PaginatedSelectBox ?
  // same cascading-picker pattern as country/city below, not a plain
  // SelectDropdown fed by a one-shot fetch.
  const [currencyId, setCurrencyId] = useState(null);
  const [currencyLabel, setCurrencyLabel] = useState(null);

  const handleCurrencyChange = (opt) => {
    setCurrencyId(opt?.value ?? null);
    setCurrencyLabel(opt?.label ?? null);
  };

  const loadCurrencyOptions = useCallback(async ({ page, size, search }) => {
    const query = buildQuery({ page, limit: size, search });
    const res = await erpGet(`${erpUrls.currencies}?${query}`);
    if (!res?.success) return { options: [], hasNextPage: false };
    return {
      options: (res.result || []).map((c) => ({ value: c.id, label: `${c.id} ? ${c.name}` })),
      hasNextPage: page < (res.total_pages || 0),
    };
  }, []);

  // Country -> City, both backed by the /geo endpoints via PaginatedSelectBox
  // ? same cascading pattern as Customers/AddCustomer/BasicInfoTab.
  const [countryId, setCountryId] = useState(null);
  const [countryLabel, setCountryLabel] = useState(null);
  const [cityId, setCityId] = useState(null);
  const [cityLabel, setCityLabel] = useState(null);

  const handleCountryChange = (opt) => {
    setCountryId(opt?.value ?? null);
    setCountryLabel(opt?.label ?? null);
    setValue("country", opt?.label || "");
    setCityId(null);
    setCityLabel(null);
    setValue("city", "");
  };

  const handleCityChange = (opt) => {
    setCityId(opt?.value ?? null);
    setCityLabel(opt?.label ?? null);
    setValue("city", opt?.label || "");
  };

  const loadCountryOptions = useCallback(async ({ page, size, search }) => {
    const query = buildQuery({ page, limit: size, search });
    const res = await erpGet(`${erpUrls.countries}?${query}`);
    if (!res?.success) return { options: [], hasNextPage: false };
    return {
      options: (res.result || []).map((c) => ({ value: c.id, label: c.name })),
      hasNextPage: page < (res.total_pages || 0),
    };
  }, []);

  const loadCityOptions = useCallback(
    async ({ page, size, search }) => {
      if (!countryId) return { options: [], hasNextPage: false };
      const query = buildQuery({ page, limit: size, search });
      const res = await erpGet(`${erpUrls.countries}/${countryId}/cities?${query}`);
      if (!res?.success) return { options: [], hasNextPage: false };
      return {
        options: (res.result || []).map((c) => ({ value: c.id, label: c.name })),
        hasNextPage: page < (res.total_pages || 0),
      };
    },
    [countryId],
  );

  useEffect(() => {
    if (existing) {
      reset({
        name:         existing.name         || "",
        email:        existing.email        || "",
        phone:        existing.phone        || "",
        country:      existing.country      || "",
        city:         existing.city         || "",
        address:      existing.address      || "",
        taxNumber:    existing.taxNumber    || "",
        website:      existing.website      || "",
        password: "", confirm_password: "",
      });
      const cat = businessCategoryOptions.find((c) => c.id === existing.businessCategory);
      if (cat) setSelCategory(cat);
      setThemeColor(existing.themeColor || "");
      setPortalExpiry(existing.portalExpiryDate ? String(existing.portalExpiryDate).slice(0, 10) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, reset]);

  // Hydrate the currency picker from a fetched merchant (edit mode) ? only
  // the code is stored on the record, resolved back to a real {value,label}
  // option via a one-off search against /geo/currencies, same as country/city.
  useEffect(() => {
    if (!existing?.currency) return;
    let cancelled = false;
    const query = buildQuery({ search: existing.currency, limit: 5 });
    erpGet(`${erpUrls.currencies}?${query}`).then((res) => {
      if (cancelled || !res?.success) return;
      const match = (res.result || []).find((c) => c.id === existing.currency);
      setCurrencyId(existing.currency);
      setCurrencyLabel(match ? `${match.id} ? ${match.name}` : existing.currency);
    });
    return () => {
      cancelled = true;
    };
  }, [existing]);

  // Hydrate the country/city pickers from a fetched merchant (edit mode) ?
  // only the name strings are stored on the record, so resolve each back to
  // a real {value,label} option via a one-off search against /geo.
  useEffect(() => {
    if (!existing?.country) return;
    let cancelled = false;
    const query = buildQuery({ search: existing.country, limit: 5 });
    erpGet(`${erpUrls.countries}?${query}`).then((res) => {
      if (cancelled || !res?.success) return;
      const match = (res.result || []).find((c) => c.name === existing.country);
      if (match) {
        setCountryId(match.id);
        setCountryLabel(match.name);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [existing]);

  useEffect(() => {
    if (!existing?.city || !countryId) return;
    let cancelled = false;
    const query = buildQuery({ search: existing.city, limit: 5 });
    erpGet(`${erpUrls.countries}/${countryId}/cities?${query}`).then((res) => {
      if (cancelled || !res?.success) return;
      const match = (res.result || []).find((c) => c.name === existing.city);
      if (match) {
        setCityId(match.id);
        setCityLabel(match.name);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [existing, countryId]);

  const today = new Date().toISOString().split("T")[0];

  const onSubmit = async (data) => {
    if (!isEdit && data.password !== data.confirm_password) {
      toast.error(t("password_same"));
      return;
    }
    if (isEdit && showChangePw && data.password && data.password !== data.confirm_password) {
      toast.error(t("password_same"));
      return;
    }
    if (!data.phone) {
      toast.error(t("phone_number_required"));
      return;
    }
    if (!countryId) {
      toast.error(t("merchant:select_country", { defaultValue: "Select country" }));
      return;
    }
    if (!cityId) {
      toast.error(t("merchant:select_city", { defaultValue: "Select city" }));
      return;
    }
    if (themeColor && !/^#?[0-9A-Fa-f]{6}$/.test(themeColor)) {
      toast.error(t("merchant:invalid_theme_color", { defaultValue: "Enter a valid hex color (e.g. #3643AB)." }));
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await dispatch(updateMerchantErp({
          id,
          data: {
            name: data.name,
            phone: data.phone,
            country: data.country,
            city: data.city,
            address: data.address,
            taxNumber: data.taxNumber,
            website: data.website,
            businessCategory: selCategory?.id,
            themeColor: themeColor || null,
            ...(showChangePw && data.password ? { password: data.password } : {}),
          },
        })).unwrap();
        toast.success(t("merchant:update_success"));
        navigate(`/merchant-management/detail/${id}`);
      } else {
        const result = await dispatch(createMerchantErp({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone,
          country: data.country,
          city: data.city,
          address: data.address,
          taxNumber: data.taxNumber,
          website: data.website,
          businessCategory: selCategory?.id,
          currency: currencyId,
          themeColor: themeColor || undefined,
          portalExpiryDate: portalExpiry || undefined,
        })).unwrap();
        toast.success(t("merchant:save_success"));
        navigate(`/merchant-management/detail/${result.id}`);
      }
    } catch (err) {
      toast.error(err || t("merchant:save_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const labelCls = "text-sm font-medium text-linkText mb-1 block";
  const sectionTitle = "text-lg font-semibold text-slate-900 dark:text-white pb-2 mb-6 border-b border-slate-200 dark:border-white/10";

  if ((isEdit && !checkRoleAuth(edit_merchant_management)) || (!isEdit && !checkRoleAuth(add_merchant_management))) return null;

  if (isEdit && loading && !existing) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={10} />
      </div>
    );
  }

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/merchant-management")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 transition-all"
            iconClass="!text-lg"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEdit ? t("merchant:edit_merchant") : t("merchant:add_merchant")}
            </h1>
            <p className="text-mutedForeground text-sm mt-1">{t("merchant:module_desc")}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Basic Info */}
          <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]">
            <h3 className={sectionTitle}>{t("merchant:basic_info")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormInput label={t("merchant:name")} name="name" register={register} errors={errors} required={t("merchant:name_required")} placeholder={t("merchant:name")} pattern={/[a-zA-Z0-9\s.'&,-]/} minLength={2} maxLength={100} />
              <FormInput label={t("merchant:email")} name="email" register={register} errors={errors} required={t("merchant:email_required")} type="email" placeholder="merchant@example.com" />
              <PhoneNumberInput
                label={t("merchant:phone")}
                name="phone"
                register={register}
                setValue={setValue}
                trigger={trigger}
                errors={errors}
                required={t("phone_number_required")}
                defPhone={existing?.phone}
                labelClass="text-sm font-medium text-linkText mb-1"
              />
              <div>
                <PaginatedSelectBox
                  label={t("merchant:country")}
                  required
                  loadOptions={loadCountryOptions}
                  value={countryId}
                  selectedOption={countryId ? { value: countryId, label: countryLabel } : null}
                  onOptionChange={handleCountryChange}
                  placeholder={t("merchant:select_country", { defaultValue: "Select country" })}
                />
                <input type="hidden" {...register("country")} />
              </div>
              <div>
                <PaginatedSelectBox
                  key={countryId || "none"}
                  label={t("merchant:city")}
                  required
                  loadOptions={loadCityOptions}
                  value={cityId}
                  selectedOption={cityId ? { value: cityId, label: cityLabel } : null}
                  onOptionChange={handleCityChange}
                  disabled={!countryId}
                  placeholder={
                    countryId
                      ? t("merchant:select_city", { defaultValue: "Select city" })
                      : t("merchant:select_country_first", { defaultValue: "Select a country first" })
                  }
                />
                <input type="hidden" {...register("city")} />
              </div>
              <FormInput label={t("merchant:address")} name="address" register={register} errors={errors} placeholder={t("merchant:address")} pattern={/[a-zA-Z0-9\s.'-]/} minLength={5} maxLength={250} />
              <FormInput label={t("merchant:tax_number")} name="taxNumber" register={register} errors={errors} placeholder="TAX-XXXXXXX" pattern={/[A-Za-z0-9-]/} minLength={3} maxLength={50} />
              <FormInput label={t("merchant:website")} name="website" register={register} errors={errors} placeholder="https://example.com" pattern={/[a-zA-Z0-9:/.\-_?=&%]/} maxLength={200} />
              <SelectDropdown
                label={t("merchant:category")}
                data={businessCategoryOptions}
                selected={selCategory}
                setSelected={setSelCategory}
                hideClear
                classes="!h-[46px] !rounded-lg"
              />
              <div>
                <PaginatedSelectBox
                  label={t("merchant:currency")}
                  required
                  loadOptions={loadCurrencyOptions}
                  value={currencyId}
                  selectedOption={currencyId ? { value: currencyId, label: currencyLabel } : null}
                  onOptionChange={handleCurrencyChange}
                  disabled={isEdit}
                  placeholder={t("merchant:select_currency", { defaultValue: "Select currency" })}
                />
                {isEdit && (
                  <p className="text-xs text-slate-400 dark:text-white/40 mt-1">{t("merchant:currency_locked_hint")}</p>
                )}
              </div>
              <div>
                <FormInput
                  label={t("merchant:payment_expiry")}
                  type="date"
                  value={portalExpiry}
                  onValueChange={setPortalExpiry}
                  min={!isEdit ? today : undefined}
                  disabled={isEdit}
                  inputClass="!h-[46px] !rounded-lg"
                />
                {isEdit && (
                  <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
                    {t("merchant:portal_expiry_locked_hint", { defaultValue: "Only changes via Record Payment (Payments tab)." })}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>{t("merchant:theme_color", { defaultValue: "Theme color" })}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeColor || DEFAULT_THEME_COLOR}
                    onChange={(e) => setThemeColor(e.target.value.toUpperCase())}
                    className="h-10 w-14 rounded-md border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 p-1 cursor-pointer"
                  />
                  <FormInput
                    value={themeColor}
                    onValueChange={(v) => setThemeColor((v || "").toUpperCase())}
                    placeholder={DEFAULT_THEME_COLOR}
                    pattern={/[#0-9A-Fa-f]/}
                    maxLength={7}
                    wrapperClass="flex-1"
                    inputClass="!h-10 !rounded-md"
                  />
                  {themeColor && (
                    <button
                      type="button"
                      onClick={() => setThemeColor("")}
                      className="h-10 px-3 rounded-md border border-slate-200 dark:border-white/20 text-sm text-slate-600 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/10"
                    >
                      {t("merchant:use_default", { defaultValue: "Use default" })}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400 dark:text-white/40">
                  {t("merchant:theme_color_hint", {
                    defaultValue: "Leave unset to inherit your own portal color (or the platform default, {{color}}).",
                    color: DEFAULT_THEME_COLOR,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Account Credentials */}
          <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8">
            {isEdit ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("admin:credentials")}</h3>
                  <button
                    type="button"
                    onClick={() => setShowChangePw(!showChangePw)}
                    className="text-sm hover:underline font-medium text-[var(--color-teal-500)]"
                  >
                    {showChangePw ? t("admin:cancel_change_pw") : t("admin:change_password")}
                  </button>
                </div>
                {!showChangePw && (
                  <p className="text-sm text-slate-400 dark:text-white/40 py-2">{t("admin:pw_hidden_hint")}</p>
                )}
                {showChangePw && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label={t("password")} name="password" type="password" register={register} errors={errors} getValues={getValues} placeholder={t("enter_password")} />
                    <FormInput label={t("confirm_password")} name="confirm_password" type="password" register={register} errors={errors} getValues={getValues} placeholder={t("enter_confirm_password")} />
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className={sectionTitle}>{t("admin:credentials")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    label={t("password")}
                    name="password"
                    type="password"
                    register={register}
                    errors={errors}
                    getValues={getValues}
                    required={t("enter_password")}
                    placeholder={t("enter_password")}
                  />
                  <FormInput
                    label={t("confirm_password")}
                    name="confirm_password"
                    type="password"
                    register={register}
                    errors={errors}
                    getValues={getValues}
                    required={t("enter_confirm_password")}
                    placeholder={t("enter_confirm_password")}
                    validate={(val) => val === password || t("password_same")}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-3">{t("password_security_hint")}</p>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-end pt-2">
            <Button type="button" title={t("cancel")} onClick={() => navigate("/merchant-management")} className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
            <Button type="submit" title={isEdit ? t("update") : t("save")} btn="primary" loading={submitting} disabled={submitting} className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMerchant;
