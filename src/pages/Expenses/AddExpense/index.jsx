import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import SelectDropdown from "components/SelectDropdown";
import UploadSingleFile from "components/UploadSingleFile";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { EXPENSE_TYPE_IDS } from "global/constant";
import { applyExpense } from "store/slices/expenseSlice";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { showUserData } from "store/slices/uniqueSlice";

const { add_employee } = rafeeqi_role_ids;

const PAYMENT_METHODS = [
  { title: "expenses:cash", id: "Cash" },
  { title: "expenses:bank", id: "Bank" },
  { title: "expenses:card", id: "Card" },
  { title: "expenses:online", id: "Online" },
];

const EXPENSE_TYPE_OPTIONS = EXPENSE_TYPE_IDS.map((id) => ({
  title: `expenses:${id}`,
  id,
}));

// Expense claims have no backend update/delete endpoint (only apply + the
// approval-workflow PATCH actions) — this form is create-only. approvalStatus
// / paymentStatus / approvedBy are always server-computed by that workflow,
// never client-set, so they're not present as fields here.
const AddExpense = ({ selfService = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const employees = useSelector(showEmployees);
  const departments = useSelector(showDepartments);
  const userData = useSelector(showUserData);
  const tenantCurrency = userData?.currency || "SAR";

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selExpenseType, setSelExpenseType] = useState(EXPENSE_TYPE_OPTIONS[0]);
  const [selPaymentMethod, setSelPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const employeeOptions = useMemo(
    () =>
      employees.map((e) => ({
        id: e.id,
        title: `${e.first_name || ""} ${e.last_name || ""} (${e.employeeCode || ""})`.trim(),
        department: departments.find((d) => d.id === e.departmentId)?.name,
      })),
    [employees, departments],
  );

  const { register, handleSubmit, setValue, trigger, formState: { errors } } = useForm({
    mode: "onChange",
    defaultValues: {
      employee_id: "",
      department: "",
      expenseType: EXPENSE_TYPE_IDS[0],
      expenseDate: new Date().toISOString().split("T")[0],
      amount: 0,
      paymentMethod: "Cash",
      description: "",
      notes: "",
      projectName: "",
    },
  });

  const onSubmit = async (data) => {
    if (!tenantCurrency) {
      toast.error(t("expenses:currency_required", "Currency is required"));
      return;
    }
    setSubmitting(true);
    const payload = {
      employeeId: selectedEmployee.id,
      expenseType: selExpenseType?.id,
      expenseDate: data.expenseDate,
      amount: Number(data.amount) || 0,
      paymentMethod: selPaymentMethod?.id,
      description: data.description || undefined,
      notes: data.notes || undefined,
      receiptUrl: receiptFile ? "/receipts/uploaded.pdf" : undefined,
      appliedVia: selfService ? "employee" : "hr",
    };

    try {
      await dispatch(applyExpense(payload)).unwrap();
      toast.success(t("expenses:add_success"));
      navigate("/expenses");
    } catch (err) {
      toast.error(err || t("expenses:save_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmployeeSelect = (v) => {
    setSelectedEmployee(v?.id ? v : null);
    setValue("employee_id", v?.id || "");
    setValue("department", v?.department || "");
    trigger("employee_id");
  };

  if (!selfService && !checkRoleAuth(add_employee)) return null;

  const isRTL = i18n.language === "ar";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/expenses")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 hover:-translate-x-0.5 rtl:hover:translate-x-0.5 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {selfService ? t("expenses:claim_expense") : t("expenses:add_expense")}
            </h1>
            <p className="text-mutedForeground">
              {t("expenses:expense_module_desc")}
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
                label={t("expenses:select_employee")}
                data={employeeOptions}
                selected={selectedEmployee || {}}
                setSelected={handleEmployeeSelect}
                name="employee_id"
                register={register}
                setValue={setValue}
                trigger={trigger}
                valueKey="id"
                errors={errors}
                required
              />
            </div>
            <FormInput
              label={t("expenses:department")}
              name="department"
              register={register}
              placeholder={t("expenses:department")}
            />
            <FormInput
              label={t("expenses:project_name")}
              name="projectName"
              register={register}
              errors={errors}
              pattern={/[a-zA-Z0-9\s.'-]/}
              minLength={2}
              maxLength={100}
              placeholder="Project Alpha"
            />
            <SelectDropdown
              label={t("expenses:expense_type")}
              data={EXPENSE_TYPE_OPTIONS}
              selected={selExpenseType}
              setSelected={setSelExpenseType}
              name="expenseType"
              register={register}
              setValue={setValue}
              trigger={trigger}
              valueKey="id"
              errors={errors}
              required
            />
            <FormInput
              label={t("expenses:expense_date")}
              name="expenseDate"
              type="date"
              register={register}
              errors={errors}
              required
              max={new Date().toISOString().split("T")[0]}
            />
            <FormInput
              label={t("expenses:amount")}
              name="amount"
              type="number"
              min={0.01}
              decimal
              decimalPlaces={3}
              maxLength={10}
              register={register}
              errors={errors}
              required
            />
            <SelectDropdown
              label={t("expenses:currency")}
              data={[{ id: tenantCurrency, title: tenantCurrency }]}
              selected={{ id: tenantCurrency, title: tenantCurrency }}
              setSelected={() => {}}
              valueKey="id"
              hideClear
              disabled
              required
            />
            <SelectDropdown
              label={t("expenses:payment_method")}
              data={PAYMENT_METHODS}
              selected={selPaymentMethod}
              setSelected={setSelPaymentMethod}
              name="paymentMethod"
              register={register}
              setValue={setValue}
              trigger={trigger}
              valueKey="id"
            />
            <FormTextarea
              label={t("expenses:description")}
              name="description"
              register={register}
              errors={errors}
              rows={3}
              maxLength={{ value: 500, message: "Maximum length is 500 characters" }}
              placeholder={t("expenses:notes")}
              wrapperClass="lg:col-span-3"
            />
            <div className="lg:col-span-3">
              <label className="text-sm font-medium text-linkText leading-6 mb-1 block">
                {t("expenses:upload_receipt")}
              </label>
              <UploadSingleFile
                name="receipt"
                register={register}
                setValue={setValue}
                trigger={trigger}
                onChange={(file) => setReceiptFile(file)}
                fileType="both"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button
              type="button"
              title={t("cancel")}
              onClick={() => navigate("/expenses")}
              className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
            />
            <Button
              type="submit"
              title={t("expenses:save")}
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

export default AddExpense;
