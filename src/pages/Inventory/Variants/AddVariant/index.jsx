import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SearchablePaginatedDropdown from "components/SearchablePaginatedDropdown";
import { SkeletonDetail } from "components/Skeleton";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { fetchProductsDropdown, fetchProductById, showProductDropdownOptions, showProductDropdownPage, showProductDropdownHasMore, showProductDropdownLoading, resetProductDropdown, clearCurrentProduct } from "store/slices/productSlice";
import {

  createVariant,
  updateVariant,
  fetchVariantById,
  showCurrentVariant,
  showCurrentVariantLoading,
  clearCurrentVariant,
} from "store/slices/variantSlice";

const { add_inventory_variant } = alqadar_role_ids;

const buildAttributes = (data) => {
  const attrs = {};
  if (data.attrSize?.trim()) attrs.Size = data.attrSize.trim();
  if (data.attrColor?.trim()) attrs.Color = data.attrColor.trim();
  return attrs;
};

const AddVariant = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(resetProductDropdown());
    };
  }, [dispatch]);

  const navigate = useNavigate();
  const { id } = useParams();

  const existing = useSelector(showCurrentVariant);
  const loading = useSelector(showCurrentVariantLoading);
  const productDropdownOptions = useSelector(showProductDropdownOptions);
  const productDropdownPage = useSelector(showProductDropdownPage);
  const productDropdownHasMore = useSelector(showProductDropdownHasMore);
  const productDropdownLoading = useSelector(showProductDropdownLoading);
  const [productSearch, setProductSearch] = useState("");

  const productOpts = useMemo(
    () =>
      productDropdownOptions.map((p) => ({
        ...p,
        title: p.productName,
      })),
    [productDropdownOptions],
  );

  const [selProduct, setSelProduct] = useState({});

  const { register, handleSubmit, reset, setValue, trigger, formState: { errors } } = useForm({
    mode: "onChange",
    defaultValues: {
      productId: "",
      variantName: "",
      sku: "",
      attrSize: "",
      attrColor: "",
      unit: "",
      lowStockQty: "",
    },
  });

  useEffect(() => {
    dispatch(fetchProductsDropdown({ page: 1, search: "" }));
    if (id) dispatch(fetchVariantById(id));
    return () => {
      dispatch(clearCurrentVariant());
      dispatch(clearCurrentProduct());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (id && existing) {
      const attrs = existing.attributes || {};
      reset({
        productId: existing.productId || "",
        variantName: existing.variantName || "",
        sku: existing.sku || "",
        attrSize: attrs.Size ?? "",
        attrColor: attrs.Color ?? "",
        unit: existing.unit || "pcs",
        lowStockQty: existing.lowStockQty != null && Number(existing.lowStockQty) > 0 ? String(existing.lowStockQty) : "",
      });
      if (existing.productId) {
        const inFirstPage = productOpts.find((p) => p.id === existing.productId);
        if (inFirstPage) {
          setSelProduct(inFirstPage);
        } else if (existing.productName) {
          setSelProduct({ id: existing.productId, title: existing.productName, productName: existing.productName });
        } else {
          dispatch(fetchProductById(existing.productId)).then((res) => {
            const p = res?.payload;
            if (p) setSelProduct({ ...p, title: p.productName });
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, existing, reset]);

  const handleProductSearch = (value) => {
    setProductSearch(value);
    dispatch(fetchProductsDropdown({ page: 1, search: value }));
  };

  const handleProductLoadMore = () => {
    if (productDropdownHasMore && !productDropdownLoading) {
      dispatch(fetchProductsDropdown({ page: productDropdownPage + 1, search: productSearch }));
    }
  };

  const onSubmit = async (data) => {
    const attributes = buildAttributes(data);
    const payload = {
      productId: selProduct?.id || data.productId,
      variantName: data.variantName,
      sku: data.sku,
      attributes,
      unit: data.unit?.trim() || "pcs",
      lowStockQty: Math.max(1, Number(data.lowStockQty)),
    };
    try {
      if (id) {
        await dispatch(updateVariant({ id, data: payload })).unwrap();
        toast.success(t("product:variant_update_success"));
      } else {
        await dispatch(createVariant(payload)).unwrap();
        toast.success(t("product:variant_save_success"));
      }
      navigate("/inventory/variants");
    } catch (err) {
      if (err === "A variant with this SKU already exists.") {
        toast.error(t("product:sku_variant_duplicate"));
      } else {
        toast.error(err || t("product:save_failed"));
      }
    }
  };

  const handleProductSelect = (v) => {
    setSelProduct(v?.id ? v : {});
    setValue("productId", v?.id || "");
    trigger("productId");
  };

  if (!checkRoleAuth(add_inventory_variant)) return null;

  if (id && loading && !existing) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={6} />
      </div>
    );
  }

  const isRTL = i18n.language === "ar";

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
              {id ? t("product:edit_variant") : t("product:add_variant")}
            </h1>
            <p className="text-mutedForeground">
              {t("product:variant_module_desc")}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SearchablePaginatedDropdown
              label={t("product:linked_product")}
              data={productOpts}
              selected={selProduct}
              setSelected={handleProductSelect}
              enableApiSearch
              onApiSearch={handleProductSearch}
              hasMore={productDropdownHasMore}
              onLoadMore={handleProductLoadMore}
              paginationLoading={productDropdownLoading}
              loading={productDropdownLoading && productDropdownPage === 1}
              name="productId"
              register={register}
              setValue={setValue}
              trigger={trigger}
              required
              placeholder={t("product:select_product")}
            />
            <FormInput
              label={t("product:variant_name")}
              name="variantName"
              register={register}
              errors={errors}
              required
              pattern={/[a-zA-Z0-9\s.'-]/}
              minLength={2}
              maxLength={100}
              placeholder={t("product:variant_name_placeholder")}
            />
            <FormInput
              label={t("product:sku_barcode")}
              name="sku"
              register={register}
              errors={errors}
              required
              pattern={/[A-Za-z0-9\-_/]/}
              minLength={2}
              maxLength={100}
              placeholder={t("product:sku_barcode_placeholder")}
            />
            <FormInput
              label={t("product:attr_size_short")}
              name="attrSize"
              register={register}
              errors={errors}
              pattern={/[a-zA-Z0-9\s.'-]/}
              maxLength={50}
              placeholder={t("product:attr_size_placeholder")}
            />
            <FormInput
              label={t("product:attr_color_short")}
              name="attrColor"
              register={register}
              errors={errors}
              pattern={/[a-zA-Z0-9\s.'-]/}
              maxLength={50}
              placeholder={t("product:attr_color_placeholder")}
            />
            <FormInput
              label={t("product:unit")}
              name="unit"
              register={register}
              errors={errors}
              required
              placeholder={t("product:unit_placeholder")}
              pattern={/[a-zA-Z0-9\s./-]/}
              minLength={1}
              maxLength={20}
            />
            <FormInput
              label={t("product:low_stock_qty")}
              name="lowStockQty"
              type="number"
              register={register}
              errors={errors}
              required
              decimal
              decimalPlaces={2}
              maxLength={10}
              placeholder={t("product:low_stock_qty_placeholder")}
              helperText={t("product:low_stock_qty_hint")}
              validate={(value) => {
                if (value === "" || value === undefined || value === null) return true;
                return Number(value) > 0 || t("product:low_stock_qty_zero_error");
              }}
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button
              type="button"
              title={t("cancel")}
              onClick={() => navigate("/inventory/variants")}
              className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
            />
            <Button
              type="submit"
              title={t("product:save")}
              btn="primary"
              className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVariant;
