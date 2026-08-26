import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FiDownload } from "react-icons/fi";
import FallBackAvatar from "assets/images/avatar.png";
import { formatImageUrl } from "global/helper";
import Popup from "./Popup";
import { Document, Page, pdfjs } from "react-pdf";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Separate component so only the button re-renders during download — avoids image/PDF reload
const DownloadButton = ({
  onDownload,
  variant = "thumbnail",
  className = "",
  title = "Download",
  downloadingLabel = "Downloading...",
  downloadLabel = "Download",
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const handleClick = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      await onDownload(e);
    } finally {
      setIsDownloading(false);
    }
  };
  if (variant === "popup") {
    return (
      <button
        onClick={handleClick}
        disabled={isDownloading}
        className={`absolute top-4 right-4 rtl:right-auto rtl:left-4 bg-white hover:bg-blue-50 p-3 rounded-full shadow-lg transition-colors duration-200 flex items-center gap-2 z-10 disabled:opacity-80 disabled:cursor-not-allowed ${className}`}
        title={title}
      >
        {isDownloading ? (
          <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        ) : (
          <FiDownload className="text-blue-600 text-lg" />
        )}
        <span className="text-blue-600 font-medium">
          {isDownloading ? downloadingLabel : downloadLabel}
        </span>
      </button>
    );
  }
  return (
    <button
      onClick={handleClick}
      disabled={isDownloading}
      className={`absolute bottom-2 left-2 rtl:left-auto rtl:right-2 bg-white hover:bg-blue-50 p-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 hover:opacity-100 transition pointer-events-auto cursor-pointer z-20 disabled:opacity-80 disabled:cursor-not-allowed min-w-[28px] min-h-[28px] flex items-center justify-center ${className}`}
      title={title}
    >
      {isDownloading ? (
        <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      ) : (
        <FiDownload className="text-blue-600 text-sm" />
      )}
    </button>
  );
};

const DownLoadImageWithFallback = ({
  src,
  alt = "Rafeeqi Admin",
  className = "",
  isSimple,
  fontSize = 0.43,
  bold = false,
  isBaseURL = true,
  forcePdf = false,
  fallbackSrc = `https://ui-avatars.com/api/?name=${alt}&length=${
    alt.split(" ").length
  }&color=713bce&background=f0ebfa&font-size=${fontSize}&bold=${bold}`,
  ...props
}) => {
  const { t, i18n } = useTranslation();
  const resolvedAlt = alt ?? t("rafeeqi_admin");
  const [imgSrc, setImgSrc] = useState(fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdf, setIsPdf] = useState(false);
  const [popupPdfError, setPopupPdfError] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [popupImageLoading, setPopupImageLoading] = useState(true);
  const popupRef = useRef();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (src) {
      setIsLoading(true);
      setPopupPdfError(false);
      setPdfLoadError(false);
      const formattedSrc = isBaseURL ? formatImageUrl(src) : src;

      if (forcePdf && typeof formattedSrc === "string") {
        setIsPdf(true);
        setImgSrc(formattedSrc);
        return;
      }

      // Ensure formattedSrc is a string before calling split
      if (typeof formattedSrc === "string") {
        const ext = formattedSrc.split(".").pop()?.toLowerCase();
        const isBase64Pdf = formattedSrc.startsWith("data:application/pdf");
        setIsPdf(ext === "pdf" || isBase64Pdf);
        setImgSrc(formattedSrc);
        if (ext !== "pdf" && !isBase64Pdf) setPopupImageLoading(true);
      } else {
        // If formattedSrc is not a string, use the original src or fallback
        setImgSrc(isSimple ? FallBackAvatar : fallbackSrc);
        setIsPdf(false);
        setPopupPdfError(false);
        setIsLoading(false);
        setPopupImageLoading(false);
      }
    } else {
      setImgSrc(isSimple ? FallBackAvatar : fallbackSrc);
      setIsPdf(false);
      setPopupPdfError(false);
      setIsLoading(false);
      setPopupImageLoading(false);
    }
  }, [src, isSimple, fallbackSrc, isBaseURL, forcePdf]);

  const handleError = () => {
    if (isPdf) {
      setPdfLoadError(true);
    } else {
      setImgSrc(isSimple ? FallBackAvatar : fallbackSrc);
      setIsPdf(false);
    }
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    if (!isMountedRef.current) return;
    setNumPages(numPages);
    setIsLoading(false);
    setPdfLoadError(false);
  };

  const onDocumentLoadError = (error) => {
    if (!isMountedRef.current) return;
    if (error?.message?.includes?.("Worker was terminated")) return;
    setPdfLoadError(true);
    setIsLoading(false);
  };

  // Separate handlers for popup iframe
  const handlePopupError = () => {
    setPopupPdfError(true);
  };

  const handlePopupLoad = () => {
    setPopupPdfError(false);
  };

  const handleDownload = async (e) => {
    e?.stopPropagation?.();
    try {
      const response = await fetch(imgSrc, { mode: "cors" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const ext =
        typeof imgSrc === "string"
          ? imgSrc.split(".").pop()?.toLowerCase()
          : "jpg";
      link.href = url;
      link.download = `${resolvedAlt || "file"}.${ext || "jpg"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleClick = () => {
    if (popupRef.current) {
      popupRef.current.openModal();
    }
  };

  const openPdfInNewTab = () => {
    window.open(imgSrc, "_blank");
  };

  const PopupContent = () => (
    <div className="relative" dir={i18n.dir()}>
      {isPdf ? (
        <div className="w-full h-[70vh]">
          {popupPdfError ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-md">
              <div className="text-center mb-4">
                <p className="text-gray-600 mb-2">
                  {t("pdf_cannot_display_popup")}
                </p>
                <p className="text-sm text-gray-500">
                  {t("pdf_browser_restrictions")}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={openPdfInNewTab}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {t("open_pdf_new_tab")}
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FiDownload className="text-sm" />
                  {t("download_pdf")}
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full overflow-y-auto flex justify-center bg-white">
              <Document
                file={imgSrc}
                onLoadSuccess={handlePopupLoad}
                onLoadError={handlePopupError}
                loading={
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                    <span className="text-gray-600 font-medium">
                      {t("loading_pdf")}
                    </span>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-red-600 mb-4 font-medium">
                      {t("failed_load_pdf")}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={openPdfInNewTab}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        {t("open_in_new_tab")}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        {t("download_pdf")}
                      </button>
                    </div>
                  </div>
                }
              >
                <Page
                  pageNumber={1}
                  width={Math.min(window.innerWidth * 0.8, 850)}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="mb-4"
                />
              </Document>
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex justify-center min-h-[70vh] w-full">
          {popupImageLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-md z-10">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
              <span className="text-gray-600 font-medium">
                {t("loading_image")}
              </span>
            </div>
          )}
          <img
            src={imgSrc}
            alt={resolvedAlt}
            className="max-w-full max-h-[70vh] object-contain rounded-md"
            onLoad={() => {
              handleLoad();
              setPopupImageLoading(false);
            }}
            onError={() => {
              handleError();
              setPopupImageLoading(false);
            }}
          />
        </div>
      )}

      {/* Download button in popup — own state so parent/image doesn't re-render */}
      <DownloadButton
        onDownload={handleDownload}
        variant="popup"
        title={t("download")}
        downloadLabel={t("download")}
        downloadingLabel={t("downloading")}
      />
    </div>
  );

  return (
    <>
      <div
        className={`relative group inline-block cursor-pointer ${
          className || ""
        }`}
        dir={i18n.dir()}
        onClick={handleClick}
      >
        {isLoading && !isPdf && (
          <div className="absolute inset-0 flex items-center justify-center bg-white animate-pulse rounded-lg z-10">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        {isPdf ? (
          <div
            className={`relative rounded-lg border border-gray-300 bg-white ${className} overflow-hidden`}
          >
            {/* Loading state for PDF */}
            {isLoading && !pdfLoadError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
                <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
                {/* <span className="text-xs text-gray-600">Loading...</span> */}
              </div>
            )}

            {/* PDF rendering with react-pdf */}
            {!pdfLoadError ? (
              <div
                className={`transition-opacity duration-300 ${
                  isLoading ? "opacity-0" : "opacity-100"
                }`}
              >
                <Document
                  file={imgSrc}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading=""
                  error=""
                >
                  <Page
                    pageNumber={1}
                    width={150}
                    height={150}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="pdf-thumbnail"
                  />
                </Document>
              </div>
            ) : (
              /* Error fallback */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-red-600 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 3v6a1 1 0 001 1h6"
                  />
                </svg>
                <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  PDF
                </div>
                <span className="text-[10px] text-gray-600 mt-1">
                  {t("click_to_view")}
                </span>
              </div>
            )}
          </div>
        ) : (
          <img
            src={imgSrc}
            alt={resolvedAlt}
            className={`${className} rounded-lg object-cover`}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        )}

        {/* Download Icon — own state so image/PDF doesn't re-reload */}
        <DownloadButton
          onDownload={handleDownload}
          variant="thumbnail"
          title={t("download")}
        />
      </div>

      {/* Popup for full view */}
      <Popup ref={popupRef} title={resolvedAlt} className="max-w-4xl">
        <PopupContent />
      </Popup>
    </>
  );
};

export default DownLoadImageWithFallback;
