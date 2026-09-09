import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import SearchablePaginatedDropdown from "components/SearchablePaginatedDropdown";
import Button from "components/Button";
import { HiOutlinePlusCircle, HiOutlineTrash } from "react-icons/hi2";
import { fetchVariantsDropdown } from "store/slices/variantSlice";
import { fetchWarehousesDropdown } from "store/slices/warehouseSlice";
import { defaultRawLine, defaultOutputLine, defaultOtherCostLine, computeProductionCost } from "../productionHelpers";

const fmtNum = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });

const variantOptionLabel = (v) => `${v.sku} — ${v.variantName || v.productName || ""}`.trim();

// One product-type-filtered, server-paginated/searched variant picker.
// Used per raw line (scoped to that line's warehouse) and once for finished output.
const useVariantPicker = (productType, warehouseId) => {
  const dispatch = useDispatch();
  const [options, setOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const detailsRef = useRef({});

  const load = useCallback(
    async (nextPage, nextSearch) => {
      setLoading(true);
      const result = await dispatch(
        fetchVariantsDropdown({ page: nextPage, search: nextSearch, productType, warehouseId }),
      ).unwrap();
      const mapped = (result.result || []).map((v) => ({ ...v, title: variantOptionLabel(v) }));
      mapped.forEach((v) => { detailsRef.current[v.id] = v; });
      setOptions((prev) => (nextPage === 1 ? mapped : [...prev, ...mapped]));
      setPage(nextPage);
      setHasMore(nextPage < (result.total_pages || 0));
      setLoading(false);
    },
    [dispatch, productType, warehouseId],
  );

  useEffect(() => {
    load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType, warehouseId]);

  const onApiSearch = useCallback((value) => { setSearch(value); load(1, value); }, [load]);
  const onLoadMore = useCallback(() => { if (hasMore && !loading) load(page + 1, search); }, [hasMore, loading, load, page, search]);

  return { options, hasMore, loading: loading && page === 1, paginationLoading: loading, onApiSearch, onLoadMore, detailsRef };
};

const useWarehouseOptions = () => {
  const dispatch = useDispatch();
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [warehousePage, setWarehousePage] = useState(1);
  const [warehouseHasMore, setWarehouseHasMore] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);

  const loadWarehouses = useCallback(
    async (nextPage, search) => {
      setWarehouseLoading(true);
      const result = await dispatch(fetchWarehousesDropdown({ page: nextPage, search })).unwrap();
      const mapped = (result.result || []).map((w) => ({ ...w, title: `${w.code} — ${w.name}` }));
      setWarehouseOptions((prev) => (nextPage === 1 ? mapped : [...prev, ...mapped]));
      setWarehousePage(nextPage);
      setWarehouseHasMore(nextPage < (result.total_pages || 0));
      setWarehouseLoading(false);
    },
    [dispatch],
  );

  useEffect(() => {
    loadWarehouses(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    warehouseOptions,
    warehouseHasMore,
    warehouseLoading,
    warehousePage,
    loadWarehouses,
  };
};

const ProductionOrderForm = () => {
  const { t } = useTranslation();
  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({ control, name: "rawLines" });
  const {
    fields: outputFields,
    append: appendOutput,
    remove: removeOutput,
  } = useFieldArray({ control, name: "outputLines" });
  const {
    fields: otherCostFields,
    append: appendOtherCost,
    remove: removeOtherCost,
  } = useFieldArray({ control, name: "otherCostLines" });

  const warehouses = useWarehouseOptions();
  const outputPicker = useVariantPicker("Finished Product");

  const variantId = watch("outputVariantId");
  const quarantineLotId = watch("quarantineLotId");
  const quarantineLotNumber = watch("quarantineLotNumber");
  const isRenew = Boolean(quarantineLotId);

  const selVariant = useMemo(
    () => outputPicker.detailsRef.current[variantId] || outputPicker.options.find((o) => o.id === variantId) || null,
    [outputPicker.options, variantId],
  );

  const watchedRawLines = useWatch({ control, name: "rawLines" });
  const watchedOutputLines = useWatch({ control, name: "outputLines" });
  const watchedOtherCostLines = useWatch({ control, name: "otherCostLines" });
  const quarantineQty = watch("quarantineQty");
  const quarantineCostPrice = watch("quarantineCostPrice");

  const variantCostById = useMemo(() => {
    const map = new Map();
    (watchedRawLines || []).forEach((l) => {
      if (l?.variantId && l.costPrice != null && l.costPrice !== "") {
        map.set(l.variantId, Number(l.costPrice) || 0);
      }
    });
    return map;
  }, [watchedRawLines]);

  const quarantineCost = useMemo(
    () => (Number(quarantineQty) || 0) * (Number(quarantineCostPrice) || 0),
    [quarantineQty, quarantineCostPrice],
  );

  const costPreview = useMemo(
    () =>
      computeProductionCost(
        watchedRawLines,
        watchedOtherCostLines,
        watchedOutputLines,
        variantCostById,
        quarantineCost,
      ),
    [watchedRawLines, watchedOtherCostLines, watchedOutputLines, variantCostById, quarantineCost],
  );

  const totalOutputQty = useMemo(
    () => (watchedOutputLines || []).reduce((s, l) => s + (Number(l?.quantity) || 0), 0),
    [watchedOutputLines],
  );

  return (
    <div className="space-y-8">
      {isRenew && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {t("production:renew_banner", { lot: quarantineLotNumber || "—" })}
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-200/70 mt-1">
            {t("production:renew_banner_desc")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label={t("production:completed_date")}
          name="completedDate"
          type="date"
          register={register}
          errors={errors}
          required
        />
        {isRenew ? (
          <div>
            <label className="text-sm font-medium text-linkText mb-1 block">
              {t("production:finished_output")}
            </label>
            <div className="h-11 px-3 flex items-center rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 text-sm">
              {watch("outputVariantName") || selVariant?.title || "—"}
            </div>
          </div>
        ) : (
          <SearchablePaginatedDropdown
            label={t("production:finished_output")}
            data={outputPicker.options}
            selected={selVariant}
            setSelected={(opt) => setValue("outputVariantId", opt?.id ?? "", { shouldValidate: true })}
            enableApiSearch
            onApiSearch={outputPicker.onApiSearch}
            hasMore={outputPicker.hasMore}
            onLoadMore={outputPicker.onLoadMore}
            paginationLoading={outputPicker.paginationLoading}
            loading={outputPicker.loading}
            placeholder={t("product:select_product")}
            hideClear
            classes="!h-[46px] !rounded-lg"
            name="outputVariantId"
            register={register}
            errors={errors}
            required
          />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white/95">
            {t("production:output_destinations")}
          </h3>
          {!isRenew && (
            <Button
              type="button"
              title={t("production:add_output_line")}
              icon={HiOutlinePlusCircle}
              onClick={() => appendOutput(defaultOutputLine())}
              className="!w-auto !rounded-lg !h-10 !px-4 !border border-teal-600 !text-teal-700 !bg-teal-50 hover:!bg-teal-100 dark:!border-teal-500/50 dark:!text-teal-200 dark:!bg-teal-500/10"
              iconClass="h-5 w-5"
            />
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-white/40 -mt-2 mb-3">{t("production:output_destinations_hint")}</p>
        <div className="space-y-4">
          {outputFields.map((field, index) => (
            <OutputLineRow
              key={field.id}
              index={index}
              warehouses={warehouses}
              register={register}
              setValue={setValue}
              watch={watch}
              getValues={getValues}
              errors={errors}
              showLabels={index === 0}
              canRemove={!isRenew && outputFields.length > 1}
              onRemove={() => removeOutput(index)}
              locked={isRenew}
              t={t}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {t("production:total_output_qty")}: <span className="font-semibold tabular-nums">{fmtNum(totalOutputQty)}</span>
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white/95">
            {t("production:raw_materials")}
          </h3>
          <Button
            type="button"
            title={t("production:add_raw_line")}
            icon={HiOutlinePlusCircle}
            onClick={() => append(defaultRawLine())}
            className="!w-auto !rounded-lg !h-10 !px-4 !border border-teal-600 !text-teal-700 !bg-teal-50 hover:!bg-teal-100 dark:!border-teal-500/50 dark:!text-teal-200 dark:!bg-teal-500/10"
            iconClass="h-5 w-5"
          />
        </div>
        <p className="text-xs text-slate-400 dark:text-white/40 -mt-2 mb-3">{t("production:raw_materials_hint")}</p>
        <div className="space-y-4">
          {fields.map((field, index) => (
            <RawLineRow
              key={field.id}
              index={index}
              warehouses={warehouses}
              watch={watch}
              setValue={setValue}
              register={register}
              errors={errors}
              showLabels={index === 0}
              canRemove={fields.length > 1}
              onRemove={() => remove(index)}
              allLines={watchedRawLines}
              t={t}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white/95">
            {t("production:other_costs")}
          </h3>
          <Button
            type="button"
            title={t("production:add_other_cost")}
            icon={HiOutlinePlusCircle}
            onClick={() => appendOtherCost(defaultOtherCostLine())}
            className="!w-auto !rounded-lg !h-10 !px-4 !border border-teal-600 !text-teal-700 !bg-teal-50 hover:!bg-teal-100 dark:!border-teal-500/50 dark:!text-teal-200 dark:!bg-teal-500/10"
            iconClass="h-5 w-5"
          />
        </div>
        <p className="text-xs text-slate-400 dark:text-white/40 -mt-2 mb-3">{t("production:other_costs_hint")}</p>
        <div className="space-y-4">
          {otherCostFields.map((field, index) => (
            <OtherCostRow
              key={field.id}
              index={index}
              register={register}
              errors={errors}
              getValues={getValues}
              showLabels={index === 0}
              canRemove={otherCostFields.length > 1}
              onRemove={() => removeOtherCost(index)}
              t={t}
            />
          ))}
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10">
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
          {t("production:cost_calculation")}
        </h3>
        <p className="text-sm text-slate-500 dark:text-white/60 mb-5">
          {t("production:cost_calculation_preview_desc")}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t("production:total_raw_cost"), value: fmtNum(costPreview.totalRawCost) },
            { label: t("production:total_other_cost"), value: fmtNum(costPreview.totalOtherCost) },
            { label: t("production:total_cost"), value: fmtNum(costPreview.totalCost) },
            { label: t("production:batch_unit_cost"), value: fmtNum(costPreview.unitCost) },
          ].map((c) => (
            <div
              key={c.label}
              className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-white dark:bg-white/5"
            >
              <p className="text-xs text-emerald-700 dark:text-emerald-300">{c.label}</p>
              <p className="font-bold text-lg text-slate-900 dark:text-white mt-0.5">{c.value}</p>
            </div>
          ))}
        </div>
        {isRenew && quarantineCost > 0 && (
          <p className="text-xs text-slate-500 dark:text-white/50 mt-3">
            {t("production:quarantine_cost_included", {
              amount: fmtNum(quarantineCost),
              unit: fmtNum(quarantineCostPrice),
              qty: quarantineQty,
            })}
          </p>
        )}
        <p className="text-xs text-slate-400 mt-3">{t("production:cost_calculation_preview_note")}</p>
      </div>

      <FormTextarea
        label={t("production:notes")}
        name="notes"
        register={register}
        errors={errors}
        rows={4}
        maxLength={500}
        className="!rounded-lg"
      />
    </div>
  );
};

function OutputLineRow({
  index,
  warehouses,
  register,
  setValue,
  watch,
  getValues,
  errors,
  showLabels,
  canRemove,
  onRemove,
  locked,
  t,
}) {
  const warehouseId = watch(`outputLines.${index}.warehouseId`);
  const selWarehouse = useMemo(
    () =>
      warehouses.warehouseOptions.find((o) => o.id === warehouseId) ||
      (warehouseId ? { id: warehouseId, title: watch(`outputLines.${index}.warehouseName`) || "" } : null),
    [warehouses.warehouseOptions, warehouseId, watch, index],
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50/80 dark:bg-white/5">
      <div className="sm:col-span-5">
        {locked ? (
          <>
            {showLabels && (
              <label className="text-sm font-medium text-linkText mb-1 block">{t("production:output_warehouse")}</label>
            )}
            <div className="h-[46px] px-3 flex items-center rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 text-sm">
              {selWarehouse?.title || watch("outputWarehouseName") || "—"}
            </div>
          </>
        ) : (
          <SearchablePaginatedDropdown
            label={showLabels ? t("production:output_warehouse") : undefined}
            data={warehouses.warehouseOptions}
            selected={selWarehouse}
            setSelected={(opt) => setValue(`outputLines.${index}.warehouseId`, opt?.id ?? "", { shouldValidate: true })}
            enableApiSearch
            onApiSearch={(v) => warehouses.loadWarehouses(1, v)}
            hasMore={warehouses.warehouseHasMore}
            onLoadMore={() => {
              if (warehouses.warehouseHasMore && !warehouses.warehouseLoading) {
                warehouses.loadWarehouses(warehouses.warehousePage + 1, "");
              }
            }}
            paginationLoading={warehouses.warehouseLoading}
            loading={warehouses.warehouseLoading && warehouses.warehousePage === 1}
            hideClear
            classes="!h-[46px] !rounded-lg"
            name={`outputLines.${index}.warehouseId`}
            register={register}
            errors={errors}
            required
          />
        )}
      </div>
      <div className="sm:col-span-3">
        <FormInput
          label={showLabels ? t("production:output_quantity") : ""}
          name={`outputLines.${index}.quantity`}
          type="number"
          register={register}
          errors={errors}
          placeholder="0"
          min={1}
          required
          inputClass="!h-[46px] !rounded-lg"
        />
      </div>
      <div className="sm:col-span-3">
        <FormInput
          label={showLabels ? t("production:output_expiry_date") : ""}
          name={`outputLines.${index}.expiryDate`}
          type="date"
          register={register}
          errors={errors}
          min={watch("completedDate") || undefined}
          validate={(v) => {
            const sched = getValues("completedDate");
            if (!v || !sched) return true;
            return v >= sched || t("production:expiry_after_scheduled", { defaultValue: "Must be on or after scheduled date" });
          }}
          inputClass="!h-[46px] !rounded-lg"
        />
      </div>
      <div className="sm:col-span-1 flex items-end justify-end pb-1">
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            title={t("production:remove_line")}
          >
            <HiOutlineTrash className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function RawLineRow({ index, warehouses, watch, setValue, register, errors, showLabels, canRemove, onRemove, allLines, t }) {
  const warehouseId = watch(`rawLines.${index}.warehouseId`);
  const variantId = watch(`rawLines.${index}.variantId`);
  const picker = useVariantPicker("Raw Material", warehouseId || undefined);

  const selWarehouse = useMemo(
    () =>
      warehouses.warehouseOptions.find((o) => o.id === warehouseId) ||
      (warehouseId ? { id: warehouseId, title: "" } : null),
    [warehouses.warehouseOptions, warehouseId],
  );

  const selVariant = useMemo(
    () => picker.detailsRef.current[variantId] || picker.options.find((o) => o.id === variantId) || null,
    [picker.options, variantId],
  );

  const siblingQty = (allLines || []).reduce((s, l, i) => {
    if (i === index || !l?.variantId || l.variantId !== variantId) return s;
    if (String(l.warehouseId || "") !== String(warehouseId || "")) return s;
    return s + (Number(l.quantity) || 0);
  }, 0);
  const leftover =
    selVariant?.availableQty != null ? Math.max(0, Number(selVariant.availableQty) - siblingQty) : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50/80 dark:bg-white/5">
      <div className="sm:col-span-3">
        <SearchablePaginatedDropdown
          label={showLabels ? t("production:raw_warehouse") : undefined}
          data={warehouses.warehouseOptions}
          selected={selWarehouse}
          setSelected={(opt) => {
            setValue(`rawLines.${index}.warehouseId`, opt?.id ?? "", { shouldValidate: true });
            setValue(`rawLines.${index}.variantId`, "");
            setValue(`rawLines.${index}.costPrice`, "");
          }}
          enableApiSearch
          onApiSearch={(v) => warehouses.loadWarehouses(1, v)}
          hasMore={warehouses.warehouseHasMore}
          onLoadMore={() => {
            if (warehouses.warehouseHasMore && !warehouses.warehouseLoading) {
              warehouses.loadWarehouses(warehouses.warehousePage + 1, "");
            }
          }}
          paginationLoading={warehouses.warehouseLoading}
          loading={warehouses.warehouseLoading && warehouses.warehousePage === 1}
          hideClear
          classes="!h-[46px] !rounded-lg"
          name={`rawLines.${index}.warehouseId`}
          register={register}
          errors={errors}
          required
        />
      </div>
      <div className="sm:col-span-4">
        <SearchablePaginatedDropdown
          label={showLabels ? t("production:raw_material") : undefined}
          data={picker.options}
          selected={selVariant}
          setSelected={(opt) => {
            setValue(`rawLines.${index}.variantId`, opt?.id ?? "", { shouldValidate: true });
            setValue(`rawLines.${index}.costPrice`, opt?.costPrice ?? "");
          }}
          enableApiSearch
          onApiSearch={picker.onApiSearch}
          hasMore={picker.hasMore}
          onLoadMore={picker.onLoadMore}
          paginationLoading={picker.paginationLoading}
          loading={picker.loading}
          placeholder={warehouseId ? t("production:select_raw_material") : t("production:select_raw_warehouse_first")}
          emptyMessage={t("production:no_raw_materials")}
          hideClear
          disabled={!warehouseId}
          classes="!h-[46px] !rounded-lg"
          name={`rawLines.${index}.variantId`}
          register={register}
          errors={errors}
          required
        />
        {leftover != null && (
          <p className={`mt-1 text-xs ${Number(watch(`rawLines.${index}.quantity`)) > leftover ? "text-rose-600 font-medium" : "text-slate-400"}`}>
            {t("production:available_qty")}: {leftover}
          </p>
        )}
      </div>
      <div className="sm:col-span-2">
        <FormInput
          label={showLabels ? t("production:per_unit_cost") : undefined}
          name={`rawLines.${index}.costPrice`}
          register={register}
          errors={errors}
          disabled
          decimal
          decimalPlaces={6}
          inputClass="!h-[46px] !rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
        />
      </div>
      <div className="sm:col-span-2">
        <FormInput
          label={showLabels ? t("production:actual_qty") : ""}
          name={`rawLines.${index}.quantity`}
          type="number"
          register={register}
          errors={errors}
          placeholder="0"
          min={1}
          max={leftover != null ? leftover : undefined}
          inputClass="!h-[46px] !rounded-lg"
        />
      </div>
      <div className="sm:col-span-1 flex items-end justify-end pb-1">
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            title={t("production:remove_line")}
          >
            <HiOutlineTrash className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function OtherCostRow({ index, register, errors, getValues, showLabels, canRemove, onRemove, t }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50/80 dark:bg-white/5">
      <div className="sm:col-span-6">
        <FormInput
          label={showLabels ? t("production:other_cost_label") : undefined}
          name={`otherCostLines.${index}.label`}
          register={register}
          errors={errors}
          placeholder={t("production:other_cost_label_placeholder")}
          pattern={/[a-zA-Z0-9\s.'-]/}
          maxLength={100}
          validate={(v) => {
            const hasA = String(getValues(`otherCostLines.${index}.amount`) ?? "").trim() !== "";
            const hasL = String(v ?? "").trim() !== "";
            if (hasA && !hasL) return t("production:other_cost_pair", { defaultValue: "Label and amount must both be filled" });
            return true;
          }}
        />
      </div>
      <div className="sm:col-span-5">
        <FormInput
          label={showLabels ? t("production:other_cost_amount") : ""}
          name={`otherCostLines.${index}.amount`}
          type="number"
          register={register}
          errors={errors}
          placeholder="0"
          min={0}
          decimal
          decimalPlaces={6}
          maxLength={16}
          validate={(v) => {
            const hasL = String(getValues(`otherCostLines.${index}.label`) ?? "").trim() !== "";
            const hasA = String(v ?? "").trim() !== "";
            if (hasL && !hasA) return t("production:other_cost_pair", { defaultValue: "Label and amount must both be filled" });
            return true;
          }}
        />
      </div>
      <div className="sm:col-span-1 flex items-end justify-end pb-1">
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            title={t("production:remove_line")}
          >
            <HiOutlineTrash className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductionOrderForm;
