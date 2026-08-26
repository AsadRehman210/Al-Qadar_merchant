import { RadioGroup, Radio } from "@headlessui/react";
import { FaCircle } from "react-icons/fa";

export default function RadioButtons({
  options = [],
  selected,
  onChange,
  radioClass,
  labelClass,
  groupClass = "",
  itemClass = "",
  disabled = false,
}) {
  return (
    <RadioGroup
      value={selected}
      onChange={(val) => !disabled && onChange?.(val)}
      className={`flex flex-wrap gap-4 ${groupClass}`}
      disabled={disabled}
    >
      {options.map((option) => (
        <Radio
          key={option.value}
          value={option.value}
          className={({ disabled }) =>
            `${itemClass} flex items-center gap-3 text-sm font-normal leading-[160%] rounded-md px-3 py-2 transition-all ${
              disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`
          }
        >
          {({ checked }) => (
            <>
              <span
                className={`${
                  radioClass || ""
                } flex justify-center items-center size-5 border  rounded-full ${
                  checked
                    ? "bg-white text-blue border-blue-700"
                    : "bg-white border-[#E2E8F0]"
                }`}
              >
                {checked && <FaCircle className="text-blue text-xs" />}
              </span>
              <span className={`${labelClass || ""}`}>{option.label}</span>
            </>
          )}
        </Radio>
      ))}
    </RadioGroup>
  );
}
