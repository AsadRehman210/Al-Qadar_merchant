import Error from "images/icons/error.png";
import EyeOf from "images/icons/eye-off.png";
import { useState } from "react";
import { IoEyeOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { formatCnic } from "global/helper";
import DOMPurify from "dompurify";
import IBAN from "iban";
import { ibanLengths } from "global/constant";

// Arabic Unicode range — allow Arabic wherever pattern allows A–Z (English + Arabic both)
const ARABIC_CHAR_REGEX = /[\u0600-\u06FF]/;
// Full-string patterns (e.g. /^\+?[0-9\s\-()]{6,20}$/) must not be used per-char
const isFullStringPattern = (p) =>
  p && p.source.startsWith("^") && p.source.endsWith("$");
// Password fields: English only (no Arabic)
const isPasswordField = (n) =>
  n === "password" || n === "new_password" || n === "confirm_password";
// Always LTR: password, confirm password, email, number
const useLtr = (n, inputType) => isPasswordField(n);
// Per-char filter: pattern chars + optionally Arabic (reference style)
const filterCharsByPattern = (str, pattern, allowArabic) => {
  let out = "";
  for (const char of str) {
    if (pattern.test(char) || (allowArabic && ARABIC_CHAR_REGEX.test(char)))
      out += char;
  }
  return out;
};

export default function FormInput({
  placeholder,
  errors,
  register,
  name,
  type = "text",
  icon,
  labelIcon,
  iconClass,
  label,
  position,
  required,
  labelClass,
  inputClass,
  isErrorHide,
  pattern,
  disabled,
  readonly,
  max,
  min,
  minLength,
  maxLength = 100,
  defaultValue,
  price = false,
  onValueChange,
  getValues,
  allowNegative,
  validate,
  tooltip,
  helperText,
  step,
  // type="number" is integer-only by default (existing behavior — strips
  // everything but digits). Pass decimal to allow a single "." and cap the
  // digits after it via decimalPlaces (2 by default, e.g. currency amounts).
  decimal = false,
  decimalPlaces = 2,
  // The strength regex (8+ chars, upper/lower/digit/special) is a
  // password-CREATION policy — it belongs on Add Merchant/Add Admin/Reset
  // Password, not on Login, where the user is typing whatever their
  // existing password already is (which may predate the policy). Login
  // passes this true so it only enforces "not empty", not the pattern.
  skipPasswordStrength = false,
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [inType, setInType] = useState(type);
  const [iban, setIban] = useState("");
  const [ibanError, setIbanError] = useState("");

  // Function to format value as price
  const formatPrice = (value) => {
    // Remove non-numeric characters except decimal point
    const number = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (!isNaN(number)) {
      return number.toLocaleString("en-US", {
        minimumFractionDigits: 0, // No decimal places
        maximumFractionDigits: 0, // No decimal places
      });
    }
    return "";
  };

  const formatPin = (value) => {
    return value.replace(/[^0-9]/g, "").slice(0, 4);
  };

  // format iban function to restrict 2 alphbet 2 numbers then 4 alphbet and 16 numbers at the end
  // const formatIban = (value) => {
  //   const uppercased = value.toUpperCase();
  //   let formattedValue = "";
  //   let letters1 = "";
  //   let numbers1 = "";
  //   let letters2 = "";
  //   let numbers2 = "";
  //   const validChars = uppercased.replace(/[^A-Z0-9]/g, "");

  //   for (let i = 0; i < validChars.length; i++) {
  //     const char = validChars[i];

  //     // First 2 characters must be letters
  //     if (letters1.length < 2) {
  //       if (/[A-Z]/.test(char)) {
  //         letters1 += char;
  //       }
  //     }
  //     // Next 2 characters must be numbers
  //     else if (numbers1.length < 2) {
  //       if (/[0-9]/.test(char)) {
  //         numbers1 += char;
  //       }
  //     }
  //     // Next 4 characters must be letters
  //     else if (letters2.length < 4) {
  //       if (/[A-Z]/.test(char)) {
  //         letters2 += char;
  //       }
  //     }
  //     // Remaining characters (up to 16) must be numbers
  //     else if (numbers2.length < 16) {
  //       if (/[0-9]/.test(char)) {
  //         numbers2 += char;
  //       }
  //     }
  //   }
  //   formattedValue = `${letters1}${numbers1}${letters2}${numbers2}`;
  //   if (formattedValue.length > 24) {
  //     formattedValue = formattedValue.slice(0, 24);
  //   }

  //   return formattedValue;
  // };
  const formatIban = (value) => {
    const sanitizedValue = value.toUpperCase().replace(/\s+/g, "");
    setIban(sanitizedValue);

    if (sanitizedValue.length < 2) {
      setIbanError(t("enter_country_code"));
      return { formattedValue: sanitizedValue, error: t("enter_country_code") };
    }

    const countryCode = sanitizedValue.substring(0, 2);
    const expectedLength = ibanLengths[countryCode];

    if (!expectedLength) {
      setIbanError(t("unsupported_country_code"));
      return {
        formattedValue: sanitizedValue,
        error: t("unsupported_country_code"),
      };
    } else if (sanitizedValue.length !== expectedLength) {
      const ibanMsg = t("iban_must_be_characters", {
        countryCode,
        length: expectedLength,
      });
      setIbanError(ibanMsg);
      return {
        formattedValue: sanitizedValue,
        error: ibanMsg,
      };
    } else {
      setIbanError("");
      return { formattedValue: sanitizedValue, error: "" };
    }
  };

  // handle pasword visibility
  const onChange = () => {
    if (inType === "text") {
      setInType("password");
    } else {
      setInType("text");
    }
  };

  // handle input valdations on change
  const handleInput = (e) => {
    let value = e.target.value.trimStart().replace(/\s\s+/g, " ");
    if (e.type === "blur") value = value.trim();
    value = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [], // Remove all tags
      ALLOWED_ATTR: [], // Remove all attributes
    });

    // Convert email to lowercase
    if (name === "email") {
      value = value.toLowerCase();
      e.target.value = value;
    }

    // Password fields: no Arabic (reference: English only)
    if (isPasswordField(name)) {
      value = value.replace(/[\u0600-\u06FF]/g, "");
      e.target.value = value;
    }

    if (pattern && !isFullStringPattern(pattern)) {
      value = filterCharsByPattern(value, pattern, !isPasswordField(name));
      e.target.value = value;
    }
    if (maxLength && value.length > maxLength) {
      value = value.slice(0, maxLength);
    }

    if (validate instanceof RegExp) {
      const isSignedInt = validate.toString() === "/^[-+]?\\d+$/";
      let newValue = "";

      for (let i = 0, hasSign = false; i < value.length; i++) {
        const char = value[i];

        if (isSignedInt) {
          if ((char === "+" || char === "-") && !hasSign && i === 0) {
            newValue += char;
            hasSign = true;
          } else if (/\d/.test(char)) {
            newValue += char;
          }
        } else if (validate.test(char)) {
          newValue += char;
        }
      }
      e.target.value = newValue;
      onValueChange?.(newValue);
      return;
    }

    if (type === "number") {
      if (decimal) {
        value = value.replace(/[^0-9.]/g, "");
        const dotIndex = value.indexOf(".");
        if (dotIndex !== -1) {
          const whole = value.slice(0, dotIndex);
          const frac = value.slice(dotIndex + 1).replace(/\./g, "").slice(0, decimalPlaces);
          value = frac.length || value.endsWith(".") ? `${whole}.${frac}` : whole;
        }
      } else {
        value = value.replace(/[^0-9]/g, "");
      }
      if (value < 0) {
        value = "";
      }
      e.target.value = value;
    }
    if (type === "time") {
      const timeRegex = /^([01]\d|2[0-3]):?([0-5]\d)$/;
      if (!timeRegex.test(value)) value = "";
    }

    if (price) e.target.value = formatPrice(value);
    // Handle specific field formatting (e.g., CNIC, T_pin, IBAN)
    if (name === "cnic") e.target.value = formatCnic(value);
    if (name === "T_pin") e.target.value = formatPin(value);
    if (name === "iban" || name === `bank[${0}].iban`) {
      const { formattedValue, error: ibanError } = formatIban(value);
      e.target.value = formattedValue;
      setIbanError(ibanError);
    }

    if (onValueChange) onValueChange(value);

    // Ensure no negative numbers
    if (e.target.value < 0 && !allowNegative) e.target.value = "";
    else if (value == "  " || value == " " || value == "") {
      e.target.value = value;
    }
    // Apply space rules (no leading / single middle / no trailing on blur) for non-formatted fields
    else if (
      !price &&
      name !== "cnic" &&
      name !== "T_pin" &&
      name !== "iban" &&
      name !== `bank[${0}].iban`
    ) {
      e.target.value = value;
    }
  };

  // Paste: reference — pattern filter or password strip Arabic
  const handlePaste = (e) => {
    const pastedText = (e.clipboardData || window.clipboardData).getData(
      "text",
    );
    if (pattern && !isFullStringPattern(pattern)) {
      e.preventDefault();
      e.target.value = filterCharsByPattern(
        pastedText,
        pattern,
        !isPasswordField(name),
      );
      e.target.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (isPasswordField(name)) {
      const withoutArabic = pastedText.replace(/[\u0600-\u06FF]/g, "");
      if (withoutArabic !== pastedText) {
        e.preventDefault();
        e.target.value = withoutArabic;
        e.target.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  };

  const getErrorMessage = () => {
    const nameParts = name?.split(/[[\].]+/).filter(Boolean);
    let error = errors;
    for (const part of nameParts) {
      error = error?.[part];
      if (!error) break; // If no error found, break out of the loop
    }
    // Return custom IBAN error if it exists
    if ((name === "iban" || name === `bank[${0}].iban`) && ibanError) {
      return ibanError;
    }

    return error?.message;
  };

  const { onBlur: rhfOnBlur, ...registerRest } = register(name, {
    required,
    validate: (value) => {
      if (name === "password" && getValues && getValues(name) !== "********" && !skipPasswordStrength) {
        if (!value) return true;
        const passwordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
        return passwordRegex.test(value) || t("password_validation_msg");
      }
      if (name === "email" && required) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(value) || t("please_enter_valid_email");
      }
      if (validate instanceof RegExp) {
        return validate.test(value) || t("enter_valid_number_or_sign");
      }
      // Skip range/length checks on an empty, non-required value — `required`
      // above already covers "must be filled in".
      if (value === "" || value === undefined || value === null) return true;
      if (minLength !== undefined && String(value).length < minLength) {
        return t("min_length_error", { minLength });
      }
      if ((min !== undefined || max !== undefined) && type === "number") {
        const numeric = Number(value);
        if (Number.isNaN(numeric)) return t("decimal_invalid_error");
        if (min !== undefined && numeric < min) return t("min_value_error", { min });
        if (max !== undefined && numeric > max) return t("max_value_error", { max });
      }
      return true;
    },
  });

  const isSignedIntValidate =
    validate instanceof RegExp && validate.toString() === "/^[-+]?\\d+$/";

  return (
    <div className="grow">
      {label ? (
        <label
          className={`text-sm text-linkText font-medium leading-6 mb-1 flex items-center ${
            labelClass || ""
          }`}
        >
          {label}
          {labelIcon ? (
            <div
              className={`relative group ltr:ml-1 rtl:mr-1 ${
                iconClass || ""
              } text-black`}
            >
              {labelIcon}
              {tooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {tooltip}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
          ) : null}
          <span className="text-[#EC1212]">{required ? "*" : ""} </span>
        </label>
      ) : null}
      {helperText ? (
        <p className="text-xs text-[#64748B] dark:text-gray-400 mb-1.5">
          {helperText}
        </p>
      ) : null}
      <div className="relative">
        {icon ? (
          <img
            src={icon}
            className={`absolute ${
              iconClass || ""
            } top-1/2 transform -translate-y-1/2 ${
              position === "right"
                ? "ltr:right-3 rtl:left-3"
                : "ltr:left-3 rtl:right-3"
            }`}
          />
        ) : null}
        <input
          style={{ unicodeBidi: "plaintext" }}
          dir={
            useLtr(name, type) || isSignedIntValidate
              ? "ltr"
              : isRTL
                ? "rtl"
                : "ltr"
          }
          className={`h-10 ${
            inputClass || ""
          } rounded-md border bg-white placeholder:text-gray placeholder:font-normal text-black transition duration-300 text-sm hover:border-[#ffba32] border-[#E0E5F2] focus:border-[#ffba32] focus:outline-0 ${
            label === "Mobile"
              ? "pl-16"
              : icon && position !== "right"
                ? "pl-12"
                : ""
          } p-[11px_16px] w-full text-para font-medium disabled:cursor-not-allowed ${
            errors && errors[name] ? "border-red" : ""
          }`}
          {...registerRest}
          onBlur={(e) => {
            handleInput(e);
            rhfOnBlur(e);
          }}
          id={name}
          autoComplete={name === "password" ? "new-password" : "on"}
          placeholder={placeholder}
          readOnly={readonly}
          disabled={disabled}
          type={inType === "time" ? "time" : inType}
          onInput={handleInput}
          onPaste={handlePaste}
          max={max ?? null}
          min={min ?? null}
          step={step || (decimal ? `0.${"0".repeat(Math.max(decimalPlaces - 1, 0))}1` : null)}
          maxLength={maxLength || null}
          defaultValue={defaultValue || ""}
          value={name === "iban" ? IBAN.printFormat(iban, " ") : undefined}
        />
        {type === "password" && (
          <div
            className="absolute right-4 cursor-pointer top-1/2 transform -translate-y-1/2 text-[#64748B]"
            onClick={onChange}
          >
            {inType === "text" ? (
              <IoEyeOutline size={24} />
            ) : (
              <img src={EyeOf} />
            )}
          </div>
        )}
      </div>
      {!isErrorHide && getErrorMessage() && (
        <p className="text-red text-xs flex items-center gap-2 mt-1 font-medium">
          <img src={Error} className="" />
          {getErrorMessage()}
        </p>
      )}
    </div>
  );
}
