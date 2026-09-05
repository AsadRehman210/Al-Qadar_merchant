import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  createCategory,
  updateCategory,
  fetchCategoryById,
  showCurrentCategory,
  clearCurrentCategory,
} from "store/slices/categorySlice";

const { add_customer } = rafeeqi_role_ids;

const AddCategory = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const existing = useSelector(showCurrentCategory);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (id) dispatch(fetchCategoryById(id));
    return () => dispatch(clearCurrentCategory());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (id && existing) {
      reset({
        name: existing.name || "",
        description: existing.description || "",
      });
    }
  }, [id, existing, reset]);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      status: "Active",
    };
    try {
      if (id) {
        await dispatch(updateCategory({ id, data: payload })).unwrap();
        toast.success(t("product:category_update_success"));
      } else {
        await dispatch(createCategory(payload)).unwrap();
        toast.success(t("product:category_save_success"));
      }
      navigate("/inventory/categories");
    } catch (err) {
      toast.error(err || t("product:save_failed"));
    }
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
            onClick={() => navigate("/inventory/categories")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {id ? t("product:edit_category") : t("product:add_category")}
            </h1>
            <p className="text-mutedForeground">
              {t("product:category_module_desc")}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60"
        >
          <div className="grid grid-cols-1 gap-6 w-full">
            <FormInput
              label={t("product:category_name")}
              name="name"
              register={register}
              errors={errors}
              required
              pattern={/[a-zA-Z0-9\s.'-]/}
              minLength={2}
              maxLength={150}
              placeholder={t("product:category_name_placeholder")}
            />
            <FormTextarea
              label={t("product:description")}
              name="description"
              register={register}
              errors={errors}
              rows={4}
              maxLength={500}
              placeholder={t("product:category_description_placeholder")}
              className="!rounded-lg"
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button
              type="button"
              title={t("cancel")}
              onClick={() => navigate("/inventory/categories")}
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

export default AddCategory;
