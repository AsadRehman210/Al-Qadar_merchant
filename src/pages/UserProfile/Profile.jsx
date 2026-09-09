import { useEffect, useState } from "react";
import Button from "components/Button";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import PhoneNumberInput from "components/PhoneNumberInput";
import FormInput from "components/FormInput";
import { showUserData } from "store/slices/uniqueSlice";
import { removeUndefinedFields, jsonToFormData } from "global/helper";
// import { updateEmployeeInfo, showStatus } from "store/slices/dashboardSlice";
import { getUserInfo } from "store/slices/authSlice";
// import { toast } from "react-toastify";
// import { UPDATED } from "global/config";
import UploadSingleFile from "components/UploadSingleFile";
import { SUCCESS } from "global/config";
import { toast } from "react-toastify";
import { showStatus, updateUser, setStatus } from "store/slices/authSlice";

const PersonalInformation = () => {
  const { t } = useTranslation();
  const status = useSelector(showStatus);
  const userData = useSelector(showUserData);
  const dispatch = useDispatch();
  // const dispatch = useDispatch();
  // const CORPORATE_ID = useSelector(showCorporateId);
  const [profileImage, setProfileImage] = useState();

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    clearErrors,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
  });

  // set default values
  useEffect(() => {
    if (userData && Object.keys(userData).length > 0) {
      setValue("agency_name", userData?.agency_name);
      setValue("full_name", userData?.full_name);
      setValue("email", userData?.user_id?.email);
      setValue("agency_address", userData?.agency_address);
      console.log("Form Errors:", errors["phone"]); // Log errors to debug
      setTimeout(() => {
        clearErrors();
      }, 1000);
      console.log(userData, "userData");
    }
  }, [userData, setValue, clearErrors]);

  console.log("Form Errors:", errors["phone"]);

  const changeImage = (image) => {
    setProfileImage(image);
  };

  const handleUpdateUserInfo = async (field) => {
    field.image = profileImage;
    field._id = userData?._id;

    if (field.anothor_phone) {
      field.contact_info = [{ phone: field.anothor_phone }];
    }
    delete field.anothor_phone;
    const flatFields = removeUndefinedFields(field);

    const formData = jsonToFormData(flatFields);
    // set fields to form data
    if (field.image && field.image instanceof File) {
      formData.append("image", field.image);
    }

    const response = await dispatch(updateUser(formData)).unwrap();
    if (response?.response_code === SUCCESS) {
      toast.success(response?.message);
      dispatch(setStatus(false));
      dispatch(getUserInfo(userData?._id));
    } else {
      toast.error(response?.message);
      dispatch(setStatus(false));
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(handleUpdateUserInfo)}
        className="lg:max-w-[96%] w-full"
      >
        <div className="grid md:grid-cols-2 grid-cols-1 gap-3.5">
          <div className="md:col-span-2 flex md:justify-start justify-center">
            <UploadSingleFile
              onChange={changeImage}
              name="image"
              errors={errors}
              register={register}
              required=""
              trigger={trigger}
              setValue={setValue}
              defaultValue={userData?.image}
            />
          </div>
          <FormInput
            label="Company Name"
            labelClass="!text-darkBlue"
            placeholder="Enter Company Name"
            type="text"
            name="agency_name"
            errors={errors}
            register={register}
            required="Enter Company Name"
            pattern={/[a-zA-Z0-9\s.'&,-]/}
            minLength={2}
            maxLength={100}
          />
          <FormInput
            label="Full Name"
            labelClass="!text-darkBlue"
            placeholder="Enter Full Name"
            type="text"
            name="full_name"
            errors={errors}
            register={register}
            required="Enter Full Name"
            pattern={/[a-zA-Z0-9\s.'&,-]/}
            minLength={2}
            maxLength={100}
          />
          <FormInput
            label="Email Address"
            labelClass="!text-darkBlue"
            placeholder="Enter Email Address"
            type="text"
            name="email"
            errors={errors}
            register={register}
            required="Enter Email Address"
          />
          <PhoneNumberInput
            name="phone"
            label="Mobile Number"
            labelClass="!text-darkBlue"
            errors={errors}
            register={register}
            setValue={setValue}
            trigger={trigger}
            required="Enter Mobile Number"
            country="sa"
            defPhone={userData?.user_id?.phone}
          />
          <PhoneNumberInput
            name="anothor_phone"
            label="Another Contact Number"
            labelClass="!text-darkBlue"
            errors={errors}
            register={register}
            setValue={setValue}
            trigger={trigger}
            required="Enter Another Contact Number"
            country="sa"
            defPhone={
              userData?.contact_info ? userData?.contact_info[0]?.phone : ""
            }
          />
          <FormInput
            label="Add Company Address"
            labelClass="!text-darkBlue"
            placeholder="Enter Add Company Address"
            type="text"
            name="agency_address"
            errors={errors}
            register={register}
            required=""
            maxLength={250}
          />
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Button
            type="submit"
            disabled={!isValid || status}
            title={t("save")}
            loading={status}
            className="!w-1/4"
            btn="primary"
          />
        </div>
      </form>
    </>
  );
};

export default PersonalInformation;
