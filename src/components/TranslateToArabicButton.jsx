import { useState } from "react";
import { translateToArabic } from "global/i18n/translationService";
import { useTranslation } from "react-i18next";
import { CiGlobe } from "react-icons/ci";
import { toast } from "react-toastify";

/**
 * Form fields ke saath use: user English text ko Arabic me convert kare.
 *
 * Placement: Input/textarea ke right side (LTR) ya left (RTL), as icon button.
 *
 * @param {string} sourceValue   - English text (e.g. getValues('name_en') ya state)
 * @param {function} onTranslated - (arText: string) => void — Arabic field me set karne ke liye
 * @param {boolean} disabled     - Button disable (e.g. empty source)
 * @param {string} className     - Extra classes
 */
export default function TranslateToArabicButton({
  sourceValue = "",
  onTranslated,
  disabled,
  className = "",
}) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleClick = async () => {
    const str = typeof sourceValue === "string" ? sourceValue.trim() : "";
    if (!str) {
      toast.info(t("translate_to_arabic") ? t("translate_to_arabic") : "Enter text in the source field first");
      return;
    }
    if (typeof onTranslated !== "function") return;

    setLoading(true);
    try {
      const { ok, data, error } = await translateToArabic(str);
      if (ok) {
        onTranslated(data);
        toast.success("Translated to Arabic");
      } else {
        toast.error(error || "Translation failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      title={t("translate_to_arabic") || "Translate to Arabic"}
      className={`inline-flex items-center justify-center rounded p-1.5 text-[#64748B] hover:bg-gray-100 hover:text-[#334155] disabled:opacity-50 disabled:cursor-not-allowed transition ${className}`}
    >
      {loading ? (
        <span className="size-4 border-2 border-[#64748B] border-t-transparent rounded-full animate-spin" />
      ) : (
        <CiGlobe className="size-5" />
      )}
    </button>
  );
}
