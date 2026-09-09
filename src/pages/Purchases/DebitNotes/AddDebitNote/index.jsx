import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import Button from "components/Button";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import SelectDropdown from "components/SelectDropdown";
import SearchablePaginatedDropdown from "components/SearchablePaginatedDropdown";
import { fetchSuppliersDropdown, showSupplierDropdownOptions, showSupplierDropdownPage, showSupplierDropdownHasMore, showSupplierDropdownLoading, resetSupplierDropdown } from "store/slices/supplierSlice";
import { fetchPurchaseInvoicesDropdown, showPurchaseInvoiceDropdownOptions, showPurchaseInvoiceDropdownPage, showPurchaseInvoiceDropdownHasMore, showPurchaseInvoiceDropdownLoading, resetPurchaseInvoiceDropdown } from "store/slices/purchaseInvoiceSlice";
import { createDebitNote, fetchReturnableLines, clearReturnableLines, showReturnableInvoice, showReturnableLines, showReturnableLoading, clearCurrentDebitNote } from "store/slices/debitNoteSlice";
import { SkeletonTable } from "components/Skeleton";
import {
  debitNoteReasonOptions,
  purchaseReturnTypeOptions,
} from "global/constant";
import { effectiveLineTaxPercent, checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { add_purchase_debit_note } = alqadar_role_ids;
// supplier — mirrors NO_STOCK_MOVEMENT_REASONS in debit-note-service.ts
// exactly. "Price discrepancy" / "Wrong entry" are pure billing (nothing
// physical moved); "Short shipment" means the goods were never received
// into stock at all.
const NO_STOCK_MOVEMENT_REASONS = new Set(["Price discrepancy", "Short shipment", "Wrong entry"]);

// Backend-driven search + infinite scroll, matching SearchablePaginatedDropdown's contract.
const useDropdownSource = (fetchThunk, selectors, titleFn, extraParams, enabled = true) => {
  const dispatch = useDispatch();
  const options = useSelector(selectors.options);
  const page = useSelector(selectors.page);
  const hasMore = useSelector(selectors.hasMore);
  const loading = useSelector(selectors.loading);

  useEffect(() => {
    if (enabled) dispatch(fetchThunk({ page: 1, search: "", ...extraParams }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, enabled, JSON.stringify(extraParams)]);

  const onApiSearch = (value) => {
    if (enabled) dispatch(fetchThunk({ page: 1, search: value, ...extraParams }));
  };
  const onLoadMore = () => {
    if (enabled && hasMore && !loading) dispatch(fetchThunk({ page: page + 1, search: "", ...extraParams }));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- titleFn is an inline
  // arrow at every call site (new identity each render); including it here would
  // recompute `data` (new array identity) every render regardless of whether
  // `options` actually changed, which loops forever through any effect that
  // syncs local state off this array (infinite re-render, page appears frozen).
  const data = useMemo(() => (enabled ? options.map((o) => ({ ...o, title: titleFn(o) })) : []), [enabled, options]);
  return { data, loading: enabled && loading && page === 1, paginationLoading: enabled && loading && page > 1, hasMore: enabled && hasMore, onApiSearch, onLoadMore };
};

const AddDebitNote = () => {
  const { t, i18n }     = useTranslation();
  const navigate        = useNavigate();
  const dispatch        = useDispatch();
  const [searchParams]  = useSearchParams();
  const isRTL           = i18n.language === "ar";

  useEffect(() => {
    return () => {
      dispatch(clearCurrentDebitNote());
      dispatch(clearReturnableLines());
      dispatch(resetPurchaseInvoiceDropdown());
      dispatch(resetSupplierDropdown());
    };
  }, [dispatch]);
  const prefillInvoiceId = searchParams.get("invoiceId") || "";

  const { register, handleSubmit, control, watch, setValue, getValues, formState: { errors } } = useForm({
    mode: "onChange",
    defaultValues: {
      date: dayjs().format("YYYY-MM-DD"),
      supplierId: "",
      originalInvoiceId: prefillInvoiceId,
      warehouseId: "",
      reason: debitNoteReasonOptions[0].id,
      returnType: purchaseReturnTypeOptions[0].id,
      taxPercent: 0,
      discount: 0,
      notes: "",
      products: [],
    },
  });
  const { fields, replace } = useFieldArray({ control, name: "products" });

  const supplierId = watch("supplierId");
  const supplierName = watch("supplierName");
  const selSupplier = supplierId ? { id: supplierId, title: supplierName || "" } : null;

  const supplierSource = useDropdownSource(
    fetchSuppliersDropdown,
    { options: showSupplierDropdownOptions, page: showSupplierDropdownPage, hasMore: showSupplierDropdownHasMore, loading: showSupplierDropdownLoading },
    (s) => s.name,
  );

  const invoiceSource = useDropdownSource(
    fetchPurchaseInvoicesDropdown,
    { options: showPurchaseInvoiceDropdownOptions, page: showPurchaseInvoiceDropdownPage, hasMore: showPurchaseInvoiceDropdownHasMore, loading: showPurchaseInvoiceDropdownLoading },
    (inv) => `${inv.invoiceNumber} — ${inv.supplierName}`,
    { supplierId },
    !!supplierId,
  );
  const invoiceOpts = invoiceSource.data;

  const originalInvoiceId = watch("originalInvoiceId");
  const originalInvoiceNumber = watch("originalInvoiceNumber");
  const selOriginalInvoice = originalInvoiceId ? { id: originalInvoiceId, title: originalInvoiceNumber || "" } : null;

  const returnableInvoice = useSelector(showReturnableInvoice);
  const returnableLines = useSelector(showReturnableLines);
  const returnableLoading = useSelector(showReturnableLoading);

  // Prefill from ?invoiceId= (Purchase Detail's "Create debit note" link) —
  // fetching returnable lines directly resolves supplier/warehouse too.
  useEffect(() => {
    if (prefillInvoiceId) dispatch(fetchReturnableLines(prefillInvoiceId));
    return () => dispatch(clearReturnableLines());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const returnType = watch("returnType");
  useEffect(() => {
    if (!returnableInvoice) return;
    setValue("supplierId", returnableInvoice.supplierId || "");
    setValue("supplierName", returnableInvoice.supplierName || "");
    setValue("warehouseId", returnableInvoice.warehouseId || "");
    setValue("warehouseName", returnableInvoice.warehouseName || "");
    setValue("originalInvoiceNumber", returnableInvoice.invoiceNumber || "");
    // Defaults the debit note's own rate to whatever the original purchase
    // was actually taxed at, instead of a hardcoded guess.
    setValue("taxPercent", returnableInvoice.taxPercent ?? 0);
    replace(
      returnableLines.map((l) => ({
        ...l,
        qty: returnType === "Full return" ? l.maxReturnableQty : 0,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnableInvoice, returnableLines]);

  const handleReturnTypeChange = (opt) => {
    const next = opt?.id || purchaseReturnTypeOptions[0].id;
    setValue("returnType", next);
    const current = getValues("products") || [];
    replace(current.map((l) => ({ ...l, qty: next === "Full return" ? l.maxReturnableQty : 0 })));
  };

  const handleSupplierChange = (opt) => {
    setValue("supplierId", opt?.id || "");
    setValue("supplierName", opt?.title || "");
    setValue("originalInvoiceId", "");
    setValue("originalInvoiceNumber", "");
    dispatch(clearReturnableLines());
    replace([]);
  };

  const handleInvoiceChange = (opt) => {
    setValue("originalInvoiceId", opt?.id || "");
    setValue("originalInvoiceNumber", opt?.title || "");
    if (opt?.id) {
      dispatch(fetchReturnableLines(opt.id));
    } else {
      dispatch(clearReturnableLines());
      replace([]);
    }
  };

  const selReason = debitNoteReasonOptions.find((o) => o.id === watch("reason")) || debitNoteReasonOptions[0];
  const reasonOpts = debitNoteReasonOptions;
  const selReturnType =
    purchaseReturnTypeOptions.find((o) => o.id === returnType) || purchaseReturnTypeOptions[0];
  const returnTypeOpts = purchaseReturnTypeOptions;
  const movesStock = !NO_STOCK_MOVEMENT_REASONS.has(watch("reason"));

  const watchedProducts = watch("products");
  const taxPercent = watch("taxPercent");
  const discount   = watch("discount");
  const subtotal = useMemo(
    () => (watchedProducts || []).reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.price) || 0), 0),
    [JSON.stringify(watchedProducts)],
  );
  const taxAmt = useMemo(
    () => (watchedProducts || []).reduce((s, l) => {
      const lt = (Number(l.qty) || 0) * (Number(l.price) || 0);
      return s + lt * (effectiveLineTaxPercent(l, taxPercent) / 100);
    }, 0),
    [JSON.stringify(watchedProducts), taxPercent],
  );
  const total = useMemo(() => subtotal - Number(discount || 0) + taxAmt, [subtotal, discount, taxAmt]);
  const fmtMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const onSubmit = async (data) => {
    if (!data.supplierId) { toast.error(t("purchase:supplier_required")); return; }
    if (!data.originalInvoiceId) { toast.error(t("purchase:original_invoice")); return; }
    const linesToReturn = (data.products || []).filter((l) => Number(l.qty) > 0);
    if (!linesToReturn.length) { toast.error(t("purchase:dn_no_lines", { defaultValue: "Select at least one item to return." })); return; }
    try {
      await dispatch(createDebitNote({
        ...data,
        products: linesToReturn.map((l) => ({
          variantId: l.variantId,
          productName: l.productName,
          qty: Number(l.qty),
          price: l.price,
          unit: l.unit,
          batchId: l.batchId || null,
          expiryDate: l.expiryDate || null,
          taxPercent: l.taxPercent === "" || l.taxPercent === undefined || l.taxPercent === null ? null : Number(l.taxPercent),
        })),
      })).unwrap();
      toast.success(t("purchase:dn_saved"));
      navigate("/debit-notes");
    } catch (err) {
      toast.error(err?.message || err || "");
    }
  };

  const panelCls = "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-amber-400";

  if (!checkRoleAuth(add_purchase_debit_note)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-6 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/debit-notes")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{t("purchase:add_debit_note")}</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className={panelCls}>
            <h3 className="text-base font-bold mb-4">{t("purchase:return_info")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <SearchablePaginatedDropdown
                  label={`${t("purchase:supplier")} *`}
                  data={supplierSource.data}
                  selected={selSupplier}
                  setSelected={handleSupplierChange}
                  enableApiSearch
                  onApiSearch={supplierSource.onApiSearch}
                  hasMore={supplierSource.hasMore}
                  onLoadMore={supplierSource.onLoadMore}
                  paginationLoading={supplierSource.paginationLoading}
                  loading={supplierSource.loading}
                />
              </div>
              <FormInput label={t("purchase:date")} name="date" type="date" register={register} />
              <div>
                <SearchablePaginatedDropdown
                  label={t("purchase:original_invoice")}
                  data={invoiceOpts}
                  selected={selOriginalInvoice}
                  setSelected={handleInvoiceChange}
                  enableApiSearch
                  onApiSearch={invoiceSource.onApiSearch}
                  hasMore={invoiceSource.hasMore}
                  onLoadMore={invoiceSource.onLoadMore}
                  paginationLoading={invoiceSource.paginationLoading}
                  loading={invoiceSource.loading}
                  placeholder="PO-..."
                />
              </div>
              <div>
                <SelectDropdown label={t("purchase:reason")} data={reasonOpts} selected={selReason} setSelected={(o) => setValue("reason", o?.id || debitNoteReasonOptions[0].id)} hideClear />
                <p className={`mt-1 text-xs ${movesStock ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {movesStock
                    ? t("purchase:stock_hint_yes", { defaultValue: "Stock will leave the warehouse (returned to supplier) once this debit note is Applied." })
                    : t("purchase:stock_hint_no", { defaultValue: "No physical stock movement — this is a billing-only adjustment." })}
                </p>
              </div>
              <div>
                <SelectDropdown label={t("purchase:return_type")} data={returnTypeOpts} selected={selReturnType} setSelected={handleReturnTypeChange} hideClear />
              </div>
              <div>
                <FormInput
                  label={t("purchase:warehouse")}
                  name="warehouseDisplay"
                  value={returnableInvoice?.warehouseName || ""}
                  placeholder={t("purchase:select_invoice_first", { defaultValue: "Select an original invoice first" })}
                  disabled
                  inputClass="!h-10 !rounded-lg opacity-70"
                />
                <p className="mt-1 text-xs text-slate-400 dark:text-white/40">
                  {t("purchase:dn_warehouse_locked_hint", { defaultValue: "Locked to the original purchase's own warehouse." })}
                </p>
              </div>
              <FormInput label={t("purchase:tax_percent")} name="taxPercent" type="number" register={register} errors={errors} min={0} max={100} decimal decimalPlaces={2} disabled />
              <div className="lg:col-span-3">
                <FormTextarea
                  label={t("purchase:notes")}
                  name="notes"
                  register={register}
                  errors={errors}
                  rows={2}
                  maxLength={500}
                  className="!rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Line items — derived from what the original invoice actually billed */}
          <div className={panelCls}>
            <h3 className="text-base font-bold mb-4">{t("purchase:returned_items")}</h3>
            {!originalInvoiceId ? (
              <p className="text-sm text-slate-400 dark:text-white/40 py-6 text-center">
                {t("purchase:select_invoice_first", { defaultValue: "Select an original invoice first" })}
              </p>
            ) : returnableLoading ? (
              <SkeletonTable rows={4} columns={5} />
            ) : !fields.length ? (
              <p className="text-sm text-slate-400 dark:text-white/40 py-6 text-center">{t("no_record_found")}</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full text-sm min-w-[1200px]">
                  <thead>
                    <tr className="bg-amber-500">
                      <th className="p-2.5 text-start text-xs font-semibold text-white/90 w-12">{t("purchase:sr_no")}</th>
                      <th className="p-2.5 text-start text-xs font-semibold text-white/90">{t("purchase:product")}</th>
                      <th className="p-2.5 text-start text-xs font-semibold text-white/90 whitespace-nowrap">{t("purchase:qty_to_return", { defaultValue: "Qty to return" })}</th>
                      <th className="p-2.5 text-start text-xs font-semibold text-white/90">{t("purchase:price")}</th>
                      <th className="p-2.5 text-start text-xs font-semibold text-white/90">{t("purchase:unit")}</th>
                      <th className="p-2.5 text-start text-xs font-semibold text-white/90 whitespace-nowrap">{t("purchase:expiry_date", { defaultValue: "Expiry date" })}</th>
                      <th className="p-2.5 text-start text-xs font-semibold text-white/90 whitespace-nowrap">{t("purchase:billed_qty", { defaultValue: "Billed qty" })}</th>
                      <th className="p-2.5 text-start text-xs font-semibold text-white/90 whitespace-nowrap">{t("purchase:already_debited", { defaultValue: "Already debited" })}</th>
                      <th className="p-2.5 text-start text-xs font-semibold text-white/90">{t("purchase:base_amount")}</th>
                      <th className="p-2.5 text-start text-xs font-semibold text-white/90">{t("purchase:tax_percent")}</th>
                      <th className="p-2.5 text-start text-xs font-semibold text-white/90">{t("purchase:tax_amount")}</th>
                      <th className="p-2.5 text-start text-xs font-semibold text-white/90">{t("purchase:subtotal")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, idx) => {
                      const maxQty = field.maxReturnableQty ?? 0;
                      const row = watchedProducts?.[idx] || field;
                      const base = (Number(row.qty) || 0) * (Number(row.price) || 0);
                      const rowTaxPct = effectiveLineTaxPercent(row, taxPercent);
                      const rowTaxAmt = base * (rowTaxPct / 100);
                      return (
                        <tr key={field.id} className="border-t border-slate-100 dark:border-white/5 align-top">
                          <td className="p-2.5 tabular-nums text-slate-600 dark:text-white/70 font-medium">{idx + 1}</td>
                          <td className="p-2.5">{field.productName}</td>
                          <td className="p-2.5 w-32">
                            <FormInput
                              name={`products.${idx}.qty`}
                              type="number"
                              min={0}
                              max={maxQty}
                              disabled={returnType === "Full return" || maxQty === 0}
                              register={register}
                              errors={errors}
                              wrapperClass="w-24"
                              inputClass="!h-9 !px-2 !py-1.5 !rounded disabled:opacity-60"
                            />
                            {maxQty === 0 && (
                              <p className="mt-1 text-[11px] text-slate-400">{t("purchase:fully_debited", { defaultValue: "Fully debited" })}</p>
                            )}
                            <input type="hidden" {...register(`products.${idx}.variantId`)} />
                            <input type="hidden" {...register(`products.${idx}.productName`)} />
                            <input type="hidden" {...register(`products.${idx}.batchId`)} />
                            <input type="hidden" {...register(`products.${idx}.expiryDate`)} />
                            <input type="hidden" {...register(`products.${idx}.price`, { valueAsNumber: true })} />
                            <input type="hidden" {...register(`products.${idx}.unit`)} />
                            <input type="hidden" {...register(`products.${idx}.taxPercent`)} />
                          </td>
                          <td className="p-2.5 tabular-nums">{fmtMoney(field.price)}</td>
                          <td className="p-2.5">{field.unit}</td>
                          <td className="p-2.5 text-xs text-slate-500 whitespace-nowrap">{field.expiryDate ? String(field.expiryDate).slice(0, 10) : "—"}</td>
                          <td className="p-2.5 tabular-nums text-slate-500">{field.soldQty}</td>
                          <td className="p-2.5 tabular-nums text-slate-500">{field.alreadyDebitedQty}</td>
                          <td className="p-2.5 tabular-nums font-semibold">{fmtMoney(base)}</td>
                          <td className="p-2.5">
                            <FormInput
                              name={`products.${idx}.taxPercentDisplay`}
                              value={`${rowTaxPct}%`}
                              disabled
                              readonly
                              wrapperClass="w-16"
                              inputClass="!h-9 !px-2 !py-1.5 !rounded !bg-slate-50 dark:!bg-white/5 !text-slate-500 dark:!text-white/60 cursor-not-allowed"
                            />
                          </td>
                          <td className="p-2.5 tabular-nums text-slate-500">{fmtMoney(rowTaxAmt)}</td>
                          <td className="p-2.5 tabular-nums font-semibold">{fmtMoney(base + rowTaxAmt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <dl className="text-sm space-y-1 min-w-[220px]">
                <div className="flex justify-between gap-8"><dt className="text-slate-500">{t("purchase:subtotal")} {t("purchase:without_tax")}</dt><dd className="tabular-nums">{subtotal.toFixed(2)}</dd></div>
                <div className="flex justify-between gap-8"><dt className="text-slate-500">{t("purchase:tax")}</dt><dd className="tabular-nums">{taxAmt.toFixed(2)}</dd></div>
                <div className="flex justify-between gap-8 pt-1 border-t border-slate-200 dark:border-white/20 font-bold text-amber-700"><dt>{t("purchase:debit_amount")} {t("purchase:with_tax")}</dt><dd className="tabular-nums">{total.toFixed(2)}</dd></div>
              </dl>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" title={t("cancel")} onClick={() => navigate("/debit-notes")}
              className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
            <Button type="submit" title={t("purchase:create_debit_note")} btn="primary" className="!rounded-md !bg-amber-500 hover:!bg-amber-600 !border-0" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDebitNote;
