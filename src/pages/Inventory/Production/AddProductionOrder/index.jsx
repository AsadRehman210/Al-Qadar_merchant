import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import { SkeletonDetail } from "components/Skeleton";
import { alqadar_role_ids } from "global/alqadarRoles";
import { checkRoleAuth } from "global/helper";
import { toast } from "react-toastify";
import {
  DEFAULT_PRODUCTION_ORDER,
  defaultRawLine,
  defaultOutputLine,
  defaultOtherCostLine,
} from "../productionHelpers";
import {
  createProductionOrder,
  updateProductionOrder,
  fetchProductionOrderById,
  showCurrentProductionOrder,
  showCurrentProductionOrderLoading,
  clearCurrentProductionOrder,
} from "store/slices/productionSlice";
import {
  fetchQuarantineLotById,
  clearCurrentQuarantineLot,
  showCurrentQuarantineLot,
  showCurrentQuarantineLotLoading,
} from "store/slices/quarantineLotSlice";
import ProductionOrderForm from "./ProductionOrderForm";
import { resetVariantDropdown } from "store/slices/variantSlice";
import { resetWarehouseDropdown } from "store/slices/warehouseSlice";

const { add_inventory_production, edit_inventory_production } = alqadar_role_ids;

const AddProductionOrder = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(resetVariantDropdown());
      dispatch(resetWarehouseDropdown());
      dispatch(clearCurrentQuarantineLot());
    };
  }, [dispatch]);

  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const lotId = !id ? searchParams.get("lotId") : null;

  const existing = useSelector(showCurrentProductionOrder);
  const loading = useSelector(showCurrentProductionOrderLoading);
  const currentLot = useSelector(showCurrentQuarantineLot);
  const lotLoading = useSelector(showCurrentQuarantineLotLoading);

  const methods = useForm({
    mode: "onChange",
    defaultValues: DEFAULT_PRODUCTION_ORDER,
  });

  const {
    handleSubmit,
    reset,
    trigger,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (id) dispatch(fetchProductionOrderById(id));
    return () => dispatch(clearCurrentProductionOrder());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!lotId) return;
    let cancelled = false;
    dispatch(fetchQuarantineLotById(lotId))
      .unwrap()
      .then((lot) => {
        if (cancelled || !lot) return;
        reset({
          ...DEFAULT_PRODUCTION_ORDER,
          outputVariantId: lot.variantId || "",
          outputVariantName: lot.variantName || lot.productName || "",
          outputQuantity: lot.remainingQty || "",
          warehouseId: lot.warehouseId || "",
          warehouseName: lot.warehouseName || "",
          outputWarehouseId: lot.warehouseId || "",
          outputWarehouseName: lot.warehouseName || "",
          outputExpiryDate: lot.expiryDate ? String(lot.expiryDate).slice(0, 10) : "",
          outputLines: [
            {
              ...defaultOutputLine(),
              warehouseId: lot.warehouseId || "",
              warehouseName: lot.warehouseName || "",
              quantity: lot.remainingQty || "",
              expiryDate: lot.expiryDate ? String(lot.expiryDate).slice(0, 10) : "",
            },
          ],
          quarantineLotId: lot.id,
          quarantineLotNumber: lot.lotNumber || "",
          quarantineQty: lot.remainingQty || "",
          quarantineCostPrice: lot.costPrice ?? 0,
          notes: lot.lotNumber
            ? t("production:renew_notes", { lot: lot.lotNumber, reason: lot.reason || "" })
            : "",
        });
      })
      .catch((err) => {
        toast.error(err || t("product:quarantine_empty"));
      });
    return () => { cancelled = true; };
  }, [lotId, dispatch, reset, t]);

  useEffect(() => {
    if (!id || !existing) return;
    const legacyOutWh = existing.outputWarehouseId || existing.warehouseId || "";
    reset({
      ...DEFAULT_PRODUCTION_ORDER,
      ...existing,
      completedDate: existing.completedDate
        ? String(existing.completedDate).slice(0, 10)
        : existing.scheduledDate
          ? String(existing.scheduledDate).slice(0, 10)
          : "",
      outputExpiryDate: existing.outputExpiryDate ? String(existing.outputExpiryDate).slice(0, 10) : "",
      outputWarehouseId: legacyOutWh,
      outputWarehouseName: existing.outputWarehouseName || existing.warehouseName || "",
      rawLines:
        existing.rawLines?.length > 0
          ? existing.rawLines.map((l) => ({
              ...defaultRawLine(),
              warehouseId: l.warehouseId || existing.warehouseId || "",
              warehouseName: l.warehouseName || existing.warehouseName || "",
              variantId: l.variantId || "",
              variantName: l.variantName || "",
              sku: l.sku || "",
              quantity: l.quantity ?? "",
              costPrice: l.costPrice ?? "",
            }))
          : [defaultRawLine()],
      outputLines:
        existing.outputLines?.length > 0
          ? existing.outputLines.map((l) => ({
              ...defaultOutputLine(),
              warehouseId: l.warehouseId || legacyOutWh,
              warehouseName: l.warehouseName || existing.outputWarehouseName || "",
              quantity: l.quantity ?? "",
              expiryDate: l.expiryDate ? String(l.expiryDate).slice(0, 10) : "",
            }))
          : [
              {
                ...defaultOutputLine(),
                warehouseId: legacyOutWh,
                warehouseName: existing.outputWarehouseName || existing.warehouseName || "",
                quantity: existing.outputQuantity ?? "",
                expiryDate: existing.outputExpiryDate ? String(existing.outputExpiryDate).slice(0, 10) : "",
              },
            ],
      otherCostLines:
        existing.otherCostLines?.length > 0
          ? existing.otherCostLines.map((l) => ({ ...defaultOtherCostLine(), ...l }))
          : [defaultOtherCostLine()],
      quarantineLotId: existing.quarantineLotId || "",
      quarantineLotNumber: existing.quarantineLotNumber || "",
      quarantineQty: existing.quarantineQty || existing.outputQuantity || "",
      quarantineCostPrice: existing.quarantineCostPrice ?? "",
    });
  }, [id, existing, reset]);

  useEffect(() => {
    if (id && !checkRoleAuth(edit_inventory_production)) {
      toast.error(t("production:not_authorized"));
      navigate("/inventory/production");
    } else if (!id && !checkRoleAuth(add_inventory_production)) {
      toast.error(t("production:not_authorized"));
      navigate("/inventory/production");
    }
  }, [id, navigate, t]);

  const onSubmit = async (data) => {
    if (!data.outputVariantId) {
      toast.error(t("production:output_required"));
      return;
    }
    const outputLines = (data.outputLines || [])
      .filter((l) => l.warehouseId && Number(l.quantity) > 0)
      .map((l) => ({
        warehouseId: l.warehouseId,
        quantity: Number(l.quantity) || 0,
        expiryDate: l.expiryDate || undefined,
      }));
    if (!outputLines.length) {
      toast.error(t("production:output_lines_required"));
      return;
    }
    const rawLines = (data.rawLines || [])
      .filter((l) => l.variantId && l.warehouseId)
      .map((l) => ({
        variantId: l.variantId,
        warehouseId: l.warehouseId,
        quantity: Number(l.quantity) || 0,
        costPrice: l.costPrice != null && l.costPrice !== "" ? Number(l.costPrice) : undefined,
      }));
    const rawMissing = (data.rawLines || []).some(
      (l) => l.variantId && (!l.warehouseId || !(Number(l.quantity) > 0)),
    );
    if (rawMissing) {
      toast.error(t("production:warehouse_required"));
      return;
    }
    const mismatchedOther = (data.otherCostLines || []).some((l) => {
      const hasL = String(l.label || "").trim() !== "";
      const hasA = String(l.amount ?? "").trim() !== "";
      return hasL !== hasA;
    });
    if (mismatchedOther) {
      toast.error(t("production:other_cost_pair", { defaultValue: "Label and amount must both be filled" }));
      return;
    }
    const outputQuantity = outputLines.reduce((s, l) => s + l.quantity, 0);
    const payload = {
      completedDate: data.completedDate || data.scheduledDate || undefined,
      outputVariantId: data.outputVariantId,
      outputQuantity,
      warehouseId: rawLines[0]?.warehouseId || outputLines[0].warehouseId,
      outputWarehouseId: outputLines[0].warehouseId,
      outputExpiryDate: outputLines[0].expiryDate || undefined,
      notes: data.notes || undefined,
      rawLines,
      outputLines,
      otherCostLines: (data.otherCostLines || [])
        .filter((l) => l.label)
        .map((l) => ({ label: l.label, amount: Number(l.amount) || 0 })),
      quarantineLotId: data.quarantineLotId || undefined,
      quarantineQty: data.quarantineLotId ? outputQuantity || undefined : undefined,
    };
    if (!payload.rawLines.length && !payload.quarantineLotId) {
      toast.error(t("production:output_required"));
      return;
    }
    const linesOk = await trigger("rawLines");
    if (!linesOk) {
      toast.error(t("production:qty_exceeds_available"));
      return;
    }
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

  if (id && !checkRoleAuth(edit_inventory_production)) return null;
  if (!id && !checkRoleAuth(add_inventory_production)) return null;

  if ((id && loading && !existing) || (lotId && lotLoading && !currentLot)) {
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
