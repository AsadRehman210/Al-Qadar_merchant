import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { FiArrowLeft, FiPlus, FiEye } from "react-icons/fi";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { toast } from "react-toastify";
import Button from "components/Button";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import ActionPopup from "components/ActionPopup";
import { tableRows, stockTransferStatusFilterOptions } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import Block from "components/Skeleton";
import {
  clearStockTransfersList,
  fetchStockTransfers,
  approveStockTransfer,
  deleteStockTransfer,
  showStockTransfers,
  showStockTransfersTotal,
  showStockTransfersLoading,
} from "store/slices/stockTransferSlice";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { view_warehouse_transfer, add_warehouse_transfer, edit_warehouse_transfer, delete_warehouse_transfer } = alqadar_role_ids;

const statusBadge = (s) => {
  if (s === "Completed") return "bg-emerald-100 text-emerald-700";
  if (s === "Pending") return "bg-amber-100 text-amber-700";
  if (s === "Cancelled") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-500";
};

const TRANSFER_STATUS_OPTS = stockTransferStatusFilterOptions;

const StockTransfer = () => {
  const { t } = useTranslation("warehouse");
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(clearStockTransfersList());
    };
  }, [dispatch]);

  const navigate = useNavigate();
  const popupRef = useRef();
  const [filters, setFilters] = useListFilters("warehouse-stock-transfer", {
    page: 1,
    limitId: tableRows[0].id,
    search: "",
    statusId: TRANSFER_STATUS_OPTS[0]?.id ?? "",
  });
  const { page, search } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const selStatus = TRANSFER_STATUS_OPTS.find((o) => o.id === filters.statusId) || TRANSFER_STATUS_OPTS[0];
  const setPage = (v) => setFilters({ page: v });

  const transfers = useSelector(showStockTransfers);
  const totalRecords = useSelector(showStockTransfersTotal);
  const loading = useSelector(showStockTransfersLoading);

  const refresh = () =>
    dispatch(
      fetchStockTransfers({
        page,
        limit: selRows.id,
        search: search || undefined,
        status: selStatus?.id || undefined,
      }),
    );

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows.id, search, selStatus?.id]);

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handlePageClick = (event) => setPage(event.selected + 1);

  const handleApprove = async (id) => {
    try {
      await dispatch(approveStockTransfer(id)).unwrap();
      toast.success(t("transfer_approved"));
      refresh();
    } catch (err) {
      toast.error(err || t("error", { ns: "translation", defaultValue: "Something went wrong" }));
    }
  };

  const onDelete = (row) => popupRef.current?.openModal?.(row);
  const onConfirmDelete = async (row) => {
    try {
      const deleted = await dispatch(deleteStockTransfer(row.id)).unwrap();
      toast.success(deleted.message || t("transfer_deleted"));
      refresh();
    } catch (err) {
      toast.error(err || t("error", { ns: "translation", defaultValue: "Something went wrong" }));
    }
    popupRef.current?.closeModal?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={() => navigate("/warehouse")}
            icon={FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
            iconClass="!text-lg"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">{t("stock_transfers")}</h1>
            <p className="text-slate-500 dark:text-white/50 text-sm mt-1">{t("transfers_desc")}</p>
          </div>
        </div>
        {checkRoleAuth(add_warehouse_transfer) && (
          <button
            onClick={() => navigate("/warehouse_transfers/add")}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors"
          >
            <FiPlus size={15} />
            {t("new_transfer")}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] max-w-xs">
          <SearchInput
            placeholder={`${t("search", { ns: "translation" })}...`}
            onSearch={(v) => setFilters({ search: v, page: 1 })}
            initialValue={search}
          />
        </div>
        <div className="w-full sm:w-48">
          <SelectDropdown
            data={TRANSFER_STATUS_OPTS}
            selected={selStatus}
            setSelected={(v) => setFilters({ statusId: (v || TRANSFER_STATUS_OPTS[0])?.id ?? "", page: 1 })}
            hideClear
            classes="!h-10 !rounded-lg"
          />
        </div>
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
                <th className="px-4 py-3">{t("approved_by")}</th>
                <th className="px-4 py-3">{t("actions", { ns: "translation", defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, r) => (
                  <tr key={r} className="border-b border-slate-50 dark:border-white/5">
                    {Array.from({ length: 8 }).map((__, c) => (
                      <td key={c} className="px-4 py-3">
                        <Block className="h-4 w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    {t("no_transfers")}
                  </td>
                </tr>
              ) : (
                transfers.map((tr) => {
                  const isPending = tr.status === "Pending";
                  return (
                    <tr
                      key={tr.id}
                      className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <td className="px-6 py-3 font-mono text-xs text-teal-700 dark:text-teal-300">{tr.transferNo}</td>
                      <td className="px-4 py-3 text-slate-500">{tr.date?.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-white/80">{tr.fromWarehouseName}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-white/80">{tr.toWarehouseName}</td>
                      <td className="px-4 py-3 text-slate-500">{tr.items?.length}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(tr.status)}`}>
                          {tr.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{tr.approvedBy || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {checkRoleAuth(view_warehouse_transfer) && (
                            <button
                              type="button"
                              onClick={() => navigate(`/warehouse_transfers/detail/${tr.id}`)}
                              className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                              title={t("view", { ns: "translation", defaultValue: "View" })}
                            >
                              <FiEye className="h-4 w-4" />
                            </button>
                          )}
                          {isPending && (
                            <>
                              {checkRoleAuth(edit_warehouse_transfer) && (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/warehouse_transfers/edit/${tr.id}`)}
                                  className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                                  title={t("edit")}
                                >
                                  <AiOutlineEdit className="h-4 w-4" />
                                </button>
                              )}
                              {checkRoleAuth(delete_warehouse_transfer) && (
                                <button
                                  type="button"
                                  onClick={() => onDelete(tr)}
                                  className="text-slate-500 dark:text-white/80 transition-all hover:text-red-600 dark:hover:text-red-400"
                                  title={t("delete", { ns: "translation", defaultValue: "Delete" })}
                                >
                                  <AiOutlineDelete className="h-4 w-4" />
                                </button>
                              )}
                              {checkRoleAuth(edit_warehouse_transfer) && (
                                <button
                                  type="button"
                                  onClick={() => handleApprove(tr.id)}
                                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium ms-1"
                                >
                                  {t("approve")}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-4 pt-2 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white">
        <div className="flex items-center gap-4">
          <SelectDropdown
            data={tableRows}
            selected={selRows}
            setSelected={(v) => setFilters({ limitId: v.id, page: 1 })}
            hideClear
            classes="!h-10 !rounded-lg"
          />
          <span className="whitespace-nowrap text-sm text-slate-500 dark:text-white/50">
            {t("per_page", { ns: "translation" })}
          </span>
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
        title={t("delete_transfer")}
        description={t("confirm_delete_transfer")}
        confirm={t("yes", { ns: "translation" })}
        cancel={t("cancel", { ns: "translation" })}
        onClick={onConfirmDelete}
      />
    </div>
  );
};

export default StockTransfer;
