import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { checkRoleAuth } from "global/helper";
import { toast } from "react-toastify";
import {
  DEFAULT_PRODUCTION_ORDER,
  defaultRawLine,
  defaultOtherCostLine,
} from "../productionHelpers";
import {
  createProductionOrder,
  updateProductionOrder,
  fetchProductionOrderById,
  showCurrentProductionOrder,
  clearCurrentProductionOrder,
} from "store/slices/productionSlice";
import ProductionOrderForm from "./ProductionOrderForm";

const { add_customer, edit_customer } = rafeeqi_role_ids;

const AddProductionOrder = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const existing = useSelector(showCurrentProductionOrder);

  const methods = useForm({
    mode: "onChange",
    defaultValues: DEFAULT_PRODUCTION_ORDER,
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (id) dispatch(fetchProductionOrderById(id));
    return () => dispatch(clearCurrentProductionOrder());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id || !existing) return;
    reset({
      ...DEFAULT_PRODUCTION_ORDER,
      ...existing,
      scheduledDate: existing.scheduledDate ? existing.scheduledDate.slice(0, 10) : "",
      rawLines:
        existing.rawLines?.length > 0
          ? existing.rawLines.map((l) => ({ ...defaultRawLine(), ...l }))
          : [defaultRawLine()],
      otherCostLines:
        existing.otherCostLines?.length > 0
          ? existing.otherCostLines.map((l) => ({ ...defaultOtherCostLine(), ...l }))
          : [defaultOtherCostLine()],
    });
  }, [id, existing, reset]);

  useEffect(() => {
    if (id && !checkRoleAuth(edit_customer)) {
      toast.error(t("production:not_authorized"));
      navigate("/inventory/production");
    } else if (!id && !checkRoleAuth(add_customer)) {
      toast.error(t("production:not_authorized"));
      navigate("/inventory/production");
    }
  }, [id, navigate, t]);

  const onSubmit = async (data) => {
    if (!data.outputVariantId) {
      toast.error(t("production:output_required"));
      return;
    }
    const payload = {
      scheduledDate: data.scheduledDate || undefined,
      outputVariantId: data.outputVariantId,
      outputQuantity: Number(data.outputQuantity) || 0,
      warehouseId: data.warehouseId,
      notes: data.notes || undefined,
      rawLines: (data.rawLines || [])
        .filter((l) => l.variantId)
        .map((l) => ({ variantId: l.variantId, quantity: Number(l.quantity) || 0 })),
      otherCostLines: (data.otherCostLines || [])
        .filter((l) => l.label)
        .map((l) => ({ label: l.label, amount: Number(l.amount) || 0 })),
    };
    try {
      if (id) {
        await dispatch(updateProductionOrder({ id, data: payload })).unwrap();
      } else {
        await dispatch(createProductionOrder(payload)).unwrap();
      }
      toast.success(
        id ? t("production:update_success") : t("production:save_success"),
      );
      navigate("/inventory/production");
    } catch (err) {
      toast.error(err || t("product:save_failed"));
    }
  };

  if (id && !checkRoleAuth(edit_customer)) return null;
  if (!id && !checkRoleAuth(add_customer)) return null;

  const isRTL = i18n.language === "ar";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/inventory/production")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {id ? t("production:edit_order") : t("production:add_order")}
            </h1>
            <p className="text-mutedForeground">
              {id
                ? t("production:edit_order_desc")
                : t("production:add_order_desc")}
            </p>
          </div>
        </div>

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60"
          >
            <ProductionOrderForm />

            <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
              <Button
                type="button"
                title={t("cancel")}
                onClick={() => navigate("/inventory/production")}
                className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
              />
              <Button
                type="submit"
                title={id ? t("update") : t("save")}
                btn="primary"
                loading={isSubmitting}
                className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
              />
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default AddProductionOrder;
