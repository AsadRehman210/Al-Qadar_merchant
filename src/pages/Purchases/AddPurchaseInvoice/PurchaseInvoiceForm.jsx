import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import SelectDropdown from "components/SelectDropdown";
import SearchablePaginatedDropdown from "components/SearchablePaginatedDropdown";
import Button from "components/Button";
import {
  fetchSuppliersDropdown,
  showSupplierDropdownOptions,
  showSupplierDropdownPage,
  showSupplierDropdownHasMore,
  showSupplierDropdownLoading,
} from "store/slices/supplierSlice";
import {
  fetchVariantsDropdown,
  showVariantDropdownOptions,
  showVariantDropdownPage,
  showVariantDropdownHasMore,
  showVariantDropdownLoading,
} from "store/slices/variantSlice";
import {
  fetchWarehousesDropdown,
  showWarehouseDropdownOptions,
  showWarehouseDropdownPage,
  showWarehouseDropdownHasMore,
  showWarehouseDropdownLoading,
} from "store/slices/warehouseSlice";
import {
  purchaseStatusOptions,
  purchaseLineTypeOptions,
  purchasePaymentStatusOptions,
  purchaseTaxModeOptions,
  purchaseTaxRecoverableOptions,
  purchaseLineTypeToProductType,
} from "global/constant";
import { defaultPurchaseLine, lineTotal, effectiveLineTaxPercent } from "global/helper";
import { HiOutlinePlusCircle, HiOutlineTrash } from "react-icons/hi2";

// Backend-driven search + infinite scroll, matching SearchablePaginatedDropdown's
// contract. extraParams re-triggers the fetch whenever it changes (e.g. the
// variant picker re-scoping to a newly-picked product type).
const useDropdownSource = (fetchThunk, selectors, titleFn, extraParams) => {
  const dispatch = useDispatch();
  const options = useSelector(selectors.options);
  const page = useSelector(selectors.page);
  const hasMore = useSelector(selectors.hasMore);
  const loading = useSelector(selectors.loading);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchThunk({ page: 1, search: "", ...extraParams }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, JSON.stringify(extraParams)]);

  const onApiSearch = (value) => {
    setSearch(value);
    dispatch(fetchThunk({ page: 1, search: value, ...extraParams }));
  };
  const onLoadMore = () => {
    if (hasMore && !loading) dispatch(fetchThunk({ page: page + 1, search, ...extraParams }));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- titleFn is an inline
  // arrow at every call site (new identity each render); including it here would
  // recompute `data` (new array identity) every render regardless of whether
  // `options` actually changed, which loops forever through any effect that
  // syncs local state off this array (infinite re-render, page appears frozen).
  const data = useMemo(() => options.map((o) => ({ ...o, title: titleFn(o) })), [options]);
  return { data, loading: loading && page === 1, paginationLoading: loading && page > 1, hasMore, onApiSearch, onLoadMore };
};

const PurchaseInvoiceForm = ({ isEdit = false, paymentStatus = null, currentStatus = null }) => {
  const { t } = useTranslation();
  const {
    register,
    control,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({ control, name: "products" });

  const [selProductType, setSelProductType] = useState(null);
  const productType = watch("productType");

  useEffect(() => {
    if (productType) {
      setSelProductType(purchaseLineTypeOptions.find((o) => o.id === productType) || null);
    } else {
      setSelProductType(null);
    }
  }, [productType]);

  const [selTaxRecoverable, setSelTaxRecoverable] = useState(purchaseTaxRecoverableOptions[0]);
  const taxRecoverableValue = watch("taxRecoverable");
  useEffect(() => {
    setSelTaxRecoverable(taxRecoverableValue === "no" ? purchaseTaxRecoverableOptions[1] : purchaseTaxRecoverableOptions[0]);
  }, [taxRecoverableValue]);

  const supplierSource = useDropdownSource(
    fetchSuppliersDropdown,
    { options: showSupplierDropdownOptions, page: showSupplierDropdownPage, hasMore: showSupplierDropdownHasMore, loading: showSupplierDropdownLoading },
    (s) => s.name,
  );
  const warehouseSource = useDropdownSource(
    fetchWarehousesDropdown,
    { options: showWarehouseDropdownOptions, page: showWarehouseDropdownPage, hasMore: showWarehouseDropdownHasMore, loading: showWarehouseDropdownLoading },
    (w) => `${w.code} ù ${w.name}`,
    { status: "Active" },
  );
  // Filtered by the top "Type of Product" selector (Raw Material vs Finished
  // Product) ù NOT by warehouse. A purchase is how new stock gets INTO a
  // warehouse in the first place, so restricting the catalog to "already
  // stocked there" would make it impossible to buy something for the first
  // time. Warehouse stays a pure destination field here, unlike Sale
  // Invoice's picker (which correctly does filter by warehouse, since a sale
  // can only ship what's physically already there).
  const variantSource = useDropdownSource(
    fetchVariantsDropdown,
    { options: showVariantDropdownOptions, page: showVariantDropdownPage, hasMore: showVariantDropdownHasMore, loading: showVariantDropdownLoading },
    (v) => `${v.productName || ""} ù ${v.variantName} (${v.sku})`,
    { productType: purchaseLineTypeToProductType[productType] || undefined },
  );
  const variantOptions = variantSource.data;

  const supplierId = watch("supplierId");
  const [selSupplier, setSelSupplier] = useState(null);
  useEffect(() => {
    if (!supplierId) return;
    const o = supplierSource.data.find((x) => x.id === supplierId);
    if (o) setSelSupplier(o);
  }, [supplierId, supplierSource.data]);

  const warehouseId = watch("warehouseId");
  const [selWarehouse, setSelWarehouse] = useState(null);
  useEffect(() => {
    if (!warehouseId) return;
    const o = warehouseSource.data.find((x) => x.id === warehouseId);
    if (o) setSelWarehouse(o);
  }, [warehouseId, warehouseSource.data]);

  const lines = useWatch({ control, name: "products" }) || [];
  const taxPercent = useWatch({ control, name: "taxPercent" }) ?? 0;

  // "Same for all" (default) vs "different per product" ù purely a UI mode,
  // nothing separate is persisted for it. In "same" mode every line's own
  // taxPercent is cleared so it falls back to the shared invoice-level rate;
  // in "different" mode each line carries its own explicit override. The
  // backend computes totals with the exact same fallback rule.
  const [taxMode, setTaxMode] = useState(purchaseTaxModeOptions[0]);

  // Editing an existing invoice that already carries per-line overrides
  // (saved earlier in "different" mode) ù detect that once the real lines
  // arrive via reset() and switch the UI mode to match, so the form doesn't
  // silently show "same" while the data underneath says otherwise.
  const hydratedModeRef = useRef(false);
  useEffect(() => {
    if (hydratedModeRef.current || !lines.length) return;
    const hasOverride = lines.some((l) => l?.taxPercent !== undefined && l?.taxPercent !== null && l?.taxPercent !== "");
    if (hasOverride) setTaxMode(purchaseTaxModeOptions[1]);
    hydratedModeRef.current = true;
  }, [lines]);

  const handleTaxModeChange = (opt) => {
    const next = opt || purchaseTaxModeOptions[0];
    setTaxMode(next);
    if (next.id === "same") {
      fields.forEach((_, idx) => setValue(`products.${idx}.taxPercent`, null));
    } else {
      fields.forEach((_, idx) => {
        const current = lines[idx]?.taxPercent;
        if (current === undefined || current === null || current === "") {
          setValue(`products.${idx}.taxPercent`, Number(taxPercent) || 0);
        }
      });
    }
  };

  const { subtotal, taxAmount, total } = useMemo(() => {
    let sub = 0;
    let tax = 0;
    for (const l of lines) {
      const lineSub = lineTotal(l);
      sub += lineSub;
      tax += lineSub * (effectiveLineTaxPercent(l, taxPercent) / 100);
    }
    return { subtotal: sub, taxAmount: tax, total: sub + tax };
  }, [lines, taxPercent]);

  const fmtMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const [selStatus, setSelStatus] = useState(purchaseStatusOptions[0]);
  const st = watch("status");
  useEffect(() => {
    if (st) setSelStatus(purchaseStatusOptions.find((o) => o.id === st) || purchaseStatusOptions[0]);
  }, [st]);

  const selPaymentStatus = purchasePaymentStatusOptions.find((o) => o.id === paymentStatus) || purchasePaymentStatusOptions[0];

  // Once Received, stock/cost/journal entries have already been posted off
  // these exact lines ù editing qty/price afterward silently desynced them
  // from Stock (no server-side re-sync existed beyond expiryDate), so the
  // whole invoice becomes read-only here. Corrections belong in a Debit Note,
  // which already reverses stock/batch/ledger correctly.
  const locked = isEdit && currentStatus === "Received";

  const section =
    "text-base font-semibold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-white/15 w-full";

  return (
    <div className="space-y-8">
      <div>
        <h3 className={section}>{t("purchase:invoice_details")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SearchablePaginatedDropdown
              label={t("purchase:supplier")}
              data={supplierSource.data}
              selected={selSupplier}
              setSelected={(o) => {
                setSelSupplier(o || null);
                setValue("supplierId", o?.id || "");
                trigger("supplierId");
              }}
              enableApiSearch
              onApiSearch={supplierSource.onApiSearch}
              hasMore={supplierSource.hasMore}
              onLoadMore={supplierSource.onLoadMore}
              paginationLoading={supplierSource.paginationLoading}
              loading={supplierSource.loading}
              name="supplierId"
              register={register}
              errors={errors}
              required
              disabled={locked}
              classes={`!h-[46px] !rounded-lg ${locked ? "opacity-70" : ""}`}
            />
          <FormInput
            label={t("purchase:date")}
            name="date"
            type="date"
            register={register}
            errors={errors}
            disabled={locked}
            labelClass="text-sm text-linkText font-medium"
          />
          <FormInput
            label={t("purchase:expected_delivery")}
            name="expectedDelivery"
            type="date"
            register={register}
            errors={errors}
            disabled={locked}
            labelClass="text-sm text-linkText font-medium"
          />
          <SearchablePaginatedDropdown
              label={t("purchase:warehouse")}
              data={warehouseSource.data}
              selected={selWarehouse}
              setSelected={(o) => {
                setSelWarehouse(o);
                setValue("warehouseId", o?.id || "");
                trigger("warehouseId");
              }}
              enableApiSearch
              onApiSearch={warehouseSource.onApiSearch}
              hasMore={warehouseSource.hasMore}
              onLoadMore={warehouseSource.onLoadMore}
              paginationLoading={warehouseSource.paginationLoading}
              loading={warehouseSource.loading}
              name="warehouseId"
              register={register}
              errors={errors}
              required
              disabled={locked}
              classes={`!h-[46px] !rounded-lg ${locked ? "opacity-70" : ""}`}
            />
          <FormInput
            label={t("purchase:receiver_name")}
            name="receiverName"
            register={register}
            errors={errors}
            pattern={/[a-zA-Z0-9\s.'&,-]/}
            minLength={2}
            maxLength={100}
            disabled={locked}
            labelClass="text-sm text-linkText font-medium"
          />
        </div>
        {locked && (
          <p className="text-xs text-slate-400 dark:text-white/40 mt-3">
            {t("purchase:invoice_locked_hint", {
              defaultValue: "This invoice is locked ù stock and accounting entries have already been posted. Use a Debit Note to correct quantities or amounts.",
            })}
          </p>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <SelectDropdown
              label={t("purchase:product_type")}
              data={purchaseLineTypeOptions}
              selected={selProductType}
              setSelected={(o) => {
                setSelProductType(o || null);
                setValue("productType", o?.id ?? "", { shouldValidate: true });
                trigger("productType");
              }}
              name="productType"
              register={register}
              setValue={setValue}
              trigger={trigger}
              valueKey="id"
              errors={errors}
              required
              disabled={locked}
              placeholder="product:select_product_type"
            />
          </div>
          <div className="flex-1 min-w-[220px] max-w-xs">
            <SelectDropdown
              label={t("purchase:tax_recoverable_label")}
              data={purchaseTaxRecoverableOptions}
              selected={selTaxRecoverable}
              setSelected={(o) => {
                const val = o?.id ?? "yes";
                setSelTaxRecoverable(o || purchaseTaxRecoverableOptions[0]);
                setValue("taxRecoverable", val, { shouldValidate: true });
                trigger("taxRecoverable");
              }}
              name="taxRecoverable"
              register={register}
              setValue={setValue}
              trigger={trigger}
              valueKey="id"
              errors={errors}
              required={{ value: true, message: t("purchase:tax_recoverable_required") }}
              hideClear
              disabled={locked}
            />
          </div>
          <div className="flex-1 min-w-[220px] max-w-xs">
            <SelectDropdown
              label={t("purchase:tax_mode")}
              data={purchaseTaxModeOptions}
              selected={taxMode}
              setSelected={handleTaxModeChange}
              valueKey="id"
              hideClear
              disabled={locked}
            />
          </div>
          {taxMode.id === "same" && (
            <div className="w-32">
              <FormInput
                label={t("purchase:tax_percent")}
                name="taxPercent"
                type="number"
                min={0}
                max={100}
                decimal
                decimalPlaces={2}
                disabled={locked}
                register={register}
                errors={errors}
                inputClass="!h-[46px] !rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
          )}
          {!locked && (
            <Button
              type="button"
              title={t("purchase:add_product")}
              icon={HiOutlinePlusCircle}
              onClick={() => append(defaultPurchaseLine())}
              className="!rounded-md !h-10 !px-4 !bg-teal-500 hover:!bg-teal-600 !text-white !border-0 ml-auto"
              iconClass="!text-lg"
            />
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-white/40 mb-3">
          {t("purchase:tax_recoverable_hint")}
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/20">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-white/10 text-left">
                <th className="p-2 font-semibold w-12 text-center">
                  {t("purchase:sr_no")}
                </th>
                <th className="p-2 font-semibold">{t("purchase:product")}</th>
                <th className="p-2 font-semibold w-20">{t("purchase:qty")}</th>
                <th className="p-2 font-semibold w-24">
                  {t("purchase:price")}
                </th>
                <th className="p-2 font-semibold w-24">{t("purchase:unit")}</th>
                <th className="p-2 font-semibold w-36 whitespace-nowrap">
                  {t("purchase:expiry_date")}
                </th>
                <th className="p-2 font-semibold w-28">
                  {t("purchase:base_amount")}
                </th>
                <th className="p-2 font-semibold w-24">{t("purchase:tax_percent")}</th>
                <th className="p-2 font-semibold w-24">{t("purchase:tax_amount")}</th>
                <th className="p-2 font-semibold w-28">{t("purchase:unit_cost")}</th>
                <th className="p-2 font-semibold w-28">{t("purchase:subtotal")}</th>
                <th className="p-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <LineRow
                  key={field.id}
                  index={index}
                  sr={index + 1}
                  register={register}
                  setValue={setValue}
                  variantOptions={variantOptions}
                  variantSource={variantSource}
                  remove={remove}
                  canRemove={fields.length > 1}
                  t={t}
                  taxMode={taxMode.id}
                  invoiceTaxPercent={taxPercent}
                  taxRecoverable={selTaxRecoverable.id !== "no"}
                  fmtMoney={fmtMoney}
                  locked={locked}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-slate-900/40 dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]">
            <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 px-5 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90">
                {t("purchase:invoice_summary_header")}
              </p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/10">
              <div className="px-4 py-4 text-center">
                <p className="mb-1 text-xs font-medium text-slate-500 dark:text-white/55">
                  {t("purchase:subtotal")} <span className="lowercase">{t("purchase:without_tax")}</span>
                </p>
                <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-white">
                  {fmtMoney(subtotal)} SAR
                </p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="mb-1 text-xs font-medium text-slate-500 dark:text-white/55">
                  {t("purchase:tax_amount")}
                </p>
                <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-white">
                  {fmtMoney(taxAmount)} SAR
                </p>
              </div>
              <div className="px-4 py-4 text-center bg-teal-50/60 dark:bg-teal-500/10">
                <p className="mb-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
                  {t("purchase:total")} <span className="lowercase">{t("purchase:with_tax")}</span>
                </p>
                <p className="text-lg font-bold tabular-nums text-teal-600 dark:text-teal-400">
                  {fmtMoney(total)} SAR
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <SelectDropdown
            label={t("purchase:status")}
            data={purchaseStatusOptions}
            selected={selStatus}
            setSelected={(o) => {
              setSelStatus(o);
              setValue("status", o?.id);
            }}
            name="status"
            register={register}
            setValue={setValue}
            trigger={trigger}
            valueKey="id"
            errors={errors}
            disabled={isEdit && currentStatus === "Received"}
            hideClear={isEdit && currentStatus === "Received"}
            classes={isEdit && currentStatus === "Received" ? "opacity-70" : ""}
          />
          {isEdit && currentStatus === "Received" && (
            <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
              {t("purchase:status_locked_hint", {
                defaultValue: "Status is locked once a purchase is Received ù stock and accounting entries have already been posted.",
              })}
            </p>
          )}
        </div>
        {isEdit && (
          <div>
            <SelectDropdown
              label={t("purchase:payment_status")}
              data={purchasePaymentStatusOptions}
              selected={selPaymentStatus}
              setSelected={() => {}}
              disabled
              hideClear
              classes="!h-[46px] !rounded-lg opacity-70"
            />
            <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
              {t("purchase:payment_status_hint", {
                defaultValue: "Record payments from the invoice detail page ù this only updates once money actually moves.",
              })}
            </p>
          </div>
        )}
      </div>

      <FormTextarea
        label={t("purchase:notes")}
        name="notes"
        register={register}
        errors={errors}
        rows={3}
        maxLength={500}
        disabled={locked}
        placeholder={t("purchase:notes")}
        className="!rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
      />
    </div>
  );
};

function LineRow({ index, sr, register, setValue, variantOptions, variantSource, remove, canRemove, t, taxMode, invoiceTaxPercent, taxRecoverable, fmtMoney, locked }) {
  const { watch, formState: { errors } } = useFormContext();
  const row = watch(`products.${index}`) || {};
  const lt = lineTotal(row);
  const rowTaxAmount = lt * (effectiveLineTaxPercent(row, invoiceTaxPercent) / 100);
  // Per-unit landed cost ù mirrors the backend's withLineTaxAmounts exactly
  // (see purchase-invoice-service.ts), so what's shown here while entering
  // the purchase is the same number that gets saved on the line and later
  // reused as the stock batch's unitCost. Recoverable tax is a VAT Receivable
  // credit, not a real product cost, so it stays out of this preview; only a
  // non-recoverable tax folds into it.
  const unitCost = taxRecoverable
    ? Number(row.price) || 0
    : (Number(row.price) || 0) * (1 + effectiveLineTaxPercent(row, invoiceTaxPercent) / 100);

  return (
    <tr className="border-t border-slate-100 dark:border-white/10 align-top">
      <td className="p-2 text-center tabular-nums text-slate-600 dark:text-white/70 font-medium">
        {sr}
      </td>
      <td className="p-2 min-w-[220px]">
        <SearchablePaginatedDropdown
          data={variantOptions}
          selected={variantOptions.find((o) => o.id === row.variantId) || null}
          setSelected={(opt) => {
            setValue(`products.${index}.variantId`, opt?.id || "");
            if (opt?.id) {
              setValue(`products.${index}.productName`, opt.title);
              // Price is deliberately NOT auto-filled ù purchase price
              // legitimately differs every time (new supplier, new deal,
              // market change), so it's always typed fresh per line.
              setValue(`products.${index}.unit`, opt.unit || "pcs");
            }
          }}
          enableApiSearch
          onApiSearch={variantSource.onApiSearch}
          hasMore={variantSource.hasMore}
          onLoadMore={variantSource.onLoadMore}
          paginationLoading={variantSource.paginationLoading}
          loading={variantSource.loading}
          placeholder={t("purchase:select_from_catalog")}
          disabled={locked}
          classes={`!rounded-lg ${locked ? "opacity-70" : ""}`}
        />
        <input type="hidden" {...register(`products.${index}.variantId`)} />
        <input type="hidden" {...register(`products.${index}.productName`)} />
      </td>
      <td className="p-2">
        <FormInput
          name={`products.${index}.qty`}
          type="number"
          min={0}
          maxLength={10}
          disabled={locked}
          register={register}
          errors={errors}
          inputClass="!h-9 !px-2 !py-1.5 !rounded disabled:opacity-70 disabled:cursor-not-allowed"
        />
      </td>
      <td className="p-2">
        <FormInput
          name={`products.${index}.price`}
          type="number"
          min={0}
          decimal
          decimalPlaces={3}
          maxLength={10}
          placeholder="0.00"
          disabled={locked}
          register={register}
          errors={errors}
          inputClass="!h-9 !px-2 !py-1.5 !rounded disabled:opacity-70 disabled:cursor-not-allowed"
        />
      </td>
      <td className="p-2 pt-3 text-slate-600 dark:text-white/80 text-sm">
        {row.unit || "ù"}
        <input type="hidden" {...register(`products.${index}.unit`)} />
      </td>
      <td className="p-2">
        <FormInput
          name={`products.${index}.expiryDate`}
          type="date"
          disabled={locked}
          register={register}
          errors={errors}
          inputClass="!h-9 !px-2 !py-1.5 !rounded disabled:opacity-70 disabled:cursor-not-allowed"
        />
      </td>
      <td className="p-2 pt-3 font-semibold text-slate-800 dark:text-white">
        {lt.toLocaleString()}
      </td>
      <td className="p-2">
        {taxMode === "different" ? (
          <FormInput
            name={`products.${index}.taxPercent`}
            type="number"
            min={0}
            max={100}
            decimal
            decimalPlaces={2}
            placeholder="0"
            disabled={locked}
            register={register}
            errors={errors}
            inputClass="!h-9 !px-2 !py-1.5 !rounded disabled:opacity-70 disabled:cursor-not-allowed"
          />
        ) : (
          <div className="pt-1.5 text-slate-600 dark:text-white/80 tabular-nums">
            {effectiveLineTaxPercent(row, invoiceTaxPercent)}%
          </div>
        )}
      </td>
      <td className="p-2 pt-3 text-slate-500 dark:text-white/60 tabular-nums">
        <FormInput
          name={`products.${index}.taxAmountDisplay`}
          value={fmtMoney(rowTaxAmount)}
          disabled
          readonly
          inputClass="!h-9 !px-2 !py-1.5 !rounded !bg-slate-50 dark:!bg-white/5 !text-slate-500 dark:!text-white/60 cursor-not-allowed"
        />
      </td>
      <td className="p-2 pt-3 text-slate-600 dark:text-white/80 tabular-nums">
        {fmtMoney(unitCost)}
      </td>
      <td className="p-2 pt-3 font-semibold text-slate-800 dark:text-white tabular-nums">
        {fmtMoney(lt + rowTaxAmount)}
      </td>
      <td className="p-2">
        {canRemove && !locked && (
          <button
            type="button"
            onClick={() => remove(index)}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
            title={t("purchase:remove")}
          >
            <HiOutlineTrash className="h-5 w-5" />
          </button>
        )}
      </td>
    </tr>
  );
}

export default PurchaseInvoiceForm;
