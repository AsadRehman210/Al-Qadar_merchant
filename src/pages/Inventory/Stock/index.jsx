import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import StockCards from "./StockCards";
import StockFilters from "./StockFilters";
import StockTable from "./StockTable";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { tableRows } from "global/constant";
import {
  fetchStock,
  showStock,
  showStockTotal,
  showStockLoading,
  fetchStockSummary,
  showStockSummary,
} from "store/slices/stockSlice";
import { fetchWarehouses, showWarehouses } from "store/slices/warehouseSlice";
import { useListFilters } from "hooks/useListFilters";

const { view_customer } = rafeeqi_role_ids;

const InventoryStock = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [filters, setFilters] = useListFilters("inventory-stock", {
    page: 1,
    limitId: tableRows[0].id,
    search: "",
    statusId: "all",
    warehouseId: "all",
  });
  const { page, search, statusId, warehouseId } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const setPage = (v) => setFilters({ page: v });

  const rows = useSelector(showStock);
  const totalRecords = useSelector(showStockTotal);
  const loading = useSelector(showStockLoading);
  const summary = useSelector(showStockSummary);
  const warehouses = useSelector(showWarehouses);

  useEffect(() => {
    dispatch(fetchWarehouses({}));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchStock({
      page,
      limit: selRows.id,
      search: search || undefined,
      status: statusId === "all" ? undefined : statusId,
      warehouseId: warehouseId === "all" ? undefined : warehouseId,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows, search, statusId, warehouseId]);

  useEffect(() => {
    dispatch(fetchStockSummary({}));
  }, [dispatch]);

  const totalPages = useMemo(() => Math.ceil((totalRecords || 0) / selRows.id) || 1, [totalRecords, selRows]);

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("product:stock_title")}
          </h1>
          <p className="text-mutedForeground mt-2">
            {t("product:stock_module_desc")}
          </p>
        </div>

        {checkRoleAuth(view_customer) ? (
          <>
            <StockCards summary={summary} />

            <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 animate-[partners-cardIn_0.5s_ease-out_0.08s_both]">
              <StockFilters
                search={search}
                onSearch={(v) => setFilters({ search: v, page: 1 })}
                statusId={statusId}
                onStatusIdChange={(v) => setFilters({ statusId: v, page: 1 })}
                warehouses={warehouses}
                warehouseId={warehouseId}
                onWarehouseIdChange={(v) => setFilters({ warehouseId: v, page: 1 })}
                setPage={setPage}
              />
              <div className="mt-6">
                <StockTable
                  data={rows}
                  loading={loading}
                  page={page}
                  setPage={setPage}
                  selRows={selRows}
                  setSelRows={(v) => setFilters({ limitId: v.id, page: 1 })}
                  totalPages={totalPages}
                />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default InventoryStock;
