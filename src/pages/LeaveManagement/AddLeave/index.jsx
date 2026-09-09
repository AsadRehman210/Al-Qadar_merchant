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
import { alqadar_role_ids } from "global/alqadarRoles";
import { applyLeave } from "store/slices/leaveSlice";
import { fetchLeaveTypes, showLeaveTypes } from "store/slices/leaveTypeSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { leaveHalfDayOptions } from "global/constant";

const { add_leave, approve_leave } = alqadar_role_ids;

// Create-only � the backend has no PUT/update endpoint for a leave request
// (only apply/approve/reject/cancel), so the earlier edit-mode path was
// dropped. HR-direct entries are submitted with appliedVia: "hr", which the
// backend auto-approves through both approval stages immediately.
const AddLeave = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const employees = useSelector(showEmployees);
  const leaveTypes = useSelector(showLeaveTypes);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchLeaveTypes());
  }, [dispatch]);

  const [selEmployee, setSelEmployee] = useState(null);
  const [selHalfDay, setSelHalfDay] = useState(leaveHalfDayOptions[0]);

  const empOpts = useMemo(
    () => employees.filter((e) => e.status === "active").map((e) => ({
      id: e.id,
      title: `${e.first_name || ""} ${e.last_name || ""} (${e.employeeCode || ""})`.trim(),
    })),
    [employees],
  );

  const activeTypes = useMemo(
    () => leaveTypes.filter((x) => x.status === "Active").map((x) => ({ ...x, title: x.name })),
    [leaveTypes],
  );

  const [selType, setSelType] = useState(null);
  useEffect(() => {
    if (!selType && activeTypes.length) setSelType(activeTypes[0]);
  }, [activeTypes, selType]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
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
    const base = diff >= 0 ? diff + 1 : 0;
    if (selHalfDay?.id !== "full") return base - 0.5;
    return base;
  }, [fromDate, toDate, selHalfDay]);

  const onSubmit = async (data) => {
    if (totalDays <= 0 || data.toDate < data.fromDate) {
      toast.error(t("leave:err_invalid_dates"));
      return;
    }

    try {
      await dispatch(applyLeave({
        employeeId: selEmployee.id,
        leaveTypeId: selType.id,
        fromDate: data.fromDate,
        toDate: data.toDate,
        days: totalDays,
        halfDay: selHalfDay?.id,
        reason: data.reason,
        handoverToEmployeeId: data.handoverTo || undefined,
        emergencyContact: data.emergencyContact,
        appliedVia: "hr",
      })).unwrap();
      toast.success(t("leave:add_success"));
      navigate("/leave-management");
    } catch (err) {
      toast.error(err || t("leave:add_failed"));
    }
  };

  if (!checkRoleAuth(add_leave)) return null;

  const isRTL = i18n.language === "ar";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/leave-management")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("leave:add_leave_hr")}
            </h1>
            <p className="text-mutedForeground">{t("leave:hr_add_desc")}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]"
        >
          {/* HR direct notice */}
          <div className="mb-6 p-4 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30">
            <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">{t("leave:hr_direct_note")}</p>
            <p className="text-xs text-teal-700 dark:text-teal-400 mt-0.5">{t("leave:hr_direct_desc")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SelectDropdown
                label="leave:employee"
                data={empOpts}
                selected={selEmployee || {}}
                setSelected={(v) => setSelEmployee(v?.id ? v : null)}
                name="employeeId"
                register={register}
                setValue={setValue}
                trigger={trigger}
                errors={errors}
                required
              />
            </div>
            <SelectDropdown
              label="leave:leave_type"
              data={activeTypes}
              selected={selType}
              setSelected={(v) => setSelType(v || activeTypes[0])}
              name="leaveTypeId"
              register={register}
              setValue={setValue}
              trigger={trigger}
              errors={errors}
              required
            />
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
            <SelectDropdown
              label="leave:day_type"
              data={leaveHalfDayOptions}
              selected={selHalfDay}
              setSelected={(v) => setSelHalfDay(v || leaveHalfDayOptions[0])}
              name="halfDay"
              register={register}
            />
            <div>
              <label className="text-sm font-medium text-linkText leading-6 mb-1 block">
                {t("leave:total_days")}
              </label>
              <div className="h-[46px] rounded-lg border border-teal-400 bg-teal-50 dark:bg-teal-500/10 flex items-center px-4 font-semibold text-lg text-teal-700 dark:text-teal-300">
                {totalDays} {t("leave:days")}
              </div>
            </div>
            <FormInput label={t("leave:handover_to")} name="handoverTo" register={register} errors={errors}
              pattern={/[a-zA-Z\s.'-]/} minLength={2} maxLength={100} />
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
              required={t("leave:reason_required")}
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
              title={t("save")}
              btn="primary"
              className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeave;
