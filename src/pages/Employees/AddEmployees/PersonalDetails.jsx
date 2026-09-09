import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import moment from "moment";
import FormInput from "components/FormInput";
import PhoneNumberInput from "components/PhoneNumberInput";
import SelectDropdown from "components/SelectDropdown";
import Datepicker from "components/Datepicker";
import UploadSingleFile from "components/UploadSingleFile";
import Button from "components/Button";
import Calender from "images/icons/calender.png";
import {
  nationalityOptions,
  genderOptions,
  bloodGroupOptions,
  maritalStatusOptions,
} from "global/constant";

const PersonalDetails = ({ setSelectedIndex, setValidValues, existing }) => {
  const { t } = useTranslation();
  const [selGender, setSelGender] = useState(
    () => genderOptions.find((g) => g.id === existing?.gender) ?? null,
  );
  const [selBlood, setSelBlood] = useState(
    () => bloodGroupOptions.find((b) => b.id === existing?.blood_group) ?? null,
  );
  const [selMarital, setSelMarital] = useState(
    () => maritalStatusOptions.find((m) => m.id === existing?.marital_status) ?? null,
  );
  const [selDob, setSelDob] = useState(() =>
    existing?.dob ? moment(existing.dob).format("DD-MM-YYYY") : "",
  );
  const [selNationalityType, setSelNationalityType] = useState(
    () => nationalityOptions.find((n) => n.id === existing?.nationality_type) || nationalityOptions[0],
  );
  const [selNationalIdExpiry, setSelNationalIdExpiry] = useState(() =>
    existing?.national_id_expiry ? moment(existing.national_id_expiry).format("DD-MM-YYYY") : "",
  );
  const [selWorkPermitExpiry, setSelWorkPermitExpiry] = useState(() =>
    existing?.work_permit_expiry ? moment(existing.work_permit_expiry).format("DD-MM-YYYY") : "",
  );
  const {
    register,
    formState: { errors },
    setValue,
    trigger,
    getFieldState,
    watch,
    getValues,
  } = useFormContext();
  const workPermitNo = watch("work_permit_no");
  const minExpiry = moment().add(1, "day").format("DD-MM-YYYY");

  const maxDob = moment().subtract(18, "years").format("DD-MM-YYYY");
  const minDob = moment().subtract(70, "years").format("DD-MM-YYYY");

  const STEP_FIELDS = [
    "first_name",
    "last_name",
    "gender",
    "dob",
    "email",
    "phone",
    "address",
    "emergency_contact",
    "nationality",
    "national_id",
  ];

  const FIELD_LABELS = {
    first_name: t("employees:first_name"),
    last_name: t("employees:last_name"),
    gender: t("employees:gender"),
    dob: t("employees:dob"),
    email: t("email"),
    phone: t("employees:phone"),
    address: t("address"),
    emergency_contact: t("employees:emergency_contact"),
    nationality: t("employees:nationality"),
    national_id: t("employees:national_id"),
  };

  const onNext = async (e) => {
    e.preventDefault();
    const valid = await trigger(STEP_FIELDS);
    const phoneDigits = String(getValues("phone") || "").replace(/\D/g, "");
    const emergencyDigits = String(getValues("emergency_contact") || "").replace(/\D/g, "");
    if (phoneDigits && emergencyDigits && phoneDigits === emergencyDigits) {
      toast.error(t("employees:emergency_must_differ", "Emergency contact must be different from phone"));
      return;
    }
    if (workPermitNo && !selWorkPermitExpiry) {
      toast.error(t("employees:work_permit_expiry_required", "Work permit expiry is required when work permit no. is filled"));
      return;
    }
    if (valid) {
      setValidValues(1);
      setSelectedIndex(1);
    } else {
      // getFieldState (not the destructured `errors`, which is a snapshot
      // from render time) reflects the state trigger() just computed, so the
      // toast can name exactly which fields are still invalid.
      const invalidFields = STEP_FIELDS.filter((f) => getFieldState(f).invalid);
      toast.error(
        invalidFields.length
          ? `${t("employees:fill_required_fields")} ${invalidFields.map((f) => FIELD_LABELS[f] || f).join(", ")}`
          : t("employees:fill_required_fields"),
      );
    }
  };

  return (
    <form onSubmit={onNext} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-full">
          <UploadSingleFile
            name="image"
            register={register}
            setValue={setValue}
            trigger={trigger}
            defaultValue={null}
          />
        </div>
        <FormInput
          label={t("employees:first_name")}
          name="first_name"
          register={register}
          errors={errors}
          required
          pattern={/[a-zA-Z\s.'-]/}
          minLength={2}
          maxLength={100}
        />
        <FormInput
          label={t("employees:last_name")}
          name="last_name"
          register={register}
          errors={errors}
          required
          pattern={/[a-zA-Z\s.'-]/}
          minLength={2}
          maxLength={100}
        />
        <SelectDropdown
          label={t("employees:gender")}
          data={genderOptions}
          selected={selGender}
          setSelected={setSelGender}
          name="gender"
          valueKey="id"
          register={register}
          setValue={setValue}
          trigger={trigger}
          required
        />
        <div className="relative">
          <Datepicker
            label={t("employees:dob")}
            name="dob"
            errors={errors}
            position="right"
            Icon={Calender}
            register={register}
            required
            max={maxDob}
            min={minDob}
            currentDate={maxDob}
            trigger={trigger}
            setValue={setValue}
            selected={selDob}
            setSelected={setSelDob}
            defaultValue={false}
          />
        </div>
        <FormInput
          label={t("email")}
          name="email"
          register={register}
          errors={errors}
        />
        <PhoneNumberInput
          label={t("employees:phone")}
          name="phone"
          register={register}
          setValue={setValue}
          trigger={trigger}
          defPhone={existing?.phone}
          required
        />
        <FormInput
          label={t("address")}
          name="address"
          register={register}
          errors={errors}
          className="col-span-full"
          required
          pattern={/[a-zA-Z0-9\s.'-]/}
          minLength={5}
          maxLength={255}
        />
        <PhoneNumberInput
          label={t("employees:emergency_contact")}
          name="emergency_contact"
          register={register}
          setValue={setValue}
          trigger={trigger}
          defPhone={existing?.emergency_contact}
          required
        />
        <SelectDropdown
          label={t("employees:blood_group")}
          data={bloodGroupOptions}
          selected={selBlood}
          setSelected={setSelBlood}
          name="blood_group"
          valueKey="id"
          register={register}
          setValue={setValue}
          trigger={trigger}
        />
        <SelectDropdown
          label={t("employees:marital_status")}
          data={maritalStatusOptions}
          selected={selMarital}
          setSelected={setSelMarital}
          name="marital_status"
          valueKey="id"
          register={register}
          setValue={setValue}
          trigger={trigger}
        />
        <FormInput
          label={t("employees:nationality")}
          name="nationality"
          register={register}
          errors={errors}
          required
          pattern={/[a-zA-Z\s.'-]/}
          minLength={2}
          maxLength={100}
        />
        <FormInput
          label={t("employees:national_id")}
          name="national_id"
          register={register}
          errors={errors}
          required
          pattern={/[0-9]/}
          minLength={10}
          maxLength={10}
        />
        {/* -- Identity Expiry & Work Permit section -- */}
        <div className="relative">
          <Datepicker
            label={t("employees:national_id_expiry")}
            name="national_id_expiry"
            errors={errors}
            position="right"
            Icon={Calender}
            register={register}
            trigger={trigger}
            setValue={setValue}
            selected={selNationalIdExpiry}
            setSelected={setSelNationalIdExpiry}
            defaultValue={false}
            min={minExpiry}
            minErrorMessage={t("employees:expiry_after_today", "Expiry date must be after today")}
          />
        </div>
        <SelectDropdown
          label={t("employees:nationality_type")}
          data={nationalityOptions}
          selected={selNationalityType}
          setSelected={setSelNationalityType}
          name="nationality_type"
          register={register}
          setValue={setValue}
          trigger={trigger}
        />
        {/* Work permit shown only when Expatriate */}
        {selNationalityType?.id === "Expatriate" && (
          <>
            <FormInput
              label={t("employees:work_permit_no")}
              name="work_permit_no"
              register={register}
              errors={errors}
              defaultValue=""
              placeholder="Iqama / Visa number"
              pattern={/[A-Za-z0-9\-_]/}
              minLength={2}
              maxLength={100}
            />
            <div className="relative">
              <Datepicker
                label={t("employees:work_permit_expiry")}
                name="work_permit_expiry"
                errors={errors}
                position="right"
                Icon={Calender}
                register={register}
                trigger={trigger}
                setValue={setValue}
                selected={selWorkPermitExpiry}
                setSelected={setSelWorkPermitExpiry}
                defaultValue={false}
                required={!!workPermitNo}
                min={minExpiry}
                minErrorMessage={t("employees:expiry_after_today", "Expiry date must be after today")}
              />
            </div>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
        <Button
          type="submit"
          title={t("next")}
          btn="primary"
          // className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
        />
      </div>
    </form>
  );
};

export default PersonalDetails;
