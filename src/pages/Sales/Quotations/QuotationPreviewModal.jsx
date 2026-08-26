import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { HiOutlineArrowDownTray } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";
import QuotationPreviewContent from "./QuotationPreviewContent";

const QuotationPreviewModal = ({ isOpen, onClose, quote }) => {
  const { t } = useTranslation();
  const slipRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!slipRef.current || !quote) return;
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
        `Quotation_${quote.quoteNumber?.replace(/\s/g, "_") || "quotation"}.pdf`,
      );
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Transition show={isOpen}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <div className="fixed inset-0 bg-black/40" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <TransitionChild
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="relative w-full max-w-[210mm] rounded-2xl bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-teal-50/40">
                <h3 className="text-lg font-semibold text-slate-900">
                  {t("sales:preview_quotation")}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isDownloading || !quote}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 disabled:opacity-60 transition-colors"
                  >
                    <HiOutlineArrowDownTray className="h-5 w-5" />
                    {isDownloading ? t("sales:downloading") : t("sales:download_pdf")}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                  >
                    <IoClose className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-x-auto max-h-[80vh] overflow-y-auto bg-slate-100/50">
                {quote && (
                  <QuotationPreviewContent ref={slipRef} quote={quote} />
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default QuotationPreviewModal;
