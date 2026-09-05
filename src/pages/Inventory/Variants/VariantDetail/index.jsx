import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import Table from "components/Table";
import TableState from "components/TableState";
import { tableRows } from "global/constant";
import { FaRegEdit } from "react-icons/fa";
import { fetchVariantById, showCurrentVariant, showCurrentVariantLoading, clearCurrentVariant } from "store/slices/variantSlice";
import { fetchProductById, showCurrentProduct } from "store/slices/productSlice";
import { fetchStock, showStock } from "store/slices/stockSlice";
import { fetchStockBatches, showStockBatches, showStockBatchesTotal, showStockBatchesLoading } from "store/slices/stockBatchSlice";
import { SkeletonDetail } from "components/Skeleton";

const formatTs = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const formatDateOnly = (value) => {
  if (!value) return "—";
  try {
    const str = String(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString();
    }
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

const VariantDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const row = useSelector(showCurrentVariant);
  const rowLoading = useSelector(showCurrentVariantLoading);
  const product = useSelector(showCurrentProduct);
  const stock = useSelector(showStock);
  const batches = useSelector(showStockBatches);
  const batchesTotal = useSelector(showStockBatchesTotal);
  const batchesLoading = useSelector(showStockBatchesLoading);

  const [batchPage, setBatchPage] = useState(1);
  const [selBatchRows, setSelBatchRows] = useState(tableRows[0]);

  useEffect(() => {
    dispatch(fetchVariantById(id));
    dispatch(fetchStock({}));
    setBatchPage(1);
    return () => dispatch(clearCurrentVariant());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    dispatch(fetchStockBatches({ variantId: id, page: batchPage, limit: selBatchRows.id }));
  }, [dispatch, id, batchPage, selBatchRows.id]);

  const batchTotalPages = Math.max(1, Math.ceil((batchesTotal || 0) / selBatchRows.id));

  useEffect(() => {
    if (row?.productId) dispatch(fetchProductById(row.productId));
  }, [dispatch, row?.productId]);

  const stockTotal = useMemo(
    () => stock.find((s) => s.variantId === id)?.totalQty ?? 0,
    [stock, id],
  );

  if (rowLoading && !row) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!row) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("no_record_found")}</p>
        <Button
          title={t("back")}
          onClick={() => navigate("/inventory/variants")}
          className="mt-4"
        />
      </div>
    );
  }

  const isRTL = i18n.language === "ar";
  const panelClass =
    "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60";

  const attrs = row.attributes || {};
  const distinctCosts = new Set(batches.map((b) => b.unitCost)).size;
  const distinctExpiries = new Set(batches.map((b) => b.expiryDate || "")).size;
  const hasMixedBatches = batches.length > 1 && (distinctCosts > 1 || distinctExpiries > 1);

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/inventory/variants")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {row.sku}
              {row.variantName ? ` — ${row.variantName}` : ""}
            </h1>
            <p className="text-mutedForeground text-sm">
              {t("product:variant_detail_title")} ·{" "}
              {row.productName || "—"}
            </p>
          </div>
          <Button
            title={t("edit")}
            icon={FaRegEdit}
            className="!w-auto !rounded-lg !h-11 !px-5 !border border-slate-200 dark:!border-white/25 !text-white dark:!text-white dark:!bg-white/10 hover:!bg-slate-50 dark:hover:!bg-white/20"
            iconClass="!text-lg"
            onClick={() => navigate(`/inventory/variants/edit/${row.id}`)}
            btn="primary"
          />
        </div>

        <div className={`${panelClass} grid grid-cols-1 md:grid-cols-2 gap-6`}>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:sku_barcode")}
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {row.sku}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:variant_name")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {row.variantName || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:linked_product")}
            </p>
            <Link
              to={`/inventory/products/detail/${row.productId}`}
              className="text-sm text-teal-700 dark:text-teal-300 hover:underline"
            >
              {row.productName || "—"}
            </Link>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:category")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {product?.categoryName || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:product_type")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {product?.productType === "Raw Material"
                ? t("product:raw_material")
                : t("product:finished_product")}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:stock_quantity")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {stockTotal}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:attr_size_short")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {attrs.Size || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:attr_color_short")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {attrs.Color || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:unit")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {row.unit || "pcs"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-1">
              {t("product:low_stock_qty")}
            </p>
            <p className="text-sm text-slate-900 dark:text-white/90">
              {row.lowStockQty != null ? row.lowStockQty : 0}
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
        </div>

        <div className={`${panelClass} mt-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("product:batch_history")}
            </h2>
            {hasMixedBatches && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                {t("product:batch_mixed_warning")}
              </span>
            )}
          </div>
          <Table className="overflow-hidden">
            <div className="min-w-[560px]">
              <table className="w-full border-collapse text-sm mb-0">
                <thead>
                  <tr className="bg-[var(--color-teal-500)] border-none">
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">
                      {t("product:adj_date")}
                    </th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                      {t("product:stock_quantity")}
                    </th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                      {t("product:batch_expiry")}
                    </th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">
                      {t("product:batch_source")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <TableState loading={batchesLoading} data={batches} colSpan={4}>
                    {batches.map((b) => (
                      <tr
                        key={b.id}
                        className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                      >
                        <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 pl-6 whitespace-nowrap">
                          {formatTs(b.createdAt)}
                        </td>
                        <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 tabular-nums">
                          {b.remainingQty ?? b.qty}{" "}
                          <span className="text-slate-400 dark:text-white/40">/ {b.qty}</span>
                        </td>
                        <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap">
                          {formatDateOnly(b.expiryDate)}
                        </td>
                        <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap pr-6">
                          {b.sourceType}
                          {b.sourceRef ? ` — ${b.sourceRef}` : ""}
                        </td>
                      </tr>
                    ))}
                  </TableState>
                </tbody>
              </table>
            </div>
          </Table>
          {(batchesTotal || 0) > 0 && (
            <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white [&_.pagination_li_a:hover]:!text-teal-600 [&_.pagination_li_a:hover]:!bg-teal-50 dark:[&_.pagination_li_a:hover]:!border-teal-500 dark:[&_.pagination_li_a:hover]:!text-teal-300 dark:[&_.pagination_li_a:hover]:!bg-teal-500/20">
              <div className="flex items-center gap-4">
                <SelectDropdown
                  data={tableRows}
                  selected={selBatchRows}
                  setSelected={(v) => { setSelBatchRows(v); setBatchPage(1); }}
                  hideClear
                  classes="!h-10 !rounded-lg"
                />
                <span className="whitespace-nowrap text-sm text-slate-500 dark:text-white/50">{t("per_page")}</span>
              </div>
              <div className="pagination ltr:ml-auto rtl:mr-auto">
                <ReactPaginate
                  breakLabel="..."
                  nextLabel={<FaAngleRight />}
                  previousLabel={<FaAngleLeft />}
                  onPageChange={(e) => setBatchPage(e.selected + 1)}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={1}
                  pageCount={batchTotalPages}
                  forcePage={batchPage - 1}
                  renderOnZeroPageCount={null}
                  containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VariantDetail;
