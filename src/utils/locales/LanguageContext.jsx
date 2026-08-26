import { useTranslation } from "react-i18next";

// Minimal bridge for components authored against a `useTranslations(namespace)`
// contract (returns a `(key) => string | undefined` lookup) — this app's own
// i18n lives in react-i18next namespace JSON files that don't define a
// generic "form"/"loading" namespace, so this deliberately returns `undefined`
// for anything not found rather than i18next's usual "return the raw key"
// behavior, letting the caller's own `?? "fallback text"` take over cleanly.
export function useTranslations(namespace) {
  const { t, i18n } = useTranslation();
  return (key) => {
    const fullKey = `${namespace}:${key}`;
    return i18n.exists(fullKey) ? t(fullKey) : undefined;
  };
}

export default useTranslations;
