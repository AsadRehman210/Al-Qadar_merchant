import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/react";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import {
  FiUsers, FiPackage, FiTrendingUp, FiDollarSign,
  FiBarChart2, FiClock,
} from "react-icons/fi";
import {
  fetchHrOverview, showHrOverview, showHrOverviewLoading,
  fetchInventoryOverview, showInventoryOverview,
  fetchExpiryBuckets, showExpiryBuckets, showExpiryBucketsLoading,
  fetchSalesOverview, showSalesOverview,
  fetchProfitTrend, showProfitTrend,
  fetchTopProducts, showTopProducts,
} from "store/slices/analyticsSlice";
import { fetchStock, showStock, showStockLoading } from "store/slices/stockSlice";
import { fetchReceivables, showReceivables, showReceivablesLoading } from "store/slices/saleInvoiceSlice";
import { fetchPayables, showPayables, showPayablesLoading } from "store/slices/purchaseInvoiceSlice";
import { fetchExpiryBucketDetail } from "global/drilldownFetchers";
import { tableRows } from "global/constant";
import { SkeletonTable } from "components/Skeleton";
import EmptyState from "components/EmptyState";
import SelectDropdown from "components/SelectDropdown";
import { useListFilters } from "hooks/useListFilters";

// ── Shared helpers ────────────────────────────────────────────────────────────
const inputCls = "h-9 px-3 rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white";
const sectionTitle = "font-semibold text-slate-900 dark:text-white text-base mb-4";
const TH = ({ children }) => <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-white/40">{children}</th>;
const TD = ({ children, className = "" }) => <td className={`px-4 py-3 text-sm text-slate-700 dark:text-white/80 ${className}`}>{children}</td>;
const fmtMoney = (n) => `${(parseFloat(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} SAR`;
const fmtDate = (v) => (v ? String(v).slice(0, 10) : "—");

const SummaryCard = ({ label, value, sub, color = "teal" }) => {
  const clr = {
    teal: "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-500/10 dark:border-teal-500/20 dark:text-teal-300",
    blue: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300",
    amber:"bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300",
    red:  "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300",
    purple:"bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-300",
    emerald:"bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300",
  };
  return (
    <div className={`rounded-2xl border p-4 ${clr[color]}`}>
      <p className="text-xs mb-1 opacity-70">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
};

// ── HR Reports Tab ────────────────────────────────────────────────────────────
const HRReport = () => {
  const dispatch = useDispatch();
  const hr = useSelector(showHrOverview);
  const loading = useSelector(showHrOverviewLoading);

  useEffect(() => {
    dispatch(fetchHrOverview());
  }, [dispatch]);

  if (loading && !hr) return <p className="text-center text-slate-400 py-10">Loading…</p>;
  if (!hr) return null;

  const maxDept = Math.max(1, ...hr.byDepartment.map((d) => d.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard label="Total Employees" value={hr.totalEmployees} color="teal" />
        <SummaryCard label="Active" value={hr.activeEmployees} color="blue" />
        <SummaryCard label="On Probation" value={hr.onProbation} color="amber" />
        <SummaryCard label="Present Today" value={hr.presentToday} color="emerald" />
        <SummaryCard label="Absent Today" value={hr.absentToday} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
          <h4 className={sectionTitle}>Headcount by Department</h4>
          <div className="space-y-3">
            {hr.byDepartment.map((d) => (
              <div key={d.departmentId} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-white/70 w-36 shrink-0 truncate">{d.departmentName}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400 rounded-full" style={{ width: `${Math.round((d.count / maxDept) * 100)}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white w-8 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
          <h4 className={sectionTitle}>Employment Status</h4>
          <div className="space-y-3">
            {hr.byStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-white/70 w-36 shrink-0 capitalize">{s.status}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.round((s.count / hr.totalEmployees) * 100)}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white w-8 text-right">{s.count}</span>
              </div>
            ))}
          </div>
          <h4 className={`${sectionTitle} mt-6`}>Employment Type</h4>
          <div className="space-y-3">
            {hr.byEmploymentType.map((s) => (
              <div key={s.type} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-white/70 w-36 shrink-0 capitalize">{s.type}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: `${Math.round((s.count / hr.totalEmployees) * 100)}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white w-8 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Inventory Reports Tab ─────────────────────────────────────────────────────
const InventoryReport = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const overview = useSelector(showInventoryOverview);
  const stockRows = useSelector(showStock);
  const stockLoading = useSelector(showStockLoading);

  useEffect(() => {
    dispatch(fetchInventoryOverview());
    dispatch(fetchStock({ limit: 500 }));
  }, [dispatch]);

  const lowStock = useMemo(() => stockRows.filter((r) => r.status === "low_stock"), [stockRows]);
  const outStock = useMemo(() => stockRows.filter((r) => r.status === "out_of_stock"), [stockRows]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total SKUs" value={overview?.totalSkus ?? "…"} color="teal" />
        <SummaryCard label="Total Units" value={(overview?.totalUnits ?? 0).toLocaleString()} color="blue" />
        <SummaryCard label="Stock Value" value={fmtMoney(overview?.totalStockValue)} color="purple" sub="at cost price" />
        <SummaryCard label="Low / Out" value={`${overview?.lowStockCount ?? 0} / ${overview?.outOfStockCount ?? 0}`} color={(overview?.outOfStockCount || 0) > 0 ? "red" : "amber"} />
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5">
          <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-3">⚠ Low Stock Items ({lowStock.length})</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-amber-200"><TH>SKU</TH><TH>Product</TH><TH>Qty</TH><TH>Min Qty</TH></tr></thead>
              <tbody>
                {lowStock.map((r) => (
                  <tr key={r.variantId} className="border-b border-amber-100 cursor-pointer hover:bg-amber-100/50" onClick={() => navigate(`/inventory/stock/detail/${r.variantId}`)}>
                    <td className="px-4 py-2 font-mono text-xs text-amber-600">{r.sku}</td>
                    <TD>{r.productName}</TD>
                    <td className="px-4 py-2 font-bold text-amber-700">{r.totalQty}</td>
                    <TD>{r.minQty}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10"><h4 className="font-semibold text-slate-900 dark:text-white text-sm">Stock Valuation Report</h4></div>
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-slate-800">
              <tr className="border-b border-slate-100 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-white/40">
                <TH>SKU</TH><TH>Product</TH><TH>Variant</TH><TH>Qty</TH><TH>Status</TH>
              </tr>
            </thead>
            <tbody>
              {stockLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
              ) : stockRows.map((r) => (
                <tr key={r.variantId} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" onClick={() => navigate(`/inventory/stock/detail/${r.variantId}`)}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.sku}</td>
                  <TD className="font-medium">{r.productName}</TD>
                  <TD className="text-slate-400">{r.variantName || "—"}</TD>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.totalQty}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === "out_of_stock" ? "bg-red-100 text-red-700" : r.status === "low_stock" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {r.status === "out_of_stock" ? "Out" : r.status === "low_stock" ? "Low" : "OK"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {outStock.length > 0 && <p className="text-xs text-slate-400">{outStock.length} SKU(s) currently out of stock.</p>}
    </div>
  );
};

// ── Profit & Loss Report Tab ──────────────────────────────────────────────────
// Revenue/profit are read straight off the real Sale Invoice lines
// (analytics/sales/overview and /top-products, aggregated server-side) —
// nothing is re-derived client-side, and both numbers are the exact same
// ones Finance's own P&L page would show for the same range.
const ProfitLossReport = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sales = useSelector(showSalesOverview);
  const trend = useSelector(showProfitTrend);
  const topProducts = useSelector(showTopProducts);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    dispatch(fetchSalesOverview({ fromDate: fromDate || undefined, toDate: toDate || undefined }));
  }, [dispatch, fromDate, toDate]);

  useEffect(() => {
    dispatch(fetchProfitTrend({ months: 12 }));
    dispatch(fetchTopProducts({ limit: 10 }));
  }, [dispatch]);

  const grossMargin = sales?.totalRevenue > 0 ? (sales.totalProfit / sales.totalRevenue) * 100 : 0;
  const maxQty = Math.max(1, ...topProducts.map((p) => p.qtySold));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-white/50 block mb-1">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-white/50 block mb-1">To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputCls} />
        </div>
        {(fromDate || toDate) && (
          <button onClick={() => { setFromDate(""); setToDate(""); }} className="h-9 px-4 rounded-xl bg-slate-100 dark:bg-white/10 text-sm font-medium text-slate-600 dark:text-white/70 hover:bg-slate-200">
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Revenue" value={fmtMoney(sales?.totalRevenue)} color="teal" />
        <SummaryCard label="Invoices" value={sales?.totalInvoices ?? 0} color="blue" />
        <SummaryCard label="Gross Profit" value={fmtMoney(sales?.totalProfit)} color={(sales?.totalProfit || 0) >= 0 ? "teal" : "red"} />
        <SummaryCard label="Gross Margin" value={`${grossMargin.toFixed(1)}%`} color={grossMargin >= 0 ? "blue" : "red"} />
      </div>

      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
        <h4 className={sectionTitle}>Monthly Revenue vs Profit</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead><tr className="border-b border-slate-100 dark:border-white/10"><TH>Month</TH><TH>Revenue</TH><TH>Expenses</TH><TH>Profit</TH></tr></thead>
            <tbody>
              {trend.map((m) => (
                <tr key={m.month} className="border-b border-slate-50 dark:border-white/5">
                  <TD className="font-medium">{m.month}</TD>
                  <td className="px-4 py-3 tabular-nums">{fmtMoney(m.revenue)}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-500">{fmtMoney(m.expenses)}</td>
                  <td className={`px-4 py-3 tabular-nums font-semibold ${m.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmtMoney(m.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
        <h4 className={sectionTitle}>Top Products by Quantity Sold</h4>
        {!topProducts.length ? (
          <p className="text-slate-400 text-sm py-6 text-center">No sales in range.</p>
        ) : (
          <div className="space-y-3">
            {topProducts.map((p) => (
              <button key={p.variantId} type="button" onClick={() => navigate(`/inventory/stock/detail/${p.variantId}`)}
                className="w-full flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl p-2 -m-2">
                <span className="text-sm text-slate-600 dark:text-white/70 w-40 shrink-0 truncate">{p.productName}</span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-400 rounded-full" style={{ width: `${Math.round((p.qtySold / maxQty) * 100)}%` }} />
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white w-16 text-right shrink-0">{p.qtySold}</span>
                <span className="text-sm text-emerald-600 w-24 text-right shrink-0">{fmtMoney(p.profit)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── AR/AP Aging Report Tab ────────────────────────────────────────────────────
// Aged from each invoice's own date — this app has no separate payment-terms
// due-date field yet, so "days outstanding since invoice date" is the real
// number available, rather than fabricating a due date that doesn't exist.
const ageBucket = (days) => (days <= 30 ? "0–30 days" : days <= 60 ? "31–60 days" : days <= 90 ? "61–90 days" : "90+ days");

const AgingReport = () => {
  const dispatch = useDispatch();
  const receivables = useSelector(showReceivables);
  const receivablesLoading = useSelector(showReceivablesLoading);
  const payables = useSelector(showPayables);
  const payablesLoading = useSelector(showPayablesLoading);
  const [typeFilter, setTypeFilter] = useState("AR");

  useEffect(() => {
    dispatch(fetchReceivables({ limit: 500 }));
    dispatch(fetchPayables({ limit: 500 }));
  }, [dispatch]);

  const rows = typeFilter === "AR" ? receivables : payables;
  const loading = typeFilter === "AR" ? receivablesLoading : payablesLoading;

  const ageRows = useMemo(() => {
    const now = new Date();
    return rows
      .filter((r) => (r.balanceDue || 0) > 0)
      .map((r) => {
        const days = Math.max(0, Math.floor((now - new Date(r.date)) / 86400000));
        return { ...r, days, bucket: ageBucket(days) };
      });
  }, [rows]);

  const buckets = ["0–30 days", "31–60 days", "61–90 days", "90+ days"];
  const bucketTotals = buckets.map((b) => ({
    label: b,
    total: ageRows.filter((r) => r.bucket === b).reduce((s, r) => s + (r.balanceDue || 0), 0),
    count: ageRows.filter((r) => r.bucket === b).length,
  }));
  const grandTotal = ageRows.reduce((s, r) => s + (r.balanceDue || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <h4 className="font-semibold text-slate-900 dark:text-white">Aging Report</h4>
        <div className="flex rounded-xl border border-slate-200 dark:border-white/20 overflow-hidden">
          {["AR","AP"].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-4 py-1.5 text-sm font-medium transition-colors ${typeFilter === t ? "bg-[var(--color-teal-500)] text-white" : "bg-white dark:bg-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-50"}`}>
              {t === "AR" ? "Accounts Receivable" : "Accounts Payable"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {bucketTotals.map(({ label, total, count }) => (
          <SummaryCard key={label} label={label} value={fmtMoney(total)} sub={`${count} invoices`} color={label === "90+ days" ? "red" : label === "0–30 days" ? "teal" : "amber"} />
        ))}
      </div>

      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{typeFilter === "AR" ? "Outstanding Receivables" : "Outstanding Payables"}</h4>
          <span className="text-sm font-bold text-teal-600">Total: {fmtMoney(grandTotal)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-white/40">
                <TH>Invoice</TH><TH>{typeFilter === "AR" ? "Customer" : "Supplier"}</TH><TH>Amount Due</TH><TH>Invoice Date</TH><TH>Days Outstanding</TH><TH>Aging Bucket</TH>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
              ) : !ageRows.length ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Nothing outstanding.</td></tr>
              ) : ageRows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                  <TD className="font-mono text-xs text-blue-600">{r.invoiceNumber}</TD>
                  <TD className="font-medium">{typeFilter === "AR" ? r.customerName : r.supplierName}</TD>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{fmtMoney(r.balanceDue)}</td>
                  <TD className="text-slate-400">{fmtDate(r.date)}</TD>
                  <TD className={r.days > 60 ? "text-red-600 font-semibold" : "text-slate-500"}>{r.days} days</TD>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.bucket === "0–30 days" ? "bg-emerald-100 text-emerald-700" : r.bucket === "90+ days" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{r.bucket}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Stock Expiry Report Tab ────────────────────────────────────────────────────
const EXPIRY_BUCKET_ORDER = ["expired", "within_1_month", "within_6_months", "within_1_year"];

const ExpiryReport = ({ initialBucket }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const summaryLoading = useSelector(showExpiryBucketsLoading);
  const summary = useSelector(showExpiryBuckets);

  const [filters, setFilters] = useListFilters("reports-expiry", {
    bucket: initialBucket && EXPIRY_BUCKET_ORDER.includes(initialBucket) ? initialBucket : "expired",
    page: 1,
    limitId: tableRows[0].id,
  });
  const limit = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | pending | success | error

  useEffect(() => {
    dispatch(fetchExpiryBuckets());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    setStatus("pending");
    fetchExpiryBucketDetail(filters.bucket)({ page: filters.page, limit: limit.id })
      .then((res) => {
        if (cancelled) return;
        setRows(res.result || []);
        setTotal(res.total_records || 0);
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setTotal(0);
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filters.bucket, filters.page, limit.id]);

  const totalPages = Math.max(1, Math.ceil(total / limit.id));
  const bucketSummaryByKey = new Map((summary?.buckets || []).map((b) => [b.key, b]));
  const currentSummary = bucketSummaryByKey.get(filters.bucket);

  return (
    <div className="space-y-6">
      {summary?.asOf && <p className="text-xs text-slate-400">As of {summary.asOf}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(summary?.buckets || []).map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => setFilters({ bucket: b.key, page: 1 })}
            className={`text-left rounded-2xl border p-4 transition-all ${filters.bucket === b.key ? "ring-2 ring-teal-500" : ""} ${
              b.key === "expired" ? "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20" :
              b.key === "within_1_month" ? "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20" :
              "bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10"
            }`}
          >
            <p className="text-xs text-slate-500 dark:text-white/60 mb-1">{b.label}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{summaryLoading ? "…" : b.count}</p>
            <p className="text-xs text-slate-400 dark:text-white/40">{b.totalQty} units</p>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{currentSummary?.label}</h4>
        </div>

        {status === "pending" ? (
          <div className="p-6">
            <SkeletonTable rows={limit.id > 10 ? 8 : limit.id} columns={7} />
          </div>
        ) : status === "error" || !rows.length ? (
          <EmptyState />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-white/40">
                    <TH>SKU</TH><TH>Product</TH><TH>Variant</TH><TH>Warehouse</TH><TH>Expiry Date</TH><TH>Days Left</TH><TH>Qty Remaining</TH>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.batchId} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" onClick={() => navigate(`/inventory/stock/detail/${r.variantId}`)}>
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">{r.sku}</td>
                      <TD className="font-medium">{r.productName}</TD>
                      <TD className="text-slate-400">{r.variantName || "—"}</TD>
                      <TD className="text-slate-500">{r.warehouseName || "—"}</TD>
                      <TD>{r.expiryDate}</TD>
                      <td className={`px-4 py-3 font-semibold ${r.daysLeft < 0 ? "text-red-600" : r.daysLeft <= 30 ? "text-amber-600" : "text-slate-600"}`}>
                        {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)}d overdue` : `${r.daysLeft}d`}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.remainingQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center flex-wrap gap-4 px-6 py-4 border-t border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <SelectDropdown
                  data={tableRows}
                  selected={limit}
                  setSelected={(v) => setFilters({ limitId: v.id, page: 1 })}
                  hideClear
                  classes="!h-9 !rounded-lg !min-w-[80px]"
                />
                <span className="text-xs text-slate-500 dark:text-white/50 whitespace-nowrap">per page</span>
              </div>
              <div className="pagination ltr:ml-auto rtl:mr-auto">
                <ReactPaginate
                  breakLabel="..."
                  nextLabel={<FaAngleRight />}
                  previousLabel={<FaAngleLeft />}
                  onPageChange={(e) => setFilters({ page: e.selected + 1 })}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={1}
                  pageCount={totalPages}
                  forcePage={filters.page - 1}
                  renderOnZeroPageCount={null}
                  containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main Reports Hub ──────────────────────────────────────────────────────────
const TAB_KEYS = ["hr", "inventory", "pnl", "aging", "expiry"];

const Reports = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTabKey = searchParams.get("tab");
  const initialBucket = searchParams.get("bucket");
  const initialIndex = Math.max(0, TAB_KEYS.indexOf(initialTabKey));
  const [tabIndex, setTabIndex] = useState(initialIndex);

  const tabCls = ({ selected }) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all outline-none ${selected ? "bg-[var(--color-teal-500)] text-white shadow-sm" : "text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-slate-500 dark:text-white/50 text-sm mt-1">HR, Inventory, Profit &amp; Loss, Expiry and AR/AP Aging — all live data</p>
        </div>
        <button onClick={() => navigate("/finance/reports")} className="flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-50">
          <FiDollarSign size={14} />Finance Reports
        </button>
      </div>

      <TabGroup selectedIndex={tabIndex} onChange={setTabIndex}>
        <TabList className="flex flex-wrap gap-1 p-1.5 bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
          <Tab className={tabCls}><FiUsers size={14} />HR Reports</Tab>
          <Tab className={tabCls}><FiPackage size={14} />Inventory Reports</Tab>
          <Tab className={tabCls}><FiTrendingUp size={14} />Profit &amp; Loss</Tab>
          <Tab className={tabCls}><FiBarChart2 size={14} />AR / AP Aging</Tab>
          <Tab className={tabCls}><FiClock size={14} />Stock Expiry</Tab>
        </TabList>
        <TabPanels className="mt-6">
          <TabPanel><HRReport /></TabPanel>
          <TabPanel><InventoryReport /></TabPanel>
          <TabPanel><ProfitLossReport /></TabPanel>
          <TabPanel><AgingReport /></TabPanel>
          <TabPanel><ExpiryReport initialBucket={initialBucket} /></TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default Reports;
