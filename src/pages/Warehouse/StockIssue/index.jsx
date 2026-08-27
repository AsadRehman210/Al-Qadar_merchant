import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { FiArrowLeft, FiPlus, FiTrash2, FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import SearchablePaginatedDropdown from "components/SearchablePaginatedDropdown";
import { tableRows } from "global/constant";
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
  fetchStockIssues,
  createStockIssue,
  showStockIssues,
  showStockIssuesTotal,
  showStockIssuesLoading,
} from "store/slices/stockIssueSlice";

const ISSUE_TYPE_OPTS = [
  { id: "Internal Use", title: "Internal Use" },
  { id: "Sample", title: "Sample" },
  { id: "Damage", title: "Damage" },
  { id: "Other", title: "Other" },
];

const ISSUE_TYPE_FILTER_OPTS = [{ id: "", title: "All Types" }, ...ISSUE_TYPE_OPTS];

const typeBadge = (t) => {
  if (t === "Damage") return "bg-red-100 text-red-700";
  if (t === "Sample") return "bg-purple-100 text-purple-700";
  if (t === "Internal Use") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-500";
};

// Backend-driven search + infinite scroll, matching SearchablePaginatedDropdown's contract.
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

const AddIssueForm = ({ onSaved, onCancel }) => {
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

  const defaultWhId = searchParams.get("wh") || "";
  const [selWh,   setSelWh]   = useState(null);
  const [selType, setSelType] = useState(ISSUE_TYPE_OPTS[0]);
  const [date,    setDate]    = useState(new Date().toISOString().split("T")[0]);
  const [issuedTo, setIssuedTo] = useState("");
  const [reference, setReference] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [notes,   setNotes]   = useState("");
  const [items,   setItems]   = useState([{ variant: null, qty: 1 }]);

  useEffect(() => {
    if (!selWh && defaultWhId && warehouseSource.data.length) {
      const match = warehouseSource.data.find((w) => w.id === defaultWhId);
      if (match) setSelWh(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseSource.data]);

  const addItem    = () => setItems((prev) => [...prev, { variant: null, qty: 1 }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selWh) { toast.error(t("select_warehouses_required", { defaultValue: "Select a warehouse" })); return; }
    if (!issuedTo.trim()) { toast.error(t("issued_to_required")); return; }
    const resolvedItems = items.filter((it) => it.variant?.id).map((it) => ({ variantId: it.variant.id, qty: Number(it.qty) }));
    if (!resolvedItems.length) { toast.error(t("select_item_required")); return; }
    try {
      await dispatch(
        createStockIssue({
          warehouseId: selWh?.id,
          date,
          issueType: selType?.id,
          issuedTo,
          reference,
          notes,
          items: resolvedItems,
        })
      ).unwrap();
      toast.success(t("issue_created"));
      onSaved?.();
    } catch (err) {
      toast.error(err || t("error", { ns: "translation", defaultValue: "Something went wrong" }));
    }
  };

  const inputCls = "w-full h-[40px] px-3 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white";
  const labelCls = "text-xs font-medium text-slate-600 dark:text-white/60 mb-1 block";

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-white/10 rounded-3xl border border-slate-200 dark:border-white/20 p-8 border-l-4 !border-l-rose-400">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-200 dark:border-white/10">{t("issue_details")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <label className={labelCls}>{t("warehouse")} *</label>
          <SearchablePaginatedDropdown
            data={warehouseSource.data} selected={selWh} setSelected={setSelWh}
            enableApiSearch onApiSearch={warehouseSource.onApiSearch} hasMore={warehouseSource.hasMore}
            onLoadMore={warehouseSource.onLoadMore} paginationLoading={warehouseSource.paginationLoading}
            loading={warehouseSource.loading} hideClear classes="!h-[46px] !rounded-lg"
          />
        </div>
        <div>
          <label className={labelCls}>{t("date")} *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} h-[46px]`} required />
        </div>
        <div>
          <label className={labelCls}>{t("issue_type")}</label>
          <SelectDropdown data={ISSUE_TYPE_OPTS} selected={selType} setSelected={setSelType} hideClear classes="!h-[46px] !rounded-lg" />
        </div>
        <div>
          <label className={labelCls}>{t("issued_to")} *</label>
          <input type="text" value={issuedTo} onChange={(e) => setIssuedTo(e.target.value)} className={`${inputCls} h-[46px]`} placeholder={t("issued_to_placeholder")} required />
        </div>
        <div>
          <label className={labelCls}>{t("reference")}</label>
          <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className={`${inputCls} h-[46px]`} placeholder={t("reference_placeholder")} />
        </div>
        <div>
          <label className={labelCls}>{t("issued_by")}</label>
          <input type="text" value={issuedBy} onChange={(e) => setIssuedBy(e.target.value)} className={`${inputCls} h-[46px]`} placeholder={t("issued_by_placeholder")} />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <label className={labelCls}>{t("notes")}</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} h-[46px]`} placeholder={t("notes_placeholder")} />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-white/10">{t("items")}</h3>
      <div className="space-y-3 mb-6">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10">
            <div className="md:col-span-3">
              <label className={labelCls}>{t("product")}</label>
              <SearchablePaginatedDropdown
                data={variantSource.data} selected={item.variant} setSelected={(v) => updateItem(i, "variant", v)}
                enableApiSearch onApiSearch={variantSource.onApiSearch} hasMore={variantSource.hasMore}
                onLoadMore={variantSource.onLoadMore} paginationLoading={variantSource.paginationLoading}
                loading={variantSource.loading} hideClear classes="!h-[40px] !rounded-lg"
              />
            </div>
            <div>
              <label className={labelCls}>{t("qty")}</label>
              <input type="number" min={1} value={item.qty} onChange={(e) => updateItem(i, "qty", e.target.value)} className={inputCls} />
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
        <Button type="submit" title={t("create_issue")} btn="primary" className="!rounded-md !bg-rose-500 hover:!bg-rose-600 !border-0" />
      </div>
    </form>
  );
};

const StockIssue = () => {
  const { t }    = useTranslation("warehouse");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useListFilters("warehouse-stock-issue", {
    page: 1,
    limitId: tableRows[0].id,
    search: "",
    typeId: ISSUE_TYPE_FILTER_OPTS[0].id,
  });
  const { page, search } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const selType = ISSUE_TYPE_FILTER_OPTS.find((o) => o.id === filters.typeId) || ISSUE_TYPE_FILTER_OPTS[0];
  const setPage = (v) => setFilters({ page: v });

  const issues = useSelector(showStockIssues);
  const totalRecords = useSelector(showStockIssuesTotal);
  const loading = useSelector(showStockIssuesLoading);

  const refresh = () =>
    dispatch(fetchStockIssues({
      page,
      limit: selRows.id,
      search: search || undefined,
      issueType: selType?.id || undefined,
    }));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows.id, search, selType.id]);

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handlePageClick = (event) => setPage(event.selected + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button type="button" onClick={() => navigate("/warehouse")} icon={FiArrowLeft} className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90" iconClass="!text-lg" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">{t("stock_issues")}</h1>
            <p className="text-slate-500 dark:text-white/50 text-sm mt-1">{t("issues_desc")}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 h-10 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors">
          <FiPlus size={15} />{t("new_issue")}
        </button>
      </div>

      {showForm && <AddIssueForm onSaved={() => { setShowForm(false); setPage(1); refresh(); }} onCancel={() => setShowForm(false)} />}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] max-w-xs">
          <SearchInput placeholder={`${t("search", { ns: "translation" })}...`} onSearch={(v) => setFilters({ search: v, page: 1 })} initialValue={search} />
        </div>
        <div className="w-full sm:w-48">
          <SelectDropdown data={ISSUE_TYPE_FILTER_OPTS} selected={selType} setSelected={(v) => setFilters({ typeId: (v || ISSUE_TYPE_FILTER_OPTS[0]).id, page: 1 })} hideClear classes="!h-10 !rounded-lg" />
        </div>
      </div>

      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-500 dark:text-white/40 border-b border-slate-100 dark:border-white/10">
                <th className="px-6 py-3">{t("issue_no")}</th>
                <th className="px-4 py-3">{t("date")}</th>
                <th className="px-4 py-3">{t("warehouse")}</th>
                <th className="px-4 py-3">{t("issue_type")}</th>
                <th className="px-4 py-3">{t("issued_to")}</th>
                <th className="px-4 py-3">{t("items")}</th>
                <th className="px-4 py-3">{t("issued_by")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, r) => (
                  <tr key={r} className="border-b border-slate-50 dark:border-white/5">
                    {Array.from({ length: 7 }).map((__, c) => (
                      <td key={c} className="px-4 py-3"><Block className="h-4 w-full max-w-[120px]" /></td>
                    ))}
                  </tr>
                ))
              ) : issues.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400"><FiLogOut size={32} className="mx-auto mb-2 opacity-40" />{t("no_issues")}</td></tr>
              ) : issues.map((i) => (
                <tr key={i.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-6 py-3 font-mono text-xs text-rose-700 dark:text-rose-300">{i.issueNo}</td>
                  <td className="px-4 py-3 text-slate-500">{i.date?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-white/80">{i.warehouseName}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadge(i.issueType)}`}>{i.issueType}</span></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-white/70">{i.issuedTo}</td>
                  <td className="px-4 py-3 text-slate-500">{i.items?.length}</td>
                  <td className="px-4 py-3 text-slate-500">{i.issuedBy || "—"}</td>
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

export default StockIssue;
