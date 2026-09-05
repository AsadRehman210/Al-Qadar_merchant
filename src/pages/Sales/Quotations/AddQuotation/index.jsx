import { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm, useFieldArray, useFormContext, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { HiOutlinePlusCircle, HiOutlineTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import SearchablePaginatedDropdown from "components/SearchablePaginatedDropdown";
import { erpGet, buildQuery } from "api/erpClient";
import { erpUrls } from "global/config";
import dayjs from "dayjs";
import {
  lineTotal,
  lineProfit,
  computeInvoiceProfit,
  effectiveLineTaxPercent,
} from "global/helper";
import { salesTaxModeOptions } from "global/constant";
import {
  fetchSalesCustomersDropdown,
  showSalesCustomerDropdownOptions,
  showSalesCustomerDropdownPage,
  showSalesCustomerDropdownHasMore,
  showSalesCustomerDropdownLoading,
} from "store/slices/salesCustomerSlice";
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
  createQuotation,
  updateQuotation,
  fetchQuotationById,
  showCurrentQuotation,
  clearCurrentQuotation,
} from "store/slices/quotationSlice";

// Quotation batch pick is reference-only (costing/expiry) — never reserved
// or consumed, since a quote never moves real stock.
const defaultLine = () => ({ variantId: "", productName: "", qty: 1, price: 0, costPrice: 0, unit: "pcs", batchId: "", taxPercent: null });

const DEFAULT_QUOTE_FORM = {
  customerId: "", date: dayjs().format("YYYY-MM-DD"), validUntil: dayjs().add(30, "day").format("YYYY-MM-DD"),
  warehouseId: "", lines: [defaultLine()], taxPercent: 15, notes: "",
};

// Backend-driven search + infinite scroll, matching SearchablePaginatedDropdown's
// contract. extraParams re-triggers the fetch whenever it changes (e.g. the
// variant picker re-scoping to a newly-selected warehouseId); enabled lets a
// picker stay empty/idle until its prerequisite (a warehouse) is chosen.
const useDropdownSource = (fetchThunk, selectors, titleFn, extraParams, enabled = true) => {
  const dispatch = useDispatch();
  const options = useSelector(selectors.options);
  const page = useSelector(selectors.page);
  const hasMore = useSelector(selectors.hasMore);
  const loading = useSelector(selectors.loading);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (enabled) dispatch(fetchThunk({ page: 1, search: "", ...extraParams }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, enabled, JSON.stringify(extraParams)]);

  const onApiSearch = (value) => {
    setSearch(value);
    if (enabled) dispatch(fetchThunk({ page: 1, search: value, ...extraParams }));
  };
  const onLoadMore = () => {
    if (enabled && hasMore && !loading) dispatch(fetchThunk({ page: page + 1, search, ...extraParams }));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- titleFn is an inline
  // arrow at every call site (new identity each render); including it here would
  // recompute `data` (new array identity) every render regardless of whether
  // `options` actually changed, which loops forever through any effect that
  // syncs local state off this array (infinite re-render, page appears frozen).
  const data = useMemo(() => (enabled ? options.map((o) => ({ ...o, title: titleFn(o) })) : []), [enabled, options]);
  return { data, loading: enabled && loading && page === 1, paginationLoading: enabled && loading && page > 1, hasMore: enabled && hasMore, onApiSearch, onLoadMore };
};

const AddQuotation = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEdit = !!id;
  const isRTL = i18n.language === "ar";

  const [selCustomer, setSelCustomer] = useState(null);
  const [selWarehouse, setSelWarehouse] = useState(null);

  useEffect(() => {
    if (isEdit) dispatch(fetchQuotationById(id));
    return () => { if (isEdit) dispatch(clearCurrentQuotation()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, id]);

  const methods = useForm({
    mode: "onChange",
    defaultValues: DEFAULT_QUOTE_FORM,
  });
  const { register, handleSubmit, control, watch, setValue, reset } = methods;

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });

  const warehouseId = watch("warehouseId");

  const customerSource = useDropdownSource(
    fetchSalesCustomersDropdown,
    { options: showSalesCustomerDropdownOptions, page: showSalesCustomerDropdownPage, hasMore: showSalesCustomerDropdownHasMore, loading: showSalesCustomerDropdownLoading },
    (c) => c.name,
  );
  const warehouseSource = useDropdownSource(
    fetchWarehousesDropdown,
    { options: showWarehouseDropdownOptions, page: showWarehouseDropdownPage, hasMore: showWarehouseDropdownHasMore, loading: showWarehouseDropdownLoading },
    (w) => `${w.code} — ${w.name}`,
    { status: "Active" },
  );
  // Every quotable line is a physical, stock-tracked variant, scoped to the
  // chosen warehouse's actual stock (only variants with qty > 0 there are
  // offered) — stays empty until a warehouse is picked, same rule Add Sale
  // Invoice uses, so a quote never promises stock that isn't actually there.
  const variantSource = useDropdownSource(
    fetchVariantsDropdown,
    { options: showVariantDropdownOptions, page: showVariantDropdownPage, hasMore: showVariantDropdownHasMore, loading: showVariantDropdownLoading },
    (v) => `${v.productName || ""} — ${v.variantName} (${v.sku})`,
    { warehouseId },
    !!warehouseId,
  );
  const itemOptions = useMemo(
    () => variantSource.data.map((v) => ({
      ...v,
      salePrice: v.salePrice,
      costPrice: v.costPrice,
      availableQty: v.availableQty,
      unit: "pcs",
      // `title` drives what's shown in the picker list (and stays visible in
      // the search box after picking) — the qty suffix there is purely
      // cosmetic, so `comboTitle` keeps the clean "Product — Variant (SKU)"
      // string for what actually gets stored as the line's productName.
      comboTitle: v.title,
      title: `${v.title} · Qty: ${v.availableQty ?? 0}`,
    })),
    [variantSource.data],
  );

  const current = useSelector(showCurrentQuotation);
  useEffect(() => {
    if (isEdit && current) {
      reset({
        customerId: current.customerId,
        date: current.date ? String(current.date).slice(0, 10) : dayjs().format("YYYY-MM-DD"),
        validUntil: current.validUntil ? String(current.validUntil).slice(0, 10) : "",
        warehouseId: current.warehouseId,
        lines: current.lines?.length ? current.lines.map((l) => ({ ...defaultLine(), ...l })) : [defaultLine()],
        taxPercent: current.taxPercent ?? 15,
        notes: current.notes || "",
      });
      setSelCustomer({ id: current.customerId, title: current.customerName });
      setSelWarehouse({ id: current.warehouseId, title: current.warehouseName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, isEdit]);

  // Switching warehouses invalidates any already-picked lines (different
  // warehouse, different stock) — clear them so the user re-picks from the
  // new warehouse's real catalog instead of silently keeping a selection
  // that may not even be sellable there. Only fires on a genuine change
  // between two real warehouses, never on the initial "" -> loaded-value
  // transition (fresh create, or edit-mode hydration via reset()).
  const prevWarehouseIdRef = useRef("");
  useEffect(() => {
    const prev = prevWarehouseIdRef.current;
    if (prev && warehouseId && prev !== warehouseId) {
      fields.forEach((_, idx) => {
        setValue(`lines.${idx}.variantId`, "");
        setValue(`lines.${idx}.productName`, "");
        setValue(`lines.${idx}.price`, 0);
        setValue(`lines.${idx}.costPrice`, 0);
        setValue(`lines.${idx}.batchId`, "");
      });
    }
    prevWarehouseIdRef.current = warehouseId || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId]);

  const watchedLines = watch("lines");
  const taxPercent = watch("taxPercent");

  // "Same for all" (default) vs "different per product" — purely a UI mode,
  // nothing separate is persisted for it. In "same" mode every line's own
  // taxPercent is cleared so it falls back to the shared quote-level rate;
  // in "different" mode each line carries its own explicit override. The
  // backend computes totals with the exact same fallback rule.
  const [taxMode, setTaxMode] = useState(salesTaxModeOptions[0]);

  // Editing an existing quotation that already carries per-line overrides
  // (saved earlier in "different" mode) — detect that once the real lines
  // arrive via reset() and switch the UI mode to match.
  const hydratedModeRef = useRef(false);
  useEffect(() => {
    if (hydratedModeRef.current || !watchedLines?.length) return;
    const hasOverride = watchedLines.some((l) => l?.taxPercent !== undefined && l?.taxPercent !== null && l?.taxPercent !== "");
    if (hasOverride) setTaxMode(salesTaxModeOptions[1]);
    hydratedModeRef.current = true;
  }, [watchedLines]);

  const handleTaxModeChange = (opt) => {
    const next = opt || salesTaxModeOptions[0];
    setTaxMode(next);
    if (next.id === "same") {
      fields.forEach((_, idx) => setValue(`lines.${idx}.taxPercent`, null));
    } else {
      fields.forEach((_, idx) => {
        const cur = watchedLines?.[idx]?.taxPercent;
        if (cur === undefined || cur === null || cur === "") {
          setValue(`lines.${idx}.taxPercent`, Number(taxPercent) || 0);
        }
      });
    }
  };

  const { subtotal, taxAmount, total, totalProfit } = useMemo(() => {
    let sub = 0;
    let tax = 0;
    for (const l of watchedLines || []) {
      const lineSub = lineTotal(l);
      sub += lineSub;
      tax += lineSub * (effectiveLineTaxPercent(l, taxPercent) / 100);
    }
    return {
      subtotal: sub,
      taxAmount: tax,
      total: sub + tax,
      totalProfit: computeInvoiceProfit(watchedLines),
    };
  }, [watchedLines, taxPercent]);

  const fmtMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const onSubmit = async (data) => {
    if (!selCustomer?.id) { toast.error(t("sales:customer_required")); return; }
    const payload = { ...data, customerId: selCustomer.id };
    try {
      if (isEdit) {
        await dispatch(updateQuotation({ id, data: payload })).unwrap();
      } else {
        await dispatch(createQuotation(payload)).unwrap();
      }
      toast.success(t("sales:quote_saved"));
      navigate("/quotation");
    } catch (err) {
      toast.error(err?.message || err || "");
    }
  };

  const panelCls = "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-6 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/quotation")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{isEdit ? t("edit") : t("sales:add_quotation")}</h1>
          </div>
        </div>

        <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className={panelCls}>
            <h3 className="text-base font-bold mb-4">{t("sales:quote_info")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <SearchablePaginatedDropdown
                  label={`${t("sales:customer")} *`}
                  data={customerSource.data}
                  selected={selCustomer}
                  setSelected={setSelCustomer}
                  enableApiSearch
                  onApiSearch={customerSource.onApiSearch}
                  hasMore={customerSource.hasMore}
                  onLoadMore={customerSource.onLoadMore}
                  paginationLoading={customerSource.paginationLoading}
                  loading={customerSource.loading}
                />
              </div>
              <FormInput label={t("sales:date")} name="date" type="date" register={register} />
              <FormInput label={t("sales:valid_until")} name="validUntil" type="date" register={register} />
              <div>
                <SearchablePaginatedDropdown
                  label={t("sales:warehouse")}
                  data={warehouseSource.data}
                  selected={selWarehouse}
                  setSelected={(opt) => {
                    setSelWarehouse(opt);
                    setValue("warehouseId", opt?.id || "");
                  }}
                  enableApiSearch
                  onApiSearch={warehouseSource.onApiSearch}
                  hasMore={warehouseSource.hasMore}
                  onLoadMore={warehouseSource.onLoadMore}
                  paginationLoading={warehouseSource.paginationLoading}
                  loading={warehouseSource.loading}
                />
                <input type="hidden" {...register("warehouseId")} />
              </div>
              <div className="lg:col-span-3">
                <label className="text-sm font-medium text-linkText block mb-1">{t("sales:notes")}</label>
                <textarea {...register("notes", { maxLength: { value: 500, message: "Maximum length is 500 characters" } })} rows={2}
                  className="w-full rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-sm focus:outline-0 focus:border-teal-500" />
                {methods.formState.errors.notes && (
                  <p className="text-red text-xs mt-1 font-medium">{methods.formState.errors.notes.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className={panelCls}>
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <h3 className="text-base font-bold mr-auto">{t("sales:line_items")}</h3>
              <div className="flex-1 min-w-[220px] max-w-xs">
                <SelectDropdown
                  label={t("sales:tax_mode")}
                  data={salesTaxModeOptions}
                  selected={taxMode}
                  setSelected={handleTaxModeChange}
                  valueKey="id"
                  hideClear
                />
              </div>
              {taxMode.id === "same" && (
                <div className="w-32">
                  <label htmlFor="quote-tax-pct" className="mb-1 block text-sm text-linkText font-medium leading-6">
                    {t("sales:tax_percent")}
                  </label>
                  <input
                    id="quote-tax-pct"
                    type="number"
                    step="any"
                    {...register("taxPercent", {
                      valueAsNumber: true,
                      min: { value: 0, message: "Minimum value is 0" },
                      max: { value: 100, message: "Maximum value is 100" },
                    })}
                    className="w-full h-[46px] rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-white/20 dark:bg-white/10 dark:text-white"
                  />
                  {methods.formState.errors.taxPercent && (
                    <p className="text-red text-xs mt-1 font-medium">{methods.formState.errors.taxPercent.message}</p>
                  )}
                </div>
              )}
              <Button type="button" title={t("sales:add_product")} icon={HiOutlinePlusCircle} onClick={() => append(defaultLine())}
                className="!rounded-md !h-10 !px-4 !bg-teal-500 hover:!bg-teal-600 !text-white !border-0" iconClass="!text-lg" />
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/20">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-white/10 text-left">
                    <th className="p-2 font-semibold w-12 text-center">{t("sales:sr_no")}</th>
                    <th className="p-2 font-semibold">{t("sales:product")}</th>
                    <th className="p-2 font-semibold w-44">{t("sales:batch")}</th>
                    <th className="p-2 font-semibold w-20">{t("sales:qty")}</th>
                    <th className="p-2 font-semibold w-24">{t("sales:price")}</th>
                    <th className="p-2 font-semibold w-24">{t("sales:cost")}</th>
                    <th className="p-2 font-semibold w-28">{t("sales:unit")}</th>
                    <th className="p-2 font-semibold w-28">{t("sales:base_amount")}</th>
                    {taxMode.id === "different" && (
                      <th className="p-2 font-semibold w-24">{t("sales:tax_percent")}</th>
                    )}
                    <th className="p-2 font-semibold w-24">{t("sales:tax_amount")}</th>
                    <th className="p-2 font-semibold w-28">{t("sales:subtotal")}</th>
                    <th className="p-2 font-semibold w-28">{t("sales:profit")}</th>
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
                      itemSource={variantSource}
                      itemOptions={itemOptions}
                      warehouseSelected={!!warehouseId}
                      warehouseId={warehouseId}
                      remove={remove}
                      append={append}
                      canRemove={fields.length > 1}
                      taxMode={taxMode.id}
                      invoiceTaxPercent={taxPercent}
                      fmtMoney={fmtMoney}
                      allLines={watchedLines}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-slate-900/40 dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]">
                <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 px-5 py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90">
                    {t("sales:quote_summary")}
                  </p>
                </div>
                <div className="p-5 sm:p-6 space-y-1">
                  <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/10 -mx-1">
                    <div className="px-4 py-3 text-center">
                      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-white/55">{t("sales:subtotal")}</p>
                      <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-white">{fmtMoney(subtotal)} SAR</p>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-white/55">{t("sales:tax_amount")}</p>
                      <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-white">{fmtMoney(taxAmount)} SAR</p>
                    </div>
                    <div className="px-4 py-3 text-center bg-teal-50/60 dark:bg-teal-500/10 rounded-lg">
                      <p className="mb-1 text-xs font-semibold text-teal-700 dark:text-teal-300">{t("sales:total")}</p>
                      <p className="text-lg font-bold tabular-nums text-teal-600 dark:text-teal-400">{fmtMoney(total)} SAR</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-950/20 mt-2">
                    <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{t("sales:profit")}</span>
                    <span className={`text-lg font-bold tabular-nums ${totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {fmtMoney(totalProfit)} SAR
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" title={t("cancel")} onClick={() => navigate("/quotation")}
              className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
            <Button type="submit" title={t("save")} btn="primary" className="!rounded-md !bg-teal-500 hover:!bg-teal-600 !border-0" />
          </div>
        </form>
        </FormProvider>
      </div>
    </div>
  );
};

function LineRow({ index, sr, register, setValue, itemSource, itemOptions, warehouseSelected, warehouseId, remove, append, canRemove, taxMode, invoiceTaxPercent, fmtMoney, allLines, t }) {
  const { watch, formState: { errors } } = useFormContext();
  const lineErrors = errors?.lines?.[index] || {};
  const row = watch(`lines.${index}`) || {};
  const lt = lineTotal(row);
  const profit = lineProfit(row);
  const rowTaxAmount = lt * (effectiveLineTaxPercent(row, invoiceTaxPercent) / 100);
  const selectedId = row.variantId;
  const selected = itemOptions.find((o) => o.id === selectedId) || null;

  // A variant can have several batches on hand (bought at different times,
  // different cost, different expiry) — fetched fresh per row whenever its
  // product or the quote's warehouse changes. Reference only here: a quote
  // never reserves or consumes a batch, so (unlike Add Sale Invoice) there's
  // no "add back this row's own reservation" adjustment needed — the raw
  // remainingQty is exactly what's shown.
  const [batchOptionsRaw, setBatchOptionsRaw] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  useEffect(() => {
    if (!row.variantId || !warehouseId) {
      setBatchOptionsRaw([]);
      return;
    }
    let cancelled = false;
    setBatchesLoading(true);
    const query = buildQuery({ variantId: row.variantId, warehouseId, limit: 50, onlyAvailable: true });
    erpGet(`${erpUrls.stockBatches}?${query}`)
      .then((res) => {
        if (cancelled) return;
        setBatchOptionsRaw(res?.success ? res.result || [] : []);
      })
      .finally(() => {
        if (!cancelled) setBatchesLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.variantId, warehouseId]);

  // Splitting one product's quoted qty across several batches means more
  // than one row can point at the same batch at once — each row's own fetch
  // has no idea what its siblings just claimed, so that's subtracted here,
  // live, off the full lines array — same reasoning as Add Sale Invoice's
  // identical picker, purely so the UI never implies more of a batch is up
  // for grabs than is actually left.
  const batchOptions = useMemo(() => {
    const siblingReserved = new Map();
    (allLines || []).forEach((l, i) => {
      if (i === index || !l?.batchId) return;
      siblingReserved.set(l.batchId, (siblingReserved.get(l.batchId) || 0) + (Number(l.qty) || 0));
    });
    return batchOptionsRaw
      .map((b) => ({ ...b, remainingQty: Math.max(0, (Number(b.remainingQty) || 0) - (siblingReserved.get(b.id) || 0)) }))
      .filter((b) => b.remainingQty > 0 || b.id === row.batchId);
  }, [batchOptionsRaw, allLines, index, row.batchId]);

  // FEFO default — batches come back sorted earliest-expiry-first, so once
  // they load for a freshly-picked product with no batch chosen yet, take
  // the top one automatically. The user can still override via the dropdown.
  useEffect(() => {
    if (batchOptions.length && !row.batchId) {
      const first = batchOptions[0];
      setValue(`lines.${index}.batchId`, first.id);
      setValue(`lines.${index}.costPrice`, first.unitCost ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchOptions]);

  const selectedBatch = batchOptions.find((b) => b.id === row.batchId) || null;
  const batchAvailable = selectedBatch ? Number(selectedBatch.remainingQty) || 0 : null;
  const overStock =
    (selected && selected.availableQty != null && Number(row.qty) > selected.availableQty) ||
    (batchAvailable != null && Number(row.qty) > batchAvailable);

  // More than one batch to choose from for this same product — offer a
  // one-click way to quote the rest from a different batch instead of
  // making the user re-search and re-pick the same product on a fresh row.
  const canSplitBatch = row.variantId && batchOptionsRaw.length > 1;
  const splitToAnotherBatch = () => {
    append?.({
      variantId: row.variantId,
      productName: row.productName || "",
      qty: 1,
      price: Number(row.price) || 0,
      costPrice: 0,
      unit: row.unit || "pcs",
      batchId: "",
      taxPercent: row.taxPercent ?? null,
    });
  };

  const batchTitle = (b) =>
    `${b.expiryDate ? String(b.expiryDate).slice(0, 10) : "—"} · Qty ${b.remainingQty} · ${Number(b.unitCost || 0).toLocaleString()}`;

  return (
    <tr className="border-t border-slate-100 dark:border-white/10 align-top">
      <td className="p-2 text-center tabular-nums text-slate-600 dark:text-white/70 font-medium">
        {sr}
      </td>
      <td className="p-2 min-w-[220px]">
        <SearchablePaginatedDropdown
          data={itemOptions}
          selected={selected}
          setSelected={(opt) => {
            setValue(`lines.${index}.variantId`, opt?.id || "");
            setValue(`lines.${index}.batchId`, "");
            if (opt?.id) {
              setValue(`lines.${index}.productName`, opt.comboTitle);
              setValue(`lines.${index}.price`, opt.salePrice ?? 0);
              setValue(`lines.${index}.costPrice`, opt.costPrice ?? 0);
              if (opt.unit) setValue(`lines.${index}.unit`, opt.unit);
            }
          }}
          enableApiSearch
          onApiSearch={itemSource.onApiSearch}
          hasMore={itemSource.hasMore}
          onLoadMore={itemSource.onLoadMore}
          paginationLoading={itemSource.paginationLoading}
          loading={itemSource.loading}
          disabled={!warehouseSelected}
          placeholder={warehouseSelected ? t("sales:select_from_catalog") : t("sales:select_warehouse_first", { defaultValue: "Select a warehouse first" })}
          hideClear
          classes="!rounded-lg"
        />
        <input type="hidden" {...register(`lines.${index}.variantId`)} />
        <input type="hidden" {...register(`lines.${index}.productName`)} />
        <input type="hidden" {...register(`lines.${index}.costPrice`, { valueAsNumber: true })} />
        {selected?.availableQty != null && (
          <p className={`mt-1 text-xs ${overStock ? "text-rose-600 dark:text-rose-400 font-medium" : "text-slate-400 dark:text-white/40"}`}>
            {t("sales:available_qty", { defaultValue: "Available" })}: {selected.availableQty}
          </p>
        )}
      </td>
      <td className="p-2 min-w-[170px]">
        <SelectDropdown
          data={batchOptions.map((b) => ({ id: b.id, title: batchTitle(b) }))}
          selected={selectedBatch ? { id: selectedBatch.id, title: batchTitle(selectedBatch) } : null}
          setSelected={(o) => {
            setValue(`lines.${index}.batchId`, o?.id || "");
            const b = batchOptions.find((x) => x.id === o?.id);
            if (b) setValue(`lines.${index}.costPrice`, b.unitCost ?? 0);
          }}
          valueKey="id"
          hideClear
          disabled={!row.variantId || batchOptions.length === 0}
          placeholder={batchesLoading ? t("loading") : t("sales:no_batches")}
          classes="!h-9 !rounded-lg !text-xs"
        />
        <input type="hidden" {...register(`lines.${index}.batchId`)} />
        {canSplitBatch && (
          <button
            type="button"
            onClick={splitToAnotherBatch}
            className="mt-1 text-xs text-teal-600 dark:text-teal-400 hover:underline"
          >
            + {t("sales:split_batch", { defaultValue: "Split from another batch" })}
          </button>
        )}
      </td>
      <td className="p-2">
        <input
          type="number"
          step="any"
          onInput={(e) => { if (e.target.value.length > 10) e.target.value = e.target.value.slice(0, 10); }}
          {...register(`lines.${index}.qty`, {
            valueAsNumber: true,
            min: { value: 0, message: "Minimum value is 0" },
          })}
          className={`w-full rounded border px-2 py-1.5 text-sm ${overStock ? "border-rose-400 focus:border-rose-500" : "border-slate-200"}`}
        />
        {lineErrors.qty && <p className="mt-1 text-[11px] text-rose-600">{lineErrors.qty.message}</p>}
      </td>
      <td className="p-2">
        <input
          type="number"
          step="any"
          onInput={(e) => { if (e.target.value.length > 10) e.target.value = e.target.value.slice(0, 10); }}
          {...register(`lines.${index}.price`, {
            valueAsNumber: true,
            min: { value: 0, message: "Minimum value is 0" },
          })}
          className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
        />
        {lineErrors.price && <p className="mt-1 text-[11px] text-rose-600">{lineErrors.price.message}</p>}
      </td>
      <td className="p-2 pt-3 text-slate-500 dark:text-white/60 tabular-nums">
        {Number(row.costPrice || 0).toLocaleString()}
      </td>
      <td className="p-2">
        <input
          {...register(`lines.${index}.unit`)}
          className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
          placeholder="pcs"
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
            {...register(`lines.${index}.taxPercent`, {
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
        {fmtMoney(rowTaxAmount)}
      </td>
      <td className="p-2 pt-3 font-semibold text-slate-800 dark:text-white tabular-nums">
        {fmtMoney(lt + rowTaxAmount)}
      </td>
      <td className={`p-2 pt-3 font-semibold tabular-nums ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
        {profit.toLocaleString()}
      </td>
      <td className="p-2">
        {canRemove && (
          <button
            type="button"
            onClick={() => remove(index)}
            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg"
            title={t("sales:remove")}
          >
            <HiOutlineTrash className="h-5 w-5" />
          </button>
        )}
      </td>
    </tr>
  );
}

export default AddQuotation;
