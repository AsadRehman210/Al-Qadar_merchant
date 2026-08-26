import { useEffect, useState } from "react";
import Error from "images/icons/error.png";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import "./index.css";
import { t } from "i18next";

export default function PhoneNumberInput({
  country,
  name,
  register,
  required,
  errors,
  label,
  labelClass,
  setValue,
  disabled,
  readonly,
  defPhone,
  inputClass,
  trigger,
  isReset,
  // A secondary/fallback number (e.g. emergency contact) shouldn't be
  // silently discarded just because libphonenumber doesn't recognize it as
  // a strictly valid number for the selected country — that's appropriate
  // for the primary phone (which is the record's real identity), not for
  // an optional backup contact where any reasonable digits are fine.
  skipValidation,
}) {
  const [code, setCode] = useState("");

  // Add this effect to sync with defPhone changes
  useEffect(() => {
    if (defPhone) {
      const formattedPhone = defPhone.startsWith("+")
        ? defPhone
        : `+${defPhone}`;
      setCode(formattedPhone);
      setValue(name, formattedPhone, { shouldValidate: true });
    }
  }, [defPhone, name, setValue, isReset]);

  useEffect(() => {
    if (isReset) {
      setCode("");
    }
  }, [isReset]);

  const changePhone = (phone) => {
    if (!phone) {
      setCode("");
      setValue(name, "", { shouldValidate: true });
      trigger(name);
      return;
    }

    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    const parsedNumber = parsePhoneNumberFromString(formattedPhone);

    if (skipValidation || parsedNumber?.isValid()) {
      setCode(formattedPhone);
      setValue(name, formattedPhone, { shouldValidate: true });
    } else {
      setValue(name, "", { shouldValidate: true });
      setCode(formattedPhone);
    }

    trigger(name); // Always trigger after setting value
  };

  const getErrorMessage = () => {
    if (!name) return null;
    const nameParts = name.split(/[[\].]+/).filter(Boolean);
    let error = errors;
    for (const part of nameParts) {
      error = error?.[part];
      if (!error) break;
    }
    return error?.message;
  };

  const errorMessage = getErrorMessage();

  return (
    <div>
      {label && (
        <label
          className={`text-sm text-linkText font-medium leading-6 mb-1 block ${
            labelClass || ""
          }`}
        >
          {label} {required && <span className="text-[#EC1212]">*</span>}
        </label>
      )}

      {/* Hidden input for RHF control */}
      <input
        type="hidden"
        {...register(name, {
          required: required ? t("phone_number_required") : false,
        })}
        value={code || ""}
      />

      <div
        dir="ltr"
        className={`flex items-stretch h-10 rounded-md transition duration-300 ${inputClass} border ${
          errorMessage ? "border-red" : "border-[#E0E5F2]"
        } hover:border-primary focus:border-primary`}
      >
        <div className="grow">
          <PhoneInput
            country={country || "pk"}
            value={code}
            onChange={changePhone}
            inputProps={{
              name: "phone",
              disabled,
              readOnly: readonly,
            }}
            enableSearch
          />
        </div>
      </div>

      {errorMessage && (
        <p className="text-red text-xs flex items-center gap-2 mt-1 font-medium">
          <img src={Error} alt="Error" />
          {errorMessage}
        </p>
      )}
    </div>
  );
}
