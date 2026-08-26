import { useTranslation } from "react-i18next";

const NotesTab = ({ invoice, panelClass }) => {
  const { t } = useTranslation();

  return (
    <div className={panelClass}>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        {t("purchase:notes_tab")}
      </h3>
      {invoice.notes ? (
        <p className="text-slate-700 dark:text-white/90 whitespace-pre-wrap mb-8">
          {invoice.notes}
        </p>
      ) : (
        <p className="text-slate-500 dark:text-white/60 text-center py-6 mb-8">
          {t("purchase:no_notes_available", { defaultValue: "No notes available" })}
        </p>
      )}
      <ul className="space-y-4">
        {(invoice.notesLog || []).map((n) => (
          <li
            key={n.id}
            className="rounded-xl border border-slate-200 dark:border-white/20 p-4 bg-slate-50/80 dark:bg-white/5"
          >
            <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500 dark:text-white/50 mb-1">
              <span>{n.date}</span>
              <span>{n.createdBy}</span>
            </div>
            <p className="text-sm text-slate-800 dark:text-white/90">{n.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotesTab;
