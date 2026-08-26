import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/react";
import { FiArrowLeft, FiEdit2, FiArchive, FiPackage, FiTruck, FiAlertCircle, FiPlus, FiSliders, FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import { fetchWarehouseById, showCurrentWarehouse, showCurrentWarehouseLoading, clearCurrentWarehouse } from "store/slices/warehouseSlice";
import { SkeletonDetail } from "components/Skeleton";
import {
  fetchStockTransfers,
  approveStockTransfer,
  showStockTransfers,
} from "store/slices/stockTransferSlice";
import { fetchStockIssues, showStockIssues } from "store/slices/stockIssueSlice";
import { fetchStock, showStock, fetchAdjustmentHistory, showAdjustmentHistory } from "store/slices/stockSlice";

const statusBadge = (s) => {
  if (s === "Completed" || s === "Received") return "bg-emerald-100 text-emerald-700";
  if (s === "Partial")  return "bg-amber-100 text-amber-700";
  if (s === "Pending")  return "bg-blue-100 text-blue-700";
  if (s === "Cancelled") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-500";
};

const stockStatusBadge = (qty, minQty) => {
  if (qty <= 0)        return "bg-red-100 text-red-700";
  if (qty <= minQty)   return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
};

const stockStatusLabel = (qty, minQty) => {
  if (qty <= 0)      return "Out of Stock";
  if (qty <= minQty) return "Low Stock";
  return "In Stock";
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-100 dark:border-white/10 last:border-0">
    <span className="text-sm text-slate-500 dark:text-white/50 sm:w-40 shrink-0">{label}</span>
    <span className="text-sm font-medium text-slate-900 dark:text-white">{value || "—"}</span>
  </div>
);

const SummaryCard = ({ label, value, color = "teal" }) => {
  const clr = {
    teal:   "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-500/10 dark:border-teal-500/20 dark:text-teal-300",
    blue:   "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300",
    amber:  "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300",
    red:    "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300",
  };
  return (
    <div className={`rounded-2xl border p-4 ${clr[color]}`}>
      <p className="text-xs mb-1 opacity-70">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

const WarehouseDetail = () => {
  const { t } = useTranslation("warehouse");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id }   = useParams();

  const warehouse    = useSelector(showCurrentWarehouse);
  const warehouseLoading = useSelector(showCurrentWarehouseLoading);
  const stockRows    = useSelector(showStock);
  const allTransfers = useSelector(showStockTransfers);
  const issues       = useSelector(showStockIssues);
  const adjustments  = useSelector(showAdjustmentHistory);

  const refresh = () => {
    dispatch(fetchWarehouseById(id));
    dispatch(fetchStock({ warehouseId: id, limit: 1000 }));
    dispatch(fetchStockTransfers());
    dispatch(fetchStockIssues({ warehouseId: id }));
    dispatch(fetchAdjustmentHistory({ warehouseId: id, limit: 1000 }));
  };

  useEffect(() => {
    refresh();
    return () => dispatch(clearCurrentWarehouse());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dispatch]);

  const stock = useMemo(() => (stockRows || []).filter((r) => r.totalQty > 0), [stockRows]);
  const transfers = useMemo(
    () => (allTransfers || []).filter((tr) => tr.fromWarehouseId === id || tr.toWarehouseId === id),
    [allTransfers, id]
  );

  if (warehouseLoading && !warehouse) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <FiAlertCircle size={48} className="text-red-400" />
        <p className="text-lg font-medium text-slate-600 dark:text-white/60">{t("not_found")}</p>
        <Button type="button" title="Back" onClick={() => navigate("/warehouse")} btn="primary" />
      </div>
    );
  }

  const totalQty    = stock.reduce((s, r) => s + r.totalQty, 0);
  const lowCount    = stock.filter((r) => r.totalQty > 0 && r.totalQty <= r.minQty).length;
  const outCount    = stock.filter((r) => r.totalQty <= 0).length;
  const pendingTxfr = transfers.filter((t) => t.status === "Pending").length;

  const handleApprove = async (tId) => {
    try {
      await dispatch(approveStockTransfer(tId)).unwrap();
      toast.success(t("transfer_approved"));
      refresh();
    } catch (err) {
      toast.error(err || t("error", { ns: "translation", defaultValue: "Something went wrong" }));
    }
  };

  const tabCls = ({ selected }) =>
    `px-4 py-2.5 text-sm font-medium rounded-xl transition-all outline-none flex items-center gap-2 ${
      selected ? "bg-[var(--color-teal-500)] text-white shadow-sm" : "text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10"
    }`;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <Button type="button" onClick={() => navigate("/warehouse")} icon={FiArrowLeft} className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 mt-1" iconClass="!text-lg" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">{warehouse.name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${warehouse.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{warehouse.status}</span>
          </div>
          <p className="text-slate-500 dark:text-white/50 text-sm">{warehouse.code} · {warehouse.location}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" title={t("new_transfer")} icon={FiTruck} onClick={() => navigate(`/warehouse_transfers/add?from=${id}`)} className="!rounded-md !bg-white dark:!bg-white/10 !border !border-slate-200 dark:!border-white/20 !text-slate-700 dark:!text-white" />
          <Button type="button" title={t("edit")} icon={FiEdit2} onClick={() => navigate(`/warehouse/edit/${id}`)} btn="primary" className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0" />
        </div>
      </div>

      {/* Tabs */}
      <TabGroup>
        <TabList className="flex flex-wrap gap-1 p-1.5 bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 mb-6">
          <Tab className={tabCls}><FiArchive size={14} />{t("tab_overview")}</Tab>
          <Tab className={tabCls}><FiPackage size={14} />{t("tab_stock")} <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{stock.length}</span></Tab>
          <Tab className={tabCls}><FiTruck size={14} />{t("tab_transfers")} {pendingTxfr > 0 && <span className="w-4 h-4 text-[10px] bg-amber-400 text-white rounded-full flex items-center justify-center">{pendingTxfr}</span>}</Tab>
          <Tab className={tabCls}><FiLogOut size={14} />{t("tab_issues")} <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{issues.length}</span></Tab>
          <Tab className={tabCls}><FiSliders size={14} />{t("tab_adjustments")} <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{adjustments.length}</span></Tab>
        </TabList>

        <TabPanels>
          {/* Overview */}
          <TabPanel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <SummaryCard label={t("total_sku")}      value={stock.length}                   color="teal" />
              <SummaryCard label={t("total_qty")}      value={totalQty.toLocaleString()}        color="blue" />
              <SummaryCard label={t("low_stock_items")} value={lowCount}                        color="amber" />
              <SummaryCard label={t("out_of_stock")}   value={outCount}                         color={outCount > 0 ? "red" : "teal"} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t("warehouse_info")}</h3>
                <InfoRow label={t("code")}     value={warehouse.code} />
                <InfoRow label={t("name")}     value={warehouse.name} />
                <InfoRow label={t("location")} value={warehouse.location} />
                <InfoRow label={t("manager")}  value={warehouse.manager} />
                <InfoRow label={t("capacity")} value={`${warehouse.capacity?.toLocaleString()} ${warehouse.unit}`} />
                <InfoRow label={t("status")}   value={warehouse.status} />
                {warehouse.description && <InfoRow label={t("description")} value={warehouse.description} />}
              </div>
              <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t("quick_actions")}</h3>
                <div className="space-y-3">
                  {[
                    { icon: FiTruck,       label: t("new_transfer"),  href: `/warehouse_transfers/add?from=${id}`, color: "text-blue-500" },
                    { icon: FiLogOut,      label: t("new_issue"),      href: `/warehouse_issues/add?wh=${id}`,     color: "text-rose-500" },
                    { icon: FiPlus,        label: t("adjust_stock"),   href: `/inventory/stock/adjust`,            color: "text-purple-500" },
                  ].map(({ icon: Icon, label, href, color }) => (
                    <button key={href} onClick={() => navigate(href)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-left transition-colors">
                      <Icon size={16} className={color} />
                      <span className="text-sm text-slate-700 dark:text-white">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabPanel>

          {/* Stock */}
          <TabPanel>
            <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">{t("stock_in_warehouse")}</h3>
                <button onClick={() => navigate("/inventory/stock")} className="text-sm text-teal-600 dark:text-teal-400 hover:underline">{t("full_stock_view")}</button>
              </div>
              {stock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400"><FiPackage size={36} /><p className="text-sm">{t("no_stock")}</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-medium text-slate-500 dark:text-white/40 border-b border-slate-100 dark:border-white/10">
                        <th className="px-6 py-3">SKU</th>
                        <th className="px-4 py-3">{t("product")}</th>
                        <th className="px-4 py-3">{t("variant")}</th>
                        <th className="px-4 py-3">{t("qty")}</th>
                        <th className="px-4 py-3">{t("min_qty")}</th>
                        <th className="px-4 py-3">{t("status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.map((s) => (
                        <tr key={s.variantId} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-6 py-3 font-mono text-xs text-slate-400">{s.sku}</td>
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                            <Link to={`/inventory/variants/detail/${s.variantId}`} className="text-teal-700 dark:text-teal-300 hover:underline">
                              {s.productName}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{s.variantName || "—"}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{s.totalQty.toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-500">{s.minQty}</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stockStatusBadge(s.totalQty, s.minQty)}`}>{stockStatusLabel(s.totalQty, s.minQty)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabPanel>

          {/* Transfers */}
          <TabPanel>
            <div className="flex justify-end mb-4">
              <button onClick={() => navigate(`/warehouse_transfers/add?from=${id}`)} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
                <FiPlus size={14} />{t("new_transfer")}
              </button>
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
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-12 text-slate-400">{t("no_transfers")}</td></tr>
                    ) : transfers.map((tr) => (
                      <tr key={tr.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="px-6 py-3 font-mono text-xs text-teal-700 dark:text-teal-300">{tr.transferNo}</td>
                        <td className="px-4 py-3 text-slate-500">{tr.date?.slice(0, 10)}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-white/80">{tr.fromWarehouseName}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-white/80">{tr.toWarehouseName}</td>
                        <td className="px-4 py-3 text-slate-500">{tr.items?.length} {t("items_count")}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(tr.status)}`}>{tr.status}</span></td>
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
          </TabPanel>

          {/* Stock Issues */}
          <TabPanel>
            <div className="flex justify-end mb-4">
              <button onClick={() => navigate(`/warehouse_issues/add?wh=${id}`)} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors">
                <FiPlus size={14} />{t("new_issue")}
              </button>
            </div>
            <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-slate-500 dark:text-white/40 border-b border-slate-100 dark:border-white/10">
                      <th className="px-6 py-3">{t("issue_no")}</th>
                      <th className="px-4 py-3">{t("date")}</th>
                      <th className="px-4 py-3">{t("issue_type")}</th>
                      <th className="px-4 py-3">{t("issued_to")}</th>
                      <th className="px-4 py-3">{t("items")}</th>
                      <th className="px-4 py-3">{t("issued_by")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-slate-400">{t("no_issues")}</td></tr>
                    ) : issues.map((i) => (
                      <tr key={i.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="px-6 py-3 font-mono text-xs text-rose-700 dark:text-rose-300">{i.issueNo}</td>
                        <td className="px-4 py-3 text-slate-500">{i.date?.slice(0, 10)}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-white/80">{i.issueType}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-white/70">{i.issuedTo}</td>
                        <td className="px-4 py-3 text-slate-500">{i.items?.length}</td>
                        <td className="px-4 py-3 text-slate-500">{i.issuedBy || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabPanel>

          {/* Stock Adjustments */}
          <TabPanel>
            <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">{t("tab_adjustments")}</h3>
                <button onClick={() => navigate("/inventory/stock/adjust")} className="text-sm text-teal-600 dark:text-teal-400 hover:underline">{t("adjust_stock")}</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-slate-500 dark:text-white/40 border-b border-slate-100 dark:border-white/10">
                      <th className="px-6 py-3">{t("date")}</th>
                      <th className="px-4 py-3">{t("product")}</th>
                      <th className="px-4 py-3">{t("qty")}</th>
                      <th className="px-4 py-3">Before</th>
                      <th className="px-4 py-3">After</th>
                      <th className="px-4 py-3">{t("notes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjustments.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-slate-400">{t("no_adjustments")}</td></tr>
                    ) : adjustments.map((a) => (
                      <tr key={a.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="px-6 py-3 text-slate-500">{a.createdAt?.slice(0, 10)}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900 dark:text-white">{a.variantName}</p>
                          <p className="text-xs font-mono text-slate-400">{a.sku}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${a.type === "add" ? "text-emerald-600" : a.type === "subtract" ? "text-rose-600" : "text-blue-600"}`}>
                            {a.type === "add" ? "+" : a.type === "subtract" ? "-" : "="}{a.qty}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 tabular-nums">{a.balanceBefore}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white tabular-nums">{a.balanceAfter}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={a.reason}>{a.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default WarehouseDetail;
