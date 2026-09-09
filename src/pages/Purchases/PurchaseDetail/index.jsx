import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiCornerDownLeft, FiCheck, FiX } from "react-icons/fi";
import { HiOutlineArrowDownTray } from "react-icons/hi2";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { FaRegEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import { fetchPurchaseInvoiceById, updatePurchaseStatus, addPurchasePayment, addPurchaseRefund, showCurrentPurchaseInvoice, showCurrentPurchaseInvoiceLoading, clearCurrentPurchaseInvoice } from "store/slices/purchaseInvoiceSlice";
import { SkeletonDetail } from "components/Skeleton";
import { checkRoleAuth, formatAmount, lineTotal } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { paymentStatusBadge, purchaseStatusBadge, purchaseStatusOptions } from "global/constant";

const { status_purchase_invoice } = alqadar_role_ids;
import PurchaseInvoicePreviewModal from "../PurchaseInvoicePreviewModal";
import InvoiceDetailsTab from "./InvoiceDetailsTab";
import PaymentHistoryTab from "./PaymentHistoryTab";
import ReturnsTab from "./ReturnsTab";
import NotesTab from "./NotesTab";

const TAB_CLASS =
  "min-w-[140px] whitespace-nowrap cursor-pointer py-3 px-5 rounded-lg h-11 flex justify-center items-center font-medium text-sm text-slate-500 dark:text-white/70 transition-all outline-none data-[selected]:bg-[var(--color-teal-500)] data-[selected]:text-white data-[selected]:font-semibold hover:text-teal-700 hover:bg-teal-500/10 dark:hover:text-white dark:hover:bg-teal-500/20";

const PurchaseDetail = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(clearCurrentPurchaseInvoice());
    };
  }, [dispatch]);
  const navigate = useNavigate();

  const { id } = useParams();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showStatusEdit, setShowStatusEdit] = useState(false);
  const [selNewStatus, setSelNewStatus] = useState(purchaseStatusOptions[0]);

  const invoice = useSelector(showCurrentPurchaseInvoice);
  const invoiceLoading = useSelector(showCurrentPurchaseInvoiceLoading);
  const refresh = () => dispatch(fetchPurchaseInvoiceById(id));

  useEffect(() => {
    if (id) dispatch(fetchPurchaseInvoiceById(id));
  }, [id, dispatch]);

  if (invoiceLoading && !invoice) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">
          {t("no_record_found")}
        </p>
        <Button
          title={t("back")}
          onClick={() => navigate("/purchases")}
          className="mt-4"
        />
      </div>
    );
  }

  const isRTL = i18n.language === "ar";
  const panelClass =
    "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60";

  const sub =
    invoice.subtotal ??
    (invoice.products || []).reduce((s, l) => s + lineTotal(l), 0);

  const taxAmt = invoice.taxAmount ?? 0;

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
          <div className="flex flex-col space-y-2.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  purchaseStatusBadge[invoice.status] || purchaseStatusBadge.Draft
                }`}
              >
                {invoice.status || "—"}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  paymentStatusBadge[invoice.paymentStatus] || paymentStatusBadge.Pending
                }`}
              >
                {invoice.paymentStatus === "Cleared" ? "Paid" : invoice.paymentStatus || "Pending"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-mutedForeground text-sm">
                {invoice.supplierId ? (
                  <Link
                    to={`/suppliers/detail/${invoice.supplierId}`}
                    className="text-teal-700 dark:text-teal-300 hover:underline"
                  >
                    {invoice.supplierName}
                  </Link>
                ) : (
                  invoice.supplierName
                )}{" "}
                • {invoice.date ? String(invoice.date).slice(0, 10) : "-"}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  (Number(invoice.balanceDue) || 0) > 0
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300 ring-1 ring-inset ring-rose-200 dark:ring-rose-500/25"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-500/25"
                }`}
              >
                {t("purchase:balance_due")}: {formatAmount(invoice.balanceDue)} {invoice.currency || "SAR"}
              </span>
              {(Number(invoice.refundDue) || 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 ring-1 ring-inset ring-amber-200 dark:ring-amber-500/25">
                  {t("purchase:refund_due", { defaultValue: "Refund due" })}: {formatAmount(invoice.refundDue)} {invoice.currency || "SAR"}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              type="button"
              title={t("purchase:create_debit_note")}
              icon={FiCornerDownLeft}
              className="!w-auto !rounded-md !h-11 !px-4 !border border-amber-300 !text-amber-600 dark:!text-amber-400 !bg-amber-50 dark:!bg-amber-500/10 hover:!bg-amber-100"
              iconClass="!text-base"
              onClick={() => navigate(`/debit-notes/add?invoiceId=${invoice.id}`)}
            />
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="group inline-flex items-center gap-3 h-11 pl-3 pr-5 rounded-xl bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ring-2 ring-teal-400/20 hover:ring-teal-300/40 dark:shadow-teal-900/30"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
                <HiOutlineArrowDownTray className="h-5 w-5" />
              </span>
              <span className="flex flex-col items-start leading-tight text-left">
                <span className="text-sm">{t("purchase:download_invoice")}</span>
                <span className="text-[10px] font-normal text-white/80">PDF</span>
              </span>
            </button>
            {checkRoleAuth(status_purchase_invoice) && (
              <button
                type="button"
                onClick={() => {
                  setSelNewStatus(purchaseStatusOptions.find((o) => o.id === invoice.status) || purchaseStatusOptions[0]);
                  setShowStatusEdit(!showStatusEdit);
                }}
                className="px-4 py-2 rounded-md border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm font-semibold text-slate-700 dark:text-white hover:bg-slate-50"
              >
                {t("purchase:update_status")}
              </button>
            )}
            <Button
              title={t("edit")}
              icon={FaRegEdit}
              className="!w-auto !rounded-md !h-11 !px-5 !border border-slate-200 dark:!border-white/25 !text-white dark:!text-white dark:!bg-white/10 hover:!bg-slate-50 dark:hover:!bg-white/20"
              iconClass="!text-lg"
              onClick={() => navigate(`/purchases/edit/${invoice.id}`)}
              btn="primary"
            />
          </div>
        </div>

        {checkRoleAuth(status_purchase_invoice) && showStatusEdit && (
          <div className="mb-5 p-4 rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-500/10 flex flex-wrap items-end gap-3">
            <div className="min-w-[160px]">
              <SelectDropdown
                label={t("purchase:status")}
                labelClass="!text-xs"
                data={purchaseStatusOptions}
                selected={selNewStatus}
                setSelected={(o) => setSelNewStatus(o || purchaseStatusOptions[0])}
                hideClear
                classes="!h-9 !rounded-md"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await dispatch(updatePurchaseStatus({ id: invoice.id, status: selNewStatus.id })).unwrap();
                  toast.success(t("purchase:status_updated"));
                  setShowStatusEdit(false);
                } catch (err) {
                  toast.error(err?.message || err || "");
                }
              }}
              className="h-9 px-3 rounded-lg bg-teal-500 text-white text-sm font-semibold"
            >
              <FiCheck className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowStatusEdit(false)}
              className="h-9 px-3 rounded-md bg-slate-200 dark:bg-white/20 text-slate-600 dark:text-white text-sm"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        )}

        <TabGroup>
          <TabList className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg mb-6 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20">
            <Tab className={TAB_CLASS}>{t("purchase:invoice_details")}</Tab>
            <Tab className={TAB_CLASS}>{t("purchase:payment_history")}</Tab>
            <Tab className={TAB_CLASS}>{t("purchase:returns_tab", { defaultValue: "Returns & Refunds" })}</Tab>
            <Tab className={TAB_CLASS}>{t("purchase:notes_tab")}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <InvoiceDetailsTab
                invoice={invoice}
                panelClass={panelClass}
                sub={sub}
                taxAmt={taxAmt}
              />
            </TabPanel>
            <TabPanel>
              <PaymentHistoryTab
                invoice={invoice}
                panelClass={panelClass}
                onRefresh={refresh}
                onAddPayment={(data) => dispatch(addPurchasePayment({ id: invoice.id, data })).unwrap()}
              />
            </TabPanel>
            <TabPanel>
              <ReturnsTab
                invoice={invoice}
                panelClass={panelClass}
                onRefresh={refresh}
                onAddRefund={(data) => dispatch(addPurchaseRefund({ id: invoice.id, data })).unwrap()}
              />
            </TabPanel>
            <TabPanel>
              <NotesTab invoice={invoice} panelClass={panelClass} />
            </TabPanel>
          </TabPanels>
        </TabGroup>

        <PurchaseInvoicePreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          invoice={invoice}
        />
      </div>
    </div>
  );
};

export default PurchaseDetail;
