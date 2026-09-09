import { useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { FiPlus, FiEye, FiEdit2, FiArchive, FiPackage, FiTruck, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import ActionPopup from "components/ActionPopup";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import { tableRows, statusFilterOptions } from "global/constant";
import { fetchWarehouses, deleteWarehouse, showWarehouses, showWarehousesTotal, showWarehousesLoading, showWarehousesSummary, clearWarehousesList } from "store/slices/warehouseSlice";
import { useListFilters } from "hooks/useListFilters";
import { SkeletonCards } from "components/Skeleton";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { view_warehouse, add_warehouse, edit_warehouse, delete_warehouse, view_warehouse_transfer } = alqadar_role_ids;

const statusBadge = (s) =>
  s === "Active"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
    : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40";

const SummaryCard = ({ icon: Icon, label, value, color }) => (
  <div className={`bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-5 flex items-center gap-4`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-slate-500 dark:text-white/50">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const Warehouse = () => {
  const { t } = useTranslation("warehouse");
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(clearWarehousesList());
    };
  }, [dispatch]);
  const navigate = useNavigate();

  const [filters, setFilters] = useListFilters("warehouse-list", {
    page: 1,
    limitId: tableRows[0].id,
    search: "",
    statusId: statusFilterOptions[0].id,
  });
  const { page, search } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const selStatus = statusFilterOptions.find((o) => o.id === filters.statusId) || statusFilterOptions[0];
  const setPage = (v) => setFilters({ page: v });
  const popupRef = useRef();
  const pendingDelete = useRef(null);

  const warehouses = useSelector(showWarehouses);
  const totalRecords = useSelector(showWarehousesTotal);
  const loading = useSelector(showWarehousesLoading);
  const summary = useSelector(showWarehousesSummary);

  const refresh = () =>
    dispatch(
      fetchWarehouses({
        page,
        limit: selRows.id,
        search: search || undefined,
        status: selStatus.id || undefined,
      })
    );

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows.id, search, selStatus.id]);

  const totalPages = useMemo(() => Math.ceil((totalRecords || 0) / selRows.id) || 1, [totalRecords, selRows]);
  const handlePageClick = (event) => setPage(event.selected + 1);

  const handleDeleteClick = (wh) => {
    pendingDelete.current = wh.id;
    popupRef.current?.openModal?.();
  };
  const handleConfirmDelete = async () => {
    if (pendingDelete.current) {
      try {
        await dispatch(deleteWarehouse(pendingDelete.current)).unwrap();
        toast.success(t("delete_success"));
        refresh();
      } catch (err) {
        toast.error(err || t("cannot_delete_has_stock"));
      }
      pendingDelete.current = null;
    }
    popupRef.current?.closeModal?.();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t("warehouses")}</h1>
          <p className="text-slate-500 dark:text-white/50 text-sm mt-1">{t("module_desc")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {checkRoleAuth(view_warehouse_transfer) && (
            <button onClick={() => navigate("/warehouse_transfers")} className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/15 transition-colors">
              <FiTruck size={15} />{t("stock_transfers")}
            </button>
          )}
          {checkRoleAuth(add_warehouse) && (
            <button onClick={() => navigate("/warehouse/add")} className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
              <FiPlus size={15} />{t("add_warehouse")}
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards — server-computed tenant-wide totals, not just the current page */}
      {loading ? (
        <SkeletonCards count={4} columns="grid-cols-2 md:grid-cols-4" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard icon={FiArchive}   label={t("total_warehouses")} value={summary.totalWarehouses || 0}  color="bg-teal-500" />
          <SummaryCard icon={FiRefreshCw} label={t("active")}           value={summary.activeWarehouses || 0} color="bg-emerald-500" />
          <SummaryCard icon={FiPackage}   label={t("total_capacity")}   value={`${(summary.totalCapacity || 0).toLocaleString()} sqm`} color="bg-blue-500" />
          <SummaryCard icon={FiTruck}     label={t("total_stock_items")} value={summary.totalStockItems || 0} color="bg-purple-500" />
        </div>
      )}

      {/* Search + status filter — both re-query the backend */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] max-w-xs">
          <SearchInput
            placeholder={t("search_placeholder")}
            onSearch={(v) => setFilters({ search: v, page: 1 })}
            initialValue={search}
          />
        </div>
        <div className="w-full sm:w-48">
          <SelectDropdown
            data={statusFilterOptions}
            selected={selStatus}
            setSelected={(v) => setFilters({ statusId: (v || statusFilterOptions[0]).id, page: 1 })}
            hideClear
            classes="!h-10 !rounded-lg"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonCards count={selRows.id > 12 ? 9 : 6} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {warehouses.map((wh) => (
          <div key={wh.id} className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 flex items-center justify-center">
                <FiArchive size={18} className="text-teal-600 dark:text-teal-400" />
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge(wh.status)}`}>{wh.status}</span>
            </div>
            <p className="font-mono text-xs text-slate-400 mb-1">{wh.code}</p>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{wh.name}</h3>
            <p className="text-xs text-slate-500 dark:text-white/50 mb-1 truncate">{wh.location}</p>
            <p className="text-xs text-slate-400">Manager: {wh.manager}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">{wh.capacity?.toLocaleString()} {wh.unit} capacity</span>
              <div className="flex items-center gap-2">
                {checkRoleAuth(delete_warehouse) && (
                  <button onClick={() => handleDeleteClick(wh)} className="text-slate-400 hover:text-red-500 transition-colors"><FiTrash2 size={15} /></button>
                )}
                {checkRoleAuth(edit_warehouse) && (
                  <button onClick={() => navigate(`/warehouse/edit/${wh.id}`)} className="text-slate-400 hover:text-teal-500 transition-colors"><FiEdit2 size={15} /></button>
                )}
                {checkRoleAuth(view_warehouse) && (
                  <button onClick={() => navigate(`/warehouse/detail/${wh.id}`)} className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium">
                    <FiEye size={13} />View
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {warehouses.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <FiArchive size={36} />
            <p className="text-sm">{t("no_warehouses")}</p>
          </div>
        )}
      </div>
      )}

      {/* Pagination */}
      <div className="flex items-center flex-wrap gap-4 pt-2 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white">
        <div className="flex items-center gap-4">
          <SelectDropdown data={tableRows} selected={selRows} setSelected={(v) => setFilters({ limitId: v.id, page: 1 })} hideClear classes="!h-10 !rounded-lg" />
          <span className="whitespace-nowrap text-sm text-slate-500 dark:text-white/50">{t("per_page", { ns: "translation" })}</span>
        </div>
        <div className="pagination ltr:ml-auto rtl:mr-auto">
          <Pagination
            breakLabel="..."
            nextLabel={<FaAngleRight />}
            previousLabel={<FaAngleLeft />}
            onPageChange={handlePageClick}
            pageRangeDisplayed={3}
            marginPagesDisplayed={1}
            pageCount={totalPages}
            forcePage={page - 1}
            renderOnZeroPageCount={null}
            containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
          />
        </div>
      </div>

      <ActionPopup
        ref={popupRef}
        title={t("delete_warehouse")}
        description={t("confirm_delete_warehouse")}
        confirm={t("yes", { ns: "translation" })}
        cancel={t("cancel", { ns: "translation" })}
        onClick={handleConfirmDelete}
      />
    </div>
  );
};

export default Warehouse;
