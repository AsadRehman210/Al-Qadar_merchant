import { useTranslation } from "react-i18next";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";

const SingleAttendanceTab = ({
  register,
  errors,
  setValue,
  trigger,
  employeeOptions,
  selectedEmployee,
  onEmployeeChange,
  selStatus,
  setSelStatus,
  selShift,
  setSelShift,
  statusOptions,
  shiftOptions,
  overtimeHours,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="col-span-full">
        <SelectDropdown
          label={t("attendance:select_employee")}
          data={employeeOptions}
          selected={selectedEmployee || {}}
          setSelected={onEmployeeChange}
          name="employee_id"
          register={register}
          setValue={setValue}
          trigger={trigger}
          errors={errors}
          required
        />
      </div>
      <FormInput
        label={t("attendance:date")}
        name="date"
        type="date"
        register={register}
        errors={errors}
        required
      />
      <SelectDropdown
        label={t("attendance:status")}
        data={statusOptions}
        selected={selStatus}
        setSelected={setSelStatus}
        name="status"
        register={register}
        setValue={setValue}
        trigger={trigger}
        errors={errors}
        required
      />
      <FormInput
        label={t("attendance:check_in")}
        name="check_in"
        type="time"
        register={register}
        errors={errors}
      />
      <FormInput
        label={t("attendance:check_out")}
        name="check_out"
        type="time"
        register={register}
        errors={errors}
      />
      <div>
        <label className="text-sm font-medium text-linkText leading-6 mb-1 block">
          {t("attendance:overtime_hours")}
        </label>
        <div className="h-[46px] rounded-lg border border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/5 flex items-center px-4 text-slate-600 dark:text-white/80">
          {overtimeHours} hrs
        </div>
      </div>
      <div className="col-span-full">
        <label className="text-sm font-medium text-linkText leading-6 mb-1 block">
          {t("attendance:notes")}
        </label>
        <textarea
          rows={3}
          {...register("notes", {
            maxLength: { value: 500, message: "Maximum length is 500 characters" },
          })}
          placeholder={t("attendance:notes")}
          className="w-full rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-0"
        />
        {errors?.notes?.message && (
          <p className="text-red text-xs mt-1 font-medium">{errors.notes.message}</p>
        )}
      </div>
    </>
  );
};

export default SingleAttendanceTab;
