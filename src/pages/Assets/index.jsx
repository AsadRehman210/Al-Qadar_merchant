import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import AssetsTable from "./AssetsTable";
import AssetAlerts from "./AssetAlerts";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { tableRows, assetStatusFilterOptions } from "global/constant";
import {
  fetchAssets,
  fetchAssetCategories,
  fetchAssetLocations,
  fetchAssetSummary,
  fetchAssetsForAlerts,
  showAssets,
  showAssetsTotal,
  showAssetsLoading,
  showAssetCategories,
  showAssetLocations,
  showAssetSummary,
  showAssetSummaryLoading,
  showAssetAlertsList,
} from "store/slices/assetSlice";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import ExportButton from "components/ExportButton";
import { SkeletonCards } from "components/Skeleton";
import { useListFilters } from "hooks/useListFilters";

const { view_asset, add_asset } = alqadar_role_ids;

const fmtMoney = (n) => `${(parseFloat(n) || 0).toLocaleString()} SAR`;

const AssetRegister = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filters, setFilters] = useListFilters("assets-list", {
    page: 1,
    search: "",
    statusId: "all",
    categoryId: "all",
    locationId: "all",
    limitId: tableRows[0].id,
  });
  const { page, search, statusId, categoryId, locationId } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  const assets = useSelector(showAssets);
  const total = useSelector(showAssetsTotal);
  const assetsLoading = useSelector(showAssetsLoading);
  const categories = useSelector(showAssetCategories);
  const locations = useSelector(showAssetLocations);
  const summary = useSelector(showAssetSummary);
  const summaryLoading = useSelector(showAssetSummaryLoading);
  const alertAssets = useSelector(showAssetAlertsList);

  useEffect(() => {
    dispatch(fetchAssetCategories());
    dispatch(fetchAssetLocations());
    dispatch(fetchAssetSummary());
    dispatch(fetchAssetsForAlerts());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAssets({
      page,
      limit: selRows.id,
      search: search || undefined,
      status: statusId === "all" ? undefined : statusId,
      categoryId: categoryId === "all" ? undefined : categoryId,
      location: locationId === "all" ? undefined : locationId,
    }));
  }, [dispatch, page, selRows.id, search, statusId, categoryId, locationId]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / selRows.id));

  const categoryNameById = (id) => {
    const c = categories.find((x) => x.id === id);
    return c ? `${c.code} — ${c.name}` : "—";
  };

  const statusOptions = assetStatusFilterOptions;

  const categoryOptions = useMemo(
    () => [
      { id: "all", title: t("asset:filter_all_categories") },
      ...categories.map((c) => ({ id: c.id, title: `${c.code} — ${c.name}` })),
    ],
    [t, categories],
  );

  const locationOptions = useMemo(
    () => [
      { id: "all", title: t("asset:filter_all_locations") },
      ...locations.map((loc) => ({ id: loc, title: loc })),
    ],
    [t, locations],
  );

  const selectedStatus = useMemo(
    () => statusOptions.find((o) => o.id === statusId) || statusOptions[0],
    [statusOptions, statusId],
  );
  const selectedCategory = useMemo(
    () => categoryOptions.find((o) => o.id === categoryId) || categoryOptions[0],
    [categoryOptions, categoryId],
  );
  const selectedLocation = useMemo(
    () => locationOptions.find((o) => o.id === locationId) || locationOptions[0],
    [locationOptions, locationId],
  );

  const exportColumns = useMemo(
    () => [
      { label: t("asset:asset_tag"), key: "assetTag" },
      { label: t("asset:asset_name"), key: "name" },
      { label: t("asset:category"), value: (r) => categoryNameById(r.categoryId) },
      { label: t("asset:serial_number"), key: "serialNumber" },
      { label: t("asset:location"), key: "location" },
      { label: t("asset:current_value"), value: (r) => fmtMoney(r.currentValue) },
      { label: t("asset:status"), key: "status" },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, categories],
  );

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("asset:assets_title")}
            </h1>
            <p className="text-mutedForeground">{t("asset:assets_desc")}</p>
          </div>
          {checkRoleAuth(add_asset) && (
            <div className="relative z-10 shrink-0 flex flex-wrap gap-2.5">
              <Button
                className="!w-auto !rounded-lg !h-11 !px-5 !bg-white dark:!bg-white/10 !text-slate-700 dark:!text-white !border !border-slate-200 dark:!border-white/20"
                onClick={() => navigate("/assets/reports")}
                type="button"
                title={t("asset:reports_title")}
              />
              <Button
                className="!w-auto !rounded-lg !h-11 !px-5 !bg-white dark:!bg-white/10 !text-slate-700 dark:!text-white !border !border-slate-200 dark:!border-white/20"
                onClick={() => navigate("/assets/import")}
                type="button"
                title={t("asset:import_assets")}
              />
              <Button
                className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700 hover:-translate-y-0.5 disabled:hover:translate-y-0"
                onClick={() => navigate("/assets/add")}
                type="button"
                title={t("asset:add_asset")}
                src=""
                icon={IoAdd}
                btn="primary"
                disabled={false}
                imgClass=""
                loading={false}
                iconClass="h-4 w-4 text-white"
              />
            </div>
          )}
        </div>

        {checkRoleAuth(view_asset) && (
          <>
            <div className="mb-6">
              {summaryLoading ? (
                <SkeletonCards count={4} />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: t("asset:total_assets"), value: summary.total, color: "border-slate-200 bg-white dark:bg-white/10 dark:border-white/20" },
                    { label: t("asset:total_purchase_cost"), value: fmtMoney(summary.totalPurchaseCost), color: "border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/30 text-blue-700 dark:text-blue-300" },
                    { label: t("asset:total_book_value"), value: fmtMoney(summary.totalBookValue), color: "border-teal-200 bg-teal-50 dark:bg-teal-500/10 dark:border-teal-500/30 text-teal-700 dark:text-teal-300" },
                    { label: t("asset:in_use_count"), value: summary.byStatus?.["In use"] ?? 0, color: "border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300" },
                  ].map((c) => (
                    <div key={c.label} className={`p-5 rounded-2xl border ${c.color}`}>
                      <p className="text-xs font-medium opacity-70 mb-1">{c.label}</p>
                      <p className="font-bold text-lg">{c.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AssetAlerts assets={alertAssets} />
          </>
        )}

        <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 animate-[partners-cardIn_0.5s_ease-out_0.1s_both]">
          {checkRoleAuth(view_asset) && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-start gap-4 flex-wrap">
              <div className="min-w-[200px] w-full sm:w-[200px]">
                <SelectDropdown
                  data={statusOptions}
                  selected={selectedStatus}
                  setSelected={(opt) => setFilters({ statusId: opt?.id ?? "all", page: 1 })}
                  hideClear
                  classes="!h-11 !rounded-lg"
                />
              </div>
              <div className="min-w-[200px] w-full sm:w-[220px]">
                <SelectDropdown
                  data={categoryOptions}
                  selected={selectedCategory}
                  setSelected={(opt) => setFilters({ categoryId: opt?.id ?? "all", page: 1 })}
                  hideClear
                  classes="!h-11 !rounded-lg"
                />
              </div>
              <div className="min-w-[200px] w-full sm:w-[200px]">
                <SelectDropdown
                  data={locationOptions}
                  selected={selectedLocation}
                  setSelected={(opt) => setFilters({ locationId: opt?.id ?? "all", page: 1 })}
                  hideClear
                  classes="!h-11 !rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-[200px] min-h-[44px] max-w-md">
                <SearchInput
                  placeholder={t("asset:search_assets")}
                  onSearch={(v) => setFilters({ search: v, page: 1 })}
                  initialValue={search}
                />
              </div>
              <div className="shrink-0">
                <ExportButton
                  data={assets}
                  columns={exportColumns}
                  filename="assets-register.xlsx"
                  title={t("asset:export_assets")}
                />
              </div>
            </div>
          )}
          {checkRoleAuth(view_asset) && (
            <AssetsTable
              data={assets}
              loading={assetsLoading}
              categories={categories}
              page={page}
              setPage={(p) => setFilters({ page: p })}
              selRows={selRows}
              setSelRows={(v) => setFilters({ limitId: v.id, page: 1 })}
              totalPages={totalPages}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetRegister;
