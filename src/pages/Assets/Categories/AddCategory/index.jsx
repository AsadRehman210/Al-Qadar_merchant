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
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { assetActiveInactiveOptions } from "global/constant";
import {
  fetchAssetCategories,
  createAssetCategory,
  updateAssetCategory,
  showAssetCategories,
  showAssetCategoriesLoading,
} from "store/slices/assetSlice";
import { SkeletonDetail } from "components/Skeleton";

const { add_asset_category, edit_asset_category } = alqadar_role_ids;

const AddAssetCategory = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const categories = useSelector(showAssetCategories);
  const categoryLoading = useSelector(showAssetCategoriesLoading);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!categories.length) dispatch(fetchAssetCategories());
  }, [dispatch, categories.length]);

  const existing = useMemo(
    () => categories.find((c) => c.id === id),
    [categories, id],
  );

  const [selStatus, setSelStatus] = useState(assetActiveInactiveOptions[0]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    mode: "onChange",
    defaultValues: {
      code: "",
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        code: existing.code || "",
        name: existing.name || "",
        description: existing.description || "",
      });
      const st = assetActiveInactiveOptions.find((x) => x.id === existing.status);
      setSelStatus(st || assetActiveInactiveOptions[0]);
    }
  }, [existing, reset]);

  useEffect(() => {
    if (id && !checkRoleAuth(edit_asset_category)) {
      toast.error(t("asset:not_authorized"));
      navigate("/assets-categories");
    } else if (!id && !checkRoleAuth(add_asset_category)) {
      toast.error(t("asset:not_authorized"));
      navigate("/assets-categories");
    }
  }, [id, navigate, t]);

  const onSubmit = async (data) => {
    if (!String(data.code || "").trim()) {
      toast.error(t("asset:code_required"));
      return;
    }
    if (!String(data.name || "").trim()) {
      toast.error(t("asset:name_required"));
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...data, status: selStatus?.id || "Active" };
      if (id) {
        await dispatch(updateAssetCategory({ id, data: payload })).unwrap();
      } else {
        await dispatch(createAssetCategory(payload)).unwrap();
      }
      toast.success(id ? t("asset:update_success") : t("asset:save_success"));
      navigate("/assets-categories");
    } catch (message) {
      toast.error(message || t("asset:save_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (id && !checkRoleAuth(edit_asset_category)) return null;
  if (!id && !checkRoleAuth(add_asset_category)) return null;

  const isRTL = i18n.language === "ar";

  const categoryPending = !!id && categoryLoading && !existing;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/assets-categories")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {id ? t("asset:edit_category") : t("asset:add_category")}
            </h1>
            <p className="text-mutedForeground">{t("asset:categories_desc")}</p>
          </div>
        </div>

        {categoryPending ? (
          <SkeletonDetail fields={4} />
        ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label={t("asset:code")}
              name="code"
              register={register}
              errors={errors}
              required
              placeholder="IT"
              pattern={/[A-Za-z0-9\-_/]/}
              minLength={2}
              maxLength={20}
            />
            <FormInput
              label={t("asset:category_name")}
              name="name"
              register={register}
              errors={errors}
              required
              pattern={/[a-zA-Z0-9\s.'-]/}
              minLength={2}
              maxLength={100}
            />
            <div className="md:col-span-2">
              <FormInput
                label={t("asset:description")}
                name="description"
                register={register}
                errors={errors}
                placeholder=""
                maxLength={500}
              />
            </div>
            <SelectDropdown
              label={t("asset:status")}
              data={assetActiveInactiveOptions}
              selected={selStatus}
              setSelected={setSelStatus}
              hideClear
              classes="!h-[46px] !rounded-lg"
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button
              type="button"
              title={t("cancel")}
              onClick={() => navigate("/assets-categories")}
              className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
            />
            <Button
              type="submit"
              title={id ? t("update") : t("save")}
              btn="primary"
              disabled={submitting}
              className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
            />
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default AddAssetCategory;
