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
import { defaultRawLine, defaultOtherCostLine, computeProductionCost } from "../productionHelpers";

const fmtNum = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });

const variantOptionLabel = (v) => `${v.sku} — ${v.variantName || v.productName || ""}`.trim();

// One product-type-filtered, server-paginated/searched variant picker.
// Used twice on this page (raw materials, finished output) with different
// productType — a single global Redux dropdown slot can't hold two
// independent filtered lists at once, so state lives here instead.
const useVariantPicker = (productType, warehouseId) => {
  const dispatch = useDispatch();
  const [options, setOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const detailsRef = useRef({}); // accumulates every variant ever seen, for cost lookups regardless of current search

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

const ProductionOrderForm = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const {
    register,
    control,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rawLines",
  });

  const {
    fields: otherCostFields,
    append: appendOtherCost,
    remove: removeOtherCost,
  } = useFieldArray({
    control,
    name: "otherCostLines",
  });

  const warehouseId = watch("warehouseId");
  const outputWarehouseId = watch("outputWarehouseId");
  const outputPicker = useVariantPicker("Finished Product");
  const rawPicker = useVariantPicker("Raw Material", warehouseId || undefined);

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

  const variantId = watch("outputVariantId");
  const quarantineLotId = watch("quarantineLotId");
  const quarantineLotNumber = watch("quarantineLotNumber");
  const isRenew = Boolean(quarantineLotId);

  const selVariant = useMemo(
    () => outputPicker.detailsRef.current[variantId] || outputPicker.options.find((o) => o.id === variantId) || {},
    [outputPicker.options, variantId],
  );

  const selWarehouse = useMemo(
    () => warehouseOptions.find((o) => o.id === warehouseId) || null,
    [warehouseOptions, warehouseId],
  );

  const selOutputWarehouse = useMemo(
    () => warehouseOptions.find((o) => o.id === outputWarehouseId) || null,
    [warehouseOptions, outputWarehouseId],
  );

  const watchedRawLines = useWatch({ control, name: "rawLines" });
  const watchedOtherCostLines = useWatch({ control, name: "otherCostLines" });
  const watchedOutputQuantity = useWatch({ control, name: "outputQuantity" });

  useEffect(() => {
    (watchedRawLines || []).forEach((line) => {
      if (!line?.variantId) return;
      const prev = rawPicker.detailsRef.current[line.variantId] || {};
      rawPicker.detailsRef.current[line.variantId] = {
        ...prev,
        id: line.variantId,
        sku: prev.sku || line.sku || "",
        variantName: prev.variantName || line.variantName || "",
        costPrice: prev.costPrice ?? line.costPrice,
        title:
          prev.title ||
          variantOptionLabel({
            sku: prev.sku || line.sku || "",
            variantName: prev.variantName || line.variantName || "",
          }),
      };
    });
  }, [watchedRawLines]);

  const variantCostById = useMemo(() => {
    const map = new Map();
    Object.values(rawPicker.detailsRef.current).forEach((v) => map.set(v.id, v.costPrice));
    return map;
  }, [watchedRawLines]); // eslint-disable-line react-hooks/exhaustive-deps

  const costPreview = useMemo(
    () => computeProductionCost(watchedRawLines, watchedOtherCostLines, watchedOutputQuantity, variantCostById),
    [watchedRawLines, watchedOtherCostLines, watchedOutputQuantity, variantCostById],
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
          label={t("production:scheduled_date")}
          name="scheduledDate"
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
                {watch("outputVariantName") || selVariant.title || "—"}
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
            setValue={setValue}
            trigger={trigger}
            errors={errors}
            required
          />
          )}
        <FormInput
          label={t("production:output_quantity")}
          name="outputQuantity"
          type="number"
          register={register}
          errors={errors}
          placeholder="0"
          min={0.01}
          decimal
          decimalPlaces={2}
          required
        />
        <FormInput
          label={t("production:output_expiry_date")}
          name="outputExpiryDate"
          type="date"
          register={register}
          errors={errors}
          min={watch("scheduledDate") || undefined}
          validate={(v) => {
            const sched = getValues("scheduledDate");
            if (!v || !sched) return true;
            return v >= sched || t("production:expiry_after_scheduled", { defaultValue: "Must be on or after scheduled date" });
          }}
        />
        <div>
          {isRenew ? (
            <>
              <label className="text-sm font-medium text-linkText mb-1 block">
                {t("production:raw_warehouse")}
              </label>
              <div className="h-11 px-3 flex items-center rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 text-sm">
                {watch("warehouseName") || selWarehouse?.title || "—"}
              </div>
            </>
          ) : (
          <SearchablePaginatedDropdown
            key="raw-warehouse"
            label={t("production:raw_warehouse")}
            data={warehouseOptions}
            selected={selWarehouse || (warehouseId ? { id: warehouseId, title: watch("warehouseName") || "" } : null)}
            setSelected={(opt) => setValue("warehouseId", opt?.id ?? "")}
            enableApiSearch
            onApiSearch={(v) => loadWarehouses(1, v)}
            hasMore={warehouseHasMore}
            onLoadMore={() => { if (warehouseHasMore && !warehouseLoading) loadWarehouses(warehousePage + 1, ""); }}
            paginationLoading={warehouseLoading}
            loading={warehouseLoading && warehousePage === 1}
            hideClear
            classes="!h-[46px] !rounded-lg"
            name="warehouseId"
            register={register}
            setValue={setValue}
            trigger={trigger}
            errors={errors}
            required
          />
          )}
          <p className="text-xs text-slate-400 mt-1">{t("production:raw_warehouse_hint")}</p>
        </div>
        <div>
          <SearchablePaginatedDropdown
            key="output-warehouse"
            label={t("production:output_warehouse")}
            data={warehouseOptions}
            selected={selOutputWarehouse || (outputWarehouseId ? { id: outputWarehouseId, title: watch("outputWarehouseName") || "" } : null)}
            setSelected={(opt) => setValue("outputWarehouseId", opt?.id ?? "")}
            enableApiSearch
            onApiSearch={(v) => loadWarehouses(1, v)}
            hasMore={warehouseHasMore}
            onLoadMore={() => { if (warehouseHasMore && !warehouseLoading) loadWarehouses(warehousePage + 1, ""); }}
            paginationLoading={warehouseLoading}
            loading={warehouseLoading && warehousePage === 1}
            hideClear
            classes="!h-[46px] !rounded-lg"
            name="outputWarehouseId"
            register={register}
            setValue={setValue}
            trigger={trigger}
            errors={errors}
            required
          />
          <p className="text-xs text-slate-400 mt-1">{t("production:output_warehouse_hint")}</p>
        </div>
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
              picker={rawPicker}
              watch={watch}
              setValue={setValue}
              register={register}
              errors={errors}
              showLabels={index === 0}
              canRemove={fields.length > 1}
              onRemove={() => remove(index)}
              warehouseSelected={!!warehouseId}
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

function RawLineRow({ index, picker, watch, setValue, register, errors, showLabels, canRemove, onRemove, warehouseSelected, allLines, t }) {
  const variantId = watch(`rawLines.${index}.variantId`);
  const selVariant = useMemo(
    () => picker.detailsRef.current[variantId] || picker.options.find((o) => o.id === variantId) || null,
    [picker.options, variantId],
  );
  const siblingQty = (allLines || []).reduce((s, l, i) => {
    if (i === index || !l?.variantId || l.variantId !== variantId) return s;
    return s + (Number(l.quantity) || 0);
  }, 0);
  const leftover =
    selVariant?.availableQty != null ? Math.max(0, Number(selVariant.availableQty) - siblingQty) : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50/80 dark:bg-white/5">
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
          placeholder={warehouseSelected ? t("production:select_raw_material") : t("production:select_raw_warehouse_first")}
          emptyMessage={t("production:no_raw_materials")}
          hideClear
          disabled={!warehouseSelected}
          classes="!h-[46px] !rounded-lg"
          name={`rawLines.${index}.variantId`}
          register={register}
          setValue={setValue}
          trigger={trigger}
          errors={errors}
          required
        />
        {leftover != null && (
          <p className={`mt-1 text-xs ${Number(watch(`rawLines.${index}.quantity`)) > leftover ? "text-rose-600 font-medium" : "text-slate-400"}`}>
            {t("production:available_qty")}: {leftover}
          </p>
        )}
      </div>
      <div className="sm:col-span-3">
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
      <div className="sm:col-span-4">
        <FormInput
          label={showLabels ? t("production:actual_qty") : ""}
          name={`rawLines.${index}.quantity`}
          type="number"
          register={register}
          errors={errors}
          placeholder="0"
          min={0.01}
          max={leftover != null ? leftover : undefined}
          decimal
          decimalPlaces={2}
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
          maxLength={150}
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
