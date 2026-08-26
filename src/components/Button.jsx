import { createElement } from "react";
import { FaSpinner } from "react-icons/fa6";
import { Link } from "react-router-dom";

export default function Button({
  className = "",
  onClick,
  type,
  title,
  src,
  icon,
  btn,
  disabled,
  imgClass,
  loading,
  iconClass,
  href,
}) {
  const ButtonComponent = href ? Link : "button";

  return (
    <ButtonComponent
      to={href}
      onClick={onClick}
      type={type}
      disabled={disabled || loading}
      className={`${className} ${
        src || icon || loading ? "gap-1 text-[#2B3674] justify-center" : ""
      } inline-flex items-center justify-center h-10 !rounded-lg gap-4 px-7 border text-sm disabled:opacity-60 disabled:cursor-default cursor-pointer  ${
        btn === "primary"
          ? "font-medium rounded-lg  !bg-[var(--color-teal-500)] text-btnText border-[var(--color-teal-500)]/10 py-2 px-4"
          : btn === "secondary"
            ? "font-semibold !bg-gray-200 text-[#2B3674] border-gray-300"
            : btn === "disabled"
              ? "bg-[#DCE0E4] border-[#DCE0E4] text-black"
              : btn === "outline"
                ? "!text-black/80 font-semibold border-primary/10 bg-transparent"
                : "bg-white font-semibold text-[#2B3674] border-[#E2E8F0]"
      }`}
    >
      {src && <img src={src} className={`${imgClass || ""}`} />}
      {icon && createElement(icon, { className: iconClass })}
      {loading ? <FaSpinner className="animate-spin" /> : title}
    </ButtonComponent>
  );
}
