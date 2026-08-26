/**
 * Dynamic English → Arabic translation service
 *
 * Current: MyMemory API (free, no API key, CORS-friendly)
 * Production: Replace with Google Cloud Translation API or similar
 *
 * Usage:
 *   import { translateToArabic } from 'global/i18n/translationService';
 *   const { ok, data, error } = await translateToArabic('Hello world');
 *   if (ok) setValue('name_ar', data);
 */

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const MAX_TEXT_LENGTH = 500; // MyMemory GET URL limit; for longer text use Google Cloud

/**
 * @param {string} text - English text to translate
 * @returns {Promise<{ ok: boolean; data: string; error?: string }>}
 */
export async function translateToArabic(text) {
  if (text == null || typeof text !== "string") {
    return { ok: false, data: "", error: "Invalid text" };
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: true, data: "" };
  }

  const toTranslate =
    trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed;

  try {
    const url = `${MYMEMORY_URL}?q=${encodeURIComponent(toTranslate)}&langpair=en|ar`;
    const res = await fetch(url);
    const json = await res.json();

    if (json.responseStatus !== 200) {
      return {
        ok: false,
        data: "",
        error: json.responseDetails || "Translation failed",
      };
    }

    const translated = json.responseData?.translatedText || toTranslate;
    return { ok: true, data: translated };
  } catch (e) {
    return {
      ok: false,
      data: "",
      error: e?.message || "Network error",
    };
  }
}
