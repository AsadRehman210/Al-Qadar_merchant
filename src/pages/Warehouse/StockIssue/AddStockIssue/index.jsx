import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import FormInput from "components/FormInput";
import SearchablePaginatedDropdown from "components/SearchablePaginatedDropdown";
import { stockIssueTypeOptions } from "global/constant";
import { erpGet, buildQuery } from "api/erpClient";
import { erpUrls } from "global/config";
import { fetchWarehousesDropdown, showWarehouseDropdownOptions, showWarehouseDropdownPage, showWarehouseDropdownHasMore, showWarehouseDropdownLoading, resetWarehouseDropdown } from "store/slices/warehouseSlice";
import { fetchVariantsDropdown, showVariantDropdownOptions, showVariantDropdownPage, showVariantDropdownHasMore, showVariantDropdownLoading, resetVariantDropdown } from "store/slices/variantSlice";
import { createStockIssue, clearCurrentStockIssue } from "store/slices/stockIssueSlice";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { add_warehouse_issue } = alqadar_role_ids;

const formatBatchTitle = (b) => {
  const exp = b.expiryDate ? String(b.expiryDate).slice(0, 10) : "—";
  const qty = Number(b.remainingQty) || 0;
  const label = b.batchNo || (b.id ? String(b.id).slice(-6) : "—");
  return `Exp ${exp} · Qty ${qty} · ${label}`;
};

const toBatchSelection = (b) => ({
  id: b.id,
  title: formatBatchTitle(b),
  remainingQty: Number(b.remainingQty) || 0,
  expiryDate: b.expiryDate || null,
  batchNo: b.batchNo || null,
});

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => (enabled ? options.map((o) => ({ ...o, title: titleFn(o) })) : []), [enabled, options]);
  return {
    data,
    loading: enabled && loading && page === 1,
    paginationLoading: enabled && loading && page > 1,
    hasMore: enabled && hasMore,
    onApiSearch,
    onLoadMore,
  };
};

/** One issue line: product + batch + qty. Batches load for the selected variant in the warehouse. */
const IssueLineRow = ({
  index,
  item,
  items,
  warehouseId,
  productOptions,
  variantSource,
  onChange,
  onRemove,
  canRemove,
  t,
}) => {
  const [batchOptionsRaw, setBatchOptionsRaw] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const autoSelectedRef = useRef("");
  const variantId = item.variant?.id || "";

  useEffect(() => {
    autoSelectedRef.current = "";
    if (!variantId || !warehouseId) {
      setBatchOptionsRaw([]);
      return;
    }
    let cancelled = false;
    setBatchesLoading(true);
    const query = buildQuery({
      variantId,
      warehouseId,
      onlyAvailable: true,
      limit: 50,
    });
    erpGet(`${erpUrls.stockBatches}?${query}`)
      .then((res) => {
        if (cancelled) return;
        setBatchOptionsRaw(res?.success ? res.result || [] : []);
      })
      .catch(() => {
        if (!cancelled) setBatchOptionsRaw([]);
      })
      .finally(() => {
        if (!cancelled) setBatchesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [variantId, warehouseId]);

  const batchOptions = useMemo(() => {
    const siblingReserved = new Map();
    (items || []).forEach((l, i) => {
      if (i === index || !l?.batch?.id) return;
      const id = String(l.batch.id);
      siblingReserved.set(id, (siblingReserved.get(id) || 0) + (Number(l.qty) || 0));
    });
    return batchOptionsRaw
      .map((b) => {
        const raw = Number(b.remainingQty) || 0;
        const reserved = siblingReserved.get(String(b.id)) || 0;
        const remainingQty = Math.max(0, raw - reserved);
        return {
          id: b.id,
          title: formatBatchTitle({ ...b, remainingQty }),
          remainingQty,
          rawRemainingQty: raw,
          expiryDate: b.expiryDate || null,
          batchNo: b.batchNo || null,
        };
      })
      .filter((b) => b.remainingQty > 0 || String(b.id) === String(item.batch?.id || ""));
  }, [batchOptionsRaw, items, index, item.batch?.id]);

  useEffect(() => {
    if (!batchOptions.length || item.batch?.id) return;
    const key = `${variantId}:${warehouseId}:${batchOptions.map((b) => b.id).join(",")}`;
    if (autoSelectedRef.current === key) return;
    const first = batchOptions.find((b) => (Number(b.remainingQty) || 0) > 0);
    if (!first) return;
    autoSelectedRef.current = key;
    const raw = batchOptionsRaw.find((b) => String(b.id) === String(first.id));
    onChange({ batch: toBatchSelection(raw || first) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchOptions, item.batch?.id, variantId, warehouseId]);

  useEffect(() => {
    if (!item.batch?.id || !batchOptionsRaw.length) return;
    const raw = batchOptionsRaw.find((b) => String(b.id) === String(item.batch.id));
    if (!raw) return;
    const nextRaw = Number(raw.remainingQty) || 0;
    const expOf = (d) => (d ? String(d).slice(0, 10) : "");
    if (
      nextRaw !== Number(item.batch.remainingQty) ||
      (raw.batchNo || null) !== (item.batch.batchNo || null) ||
      expOf(raw.expiryDate) !== expOf(item.batch.expiryDate)
    ) {
      onChange({ batch: toBatchSelection(raw) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchOptionsRaw]);

  const selectedBatch =
    batchOptions.find((b) => String(b.id) === String(item.batch?.id || "")) ||
    (item.batch?.id
      ? {
          ...item.batch,
          title: formatBatchTitle({
            ...item.batch,
            remainingQty: Number(item.batch.remainingQty) || 0,
          }),
        }
      : null);

  const batchAvailable = selectedBatch ? Number(selectedBatch.remainingQty) || 0 : null;
  const maxQty = batchAvailable != null ? batchAvailable : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
      <div className="md:col-span-2">
        <SearchablePaginatedDropdown
          key={`${warehouseId || "none"}-${item.variant?.id || index}`}
          label={t("product")}
          labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
          data={productOptions}
          selected={item.variant}
          setSelected={(v) => onChange({ variant: v, batch: null })}
          enableApiSearch
          onApiSearch={variantSource.onApiSearch}
          hasMore={variantSource.hasMore}
          onLoadMore={variantSource.onLoadMore}
          paginationLoading={variantSource.paginationLoading}
          loading={variantSource.loading}
          hideClear
          disabled={!warehouseId}
          classes="!h-[40px] !rounded-lg"
        />
      </div>
      <div className="md:col-span-2">
        <SearchablePaginatedDropdown
          key={`batch-${variantId || "none"}-${batchOptions.map((b) => `${b.id}:${b.remainingQty}`).join(",")}`}
          label={t("batch", { defaultValue: "Batch" })}
          labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
          data={batchOptions}
          selected={selectedBatch}
          setSelected={(o) => {
            if (!o?.id) {
              onChange({ batch: null });
              return;
            }
            const raw = batchOptionsRaw.find((b) => String(b.id) === String(o.id));
            onChange({ batch: raw ? toBatchSelection(raw) : toBatchSelection(o) });
          }}
          hideClear
          disabled={!variantId || !warehouseId || batchesLoading}
          loading={batchesLoading}
          placeholder={
            batchesLoading
              ? t("loading", { ns: "translation", defaultValue: "Loading..." })
              : t("select_batch", { defaultValue: "Select batch" })
          }
          classes="!h-[40px] !rounded-lg"
        />
      </div>
      <div>
        <FormInput
          label={t("qty")}
          labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
          name={`itemQty-${index}`}
          type="number"
          min={1}
          max={maxQty}
          maxLength={10}
          value={item.qty}
          onValueChange={(v) => onChange({ qty: v })}
          inputClass="!h-10 !rounded-lg"
        />
      </div>
      <div className="flex items-end">
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-100 disabled:opacity-30"
        >
          <FiTrash2 size={15} />
        </button>
      </div>
    </div>
  );
};

const AddStockIssue = () => {
  const { t } = useTranslation("warehouse");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      dispatch(resetWarehouseDropdown());
      dispatch(resetVariantDropdown());
      dispatch(clearCurrentStockIssue());
    };
  }, [dispatch]);

  const warehouseSource = useDropdownSource(
    fetchWarehousesDropdown,
    {
      options: showWarehouseDropdownOptions,
      page: showWarehouseDropdownPage,
      hasMore: showWarehouseDropdownHasMore,
      loading: showWarehouseDropdownLoading,
    },
    (w) => `${w.code} — ${w.name}`,
  );

  const defaultWhId = searchParams.get("wh") || "";
  const [selWh, setSelWh] = useState(null);
  const [selType, setSelType] = useState(stockIssueTypeOptions[0]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [issuedTo, setIssuedTo] = useState("");
  const [reference, setReference] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([emptyLine()]);
  const prevWhIdRef = useRef("");

  const warehouseId = selWh?.id || "";

  // Only variants with stock in the selected warehouse (same as Stock Transfer).
  const variantSource = useDropdownSource(
    fetchVariantsDropdown,
    {
      options: showVariantDropdownOptions,
      page: showVariantDropdownPage,
      hasMore: showVariantDropdownHasMore,
      loading: showVariantDropdownLoading,
    },
    (v) => `${v.sku} — ${v.productName}${v.variantName ? ` (${v.variantName})` : ""}`,
    { warehouseId },
    !!warehouseId,
  );

  useEffect(() => {
    if (!selWh && defaultWhId && warehouseSource.data.length) {
      const match = warehouseSource.data.find((w) => w.id === defaultWhId);
      if (match) setSelWh(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseSource.data]);

  useEffect(() => {
    if (prevWhIdRef.current && prevWhIdRef.current !== warehouseId) {
      setItems([emptyLine()]);
    }
    prevWhIdRef.current = warehouseId;
  }, [warehouseId]);

  const productOptions = useMemo(
    () =>
      variantSource.data.map((v) => ({
        ...v,
        title: `${v.title} · ${t("available_qty", { defaultValue: "Qty" })}: ${v.availableQty ?? 0}`,
      })),
    [variantSource.data, t],
  );

  const updateLine = (index, patch) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const handleWarehouseChange = (w) => {
    setSelWh(w);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selWh) {
      toast.error(t("select_warehouses_required", { defaultValue: "Select a warehouse" }));
      return;
    }
    const to = String(issuedTo || "").trim();
    if (to.length < 2) {
      toast.error(t("issued_to_required"));
      return;
    }
    const ref = String(reference || "").trim();
    if (ref && ref.length < 2) {
      toast.error(t("reference_min", { defaultValue: "Reference must be at least 2 characters" }));
      return;
    }
    const by = String(issuedBy || "").trim();
    if (by && by.length < 2) {
      toast.error(t("issued_by_min", { defaultValue: "Issued by must be at least 2 characters" }));
      return;
    }
    if (!date) {
      toast.error(t("date_required", { defaultValue: "Date is required" }));
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    if (date > today) {
      toast.error(t("date_not_future", { defaultValue: "Date cannot be in the future" }));
      return;
    }

    const linesWithProduct = items.filter((it) => it.variant?.id);
    if (!linesWithProduct.length) {
      toast.error(t("select_item_required"));
      return;
    }
    if (linesWithProduct.some((it) => !it.batch?.id)) {
      toast.error(t("select_batch_required", { defaultValue: "Select a batch for each item" }));
      return;
    }
    if (linesWithProduct.some((it) => !(Number(it.qty) > 0))) {
      toast.error(t("qty_required", { defaultValue: "Each item quantity must be greater than 0" }));
      return;
    }

    for (let i = 0; i < linesWithProduct.length; i++) {
      const it = linesWithProduct[i];
      if (!it.variant?.id || !it.batch?.id) continue;
      const batchId = String(it.batch.id);
      let siblings = 0;
      linesWithProduct.forEach((l, idx) => {
        if (idx === i || String(l.batch?.id || "") !== batchId) return;
        siblings += Number(l.qty) || 0;
      });
      const available = Math.max(0, (Number(it.batch.remainingQty) || 0) - siblings);
      if (Number(it.qty) > available) {
        toast.error(
          t("batch_qty_exceeds", {
            product: it.variant?.title || it.variant?.sku || "",
            defaultValue: "Quantity exceeds available stock in the selected batch for {{product}}",
          }),
        );
        return;
      }
    }

    const resolvedItems = linesWithProduct.map((it) => ({
      variantId: it.variant.id,
      batchId: it.batch.id,
      qty: Number(it.qty),
    }));

    setSaving(true);
    try {
      const created = await dispatch(
        createStockIssue({
          warehouseId: selWh?.id,
          date,
          issueType: selType?.id,
          issuedTo: to,
          reference,
          notes,
          items: resolvedItems,
        }),
      ).unwrap();
      toast.success(t("issue_created"));
      if (created?.id) navigate(`/warehouse_issues/detail/${created.id}`);
      else navigate("/warehouse_issues");
    } catch (err) {
      toast.error(err || t("error", { ns: "translation", defaultValue: "Something went wrong" }));
    } finally {
      setSaving(false);
    }
  };

  if (!checkRoleAuth(add_warehouse_issue)) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          onClick={() => navigate("/warehouse_issues")}
          icon={FiArrowLeft}
          className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
          iconClass="!text-lg"
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">{t("new_issue")}</h1>
          <p className="text-slate-500 dark:text-white/50 text-sm mt-1">{t("issues_desc")}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-white/10 rounded-3xl border border-slate-200 dark:border-white/20 p-8 border-l-4 !border-l-rose-400"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-200 dark:border-white/10">
          {t("issue_details")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <SearchablePaginatedDropdown
            label={`${t("warehouse")} *`}
            labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
            data={warehouseSource.data}
            selected={selWh}
            setSelected={handleWarehouseChange}
            enableApiSearch
            onApiSearch={warehouseSource.onApiSearch}
            hasMore={warehouseSource.hasMore}
            onLoadMore={warehouseSource.onLoadMore}
            paginationLoading={warehouseSource.paginationLoading}
            loading={warehouseSource.loading}
            hideClear
            classes="!h-[46px] !rounded-lg"
          />
          <div>
            <FormInput
              label={`${t("date")} *`}
              labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
              name="issueDate"
              type="date"
              value={date}
              onValueChange={setDate}
              inputClass="!h-[46px] !rounded-lg"
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <SelectDropdown
            label={t("issue_type")}
            labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
            data={stockIssueTypeOptions}
            selected={selType}
            setSelected={setSelType}
            hideClear
            classes="!h-[46px] !rounded-lg"
          />
          <div>
            <FormInput
              label={`${t("issued_to")} *`}
              labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
              name="issuedTo"
              value={issuedTo}
              onValueChange={setIssuedTo}
              placeholder={t("issued_to_placeholder")}
              inputClass="!h-[46px] !rounded-lg"
              pattern={/[a-zA-Z0-9\s.'-]/}
              minLength={2}
              maxLength={100}
            />
          </div>
          <div>
            <FormInput
              label={t("reference")}
              labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
              name="reference"
              value={reference}
              onValueChange={setReference}
              placeholder={t("reference_placeholder")}
              inputClass="!h-[46px] !rounded-lg"
              pattern={/[A-Za-z0-9\-_/]/}
              minLength={2}
              maxLength={100}
            />
          </div>
          <div>
            <FormInput
              label={t("issued_by")}
              labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
              name="issuedBy"
              value={issuedBy}
              onValueChange={setIssuedBy}
              placeholder={t("issued_by_placeholder")}
              inputClass="!h-[46px] !rounded-lg"
              pattern={/[a-zA-Z0-9\s.'-]/}
              minLength={2}
              maxLength={100}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <FormInput
              label={t("notes")}
              labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
              name="notes"
              value={notes}
              onValueChange={setNotes}
              placeholder={t("notes_placeholder")}
              inputClass="!h-[46px] !rounded-lg"
              maxLength={500}
            />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-white/10">
          {t("items")}
        </h3>
        <div className="space-y-3 mb-6">
          {items.map((item, i) => (
            <IssueLineRow
              key={i}
              index={i}
              item={item}
              items={items}
              warehouseId={selWh?.id}
              productOptions={productOptions}
              variantSource={variantSource}
              onChange={(patch) => updateLine(i, patch)}
              onRemove={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
              canRemove={items.length > 1}
              t={t}
            />
          ))}
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, emptyLine()])}
            className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            <FiPlus size={14} />
            {t("add_item")}
          </button>
        </div>

        <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-slate-200 dark:border-white/20">
          <Button
            type="button"
            title={t("cancel", { ns: "translation" })}
            onClick={() => navigate("/warehouse_issues")}
            className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
          />
          <Button
            type="submit"
            title={t("create_issue")}
            btn="primary"
            disabled={saving}
            className="!rounded-md !bg-rose-500 hover:!bg-rose-600 !border-0"
          />
        </div>
      </form>
    </div>
  );
};

export default AddStockIssue;
