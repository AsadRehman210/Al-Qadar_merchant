import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import { SkeletonDetail } from "components/Skeleton";
import {
  fetchQuarantineLotById,
  showCurrentQuarantineLot,
  showCurrentQuarantineLotLoading,
  clearCurrentQuarantineLot,
} from "store/slices/quarantineLotSlice";

const STATUS_BADGE = {
  Open: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  Partial: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  Consumed: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
};

const QuarantineDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const lot = useSelector(showCurrentQuarantineLot);
  const loading = useSelector(showCurrentQuarantineLotLoading);

  useEffect(() => {
    dispatch(fetchQuarantineLotById(id));
    return () => dispatch(clearCurrentQuarantineLot());
  }, [dispatch, id]);

  if (loading && !lot) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={6} />
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("product:quarantine_empty")}</p>
        <Button title={t("back")} onClick={() => navigate("/inventory/quarantine")} className="mt-4" />
      </div>
    );
  }

  const canRenew = (lot.remainingQty || 0) > 0;
  const panelCls = "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-6 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/inventory/quarantine")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{lot.lotNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[lot.status] || ""}`}>
                {t(`product:quarantine_st_${(lot.status || "").toLowerCase()}`)}
              </span>
            </div>
            <p className="text-mutedForeground text-sm mt-1">{t("product:quarantine_held_hint")}</p>
          </div>
          {canRenew && (
            <Button
              title={t("product:quarantine_renew")}
              btn="primary"
              onClick={() => navigate(`/inventory/production/add?lotId=${lot.id}`)}
              className="!w-auto !rounded-md !h-11 !px-5 !border-0 !text-white !bg-teal-500"
            />
          )}
        </div>

        <div className={panelCls}>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { label: t("product:quarantine_product"), value: lot.productName || lot.variantName || "—" },
              { label: t("product:sku"), value: lot.sku || "—" },
              { label: t("product:quarantine_qty"), value: lot.qty },
              { label: t("product:quarantine_remaining"), value: lot.remainingQty },
              { label: t("product:warehouse"), value: lot.warehouseName || "—" },
              { label: t("product:quarantine_reason"), value: lot.reason || "—" },
              { label: t("product:quarantine_source"), value: lot.sourceRef || "—" },
              {
                label: t("product:quarantine_original_invoice"),
                value: lot.originalInvoiceId ? (
                  <Link to={`/sales/detail/${lot.originalInvoiceId}`} className="text-teal-600 hover:underline">
                    {lot.originalInvoiceNumber || "—"}
                  </Link>
                ) : "—",
              },
              { label: t("product:quarantine_customer"), value: lot.customerName || "—" },
              { label: t("product:quarantine_date"), value: lot.createdAt ? String(lot.createdAt).slice(0, 10) : "—" },
            ].map((f) => (
              <div key={f.label} className="flex justify-between gap-4">
                <dt className="text-mutedForeground">{f.label}</dt>
                <dd className="font-medium text-slate-800 dark:text-white/90 text-end">{f.value}</dd>
              </div>
            ))}
          </dl>
          <h3 className="font-bold mt-7 mb-3">{t("product:quarantine_held_items")}</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90 w-12">{t("sales:sr_no")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("product:quarantine_product")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("product:sku")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("product:quarantine_qty")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("product:quarantine_remaining")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("product:quarantine_cost")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90">{t("product:quarantine_unit")}</th>
                  <th className="px-3 py-2.5 text-start text-xs font-semibold text-white/90 whitespace-nowrap">{t("sales:expiry_date")}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-3 py-2.5 tabular-nums text-slate-600 dark:text-white/70 font-medium">1</td>
                  <td className="px-3 py-2.5">{lot.productName || lot.variantName || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-500">{lot.sku || "—"}</td>
                  <td className="px-3 py-2.5 tabular-nums">{lot.qty}</td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold">{lot.remainingQty}</td>
                  <td className="px-3 py-2.5 tabular-nums">{Number(lot.costPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-3 py-2.5">{lot.unit || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{lot.expiryDate ? String(lot.expiryDate).slice(0, 10) : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {canRenew && (
            <p className="text-xs text-slate-500 dark:text-white/50 mt-6 pt-5 border-t border-slate-200 dark:border-white/15">
              {t("product:quarantine_renew_hint")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuarantineDetail;
