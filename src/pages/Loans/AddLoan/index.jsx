import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight, FiUpload, FiFileText, FiTrash2 } from "react-icons/fi";
import Button from "components/Button";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { applyLoan } from "store/slices/loanSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { loanTypeOptions, loanPurposeOptions } from "global/constant";

const { add_employee } = rafeeqi_role_ids;

// Applying for a loan only submits its terms — the backend computes status,
// EMI schedule, approvals, disbursement, etc. through its own workflow
// actions (see LoanDetail), never through direct field edits here. There is
// also no backend endpoint to edit or delete a submitted loan, so this
// component is create-only (the fake-data version's edit mode is gone).
const AddLoan = ({ selfService = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isRTL = i18n.language === "ar";

  const employees = useSelector(showEmployees);
  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selLoanType, setSelLoanType] = useState(loanTypeOptions[0]);
  const [selPurpose, setSelPurpose] = useState(loanPurposeOptions[0]);
  const [submitting, setSubmitting] = useState(false);

  const employeeOptions = useMemo(
    () =>
      employees
        .filter((e) => e.status === "active")
        .map((e) => ({ id: e.id, title: `${e.first_name || ""} ${e.last_name || ""} (${e.employeeCode || ""})`.trim() })),
    [employees],
  );

  const { register, handleSubmit, setValue, trigger, formState: { errors } } = useForm({
    mode: "onChange",
    defaultValues: {
      loanAmount: 50000,
      interestPercent: 0,
      numberOfInstallments: 12,
      notes: "",
      guarantorName: "",
      guarantorContact: "",
      guarantorAddress: "",
    },
  });

  const isEmi = selLoanType?.id === "EMI Loan";

  // Document attachments carry only metadata — there's no file-upload
  // endpoint on the backend, so these are descriptive records, not real files.
  const fileInputRef = useRef(null);
  const [attachedDocs, setAttachedDocs] = useState([]);

  const handleFileAttach = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedDocs((prev) => [...prev, { id: `doc-${Date.now()}`, name: file.name, type: file.type, size: file.size }]);
    e.target.value = "";
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        employeeId: selectedEmployee.id,
        loanType: selLoanType?.id,
        loanPurpose: selPurpose?.id,
        loanAmount: Number(data.loanAmount) || 0,
        interestPercent: isEmi ? Number(data.interestPercent) || 0 : 0,
        numberOfInstallments: Number(data.numberOfInstallments) || 1,
        appliedVia: selfService ? "employee" : "hr",
        guarantor: {
          name: data.guarantorName || undefined,
          contact: data.guarantorContact || undefined,
          address: data.guarantorAddress || undefined,
        },
        notes: data.notes || undefined,
        documents: attachedDocs.map((d) => ({ name: d.name, type: d.type, size: d.size })),
      };
      await dispatch(applyLoan(payload)).unwrap();
      toast.success(t("loans:add_success"));
      navigate("/loans");
    } catch (err) {
      toast.error(err || t("loans:save_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  // HR direct entry requires the add permission; employee self-service is open.
  if (!selfService && !checkRoleAuth(add_employee)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/loans")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 hover:-translate-x-0.5 rtl:hover:translate-x-0.5 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {selfService ? t("loans:apply_loan") : t("loans:add_loan")}
            </h1>
            <p className="text-mutedForeground">
              {selfService ? t("loans:apply_loan_desc") : t("loans:loan_module_desc")}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SelectDropdown
                label={t("loans:select_employee")}
                data={employeeOptions}
                selected={selectedEmployee || {}}
                setSelected={setSelectedEmployee}
                name="employee_id"
                register={register}
                setValue={setValue}
                trigger={trigger}
                errors={errors}
                required
              />
            </div>
            <SelectDropdown
              label={t("loans:loan_type")}
              data={loanTypeOptions}
              selected={selLoanType}
              setSelected={setSelLoanType}
              name="loanType"
              register={register}
              setValue={setValue}
              trigger={trigger}
              valueKey="id"
              errors={errors}
              required
            />
            <SelectDropdown
              label={t("loans:loan_purpose")}
              data={loanPurposeOptions}
              selected={selPurpose}
              setSelected={setSelPurpose}
              name="loanPurpose"
              register={register}
              setValue={setValue}
              trigger={trigger}
              valueKey="id"
              errors={errors}
              required
            />
            <FormInput
              label={t("loans:loan_amount")}
              name="loanAmount"
              type="number"
              min={0.01}
              decimal
              decimalPlaces={3}
              maxLength={10}
              register={register}
              errors={errors}
              required
            />
            {isEmi && (
              <FormInput
                label={t("loans:interest_percent")}
                name="interestPercent"
                type="number"
                min={0}
                max={100}
                decimal
                decimalPlaces={2}
                register={register}
                errors={errors}
              />
            )}
            <FormInput
              label={t("loans:number_of_installments")}
              name="numberOfInstallments"
              type="number"
              min={1}
              max={60}
              register={register}
              errors={errors}
              required
            />
            <FormTextarea
              label={t("loans:notes")}
              name="notes"
              register={register}
              errors={errors}
              rows={3}
              maxLength={{ value: 500, message: t("max_length_500") || "Maximum length is 500 characters" }}
              placeholder={t("loans:notes")}
              wrapperClass="lg:col-span-3"
            />
            <div className="lg:col-span-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                {t("loans:guarantor")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormInput
                  label={t("loans:guarantor_name")}
                  name="guarantorName"
                  register={register}
                  errors={errors}
                  pattern={/[a-zA-Z\s.'-]/}
                  minLength={2}
                  maxLength={100}
                />
                <FormInput
                  label={t("loans:guarantor_contact")}
                  name="guarantorContact"
                  register={register}
                  errors={errors}
                  pattern={/[0-9+\-() ]/}
                  minLength={7}
                  maxLength={20}
                />
                <FormInput
                  label={t("loans:guarantor_address")}
                  name="guarantorAddress"
                  register={register}
                  errors={errors}
                  pattern={/[a-zA-Z0-9\s.'-]/}
                  maxLength={200}
                />
              </div>
            </div>

            {/* Document Attachments (metadata only) */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("loans:documents")}</h3>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-teal-300 bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 text-sm font-medium hover:bg-teal-100 transition-colors">
                  <FiUpload className="h-4 w-4" /> {t("loans:attach_document")}
                </button>
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileAttach} />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/60 mb-3">{t("loans:document_hint")}</p>
              {attachedDocs.length > 0 ? (
                <div className="space-y-2">
                  {attachedDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      <FiFileText className="h-5 w-5 text-teal-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{doc.name}</p>
                        <p className="text-xs text-slate-400">{Math.round(doc.size / 1024)} KB</p>
                      </div>
                      <button type="button" onClick={() => setAttachedDocs((prev) => prev.filter((d) => d.id !== doc.id))}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600">
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 dark:border-white/20 rounded-xl p-6 text-center text-slate-400">
                  <FiFileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t("loans:no_documents_attached")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button
              type="button"
              title={t("cancel")}
              onClick={() => navigate("/loans")}
              className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
            />
            <Button
              type="submit"
              title={t("loans:save")}
              btn="primary"
              disabled={submitting}
              loading={submitting}
              className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLoan;
