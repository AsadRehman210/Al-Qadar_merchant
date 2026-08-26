import { useTranslation } from "react-i18next";
import { HiOutlineArrowDownTray } from "react-icons/hi2";
import Button from "components/Button";

const DownloadInvoiceTab = ({ onOpenPreview, panelClass }) => {
  const { t } = useTranslation();

  return (
    <div className={panelClass}>
      <div className="rounded-2xl bg-gradient-to-br from-teal-50 via-white to-slate-50 dark:from-teal-950/40 dark:via-white/5 dark:to-slate-900/40 border border-teal-100 dark:border-teal-500/20 p-8 text-center">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-teal-500/15 items-center justify-center mb-4">
          <HiOutlineArrowDownTray className="h-8 w-8 text-teal-600 dark:text-teal-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t("sales:preview_invoice")}
        </h3>
        <p className="text-slate-600 dark:text-white/70 text-sm max-w-md mx-auto mb-6">
          {t("sales:sales_module_desc")}
        </p>
        <Button
          type="button"
          title={t("sales:download_pdf")}
          icon={HiOutlineArrowDownTray}
          className="!rounded-md !h-12 !px-8 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700"
          iconClass="!text-xl"
          onClick={onOpenPreview}
          btn="primary"
        />
      </div>
    </div>
  );
};

export default DownloadInvoiceTab;
