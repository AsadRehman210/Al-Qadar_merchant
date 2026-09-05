import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import FormInput from "components/FormInput";
import SearchablePaginatedDropdown from "components/SearchablePaginatedDropdown";
import { tableRows, stockTransferStatusFilterOptions } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import Block from "components/Skeleton";
import {
  fetchWarehousesDropdown,
  showWarehouseDropdownOptions,
  showWarehouseDropdownPage,
  showWarehouseDropdownHasMore,
  showWarehouseDropdownLoading,
} from "store/slices/warehouseSlice";
import {
  fetchVariantsDropdown,
  showVariantDropdownOptions,
  showVariantDropdownPage,
  showVariantDropdownHasMore,
  showVariantDropdownLoading,
} from "store/slices/variantSlice";
import {
  fetchStockTransfers,
  createStockTransfer,
  approveStockTransfer,
  showStockTransfers,
  showStockTransfersTotal,
  showStockTransfersLoading,
} from "store/slices/stockTransferSlice";

const statusBadge = (s) => {
  if (s === "Completed") return "bg-emerald-100 text-emerald-700";
  if (s === "Pending")   return "bg-amber-100 text-amber-700";
  if (s === "Cancelled") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-500";
};

// Small reusable wrapper around a `fetchXDropdown` thunk — backend-driven
// search + infinite scroll, matching SearchablePaginatedDropdown's contract.
const useDropdownSource = (fetchThunk, selectors, titleFn) => {
  const dispatch = useDispatch();
  const options = useSelector(selectors.options);
  const page = useSelector(selectors.page);
  const hasMore = useSelector(selectors.hasMore);
  const loading = useSelector(selectors.loading);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchThunk({ page: 1, search: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const onApiSearch = (value) => {
    setSearch(value);
    dispatch(fetchThunk({ page: 1, search: value }));
  };
  const onLoadMore = () => {
    if (hasMore && !loading) dispatch(fetchThunk({ page: page + 1, search }));
  };

  const data = options.map((o) => ({ ...o, title: titleFn(o) }));
  return { data, loading: loading && page === 1, paginationLoading: loading && page > 1, hasMore, onApiSearch, onLoadMore };
};

// ── Add Transfer Form ─────────────────────────────────────────────────────────
const AddTransferForm = ({ onSaved, onCancel }) => {
  const { t } = useTranslation("warehouse");
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const warehouseSource = useDropdownSource(
    fetchWarehousesDropdown,
    { options: showWarehouseDropdownOptions, page: showWarehouseDropdownPage, hasMore: showWarehouseDropdownHasMore, loading: showWarehouseDropdownLoading },
    (w) => `${w.code} — ${w.name}`
  );
  const variantSource = useDropdownSource(
    fetchVariantsDropdown,
    { options: showVariantDropdownOptions, page: showVariantDropdownPage, hasMore: showVariantDropdownHasMore, loading: showVariantDropdownLoading },
    (v) => `${v.sku} — ${v.productName}${v.variantName ? ` (${v.variantName})` : ""}`
  );

  const defaultFromId = searchParams.get("from") || "";
  const [fromWh, setFromWh] = useState(null);
  const [toWh,   setToWh]   = useState(null);
  const [date,   setDate]   = useState(new Date().toISOString().split("T")[0]);
  const [notes,  setNotes]  = useState("");
  const [items,  setItems]  = useState([{ variant: null, qty: 1 }]);

  useEffect(() => {
    if (!fromWh && defaultFromId && warehouseSource.data.length) {
      const match = warehouseSource.data.find((w) => w.id === defaultFromId);
      if (match) setFromWh(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseSource.data]);

  const addItem    = () => setItems((prev) => [...prev, { variant: null, qty: 1 }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromWh || !toWh) { toast.error(t("select_warehouses_required", { defaultValue: "Select both warehouses" })); return; }
    if (fromWh?.id === toWh?.id) { toast.error(t("same_warehouse_error")); return; }
    if (!date) { toast.error(t("date_required", { defaultValue: "Date is required" })); return; }
    const today = new Date().toISOString().split("T")[0];
    if (date > today) { toast.error(t("date_not_future", { defaultValue: "Date cannot be in the future" })); return; }
    const resolvedItems = items.filter((it) => it.variant?.id).map((it) => ({ variantId: it.variant.id, qty: Number(it.qty) }));
    if (!resolvedItems.length) { toast.error(t("select_item_required", { defaultValue: "Select at least one item" })); return; }
    if (resolvedItems.some((it) => !(it.qty > 0))) {
      toast.error(t("qty_required", { defaultValue: "Each item quantity must be greater than 0" }));
      return;
    }
    try {
      await dispatch(
        createStockTransfer({ fromWarehouseId: fromWh.id, toWarehouseId: toWh.id, date, notes, items: resolvedItems })
      ).unwrap();
      toast.success(t("transfer_created"));
      onSaved?.();
    } catch (err) {
      toast.error(err || t("error", { ns: "translation", defaultValue: "Something went wrong" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-white/10 rounded-3xl border border-slate-200 dark:border-white/20 p-8 border-l-4 !border-l-[var(--color-teal-500)]">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-200 dark:border-white/10">{t("transfer_details")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SearchablePaginatedDropdown
          label={`${t("from_warehouse")} *`}
          labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
          data={warehouseSource.data} selected={fromWh} setSelected={setFromWh}
          enableApiSearch onApiSearch={warehouseSource.onApiSearch} hasMore={warehouseSource.hasMore}
          onLoadMore={warehouseSource.onLoadMore} paginationLoading={warehouseSource.paginationLoading}
          loading={warehouseSource.loading} hideClear classes="!h-[46px] !rounded-lg"
        />
        <SearchablePaginatedDropdown
          label={`${t("to_warehouse")} *`}
          labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
          data={warehouseSource.data} selected={toWh} setSelected={setToWh}
          enableApiSearch onApiSearch={warehouseSource.onApiSearch} hasMore={warehouseSource.hasMore}
          onLoadMore={warehouseSource.onLoadMore} paginationLoading={warehouseSource.paginationLoading}
          loading={warehouseSource.loading} hideClear classes="!h-[46px] !rounded-lg"
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

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-white/10">{t("items")}</h3>
      <div className="space-y-3 mb-6">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
            <div className="md:col-span-3">
              <SearchablePaginatedDropdown
                label={t("product")}
                labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
                data={variantSource.data} selected={item.variant} setSelected={(v) => updateItem(i, "variant", v)}
                enableApiSearch onApiSearch={variantSource.onApiSearch} hasMore={variantSource.hasMore}
                onLoadMore={variantSource.onLoadMore} paginationLoading={variantSource.paginationLoading}
                loading={variantSource.loading} hideClear classes="!h-[40px] !rounded-lg"
              />
            </div>
            <div>
              <FormInput
                label={t("qty")}
                labelClass="text-xs font-medium text-slate-600 dark:text-white/60"
                name={`itemQty-${i}`}
                type="number"
                min={0.01}
                decimal
                decimalPlaces={2}
                maxLength={10}
                value={item.qty}
                onValueChange={(v) => updateItem(i, "qty", v)}
                inputClass="!h-10 !rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-100 disabled:opacity-30">
                <FiTrash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addItem} className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium">
          <FiPlus size={14} />{t("add_item")}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-slate-200 dark:border-white/20">
        <Button type="button" title={t("cancel", { ns: "translation" })} onClick={onCancel} className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
        <Button type="submit" title={t("create_transfer")} btn="primary" className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0" />
      </div>
    </form>
  );
};

const TRANSFER_STATUS_OPTS = stockTransferStatusFilterOptions;

// ── Transfers List Page ───────────────────────────────────────────────────────
const StockTransfer = () => {
  const { t }    = useTranslation("warehouse");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useListFilters("warehouse-stock-transfer", {
    page: 1,
    limitId: tableRows[0].id,
    search: "",
    statusId: TRANSFER_STATUS_OPTS[0]?.id ?? "",
  });
  const { page, search } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const selStatus = TRANSFER_STATUS_OPTS.find((o) => o.id === filters.statusId) || TRANSFER_STATUS_OPTS[0];
  const setPage = (v) => setFilters({ page: v });

  const transfers = useSelector(showStockTransfers);
  const totalRecords = useSelector(showStockTransfersTotal);
  const loading = useSelector(showStockTransfersLoading);

  const refresh = () =>
    dispatch(fetchStockTransfers({
      page,
      limit: selRows.id,
      search: search || undefined,
      status: selStatus?.id || undefined,
    }));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows.id, search, selStatus?.id]);

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handlePageClick = (event) => setPage(event.selected + 1);

  const handleApprove = async (id) => {
    try {
      await dispatch(approveStockTransfer(id)).unwrap();
      toast.success(t("transfer_approved"));
      refresh();
    } catch (err) {
      toast.error(err || t("error", { ns: "translation", defaultValue: "Something went wrong" }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button type="button" onClick={() => navigate("/warehouse")} icon={FiArrowLeft} className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90" iconClass="!text-lg" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">{t("stock_transfers")}</h1>
            <p className="text-slate-500 dark:text-white/50 text-sm mt-1">{t("transfers_desc")}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
          <FiPlus size={15} />{t("new_transfer")}
        </button>
      </div>

      {showForm && <AddTransferForm onSaved={() => { setShowForm(false); refresh(); }} onCancel={() => setShowForm(false)} />}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] max-w-xs">
          <SearchInput placeholder={`${t("search", { ns: "translation" })}...`} onSearch={(v) => setFilters({ search: v, page: 1 })} initialValue={search} />
        </div>
        <div className="w-full sm:w-48">
          <SelectDropdown data={TRANSFER_STATUS_OPTS} selected={selStatus} setSelected={(v) => setFilters({ statusId: (v || TRANSFER_STATUS_OPTS[0])?.id ?? "", page: 1 })} hideClear classes="!h-10 !rounded-lg" />
        </div>
      </div>

      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-500 dark:text-white/40 border-b border-slate-100 dark:border-white/10">
                <th className="px-6 py-3">{t("transfer_no")}</th>
                <th className="px-4 py-3">{t("date")}</th>
                <th className="px-4 py-3">{t("from")}</th>
                <th className="px-4 py-3">{t("to")}</th>
                <th className="px-4 py-3">{t("items")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3">{t("approved_by")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, r) => (
                  <tr key={r} className="border-b border-slate-50 dark:border-white/5">
                    {Array.from({ length: 8 }).map((__, c) => (
                      <td key={c} className="px-4 py-3"><Block className="h-4 w-full max-w-[120px]" /></td>
                    ))}
                  </tr>
                ))
              ) : transfers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">{t("no_issues", { defaultValue: "No records found" })}</td></tr>
              ) : transfers.map((tr) => (
                <tr key={tr.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-6 py-3 font-mono text-xs text-teal-700 dark:text-teal-300">{tr.transferNo}</td>
                  <td className="px-4 py-3 text-slate-500">{tr.date?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-white/80">{tr.fromWarehouseName}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-white/80">{tr.toWarehouseName}</td>
                  <td className="px-4 py-3 text-slate-500">{tr.items?.length}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(tr.status)}`}>{tr.status}</span></td>
                  <td className="px-4 py-3 text-slate-400">{tr.approvedBy || "—"}</td>
                  <td className="px-4 py-3">
                    {tr.status === "Pending" && (
                      <button onClick={() => handleApprove(tr.id)} className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium">{t("approve")}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-4 pt-2 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white">
        <div className="flex items-center gap-4">
          <SelectDropdown data={tableRows} selected={selRows} setSelected={(v) => setFilters({ limitId: v.id, page: 1 })} hideClear classes="!h-10 !rounded-lg" />
          <span className="whitespace-nowrap text-sm text-slate-500 dark:text-white/50">{t("per_page", { ns: "translation" })}</span>
        </div>
        <div className="pagination ltr:ml-auto rtl:mr-auto">
          <ReactPaginate
            breakLabel="..." nextLabel={<FaAngleRight />} previousLabel={<FaAngleLeft />}
            onPageChange={handlePageClick} pageRangeDisplayed={3} marginPagesDisplayed={1}
            pageCount={totalPages} forcePage={page - 1} renderOnZeroPageCount={null}
            containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default StockTransfer;
