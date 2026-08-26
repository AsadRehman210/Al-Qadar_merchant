import FormInput from "components/FormInput";
import PhoneNumberInput from "components/PhoneNumberInput";
import SearchDropdown from "components/SearchDropdown";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Button from "components/Button";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  formatDropdownData,
  removeUndefinedFields,
  toFormData,
} from "global/helper";
import { SUCCESS } from "global/config";
import { toast } from "react-toastify";
import { fetchCountries, showCountries } from "store/slices/authSlice";
import {
  postCustomer,
  fetchCustomer,
  showStatus,
  setStatus,
} from "store/slices/customerSlice";
import { fetchDropdownCustomer } from "../store/slices/customerSlice";

const AddCustomer = ({ closePopup, onCustomerAdded, agencyId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const countries = useSelector(showCountries);
  const [selectedNationality, setSelectedNationality] = useState(null);
  const status = useSelector(showStatus);

  // Fetch countries for nationality dropdown (same as BasicDetails / PassengerDetails)
  useEffect(() => {
    if (!countries || countries.length === 0) {
      dispatch(fetchCountries());
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
  });

  const handleAddCustomer = async (data) => {
    data.nationality_id = selectedNationality?._id;
    data.added_by = "Admin";
    if (agencyId) {
      data.agency_id = agencyId;
    }
    const flatFields = removeUndefinedFields(data);
    const formData = toFormData(flatFields);

    const response = await dispatch(postCustomer(formData)).unwrap();
    if (response?.response_code === SUCCESS) {
      toast.success(response?.message);
      dispatch(fetchDropdownCustomer({ page: 1, limit: 30 }));
      setStatus(false);

      // Call the callback with the newly created customer data
      if (onCustomerAdded) {
        onCustomerAdded(response.result);
      }

      closePopup();
    } else {
      toast.error(response?.message);
      setStatus(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleAddCustomer)}>
      <div className="grid md:grid-cols-2 grid-cols-1 gap-6">
        <FormInput
          label={t("first_name")}
          labelClass="text-sm text-gray-500 font-medium"
          placeholder={t("enter_first_name")}
          type="text"
          name="first_name"
          errors={errors}
          register={register}
          required={t("enter_first_name")}
        />
        <FormInput
          label={t("last_name")}
          labelClass="text-sm text-gray-500 font-medium"
          placeholder={t("enter_last_name")}
          type="text"
          name="last_name"
          errors={errors}
          register={register}
          required={t("enter_last_name")}
        />
        <FormInput
          label={t("email")}
          labelClass="text-sm text-gray-500 font-medium"
          placeholder={t("enter_email")}
          type="email"
          name="email"
          errors={errors}
          register={register}
          required=""
        />
        <PhoneNumberInput
          name="phone"
          label={t("primary_phone")}
          errors={errors}
          register={register}
          setValue={setValue}
          trigger={trigger}
          required={t("enter_mobile_number")}
          labelClass="text-sm text-gray-500 font-medium"
          country="sa"
        />
        <PhoneNumberInput
          name="phone_2"
          label={t("secondary_phone")}
          errors={errors}
          register={register}
          setValue={setValue}
          trigger={trigger}
          required=""
          labelClass="text-sm text-gray-500 font-medium"
          country="sa"
        />
        <SearchDropdown
          label={t("nationality")}
          data={formatDropdownData("nationality", countries)}
          selected={selectedNationality}
          setSelected={setSelectedNationality}
          name="nationality_id"
          errors={errors}
          required=""
          trigger={trigger}
          setValue={setValue}
          register={register}
          className="!z-[9999]"
          labelClass="text-sm text-gray-500 font-medium"
          emptyMessage={t("no_nationality_found")}
        />
        <FormInput
          label={t("national_id")}
          labelClass="text-sm text-gray-500 font-medium"
          placeholder={t("enter_national_id")}
          type="text"
          name="national_id"
          errors={errors}
          register={register}
          required=""
        />
        <FormInput
          label={t("passport_number")}
          labelClass="text-sm text-gray-500 font-medium"
          placeholder={t("enter_passport_number")}
          type="text"
          name="passport"
          errors={errors}
          register={register}
          required=""
        />
        <FormInput
          label={t("iqama_number")}
          labelClass="text-sm text-gray-500 font-medium"
          placeholder={t("enter_iqama_number")}
          type="text"
          name="iqama_no"
          errors={errors}
          register={register}
          required=""
        />
      </div>
      <div className="flex justify-end mt-6">
        <Button
          type="submit"
          title={t("add_customer")}
          loading={status}
          disabled={status}
          btn="primary"
          className="!rounded-md"
        />
      </div>
    </form>
  );
};

export default AddCustomer;
