import { useState, createElement } from "react";
import Error from "images/icons/error.png";
import EyeOf from "images/icons/eye-off.png";
import { IoEyeOutline } from "react-icons/io5";

const Input = ({
  placeholder,
  error,
  value,
  type,
  icon,
  src,
  label,
  position,
  required,
  labelClass,
  onChange,
  className,
  imgClass,
  iconClass,
  prefixText,
}) => {
  const [inType, setInType] = useState(type);

  // handle password visibility
  const changeType = () => {
    setInType(inType !== "password" ? type : "password");
  };

  const changeVal = (val) => {
    if (onChange) {
      onChange(val);
    }
  };

  return (
    <>
      {label && (
        <label
          className={`text-sm font-medium text-linkText leading-6 mb-1 block ${labelClass}`}
        >
          {label} <span className="text-[#EC1212]">{required ? "*" : ""}</span>
        </label>
      )}
      <div className="relative" dir={prefixText ? "ltr" : undefined}>
        {/* If prefixText exists → show prefix, otherwise show icon */}
        {(prefixText || icon) && (
          <span
            className={`absolute pointer-events-none ${
              position === "right"
                ? "ltr:right-3 rtl:left-3"
                : "ltr:left-3 rtl:right-3"
            } top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-gray-500`}
          >
            {prefixText ? (
              <span className="text-sm font-medium">{prefixText}</span>
            ) : (
              createElement(icon, { className: iconClass })
            )}
          </span>
        )}

        {/* Handle src (image URL) */}
        {src && (
          <img
            src={src}
            className={`absolute pointer-events-none ${
              position === "right"
                ? "ltr:right-3 rtl:left-3"
                : "ltr:left-3 rtl:right-3"
            } top-1/2 size-4 transform -translate-y-1/2 ${imgClass || ""}`}
            alt=""
          />
        )}

        <input
          onChange={(e) => changeVal(e.target.value)}
          className={`h-10 ${
            className || ""
          } rounded-md border bg-white placeholder:text-gray placeholder:font-normal text-black transition duration-300 text-sm hover:border-[#ffba32] border-[#E0E5F2] focus:border-[#ffba32] focus:outline-0 ${
            label === "Mobile"
              ? "ltr:pl-16 rtl:pr-16"
              : prefixText
                ? "ltr:pl-12 rtl:pr-12"
                : (icon || src) && position !== "right"
                  ? "ltr:pl-10 rtl:pr-10"
                  : (icon || src) && position === "right"
                    ? "ltr:pr-10 rtl:pl-10"
                    : ""
          } p-[11px_16px] w-full text-para font-medium disabled:cursor-not-allowed ${
            error ? "border-red" : ""
          }`}
          value={value}
          placeholder={placeholder}
          type={inType}
        />
        {type === "password" && (
          <div
            className="absolute ltr:right-4 rtl:left-4 top-1/2 transform -translate-y-1/2 text-[#64748B]"
            onClick={changeType}
          >
            {inType === "text" ? (
              <IoEyeOutline size={24} />
            ) : (
              <img src={EyeOf} alt="Hide password" />
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="text-red text-xs flex items-center gap-2 mt-3 font-medium">
          <img src={Error} alt="Error" />
          {error}
        </p>
      )}
    </>
  );
};

export default Input;
