import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import moment from "moment";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import Datepicker from "components/Datepicker";
import Checkboxes from "components/Checkboxes";
import Button from "components/Button";
import Calender from "images/icons/calender.png";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { fetchDesignations, showDesignations } from "store/slices/designationSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { EMPLOYEE_STATUS_OPTIONS, DEFAULT_WEEKLY_SCHEDULE, isWeeklyScheduleValid } from "../employeesFakeData";
import WeeklySchedule from "./WeeklySchedule";

const EMPLOYMENT_TYPES = [
  { title: "Permanent", id: "permanent" },
  { title: "Contract", id: "contract" },
  { title: "Trainee", id: "trainee" },
];

const NO_MANAGER = { id: "", title: "— None (top of chain) —" };

const OfficialDetails = ({ setSelectedIndex, setValidValues, existing }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const departments = useSelector(showDepartments);
  const designations = useSelector(showDesignations);
  const employees = useSelector(showEmployees);

  // The wizard remounts this whole tab tree once the edited employee's real
  // data has loaded (see AddEmployees/index.jsx's TabGroup key), so this
  // effect runs a second time on the same page load — skip refetching
  // whatever the store already has instead of calling all 3 APIs twice.
  useEffect(() => {
    if (!departments.length) dispatch(fetchDepartments());
    if (!designations.length) dispatch(fetchDesignations());
    if (!employees.length) dispatch(fetchEmployees());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const deptOptions = useMemo(
    () => departments.map((d) => ({ id: d.id, title: d.name })),
    [departments],
  );
  const managerOptions = useMemo(
    () => [
      NO_MANAGER,
      ...employees
        .filter((e) => e.id !== existing?.id)
        .map((e) => ({ id: e.id, title: `${e.first_name || ""} ${e.last_name || ""}`.trim() || e.employeeCode })),
    ],
    [employees, existing],
  );

  const [selDept, setSelDept] = useState(
    () => deptOptions.find((d) => d.id === existing?.departmentId) || deptOptions[0],
  );
  const [selStatus, setSelStatus] = useState(
    () => EMPLOYEE_STATUS_OPTIONS.find((s) => s.id === existing?.status) || EMPLOYEE_STATUS_OPTIONS[0],
  );
  const [selEmpType, setSelEmpType] = useState(
    () => EMPLOYMENT_TYPES.find((s) => s.id === existing?.employment_type) ?? null,
  );
  const [selManager, setSelManager] = useState(
    () => managerOptions.find((m) => m.id === existing?.managerEmployeeId) || NO_MANAGER,
  );
  const [weeklySchedule, setWeeklySchedule] = useState(
    () => (existing?.weekly_schedule?.length ? existing.weekly_schedule : DEFAULT_WEEKLY_SCHEDULE),
  );
  const [selJoin, setSelJoin] = useState(() =>
    existing?.joining_date ? moment(existing.joining_date).format("DD-MM-YYYY") : "",
  );
  const [selProbation, setSelProbation] = useState(() =>
    existing?.probation_end ? moment(existing.probation_end).format("DD-MM-YYYY") : "",
  );
  const [selResignation, setSelResignation] = useState(() =>
    existing?.resignation_date ? moment(existing.resignation_date).format("DD-MM-YYYY") : "",
  );
  const [selRetirement, setSelRetirement] = useState(() =>
    existing?.retirement_date ? moment(existing.retirement_date).format("DD-MM-YYYY") : "",
  );
  const [selTermination, setSelTermination] = useState(() =>
    existing?.termination_date ? moment(existing.termination_date).format("DD-MM-YYYY") : "",
  );
  const [selLastSeen, setSelLastSeen] = useState(() =>
    existing?.last_seen_date ? moment(existing.last_seen_date).format("DD-MM-YYYY") : "",
  );
  // Not a stored Employee field — a one-time action read by Salary.jsx's
  // final submit, which (if checked) calls updateDepartment to point that
  // department's hodEmployeeId at this employee. Passed across tabs the same
  // way designation_overtime_rate already is: setValue only, no register().
  const [setAsHod, setSetAsHod] = useState(false);

  const {
    register,
    formState: { errors },
    setValue,
    trigger,
    watch,
    getFieldState,
  } = useFormContext();

  useEffect(() => {
    setValue("setAsHod", setAsHod);
  }, [setAsHod, setValue]);

  // Exactly one lifecycle date makes sense per status — show only that one.
  const LIFECYCLE_DATE_FIELD = {
    probation: "probation_end",
    resigned: "resignation_date",
    retired: "retirement_date",
    terminated: "termination_date",
    absconding: "last_seen_date",
  };
  const currentStatus = watch("status") || selStatus?.id;
  const lifecycleField = LIFECYCLE_DATE_FIELD[currentStatus];
  const LIFECYCLE_DATE_LABEL = {
    probation_end: t("employees:probation_end"),
    resignation_date: t("employees:resignation_date"),
    retirement_date: t("employees:retirement_date"),
    termination_date: t("employees:termination_date"),
    last_seen_date: t("employees:last_seen_date"),
  };
  const LIFECYCLE_DATE_STATE = {
    probation_end: [selProbation, setSelProbation],
    resignation_date: [selResignation, setSelResignation],
    retirement_date: [selRetirement, setSelRetirement],
    termination_date: [selTermination, setSelTermination],
    last_seen_date: [selLastSeen, setSelLastSeen],
  };

  // Departments load asynchronously — resolve the real match once they
  // arrive (edit mode), otherwise default to the first one (create mode).
  useEffect(() => {
    if (!deptOptions.length) return;
    const match = existing?.departmentId && deptOptions.find((d) => d.id === existing.departmentId);
    if (match) {
      if (match.id !== selDept?.id) setSelDept(match);
      return;
    }
    if (!selDept || !deptOptions.some((d) => d.id === selDept.id)) setSelDept(deptOptions[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptOptions]);

  // Designation list cascades off the selected department.
  const designationOptions = useMemo(() => {
    const activeDesignations = designations.filter((d) => d.status === "Active");
    const filtered = activeDesignations.filter((d) => d.departmentId === selDept?.id);
    const list = filtered.length ? filtered : activeDesignations;
    return list.map((d) => ({ id: d.id, title: d.title, overtimeRate: d.overtimeRate }));
  }, [designations, selDept]);

  const [selRole, setSelRole] = useState(null);

  // Keep the chosen designation valid for the current department, and carry
  // its overtime rate into the shared form so the Salary step can show it
  // read-only (overtime rate lives on Designation, not Salary). Prefers the
  // employee's real designation on first resolution (edit mode); once the
  // department is deliberately changed away, that id won't be in the new
  // department's list, so this naturally falls through to "first available".
  useEffect(() => {
    if (!designationOptions.length) return;
    const preferred = existing?.designationId && designationOptions.find((d) => d.id === existing.designationId);
    const stillValid = designationOptions.some((d) => d.id === selRole?.id);
    const next = preferred || (stillValid ? selRole : designationOptions[0]);
    if (next?.id !== selRole?.id) setSelRole(next);
    setValue("designationId", next?.id || "");
    setValue("designation_overtime_rate", next?.overtimeRate ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designationOptions]);

  const onSelectRole = (opt) => {
    setSelRole(opt);
    setValue("designation_overtime_rate", opt?.overtimeRate ?? 0);
  };

  // Managers load asynchronously too — resolve the employee's real manager
  // once the employee list arrives (edit mode).
  useEffect(() => {
    if (managerOptions.length <= 1 || !existing?.managerEmployeeId) return;
    const match = managerOptions.find((m) => m.id === existing.managerEmployeeId);
    if (match && match.id !== selManager?.id) setSelManager(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerOptions]);

  const STEP_FIELDS = [
    "employeeCode",
    "departmentId",
    "designationId",
    "joining_date",
    "status",
    "employment_type",
  ];

  const FIELD_LABELS = {
    employeeCode: t("employees:employee_id"),
    departmentId: t("employees:department"),
    designationId: t("employees:designation"),
    joining_date: t("employees:joining_date"),
    status: t("status"),
    employment_type: t("employees:employment_type"),
    ...(lifecycleField ? { [lifecycleField]: LIFECYCLE_DATE_LABEL[lifecycleField] } : {}),
  };

  const onNext = async (e) => {
    e.preventDefault();
    const fieldsToValidate = lifecycleField
      ? [...STEP_FIELDS, lifecycleField]
      : STEP_FIELDS;
    const valid = await trigger(fieldsToValidate);
    if (!weeklySchedule.some((d) => d.isWorking)) {
      toast.error(t("employees:schedule_needs_working_day"));
      return;
    }
    if (!isWeeklyScheduleValid(weeklySchedule)) {
      toast.error(t("employees:schedule_invalid_range"));
      return;
    }
    if (valid) {
      setValidValues(2);
      setSelectedIndex(2);
    } else {
      // getFieldState (not the destructured `errors`, which is a snapshot
      // from render time) reflects the state trigger() just computed, so the
      // toast can name exactly which fields are still invalid.
      const invalidFields = fieldsToValidate.filter((f) => getFieldState(f).invalid);
      toast.error(
        invalidFields.length
          ? `${t("employees:fill_required_fields")} ${invalidFields.map((f) => FIELD_LABELS[f] || f).join(", ")}`
          : t("employees:fill_required_fields"),
      );
    }
  };

  return (
    <form onSubmit={onNext} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormInput
          label={t("employees:employee_id")}
          name="employeeCode"
          register={register}
          errors={errors}
          placeholder={t("employees:employee_id_auto_hint")}
          pattern={/[A-Za-z0-9\-_]/}
          minLength={2}
          maxLength={100}
        />
        <SelectDropdown
          label={t("employees:department")}
          data={deptOptions}
          selected={selDept}
          setSelected={setSelDept}
          name="departmentId"
          valueKey="id"
          register={register}
          setValue={setValue}
          trigger={trigger}
          required
        />
        <SelectDropdown
          label={t("employees:designation")}
          data={designationOptions}
          selected={selRole}
          setSelected={onSelectRole}
          name="designationId"
          valueKey="id"
          register={register}
          setValue={setValue}
          trigger={trigger}
          required
        />
        <div className="md:col-span-2">
          <Checkboxes
            enabled={setAsHod}
            onChange={setSetAsHod}
            label={t("employees:set_as_hod")}
            disabled={!selDept?.id || selStatus?.id !== "active"}
          />
          {selDept?.id && selStatus?.id !== "active" && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              {t("employees:set_as_hod_requires_active")}
            </p>
          )}
        </div>
        <div className="relative">
          <Datepicker
            label={t("employees:joining_date")}
            name="joining_date"
            errors={errors}
            position="right"
            Icon={Calender}
            register={register}
            trigger={trigger}
            setValue={setValue}
            selected={selJoin}
            setSelected={setSelJoin}
            defaultValue={false}
            required
          />
        </div>
        <SelectDropdown
          label={t("employees:manager")}
          data={managerOptions}
          selected={selManager}
          setSelected={setSelManager}
          name="managerEmployeeId"
          valueKey="id"
          register={register}
          setValue={setValue}
          trigger={trigger}
        />
        <SelectDropdown
          label={t("status")}
          data={EMPLOYEE_STATUS_OPTIONS}
          selected={selStatus}
          setSelected={setSelStatus}
          name="status"
          valueKey="id"
          register={register}
          setValue={setValue}
          trigger={trigger}
          required
        />
        <FormInput
          label={t("employees:work_location")}
          name="work_location"
          register={register}
          errors={errors}
          minLength={2}
          maxLength={100}
        />
        <SelectDropdown
          label={t("employees:employment_type")}
          data={EMPLOYMENT_TYPES}
          selected={selEmpType}
          setSelected={setSelEmpType}
          name="employment_type"
          valueKey="id"
          register={register}
          setValue={setValue}
          trigger={trigger}
          required
        />
        {lifecycleField && (
          <div className="relative">
            <Datepicker
              key={lifecycleField}
              label={LIFECYCLE_DATE_LABEL[lifecycleField]}
              name={lifecycleField}
              errors={errors}
              position="right"
              Icon={Calender}
              register={register}
              trigger={trigger}
              setValue={setValue}
              selected={LIFECYCLE_DATE_STATE[lifecycleField][0]}
              setSelected={LIFECYCLE_DATE_STATE[lifecycleField][1]}
              isDefaultSelection={false}
              required
            />
          </div>
        )}
      </div>
      <div className="mt-6">
        <WeeklySchedule value={weeklySchedule} onChange={setWeeklySchedule} />
      </div>
      <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
        <Button
          type="button"
          title={t("back")}
          btn="outline"
          onClick={() => setSelectedIndex(0)}
        />
        <Button type="submit" title={t("next")} btn="primary" />
      </div>
    </form>
  );
};

export default OfficialDetails;
