import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiFolder } from "react-icons/fi";
import Button from "components/Button";
import { FaRegEdit } from "react-icons/fa";
import {
  fetchCategoryById,
  showCurrentCategory,
  showCurrentCategoryLoading,
  clearCurrentCategory,
} from "store/slices/categorySlice";
import { SkeletonDetail } from "components/Skeleton";

const formatTs = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-100 dark:border-white/10 last:border-0">
    <span className="text-sm text-slate-500 dark:text-white/50 sm:w-44 shrink-0">{label}</span>
    <span className="text-sm font-medium text-slate-900 dark:text-white">{value || "—"}</span>
  </div>
);

const CategoryDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const row = useSelector(showCurrentCategory);
  const rowLoading = useSelector(showCurrentCategoryLoading);

  useEffect(() => {
    dispatch(fetchCategoryById(id));
    return () => dispatch(clearCurrentCategory());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (rowLoading && !row) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={4} />
      </div>
    );
  }

  if (!row) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("no_record_found")}</p>
        <Button
          title={t("back")}
          onClick={() => navigate("/inventory/categories")}
          className="mt-4"
        />
      </div>
    );
  }

  const isRTL = i18n.language === "ar";
  const cardClass =
    "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-2xl p-6";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/inventory/categories")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300">
              <FiFolder className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight truncate">{row.name}</h1>
              <p className="text-mutedForeground text-sm mt-1">
                {t("product:category_detail_title")}
              </p>
            </div>
          </div>
          <Button
            title={t("edit")}
            icon={FaRegEdit}
            className="!w-auto !rounded-lg !h-11 !px-5 !border-0 !text-white !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)]"
            iconClass="!text-lg"
            onClick={() => navigate(`/inventory/categories/edit/${row.id}`)}
            btn="primary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className={cardClass}>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              {t("basic_info", { defaultValue: "Basic Information" })}
            </h3>
            <p className="text-xs text-slate-500 dark:text-white/50 mb-4">
              {t("product:category_module_desc")}
            </p>
            <InfoRow label={t("product:category_name")} value={row.name} />
            <InfoRow label={t("product:created_at")} value={formatTs(row.createdAt)} />
            <InfoRow label={t("product:updated_at")} value={formatTs(row.updatedAt)} />
          </div>

          <div className={cardClass}>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
              {t("product:description")}
            </h3>
            {row.description ? (
              <p className="text-sm leading-relaxed text-slate-700 dark:text-white/85 whitespace-pre-wrap">
                {row.description}
              </p>
            ) : (
              <p className="text-sm text-slate-400 dark:text-white/40 italic">
                {t("no_description", { defaultValue: "No description provided." })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetail;
