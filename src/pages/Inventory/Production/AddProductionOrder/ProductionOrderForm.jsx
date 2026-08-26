import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormInput from "components/FormInput";
import SearchablePaginatedDropdown from "components/SearchablePaginatedDropdown";
import Button from "components/Button";
import { HiOutlinePlusCircle, HiOutlineTrash } from "react-icons/hi2";
import { fetchVariantsDropdown } from "store/slices/variantSlice";
import { fetchWarehousesDropdown } from "store/slices/warehouseSlice";
import { defaultRawLine, defaultOtherCostLine, computeProductionCost } from "../productionHelpers";

const fmtNum = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const variantOptionLabel = (v) => `${v.sku} — ${v.variantName || v.productName || ""}`.trim();

// One product-type-filtered, server-paginated/searched variant picker.
// Used twice on this page (raw materials, finished output) with different
// productType — a single global Redux dropdown slot can't hold two
// independent filtered lists at once, so state lives here instead.
const useVariantPicker = (productType) => {
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
        fetchVariantsDropdown({ page: nextPage, search: nextSearch, productType }),
      ).unwrap();
      const mapped = (result.result || []).map((v) => ({ ...v, title: variantOptionLabel(v) }));
      mapped.forEach((v) => { detailsRef.current[v.id] = v; });
      setOptions((prev) => (nextPage === 1 ? mapped : [...prev, ...mapped]));
      setPage(nextPage);
      setHasMore(nextPage < (result.total_pages || 0));
      setLoading(false);
    },
    [dispatch, productType],
  );

  useEffect(() => {
    load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType]);

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

  const outputPicker = useVariantPicker("Finished Product");
  const rawPicker = useVariantPicker("Raw Material");

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
  const warehouseId = watch("warehouseId");

  const selVariant = useMemo(
    () => outputPicker.detailsRef.current[variantId] || outputPicker.options.find((o) => o.id === variantId) || {},
    [outputPicker.options, variantId],
  );

  const selWarehouse = useMemo(
    () => warehouseOptions.find((o) => o.id === warehouseId) || null,
    [warehouseOptions, warehouseId],
  );

  const watchedRawLines = useWatch({ control, name: "rawLines" });
  const watchedOtherCostLines = useWatch({ control, name: "otherCostLines" });
  const watchedOutputQuantity = useWatch({ control, name: "outputQuantity" });

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label={t("production:scheduled_date")}
          name="scheduledDate"
          type="date"
          register={register}
          errors={errors}
        />
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-linkText mb-1 block">
            {t("production:finished_output")}
          </label>
          <SearchablePaginatedDropdown
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
          />
        </div>
        <FormInput
          label={t("production:output_quantity")}
          name="outputQuantity"
          type="number"
          register={register}
          errors={errors}
          placeholder="0"
          min={0}
          decimal
          decimalPlaces={2}
        />
        <div>
          <label className="text-sm font-medium text-linkText mb-1 block">
            {t("production:warehouse")}
          </label>
          <SearchablePaginatedDropdown
            data={warehouseOptions}
            selected={selWarehouse}
            setSelected={(opt) => setValue("warehouseId", opt?.id ?? "")}
            enableApiSearch
            onApiSearch={(v) => loadWarehouses(1, v)}
            hasMore={warehouseHasMore}
            onLoadMore={() => { if (warehouseHasMore && !warehouseLoading) loadWarehouses(warehousePage + 1, ""); }}
            paginationLoading={warehouseLoading}
            loading={warehouseLoading && warehousePage === 1}
            hideClear
            classes="!h-[46px] !rounded-lg"
          />
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

      <div>
        <label className="text-sm font-medium text-linkText mb-1 block">
          {t("production:notes")}
        </label>
        <textarea
          {...register("notes", { maxLength: { value: 500, message: t("production:max_length_500", { defaultValue: "Maximum length is 500 characters" }) } })}
          rows={4}
          className="w-full rounded-lg border border-[#E0E5F2] bg-white px-3 py-2 text-sm text-black transition duration-300 hover:border-[#ffba32] focus:border-[#ffba32] focus:outline-0 dark:bg-white/10 dark:border-white/20 dark:text-white"
        />
        {errors.notes && <p className="text-red text-xs mt-1 font-medium">{errors.notes.message}</p>}
      </div>
    </div>
  );
};

function RawLineRow({ index, picker, watch, setValue, register, errors, showLabels, canRemove, onRemove, t }) {
  const variantId = watch(`rawLines.${index}.variantId`);
  const selVariant = useMemo(
    () => picker.detailsRef.current[variantId] || picker.options.find((o) => o.id === variantId) || null,
    [picker.options, variantId],
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50/80 dark:bg-white/5">
      <div className="sm:col-span-7">
        {showLabels && (
          <label className="text-sm font-medium text-linkText mb-1 block">{t("production:raw_material")}</label>
        )}
        <SearchablePaginatedDropdown
          data={picker.options}
          selected={selVariant}
          setSelected={(opt) => setValue(`rawLines.${index}.variantId`, opt?.id ?? "", { shouldValidate: true })}
          enableApiSearch
          onApiSearch={picker.onApiSearch}
          hasMore={picker.hasMore}
          onLoadMore={picker.onLoadMore}
          paginationLoading={picker.paginationLoading}
          loading={picker.loading}
          placeholder={t("production:select_raw_material")}
          emptyMessage={t("production:no_raw_materials")}
          hideClear
          classes="!h-[46px] !rounded-lg"
        />
      </div>
      <div className="sm:col-span-4">
        <FormInput
          label={showLabels ? t("production:planned_qty") : ""}
          name={`rawLines.${index}.quantity`}
          type="number"
          register={register}
          errors={errors}
          placeholder="0"
          min={0}
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

function OtherCostRow({ index, register, errors, showLabels, canRemove, onRemove, t }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50/80 dark:bg-white/5">
      <div className="sm:col-span-7">
        {showLabels && (
          <label className="text-sm font-medium text-linkText mb-1 block">{t("production:other_cost_label")}</label>
        )}
        <FormInput
          name={`otherCostLines.${index}.label`}
          register={register}
          errors={errors}
          placeholder={t("production:other_cost_label_placeholder")}
          pattern={/[a-zA-Z0-9\s.'-]/}
          maxLength={150}
        />
      </div>
      <div className="sm:col-span-4">
        <FormInput
          label={showLabels ? t("production:other_cost_amount") : ""}
          name={`otherCostLines.${index}.amount`}
          type="number"
          register={register}
          errors={errors}
          placeholder="0"
          min={0}
          decimal
          decimalPlaces={3}
          maxLength={10}
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
