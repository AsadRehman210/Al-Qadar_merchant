import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Helmet } from "react-helmet";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { useSelector, useDispatch } from "react-redux";
import { showUserStatus } from "store/slices/authSlice";
import { showUserData } from "store/slices/uniqueSlice";
import { usePageReset } from "hooks/usePageReset";
import AnalyticsDrilldownModal from "components/AnalyticsDrilldownModal";
import {
  employeeColumns,
  fetchProductsByCategory,
  productColumns,
  productRowLink,
  expiryColumns,
  fetchExpiryBucketDetail,
  expiryRowLink,
  topProductColumns,
  fetchTopProductsPaginated,
  fetchEmployeesByDepartment,
  employeeRowLink,
} from "global/drilldownFetchers";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FiUsers, FiUserCheck, FiUserX, FiPackage, FiLayers, FiAlertTriangle,
  FiTrendingUp, FiDollarSign,
} from "react-icons/fi";
import {
  fetchHrOverview,
  fetchAttendanceTrend,
  fetchInventoryOverview,
  fetchExpiryBuckets,
  fetchSalesOverview,
  fetchProfitTrend,
  fetchTopProducts,
  showHrOverview,
  showHrOverviewLoading,
  showAttendanceTrend,
  showAttendanceTrendLoading,
  showInventoryOverview,
  showInventoryOverviewLoading,
  showExpiryBuckets,
  showExpiryBucketsLoading,
  showSalesOverview,
  showSalesOverviewLoading,
  showProfitTrend,
  showProfitTrendLoading,
  showTopProducts,
  showTopProductsLoading,
} from "store/slices/analyticsSlice";
import { SkeletonCards, SkeletonChart, SkeletonList } from "components/Skeleton";

const { view_dashboard } = alqadar_role_ids;

const COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#22c55e", "#06b6d4"];

const fmtNum = (n) => (parseFloat(n) || 0).toLocaleString();
const fmtMoney = (n) => `${(parseFloat(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} SAR`;

const KpiCard = ({ icon: Icon, label, value, sub, color = "teal", onClick }) => {
  const clr = {
    teal: "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-500/10 dark:border-teal-500/20 dark:text-teal-300",
    blue: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300",
    amber: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300",
    red: "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300",
    purple: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-300",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300",
  };
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left w-full ${clr[color]} ${onClick ? "hover:-translate-y-0.5 transition-transform cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs opacity-70">{label}</p>
        {Icon && <Icon className="h-4 w-4 opacity-60" />}
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </Comp>
  );
};

const Panel = ({ title, action, children }) => (
  <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-slate-900 dark:text-white text-base">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const Dashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isViewDashboard = checkRoleAuth(view_dashboard);
  const userStatus = useSelector(showUserStatus);
  const userData = useSelector(showUserData);
  usePageReset();
  const [drilldown, setDrilldown] = useState(null);

  const hr = useSelector(showHrOverview);
  const hrLoading = useSelector(showHrOverviewLoading);
  const attendanceTrend = useSelector(showAttendanceTrend);
  const attendanceTrendLoading = useSelector(showAttendanceTrendLoading);
  const inventory = useSelector(showInventoryOverview);
  const inventoryLoading = useSelector(showInventoryOverviewLoading);
  const expiry = useSelector(showExpiryBuckets);
  const expiryLoading = useSelector(showExpiryBucketsLoading);
  const sales = useSelector(showSalesOverview);
  const salesLoading = useSelector(showSalesOverviewLoading);
  const profitTrend = useSelector(showProfitTrend);
  const profitTrendLoading = useSelector(showProfitTrendLoading);
  const topProducts = useSelector(showTopProducts);
  const topProductsLoading = useSelector(showTopProductsLoading);

  // Skeletons only stand in for the very first load — once a panel has data,
  // refetches keep the previous numbers on screen instead of flashing back
  // to placeholders.
  const hrPending = hrLoading && !hr;
  const inventoryPending = inventoryLoading && !inventory;
  const salesPending = salesLoading && !sales;

  useEffect(() => {
    if (!isViewDashboard || userStatus) return;
    dispatch(fetchHrOverview());
    dispatch(fetchAttendanceTrend({ days: 14 }));
    dispatch(fetchInventoryOverview());
    dispatch(fetchExpiryBuckets());
    dispatch(fetchSalesOverview());
    dispatch(fetchProfitTrend({ months: 12 }));
    dispatch(fetchTopProducts({ limit: 5 }));
  }, [dispatch, isViewDashboard, userStatus]);

  if (userStatus) {
    return null;
  }
  if (!isViewDashboard) {
    return (
      <div>
        <div className="relative md:size-[480px] h-[480px] flex items-center justify-center bg-bottom m-auto">
          <h1 className="text-center text-xl text-black tracking-[0.2px] font-bold">
            {t("dashboard:welcome_admin_dashboard")}
          </h1>
        </div>
      </div>
    );
  }

  const openExpiryDrilldown = (bucketKey, label) =>
    setDrilldown({
      title: `${t("dashboard:expiry_overview")} — ${label}`,
      columns: expiryColumns,
      fetcher: fetchExpiryBucketDetail(bucketKey),
      onRowClick: expiryRowLink,
    });

  return (
    <>
      <Helmet>
        <title>Rafeeqi | {t("dashboard")}</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2 gap-6 flex-wrap">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
            <p className="text-mutedForeground font-inter">
              {t("dashboard:welcome_back_to")}{" "}
              <span className="capitalize">{userData?.organizationData?.name}</span>
            </p>
          </div>
        </div>

        {/* KPI row 1 — HR */}
        {hrPending ? (
          <SkeletonCards count={5} columns="grid-cols-2 lg:grid-cols-5" />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              icon={FiUsers}
              label={t("dashboard:total_employees")}
              value={fmtNum(hr?.totalEmployees)}
              sub={`${fmtNum(hr?.activeEmployees)} ${t("dashboard:active")}`}
              color="teal"
            />
            <KpiCard
              icon={FiUserCheck}
              label={t("dashboard:present_today")}
              value={fmtNum(hr?.presentToday)}
              color="emerald"
            />
            <KpiCard
              icon={FiUserX}
              label={t("dashboard:absent_today")}
              value={fmtNum(hr?.absentToday)}
              color="red"
            />
            <KpiCard
              icon={FiUsers}
              label={t("dashboard:on_leave_today")}
              value={fmtNum(hr?.onLeaveToday)}
              color="amber"
            />
            <KpiCard
              icon={FiUsers}
              label={t("dashboard:not_marked_today")}
              value={fmtNum(hr?.notMarkedToday)}
              sub={t("dashboard:attendance_not_marked_hint")}
              color="blue"
            />
          </div>
        )}

        {/* KPI row 2 — Inventory + Finance */}
        {inventoryPending && salesPending ? (
          <SkeletonCards count={5} columns="grid-cols-2 lg:grid-cols-5" />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              icon={FiPackage}
              label={t("dashboard:total_products")}
              value={inventoryPending ? "…" : fmtNum(inventory?.totalProducts)}
              color="teal"
            />
            <KpiCard
              icon={FiLayers}
              label={t("dashboard:total_variants")}
              value={inventoryPending ? "…" : fmtNum(inventory?.totalVariants)}
              color="blue"
            />
            <KpiCard
              icon={FiAlertTriangle}
              label={t("dashboard:low_out_of_stock")}
              value={inventoryPending ? "…" : `${fmtNum(inventory?.lowStockCount)} / ${fmtNum(inventory?.outOfStockCount)}`}
              color="amber"
            />
            <KpiCard icon={FiTrendingUp} label={t("dashboard:total_profit")} value={salesPending ? "…" : fmtMoney(sales?.totalProfit)} color="emerald" />
            <KpiCard icon={FiDollarSign} label={t("dashboard:total_revenue")} value={salesPending ? "…" : fmtMoney(sales?.totalRevenue)} color="purple" />
          </div>
        )}

        {/* Expiry buckets — clickable, each opens a paginated drilldown popup */}
        <Panel title={t("dashboard:expiry_overview")}>
          {expiryLoading && !expiry ? (
            <SkeletonCards count={4} />
          ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(expiry?.buckets || []).map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => openExpiryDrilldown(b.key, b.label)}
                className={`text-left rounded-2xl border p-4 transition-transform hover:-translate-y-0.5 ${
                  b.key === "expired" ? "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20" :
                  b.key === "within_1_month" ? "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20" :
                  "bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10"
                }`}
              >
                <p className="text-xs text-slate-500 dark:text-white/60 mb-1">{b.label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{b.count}</p>
                <p className="text-xs text-slate-400 dark:text-white/40">{fmtNum(b.totalQty)} {t("dashboard:units")}</p>
              </button>
            ))}
          </div>
          )}
        </Panel>

        {/* Profit trend graph */}
        {profitTrendLoading && !profitTrend.length ? (
          <SkeletonChart height={260} />
        ) : (
        <Panel title={t("dashboard:profit_trend")}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={profitTrend}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmtMoney(v)} />
              <Legend />
              <Area type="monotone" dataKey="revenue" name={t("dashboard:revenue")} stroke="#14b8a6" fill="url(#revGrad)" />
              <Area type="monotone" dataKey="profit" name={t("dashboard:profit")} stroke="#3b82f6" fill="url(#profitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance trend */}
          {attendanceTrendLoading && !attendanceTrend.length ? (
            <SkeletonChart height={240} />
          ) : (
          <Panel title={t("dashboard:attendance_trend")}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" name={t("dashboard:present")} fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name={t("dashboard:absent")} fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leave" name={t("dashboard:leave")} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          )}

          {/* Employees by department */}
          {hrPending ? (
            <SkeletonChart height={240} />
          ) : (
          <Panel title={t("dashboard:employees_by_department")}>
            {(hr?.byDepartment || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-16">{t("dashboard:no_data")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={hr.byDepartment}
                    dataKey="count"
                    nameKey="departmentName"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={(d) => d.departmentName}
                    onClick={(d) =>
                      setDrilldown({
                        title: d.departmentName,
                        columns: employeeColumns,
                        fetcher: fetchEmployeesByDepartment(d.departmentId),
                        onRowClick: employeeRowLink,
                      })
                    }
                  >
                    {hr.byDepartment.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} className="cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Panel>
          )}

          {/* Inventory by category */}
          {inventoryPending ? (
            <SkeletonChart height={240} />
          ) : (
          <Panel title={t("dashboard:inventory_by_category")}>
            {(inventory?.byCategory || []).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-16">{t("dashboard:no_data")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={inventory.byCategory}
                    dataKey="productCount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={(d) => d.categoryName}
                    onClick={(d) =>
                      setDrilldown({
                        title: d.categoryName,
                        columns: productColumns,
                        fetcher: fetchProductsByCategory(d.categoryId),
                        onRowClick: productRowLink,
                      })
                    }
                  >
                    {inventory.byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} className="cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Panel>
          )}

          {/* Top selling products */}
          <Panel
            title={t("dashboard:top_selling_products")}
            action={
              <button
                onClick={() =>
                  setDrilldown({
                    title: t("dashboard:top_selling_products"),
                    columns: topProductColumns,
                    fetcher: fetchTopProductsPaginated(),
                    onRowClick: (row, nav) => nav(`/inventory/stock/detail/${row.variantId}`),
                  })
                }
                className="text-xs font-medium text-teal-600 dark:text-teal-300 hover:underline"
              >
                {t("dashboard:view_all")}
              </button>
            }
          >
            {topProductsLoading && !topProducts.length ? (
              <SkeletonList rows={5} />
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-16">{t("dashboard:no_data")}</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p) => (
                  <button
                    key={p.variantId}
                    type="button"
                    onClick={() => navigate(`/inventory/stock/detail/${p.variantId}`)}
                    className="w-full flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl p-2 -m-2 transition-colors"
                  >
                    <span className="text-sm text-slate-600 dark:text-white/70 w-40 shrink-0 truncate">{p.productName}</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-400 rounded-full" style={{ width: `${Math.min(100, Math.round((p.qtySold / (topProducts[0]?.qtySold || 1)) * 100))}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white w-16 text-right shrink-0">{fmtNum(p.qtySold)}</span>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <AnalyticsDrilldownModal config={drilldown} onClose={() => setDrilldown(null)} />
    </>
  );
};

export default Dashboard;
