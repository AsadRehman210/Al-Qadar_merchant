import { useEffect, useState, useCallback } from "react";
import Pencil from "images/icons/pencil.png";
import { useTranslation } from "react-i18next";
import { MdAddAPhoto } from "react-icons/md";
import Error from "images/icons/error.png";
import { formatImageUrl } from "../global/helper";
import { toast } from "react-toastify";

const UploadFilePreview = ({
  onChange,
  errors,
  register,
  name,
  required,
  setValue,
  trigger,
  defaultValue,
  fileType = "images", // "images", "pdf", or "both"
  maxSizeBytes,
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [view, setView] = useState(null);
  const { t } = useTranslation();

  // Helper functions for file type handling
  const getAcceptedFileTypes = useCallback(() => {
    switch (fileType) {
      case "images":
        return ".png, .jpg, .jpeg";
      case "pdf":
        return ".pdf";
      case "both":
      default:
        return ".png, .jpg, .jpeg, .pdf";
    }
  }, [fileType]);

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
    [fileType]
  );

  useEffect(() => {
    // Set the input value and trigger validation when change to bind with react hook form
    if (view && setValue && trigger) {
      setValue(name, view);
      trigger(name);
    }
  }, [view, setValue, trigger, name]);

  // handle image selection function
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!isValidFileType(file)) {
      const allowedTypes =
        fileType === "images"
          ? "images (PNG, JPG, JPEG)"
          : fileType === "pdf"
          ? "PDF files"
          : "images (PNG, JPG, JPEG) and PDF files";
      toast.error(`Please select only ${allowedTypes}.`);
      event.target.value = ""; // Clear the input
      return;
    }

    if (maxSizeBytes && file.size > maxSizeBytes) {
      const mb = Math.round(maxSizeBytes / (1024 * 1024));
      toast.error(t("logo_too_large", { defaultValue: "File must be {{size}} MB or smaller.", size: mb }));
      event.target.value = "";
      return;
    }

    setView(file);
    if (onChange) {
      onChange(file);
    }
    setValue(name, file); // Set the input value
    await trigger(name);

    // Only create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null); // Clear preview for non-image files
    }
  };

  return (
    <>
      <div
        className={`w-[130px] h-[130px] ${
          !previewUrl ? "flex" : !previewUrl && defaultValue ? "flex" : "hidden"
        } relative rounded-full border-[6px] border-white outline-dashed outline-1 outline-[#F4F6F8] bg-[#F4F6F8] flex-col items-center justify-center text-center`}
      >
        {defaultValue ? (
          <>
            <img
              src={formatImageUrl(typeof defaultValue === "string" ? defaultValue : defaultValue?.image)}
              className="object-cover object-center relative w-full h-full rounded-full bg-[#F4F6F8]"
            />
            <label
              htmlFor="upload_image"
              className="absolute bottom-2 -right-2 shadow w-[25px] h-[25px] rounded-full flex items-center justify-center bg-white cursor-pointer"
            >
              <img src={Pencil} />
            </label>
          </>
        ) : (
          <>
            <MdAddAPhoto className="text-[#637381] text-[26px] -mt-2" />
            <p className="text-[#637381] text-xs font-normal mt-1">
              {fileType === "images"
                ? t("upload_photo")
                : fileType === "pdf"
                ? "Upload PDF"
                : "Upload File"}
            </p>
          </>
        )}
        <input
          type="file"
          id="upload_image"
          {...register(name, {
            required,
          })}
          name={name}
          onChange={handleFileChange}
          accept={getAcceptedFileTypes()}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
      <div
        className={`relative inline-flex ${
          previewUrl || (view && view.type === "application/pdf")
            ? "inline-flex"
            : "!hidden"
        }`}
      >
        {view && view.type === "application/pdf" ? (
          <div className="w-[130px] h-[130px] rounded-full border-[6px] border-white outline-dashed outline-1 outline-[#F4F6F8] bg-[#F4F6F8] flex flex-col items-center justify-center">
            <div className="text-red-500 text-3xl mb-1">📄</div>
            <p className="text-xs text-gray-600 text-center px-2">
              {view.name.length > 15
                ? `${view.name.substring(0, 15)}...`
                : view.name}
            </p>
          </div>
        ) : (
          <img
            src={previewUrl}
            alt="Preview"
            className="object-cover object-center relative w-[130px] h-[130px] rounded-full border-[6px] border-white outline-dashed outline-1 outline-[#F4F6F8] bg-[#F4F6F8]"
          />
        )}
        <label
          htmlFor="upload_image"
          className="absolute bottom-2 -right-2 shadow w-[25px] h-[25px] rounded-full flex items-center justify-center bg-white cursor-pointer"
        >
          <img src={Pencil} />
        </label>
      </div>
      {errors?.[name] && (
        <p className="text-[#ED4F9D] text-xs flex items-center gap-2 mt-1 font-medium">
          <img src={Error} className="" />
          {errors?.[name]?.message}
        </p>
      )}
    </>
  );
};

export default UploadFilePreview;
