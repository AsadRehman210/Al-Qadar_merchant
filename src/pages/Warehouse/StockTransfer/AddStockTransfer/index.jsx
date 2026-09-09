import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SearchablePaginatedDropdown from "components/SearchablePaginatedDropdown";
import { SkeletonDetail } from "components/Skeleton";
import { erpGet, buildQuery } from "api/erpClient";
import { erpUrls } from "global/config";
import { fetchWarehousesDropdown, showWarehouseDropdownOptions, showWarehouseDropdownPage, showWarehouseDropdownHasMore, showWarehouseDropdownLoading, resetWarehouseDropdown } from "store/slices/warehouseSlice";
import { fetchVariantsDropdown, showVariantDropdownOptions, showVariantDropdownPage, showVariantDropdownHasMore, showVariantDropdownLoading, resetVariantDropdown } from "store/slices/variantSlice";
import {

  createStockTransfer,
  updateStockTransfer,
  fetchStockTransferById,
  clearCurrentStockTransfer,
  showCurrentStockTransfer,
  showCurrentStockTransferLoading,
} from "store/slices/stockTransferSlice";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { add_warehouse_transfer, edit_warehouse_transfer } = alqadar_role_ids;

const emptyLine = () => ({ variant: null, batch: null, qty: 1 });

const formatBatchTitle = (b) => {
  const exp = b.expiryDate ? String(b.expiryDate).slice(0, 10) : "—";
  const qty = Number(b.remainingQty) || 0;
  const label = b.batchNo || (b.id ? String(b.id).slice(-6) : "—");
  return `Exp ${exp} · Qty ${qty} · ${label}`;
};

/** Persist raw remainingQty from the API (siblings subtracted only for display). */
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

/** One transfer line: product + batch + qty. Batches load for the selected variant in the from-warehouse. */
const TransferLineRow = ({
  index,
  item,
  items,
  fromWarehouseId,
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
    if (!variantId || !fromWarehouseId) {
      setBatchOptionsRaw([]);
      return;
    }
    let cancelled = false;
    setBatchesLoading(true);
    const query = buildQuery({
      variantId,
      warehouseId: fromWarehouseId,
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
  }, [variantId, fromWarehouseId]);

  // Sibling lines sharing a batch reduce displayed remaining qty (same idea as Sale Invoice).
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

  // FEFO auto-select first batch with remainingQty > 0 when none chosen yet.
  useEffect(() => {
    if (!batchOptions.length || item.batch?.id) return;
    const key = `${variantId}:${fromWarehouseId}:${batchOptions.map((b) => b.id).join(",")}`;
    if (autoSelectedRef.current === key) return;
    const first = batchOptions.find((b) => (Number(b.remainingQty) || 0) > 0);
    if (!first) return;
    autoSelectedRef.current = key;
    const raw = batchOptionsRaw.find((b) => String(b.id) === String(first.id));
    onChange({ batch: toBatchSelection(raw || first) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchOptions, item.batch?.id, variantId, fromWarehouseId]);

  // After hydrate / reload, refresh raw remainingQty from API for the selected batch.
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

  const batchAvailable = selectedBatch
    ? Number(selectedBatch.remainingQty) || 0
    : null;
  const maxQty =
    batchAvailable != null
      ? batchAvailable
      : Number.isFinite(Number(item.variant?.availableQty))
        ? Number(item.variant.availableQty)
        : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
      <div className="md:col-span-2">
        <SearchablePaginatedDropdown
          key={`${fromWarehouseId || "none"}-${item.variant?.id || index}`}
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
          disabled={!fromWarehouseId}
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
          disabled={!variantId || !fromWarehouseId || batchesLoading}
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

const AddStockTransfer = () => {
  const { t, i18n } = useTranslation("warehouse");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    return () => {
      dispatch(resetWarehouseDropdown());
      dispatch(resetVariantDropdown());
    };
  }, [dispatch]);

  const existing = useSelector(showCurrentStockTransfer);
  const existingLoading = useSelector(showCurrentStockTransferLoading);

  const warehouseSource = useDropdownSource(
    fetchWarehousesDropdown,
    {
      options: showWarehouseDropdownOptions,
      page: showWarehouseDropdownPage,
      hasMore: showWarehouseDropdownHasMore,
      loading: showWarehouseDropdownLoading,
    },
    (w) => `${w.code} — ${w.name}`,
    { status: "Active" },
  );

  const defaultFromId = searchParams.get("from") || "";
  const [fromWh, setFromWh] = useState(null);
  const [toWh, setToWh] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const prevFromIdRef = useRef("");
  const skipResetRef = useRef(false);

  const fromWarehouseId = fromWh?.id || "";

  const variantSource = useDropdownSource(
    fetchVariantsDropdown,
    {
      options: showVariantDropdownOptions,
      page: showVariantDropdownPage,
      hasMore: showVariantDropdownHasMore,
      loading: showVariantDropdownLoading,
    },
    (v) => `${v.sku} — ${v.productName}${v.variantName ? ` (${v.variantName})` : ""}`,
    { warehouseId: fromWarehouseId },
    !!fromWarehouseId,
  );

  const productOptions = useMemo(
    () =>
      variantSource.data.map((v) => ({
        ...v,
        title: `${v.title} · ${t("available_qty", { defaultValue: "Qty" })}: ${v.availableQty ?? 0}`,
      })),
    [variantSource.data, t],
  );

  useEffect(() => {
    if (isEdit) {
      dispatch(fetchStockTransferById(id));
      return () => dispatch(clearCurrentStockTransfer());
    }
  }, [id, isEdit, dispatch]);

  useEffect(() => {
    if (!isEdit || !existing || hydrated) return;
    if (existing.status && existing.status !== "Pending") {
      toast.error(t("only_pending_editable", { defaultValue: "Only pending transfers can be edited." }));
      navigate(`/warehouse_transfers/detail/${id}`);
      return;
    }
    skipResetRef.current = true;
    setFromWh(
      existing.fromWarehouseId
        ? { id: existing.fromWarehouseId, title: existing.fromWarehouseName || existing.fromWarehouseId }
        : null,
    );
    setToWh(
      existing.toWarehouseId
        ? { id: existing.toWarehouseId, title: existing.toWarehouseName || existing.toWarehouseId }
        : null,
    );
    setDate(existing.date ? String(existing.date).slice(0, 10) : new Date().toISOString().split("T")[0]);
    setNotes(existing.notes || "");
    setItems(
      (existing.items || []).length
        ? existing.items.map((it) => {
            const qty = Number(it.qty) || 0;
            const batch = it.batchId
              ? toBatchSelection({
                  id: it.batchId,
                  batchNo: it.batchNo || null,
                  expiryDate: it.expiryDate || null,
                  remainingQty: qty,
                })
              : null;
            return {
              variant: {
                id: it.variantId,
                title: `${it.sku || ""} — ${it.variantName || it.variantId}`.replace(/^ — /, ""),
                sku: it.sku,
                variantName: it.variantName,
              },
              batch,
              qty: it.qty,
            };
          })
        : [emptyLine()],
    );
    prevFromIdRef.current = existing.fromWarehouseId || "";
    setHydrated(true);
  }, [existing, isEdit, hydrated, id, navigate, t]);

  useEffect(() => {
    if (isEdit || fromWh || !defaultFromId || !warehouseSource.data.length) return;
    const match = warehouseSource.data.find((w) => w.id === defaultFromId);
    if (match) setFromWh(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseSource.data]);

  // Changing source warehouse resets line items — products are scoped to that stock.
  useEffect(() => {
    if (skipResetRef.current) {
      skipResetRef.current = false;
      prevFromIdRef.current = fromWarehouseId;
      return;
    }
    if (prevFromIdRef.current && prevFromIdRef.current !== fromWarehouseId) {
      setItems([emptyLine()]);
    }
    prevFromIdRef.current = fromWarehouseId;
  }, [fromWarehouseId]);

  const addItem = () => setItems((prev) => [...prev, emptyLine()]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const patchItem = (i, patch) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const productLabel = (variant, fallbackId) =>
    variant?.title ||
    [variant?.productName, variant?.variantName].filter(Boolean).join(" — ") ||
    variant?.sku ||
    fallbackId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromWh || !toWh) {
      toast.error(t("select_warehouses_required", { defaultValue: "Select both warehouses" }));
      return;
    }
    if (fromWh?.id === toWh?.id) {
      toast.error(t("same_warehouse_error"));
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
      toast.error(t("select_item_required", { defaultValue: "Select at least one item" }));
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

    // Qty vs batch remaining, subtracting sibling lines on the same batchId.
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.variant?.id || !it.batch?.id) continue;
      const batchId = String(it.batch.id);
      let siblings = 0;
      items.forEach((l, idx) => {
        if (idx === i || String(l.batch?.id || "") !== batchId) return;
        siblings += Number(l.qty) || 0;
      });
      const available = Math.max(0, (Number(it.batch.remainingQty) || 0) - siblings);
      if (Number(it.qty) > available) {
        toast.error(
          t("batch_qty_exceeds", {
            product: productLabel(it.variant, it.variant.id),
            defaultValue: "Quantity exceeds available stock in the selected batch for {{product}}",
          }),
        );
        return;
      }
    }

    // Reject when total transfer qty for a product exceeds available stock
    // in the source warehouse (also enforced by the backend).
    const availableByVariant = new Map();
    for (const it of items) {
      if (!it.variant?.id) continue;
      const available = Number(it.variant.availableQty);
      if (Number.isFinite(available)) availableByVariant.set(it.variant.id, available);
    }
    const resolvedItems = linesWithProduct.map((it) => ({
      variantId: it.variant.id,
      batchId: it.batch.id,
      qty: Number(it.qty),
    }));
    const requestedByVariant = new Map();
    for (const it of resolvedItems) {
      requestedByVariant.set(it.variantId, (requestedByVariant.get(it.variantId) || 0) + it.qty);
    }
    for (const [variantId, requested] of requestedByVariant) {
      if (!availableByVariant.has(variantId)) continue;
      if (requested > availableByVariant.get(variantId)) {
        const sample = items.find((row) => row.variant?.id === variantId)?.variant;
        const label = productLabel(sample, variantId);
        const available = availableByVariant.get(variantId);
        toast.error(
          t("qty_exceeds_available_named", {
            product: label,
            available,
            requested,
            defaultValue: `Insufficient stock for {{product}}: available {{available}}, requested {{requested}}`,
          }),
        );
        return;
      }
    }

    const payload = {
      fromWarehouseId: fromWh.id,
      toWarehouseId: toWh.id,
      date,
      notes,
      items: resolvedItems,
    };
    setSubmitting(true);
    try {
      if (isEdit) {
        const updated = await dispatch(updateStockTransfer({ id, data: payload })).unwrap();
        toast.success(t("transfer_updated"));
        navigate(updated?.id ? `/warehouse_transfers/detail/${updated.id}` : "/warehouse_transfers");
      } else {
        const created = await dispatch(createStockTransfer(payload)).unwrap();
        toast.success(t("transfer_created"));
        navigate(created?.id ? `/warehouse_transfers/detail/${created.id}` : "/warehouse_transfers");
      }
    } catch (err) {
      toast.error(err || t("error", { ns: "translation", defaultValue: "Something went wrong" }));
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && existingLoading && !hydrated) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={6} />
      </div>
    );
  }

  if (isEdit && !checkRoleAuth(edit_warehouse_transfer)) return null;
  if (!isEdit && !checkRoleAuth(add_warehouse_transfer)) return null;

  return (
    <div className="relative min-h-[60vh]">
      <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
        <Button
          type="button"
          onClick={() => navigate("/warehouse_transfers")}
          icon={isRTL ? FiArrowRight : FiArrowLeft}
          className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
          iconClass="!text-lg"
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? t("edit_transfer") : t("new_transfer")}
          </h1>
          <p className="text-slate-500 dark:text-white/50 text-sm mt-1">{t("transfers_desc")}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-white/10 rounded-3xl border border-slate-200 dark:border-white/20 p-8 border-l-4 !border-l-[var(--color-teal-500)]"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-200 dark:border-white/10">
          {t("transfer_details")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SearchablePaginatedDropdown
            label={`${t("from_warehouse")} *`}
            labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
            data={warehouseSource.data}
            selected={fromWh}
            setSelected={setFromWh}
            enableApiSearch
            onApiSearch={warehouseSource.onApiSearch}
            hasMore={warehouseSource.hasMore}
            onLoadMore={warehouseSource.onLoadMore}
            paginationLoading={warehouseSource.paginationLoading}
            loading={warehouseSource.loading}
            hideClear
            classes="!h-[46px] !rounded-lg"
          />
          <SearchablePaginatedDropdown
            label={`${t("to_warehouse")} *`}
            labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
            data={warehouseSource.data}
            selected={toWh}
            setSelected={setToWh}
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
              label={`${t("transfer_date")} *`}
              labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
              name="transferDate"
              type="date"
              value={date}
              onValueChange={setDate}
              inputClass="!h-10 !rounded-lg"
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="md:col-span-3">
            <FormInput
              label={t("notes")}
              labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
              name="notes"
              value={notes}
              onValueChange={setNotes}
              placeholder={t("notes_placeholder")}
              inputClass="!h-10 !rounded-lg"
              maxLength={500}
            />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-white/10">
          {t("items")}
        </h3>
        {!fromWarehouseId && (
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
            {t("select_from_warehouse_first", {
              defaultValue: "Select the source warehouse first to load products in stock there.",
            })}
          </p>
        )}
        <div className="space-y-3 mb-6">
          {items.map((item, i) => (
            <TransferLineRow
              key={i}
              index={i}
              item={item}
              items={items}
              fromWarehouseId={fromWarehouseId}
              productOptions={productOptions}
              variantSource={variantSource}
              onChange={(patch) => patchItem(i, patch)}
              onRemove={() => removeItem(i)}
              canRemove={items.length > 1}
              t={t}
            />
          ))}
          <button
            type="button"
            onClick={addItem}
            disabled={!fromWarehouseId}
            className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium disabled:opacity-40 disabled:no-underline"
          >
            <FiPlus size={14} />
            {t("add_item")}
          </button>
        </div>

        <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-slate-200 dark:border-white/20">
          <Button
            type="button"
            title={t("cancel", { ns: "translation" })}
            onClick={() => navigate("/warehouse_transfers")}
            className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
          />
          <Button
            type="submit"
            title={isEdit ? t("update_transfer") : t("create_transfer")}
            btn="primary"
            disabled={submitting}
            className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
          />
        </div>
      </form>
    </div>
  );
};

export default AddStockTransfer;
