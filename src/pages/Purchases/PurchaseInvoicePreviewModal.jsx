import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { HiOutlineArrowDownTray, HiOutlineDocumentText } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";
import { toast } from "react-toastify";
import PurchaseInvoicePreviewContent from "./PurchaseInvoicePreviewContent";

const DownloadButton = ({ onClick, disabled, isDownloading, t, size = "md" }) => {
  const isLarge = size === "lg";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-200 ring-2 ring-teal-400/25 hover:ring-teal-300/40 ${
        isLarge ? "w-full px-5 py-3.5 text-sm" : "px-4 py-2.5 text-sm"
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors ${
          isLarge ? "w-9 h-9" : "w-8 h-8"
        }`}
      >
        {isDownloading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <HiOutlineArrowDownTray className={isLarge ? "h-5 w-5" : "h-4 w-4"} />
        )}
      </span>
      <span className={`flex flex-col items-start leading-tight ${isLarge ? "flex-1" : ""}`}>
        <span>
          {isDownloading ? t("purchase:downloading") : t("purchase:download_pdf")}
        </span>
        {!isDownloading && (
          <span className="text-[10px] font-normal text-white/75">
            {t("purchase:download_pdf_hint")}
          </span>
        )}
      </span>
    </button>
  );
};

const PurchaseInvoicePreviewModal = ({ isOpen, onClose, invoice }) => {
  const { t } = useTranslation();
  const slipRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!slipRef.current || !invoice) return;
    setIsDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(slipRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = 210;
      const pdfH = 297;
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = Math.min((pdfW - 20) / imgW, (pdfH - 30) / imgH);
      const w = imgW * ratio;
      const h = imgH * ratio;
      pdf.addImage(imgData, "PNG", 10, 10, w, h);
      pdf.save(
        `Purchase_Invoice_${invoice.invoiceNumber?.replace(/\s/g, "_") || "invoice"}.pdf`,
      );
    } catch (err) {
      console.error("Download error:", err);
      toast.error(t("purchase:download_failed"));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Transition show={isOpen}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px]" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <TransitionChild
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="relative w-full max-w-[210mm] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-teal-50/50 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 shrink-0">
                    <HiOutlineDocumentText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 truncate">
                      {t("purchase:preview_invoice")}
                    </h3>
                    {invoice?.invoiceNumber && (
                      <p className="text-xs text-slate-500 font-mono truncate">
                        {invoice.invoiceNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:block">
                    <DownloadButton
                      onClick={handleDownload}
                      disabled={isDownloading || !invoice}
                      isDownloading={isDownloading}
                      t={t}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                    aria-label={t("cancel", { ns: "translation" })}
                  >
                    <IoClose className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6 overflow-x-auto overflow-y-auto bg-gradient-to-b from-slate-100/80 to-slate-50 flex-1">
                {invoice && (
                  <PurchaseInvoicePreviewContent ref={slipRef} invoice={invoice} />
                )}
              </div>

              <div className="sm:hidden px-4 py-4 border-t border-slate-200 bg-white/95 backdrop-blur shrink-0">
                <DownloadButton
                  onClick={handleDownload}
                  disabled={isDownloading || !invoice}
                  isDownloading={isDownloading}
                  t={t}
                  size="lg"
                />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PurchaseInvoicePreviewModal;
