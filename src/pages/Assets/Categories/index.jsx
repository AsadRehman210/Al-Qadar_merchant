import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import CategoriesTable from "./CategoriesTable";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { tableRows } from "global/constant";
import {
  fetchAssetCategories,
  showAssetCategories,
  showAssetCategoriesTotal,
  showAssetCategoriesLoading,
} from "store/slices/assetSlice";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import { useListFilters } from "hooks/useListFilters";

const { view_customer, add_customer } = rafeeqi_role_ids;

const AssetCategories = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filters, setFilters] = useListFilters("assets-categories", { page: 1, search: "", statusId: "all", limitId: tableRows[0].id });
  const { page, search, statusId } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  const categories = useSelector(showAssetCategories);
  const total = useSelector(showAssetCategoriesTotal);
  const loading = useSelector(showAssetCategoriesLoading);

  useEffect(() => {
    dispatch(fetchAssetCategories({
      page,
      limit: selRows.id,
      search: search || undefined,
      status: statusId === "all" ? undefined : statusId,
    }));
  }, [dispatch, page, selRows.id, search, statusId]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / selRows.id));

  const statusOptions = useMemo(
    () => [
      { id: "all", title: t("asset:filter_all") },
      { id: "Active", title: t("asset:active") },
      { id: "Inactive", title: t("asset:inactive") },
    ],
    [t],
  );

  const selectedStatus = useMemo(
    () => statusOptions.find((o) => o.id === statusId) || statusOptions[0],
    [statusOptions, statusId],
  );

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("asset:categories_title")}
            </h1>
            <p className="text-mutedForeground">{t("asset:categories_desc")}</p>
          </div>
          {checkRoleAuth(add_customer) && (
            <div className="relative z-10 shrink-0">
              <Button
                className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700 hover:-translate-y-0.5 disabled:hover:translate-y-0"
                onClick={() => navigate("/assets-categories/add")}
                type="button"
                title={t("asset:add_category")}
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
        <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 animate-[partners-cardIn_0.5s_ease-out_0.1s_both]">
          {checkRoleAuth(view_customer) && (
            <div className="mb-6 flex flex-col sm:flex-row gap-4 flex-wrap">
              <div className="min-w-[200px] w-full sm:w-[200px]">
                <SelectDropdown
                  data={statusOptions}
                  selected={selectedStatus}
                  setSelected={(opt) => {
                    setFilters({ statusId: opt?.id ?? "all", page: 1 });
                  }}
                  hideClear
                  classes="!h-11 !rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-[200px] min-h-[44px] max-w-md">
                <SearchInput
                  placeholder={t("asset:search_categories")}
                  onSearch={(v) => {
                    setFilters({ search: v, page: 1 });
                  }}
                  initialValue={search}
                />
              </div>
            </div>
          )}
          {checkRoleAuth(view_customer) && (
            <CategoriesTable
              data={categories}
              loading={loading}
              page={page}
              setPage={(v) => setFilters({ page: v })}
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

export default AssetCategories;
