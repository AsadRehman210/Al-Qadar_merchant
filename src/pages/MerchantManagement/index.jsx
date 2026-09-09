import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Button from "components/Button";
import { SkeletonCards } from "components/Skeleton";
import { tableRows } from "global/constant";
import { IoAdd } from "react-icons/io5";
import { useListFilters } from "hooks/useListFilters";
import {
  fetchMerchants,
  fetchMerchantsSummary,
  showMerchants,
  showMerchantsTotal,
  showMerchantsListLoading,
  showMerchantsSummary,
  showMerchantsSummaryLoading,
} from "store/slices/merchantSlice";
import MerchantsFilter from "./MerchantsFilter";
import MerchantsTable from "./MerchantsTable";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { view_merchant_management, add_merchant_management } = alqadar_role_ids;

const MerchantManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [filters, setFilters] = useListFilters("merchants-list", { page: 1, limitId: tableRows[0].id, search: "", filterStatus: null });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  const merchants = useSelector(showMerchants);
  const totalRecords = useSelector(showMerchantsTotal);
  const loading = useSelector(showMerchantsListLoading);
  const summary = useSelector(showMerchantsSummary);
  const summaryLoading = useSelector(showMerchantsSummaryLoading);

  useEffect(() => {
    dispatch(fetchMerchants({
      page: filters.page,
      limit: selRows.id,
      search: filters.search || undefined,
      status: filters.filterStatus || undefined,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.page, filters.search, filters.filterStatus, filters.limitId]);

  useEffect(() => {
    dispatch(fetchMerchantsSummary());
  }, [dispatch]);

  const totalPages = useMemo(() => Math.ceil((totalRecords || 0) / selRows.id) || 1, [totalRecords, selRows]);

  const handlePageChange = (newPage) => setFilters({ page: newPage });

  if (!checkRoleAuth(view_merchant_management)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("merchant:merchants")}</h1>
            <p className="text-mutedForeground">{t("merchant:module_desc")}</p>
          </div>
          {checkRoleAuth(add_merchant_management) && (
            <Button
              className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700 hover:-translate-y-0.5 shrink-0"
              onClick={() => navigate("/merchant-management/add")}
              type="button"
              title={t("merchant:add_merchant")}
              icon={IoAdd}
              btn="primary"
              iconClass="h-4 w-4 text-white"
            />
          )}
        </div>

        {/* Summary cards */}
        {summaryLoading ? (
          <div className="mb-6">
            <SkeletonCards count={2} columns="grid-cols-2" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: t("merchant:total_merchants"), val: summary.totalMerchants, color: "teal" },
              { label: t("merchant:active_merchants"), val: summary.activeMerchants, color: "emerald" },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 p-4">
                <p className="text-xs text-slate-500 dark:text-white/60 mb-1">{label}</p>
                <p className={`text-xl font-bold tabular-nums text-${color}-700 dark:text-${color}-300`}>{val}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <div className="mb-6">
            <MerchantsFilter filters={filters} setFilters={setFilters} />
          </div>
          <MerchantsTable
            data={merchants}
            loading={loading}
            page={filters.page}
            setPage={handlePageChange}
            selRows={selRows}
            setSelRows={(v) => setFilters({ limitId: v.id, page: 1 })}
            totalPages={totalPages}
          />
        </div>
      </div>
    </div>
  );
};

export default MerchantManagement;
