import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight, FiRotateCcw } from "react-icons/fi";
import Button from "components/Button";
import ActionPopup from "components/ActionPopup";
import { SkeletonDetail } from "components/Skeleton";
import {
import AuditMeta from "components/AuditMeta";
  fetchStockIssueById,
  clearCurrentStockIssue,
  reverseStockIssue,
  showCurrentStockIssue,
  showCurrentStockIssueLoading,
} from "store/slices/stockIssueSlice";

const typeBadge = (t) => {
  if (t === "Damage") return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
  if (t === "Sample") return "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300";
  if (t === "Internal Use") return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
  return "bg-slate-100 text-slate-500";
};

const statusBadge = (s) => {
  if (s === "Reversed") return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
};

const Field = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">{label}</p>
    <p className="font-semibold text-slate-900 dark:text-white mt-1 break-words">{value ?? "—"}</p>
  </div>
);

const StockIssueDetail = () => {
  const { t, i18n } = useTranslation("warehouse");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const issue = useSelector(showCurrentStockIssue);
  const loading = useSelector(showCurrentStockIssueLoading);
  const [reversing, setReversing] = useState(false);
  const reversePopupRef = useRef();

  useEffect(() => {
    if (id) dispatch(fetchStockIssueById(id));
    return () => dispatch(clearCurrentStockIssue());
  }, [id, dispatch]);

  const handleReverse = async () => {
    setReversing(true);
    try {
      await dispatch(reverseStockIssue(id)).unwrap();
      toast.success(t("issue_reverse_success"));
    } catch (err) {
      toast.error(err || t("issue_reverse_failed"));
    } finally {
      setReversing(false);
      reversePopupRef.current?.closeModal?.();
    }
  };

  if (loading && !issue) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={6} />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("no_record_found", { ns: "translation" })}</p>
        <Button title={t("back", { ns: "translation" })} onClick={() => navigate("/warehouse_issues")} className="mt-4" />
      </div>
    );
  }

  const status = issue.status || "Issued";
  const canReverse = status === "Issued";

  return (
    <div className="relative min-h-[60vh] space-y-6">
      <div className="flex flex-wrap items-center gap-4 dark:text-white">
        <Button
          type="button"
          onClick={() => navigate("/warehouse_issues")}
          icon={isRTL ? FiArrowRight : FiArrowLeft}
          className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
          iconClass="!text-lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{issue.issueNo || t("issue_details")}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(status)}`}>
              {status === "Reversed" ? t("status_reversed") : t("status_issued")}
            </span>
            {issue.issueType && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeBadge(issue.issueType)}`}>
                {issue.issueType}
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-white/50 text-sm mt-1">
            {issue.date ? String(issue.date).slice(0, 10) : "—"}
          </p>
        </div>
        {canReverse && (
          <button
            type="button"
            onClick={() => reversePopupRef.current?.openModal?.(issue)}
            disabled={reversing}
            className="px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-sm font-semibold hover:bg-amber-200 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <FiRotateCcw className="h-4 w-4" />
            {t("reverse_issue")}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-rose-400">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-200 dark:border-white/10">
          {t("issue_details")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label={t("issue_no")} value={issue.issueNo} />
          <Field label={t("date")} value={issue.date ? String(issue.date).slice(0, 10) : null} />
          <Field label={t("status", { ns: "translation", defaultValue: "Status" })} value={status === "Reversed" ? t("status_reversed") : t("status_issued")} />
          <Field label={t("warehouse")} value={issue.warehouseName} />
          <Field label={t("issue_type")} value={issue.issueType} />
          <Field label={t("issued_to")} value={issue.issuedTo} />
          <Field label={t("issued_by")} value={issue.issuedBy || "—"} />
          <Field label={t("reference")} value={issue.reference || "—"} />
          <AuditMeta record={issue} />
          {status === "Reversed" && (
            <Field
              label={t("reversed_at")}
              value={issue.reversedAt ? String(issue.reversedAt).slice(0, 19).replace("T", " ") : "—"}
            />
          )}
          <div className="md:col-span-2 lg:col-span-3 min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">{t("notes")}</p>
            <p className="font-semibold text-slate-900 dark:text-white mt-1 break-words whitespace-pre-wrap">
              {issue.notes || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-rose-400">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 pb-2 border-b border-slate-200 dark:border-white/10">
          {t("items")} ({issue.items?.length || 0})
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
              {(issue.items || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    {t("no_record_found", { ns: "translation" })}
                  </td>
                </tr>
              ) : (
                issue.items.map((item, idx) => (
                  <tr key={`${item.variantId}-${item.batchId || idx}`} className="border-b border-slate-50 dark:border-white/5">
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
        ref={reversePopupRef}
        title={t("reverse_issue")}
        description={t("confirm_reverse_issue")}
        confirm={t("yes", { ns: "translation", defaultValue: "Yes" })}
        cancel={t("cancel", { ns: "translation" })}
        onClick={handleReverse}
        loading={reversing}
      />
    </div>
  );
};

export default StockIssueDetail;
