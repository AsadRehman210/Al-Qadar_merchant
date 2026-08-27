import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { erpGet, buildQuery } from "api/erpClient";
import { erpUrls } from "global/config";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import PhoneNumberInput from "components/PhoneNumberInput";
import PaginatedSelectBox from "components/PaginatedSelectBox";
import { DEFAULT_ADD_SUPPLIER_VALUES } from "../supplierFakeData";

const supplierTypeOptions = [
  { title: "suppliers:company", id: "Company" },
  { title: "suppliers:individual", id: "Individual" },
];
const statusOptions = [
  { title: "suppliers:active", id: "Active" },
  { title: "suppliers:inactive", id: "Inactive" },
];

const sectionTitle =
  "md:col-span-2 lg:col-span-3 text-lg font-semibold text-slate-900 dark:text-white pt-2 border-b border-slate-200 dark:border-white/10 pb-2";

const SupplierForm = ({ existing }) => {
  const { register, setValue, watch, trigger, formState: { errors } } =
    useFormContext();
  const { t } = useTranslation();
  const supplierType = watch("supplierType");

  const [selSupplierType, setSelSupplierType] = useState(
    () =>
      supplierTypeOptions.find(
        (o) => o.id === DEFAULT_ADD_SUPPLIER_VALUES.supplierType,
      ) || supplierTypeOptions[0],
  );
  const [selStatus, setSelStatus] = useState(
    () =>
      statusOptions.find((o) => o.id === DEFAULT_ADD_SUPPLIER_VALUES.status) ||
      statusOptions[0],
  );

  const supplierTypeVal = watch("supplierType");
  const statusVal = watch("status");

  useEffect(() => {
    if (supplierTypeVal == null || supplierTypeVal === "") return;
    const opt =
      supplierTypeOptions.find((o) => o.id === supplierTypeVal) ||
      supplierTypeOptions[0];
    setSelSupplierType(opt);
  }, [supplierTypeVal]);

  useEffect(() => {
    if (statusVal == null || statusVal === "") return;
    const opt =
      statusOptions.find((o) => o.id === statusVal) || statusOptions[0];
    setSelStatus(opt);
  }, [statusVal]);

  // Country -> City, both backed by the /geo endpoints via PaginatedSelectBox
  // — identical pattern to Customer's BasicInfoTab. The City box remounts
  // (via `key`) whenever the country changes so it starts a clean page-1
  // load against the new country instead of carrying over stale options.
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

  // Hydrate the two cascading pickers from a fetched supplier (edit mode) —
  // only the country/city *names* are stored on the supplier record, so
  // resolve each back to a real option (id + label) via a one-off search
  // against the same /geo endpoints.
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

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <h3 className={sectionTitle}>{t("suppliers:section_basic")}</h3>

        <FormInput
          label={t("suppliers:name")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("suppliers:name")}
          type="text"
          name="name"
          register={register}
          required={t("suppliers:name_required")}
          errors={errors}
          pattern={/[a-zA-Z0-9\s.'&,-]/}
          minLength={2}
          maxLength={150}
        />
        <FormInput
          label={t("suppliers:email")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("suppliers:email")}
          type="text"
          name="email"
          register={register}
          errors={errors}
        />
        <PhoneNumberInput
          label={t("suppliers:phone")}
          name="phone"
          register={register}
          setValue={setValue}
          trigger={trigger}
          errors={errors}
          defPhone={existing?.phone}
          labelClass="text-sm text-linkText font-medium"
          required
        />
        <PhoneNumberInput
          label={t("suppliers:emergency_phone")}
          name="emergencyPhone"
          register={register}
          setValue={setValue}
          trigger={trigger}
          errors={errors}
          defPhone={existing?.emergencyPhone}
          labelClass="text-sm text-linkText font-medium"
          skipValidation
        />
        <FormInput
          label={t("suppliers:address")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("suppliers:address")}
          type="text"
          name="address"
          register={register}
          errors={errors}
          maxLength={250}
        />
        <div>
          <PaginatedSelectBox
            label={t("suppliers:country")}
            loadOptions={loadCountryOptions}
            value={countryId}
            selectedOption={countryId ? { value: countryId, label: countryLabel } : null}
            onOptionChange={handleCountryChange}
            placeholder={t("suppliers:select_country", { defaultValue: "Select country" })}
          />
          <input type="hidden" {...register("country")} />
        </div>
        <div>
          <PaginatedSelectBox
            key={countryId || "none"}
            label={t("suppliers:city")}
            loadOptions={loadCityOptions}
            value={cityId}
            selectedOption={cityId ? { value: cityId, label: cityLabel } : null}
            onOptionChange={handleCityChange}
            disabled={!countryId}
            placeholder={
              countryId
                ? t("suppliers:select_city", { defaultValue: "Select city" })
                : t("suppliers:select_country_first", { defaultValue: "Select a country first" })
            }
          />
          <input type="hidden" {...register("city")} />
        </div>

        <SelectDropdown
          label={t("suppliers:supplier_type")}
          data={supplierTypeOptions}
          selected={selSupplierType}
          setSelected={setSelSupplierType}
          name="supplierType"
          register={register}
          setValue={setValue}
          trigger={trigger}
          valueKey="id"
          errors={errors}
          required={t("suppliers:select_supplier_type")}
        />
        <SelectDropdown
          label={t("suppliers:status")}
          data={statusOptions}
          selected={selStatus}
          setSelected={setSelStatus}
          name="status"
          register={register}
          setValue={setValue}
          trigger={trigger}
          valueKey="id"
          errors={errors}
          required={t("suppliers:select_status")}
        />
        <FormInput
          label={t("suppliers:tax_number")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("suppliers:tax_number")}
          type="text"
          name="taxNumber"
          register={register}
          errors={errors}
          pattern={/[A-Za-z0-9-]/}
          minLength={3}
          maxLength={50}
        />
        <FormInput
          label={t("suppliers:registration_number")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("suppliers:registration_number")}
          type="text"
          name="registrationNumber"
          register={register}
          errors={errors}
          pattern={/[A-Za-z0-9-]/}
          minLength={3}
          maxLength={50}
        />
        <FormInput
          label={t("suppliers:license_number")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("suppliers:license_number")}
          type="text"
          name="licenseNumber"
          register={register}
          errors={errors}
          pattern={/[A-Za-z0-9-]/}
          minLength={3}
          maxLength={50}
        />
        <FormInput
          label={t("suppliers:license_expiry_date")}
          labelClass="text-sm text-linkText font-medium"
          type="date"
          name="licenseExpiryDate"
          register={register}
          errors={errors}
        />

        {supplierType === "Company" && (
          <>
            <h3 className={sectionTitle}>
              {t("suppliers:contact_person_section")}
            </h3>
            <FormInput
              label={t("suppliers:contact_person_name")}
              labelClass="text-sm text-linkText font-medium"
              placeholder={t("suppliers:contact_person_name")}
              type="text"
              name="contactPersonName"
              register={register}
              errors={errors}
              pattern={/[a-zA-Z0-9\s.'&,-]/}
              minLength={2}
              maxLength={150}
            />
            <PhoneNumberInput
              label={t("suppliers:contact_person_phone")}
              name="contactPersonPhone"
              register={register}
              setValue={setValue}
              trigger={trigger}
              errors={errors}
              defPhone={existing?.contactPersonPhone}
              labelClass="text-sm text-linkText font-medium"
              skipValidation
            />
            <FormInput
              label={t("suppliers:contact_person_email")}
              labelClass="text-sm text-linkText font-medium"
              placeholder={t("suppliers:contact_person_email")}
              type="text"
              name="contactPersonEmail"
              register={register}
              errors={errors}
              pattern={/[a-zA-Z0-9.@_+-]/}
              maxLength={150}
            />
            <FormInput
              label={t("suppliers:designation")}
              labelClass="text-sm text-linkText font-medium"
              placeholder={t("suppliers:designation")}
              type="text"
              name="contactPersonDesignation"
              register={register}
              errors={errors}
            />
          </>
        )}

        <h3 className={sectionTitle}>{t("suppliers:bank_details")}</h3>
        <FormInput
          label={t("suppliers:bank_name")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("suppliers:bank_name")}
          type="text"
          name="bankName"
          register={register}
          errors={errors}
          pattern={/[a-zA-Z0-9\s.'&,-]/}
          minLength={2}
          maxLength={150}
        />
        <FormInput
          label={t("suppliers:account_title")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("suppliers:account_title")}
          type="text"
          name="accountTitle"
          register={register}
          errors={errors}
          pattern={/[a-zA-Z0-9\s.'&,-]/}
          minLength={2}
          maxLength={150}
        />
        <FormInput
          label={t("suppliers:account_number")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("suppliers:account_number")}
          type="text"
          name="accountNumber"
          register={register}
          errors={errors}
          pattern={/[A-Za-z0-9-]/}
          minLength={5}
          maxLength={34}
        />
        <FormInput
          label={t("suppliers:iban")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("suppliers:iban")}
          type="text"
          name="iban"
          register={register}
          errors={errors}
        />
        <FormInput
          label={t("suppliers:branch_code")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("suppliers:branch_code")}
          type="text"
          name="branchCode"
          register={register}
          errors={errors}
          pattern={/[A-Za-z0-9-]/}
          maxLength={20}
        />
        <FormInput
          label={t("suppliers:swift")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("suppliers:swift")}
          type="text"
          name="swift"
          register={register}
          errors={errors}
          pattern={/[A-Za-z0-9]/}
          minLength={8}
          maxLength={11}
        />
      </div>
    </div>
  );
};

export default SupplierForm;
