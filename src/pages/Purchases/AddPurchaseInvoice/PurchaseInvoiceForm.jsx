import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormInput from "components/FormInput";
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
import { defaultPurchaseLine, lineTotal, PURCHASE_LINE_TYPES } from "../purchaseInvoiceHelpers";
import { HiOutlinePlusCircle, HiOutlineTrash } from "react-icons/hi2";

const STATUS_OPTS = [
  { title: "purchase:st_draft", id: "Draft" },
  { title: "purchase:st_ordered", id: "Ordered" },
  { title: "purchase:st_transit", id: "Transit" },
  { title: "purchase:st_received", id: "Received" },
];

const LINE_TYPE_OPTS = [
  { title: "purchase:raw_material", id: PURCHASE_LINE_TYPES.raw_material },
  { title: "purchase:final_product", id: PURCHASE_LINE_TYPES.final_product },
];

const PAYMENT_STATUS_OPTS = [
  { title: "Pending", id: "Pending" },
  { title: "Partial", id: "Partial" },
  { title: "Paid", id: "Cleared" },
];

const TAX_MODE_OPTS = [
  { title: "purchase:tax_mode_same", id: "same" },
  { title: "purchase:tax_mode_different", id: "different" },
];

// A line's own tax rate if it's carrying an override, otherwise the shared
// invoice-level rate — mirrors the backend's effectiveLineTaxPercent exactly,
// so the live totals shown here never drift from what actually gets saved.
const effectiveLineTaxPercent = (line, invoiceTaxPercent) =>
  line?.taxPercent !== undefined && line?.taxPercent !== null && line?.taxPercent !== ""
    ? Number(line.taxPercent) || 0
    : Number(invoiceTaxPercent) || 0;

// Purchase's own product-type vocabulary ("raw_material"/"final_product")
// isn't the same string set as Product.productType ("Raw Material"/"Finished
// Product") — this is the one place that needs to know both and bridge them,
// since the variant picker filters by the latter.
const LINE_TYPE_TO_PRODUCT_TYPE = {
  [PURCHASE_LINE_TYPES.raw_material]: "Raw Material",
  [PURCHASE_LINE_TYPES.final_product]: "Finished Product",
};

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

  const [selProductType, setSelProductType] = useState(LINE_TYPE_OPTS[0]);
  const productType = watch("productType");

  useEffect(() => {
    if (productType)
      setSelProductType(LINE_TYPE_OPTS.find((o) => o.id === productType) || LINE_TYPE_OPTS[0]);
  }, [productType]);

  const supplierSource = useDropdownSource(
    fetchSuppliersDropdown,
    { options: showSupplierDropdownOptions, page: showSupplierDropdownPage, hasMore: showSupplierDropdownHasMore, loading: showSupplierDropdownLoading },
    (s) => s.name,
  );
  const warehouseSource = useDropdownSource(
    fetchWarehousesDropdown,
    { options: showWarehouseDropdownOptions, page: showWarehouseDropdownPage, hasMore: showWarehouseDropdownHasMore, loading: showWarehouseDropdownLoading },
    (w) => `${w.code} — ${w.name}`,
    { status: "Active" },
  );
  // Filtered by the top "Type of Product" selector (Raw Material vs Finished
  // Product) — NOT by warehouse. A purchase is how new stock gets INTO a
  // warehouse in the first place, so restricting the catalog to "already
  // stocked there" would make it impossible to buy something for the first
  // time. Warehouse stays a pure destination field here, unlike Sale
  // Invoice's picker (which correctly does filter by warehouse, since a sale
  // can only ship what's physically already there).
  const variantSource = useDropdownSource(
    fetchVariantsDropdown,
    { options: showVariantDropdownOptions, page: showVariantDropdownPage, hasMore: showVariantDropdownHasMore, loading: showVariantDropdownLoading },
    (v) => `${v.productName || ""} — ${v.variantName} (${v.sku})`,
    { productType: LINE_TYPE_TO_PRODUCT_TYPE[productType] || undefined },
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

  // "Same for all" (default) vs "different per product" — purely a UI mode,
  // nothing separate is persisted for it. In "same" mode every line's own
  // taxPercent is cleared so it falls back to the shared invoice-level rate;
  // in "different" mode each line carries its own explicit override. The
  // backend computes totals with the exact same fallback rule.
  const [taxMode, setTaxMode] = useState(TAX_MODE_OPTS[0]);

  // Editing an existing invoice that already carries per-line overrides
  // (saved earlier in "different" mode) — detect that once the real lines
  // arrive via reset() and switch the UI mode to match, so the form doesn't
  // silently show "same" while the data underneath says otherwise.
  const hydratedModeRef = useRef(false);
  useEffect(() => {
    if (hydratedModeRef.current || !lines.length) return;
    const hasOverride = lines.some((l) => l?.taxPercent !== undefined && l?.taxPercent !== null && l?.taxPercent !== "");
    if (hasOverride) setTaxMode(TAX_MODE_OPTS[1]);
    hydratedModeRef.current = true;
  }, [lines]);

  const handleTaxModeChange = (opt) => {
    const next = opt || TAX_MODE_OPTS[0];
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

  const [selStatus, setSelStatus] = useState(STATUS_OPTS[0]);
  const st = watch("status");
  useEffect(() => {
    if (st) setSelStatus(STATUS_OPTS.find((o) => o.id === st) || STATUS_OPTS[0]);
  }, [st]);

  const selPaymentStatus = PAYMENT_STATUS_OPTS.find((o) => o.id === paymentStatus) || PAYMENT_STATUS_OPTS[0];

  const section =
    "text-base font-semibold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-white/15 w-full";

  return (
    <div className="space-y-8">
      <div>
        <h3 className={section}>{t("purchase:invoice_details")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="text-sm text-linkText font-medium leading-6 mb-1 block">
              {t("purchase:supplier")} <span className="text-[#EC1212]">*</span>
            </label>
            <SearchablePaginatedDropdown
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
              classes="!h-[46px] !rounded-lg"
            />
          </div>
          <FormInput
            label={t("purchase:date")}
            name="date"
            type="date"
            register={register}
            errors={errors}
            labelClass="text-sm text-linkText font-medium"
          />
          <FormInput
            label={t("purchase:expected_delivery")}
            name="expectedDelivery"
            type="date"
            register={register}
            errors={errors}
            labelClass="text-sm text-linkText font-medium"
          />
          <div>
            <label className="text-sm text-linkText font-medium leading-6 mb-1 block">
              {t("purchase:warehouse")} <span className="text-[#EC1212]">*</span>
            </label>
            <SearchablePaginatedDropdown
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
              classes="!h-[46px] !rounded-lg"
            />
          </div>
          <FormInput
            label={t("purchase:receiver_name")}
            name="receiverName"
            register={register}
            errors={errors}
            pattern={/[a-zA-Z0-9\s.'&,-]/}
            minLength={2}
            maxLength={150}
            labelClass="text-sm text-linkText font-medium"
          />
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <div className="flex-1 min-w-[200px] max-w-xs">
            <SelectDropdown
              label={t("purchase:product_type")}
              data={LINE_TYPE_OPTS}
              selected={selProductType}
              setSelected={(o) => {
                setSelProductType(o || LINE_TYPE_OPTS[0]);
                setValue("productType", o?.id ?? PURCHASE_LINE_TYPES.raw_material);
              }}
              name="productType"
              register={register}
              setValue={setValue}
              trigger={trigger}
              valueKey="id"
              errors={errors}
              hideClear
            />
          </div>
          <div className="flex-1 min-w-[220px] max-w-xs">
            <SelectDropdown
              label={t("purchase:tax_mode")}
              data={TAX_MODE_OPTS}
              selected={taxMode}
              setSelected={handleTaxModeChange}
              valueKey="id"
              hideClear
            />
          </div>
          {taxMode.id === "same" && (
            <div className="w-32">
              <label
                htmlFor="purchase-tax-pct"
                className="mb-1 block text-sm text-linkText font-medium leading-6"
              >
                {t("purchase:tax_percent")}
              </label>
              <input
                id="purchase-tax-pct"
                type="number"
                step="any"
                {...register("taxPercent", {
                  valueAsNumber: true,
                  min: { value: 0, message: "Minimum value is 0" },
                  max: { value: 100, message: "Maximum value is 100" },
                })}
                className="w-full h-[46px] rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-white/20 dark:bg-white/10 dark:text-white"
              />
              {errors.taxPercent && (
                <p className="text-red text-xs mt-1 font-medium">{errors.taxPercent.message}</p>
              )}
            </div>
          )}
          <Button
            type="button"
            title={t("purchase:add_product")}
            icon={HiOutlinePlusCircle}
            onClick={() => append(defaultPurchaseLine())}
            className="!rounded-md !h-10 !px-4 !bg-teal-500 hover:!bg-teal-600 !text-white !border-0 ml-auto"
            iconClass="!text-lg"
          />
        </div>
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
                {taxMode.id === "different" && (
                  <th className="p-2 font-semibold w-24">{t("purchase:tax_percent")}</th>
                )}
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
                  fmtMoney={fmtMoney}
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
                  {t("purchase:subtotal")}
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
                  {t("purchase:total")}
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
            data={STATUS_OPTS}
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
                defaultValue: "Status is locked once a purchase is Received — stock and accounting entries have already been posted.",
              })}
            </p>
          )}
        </div>
        {isEdit && (
          <div>
            <label className="text-sm text-linkText font-medium leading-6 mb-1 block">
              {t("purchase:payment_status")}
            </label>
            <SelectDropdown
              data={PAYMENT_STATUS_OPTS}
              selected={selPaymentStatus}
              setSelected={() => {}}
              disabled
              hideClear
              classes="!h-[46px] !rounded-lg opacity-70"
            />
            <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
              {t("purchase:payment_status_hint", {
                defaultValue: "Record payments from the invoice detail page — this only updates once money actually moves.",
              })}
            </p>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-800 dark:text-white">
          {t("purchase:notes")}
        </h4>
        <textarea
          rows={3}
          {...register("notes", { maxLength: { value: 500, message: "Maximum length is 500 characters" } })}
          className="mt-2 w-full rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 p-3 text-sm"
          placeholder={t("purchase:notes")}
        />
        {errors.notes && <p className="text-red text-xs mt-1 font-medium">{errors.notes.message}</p>}
      </div>
    </div>
  );
};

function LineRow({ index, sr, register, setValue, variantOptions, variantSource, remove, canRemove, t, taxMode, invoiceTaxPercent, fmtMoney }) {
  const { watch, formState: { errors } } = useFormContext();
  const lineErrors = errors?.products?.[index] || {};
  const row = watch(`products.${index}`) || {};
  const lt = lineTotal(row);
  const rowTaxAmount = lt * (effectiveLineTaxPercent(row, invoiceTaxPercent) / 100);
  // Per-unit landed cost — price with this line's own effective tax rate
  // folded in. Mirrors the backend's withLineTaxAmounts exactly, so what's
  // shown here while entering the purchase is the same number that gets
  // saved on the line and later reused as the stock batch's unitCost.
  const unitCost = (Number(row.price) || 0) * (1 + effectiveLineTaxPercent(row, invoiceTaxPercent) / 100);

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
              // Price is deliberately NOT auto-filled — purchase price
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
          classes="!rounded-lg"
        />
        <input type="hidden" {...register(`products.${index}.variantId`)} />
        <input type="hidden" {...register(`products.${index}.productName`)} />
      </td>
      <td className="p-2">
        <input
          type="number"
          step="any"
          onInput={(e) => { if (e.target.value.length > 10) e.target.value = e.target.value.slice(0, 10); }}
          {...register(`products.${index}.qty`, {
            valueAsNumber: true,
            min: { value: 0, message: "Minimum value is 0" },
          })}
          className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
        />
        {lineErrors.qty && <p className="mt-1 text-[11px] text-rose-600">{lineErrors.qty.message}</p>}
      </td>
      <td className="p-2">
        <input
          type="number"
          step="any"
          placeholder="0.00"
          onInput={(e) => { if (e.target.value.length > 10) e.target.value = e.target.value.slice(0, 10); }}
          {...register(`products.${index}.price`, {
            valueAsNumber: true,
            min: { value: 0, message: "Minimum value is 0" },
          })}
          className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
        />
        {lineErrors.price && <p className="mt-1 text-[11px] text-rose-600">{lineErrors.price.message}</p>}
      </td>
      <td className="p-2 pt-3 text-slate-600 dark:text-white/80 text-sm">
        {row.unit || "—"}
        <input type="hidden" {...register(`products.${index}.unit`)} />
      </td>
      <td className="p-2">
        <input
          type="date"
          {...register(`products.${index}.expiryDate`)}
          className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
        />
      </td>
      <td className="p-2 pt-3 font-semibold text-slate-800 dark:text-white">
        {lt.toLocaleString()}
      </td>
      {taxMode === "different" && (
        <td className="p-2">
          <input
            type="number"
            step="any"
            placeholder="0"
            {...register(`products.${index}.taxPercent`, {
              valueAsNumber: true,
              min: { value: 0, message: "Minimum value is 0" },
              max: { value: 100, message: "Maximum value is 100" },
            })}
            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
          />
          {lineErrors.taxPercent && <p className="mt-1 text-[11px] text-rose-600">{lineErrors.taxPercent.message}</p>}
        </td>
      )}
      <td className="p-2 pt-3 text-slate-500 dark:text-white/60 tabular-nums">
        <input
          type="text"
          value={fmtMoney(rowTaxAmount)}
          disabled
          readOnly
          className="w-full rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2 py-1.5 text-sm text-slate-500 dark:text-white/60 cursor-not-allowed"
        />
      </td>
      <td className="p-2 pt-3 text-slate-600 dark:text-white/80 tabular-nums">
        {fmtMoney(unitCost)}
      </td>
      <td className="p-2 pt-3 font-semibold text-slate-800 dark:text-white tabular-nums">
        {fmtMoney(lt + rowTaxAmount)}
      </td>
      <td className="p-2">
        {canRemove && (
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
