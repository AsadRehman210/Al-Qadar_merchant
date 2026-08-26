import { useTranslation } from "react-i18next";
import { FileText, FileX } from "lucide-react";

const DocumentRow = ({ label, doc }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-white/20">
      {doc ? (
        <>
          <FileText className="h-8 w-8 text-teal-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-300 hover:underline truncate block"
            >
              {doc.name}
            </a>
            <p className="text-sm text-slate-500 dark:text-white/70">{label}</p>
          </div>
        </>
      ) : (
        <>
          <FileX className="h-8 w-8 text-slate-300 dark:text-white/20 shrink-0" />
          <div>
            <p className="font-medium text-slate-400 dark:text-white/40">{t("employees:not_uploaded")}</p>
            <p className="text-sm text-slate-400 dark:text-white/40">{label}</p>
          </div>
        </>
      )}
    </div>
  );
};

const DocumentsTab = ({ data }) => {
  const { t } = useTranslation();
  const certificates = Array.isArray(data?.certificate_documents)
    ? data.certificate_documents
    : [];

  return (
    <div className="space-y-4">
      <DocumentRow label={t("employees:resume")} doc={data?.resume} />
      <DocumentRow label={t("employees:id_proof")} doc={data?.id_proof} />
      {certificates.length > 0 ? (
        certificates.map((doc, i) => (
          <DocumentRow key={i} label={`${t("employees:certificates")} #${i + 1}`} doc={doc} />
        ))
      ) : (
        <DocumentRow label={t("employees:certificates")} doc={null} />
      )}
    </div>
  );
};

export default DocumentsTab;
