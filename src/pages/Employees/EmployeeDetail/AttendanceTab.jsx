import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Calendar from "react-calendar";
import dayjs from "dayjs";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import "react-calendar/dist/Calendar.css";
import "./AttendanceTab.css";
import { buildEmployeeAttendanceMap, getEmployeeSchedule } from "./attendanceResolver";
import { fetchAttendance, showAttendanceList, showAttendanceLoading } from "store/slices/attendanceSlice";
import { fetchLeavesByEmployee, showEmployeeLeaves, showEmployeeLeavesLoading, clearEmployeeLeaves } from "store/slices/leaveSlice";
import { fetchHolidays, showHolidays, showHolidaysLoading } from "store/slices/holidaySlice";
import { SkeletonChart } from "components/Skeleton";

const DAY_LABELS = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

const STATUS_CONFIG = {
  present: {
    labelKey: "employees:attendance_present",
    className: "attendance-present",
    dot: "attendance-legend-present",
  },
  leave: {
    labelKey: "employees:attendance_leave",
    className: "attendance-leave",
    dot: "attendance-legend-leave",
  },
  absent: {
    labelKey: "employees:attendance_absent",
    className: "attendance-absent",
    dot: "attendance-legend-absent",
  },
  holiday: {
    labelKey: "employees:attendance_holiday",
    className: "attendance-holiday",
    dot: "attendance-legend-holiday",
  },
  half_day: {
    labelKey: "employees:attendance_half_day",
    className: "attendance-half_day",
    dot: "attendance-legend-half-day",
  },
};

const AttendanceTab = ({ data }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [viewMode, setViewMode] = useState("monthly"); // monthly | yearly
  const [activeDate, setActiveDate] = useState(new Date());

  const schedule = useMemo(() => getEmployeeSchedule(data), [data]);

  const attendanceRecords = useSelector(showAttendanceList);
  const leaves = useSelector(showEmployeeLeaves);
  const holidays = useSelector(showHolidays);
  const attendanceLoading = useSelector(showAttendanceLoading);
  const leavesLoading = useSelector(showEmployeeLeavesLoading);
  const holidaysLoading = useSelector(showHolidaysLoading);
  const isLoading = attendanceLoading || leavesLoading || holidaysLoading;

  const year = activeDate.getFullYear();
  useEffect(() => {
    if (!data?.id) return;
    dispatch(fetchAttendance({ employeeId: data.id, startDate: `${year}-01-01`, endDate: `${year}-12-31` }));
    dispatch(fetchLeavesByEmployee(data.id));
    dispatch(fetchHolidays());
    return () => dispatch(clearEmployeeLeaves());
  }, [data?.id, year, dispatch]);

  const monthlyMap = useMemo(
    () => buildEmployeeAttendanceMap(data, activeDate, holidays, leaves, attendanceRecords),
    [data, activeDate, holidays, leaves, attendanceRecords],
  );

  const yearMap = useMemo(() => {
    let merged = {};
    for (let m = 0; m < 12; m++) {
      merged = {
        ...merged,
        ...buildEmployeeAttendanceMap(data, new Date(year, m, 1), holidays, leaves, attendanceRecords),
      };
    }
    return merged;
  }, [data, year, holidays, leaves, attendanceRecords]);

  const todayStr = dayjs().format("YYYY-MM-DD");

  const getTileClassName = ({ date, view }) => {
    if (view !== "month") return null;
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    const map = viewMode === "yearly" ? yearMap : monthlyMap;
    const status = map[dateStr];
    // A real status (a scheduled holiday, weekly-off, or actual attendance)
    // always wins over the plain "future" grayout — a holiday added for next
    // week must still show as a holiday, not get hidden behind a generic
    // "hasn't happened yet" style just because its date hasn't arrived.
    if (status && STATUS_CONFIG[status]) return STATUS_CONFIG[status].className;
    if (dateStr > todayStr) return "attendance-future";
    return null;
  };

  const locale = i18n.language === "ar" ? "ar" : "en";

  return (
    <div className="space-y-6">
      {/* Schedule strip — each employee can have their own hours per day now */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/20 bg-slate-50/60 dark:bg-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-teal-500 shrink-0" />
          <p className="text-xs text-slate-500 dark:text-white/50 uppercase tracking-wider">
            {t("employees:weekly_schedule")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {schedule.weeklySchedule.map((d) => (
            <div
              key={d.day}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                d.isWorking
                  ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                  : "bg-slate-200/70 dark:bg-white/10 text-slate-500 dark:text-white/50"
              }`}
            >
              {DAY_LABELS[d.day]}
              {d.isWorking ? ` ${d.start}–${d.end}` : ` ${t("employees:day_off")}`}
            </div>
          ))}
        </div>
      </div>

      {/* Header + Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-teal-500" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("employees:attendance_calendar")}
          </h3>
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <div
              key={key}
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/90"
            >
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${config.dot}`}
                aria-hidden
              />
              <span>{t(config.labelKey)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly / Yearly toggle */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 w-fit">
        <button
          type="button"
          onClick={() => setViewMode("monthly")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === "monthly"
              ? "bg-teal-500 text-white shadow-sm"
              : "text-slate-600 dark:text-white/70 hover:bg-slate-200/50 dark:hover:bg-white/10"
          }`}
        >
          {t("employees:monthly")}
        </button>
        <button
          type="button"
          onClick={() => setViewMode("yearly")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            viewMode === "yearly"
              ? "bg-teal-500 text-white shadow-sm"
              : "text-slate-600 dark:text-white/70 hover:bg-slate-200/50 dark:hover:bg-white/10"
          }`}
        >
          {t("employees:yearly")}
        </button>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <SkeletonChart height={380} />
      ) : viewMode === "monthly" ? (
        <div className="attendance-calendar-wrapper">
          <Calendar
            locale={locale}
            value={activeDate}
            onActiveStartDateChange={({ activeStartDate }) =>
              setActiveDate(activeStartDate)
            }
            tileClassName={getTileClassName}
            view="month"
            minDetail="month"
            maxDetail="month"
            showNeighboringMonth={false}
            className="rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 overflow-hidden [&_.react-calendar__navigation]:flex [&_.react-calendar__navigation]:items-center [&_.react-calendar__navigation]:gap-2 [&_.react-calendar__navigation]:p-3 [&_.react-calendar__navigation]:border-b [&_.react-calendar__navigation]:border-slate-200 [&_.react-calendar__navigation]:dark:border-white/20 [&_.react-calendar__navigation__label]:text-slate-900 [&_.react-calendar__navigation__label]:dark:text-white [&_.react-calendar__navigation__label]:font-semibold [&_.react-calendar__navigation__arrow]:text-teal-600 [&_.react-calendar__navigation__arrow]:dark:text-teal-400 [&_.react-calendar__month-view__weekdays]:text-slate-600 [&_.react-calendar__month-view__weekdays]:dark:text-white/70 [&_.react-calendar__tile]:rounded-lg [&_.react-calendar__tile]:transition-colors"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setActiveDate(
                  (d) => new Date(d.getFullYear() - 1, d.getMonth(), 1)
                )
              }
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white transition-colors"
              aria-label={t("employees:previous")}
            >
              ‹
            </button>
            <span className="text-lg font-semibold text-slate-900 dark:text-white">
              {activeDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() =>
                setActiveDate(
                  (d) => new Date(d.getFullYear() + 1, d.getMonth(), 1)
                )
              }
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white transition-colors"
              aria-label={t("employees:next")}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => {
            const monthDate = new Date(activeDate.getFullYear(), i, 1);
            return (
              <div
                key={i}
                className="rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-slate-200 dark:border-white/20 text-sm font-semibold text-slate-900 dark:text-white">
                  {dayjs(monthDate).format("MMMM")}
                </div>
                <Calendar
                  locale={locale}
                  activeStartDate={monthDate}
                  onActiveStartDateChange={() => {}}
                  tileClassName={getTileClassName}
                  view="month"
                  minDetail="month"
                  maxDetail="month"
                  showNavigation={false}
                  showNeighboringMonth={false}
                  className="!border-0 [&_.react-calendar__navigation]:hidden [&_.react-calendar__month-view__weekdays__weekday]:text-[10px] [&_.react-calendar__tile]:text-xs [&_.react-calendar__tile]:!p-1 [&_.react-calendar__month-view__days]:gap-0 [&_.react-calendar__month-view__weekdays]:mb-1 rounded-b-xl"
                />
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTab;
