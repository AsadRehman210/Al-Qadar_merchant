import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const FileUpload = ({
  file,
  onChange,
  accept = "application/pdf",
  disabled = false,
}) => {
  const { t } = useTranslation();
  const handleChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      // Check if file is a PDF
      if (selected.type !== "application/pdf") {
        toast.error(t("booking:only_pdf_allowed"));
        return;
      }
      onChange(selected);
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div className="flex flex-col w-full max-w-md">
      <label className="text-sm text-linkText font-medium leading-6 mb-1 block">
        {t("booking:upload_tafweej_document")}
      </label>

      {!file ? (
        <div className="flex items-center justify-center w-full">
          <label
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
              disabled
                ? "bg-gray-100 border-gray-300 text-gray-400"
                : "bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-600"
            } transition-colors duration-200`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-10 h-10 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mb-2 text-sm">
                <span className="font-semibold">
                  {t("booking:click_to_upload")}
                </span>{" "}
                {t("booking:or_drag_and_drop")}
              </p>
              <p className="text-xs text-gray-500">{t("booking:pdf_only")}</p>
            </div>
            <input
              type="file"
              accept={accept}
              onChange={handleChange}
              disabled={disabled}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-1">
          {/* File info and remove button */}
          <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center flex-1 min-w-0">
              <svg
                className="flex-shrink-0 w-5 h-5 text-green-500 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span
                dir="ltr"
                className="text-sm font-medium text-green-700 truncate ltr:text-start rtl:text-end"
              >
                {file.name}
              </span>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-1 rounded-full hover:bg-green-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Remove file"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
