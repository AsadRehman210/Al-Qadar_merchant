import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { applyLeave } from "store/slices/leaveSlice";
import { fetchLeaveTypes, showLeaveTypes } from "store/slices/leaveTypeSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";

const { add_employee } = rafeeqi_role_ids;

// Apply-only — there is no PUT/update endpoint for a submitted leave request
// on the backend (only apply/approve/reject/cancel), so edit mode was
// dropped, matching the Loan/Expense precedent elsewhere this session.
const ApplyLeave = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const employees = useSelector(showEmployees);
  const leaveTypes = useSelector(showLeaveTypes);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchLeaveTypes());
  }, [dispatch]);

  const employeeOptions = useMemo(
    () => employees.filter((e) => e.status === "active").map((e) => ({
      id: e.id,
      title: `${e.first_name || ""} ${e.last_name || ""} (${e.employeeCode || ""})`.trim(),
    })),
    [employees],
  );

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const activeTypes = useMemo(
    () => leaveTypes.filter((x) => x.status === "Active").map((x) => ({ ...x, title: x.name })),
    [leaveTypes],
  );

  const [selType, setSelType] = useState(null);
  useEffect(() => {
    if (!selType && activeTypes.length) setSelType(activeTypes[0]);
  }, [activeTypes, selType]);

  const { register, handleSubmit, setValue, trigger, watch, formState: { errors } } = useForm({
    mode: "onChange",
    defaultValues: {
      fromDate: new Date().toISOString().split("T")[0],
      toDate: new Date().toISOString().split("T")[0],
      reason: "",
      handoverTo: "",
      emergencyContact: "",
    },
  });

  const fromDate = watch("fromDate");
  const toDate = watch("toDate");
  const totalDays = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    const diff = Math.ceil((new Date(toDate) - new Date(fromDate)) / 86400000);
    return diff >= 0 ? diff + 1 : 0;
  }, [fromDate, toDate]);

  const selectedType = selType;
  const employeeById = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])),
    [employees],
  );
  const manager = selectedEmployee?.id
    ? employeeById[employeeById[selectedEmployee.id]?.managerEmployeeId]
    : null;

  const onSubmit = async (data) => {
    if (!selectedEmployee?.id || !selType?.id) return;

    if (totalDays <= 0 || data.toDate < data.fromDate) {
      toast.error(t("leave:err_invalid_dates"));
      return;
    }

    try {
      await dispatch(applyLeave({
        employeeId: selectedEmployee.id,
        leaveTypeId: selType.id,
        fromDate: data.fromDate,
        toDate: data.toDate,
        days: totalDays,
        reason: data.reason,
        handoverToEmployeeId: data.handoverTo || undefined,
        emergencyContact: data.emergencyContact,
        appliedVia: "employee",
      })).unwrap();
      toast.success(t("leave:apply_success"));
      navigate("/leave-management");
    } catch (err) {
      toast.error(err || t("leave:apply_failed"));
    }
  };

  if (!checkRoleAuth(add_employee)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/leave-management")}
            icon={i18n.language === "ar" ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-1 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("leave:apply_leave")}
            </h1>
            <p className="text-mutedForeground">{t("leave:apply_desc")}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60"
        >
          {/* Approval flow info */}
          <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">
              {t("leave:approval_flow_title")}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {[t("leave:step_apply"), t("leave:step_manager"), t("leave:step_hr"), t("leave:step_approved")].map(
                (step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0
                          ? "bg-teal-500 text-white"
                          : "bg-blue-200 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">{step}</span>
                    {i < 3 && <span className="text-blue-300">→</span>}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Employee */}
            <div className="lg:col-span-2">
              <SelectDropdown
                label={t("leave:employee")}
                data={employeeOptions}
                selected={selectedEmployee || {}}
                setSelected={(v) => setSelectedEmployee(v?.id ? v : null)}
                name="employeeId"
                register={register}
                setValue={setValue}
                trigger={trigger}
                required
              />
              <p className="text-xs text-slate-500 dark:text-white/60 mt-1.5">
                {t("leave:manager_label")}: <span className="font-semibold">{manager?.name || "—"}</span>
              </p>
            </div>

            {/* Leave Type */}
            <SelectDropdown
              label="leave:leave_type"
              data={activeTypes}
              selected={selType}
              setSelected={(v) => setSelType(v || activeTypes[0])}
              name="leaveTypeId"
              register={register}
              setValue={setValue}
              trigger={trigger}
              required
            />

            {/* Leave type info chips */}
            {selectedType && (
              <div className="lg:col-span-3 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-700">
                  {t("leave:entitled")}: {selectedType.daysPerYear} {t("leave:days")}
                </span>
                {selectedType.requiresDocument && (
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                    {t("leave:document_required")}
                  </span>
                )}
                {!selectedType.paid && (
                  <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700">
                    {t("leave:unpaid_label")}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  {t("leave:min_notice")}: {selectedType.minNoticeDays} {t("leave:days")}
                </span>
              </div>
            )}

            {/* Dates */}
            <FormInput
              label={t("leave:from_date")}
              name="fromDate"
              type="date"
              register={register}
              errors={errors}
              required
            />
            <FormInput
              label={t("leave:to_date")}
              name="toDate"
              type="date"
              register={register}
              errors={errors}
              required
              min={fromDate}
            />
            <div>
              <label className="text-sm font-medium text-linkText leading-6 mb-1 block">
                {t("leave:total_days")}
              </label>
              <div
                className={`h-[46px] rounded-lg border flex items-center px-4 font-semibold text-lg ${
                  totalDays > 0
                    ? "border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                {totalDays} {t("leave:days")}
              </div>
            </div>

            {/* Handover & Emergency */}
            <FormInput label={t("leave:handover_to")} name="handoverTo" register={register} errors={errors}
              pattern={/[a-zA-Z\s.'-]/} minLength={2} maxLength={150} />
            <FormInput
              label={t("leave:emergency_contact")}
              name="emergencyContact"
              register={register}
              errors={errors}
              pattern={/[0-9+\-() ]/}
              minLength={7}
              maxLength={20}
            />

            <FormTextarea
              label={t("leave:reason")}
              name="reason"
              register={register}
              errors={errors}
              required
              rows={4}
              minLength={{ value: 5, message: "Minimum length is 5 characters" }}
              maxLength={{ value: 500, message: "Maximum length is 500 characters" }}
              placeholder={t("leave:reason_placeholder")}
              wrapperClass="lg:col-span-3"
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button
              type="button"
              title={t("cancel")}
              onClick={() => navigate("/leave-management")}
              className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
            />
            <Button
              type="submit"
              title={t("leave:submit_request")}
              btn="primary"
              className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeave;
