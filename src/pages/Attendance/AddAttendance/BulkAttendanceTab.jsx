import { useTranslation } from "react-i18next";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import MultiSelectDropdown from "components/MultiSelectDropdown";

const tabToggleClass = (active) =>
  `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
    active
      ? "bg-teal-500 text-white shadow-sm"
      : "text-slate-600 dark:text-white/70 hover:bg-slate-200/50 dark:hover:bg-white/10"
  }`;

const BulkAttendanceTab = ({
  register,
  errors,
  setValue,
  trigger,
  employeeOptions,
  selectedEmployees,
  setSelectedEmployees,
  bulkTimeMode,
  setBulkTimeMode,
  employeeTimes,
  setEmployeeTimes,
  selStatus,
  setSelStatus,
  selShift,
  setSelShift,
  statusOptions,
  shiftOptions,
  startDate,
}) => {
  const { t } = useTranslation();

  const onEmployeesChange = (emps) => {
    setSelectedEmployees(emps);
    if (bulkTimeMode !== "different") return;
    setEmployeeTimes((prev) => {
      const next = { ...prev };
      emps.forEach((e) => {
        if (!next[e._id]) next[e._id] = { checkIn: "09:00", checkOut: "18:00" };
      });
      Object.keys(next).forEach((k) => {
        if (!emps.find((e) => e._id === k)) delete next[k];
      });
      return next;
    });
  };

  const switchToDifferent = () => {
    setBulkTimeMode("different");
    setEmployeeTimes((prev) => {
      const next = { ...prev };
      selectedEmployees.forEach((e) => {
        if (!next[e._id]) next[e._id] = { checkIn: "09:00", checkOut: "18:00" };
      });
      return next;
    });
  };

  return (
    <>
      <div className="col-span-full">
        <MultiSelectDropdown
          label={t("attendance:select_employees")}
          data={employeeOptions}
          selected={selectedEmployees}
          setSelected={onEmployeesChange}
          name="employees"
          register={register}
          setValue={setValue}
          trigger={trigger}
          errors={errors}
          required
          placeholder={t("attendance:search_attendance")}
        />
      </div>
      <FormInput
        label={t("attendance:start_date")}
        name="start_date"
        type="date"
        register={register}
        errors={errors}
        required
      />
      <FormInput
        label={t("attendance:end_date")}
        name="end_date"
        type="date"
        register={register}
        errors={errors}
        required
        min={startDate}
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
      <div className="col-span-full">
        <label className="text-sm font-medium text-linkText leading-6 mb-2 block">
          {t("attendance:check_in")} / {t("attendance:check_out")}
        </label>
        <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 w-fit">
          <button
            type="button"
            onClick={() => setBulkTimeMode("same")}
            className={tabToggleClass(bulkTimeMode === "same")}
          >
            {t("attendance:same_time_all")}
          </button>
          <button
            type="button"
            onClick={switchToDifferent}
            className={tabToggleClass(bulkTimeMode === "different")}
          >
            {t("attendance:different_time")}
          </button>
        </div>
      </div>
      {bulkTimeMode === "same" ? (
        <>
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
        </>
      ) : (
        <div className="col-span-full">
          <label className="text-sm font-medium text-linkText leading-6 mb-2 block">
            {t("attendance:check_in")} / {t("attendance:check_out")}{" "}
            {t("attendance:employee")}
          </label>
          <div className="rounded-xl border border-slate-200 dark:border-white/20 overflow-hidden max-h-[240px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-white/10">
                  <th className="px-4 py-3 text-start font-semibold text-slate-700 dark:text-white/90">
                    {t("attendance:employee")}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-slate-700 dark:text-white/90">
                    {t("attendance:check_in")}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold text-slate-700 dark:text-white/90">
                    {t("attendance:check_out")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedEmployees.map((emp) => (
                  <tr
                    key={emp._id}
                    className="border-t border-slate-200 dark:border-white/10"
                  >
                    <td className="px-4 py-3 text-slate-700 dark:text-white/90">
                      {emp.title}
                    </td>
                    <td className="px-4 py-3">
                      <FormInput
                        type="time"
                        value={employeeTimes[emp._id]?.checkIn ?? "09:00"}
                        onValueChange={(v) =>
                          setEmployeeTimes((prev) => ({
                            ...prev,
                            [emp._id]: {
                              ...prev[emp._id],
                              checkIn: v,
                            },
                          }))
                        }
                        inputClass="!h-10"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <FormInput
                        type="time"
                        value={employeeTimes[emp._id]?.checkOut ?? "18:00"}
                        onValueChange={(v) =>
                          setEmployeeTimes((prev) => ({
                            ...prev,
                            [emp._id]: {
                              ...prev[emp._id],
                              checkOut: v,
                            },
                          }))
                        }
                        inputClass="!h-10"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedEmployees.length === 0 && (
              <div className="px-4 py-6 text-center text-slate-500 dark:text-white/60 text-sm">
                {t("attendance:select_employees")}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BulkAttendanceTab;
