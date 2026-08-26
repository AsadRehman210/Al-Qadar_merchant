import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import UploadMultipleFile from "components/UploadMultipleFile";
import UploadSingleFile from "components/UploadSingleFile";
import Button from "components/Button";

const Documents = ({ setSelectedIndex, setValidValues }) => {
  const { t } = useTranslation();
  const { register, setValue, trigger } = useFormContext();

  const onSubmit = () => {
    setValidValues(4);
    setSelectedIndex(4);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-full">
          <UploadSingleFile name="resume" label={t("employees:resume")} register={register} setValue={setValue} trigger={trigger} fileType="pdf" />
          <p className="text-xs text-slate-400 dark:text-white/40 mt-1">{t("employees:resume_hint")}</p>
        </div>
        <div className="col-span-full">
          {/* Field is named "certificate_documents", not "certificates" — the
              Qualification step already owns "certificates" for the
              education-certificates array; reusing that name here would
              silently overwrite it since both live in the same form. */}
          <UploadMultipleFile name="certificate_documents" label={t("employees:certificates")} register={register} setValue={setValue} trigger={trigger} fileType="both" />
          <p className="text-xs text-slate-400 dark:text-white/40 mt-1">{t("employees:certificates_upload_hint")}</p>
        </div>
        <div className="col-span-full">
          <UploadSingleFile name="id_proof" label={t("employees:id_proof")} register={register} setValue={setValue} trigger={trigger} fileType="both" />
          <p className="text-xs text-slate-400 dark:text-white/40 mt-1">{t("employees:id_proof_hint")}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
        <Button type="button" title={t("back")} className="!rounded-md !border-slate-200" onClick={() => setSelectedIndex(2)} />
        <Button type="submit" title={t("next")} btn="primary" className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0" />
      </div>
    </form>
  );
};

export default Documents;
