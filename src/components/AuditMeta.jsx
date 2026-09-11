import { useTranslation } from "react-i18next";

const labelOf = (record, kind) =>
  kind === "updated" ? record?.updatedByName : record?.createdByName;

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
      {label}
    </p>
    <p className="font-semibold text-slate-800 dark:text-white mt-0.5 break-words">
      {value || "—"}
    </p>
  </div>
);

/** Display names only — never the actor id. */
const AuditMeta = ({ record }) => {
  const { t } = useTranslation();
  if (!record) return null;
  const created = labelOf(record, "created");
  const updated = labelOf(record, "updated");
  if (!created && !updated) return null;

  return (
    <>
      <Field label={t("created_by")} value={created} />
      <Field label={t("updated_by")} value={updated} />
    </>
  );
};

const AuditLine = ({ record, className = "" }) => {
  const { t } = useTranslation();
  const created = labelOf(record, "created");
  const updated = labelOf(record, "updated");
  if (!created && !updated) return null;
  return (
    <p
      className={`text-xs text-slate-400 dark:text-white/40 truncate ${className}`}
      title={`${created || "—"} / ${updated || "—"}`}
    >
      {t("created_by")}: {created || "—"} · {t("updated_by")}: {updated || "—"}
    </p>
  );
};

export { labelOf, AuditLine };
export default AuditMeta;
