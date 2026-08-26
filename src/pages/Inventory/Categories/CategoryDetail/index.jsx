import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import { FaRegEdit } from "react-icons/fa";
import { fetchCategoryById, showCurrentCategory, showCurrentCategoryLoading, clearCurrentCategory } from "store/slices/categorySlice";
import { SkeletonDetail } from "components/Skeleton";

const formatTs = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

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
        <SkeletonDetail fields={6} />
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
  const panelClass =
    "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60";

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
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{row.name}</h1>
            <p className="text-mutedForeground text-sm">
              {t("product:category_detail_title")}
            </p>
          </div>
          <Button
            title={t("edit")}
            icon={FaRegEdit}
            className="!w-auto !rounded-lg !h-11 !px-5 !border border-slate-200 dark:!border-white/25 !text-white dark:!text-white dark:!bg-white/10 hover:!bg-slate-50 dark:hover:!bg-white/20"
            iconClass="!text-lg"
            onClick={() => navigate(`/inventory/categories/edit/${row.id}`)}
            btn="primary"
          />
        </div>

        <div className={`${panelClass} grid grid-cols-1 md:grid-cols-2 gap-6`}>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:category_name")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">{row.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:status")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {row.status === "Active"
                ? t("product:status_active")
                : t("product:status_inactive")}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:created_at")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {formatTs(row.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:updated_at")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {formatTs(row.updatedAt)}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:description")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90 whitespace-pre-wrap">
              {row.description || "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetail;
