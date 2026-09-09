import { useEffect } from "react";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import { LuCalendarPlus } from "react-icons/lu";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import LeaveFilter from "./LeaveFilter";
import LeaveTable from "./LeaveTable";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import { SkeletonCards } from "components/Skeleton";
import {
  fetchLeaves,
  fetchLeaveSummary,
  showLeaves,
  showLeavesTotal,
  showLeavesLoading,
  showLeaveSummary,
  showLastUpdated,
} from "store/slices/leaveSlice";

const { view_leave, add_leave, approve_leave, view_leave_type } = alqadar_role_ids;

const LeaveManagement = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filters, setFilters] = useListFilters("hr-leave-list", { page: 1, limitId: tableRows[0].id, search: "", filterStatus: null, filterType: null, filterDept: null });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const lastUpdated = useSelector(showLastUpdated);

  const leaves = useSelector(showLeaves);
  const totalRecords = useSelector(showLeavesTotal);
  const loading = useSelector(showLeavesLoading);
  const summary = useSelector(showLeaveSummary);

  useEffect(() => {
    dispatch(fetchLeaves({
      page: filters.page,
      limit: selRows.id,
      search: filters.search || undefined,
      status: filters.filterStatus || undefined,
      leaveTypeId: filters.filterType || undefined,
      departmentId: filters.filterDept || undefined,
    }));
  }, [dispatch, filters.page, filters.limitId, filters.search, filters.filterStatus, filters.filterType, filters.filterDept, lastUpdated]);

  useEffect(() => {
    dispatch(fetchLeaveSummary());
  }, [dispatch, lastUpdated]);

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handleRowsChange = (v) => setFilters({ limitId: v.id, page: 1 });

  const STAT_CARDS = [
    { label: t("leave:total"), value: summary.total, color: "from-slate-500 to-slate-600" },
    { label: t("leave:pending"), value: summary.pending, color: "from-amber-500 to-amber-600" },
    { label: t("leave:approved"), value: summary.approved, color: "from-emerald-500 to-emerald-600" },
    { label: t("leave:rejected"), value: summary.rejected, color: "from-rose-500 to-rose-600" },
  ];

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        {/* Header */}
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("leave:leave_management")}
            </h1>
            <p className="text-mutedForeground mt-1">
              {t("leave:module_desc")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {checkRoleAuth(view_leave_type) && (
              <Button
                className="!w-auto !rounded-lg !h-10 !px-4 !border border-slate-200 dark:!border-white/25 !bg-white dark:!bg-white/10 !text-slate-700 dark:!text-white hover:!bg-slate-50"
                onClick={() => navigate("/leave-management/leave-types")}
                type="button"
                title={t("leave:leave_types")}
              />
            )}
            {checkRoleAuth(view_leave) && (
              <Button
                className="!w-auto !rounded-lg !h-10 !px-4 !border border-slate-200 dark:!border-white/25 !bg-white dark:!bg-white/10 !text-slate-700 dark:!text-white hover:!bg-slate-50"
                onClick={() => navigate("/leave-management/balances")}
                type="button"
                title={t("leave:leave_balances")}
              />
            )}
            {/* Employee self-service: apply own leave */}
            <Button
              className="!w-auto !rounded-lg !h-10 !px-4 !border-0 !text-white !bg-gradient-to-br !from-purple-500 !to-purple-600 hover:!from-purple-600 hover:!to-purple-700"
              onClick={() => navigate("/leave-management/apply")}
              type="button"
              title={t("leave:apply_leave")}
              icon={LuCalendarPlus}
              iconClass="h-4 w-4 text-white"
            />
            {checkRoleAuth(add_leave) && (
              <Button
                className="!w-auto !rounded-lg !h-10 !px-4 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600"
                onClick={() => navigate("/leave-management/add")}
                type="button"
                title={t("leave:add_leave_hr")}
                icon={IoAdd}
                btn="primary"
                iconClass="h-4 w-4 text-white"
              />
            )}
          </div>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="mb-6">
            <SkeletonCards count={4} columns="grid-cols-2 lg:grid-cols-4" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {STAT_CARDS.map((c) => (
              <div
                key={c.label}
                className={`p-5 rounded-2xl bg-gradient-to-br ${c.color} text-white`}
              >
                <p className="text-sm font-medium opacity-80">{c.label}</p>
                <p className="text-3xl font-bold mt-1">{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Approval shortcut banners */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate("/leave-management/apply")}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-purple-200 bg-purple-50 dark:bg-purple-500/10 dark:border-purple-500/30 hover:border-purple-400 transition-all text-start"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-500 flex items-center justify-center shrink-0">
              <LuCalendarPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-purple-800 dark:text-purple-300">{t("leave:apply_leave")}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">{t("leave:apply_leave_sub")}</p>
            </div>
          </button>

          {checkRoleAuth(approve_leave) && (
            <button
              type="button"
              onClick={() => navigate("/leave-management/manager-approvals")}
              className="flex items-center justify-between p-4 rounded-2xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 hover:border-amber-400 transition-all"
            >
              <div className="text-start">
                <p className="font-semibold text-amber-800 dark:text-amber-300">{t("leave:manager_approvals")}</p>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">{t("leave:pending_manager_desc")}</p>
              </div>
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {summary.pendingManager}
              </span>
            </button>
          )}
          {checkRoleAuth(approve_leave) && (
            <button
              type="button"
              onClick={() => navigate("/leave-management/hr-approvals")}
              className="flex items-center justify-between p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/30 hover:border-blue-400 transition-all"
            >
              <div className="text-start">
                <p className="font-semibold text-blue-800 dark:text-blue-300">{t("leave:hr_approvals")}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">{t("leave:pending_hr_desc")}</p>
              </div>
              <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {summary.pendingHr}
              </span>
            </button>
          )}
        </div>

        {/* All leaves table */}
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          {checkRoleAuth(view_leave) && <LeaveFilter filters={filters} setFilters={setFilters} />}
          {checkRoleAuth(view_leave) && (
            <LeaveTable
              data={leaves}
              loading={loading}
              page={filters.page}
              setPage={(p) => setFilters({ page: p })}
              selRows={selRows}
              setSelRows={handleRowsChange}
              totalPages={totalPages}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
