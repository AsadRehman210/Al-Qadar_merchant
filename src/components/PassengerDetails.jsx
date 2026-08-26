import { FaPlus, FaMinus } from "react-icons/fa6";
import FormInput from "components/FormInput";
import UploadMultipleFile from "components/UploadMultipleFile";
import { formatImageUrl } from "global/helper";
import SearchDropdown from "components/SearchDropdown";
import { useTranslation } from "react-i18next";

const PassengerDetails = ({
  type,
  label,
  description,
  count,
  handleIncrement,
  handleDecrement,
  register,
  errors,
  setValue,
  trigger,
  changeImage,
  details,
  reqDocs = "",
  countClass,
  isViewOnly,
  editData,
  countries,
  changeData,
  setError,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      {/* Counter Header */}
      <div
        className={`${countClass} flex justify-between gap-4 items-center flex-wrap`}
      >
        <div className="block text-gray-700 font-medium">
          <p className="text-base text-black font-medium opacity-100">
            {label}
          </p>
          <p className="text-sm text-[#9CA3AF] font-medium">{description}</p>
        </div>
        <div dir="ltr" className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            disabled={isViewOnly}
            onClick={() => handleDecrement(type)}
            className="border border-[#E5E7EB] disabled:cursor-not-allowed size-[38px] flex items-center justify-center rounded-[10px] text-lg font-bold text-black"
          >
            <FaMinus className="text-sm" />
          </button>
          <input
            type="text"
            value={count}
            name={`${type}.count`}
            readOnly
            className="w-8 text-center bg-transparent outline-none text-lg font-medium text-gray-900"
          />
          <button
            type="button"
            disabled={isViewOnly}
            onClick={() => handleIncrement(type)}
            className="border border-gray-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed size-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <FaPlus className="text-sm" />
          </button>
        </div>
      </div>

      {/* Render form fields for each passenger */}
      {[...Array(count)].map((_, index) => {
        const passportError = details?.[type]?.[index]?.error || "";

        return (
          <div key={index} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput
                label={`${t("booking:full_name")} ${label} ${index + 1}`}
                labelClass="text-gray-700 !font-medium"
                placeholder={t("booking:enter_full_name")}
                type="text"
                name={`${type}_details[${index}].full_name`}
                register={register}
                errors={errors}
                // required="Enter Full Name"
                disabled={isViewOnly}
                className="bg-white"
                onValueChange={(value) =>
                  changeData(value, type, index, "full_name")
                }
                pattern={/^[a-zA-Z\s-/]*$/}
              />

              <FormInput
                label={`${t("passport_id")} ${label} ${index + 1}`}
                labelClass="text-gray-700 !font-medium"
                placeholder={t("booking:enter_passport_id")}
                type="text"
                name={`${type}_details[${index}].passport`}
                errors={errors}
                register={register}
                // required="Enter Passport ID"
                disabled={isViewOnly}
                className="bg-white"
                onValueChange={(value) =>
                  changeData(value, type, index, "passport")
                }
                pattern={/^[a-zA-Z0-9\s-/]*$/}
                maxLength={15}
              />

              <FormInput
                label={`${t("iqama_number")} ${label} ${index + 1}`}
                labelClass="text-gray-700 !font-medium"
                placeholder={t("enter_iqama_number")}
                type="text"
                name={`${type}_details[${index}].iqama_no`}
                errors={errors}
                register={register}
                // required="Enter Iqama Number"
                disabled={isViewOnly}
                className="bg-white"
                onValueChange={(value) =>
                  changeData(value, type, index, "iqama_no")
                }
                pattern={/^[a-zA-Z0-9\s-/]*$/}
                maxLength={10}
              />

              <SearchDropdown
                label={`${t("nationality")} ${label} ${index + 1}`}
                data={countries}
                selected={details?.[type]?.[index]?.nationality_id}
                setSelected={(value) =>
                  changeData(value, type, index, "nationality_id")
                }
                name={`${type}_details[${index}].nationality_id`}
                errors={errors}
                // required="Select Nationality"
                trigger={trigger}
                setValue={setValue}
                setError={setError}
                register={register}
                labelClass="text-gray-700 !font-medium"
                className="bg-white"
                disabled={isViewOnly}
                emptyMessage={t("no_nationality_found")}
              />
            </div>

            <div className="mt-2">
              <div className="space-y-2">
                <UploadMultipleFile
                  label={t("booking:upload_passport_document")}
                  labelClass="text-gray-700 !font-medium"
                  name={`${type}_details[${index}].document`}
                  register={register}
                  required={reqDocs}
                  errors={errors}
                  setValue={setValue}
                  trigger={trigger}
                  onChange={(file) => changeImage(file, type, index)}
                  defaultValue={editData?.[`${type}_details`]?.[
                    index
                  ]?.documents
                    ?.map((doc) => doc?.images?.[0])
                    ?.filter(Boolean)
                    ?.map((img) => formatImageUrl(img))}
                />
                {/* {console.log(
                  editData?.[`${type}_details`]?.[index]?.documents
                    ?.map((doc) => doc?.images?.[0])
                    ?.filter(Boolean)
                    ?.map((img) => formatImageUrl(img)),
                  "images"
                )} */}
                {passportError && (
                  <p className="text-red-500 text-sm mt-1">{passportError}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PassengerDetails;
