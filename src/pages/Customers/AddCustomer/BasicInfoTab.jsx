import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { erpGet, buildQuery } from "api/erpClient";
import { erpUrls } from "global/config";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import PhoneNumberInput from "components/PhoneNumberInput";
import PaginatedSelectBox from "components/PaginatedSelectBox";
import { DEFAULT_ADD_CUSTOMER_VALUES } from "../customerFakeData";
import {
  customerSegmentOptions,
  customerTypeOptions,
  customerStatusOptions,
} from "global/constant";

const BasicInfoTab = ({ existing }) => {
  const {
    register,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useFormContext();
  const { t } = useTranslation();

  const [selCustomerType, setSelCustomerType] = useState(
    () =>
      customerTypeOptions.find(
        (o) => o.id === DEFAULT_ADD_CUSTOMER_VALUES.customerType,
      ) || customerTypeOptions[0],
  );
  const [selSegment, setSelSegment] = useState(
    () =>
      customerSegmentOptions.find(
        (o) => o.id === DEFAULT_ADD_CUSTOMER_VALUES.customerSegment,
      ) || customerSegmentOptions[0],
  );
  const [selStatus, setSelStatus] = useState(
    () =>
      customerStatusOptions.find((o) => o.id === DEFAULT_ADD_CUSTOMER_VALUES.status) ||
      customerStatusOptions[0],
  );

  const customerTypeVal = watch("customerType");
  const segmentVal = watch("customerSegment");
  const statusVal = watch("status");

  useEffect(() => {
    if (customerTypeVal == null || customerTypeVal === "") return;
    const opt =
      customerTypeOptions.find((o) => o.id === customerTypeVal) ||
      customerTypeOptions[0];
    setSelCustomerType(opt);
  }, [customerTypeVal]);

  useEffect(() => {
    if (segmentVal == null || segmentVal === "") return;
    const opt =
      customerSegmentOptions.find((o) => o.id === segmentVal) || customerSegmentOptions[0];
    setSelSegment(opt);
  }, [segmentVal]);

  useEffect(() => {
    if (statusVal == null || statusVal === "") return;
    const opt =
      customerStatusOptions.find((o) => o.id === statusVal) || customerStatusOptions[0];
    setSelStatus(opt);
  }, [statusVal]);

  // Country -> City, both backed by the /geo endpoints via PaginatedSelectBox
  // (self-contained paging/search, no Redux wiring needed here). The City
  // box is remounted (via `key`) whenever the country changes so it starts
  // a clean page-1 load against the new country instead of carrying over
  // the previous country's already-loaded options.
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

  // Hydrate the two cascading pickers from a fetched customer (edit mode) —
  // only the country/city *names* are stored on the customer record, so
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormInput
          label={t("customers:name")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("customers:name")}
          type="text"
          name="name"
          register={register}
          required={t("customers:name_required")}
          errors={errors}
          pattern={/[a-zA-Z0-9\s.'&,-]/}
          minLength={2}
          maxLength={150}
        />
        <FormInput
          label={t("customers:email")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("customers:email")}
          type="text"
          name="email"
          register={register}
          errors={errors}
        />
        <PhoneNumberInput
          label={t("customers:phone")}
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
          label={t("customers:emergency_phone")}
          name="emergencyPhone"
          register={register}
          setValue={setValue}
          trigger={trigger}
          errors={errors}
          defPhone={existing?.emergencyPhone}
          labelClass="text-sm text-linkText font-medium"
          skipValidation
        />
        <SelectDropdown
          label={t("customers:customer_type")}
          data={customerTypeOptions}
          selected={selCustomerType}
          setSelected={setSelCustomerType}
          name="customerType"
          register={register}
          setValue={setValue}
          trigger={trigger}
          valueKey="id"
          errors={errors}
          required={t("customers:select_customer_type")}
        />
        <FormInput
          label={t("customers:company_name")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("customers:company_name")}
          type="text"
          name="companyName"
          register={register}
          errors={errors}
          pattern={/[a-zA-Z0-9\s.'&,-]/}
          minLength={2}
          maxLength={150}
        />
        <SelectDropdown
          label={t("customers:business_type")}
          data={customerSegmentOptions}
          selected={selSegment}
          setSelected={setSelSegment}
          name="customerSegment"
          register={register}
          setValue={setValue}
          trigger={trigger}
          valueKey="id"
          errors={errors}
          required={t("customers:select_business_type")}
        />
        <SelectDropdown
          label={t("customers:status")}
          data={customerStatusOptions}
          selected={selStatus}
          setSelected={setSelStatus}
          name="status"
          register={register}
          setValue={setValue}
          trigger={trigger}
          valueKey="id"
          errors={errors}
          required={t("customers:select_status")}
        />
        <FormInput
          label={t("customers:address")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("customers:address")}
          type="text"
          name="address"
          register={register}
          required={t("customers:address_required")}
          errors={errors}
          maxLength={250}
        />
        <div>
          <PaginatedSelectBox
            label={t("customers:country")}
            loadOptions={loadCountryOptions}
            value={countryId}
            selectedOption={countryId ? { value: countryId, label: countryLabel } : null}
            onOptionChange={handleCountryChange}
            placeholder={t("customers:select_country", { defaultValue: "Select country" })}
          />
          <input type="hidden" {...register("country")} />
        </div>
        <div>
          <PaginatedSelectBox
            key={countryId || "none"}
            label={t("customers:city")}
            loadOptions={loadCityOptions}
            value={cityId}
            selectedOption={cityId ? { value: cityId, label: cityLabel } : null}
            onOptionChange={handleCityChange}
            disabled={!countryId}
            placeholder={
              countryId
                ? t("customers:select_city", { defaultValue: "Select city" })
                : t("customers:select_country_first", { defaultValue: "Select a country first" })
            }
          />
          <input type="hidden" {...register("city")} />
        </div>
        <FormInput
          label={t("customers:tax_number")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("customers:tax_number")}
          type="text"
          name="taxNumber"
          register={register}
          errors={errors}
          pattern={/[A-Za-z0-9-]/}
          minLength={3}
          maxLength={50}
        />
        <FormInput
          label={t("customers:registration_number")}
          labelClass="text-sm text-linkText font-medium"
          placeholder={t("customers:registration_number")}
          type="text"
          name="registrationNumber"
          register={register}
          errors={errors}
          pattern={/[A-Za-z0-9-]/}
          minLength={3}
          maxLength={50}
        />
        <div>
          <FormInput
            label={t("customers:opening_balance")}
            labelClass="text-sm text-linkText font-medium"
            placeholder={t("customers:opening_balance")}
            type="number"
            name="openingBalance"
            register={register}
            errors={errors}
            min={0}
            decimal
            decimalPlaces={3}
            maxLength={10}
            disabled={Boolean(existing?.openingBalanceLocked)}
            inputClass={
              existing?.openingBalanceLocked
                ? "disabled:bg-slate-100 dark:disabled:bg-white/5 disabled:text-slate-500"
                : undefined
            }
          />
          <p className="text-xs text-slate-500 dark:text-white/50 mt-1.5">
            {existing?.openingBalanceLocked
              ? t("customers:opening_balance_locked_hint")
              : t("customers:opening_balance_hint")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoTab;
