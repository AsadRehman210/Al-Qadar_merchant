import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import ProductionTable from "./ProductionTable";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { tableRows, productionStatusFilterOptions } from "global/constant";
import { fetchProductionOrders, showProductionOrders, showProductionOrdersTotal, showProductionOrdersLoading, clearProductionOrdersList } from "store/slices/productionSlice";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import { useListFilters } from "hooks/useListFilters";

const { view_inventory_production, add_inventory_production } = alqadar_role_ids;

const Production = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(clearProductionOrdersList());
    };
  }, [dispatch]);
  const navigate = useNavigate();

  const [filters, setFilters] = useListFilters("inventory-production", {
    page: 1,
    limitId: tableRows[0].id,
    search: "",
    statusId: "all",
  });
  const { page, search, statusId } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const setPage = (v) => setFilters({ page: v });

  const statusOptions = productionStatusFilterOptions;

  const selectedStatus = useMemo(
    () => statusOptions.find((o) => o.id === statusId) || statusOptions[0],
    [statusOptions, statusId],
  );

  const orders = useSelector(showProductionOrders);
  const totalRecords = useSelector(showProductionOrdersTotal);
  const loading = useSelector(showProductionOrdersLoading);

  const refreshList = () => dispatch(fetchProductionOrders({
    page,
    limit: selRows.id,
    search: search || undefined,
    status: statusId === "all" ? undefined : statusId,
  }));

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows, search, statusId]);

  const totalPages = useMemo(() => Math.ceil((totalRecords || 0) / selRows.id) || 1, [totalRecords, selRows]);

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("production:module_title")}
            </h1>
            <p className="text-mutedForeground">
              {t("production:module_desc")}
            </p>
          </div>
          {checkRoleAuth(add_inventory_production) && (
            <div className="relative z-10 shrink-0">
              <Button
                className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700 hover:-translate-y-0.5 disabled:hover:translate-y-0"
                onClick={() => navigate("/inventory/production/add")}
                type="button"
                title={t("production:add_order")}
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
          {checkRoleAuth(view_inventory_production) && (
            <div className="mb-6 flex flex-col sm:flex-row gap-4 flex-wrap">
              <div className="min-w-[200px] w-full sm:w-[220px]">
                <SelectDropdown
                  data={statusOptions}
                  selected={selectedStatus}
                  setSelected={(opt) => setFilters({ statusId: opt?.id ?? "all", page: 1 })}
                  hideClear
                  classes="!h-11 !rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-[200px] min-h-[44px] max-w-md">
                <SearchInput
                  placeholder={t("production:search_placeholder")}
                  onSearch={(v) => setFilters({ search: v, page: 1 })}
                  initialValue={search}
                />
              </div>
            </div>
          )}
          {checkRoleAuth(view_inventory_production) && (
            <ProductionTable
              data={orders}
              loading={loading}
              page={page}
              setPage={setPage}
              selRows={selRows}
              setSelRows={(v) => setFilters({ limitId: v.id, page: 1 })}
              totalPages={totalPages}
              onDeleted={refreshList}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Production;
