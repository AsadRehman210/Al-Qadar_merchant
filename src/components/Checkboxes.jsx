import { Checkbox, Field } from "@headlessui/react";
import { FaCheck } from "react-icons/fa";

export default function Checkboxes({
  enabled,
  onChange,
  checkClass,
  label,
  labelClass,
  className,
  disabled = false,
  fieldClass = "",
}) {
  let bgChecked;
  if (checkClass) {
    bgChecked = `data-[checked]:${checkClass}`;
  }
  return (
    <Field
      disabled={disabled}
      onClick={() => {
        onChange && onChange(!enabled);
      }}
      className={`${fieldClass} flex items-center cursor-pointer gap-3 text-sm font-normal leading-[160%] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60`}
    >
      <span className="data-[checked]:bg-lightBlue data-[checked]:bg-blue hidden"></span>
      <Checkbox
        checked={enabled}
        disabled={disabled}
        onClick={() => {
          onChange && onChange(!enabled);
        }}
        className={`${bgChecked || "data-[checked]:bg-blue"} ${
          className || ""
        } group rounded-lg p-1 border border-[#E2E8F0] ring-inset flex justify-center items-center size-5`}
      >
        <FaCheck className="hidden text-inherit fill-white group-data-[checked]:block" />
      </Checkbox>
      {label && <span className={`${labelClass || ""}`}>{label || ""}</span>}
    </Field>
  );
}
