import UploadMultipleFile from "components/UploadMultipleFile";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormInput from "components/FormInput"; // Import your custom FormInput component
import Button from "components/Button";
import { dataURLtoFile, formatImageUrl } from "global/helper";
import { Trash } from "assets/svgs";
import Calender from "images/icons/calender.png";
import { toast } from "react-toastify";
import Datepicker from "components/Datepicker";
import moment from "moment";
import { useNavigate } from "react-router";
import DownLoadImageWithFallback from "./DownLoadImageWithFallback";
import { AiOutlineEdit } from "react-icons/ai";

const Documents = ({
  setSelectedIndex,
  selectedIndex,
  postDocuments,
  status,
  postId,
  editData,
  isClose,
}) => {
  const [selIssueDate, setIssueDate] = useState("");
  const [selExpiryDate, setExpiryDate] = useState("");
  const [docs, setDocs] = useState([]);
  const [showForm, setShowForm] = useState(true); // Set to true by default
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // Track which document is being edited
  // Ref to hold raw File objects from upload – ensures binary is sent in payload (like agent portal)
  const pendingFilesRef = useRef([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    reset,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
  });
  const changeImage = (files) => {
    if (!Array.isArray(files) || files.length === 0) {
      pendingFilesRef.current = [];
      setValue("images", []);
      trigger("images");
      return;
    }

    // Keep raw File objects so payload sends binary (like agent portal)
    pendingFilesRef.current = files;

    // Separate existing URLs from new File objects (for form display/validation)
    const existingUrls = [];
    const newFiles = [];

    files.forEach((file) => {
      if (typeof file === "string" && file.trim() !== "") {
        // Existing image URL
        existingUrls.push(file);
      } else if (file instanceof File) {
        // New file to be processed
        newFiles.push(file);
      }
    });

    // If we have new files, process them
    if (newFiles.length > 0) {
      const imagePromises = newFiles.map((file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(imagePromises)
        .then((newImageUrls) => {
          // Combine existing URLs with new data URLs
          const allImages = [...existingUrls, ...newImageUrls];
          setValue("images", allImages);
          trigger("images");
        })
        .catch((error) => console.error("Error loading images:", error));
    } else {
      // Only existing URLs, use them directly
      setValue("images", existingUrls);
      trigger("images");
    }
  };

  useEffect(() => {
    if (editData?.documents) {
      const updatedDocuments = editData.documents.map((doc) => ({
        ...doc,
        images: doc.images?.map((img) => formatImageUrl(img)),
        originalImages: [...(doc.images || [])], // Keep raw paths for re-submit when unchanged
        issued_date: doc.issued_date, // Format issued date
        expiry_date: doc.expiry_date, // Format expiry date
      }));
      setDocs(updatedDocuments);
      if (updatedDocuments.length > 0) {
        setShowForm(false);
      }
    }
  }, [editData]);

  // Clear form values when state dates are cleared
  useEffect(() => {
    if (!selIssueDate || selIssueDate.trim() === "") {
      setValue("issued_date", null);
    }
  }, [selIssueDate, setValue]);

  useEffect(() => {
    if (!selExpiryDate || selExpiryDate.trim() === "") {
      setValue("expiry_date", null);
    }
  }, [selExpiryDate, setValue]);

  // Remove employee row
  const removeDocument = (index) => {
    const updatedDocs = docs.filter((_, i) => i !== index);
    setDocs(updatedDocs);
  };

  // Edit existing document
  const editDocument = (index) => {
    const docToEdit = docs[index];
    setEditingIndex(index);
    setShowForm(true);
    pendingFilesRef.current = []; // avoid reusing files from previous add

    // Pre-fill form with existing data
    setValue("doc_type", docToEdit.doc_type || "");
    setValue("document_no", docToEdit.document_no || "");
    setValue("issued_by", docToEdit.issued_by || "");
    setValue("issued_date", docToEdit.issued_date || "");
    setValue("expiry_date", docToEdit.expiry_date || "");
    setValue("images", docToEdit.images || []);

    // Set date picker states
    setIssueDate(docToEdit.issued_date || "");
    setExpiryDate(docToEdit.expiry_date || "");
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditingIndex(null);
    setShowForm(false);
    reset();
    setIssueDate("");
    setExpiryDate("");
    // Clear any existing images from form
    setValue("images", []);
    pendingFilesRef.current = [];
  };

  // // Submit form data
  const onSubmit = () => {
    const fields = getValues();

    // Additional validation before submission
    if (
      fields.issued_date &&
      fields.expiry_date &&
      moment(fields.expiry_date, "DD-MM-YYYY").isBefore(
        moment(fields.issued_date, "DD-MM-YYYY"),
      )
    ) {
      toast.error(t("documents:expiry_after_issue_date"));
      return;
    }

    const imageValue =
      pendingFilesRef.current?.length > 0
        ? pendingFilesRef.current
        : fields.images?.length > 0
          ? fields.images
          : fields.images || [];

    if (editingIndex !== null) {
      // Update existing document – preserve originalImages for remaining URLs so saveDocuments can send correct payload
      const updatedDocs = [...docs];
      const oldDoc = docs[editingIndex];
      const newOriginalImages = [];
      if (Array.isArray(imageValue) && Array.isArray(oldDoc?.originalImages)) {
        imageValue.forEach((img) => {
          if (
            typeof img === "string" &&
            (img.includes("https://") || img.includes("http://"))
          ) {
            const idx = oldDoc.images?.findIndex((o) => o === img);
            if (idx >= 0 && oldDoc.originalImages[idx]) {
              newOriginalImages.push(oldDoc.originalImages[idx]);
            }
          }
        });
      }
      updatedDocs[editingIndex] = {
        ...fields,
        images: imageValue,
        originalImages:
          newOriginalImages.length > 0
            ? newOriginalImages
            : oldDoc?.originalImages,
      };
      setDocs(updatedDocs);
      setEditingIndex(null);
    } else {
      // Add new document
      setDocs([...docs, { ...fields, images: imageValue }]);
    }

    pendingFilesRef.current = [];
    setShowForm(false);
    reset();
    setIssueDate("");
    setExpiryDate("");
  };

  const saveDocuments = async () => {
    if (isSubmitting || status) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      if (editData?._id) {
        formData.append("_id", editData?._id);
      } else if (!postId) {
        toast.error(t("documents:fill_company_details_first"));
        setSelectedIndex(0);
        setIsSubmitting(false);
        return;
      } else {
        formData.append("_id", postId);
      }

      for (const [index, doc] of docs.entries()) {
        formData.append(`documents[${index}][document_no]`, doc.document_no);
        formData.append(`documents[${index}][doc_type]`, doc.doc_type);
        formData.append(`documents[${index}][issued_by]`, doc.issued_by);
        formData.append(
          `documents[${index}][issued_date]`,
          doc.issued_date ? doc.issued_date : "",
        );
        formData.append(
          `documents[${index}][expiry_date]`,
          doc.expiry_date ? doc.expiry_date : "",
        );

        if (doc.images && doc.images.length > 0) {
          const newImageFiles = [];
          let existingImgCount = 0;
          let originalPathIndex = 0; // index into originalImages (only for remaining URL images after edit)

          for (let imgIndex = 0; imgIndex < doc.images.length; imgIndex++) {
            const image = doc.images[imgIndex];

            try {
              if (image instanceof File) {
                newImageFiles.push(image);
              } else if (
                typeof image === "string" &&
                (image.includes("https://") || image.includes("http://"))
              ) {
                const originalPath = doc.originalImages?.[originalPathIndex];
                if (originalPath) {
                  formData.append(
                    `documents[${index}][images][${existingImgCount}]`,
                    originalPath,
                  );
                  existingImgCount++;
                  originalPathIndex++;
                } else {
                  const response = await fetch(image);
                  const blob = await response.blob();
                  const ext =
                    blob.type === "application/pdf"
                      ? "pdf"
                      : blob.type.split("/")[1] || "png";
                  newImageFiles.push(
                    new File([blob], `document_${index}_${imgIndex}.${ext}`, {
                      type: blob.type,
                    }),
                  );
                }
              } else if (
                typeof image === "string" &&
                image.startsWith("data:")
              ) {
                const isPDF = image.startsWith("data:application/pdf");
                const ext = isPDF ? "pdf" : "png";
                newImageFiles.push(
                  dataURLtoFile(image, `document_${index}_${imgIndex}.${ext}`),
                );
              }
            } catch (error) {
              console.error("Error processing file:", error);
            }
          }

          if (newImageFiles.length > 0) {
            newImageFiles.forEach((file) => {
              formData.append(`documents_${index}_images`, file);
            });
          }
        }
      }

      if (docs?.length === 0 && editData?._id) {
        formData.append("delete_all_documents", "yes");
      }

      await postDocuments(formData);
    } catch (error) {
      console.error("Error saving documents:", error);
      toast.error(t("documents:failed_to_save_documents"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Show "Add Document" Button when Form is Hidden */}
      {!showForm && editingIndex === null && (
        <div className="mt-4 flex justify-end gap-3">
          <Button
            onClick={() => setShowForm(true)}
            title={t("documents:add_document")}
            btn="primary"
            className="!w-auto"
          />
        </div>
      )}

      {/* Contact Person Form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-5  w-full">
          <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
            <div className="col-span-1 md:col-span-2">
              <UploadMultipleFile
                key={`upload-${editingIndex || "new"}`}
                onChange={changeImage}
                name="image"
                errors={errors}
                register={register}
                required=""
                trigger={trigger}
                setValue={setValue}
                defaultValue={
                  editingIndex !== null ? docs[editingIndex]?.images || [] : []
                }
              />
            </div>
            <FormInput
              label={t("document_type")}
              placeholder={t("documents:enter_document_type")}
              type="text"
              name="doc_type"
              errors={errors}
              register={register}
              required={t("documents:document_type_required")}
            />
            <FormInput
              label={t("documents:document_no")}
              placeholder={t("documents:enter_document_no")}
              type="text"
              name="document_no"
              errors={errors}
              register={register}
              required={t("documents:document_no_required")}
            />
            <FormInput
              label={t("issued_by")}
              placeholder={t("documents:enter_issued_by")}
              type="text"
              name="issued_by"
              errors={errors}
              register={register}
              required={t("documents:issued_by_required")}
            />
            <Datepicker
              label={t("issued_date")}
              name="issued_date"
              errors={errors}
              position="right"
              icon={Calender}
              register={register}
              trigger={trigger}
              setValue={setValue}
              selected={selIssueDate}
              setSelected={setIssueDate}
              required=""
            />
            <Datepicker
              label={t("expiry_date")}
              name="expiry_date"
              errors={errors}
              position="right"
              icon={Calender}
              register={register}
              trigger={trigger}
              setValue={setValue}
              selected={selExpiryDate}
              setSelected={setExpiryDate}
              required=""
              minDate={selIssueDate}
            />
          </div>

          {/* Form Buttons */}
          <div className="mt-4 flex justify-end gap-3">
            {editingIndex !== null && (
              <Button
                type="button"
                title={t("cancel")}
                onClick={cancelEdit}
                className="!w-auto"
              />
            )}
            <Button
              type="button"
              title={editingIndex !== null ? t("update") : t("add")}
              onClick={onSubmit}
              btn="primary"
              disabled={!isValid}
              className="!w-auto"
            />
          </div>
        </form>
      )}

      {docs && docs.length == 0 ? (
        <h2 className="text-center my-12 text-xl">
          {t("no_document_to_show")}
        </h2>
      ) : (
        <div className="overflow-x-auto overflow-y-visible mt-4">
          <div className="min-w-[800px]">
            <table className="w-full mb-5">
              <thead>
                <tr className="bg-gray-200">
                  <th className="text-start border-r border-[#E9ECEF] whitespace-nowrap text-black text-sm font-semibold px-6 py-2.5">
                    {t("doc_no")}
                  </th>
                  <th className="text-start border-r border-[#E9ECEF] whitespace-nowrap text-black text-sm font-semibold px-6 py-2.5">
                    {t("doc_type")}
                  </th>
                  <th className="text-start border-r border-[#E9ECEF] whitespace-nowrap text-black text-sm font-semibold px-6 py-2.5">
                    {t("image")}
                  </th>
                  <th className="text-start border-r border-[#E9ECEF] whitespace-nowrap text-black text-sm font-semibold px-6 py-2.5">
                    {t("issued_by")}
                  </th>
                  <th className="text-start border-r border-[#E9ECEF] whitespace-nowrap text-black text-sm font-semibold px-6 py-2.5">
                    {t("issued_date")}
                  </th>
                  <th className="text-start border-r border-[#E9ECEF] whitespace-nowrap text-black text-sm font-semibold px-6 py-2.5">
                    {t("expiry_date")}
                  </th>
                  <th className="text-start border-r border-[#E9ECEF] whitespace-nowrap text-black text-sm font-semibold px-6 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc, index) => (
                  <tr key={index} className="text-center">
                    <td className="py-4 px-6 text-start border-t border-r border-[#E9ECEF] group-hover:bg-gray-100 whitespace-nowrap cursor-pointer text-black text-sm font-semibold">
                      {doc.document_no || "-"}
                    </td>
                    <td className="py-4 px-6 text-start border-t border-r border-[#E9ECEF] group-hover:bg-gray-100 whitespace-nowrap cursor-pointer text-black text-sm font-semibold">
                      {doc.doc_type || "-"}
                    </td>
                    <td className="py-4 px-6 text-start border-t border-r border-[#E9ECEF]">
                      {doc.images?.length > 0 ? (
                        <div className="flex gap-2">
                          {doc.images
                            .filter(
                              (img) =>
                                img &&
                                (typeof img === "string"
                                  ? img.trim() !== ""
                                  : img instanceof File),
                            )
                            .map((img, imgIndex) => {
                              const isPdf =
                                (img instanceof File &&
                                  img.type === "application/pdf") ||
                                (typeof img === "string" &&
                                  img.startsWith("data:application/pdf"));
                              const src =
                                typeof img === "string"
                                  ? img
                                  : img instanceof File
                                    ? URL.createObjectURL(img)
                                    : "";
                              return (
                                <div className=" relative group" key={imgIndex}>
                                  <DownLoadImageWithFallback
                                    src={src}
                                    forcePdf={isPdf}
                                    className="w-[100px] h-[100px] object-cover"
                                    alt={`${doc.doc_type} ${doc.document_no} ${
                                      imgIndex + 1
                                    }`}
                                    isBaseURL={false}
                                  />
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        t("no_images")
                      )}
                    </td>
                    <td className="py-4 px-6 text-left border-t border-r border-[#E9ECEF] group-hover:bg-gray-100 whitespace-nowrap cursor-pointer text-black text-sm font-semibold">
                      {doc.issued_by || "-"}
                    </td>
                    <td className="py-4 px-6 text-left border-t border-r border-[#E9ECEF] group-hover:bg-gray-100 whitespace-nowrap cursor-pointer text-black text-sm font-semibold">
                      {doc.issued_date || "-"}
                    </td>
                    <td className="py-4 px-6 text-left border-t border-r border-[#E9ECEF] group-hover:bg-gray-100 whitespace-nowrap cursor-pointer text-black text-sm font-semibold">
                      {doc.expiry_date || "-"}
                    </td>
                    <td className="py-4 px-6 text-left border-t border-r border-[#E9ECEF] group-hover:bg-gray-100 whitespace-nowrap cursor-pointer text-black text-sm font-semibold">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editDocument(index)}
                          className="cursor-pointer text-base text-black"
                          title={t("documents:edit_document")}
                        >
                          <AiOutlineEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="cursor-pointer"
                          title={t("documents:delete_document")}
                        >
                          <Trash className="cursor-pointer" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="flex gap-6 items-center justify-between mt-6 flex-wrap">
        <Button
          title={t("back")}
          type="button"
          onClick={() => setSelectedIndex(selectedIndex - 1)}
          className="sm:!max-w-1/4 py-2"
        />
        <div className="flex gap-4">
          {isClose && (
            <Button
              title={t("close")}
              type="button"
              onClick={() => navigate(isClose)}
              className="w-auto"
            />
          )}
          <Button
            type="button"
            title={editData ? t("update") : t("save")}
            btn="primary"
            loading={status || isSubmitting}
            onClick={saveDocuments}
            disabled={
              isSubmitting ||
              !docs ||
              (docs?.length == 0 && editData?.documents?.length == 0) ||
              status
            }
            className={` w-auto`}
          />
        </div>
      </div>
    </div>
  );
};

export default Documents;
