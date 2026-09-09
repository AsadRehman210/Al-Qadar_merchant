import { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { markAttendance, markAttendanceBulk } from "store/slices/attendanceSlice";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import SingleAttendanceTab from "./SingleAttendanceTab";
import BulkAttendanceTab from "./BulkAttendanceTab";
import { attendanceStatusOptions, attendanceShiftOptions } from "global/constant";

const { add_attendance } = alqadar_role_ids;

const tabBtnClass = (active) =>
  `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
    active
      ? "bg-teal-500 text-white shadow-sm"
      : "text-slate-600 dark:text-white/70 hover:bg-slate-200/50 dark:hover:bg-white/10"
  }`;

const AddAttendance = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("single");
  const [bulkTimeMode, setBulkTimeMode] = useState("same");
  const [selStatus, setSelStatus] = useState(attendanceStatusOptions[0]);
  const [selShift, setSelShift] = useState(attendanceShiftOptions[0]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeTimes, setEmployeeTimes] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const employees = useSelector(showEmployees);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const employeeOptions = useMemo(
    () =>
      employees
        .filter((e) => e.status === "active" || e.status === "probation")
        .map((e) => ({
          _id: e.id,
          title: `${e.first_name || ""} ${e.last_name || ""} (${e.employeeCode || ""})`.trim(),
        })),
    [employees],
  );

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
      date: new Date().toISOString().split("T")[0],
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      check_in: "09:00",
      check_out: "18:00",
      notes: "",
    },
  });

  const checkIn = watch("check_in");
  const checkOut = watch("check_out");
  const overtimeHours = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const [h1, m1] = checkIn.split(":").map(Number);
    const [h2, m2] = checkOut.split(":").map(Number);
    let mins = h2 * 60 + m2 - (h1 * 60 + m1);
    if (mins < 0) mins += 24 * 60;
    const standard = 8 * 60;
    return (Math.max(0, mins - standard) / 60).toFixed(1);
  }, [checkIn, checkOut]);

  const onEmployeeChange = useCallback(
    (v) => {
      setSelectedEmployee(v?._id ? v : null);
      setValue("employee_id", v?._id || "");
      trigger("employee_id");
    },
    [setValue, trigger],
  );

  const onSubmit = async (data) => {
    const isBulk = activeTab === "bulk";
    if (!isBulk) {
      if (selStatus?.id === "Present" && !data.check_in) {
        toast.error(t("attendance:check_in_required_present", "Check-in is required when status is Present"));
        return;
      }
      if (data.check_in && data.check_out && data.check_out < data.check_in) {
        toast.error(t("attendance:checkout_after_checkin", "Check-out must be on or after check-in"));
        return;
      }
    } else {
      if (data.end_date && data.start_date && data.end_date < data.start_date) {
        toast.error(t("attendance:end_after_start", "End date must be on or after start date"));
        return;
      }
      if (bulkTimeMode === "same") {
        if (data.check_in && data.check_out && data.check_out < data.check_in) {
          toast.error(t("attendance:checkout_after_checkin", "Check-out must be on or after check-in"));
          return;
        }
      } else {
        const invalidEmp = selectedEmployees.find((emp) => {
          const times = employeeTimes[emp._id] || {};
          return times.checkIn && times.checkOut && times.checkOut < times.checkIn;
        });
        if (invalidEmp) {
          toast.error(t("attendance:checkout_after_checkin", "Check-out must be on or after check-in"));
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      if (isBulk) {
        if (bulkTimeMode === "different") {
          // Backend's /bulk endpoint applies one status across a date range
          // for a set of employees — per-employee check-in/out isn't part of
          // that contract, so mark each employee's attendance individually
          // for each day in range to honor their own times.
          const start = new Date(data.start_date);
          const end = new Date(data.end_date);
          const dates = [];
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d).toISOString().split("T")[0]);
          }
          for (const emp of selectedEmployees) {
            const times = employeeTimes[emp._id] || {};
            for (const date of dates) {
              await dispatch(
                markAttendance({
                  employeeId: emp._id,
                  date,
                  status: selStatus?.id,
                  checkIn: times.checkIn,
                  checkOut: times.checkOut,
                  shiftType: selShift?.id,
                }),
              ).unwrap();
            }
          }
        } else {
          await dispatch(
            markAttendanceBulk({
              employeeIds: selectedEmployees.map((e) => e._id),
              startDate: data.start_date,
              endDate: data.end_date,
              status: selStatus?.id,
              checkIn: data.check_in,
              checkOut: data.check_out,
              shiftType: selShift?.id,
            }),
          ).unwrap();
        }
      } else {
        await dispatch(
          markAttendance({
            employeeId: selectedEmployee?._id,
            date: data.date,
            status: selStatus?.id,
            checkIn: data.check_in,
            checkOut: data.check_out,
            shiftType: selShift?.id,
            notes: data.notes || undefined,
          }),
        ).unwrap();
      }
      toast.success(t("attendance:save_success"));
      navigate("/attendance");
    } catch (err) {
      toast.error(err || t("attendance:save_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!checkRoleAuth(add_attendance)) return null;

  const isRTL = i18n.language === "ar";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/attendance")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 hover:-translate-x-0.5 rtl:hover:translate-x-0.5 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("attendance:add_attendance")}
            </h1>
            <p className="text-mutedForeground">
              {t("attendance:attendance_module_desc")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 w-fit mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={tabBtnClass(activeTab === "single")}
          >
            {t("attendance:single_attendance")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bulk")}
            className={tabBtnClass(activeTab === "bulk")}
          >
            {t("attendance:bulk_attendance")}
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTab === "single" ? (
              <SingleAttendanceTab
                register={register}
                errors={errors}
                setValue={setValue}
                trigger={trigger}
                employeeOptions={employeeOptions}
                selectedEmployee={selectedEmployee}
                onEmployeeChange={onEmployeeChange}
                selStatus={selStatus}
                setSelStatus={setSelStatus}
                selShift={selShift}
                setSelShift={setSelShift}
                statusOptions={attendanceStatusOptions}
                shiftOptions={attendanceShiftOptions}
                overtimeHours={overtimeHours}
              />
            ) : (
              <BulkAttendanceTab
                register={register}
                errors={errors}
                setValue={setValue}
                trigger={trigger}
                employeeOptions={employeeOptions}
                selectedEmployees={selectedEmployees}
                setSelectedEmployees={setSelectedEmployees}
                bulkTimeMode={bulkTimeMode}
                setBulkTimeMode={setBulkTimeMode}
                employeeTimes={employeeTimes}
                setEmployeeTimes={setEmployeeTimes}
                selStatus={selStatus}
                setSelStatus={setSelStatus}
                selShift={selShift}
                setSelShift={setSelShift}
                statusOptions={attendanceStatusOptions}
                shiftOptions={attendanceShiftOptions}
                startDate={watch("start_date")}
              />
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button
              type="button"
              title={t("attendance:cancel")}
              onClick={() => navigate("/attendance")}
              btn="secondary"
            />
            <Button
              type="submit"
              title={t("attendance:submit")}
              btn="primary"
              disabled={submitting}
              loading={submitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAttendance;
