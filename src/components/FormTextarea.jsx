import Error from "images/icons/error.png";

export default function FormTextarea({
  placeholder,
  errors,
  register,
  name,
  label,
  labelClass,
  required,
  disabled,
  readOnly,
  minLength,
  maxLength = 500,
  rows = 4,
  pattern,
  validate,
  isErrorHide,
  className,
  value,
  onValueChange,
  wrapperClass,
}) {
  const isControlled = typeof register !== "function";

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

  return (
    <div className={wrapperClass || "grow"}>
      {label ? (
        <label
          className={`text-sm text-linkText font-medium leading-6 mb-1 block ${
            labelClass || ""
          }`}
        >
          {label}
          <span className="text-[#EC1212]">{required ? "*" : ""}</span>
        </label>
      ) : null}
      <textarea
        rows={rows}
        id={name}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full rounded-md border bg-white placeholder:text-gray placeholder:font-normal text-black transition duration-300 text-sm hover:border-[#ffba32] border-[#E0E5F2] focus:border-[#ffba32] focus:outline-0 p-[11px_16px] resize-y min-h-[2.5rem] disabled:cursor-not-allowed dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-white/40 ${
          errors && errors[name] ? "border-red" : ""
        } ${className || ""}`}
        {...(isControlled
          ? {
              value: value ?? "",
              onChange: (e) => onValueChange?.(e.target.value),
            }
          : register(name, {
              required,
              minLength,
              maxLength,
              pattern,
              validate,
            }))}
      />
      {!isErrorHide && getErrorMessage() && (
        <p className="text-red text-xs flex items-center gap-2 mt-1 font-medium">
          <img src={Error} alt="" />
          {getErrorMessage()}
        </p>
      )}
    </div>
  );
}
