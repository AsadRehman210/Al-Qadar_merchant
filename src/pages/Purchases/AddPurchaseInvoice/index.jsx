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
import dayjs from "dayjs";
import {
  createPurchaseInvoice,
  updatePurchaseInvoice,
  updatePurchaseStatus,
  fetchPurchaseInvoiceById,
  showCurrentPurchaseInvoice,
  clearCurrentPurchaseInvoice,
} from "store/slices/purchaseInvoiceSlice";
import { defaultPurchaseLine, PURCHASE_LINE_TYPES } from "../purchaseInvoiceHelpers";
import PurchaseInvoiceForm from "./PurchaseInvoiceForm";

const { add_customer, edit_customer } = rafeeqi_role_ids;

const DEFAULT_PURCHASE_FORM = {
  supplierId: "", date: dayjs().format("YYYY-MM-DD"), expectedDelivery: "",
  warehouseId: "", receiverName: "", products: [defaultPurchaseLine()],
  taxPercent: 0, notes: "", status: "Draft",
  // Set from the start (not left undefined until the "Type of Product"
  // dropdown's own mount effect assigns it) — an undefined -> real-value
  // transition right after mount was one leg of a render-loop chain that
  // used to hammer the variant dropdown API on every load.
  productType: PURCHASE_LINE_TYPES.raw_material,
};

const AddPurchaseInvoice = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const methods = useForm({
    mode: "onChange",
    defaultValues: DEFAULT_PURCHASE_FORM,
  });
  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const current = useSelector(showCurrentPurchaseInvoice);

  useEffect(() => {
    if (id) dispatch(fetchPurchaseInvoiceById(id));
    return () => { if (id) dispatch(clearCurrentPurchaseInvoice()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dispatch]);

  useEffect(() => {
    if (id && current) {
      reset({
        supplierId: current.supplierId,
        date: current.date ? String(current.date).slice(0, 10) : dayjs().format("YYYY-MM-DD"),
        expectedDelivery: current.expectedDelivery ? String(current.expectedDelivery).slice(0, 10) : "",
        warehouseId: current.warehouseId,
        receiverName: current.receiverName || "",
        // API returns expiryDate as a full ISO datetime — the <input type="date">
        // per-line field only matches on the plain YYYY-MM-DD prefix, same as the
        // invoice-level date/expectedDelivery fields above; without this slice the
        // date input silently shows empty on edit even though the value is there.
        products: current.products?.length
          ? current.products.map((p) => ({
              ...p,
              expiryDate: p.expiryDate ? String(p.expiryDate).slice(0, 10) : "",
            }))
          : [defaultPurchaseLine()],
        taxPercent: current.taxPercent ?? 0,
        notes: current.notes || "",
        status: current.status || "Draft",
        productType: current.productType || PURCHASE_LINE_TYPES.raw_material,
      });
    }
  }, [id, current, reset]);

  useEffect(() => {
    if (id && !checkRoleAuth(edit_customer)) {
      toast.error(t("purchase:not_authorized"));
      navigate("/purchases");
    } else if (!id && !checkRoleAuth(add_customer)) {
      toast.error(t("purchase:not_authorized"));
      navigate("/purchases");
    }
  }, [id, navigate, t]);

  const onSubmit = async (data) => {
    if (!data.supplierId) {
      toast.error(t("purchase:supplier_required"));
      return;
    }
    if (!data.warehouseId) {
      toast.error(t("sales:warehouse"));
      return;
    }
    try {
      if (id) {
        await dispatch(updatePurchaseInvoice({ id, data })).unwrap();
        // Status transitions (esp. -> Received) carry stock/cost/journal side
        // effects the generic PUT deliberately never applies — the backend
        // silently ignores `status` there. Only the dedicated PATCH endpoint
        // triggers them, so route any actual status change through it,
        // after the field update above has landed.
        if (data.status && data.status !== current?.status) {
          await dispatch(updatePurchaseStatus({ id, status: data.status })).unwrap();
        }
        toast.success(t("purchase:update_success"));
        navigate(`/purchases/detail/${id}`);
      } else {
        const result = await dispatch(createPurchaseInvoice(data)).unwrap();
        if (data.status && data.status !== "Draft") {
          await dispatch(updatePurchaseStatus({ id: result.id, status: data.status })).unwrap();
        }
        toast.success(t("purchase:save_success"));
        navigate(`/purchases/detail/${result.id}`);
      }
    } catch (err) {
      toast.error(err?.message || err || "");
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
            onClick={() => navigate("/purchases")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {id ? t("purchase:edit_invoice") : t("purchase:add_invoice")}
            </h1>
            <p className="text-mutedForeground">
              {id
                ? t("purchase:update_invoice_desc")
                : t("purchase:add_invoice_desc")}
            </p>
          </div>
        </div>

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60"
          >
            <PurchaseInvoiceForm isEdit={Boolean(id)} paymentStatus={current?.paymentStatus} currentStatus={current?.status} />

            <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
              <Button
                type="button"
                title={t("cancel")}
                onClick={() => navigate("/purchases")}
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

export default AddPurchaseInvoice;
