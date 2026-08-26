import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Camera } from "assets/svgs";
import Error from "images/icons/error.png";
import { toast } from "react-toastify";
import isEqual from "lodash/isEqual";
import { useTranslation } from "react-i18next";

const UploadPreviewImage = ({
  label,
  labelClass,
  onChange,
  errors,
  register,
  name,
  required,
  setValue,
  trigger,
  defaultValue = [],
  maxImages = 5,
  fileType = "both", // "images", "pdf", or "both"
}) => {
  const { t } = useTranslation();
  // State management with combined files
  const [files, setFiles] = useState({
    existing: [],
    new: [],
  });

  const prevFilesRef = useRef([]);
  const blobUrlsRef = useRef(new Set());
  const mountedRef = useRef(false);

  // Helper functions for file type handling
  const getAcceptedFileTypes = () => {
    switch (fileType) {
      case "images":
        return ".png, .jpg, .jpeg";
      case "pdf":
        return ".pdf";
      case "both":
      default:
        return ".png, .jpg, .jpeg, .pdf";
    }
  };

  const isValidFileType = useCallback(
    (file) => {
      const fileName = file.name.toLowerCase();
      const fileMimeType = file.type.toLowerCase();

      switch (fileType) {
        case "images":
          return (
            fileMimeType.startsWith("image/") ||
            fileName.match(/\.(png|jpg|jpeg)$/)
          );
        case "pdf":
          return (
            fileMimeType === "application/pdf" || fileName.endsWith(".pdf")
          );
        case "both":
        default:
          return (
            fileMimeType.startsWith("image/") ||
            fileMimeType === "application/pdf" ||
            fileName.match(/\.(png|jpg|jpeg|pdf)$/)
          );
      }
    },
    [fileType],
  );

  // Initialize with default values
  useEffect(() => {
    if (defaultValue?.length > 0 && !mountedRef.current) {
      setFiles({
        existing: defaultValue,
        new: [],
      });
      prevFilesRef.current = defaultValue;
      mountedRef.current = true;
    }
  }, [defaultValue]);

  // Memoized combined files
  const allFiles = useMemo(
    () => [...files.existing, ...files.new],
    [files.existing, files.new],
  );

  // Generate preview URLs and track blob URLs
  const previewUrls = useMemo(() => {
    const newPreviews = files.new.map((file) => {
      if (file instanceof File) {
        const url = URL.createObjectURL(file);
        blobUrlsRef.current.add(url);
        return url;
      }
      return file;
    });

    return [...files.existing, ...newPreviews];
  }, [files.existing, files.new]);

  // Update form values
  useEffect(() => {
    if (setValue && trigger) {
      setValue(name, allFiles);
      trigger(name);
    }
  }, [allFiles, name, setValue, trigger]);

  // Controlled onChange callback
  useEffect(() => {
    if (!isEqual(prevFilesRef.current, allFiles)) {
      onChange?.(allFiles);
      prevFilesRef.current = [...allFiles];
    }
  }, [allFiles, onChange]);

  // Cleanup blob URLs only on unmount
  useEffect(() => {
    // Store current blob URLs in a variable for cleanup
    const currentBlobUrls = new Set(blobUrlsRef.current);

    return () => {
      currentBlobUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      currentBlobUrls.clear();
    };
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      const newFiles = Array.from(e.target.files || []);
      if (!newFiles.length) return;

      // Validate file types
      const invalidFiles = newFiles.filter((file) => !isValidFileType(file));
      if (invalidFiles.length > 0) {
        const allowedTypes =
          fileType === "images"
            ? "images (PNG, JPG, JPEG)"
            : fileType === "pdf"
              ? "PDF files"
              : "images (PNG, JPG, JPEG) and PDF files";
        toast.error(`Please select only ${allowedTypes}.`);
        return;
      }

      const totalCount =
        files.existing.length + files.new.length + newFiles.length;
      if (totalCount > maxImages) {
        toast.error(`You can upload up to ${maxImages} files.`);
        return;
      }

      setFiles((prev) => ({ ...prev, new: [...prev.new, ...newFiles] }));
      e.target.value = "";
    },
    [files, maxImages, fileType, isValidFileType],
  );

  const removeImage = useCallback((index) => {
    setFiles((prev) => {
      if (index < prev.existing.length) {
        return {
          existing: prev.existing.filter((_, i) => i !== index),
          new: prev.new,
        };
      }
      return {
        existing: prev.existing,
        new: prev.new.filter((_, i) => i !== index - prev.existing.length),
      };
    });
  }, []);

  const getErrorMessage = () => {
    const nameParts = name?.split(/[[\].]+/).filter(Boolean);
    let error = errors;
    for (const part of nameParts) {
      error = error?.[part];
      if (!error) break;
    }
    return error?.message;
  };

  const truncateFileName = (name, maxLength = 20) => {
    if (!name) return "PDF Document";
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength - 3)}...`;
  };

  return (
    <div>
      {label && (
        <label
          className={`text-[14px] text-black font-normal leading-6 mb-1 block ${
            labelClass || ""
          }`}
        >
          {label}
          <span className="text-[#EC1212]">{required ? "*" : ""}</span>
        </label>
      )}
      <div className="flex flex-wrap gap-4">
        {previewUrls.length < maxImages && (
          <div className="size-[120px] shrink-0 flex relative rounded-lg border border-[#EAECF0] flex-col items-center justify-center text-center">
            <Camera className="text-[#637381] text-[26px]" />
            <p className="text-black underline text-[10px] font-medium mt-2.5">
              {fileType === "images"
                ? "Add Image"
                : fileType === "pdf"
                  ? "Add PDF"
                  : t("documents:add_document")}
            </p>
            <input
              type="file"
              multiple
              id="upload_image"
              {...register(name)}
              name={name}
              onChange={handleFileChange}
              accept={getAcceptedFileTypes()}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        )}
        {/* preview files based on file type */}
        {previewUrls?.map((url, index) => {
          const file = allFiles[index];
          const fileKey =
            typeof file === "string"
              ? url
              : file instanceof File
                ? `file-${index}-${file.name}-${file.size}-${file.lastModified}`
                : `item-${index}`;
          const isPdf =
            file?.type === "application/pdf" ||
            (typeof file === "string" && file.includes(".pdf")) ||
            (typeof url === "string" &&
              (url.includes(".pdf") || url.startsWith("data:application/pdf")));

          return (
            <div key={fileKey} className="relative size-[120px] shrink-0">
              {isPdf ? (
                <div className="w-full h-full rounded-lg border border-[#EAECF0] flex flex-col items-center justify-center bg-gray-50">
                  <div className="text-red-500 text-2xl mb-1">📄</div>
                  <p className="text-xs text-gray-600 text-center px-2">
                    {truncateFileName(
                      file?.name ||
                        (typeof url === "string" &&
                        url.startsWith("data:application/pdf")
                          ? "PDF File"
                          : typeof url === "string"
                            ? url.split("/").pop()
                            : "PDF Document"),
                    )}
                  </p>
                </div>
              ) : (
                <img
                  src={url}
                  alt="Preview"
                  className="object-cover w-full h-full rounded-lg"
                />
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-1 -right-1 size-5 flex justify-center text-xs items-center bg-red-500 text-white rounded-full"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
      {getErrorMessage() && (
        <p className="text-red text-xs flex items-center gap-2 mt-1 font-medium">
          <img src={Error} className="" />
          {getErrorMessage()}
        </p>
      )}
      {previewUrls.length > maxImages && (
        <p className="text-xs text-gray-500 mt-1">
          {previewUrls.length}/{maxImages} files
        </p>
      )}
    </div>
  );
};

export default UploadPreviewImage;
