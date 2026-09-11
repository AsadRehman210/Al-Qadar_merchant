import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import SelectDropdown from "components/SelectDropdown";
import PaginatedSelectBox from "components/PaginatedSelectBox";
import Button from "components/Button";
import Table from "components/Table";
import { erpGet, buildQuery } from "api/erpClient";
import { erpUrls } from "global/config";
import {
  salesTaxModeOptions,
  salesTaxRecoverableOptions,
  invoiceTemplateOptions,
  salePaymentStatusOptions,
  paidUnpaidOptions,
  deliveryStatusOptions,
  deliveryCancelledOption,
} from "global/constant";
import {
  defaultSaleLine,
  lineTotal,
  lineProfit,
  computeInvoiceProfit,
  effectiveLineTaxPercent,
  deliveryFrozen,
  canCancelDelivery,
} from "global/helper";
import { HiOutlinePlusCircle, HiOutlineTrash } from "react-icons/hi2";

const defaultLine = () => ({ ...defaultSaleLine(), batchId: "", taxPercent: null });

const SaleInvoiceForm = ({ isEdit = false, currentDeliveryStatus = null, lockProductFields = false, stockApplied = false }) => {
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

  // Lines are frozen once Delivered (stock/COGS posted) or Cancelled.
  // Pending and In Transit still allow product edits — stock hasn't left.
  const linesLocked = isEdit && deliveryFrozen(currentDeliveryStatus);

  const warehouseId = watch("warehouseId");

  // Customer — self-contained PaginatedSelectBox hitting /sales/customer
  // directly (no Redux dropdown slice involved). The label is hydrated from
  // the invoice's own already-known customerName (edit mode / quotation
  // prefill) until the box's own page-1 load resolves the real option.
  const customerId = watch("customerId");
  const customerNameVal = watch("customerName");
  const [selCustomerOpt, setSelCustomerOpt] = useState(null);
  useEffect(() => {
    if (!customerId) {
      setSelCustomerOpt(null);
      return;
    }
    setSelCustomerOpt((prev) => (prev?.value === customerId ? prev : { value: customerId, label: customerNameVal || "" }));
  }, [customerId, customerNameVal]);

  const loadCustomerOptions = useCallback(async ({ page, size, search }) => {
    const query = buildQuery({ page, limit: size, search });
    const res = await erpGet(`${erpUrls.customers}?${query}`);
    if (!res?.success) return { options: [], hasNextPage: false };
    return {
      options: (res.result || []).map((c) => ({ value: c.id, label: c.name, address: c.address })),
      hasNextPage: page < (res.total_pages || 0),
    };
  }, []);

  // Picking a customer prefills Shipping Address from their own address —
  // a plain autofill, not a lock, so it can still be edited afterwards.
  const handleCustomerChange = (opt) => {
    setSelCustomerOpt(opt);
    setValue("customerId", opt?.value || "", { shouldValidate: true });
    setValue("customerName", opt?.label || "");
    setValue("shippingAddress", opt?.address || "");
    trigger("customerId");
  };

  // Warehouse — same self-contained pattern.
  const warehouseNameVal = watch("warehouseName");
  const [selWarehouseOpt, setSelWarehouseOpt] = useState(null);
  useEffect(() => {
    if (!warehouseId) {
      setSelWarehouseOpt(null);
      return;
    }
    setSelWarehouseOpt((prev) => (prev?.value === warehouseId ? prev : { value: warehouseId, label: warehouseNameVal || "" }));
  }, [warehouseId, warehouseNameVal]);

  const loadWarehouseOptions = useCallback(async ({ page, size, search }) => {
    const query = buildQuery({ page, limit: size, search });
    const res = await erpGet(`${erpUrls.warehouses}?${query}`);
    if (!res?.success) return { options: [], hasNextPage: false };
    return {
      options: (res.result || []).map((w) => ({ value: w.id, label: `${w.code} — ${w.name}` })),
      hasNextPage: page < (res.total_pages || 0),
    };
  }, []);

  const handleWarehouseChange = (opt) => {
    setSelWarehouseOpt(opt);
    setValue("warehouseId", opt?.value || "");
  };

  // Product/variant catalog — one shared loader (warehouse-scoped, only
  // variants with real stock there are offered), reused by every line row's
  // own PaginatedSelectBox instance instead of a per-row Redux fetch.
  const loadVariantOptions = useCallback(
    async ({ page, size, search }) => {
      if (!warehouseId) return { options: [], hasNextPage: false };
      const query = buildQuery({ page, limit: size, search, warehouseId });
      const res = await erpGet(`${erpUrls.variants}?${query}`);
      if (!res?.success) return { options: [], hasNextPage: false };
      return {
        options: (res.result || []).map((v) => {
          const comboTitle = `${v.productName || ""} — ${v.variantName} (${v.sku})`;
          return {
            value: v.id,
            label: `${comboTitle} · Qty: ${v.availableQty ?? 0}`,
            comboTitle,
            salePrice: v.salePrice,
            costPrice: v.costPrice,
            availableQty: v.availableQty,
            unit: v.unit || "",
          };
        }),
        hasNextPage: page < (res.total_pages || 0),
      };
    },
    [warehouseId],
  );

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
        setValue(`products.${idx}.variantId`, "");
        setValue(`products.${idx}.productName`, "");
        setValue(`products.${idx}.price`, 0);
        setValue(`products.${idx}.costPrice`, 0);
        setValue(`products.${idx}.batchId`, "");
      });
    }
    prevWarehouseIdRef.current = warehouseId || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId]);

  const taxPercent = useWatch({ control, name: "taxPercent" }) ?? 0;
  const lines = useWatch({ control, name: "products" }) || [];

  // "Same for all" (default) vs "different per product" — purely a UI mode,
  // nothing separate is persisted for it. In "same" mode every line's own
  // taxPercent is cleared so it falls back to the shared invoice-level rate;
  // in "different" mode each line carries its own explicit override. The
  // backend computes totals with the exact same fallback rule.
  const [taxMode, setTaxMode] = useState(salesTaxModeOptions[0]);
  const [selTaxRecoverable, setSelTaxRecoverable] = useState(salesTaxRecoverableOptions[0]);
  const taxRecoverableValue = watch("taxRecoverable");
  useEffect(() => {
    setSelTaxRecoverable(taxRecoverableValue === "no" ? salesTaxRecoverableOptions[1] : salesTaxRecoverableOptions[0]);
  }, [taxRecoverableValue]);

  // Editing an existing invoice that already carries per-line overrides
  // (saved earlier in "different" mode) — detect that once the real lines
  // arrive via reset() and switch the UI mode to match, so the form doesn't
  // silently show "same" while the data underneath says otherwise.
  const hydratedModeRef = useRef(false);
  useEffect(() => {
    if (hydratedModeRef.current || !lines.length) return;
    const hasOverride = lines.some((l) => l?.taxPercent !== undefined && l?.taxPercent !== null && l?.taxPercent !== "");
    if (hasOverride) setTaxMode(salesTaxModeOptions[1]);
    hydratedModeRef.current = true;
  }, [lines]);

  const handleTaxModeChange = (opt) => {
    const next = opt || salesTaxModeOptions[0];
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

  const { subtotal, taxAmount, total, profit } = useMemo(() => {
    let sub = 0;
    let tax = 0;
    for (const l of lines) {
      const lineSub = lineTotal(l);
      sub += lineSub;
      tax += lineSub * (effectiveLineTaxPercent(l, taxPercent) / 100);
    }
    return {
      subtotal: sub,
      taxAmount: tax,
      total: sub + tax,
      profit: computeInvoiceProfit(lines),
    };
  }, [lines, taxPercent]);

  useEffect(() => {
    setValue("subtotal", subtotal);
    setValue("taxAmount", taxAmount);
    setValue("total", total);
    setValue("profit", profit);
  }, [subtotal, taxAmount, total, profit, setValue]);

  const fmtMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const [selTemplate, setSelTemplate] = useState(invoiceTemplateOptions[0]);
  // Defaults to Pending for a brand-new invoice; hydrated to the invoice's
  // real, backend-computed value (Partial/Paid) on edit via the `ps` effect
  // below — it's a derived value (see the disabled dropdown further down),
  // never something this form itself sets.
  const [selPayStatus, setSelPayStatus] = useState(salePaymentStatusOptions[0]);
  const [selPayType, setSelPayType] = useState(paidUnpaidOptions[1]);
  const [selDelivery, setSelDelivery] = useState(deliveryStatusOptions[0]);

  const tpl = watch("invoiceTemplate");
  const ps = watch("paymentStatus");
  const pt = watch("paymentType");
  const ds = watch("deliveryStatus");

  useEffect(() => {
    if (tpl)
      setSelTemplate(
        invoiceTemplateOptions.find((o) => o.id === tpl) || invoiceTemplateOptions[0],
      );
  }, [tpl]);
  useEffect(() => {
    if (ps)
      setSelPayStatus(
        salePaymentStatusOptions.find((o) => o.id === ps) || salePaymentStatusOptions[0],
      );
  }, [ps]);
  useEffect(() => {
    if (pt)
      setSelPayType(
        paidUnpaidOptions.find((o) => o.id === pt) || paidUnpaidOptions[0],
      );
  }, [pt]);
  useEffect(() => {
    if (ds)
      setSelDelivery(
        deliveryStatusOptions.find((o) => o.id === ds) ||
          deliveryStatusOptions[0],
      );
  }, [ds]);

  const section =
    "text-base font-semibold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-white/15 w-full";

  return (
    <div className="space-y-8">
      <div>
        <h3 className={section}>{t("sales:invoice_details")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <PaginatedSelectBox
              label={t("sales:customer")}
              loadOptions={loadCustomerOptions}
              value={customerId || null}
              selectedOption={selCustomerOpt}
              onOptionChange={handleCustomerChange}
              placeholder={t("sales:select_customer", { defaultValue: "Select customer" })}
              required
              errorMessage={errors.customerId?.message}
              disabled={lockProductFields}
            />
            <input type="hidden" {...register("customerId", { required: t("sales:customer_required") })} />
          </div>
          <FormInput
            label={t("sales:shipping_address")}
            name="shippingAddress"
            register={register}
            errors={errors}
            maxLength={250}
            labelClass="text-sm text-linkText font-medium"
            disabled
          />
          <div>
            <PaginatedSelectBox
              label={t("sales:warehouse")}
              loadOptions={loadWarehouseOptions}
              value={warehouseId || null}
              selectedOption={selWarehouseOpt}
              onOptionChange={handleWarehouseChange}
              placeholder={t("sales:select_warehouse", { defaultValue: "Select warehouse" })}
              disabled={lockProductFields}
            />
            <input type="hidden" {...register("warehouseId")} />
          </div>
          <FormInput
            label={t("sales:delivery_date")}
            name="deliveryDate"
            type="date"
            register={register}
            errors={errors}
            required
            labelClass="text-sm text-linkText font-medium"
          />
          <FormInput
            label={t("sales:receiver_name")}
            name="receiverName"
            register={register}
            errors={errors}
            pattern={/[a-zA-Z0-9\s.'&,-]/}
            minLength={2}
            maxLength={100}
            labelClass="text-sm text-linkText font-medium"
          />
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-end gap-3 mb-3">
          {linesLocked && (
            <p className="text-xs text-slate-400 dark:text-white/40">
              {t("sales:lines_locked_hint", {
                defaultValue: "Products are locked once a sale is Delivered or Cancelled.",
              })}
            </p>
          )}
          {lockProductFields && !linesLocked && (
            <p className="text-xs text-purple-600 dark:text-purple-300">
              {t("sales:product_fields_locked_hint", {
                defaultValue: "Product, quantity and price are locked from the quotation — only each line's batch can be changed here.",
              })}
            </p>
          )}
          {!linesLocked && (
            <div className="flex-1 min-w-[220px] max-w-xs">
              <SelectDropdown
                label={t("sales:tax_type")}
                data={salesTaxRecoverableOptions}
                selected={selTaxRecoverable}
                setSelected={(o) => {
                  const val = o?.id ?? "yes";
                  setSelTaxRecoverable(o || salesTaxRecoverableOptions[0]);
                  setValue("taxRecoverable", val, { shouldValidate: true });
                }}
                name="taxRecoverable"
                register={register}
                setValue={setValue}
                trigger={trigger}
                valueKey="id"
                hideClear
                disabled={lockProductFields}
                classes="!rounded-md"
              />
            </div>
          )}
          {!linesLocked && !lockProductFields && (
            <>
              <div className="flex-1 min-w-[220px] max-w-xs">
                <SelectDropdown
                  label={t("sales:tax_mode")}
                  data={salesTaxModeOptions}
                  selected={taxMode}
                  setSelected={handleTaxModeChange}
                  valueKey="id"
                  hideClear
                  classes="!rounded-md"
                />
              </div>
              {taxMode.id === "same" && (
                <div className="w-32">
                  <FormInput
                    label={t("sales:tax_percent")}
                    name="taxPercent"
                    type="number"
                    min={0}
                    max={100}
                    decimal
                    decimalPlaces={2}
                    register={register}
                    errors={errors}
                    inputClass="!h-10 !rounded-md"
                  />
                </div>
              )}
            </>
          )}
          {!linesLocked && !lockProductFields && (
            <Button
              type="button"
              title={t("sales:add_product")}
              icon={HiOutlinePlusCircle}
              onClick={() => append(defaultLine())}
              className="!rounded-md !h-10 !px-4 !bg-teal-500 hover:!bg-teal-600 !text-white !border-0 ml-auto"
              iconClass="!text-lg"
            />
          )}
        </div>
        {/* overflow-x-auto (Table's default) forces overflow-y:auto too per the
            CSS overflow spec, which clips the product/batch PaginatedSelectBox's
            own dropdown panel to the table's own height — showing it cramped
            inside the row with its own scrollbar instead of floating over the
            page. Overridden to overflow-visible here (losing this table's own
            horizontal scroll, an acceptable trade on this desktop-first form)
            so the dropdown can escape and render normally. */}
        <Table className="!overflow-visible">
          <table className="w-full text-sm min-w-[780px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-white/10 text-left">
                <th className="p-2 font-semibold w-12 text-center">
                  {t("sales:sr_no")}
                </th>
                <th className="p-2 font-semibold">{t("sales:product")}</th>
                <th className="p-2 font-semibold w-44">{t("sales:batch")}</th>
                <th className="p-2 font-semibold w-44">{t("sales:qty")}</th>
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
                  loadVariantOptions={loadVariantOptions}
                  warehouseSelected={!!warehouseId}
                  warehouseId={warehouseId}
                  remove={remove}
                  append={append}
                  canRemove={fields.length > 1}
                  locked={linesLocked}
                  lockProductFields={lockProductFields}
                  stockApplied={stockApplied}
                  taxMode={taxMode.id}
                  invoiceTaxPercent={taxPercent}
                  fmtMoney={fmtMoney}
                  allLines={lines}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </Table>
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] dark:border-white/15 dark:bg-slate-900/40 dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]">
            <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 px-5 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90">
                {t("sales:invoice_summary")}
              </p>
            </div>
            <div className="p-5 sm:p-6 space-y-1">
              <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/10 -mx-1">
                <div className="px-4 py-3 text-center">
                  <p className="mb-1 text-xs font-medium text-slate-500 dark:text-white/55">
                    {t("sales:subtotal")}
                  </p>
                  <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-white">
                    {fmtMoney(subtotal)} SAR
                  </p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="mb-1 text-xs font-medium text-slate-500 dark:text-white/55">
                    {t("sales:tax_amount")}
                  </p>
                  <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-white">
                    {fmtMoney(taxAmount)} SAR
                  </p>
                </div>
                <div className="px-4 py-3 text-center bg-teal-50/60 dark:bg-teal-500/10 rounded-lg">
                  <p className="mb-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
                    {t("sales:total")}
                  </p>
                  <p className="text-lg font-bold tabular-nums text-teal-600 dark:text-teal-400">
                    {fmtMoney(total)} SAR
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-950/20 mt-2">
                <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  {t("sales:profit")}
                </span>
                <span className={`text-lg font-bold tabular-nums ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {fmtMoney(profit)} SAR
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Always Pending and locked here — a Sale Invoice always starts
            Pending (the backend hardcodes it at create) and payments are
            only ever recorded afterwards, through the Detail page's own
            dedicated "Record payment" flow (the real addPayment endpoint),
            never from this form. */}
        <SelectDropdown
          label={t("sales:payment_status")}
          data={salePaymentStatusOptions}
          selected={selPayStatus}
          setSelected={() => {}}
          name="paymentStatus"
          register={register}
          setValue={setValue}
          trigger={trigger}
          valueKey="id"
          errors={errors}
          disabled
          hideClear
          classes="!rounded-md opacity-70"
        />
        <div>
        <SelectDropdown
          label={t("sales:delivery_status")}
          data={isEdit && canCancelDelivery(currentDeliveryStatus) ? [...deliveryStatusOptions, deliveryCancelledOption] : deliveryStatusOptions}
          selected={selDelivery}
          setSelected={(o) => {
            setSelDelivery(o);
            setValue("deliveryStatus", o?.id);
          }}
          name="deliveryStatus"
          register={register}
          setValue={setValue}
          trigger={trigger}
          required={t("sales:select_delivery_status")}
          disabled={isEdit && (currentDeliveryStatus === "Delivered" || currentDeliveryStatus === "Cancelled")}
          hideClear={isEdit && (currentDeliveryStatus === "Delivered" || currentDeliveryStatus === "Cancelled")}
          classes={`!rounded-md ${isEdit && (currentDeliveryStatus === "Delivered" || currentDeliveryStatus === "Cancelled") ? "opacity-70" : ""}`}
          valueKey="id"
          errors={errors}
        />
        {isEdit && (currentDeliveryStatus === "Delivered" || currentDeliveryStatus === "Cancelled") && (
          <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
            {currentDeliveryStatus === "Cancelled"
              ? t("sales:cancelled_locked_hint", { defaultValue: "This sale is cancelled — the invoice has been reversed on the ledger." })
              : t("sales:delivery_status_locked_hint", {
                  defaultValue: "Delivery status is locked once Delivered — stock and COGS have been posted.",
                })}
          </p>
        )}
        {isEdit && selDelivery.id === "Cancelled" && canCancelDelivery(currentDeliveryStatus) && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            {t("sales:cancel_warning", {
              defaultValue: "Cancelling this sale will reverse the invoice on the ledger. This cannot be undone.",
            })}
          </p>
        )}
        </div>
        <FormInput
          label={t("sales:tracking_number")}
          name="trackingNumber"
          register={register}
          errors={errors}
          pattern={/[A-Za-z0-9-]/}
          maxLength={100}
          labelClass="text-sm text-linkText font-medium"
        />
        <FormInput
          label={t("sales:transporter_name")}
          name="transporterName"
          register={register}
          errors={errors}
          pattern={/[a-zA-Z0-9\s.'&,-]/}
          minLength={2}
          maxLength={100}
          labelClass="text-sm text-linkText font-medium"
        />
      </div>

      <FormTextarea
        label={t("sales:notes")}
        name="notes"
        register={register}
        errors={errors}
        rows={3}
        maxLength={500}
        placeholder={t("sales:notes")}
        className="!rounded-md"
      />
    </div>
  );
};

function LineRow({ index, sr, register, setValue, loadVariantOptions, warehouseSelected, warehouseId, remove, append, canRemove, locked, lockProductFields, stockApplied, taxMode, invoiceTaxPercent, fmtMoney, allLines, t }) {
  const { watch, getValues, formState: { errors } } = useFormContext();
  const row = watch(`products.${index}`) || {};
  // Converting a quotation locks everything a quote already committed to —
  // product, qty, price, tax — leaving only the batch picker below live,
  // since stock may have moved since the quote was made. `locked` (the
  // terminal delivery-status case) is stricter still and locks the batch too.
  const fieldsLocked = locked || lockProductFields;
  const lt = lineTotal(row);
  const profit = lineProfit(row);
  const rowTaxAmount = lt * (effectiveLineTaxPercent(row, invoiceTaxPercent) / 100);
  const selectedId = row.variantId;

  // Snapshot of the currently-picked variant's own availableQty, taken at
  // selection time (the PaginatedSelectBox manages its own option list
  // privately, so this is the only place that data is visible to the row).
  const [selMeta, setSelMeta] = useState(null);

  // A variant can have several batches on hand (bought at different times,
  // different cost, different expiry) — fetched fresh per row whenever its
  // product or the invoice's warehouse changes, never shared across rows
  // since two rows can easily hold two different products.
  const [batchOptionsRaw, setBatchOptionsRaw] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // remainingQty only drops when this invoice is Delivered (stockApplied).
  // Pending / In Transit / new / quotation-convert have not taken stock, so
  // adding this row's own qty back would invent units that were never
  // reserved — two lines on the same 10-unit batch would each see "10 left"
  // and save as 20. Only a delivered invoice (products are frozen anyway)
  // needs that add-back, in case we ever re-open batch math against a
  // remainingQty this line already consumed.
  const originalRef = useRef({
    batchId: stockApplied ? row.batchId || null : null,
    qty: stockApplied ? Number(row.qty) || 0 : 0,
  });

  useEffect(() => {
    if (!row.variantId || !warehouseId) {
      setBatchOptionsRaw([]);
      return;
    }
    let cancelled = false;
    setBatchesLoading(true);
    // Fetches every batch here, not just onlyAvailable — the effective-qty
    // math below (which adds this row's own original reservation back in,
    // in edit mode) needs the full picture, including a batch this row
    // already drained.
    const query = buildQuery({ variantId: row.variantId, warehouseId, limit: 50 });
    erpGet(`${erpUrls.stockBatches}?${query}`)
      .then((res) => {
        if (cancelled) return;
        const original = originalRef.current;
        const withEffectiveQty = (res?.success ? res.result || [] : []).map((b) => ({
          ...b,
          remainingQty: b.id === original.batchId ? (Number(b.remainingQty) || 0) + original.qty : (Number(b.remainingQty) || 0),
        }));
        setBatchOptionsRaw(withEffectiveQty);
      })
      .finally(() => {
        if (!cancelled) setBatchesLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.variantId, warehouseId]);

  // Splitting one product across several batches means more than one row can
  // point at the same batch at once — each row's own fetch has no idea what
  // its siblings just claimed, so that has to be subtracted here, live, off
  // the full lines array. Without this, two rows selling from the same
  // 10-unit batch would each independently show "10 available" and let the
  // user oversell it by the time both are filled in (the backend would still
  // catch it at save, but only after the whole form is filled out).
  const batchOptions = useMemo(() => {
    const siblingReserved = new Map();
    (allLines || []).forEach((l, i) => {
      if (i === index || !l?.batchId) return;
      const id = String(l.batchId);
      siblingReserved.set(id, (siblingReserved.get(id) || 0) + (Number(l.qty) || 0));
    });
    return batchOptionsRaw
      .map((b) => ({ ...b, remainingQty: Math.max(0, (Number(b.remainingQty) || 0) - (siblingReserved.get(String(b.id)) || 0)) }))
      // Keep this row's own current selection visible even if siblings have
      // just claimed the rest of it — otherwise the dropdown blanks out
      // mid-edit before the user's finished splitting the quantities.
      .filter((b) => b.remainingQty > 0 || b.id === row.batchId);
  }, [batchOptionsRaw, allLines, index, row.batchId]);

  // FEFO default — batches come back sorted earliest-expiry-first, so once
  // they load for a freshly-picked product with no batch chosen yet, take
  // the top one that still has leftover after sibling rows. Never auto-pick
  // a drained batch (remainingQty 0) just because it's first in the list.
  useEffect(() => {
    if (batchOptions.length && !row.batchId) {
      const first = batchOptions.find((b) => (Number(b.remainingQty) || 0) > 0);
      if (!first) return;
      setValue(`products.${index}.batchId`, first.id);
      setValue(`products.${index}.costPrice`, first.unitCost ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchOptions]);

  const selectedBatch = batchOptions.find((b) => b.id === row.batchId) || null;
  const batchAvailable = selectedBatch ? Number(selectedBatch.remainingQty) || 0 : null;
  const siblingVariantQty = (allLines || []).reduce((s, l, i) => {
    if (i === index || !l?.variantId || l.variantId !== row.variantId) return s;
    return s + (Number(l.qty) || 0);
  }, 0);
  const variantAvailable =
    selMeta?.availableQty != null ? Math.max(0, Number(selMeta.availableQty) - siblingVariantQty) : null;
  const overStock =
    (variantAvailable != null && Number(row.qty) > variantAvailable) ||
    (batchAvailable != null && Number(row.qty) > batchAvailable);

  // More than one batch to choose from for this same product — offer a
  // one-click way to sell the rest from a different batch instead of making
  // the user re-search and re-pick the same product on a fresh row.
  const canSplitBatch = row.variantId && batchOptionsRaw.length > 1;
  const splitToAnotherBatch = () => {
    append?.({
      variantId: row.variantId,
      productName: row.productName || "",
      qty: 1,
      price: Number(row.price) || 0,
      costPrice: 0,
      unit: row.unit || "",
      batchId: "",
      taxPercent: row.taxPercent ?? null,
    });
  };

  const batchTitle = (b) =>
    `${b.expiryDate ? String(b.expiryDate).slice(0, 10) : "—"} · Qty ${b.remainingQty} · ${Number(b.unitCost || 0).toLocaleString()}`;

  const loadBatchOptions = useCallback(
    async ({ page, size, search }) => {
      const filtered = search
        ? batchOptions.filter((b) => batchTitle(b).toLowerCase().includes(search.toLowerCase()))
        : batchOptions;
      const start = (page - 1) * size;
      const pageItems = filtered.slice(start, start + size);
      return {
        options: pageItems.map((b) => ({ value: b.id, label: batchTitle(b) })),
        hasNextPage: start + size < filtered.length,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [batchOptions],
  );

  return (
    <tr className="border-t border-slate-100 dark:border-white/10 align-top">
      <td className="p-2 text-center tabular-nums text-slate-600 dark:text-white/70 font-medium">
        {sr}
      </td>
      <td className="p-2 min-w-[220px]">
        <PaginatedSelectBox
          key={warehouseId || "none"}
          loadOptions={loadVariantOptions}
          value={selectedId || null}
          selectedOption={selectedId ? { value: selectedId, label: row.productName || "" } : null}
          onOptionChange={(opt) => {
            setValue(`products.${index}.variantId`, opt?.value || "");
            setValue(`products.${index}.batchId`, "");
            setSelMeta(opt ? { availableQty: opt.availableQty } : null);
            if (opt?.value) {
              setValue(`products.${index}.productName`, opt.comboTitle);
              setValue(`products.${index}.price`, opt.salePrice ?? 0);
              setValue(`products.${index}.costPrice`, opt.costPrice ?? 0);
              setValue(`products.${index}.unit`, opt.unit || "");
            }
          }}
          clearable={false}
          disabled={!warehouseSelected || fieldsLocked}
          placeholder={warehouseSelected ? t("sales:select_from_catalog") : t("sales:select_warehouse_first", { defaultValue: "Select a warehouse first" })}
        />
        <input type="hidden" {...register(`products.${index}.variantId`)} />
        <input type="hidden" {...register(`products.${index}.productName`)} />
        <input type="hidden" {...register(`products.${index}.costPrice`, { valueAsNumber: true })} />
        {variantAvailable != null && (
          <p className={`mt-1 text-xs ${overStock ? "text-rose-600 dark:text-rose-400 font-medium" : "text-slate-400 dark:text-white/40"}`}>
            {t("sales:available_qty", { defaultValue: "Available" })}: {variantAvailable}
          </p>
        )}
      </td>
      <td className="p-2 min-w-[170px]">
        <PaginatedSelectBox
          key={`${row.variantId || "none"}-${batchOptions.map((b) => b.id).join(",")}`}
          loadOptions={loadBatchOptions}
          value={row.batchId || null}
          selectedOption={selectedBatch ? { value: selectedBatch.id, label: batchTitle(selectedBatch) } : null}
          onOptionChange={(opt) => {
            setValue(`products.${index}.batchId`, opt?.value || "");
            const b = batchOptions.find((x) => x.id === opt?.value);
            if (b) setValue(`products.${index}.costPrice`, b.unitCost ?? 0);
          }}
          clearable={false}
          size="sm"
          disabled={!row.variantId || batchOptions.length === 0 || locked}
          placeholder={batchesLoading ? t("loading") : t("sales:no_batches")}
        />
        <input type="hidden" {...register(`products.${index}.batchId`)} />
        {canSplitBatch && !locked && !lockProductFields && (
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
        <FormInput
          name={`products.${index}.qty`}
          type="number"
          min={0}
          maxLength={10}
          disabled={fieldsLocked}
          register={register}
          errors={errors}
          wrapperClass="w-20"
          inputClass={`!h-9 !px-2 !py-1.5 !rounded disabled:opacity-60 disabled:cursor-not-allowed ${overStock ? "!border-rose-400 focus:!border-rose-500" : ""}`}
          validate={(v) => {
              const n = Number(v) || 0;
              const products = getValues("products") || [];
              const batchId = products[index]?.batchId;
              if (batchId) {
                const raw = batchOptionsRaw.find((b) => String(b.id) === String(batchId));
                if (raw) {
                  const siblings = products.reduce((s, l, i) => {
                    if (i === index || String(l?.batchId || "") !== String(batchId)) return s;
                    return s + (Number(l.qty) || 0);
                  }, 0);
                  const left = Math.max(0, (Number(raw.remainingQty) || 0) - siblings);
                  if (n > left) return t("sales:qty_exceeds_batch", { available: left });
                }
              }
              if (variantAvailable != null && n > variantAvailable) {
                return t("sales:qty_exceeds_stock", { available: variantAvailable });
              }
              return true;
            }}
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
          disabled={fieldsLocked}
          register={register}
          errors={errors}
          inputClass="!h-9 !px-2 !py-1.5 !rounded disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </td>
      <td className="p-2 pt-3 text-slate-500 dark:text-white/60 tabular-nums">
        {Number(row.costPrice || 0).toLocaleString()}
      </td>
      <td className="p-2">
        <FormInput
          name={`products.${index}.unit`}
          disabled
          readonly
          register={register}
          errors={errors}
          inputClass="!h-9 !px-2 !py-1.5 !rounded !bg-slate-50 dark:!bg-white/5 !text-slate-500 dark:!text-white/60 cursor-not-allowed"
        />
      </td>
      <td className="p-2 pt-3 font-semibold text-slate-800 dark:text-white">
        {lt.toLocaleString()}
      </td>
      {taxMode === "different" && (
        <td className="p-2">
          <FormInput
            name={`products.${index}.taxPercent`}
            type="number"
            min={0}
            max={100}
            decimal
            decimalPlaces={2}
            placeholder="0"
            disabled={fieldsLocked}
            register={register}
            errors={errors}
            inputClass="!h-9 !px-2 !py-1.5 !rounded disabled:opacity-60 disabled:cursor-not-allowed"
          />
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
        {canRemove && !locked && !lockProductFields && (
          <button
            type="button"
            onClick={() => remove(index)}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-md"
            title={t("sales:remove")}
          >
            <HiOutlineTrash className="h-5 w-5" />
          </button>
        )}
      </td>
    </tr>
  );
}

export default SaleInvoiceForm;
