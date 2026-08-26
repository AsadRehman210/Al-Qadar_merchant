import { useTranslation } from "react-i18next";

const InventoryPlaceholder = ({ titleKey }) => {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <h1 className="text-3xl font-bold tracking-tight">{t(titleKey)}</h1>
          <p className="text-mutedForeground mt-2">{t("product:placeholder_module")}</p>
        </div>
        <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-10 text-center text-slate-600 dark:text-white/70">
          {t("product:placeholder_module")}
        </div>
      </div>
    </div>
  );
};

export default InventoryPlaceholder;
