import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiEye } from "react-icons/fi";
import { FaRegEdit } from "react-icons/fa";
import Button from "components/Button";
import { fetchProductById, showCurrentProduct, showCurrentProductLoading, clearCurrentProduct } from "store/slices/productSlice";
import { fetchVariants, showVariants, showVariantsLoading } from "store/slices/variantSlice";
import { fetchStock, showStock, showStockLoading } from "store/slices/stockSlice";
import { SkeletonDetail } from "components/Skeleton";
import TableState from "components/TableState";
import AuditMeta from "components/AuditMeta";

const formatTs = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const ProductDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const product = useSelector(showCurrentProduct);
  const productLoading = useSelector(showCurrentProductLoading);
  const variants = useSelector(showVariants);
  const variantsLoading = useSelector(showVariantsLoading);
  const stock = useSelector(showStock);
  const stockLoading = useSelector(showStockLoading);

  useEffect(() => {
    dispatch(fetchProductById(id));
    dispatch(fetchVariants({ productId: id }));
    dispatch(fetchStock({}));
    return () => dispatch(clearCurrentProduct());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (productLoading && !product) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("no_record_found")}</p>
        <Button
          title={t("back")}
          onClick={() => navigate("/inventory/products")}
          className="mt-4"
        />
      </div>
    );
  }

  const isRTL = i18n.language === "ar";
  const panelClass =
    "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60";

  const stockByVariant = (variantId) => stock.find((s) => s.variantId === variantId)?.totalQty ?? 0;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/inventory/products")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {product.productName}
              </h1>
              {product.productType === "Raw Material" && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  {t("product:raw_material")}
                </span>
              )}
            </div>
            <p className="text-mutedForeground text-sm">
              {t("product:detail_title")} · {product.categoryName || "—"}
            </p>
          </div>
          <Button
            title={t("edit")}
            icon={FaRegEdit}
            className="!w-auto !rounded-lg !h-11 !px-5 !border border-slate-200 dark:!border-white/25 !text-white dark:!text-white dark:!bg-white/10 hover:!bg-slate-50 dark:hover:!bg-white/20"
            iconClass="!text-lg"
            onClick={() => navigate(`/inventory/products/edit/${product.id}`)}
            btn="primary"
          />
        </div>

        <div className={`${panelClass} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:product_name")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {product.productName}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:category")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {product.categoryName || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:product_type")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {product.productType === "Raw Material"
                ? t("product:raw_material")
                : t("product:finished_product")}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:created_at")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {formatTs(product.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:updated_at")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {formatTs(product.updatedAt)}
            </p>
          </div>
          <AuditMeta record={product} />
        </div>

        <div className={`${panelClass} mt-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("product:variants")}
            </h2>
            <Link
              to="/inventory/variants/add"
              className="text-sm font-semibold text-teal-600 dark:text-teal-300 hover:underline"
            >
              {t("product:add_variant")}
            </Link>
          </div>
          {variantsLoading ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/15">
              <table className="w-full text-sm">
                <tbody>
                  <TableState loading data={[]} colSpan={6} />
                </tbody>
              </table>
            </div>
          ) : variants.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-white/60">—</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/15">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 dark:bg-white/10 text-left">
                    <th className="px-4 py-2 font-semibold">{t("product:sku_barcode")}</th>
                    <th className="px-4 py-2 font-semibold">{t("product:variant_name")}</th>
                    <th className="px-4 py-2 font-semibold">{t("product:attr_size_short")}</th>
                    <th className="px-4 py-2 font-semibold">{t("product:attr_color_short")}</th>
                    <th className="px-4 py-2 font-semibold">{t("product:stock_quantity")}</th>
                    <th className="px-4 py-2 font-semibold w-12" />
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id} className="border-t border-slate-200 dark:border-white/10">
                      <td className="px-4 py-2 font-medium">{v.sku}</td>
                      <td className="px-4 py-2">{v.variantName || "—"}</td>
                      <td className="px-4 py-2">{v.attributes?.Size || "—"}</td>
                      <td className="px-4 py-2">{v.attributes?.Color || "—"}</td>
                      <td className="px-4 py-2">{stockLoading ? "—" : stockByVariant(v.id)}</td>
                      <td className="px-4 py-2">
                        <Link
                          to={`/inventory/variants/detail/${v.id}`}
                          className="text-slate-500 dark:text-white/80 hover:text-teal-600 dark:hover:text-teal-300"
                          title={t("view")}
                        >
                          <FiEye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
