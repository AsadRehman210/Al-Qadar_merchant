import { useTranslation } from "react-i18next";
import { FiInbox } from "react-icons/fi";

// The one "no data found" state, reused everywhere a list/table/chart has
// finished loading (success) but came back empty — replaces the many
// one-off "No record found" strings scattered per-page with a single
// consistent component.
const EmptyState = ({ icon: Icon = FiInbox, title, description, action, className = "" }) => {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col items-center justify-center text-center py-14 px-4 ${className}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40 mb-3">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-slate-600 dark:text-white/70">
        {title || t("no_data_found")}
      </p>
      {description && (
        <p className="text-xs text-slate-400 dark:text-white/40 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
