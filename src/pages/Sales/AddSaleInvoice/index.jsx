import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { checkRoleAuth } from "global/helper";
import { toast } from "react-toastify";
import {
  createSaleInvoice,
  updateSaleInvoice,
  updateSaleDeliveryStatus,
  fetchSaleInvoiceById,
  showCurrentSaleInvoice,
} from "store/slices/saleInvoiceSlice";
import {
  fetchQuotationById,
  markQuotationConverted,
  showCurrentQuotation,
  clearCurrentQuotation,
} from "store/slices/quotationSlice";
import SaleInvoiceForm from "./SaleInvoiceForm";

const { add_customer, edit_customer } = rafeeqi_role_ids;

const defaultLine = () => ({ variantId: "", productName: "", qty: 1, price: 0, costPrice: 0, unit: "pcs" });

const DEFAULT_SALE_FORM = {
  customerId: "",
  date: new Date().toISOString().slice(0, 10),
  warehouseId: "",
  receiverName: "",
  products: [defaultLine()],
  taxPercent: 0,
  shippingAddress: "",
  deliveryDate: "",
  notes: "",
  currency: "SAR",
};

const AddSaleInvoice = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { id } = useParams();

  // Set only when we arrived here via Quotation's "Continue to Sale Invoice"
  // — the quote is never touched until this form is actually submitted (see
  // onSubmit), so navigating away or refreshing loses nothing on the quote.
  const fromQuotationId = !id ? location.state?.fromQuotationId : null;

  const methods = useForm({
    mode: "onChange",
    defaultValues: DEFAULT_SALE_FORM,
  });
  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const current = useSelector(showCurrentSaleInvoice);
  const fromQuotation = useSelector(showCurrentQuotation);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchSaleInvoiceById(id))
      .unwrap()
      .then((inv) => {
        if (!inv) return;
        reset({
          ...DEFAULT_SALE_FORM,
          ...inv,
          date: inv.date ? new Date(inv.date).toISOString().slice(0, 10) : DEFAULT_SALE_FORM.date,
          deliveryDate: inv.deliveryDate ? new Date(inv.deliveryDate).toISOString().slice(0, 10) : "",
          products: inv.products?.length > 0 ? inv.products.map((l) => ({ ...defaultLine(), ...l })) : [defaultLine()],
        });
      })
      .catch(() => {});
  }, [id, reset, dispatch]);

  // Customer, warehouse, product, qty, price and tax all copied over from
  // the quote and then locked (see lockProductFields below) — only each
  // line's batch stays editable, since stock may have moved since the quote
  // was made. The quote's own reference batch is prefilled as the starting
  // point, but re-validated for real (and actually consumed) only when this
  // form is submitted.
  useEffect(() => {
    if (!fromQuotationId) return;
    dispatch(fetchQuotationById(fromQuotationId));
    return () => dispatch(clearCurrentQuotation());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, fromQuotationId]);

  useEffect(() => {
    if (!fromQuotationId || !fromQuotation || fromQuotation.id !== fromQuotationId) return;
    reset({
      ...DEFAULT_SALE_FORM,
      customerId: fromQuotation.customerId,
      warehouseId: fromQuotation.warehouseId,
      taxPercent: fromQuotation.taxPercent ?? 0,
      notes: fromQuotation.notes || "",
      currency: fromQuotation.currency || "SAR",
      products: fromQuotation.lines?.length
        ? fromQuotation.lines.map((l) => ({
            ...defaultLine(),
            variantId: l.variantId,
            productName: l.productName,
            qty: l.qty,
            price: l.price,
            unit: l.unit || "pcs",
            batchId: l.batchId || "",
            taxPercent: l.taxPercent ?? null,
          }))
        : [defaultLine()],
    });
  }, [fromQuotation, fromQuotationId, reset]);

  useEffect(() => {
    if (id && !checkRoleAuth(edit_customer)) {
      toast.error(t("sales:not_authorized"));
      navigate("/sales");
    } else if (!id && !checkRoleAuth(add_customer)) {
      toast.error(t("sales:not_authorized"));
      navigate("/sales");
    }
  }, [id, navigate, t]);

  const onSubmit = async (data) => {
    if (!data.customerId) {
      toast.error(t("sales:customer_required"));
      return;
    }
    try {
      if (id) {
        // Product edits move real stock (see sale-invoice-service.update) so
        // the backend only accepts them while still Pending — once
        // InTransit/Delivered/Cancelled, drop products/taxPercent from the
        // payload so the rest of the edit (customer, notes, dates, ...)
        // still saves instead of the whole PUT getting rejected.
        const payload = current?.deliveryStatus && current.deliveryStatus !== "Pending"
          ? (({ products, taxPercent, ...rest }) => rest)(data)
          : data;
        await dispatch(updateSaleInvoice({ id, data: payload })).unwrap();
        // deliveryStatus carries a stock-decrement side effect the generic
        // PUT deliberately never applies (backend silently ignores it there)
        // — only the dedicated PATCH endpoint triggers it, same gap as
        // Purchase Invoice's `status` field.
        if (data.deliveryStatus && data.deliveryStatus !== current?.deliveryStatus) {
          await dispatch(updateSaleDeliveryStatus({ id, status: data.deliveryStatus })).unwrap();
        }
        toast.success(t("sales:update_success"));
        navigate(`/sales/detail/${id}`);
      } else {
        const payload = fromQuotationId
          ? { ...data, convertedFromQuotationId: fromQuotationId, convertedFromQuoteNumber: fromQuotation?.quoteNumber }
          : data;
        const created = await dispatch(createSaleInvoice(payload)).unwrap();
        toast.success(t("sales:save_success"));
        if (fromQuotationId) {
          try {
            await dispatch(markQuotationConverted({ id: fromQuotationId, invoiceId: created.id })).unwrap();
          } catch (err) {
            toast.error(err?.message || err || "");
          }
        }
        navigate(`/sales/detail/${created.id}`);
      }
    } catch (err) {
      toast.error(err || t("sales:save_failed"));
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
            onClick={() => navigate("/sales")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {id ? t("sales:edit_invoice") : t("sales:add_invoice")}
            </h1>
            <p className="text-mutedForeground">
              {id
                ? t("sales:update_invoice_desc")
                : t("sales:add_invoice_desc")}
            </p>
          </div>
        </div>

        {fromQuotationId && (
          <div className="mb-6 p-4 rounded-2xl border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10">
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              {t("sales:converting_quotation", { defaultValue: "Converting" })} {fromQuotation?.quoteNumber || ""}
            </p>
            <p className="text-xs text-purple-600/80 dark:text-purple-300/70 mt-0.5">
              {t("sales:converting_quotation_hint", { defaultValue: "Customer, warehouse and products are locked from the quotation — confirm or change each line's batch below, then save to complete the conversion." })}
            </p>
          </div>
        )}

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60"
          >
            <SaleInvoiceForm isEdit={Boolean(id)} currentDeliveryStatus={current?.deliveryStatus} lockProductFields={Boolean(fromQuotationId)} />

            <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
              <Button
                type="button"
                title={t("cancel")}
                onClick={() => navigate("/sales")}
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

export default AddSaleInvoice;
