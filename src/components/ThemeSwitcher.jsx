import { Night } from "assets/svgs";
import { useEffect, useState } from "react";
import { MdOutlineLightMode } from "react-icons/md";

export default function ThemeSwitcher() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setEnabled(true);
      document.body.classList.add("dark");
    } else {
      setEnabled(false);
      document.body.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !enabled;
    setEnabled(next);
    if (next) {
      localStorage.setItem("theme", "dark");
      document.body.classList.add("dark");
    } else {
      localStorage.setItem("theme", "light");
      document.body.classList.remove("dark");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="size-9 rounded-xl flex items-center justify-center text-gray-600 hover:text-teal-600 hover:bg-teal-50 dark:text-white dark:hover:text-teal-400 dark:hover:bg-white/10 transition-colors"
      aria-label={enabled ? "Switch to light mode" : "Switch to dark mode"}
    >
      {enabled ? <Night /> : <MdOutlineLightMode size={22} />}
    </button>
  );
}
