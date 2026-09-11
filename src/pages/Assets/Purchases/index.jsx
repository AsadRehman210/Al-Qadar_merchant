import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import AssetPurchasesTable from "./AssetPurchasesTable";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import SearchInput from "components/SearchInput";
import {
  fetchAssetPurchases,
  deleteAssetPurchase,
  showAssetPurchases,
  showAssetPurchasesTotal,
  showAssetPurchasesLoading,
} from "store/slices/assetPurchaseSlice";

const { view_asset_purchase, add_asset_purchase } = alqadar_role_ids;

const AssetPurchases = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filters, setFilters] = useListFilters("asset-purchases-list", { page: 1, limitId: tableRows[0].id, search: "" });
  const { page, search } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  const rows = useSelector(showAssetPurchases);
  const total = useSelector(showAssetPurchasesTotal);
  const loading = useSelector(showAssetPurchasesLoading);

  const refreshList = () =>
    dispatch(fetchAssetPurchases({ page, limit: selRows.id, search: search || undefined }));

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows.id, search]);

  const totalPages = useMemo(() => Math.ceil((total || 0) / selRows.id) || 1, [total, selRows]);

  if (!checkRoleAuth(view_asset_purchase)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{t("asset:purchases_title")}</h1>
            <p className="text-mutedForeground">{t("asset:purchases_desc")}</p>
          </div>
          {checkRoleAuth(add_asset_purchase) && (
            <Button
              className="!w-auto !rounded-lg !h-11 !px-5 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700"
              onClick={() => navigate("/assets/purchases/add")}
              type="button"
              title={t("asset:add_purchase")}
              icon={IoAdd}
              btn="primary"
              iconClass="h-4 w-4 text-white"
            />
          )}
        </div>
        <div className="mb-5 max-w-md">
          <SearchInput
            placeholder={t("asset:search_purchases")}
            onSearch={(v) => setFilters({ search: v, page: 1 })}
            initialValue={search}
          />
        </div>
        <AssetPurchasesTable
          data={rows}
          loading={loading}
          page={page}
          setPage={(p) => setFilters({ page: p })}
          selRows={selRows}
          setSelRows={(opt) => setFilters({ limitId: opt.id, page: 1 })}
          totalPages={totalPages}
          onDeleteConfirmed={async (row) => {
            await dispatch(deleteAssetPurchase(row.id)).unwrap();
            refreshList();
          }}
        />
      </div>
    </div>
  );
};

export default AssetPurchases;
