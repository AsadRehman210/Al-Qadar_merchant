import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiEdit2 } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import ActionPopup from "components/ActionPopup";
import { SkeletonDetail } from "components/Skeleton";
import {
  fetchStockTransferById,
  approveStockTransfer,
  deleteStockTransfer,
  clearCurrentStockTransfer,
  showCurrentStockTransfer,
  showCurrentStockTransferLoading,
} from "store/slices/stockTransferSlice";

const statusBadge = (s) => {
  if (s === "Completed") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  if (s === "Pending") return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  if (s === "Cancelled") return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
  return "bg-slate-100 text-slate-500";
};

const Field = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">{label}</p>
    <p className="font-semibold text-slate-900 dark:text-white mt-1 break-words">{value ?? "—"}</p>
  </div>
);

const StockTransferDetail = () => {
  const { t, i18n } = useTranslation("warehouse");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const transfer = useSelector(showCurrentStockTransfer);
  const loading = useSelector(showCurrentStockTransferLoading);
  const popupRef = useRef();

  useEffect(() => {
    if (id) dispatch(fetchStockTransferById(id));
    return () => dispatch(clearCurrentStockTransfer());
  }, [id, dispatch]);

  const handleApprove = async () => {
    try {
      await dispatch(approveStockTransfer(id)).unwrap();
      toast.success(t("transfer_approved"));
      dispatch(fetchStockTransferById(id));
    } catch (err) {
      toast.error(err || t("error", { ns: "translation", defaultValue: "Something went wrong" }));
    }
  };

  const onConfirmDelete = async () => {
    try {
      const deleted = await dispatch(deleteStockTransfer(id)).unwrap();
      toast.success(deleted.message || t("transfer_deleted"));
      navigate("/warehouse_transfers");
    } catch (err) {
      toast.error(err || t("error", { ns: "translation", defaultValue: "Something went wrong" }));
    }
    popupRef.current?.closeModal?.();
  };

  if (loading && !transfer) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={6} />
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("no_record_found", { ns: "translation" })}</p>
        <Button title={t("back", { ns: "translation" })} onClick={() => navigate("/warehouse_transfers")} className="mt-4" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[60vh] space-y-6">
      <div className="flex flex-wrap items-center gap-4 dark:text-white">
        <Button
          type="button"
          onClick={() => navigate("/warehouse_transfers")}
          icon={isRTL ? FiArrowRight : FiArrowLeft}
          className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
          iconClass="!text-lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{transfer.transferNo || t("transfer_details")}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(transfer.status)}`}>
              {transfer.status}
            </span>
          </div>
          <p className="text-slate-500 dark:text-white/50 text-sm mt-1">
            {transfer.date ? String(transfer.date).slice(0, 10) : "—"}
          </p>
        </div>
        {transfer.status === "Pending" && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              title={t("edit")}
              icon={FiEdit2}
              onClick={() => navigate(`/warehouse_transfers/edit/${id}`)}
              className="!rounded-md !bg-white dark:!bg-white/10 !border !border-slate-200 dark:!border-white/20 !text-slate-700 dark:!text-white"
            />
            <Button
              type="button"
              title={t("delete", { ns: "translation", defaultValue: "Delete" })}
              onClick={() => popupRef.current?.openModal?.(transfer)}
              className="!rounded-md !bg-red-50 dark:!bg-red-500/10 !border !border-red-200 dark:!border-red-500/30 !text-red-600 dark:!text-red-300"
            />
            <Button
              type="button"
              title={t("approve")}
              onClick={handleApprove}
              className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !text-white !border-0"
            />
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-200 dark:border-white/10">
          {t("transfer_details")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label={t("transfer_no")} value={transfer.transferNo} />
          <Field label={t("transfer_date")} value={transfer.date ? String(transfer.date).slice(0, 10) : null} />
          <Field label={t("status")} value={transfer.status} />
          <Field label={t("from_warehouse")} value={transfer.fromWarehouseName} />
          <Field label={t("to_warehouse")} value={transfer.toWarehouseName} />
          <Field label={t("approved_by")} value={transfer.approvedBy || "—"} />
          <div className="md:col-span-2 lg:col-span-3 min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">{t("notes")}</p>
            <p className="font-semibold text-slate-900 dark:text-white mt-1 break-words whitespace-pre-wrap">
              {transfer.notes || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-200 dark:border-white/10">
          {t("items")} ({transfer.items?.length || 0})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-500 dark:text-white/40 border-b border-slate-100 dark:border-white/10">
                <th className="px-4 py-3">{t("product")}</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">{t("batch", { defaultValue: "Batch" })}</th>
                <th className="px-4 py-3">{t("expiry", { defaultValue: "Expiry" })}</th>
                <th className="px-4 py-3 text-end">{t("qty")}</th>
              </tr>
            </thead>
            <tbody>
              {(transfer.items || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    {t("no_record_found", { ns: "translation" })}
                  </td>
                </tr>
              ) : (
                transfer.items.map((item, idx) => (
                  <tr key={`${item.variantId}-${idx}`} className="border-b border-slate-50 dark:border-white/5">
                    <td className="px-4 py-3 text-slate-800 dark:text-white/90 break-words">
                      {item.variantName || item.variantId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.sku || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-white/70">
                      {item.batchNo || (item.batchId ? String(item.batchId).slice(-6) : "—")}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-white/70">
                      {item.expiryDate ? String(item.expiryDate).slice(0, 10) : "—"}
                    </td>
                    <td className="px-4 py-3 text-end font-semibold text-slate-900 dark:text-white">
                      {Number(item.qty || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

export default StockTransferDetail;
