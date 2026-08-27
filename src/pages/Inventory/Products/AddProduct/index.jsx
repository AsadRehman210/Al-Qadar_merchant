import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import SearchablePaginatedDropdown from "components/SearchablePaginatedDropdown";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { PRODUCT_TYPE_OPTIONS } from "../../inventoryOptions";
import {
  createProduct,
  updateProduct,
  fetchProductById,
  showCurrentProduct,
  clearCurrentProduct,
} from "store/slices/productSlice";
import {
  fetchCategoriesDropdown,
  fetchCategoryById,
  showCategoryDropdownOptions,
  showCategoryDropdownPage,
  showCategoryDropdownHasMore,
  showCategoryDropdownLoading,
} from "store/slices/categorySlice";

const { add_customer } = rafeeqi_role_ids;

/** The product catalog is deliberately bare — name, category, raw-material
 *  flag, status. Everything a purchasable/sellable item actually needs
 *  (SKU, cost, price, stock) lives on its Variants, created separately in
 *  the standalone Variants module. */
const AddProduct = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const existing = useSelector(showCurrentProduct);
  const categoryDropdownOptions = useSelector(showCategoryDropdownOptions);
  const categoryDropdownPage = useSelector(showCategoryDropdownPage);
  const categoryDropdownHasMore = useSelector(showCategoryDropdownHasMore);
  const categoryDropdownLoading = useSelector(showCategoryDropdownLoading);
  const [categorySearch, setCategorySearch] = useState("");

  const categoryOpts = useMemo(
    () => categoryDropdownOptions.map((c) => ({ ...c, title: c.name })),
    [categoryDropdownOptions],
  );

  const [selCategory, setSelCategory] = useState({});
  const [selProductType, setSelProductType] = useState(PRODUCT_TYPE_OPTIONS[0]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      productName: "",
      categoryId: "",
      productType: "Finished Product",
    },
  });

  useEffect(() => {
    dispatch(fetchCategoriesDropdown({ page: 1, search: "" }));
    if (id) dispatch(fetchProductById(id));
    return () => dispatch(clearCurrentProduct());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (id && existing) {
      reset({
        productName: existing.productName || "",
        categoryId: existing.categoryId || "",
        productType: existing.productType || "Finished Product",
      });
      const pt = PRODUCT_TYPE_OPTIONS.find((x) => x.id === existing.productType);
      setSelProductType(pt || PRODUCT_TYPE_OPTIONS[0]);

      if (existing.categoryId) {
        const inFirstPage = categoryOpts.find((c) => c.id === existing.categoryId);
        if (inFirstPage) {
          setSelCategory(inFirstPage);
        } else if (existing.categoryName) {
          // Category referenced by this product isn't in the first dropdown
          // page — the DTO already carries its populated name, use that
          // directly rather than issuing a second lookup.
          setSelCategory({ id: existing.categoryId, title: existing.categoryName, name: existing.categoryName });
        } else {
          dispatch(fetchCategoryById(existing.categoryId)).then((res) => {
            const cat = res?.payload;
            if (cat) setSelCategory({ ...cat, title: cat.name });
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, existing, reset]);

  const handleCategorySearch = (value) => {
    setCategorySearch(value);
    dispatch(fetchCategoriesDropdown({ page: 1, search: value }));
  };

  const handleCategoryLoadMore = () => {
    if (categoryDropdownHasMore && !categoryDropdownLoading) {
      dispatch(fetchCategoriesDropdown({ page: categoryDropdownPage + 1, search: categorySearch }));
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      productName: data.productName,
      categoryId: selCategory?.id || data.categoryId,
      status: "Active",
      productType: selProductType?.id || data.productType,
    };

    try {
      if (id) {
        await dispatch(updateProduct({ id, data: payload })).unwrap();
      } else {
        await dispatch(createProduct(payload)).unwrap();
      }
      toast.success(id ? t("product:product_update_success") : t("product:product_save_success"));
      navigate("/inventory/products");
    } catch (err) {
      toast.error(err || t("product:save_failed"));
    }
  };

  const handleCategorySelect = (v) => {
    setSelCategory(v?.id ? v : {});
    setValue("categoryId", v?.id || "");
    trigger("categoryId");
  };

  if (!checkRoleAuth(add_customer)) return null;

  const isRTL = i18n.language === "ar";

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
            <h1 className="text-3xl font-bold tracking-tight">
              {id ? t("product:edit_product") : t("product:add_product")}
            </h1>
            <p className="text-mutedForeground">{t("product:module_desc")}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label={t("product:product_name")}
              name="productName"
              register={register}
              errors={errors}
              required
              pattern={/[a-zA-Z0-9\s.'-]/}
              minLength={2}
              maxLength={150}
              placeholder={t("product:product_name_placeholder")}
            />
            <SearchablePaginatedDropdown
              label={t("product:category")}
              data={categoryOpts}
              selected={selCategory}
              setSelected={handleCategorySelect}
              enableApiSearch
              onApiSearch={handleCategorySearch}
              hasMore={categoryDropdownHasMore}
              onLoadMore={handleCategoryLoadMore}
              paginationLoading={categoryDropdownLoading}
              loading={categoryDropdownLoading && categoryDropdownPage === 1}
              name="categoryId"
              register={register}
              setValue={setValue}
              trigger={trigger}
              required
              placeholder={t("product:select_category")}
            />
            <SelectDropdown
              label="product:product_type"
              data={PRODUCT_TYPE_OPTIONS}
              selected={selProductType}
              setSelected={(v) => {
                setSelProductType(v);
                setValue("productType", v?.id);
                trigger("productType");
              }}
              name="productType"
              register={register}
              setValue={setValue}
              trigger={trigger}
              valueKey="id"
              placeholder="product:select_product_type"
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-end mt-8 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button
              type="button"
              title={t("cancel")}
              onClick={() => navigate("/inventory/products")}
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

export default AddProduct;
