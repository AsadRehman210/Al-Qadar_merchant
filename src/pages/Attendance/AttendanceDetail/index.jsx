import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Calendar from "react-calendar";
import dayjs from "dayjs";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import { fetchAttendance, showAttendanceList, showAttendanceLoading } from "store/slices/attendanceSlice";
import { fetchEmployees, showEmployees, showEmployeesLoading } from "store/slices/employeeSlice";
import { SkeletonChart, SkeletonDetail } from "components/Skeleton";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import "react-calendar/dist/Calendar.css";
import "./AttendanceDetail.css";

const { view_attendance } = alqadar_role_ids;

const STATUS_CONFIG = {
  Present: {
    labelKey: "attendance:present",
    className: "attendance-present",
    dot: "attendance-legend-present",
  },
  Leave: {
    labelKey: "attendance:leave",
    className: "attendance-leave",
    dot: "attendance-legend-leave",
  },
  Absent: {
    labelKey: "attendance:absent",
    className: "attendance-absent",
    dot: "attendance-legend-absent",
  },
  Holiday: {
    labelKey: "attendance:holiday",
    className: "attendance-holiday",
    dot: "attendance-legend-holiday",
  },
  "Half-day": {
    labelKey: "attendance:half_day",
    className: "attendance-half_day",
    dot: "attendance-legend-half-day",
  },
};

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  title: dayjs().month(i).format("MMMM"),
}));

const AttendanceDetail = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { employeeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dateParam = searchParams.get("date");

  const employees = useSelector(showEmployees);
  const employeesLoading = useSelector(showEmployeesLoading);
  const attendanceList = useSelector(showAttendanceList);
  const attendanceLoading = useSelector(showAttendanceLoading);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchAttendance());
  }, [dispatch]);

  const employeeOptions = useMemo(
    () =>
      employees.map((e) => ({
        _id: e.id,
        title: `${e.first_name || ""} ${e.last_name || ""} (${e.employeeCode || ""})`.trim(),
      })),
    [employees],
  );

  const [filterEmployee, setFilterEmployee] = useState(null);

  useEffect(() => {
    if (!filterEmployee && employeeId) {
      const match = employeeOptions.find((e) => e._id === employeeId);
      if (match) setFilterEmployee(match);
    }
  }, [employeeId, employeeOptions, filterEmployee]);

  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [activeDate, setActiveDate] = useState(() => {
    if (dateParam) {
      const d = new Date(dateParam);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => ({
      id: y - 2 + i,
      title: String(y - 2 + i),
    }));
  }, []);

  const monthOptions = useMemo(
    () =>
      MONTHS.map((m) => ({
        id: m.id,
        title: dayjs().month(m.id).format("MMMM"),
      })),
    [i18n.language]
  );

  const selectedEmployee = filterEmployee || employeeOptions[0];
  const empId = selectedEmployee?._id || employeeId;

  const attendanceMap = useMemo(() => {
    const list = attendanceList.filter((r) => r.employeeId === empId);
    const map = {};
    list.forEach((item) => {
      const dateKey = item.date ? dayjs(item.date).format("YYYY-MM-DD") : null;
      if (!dateKey) return;
      map[dateKey] = {
        status: item.status,
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        overtimeHours: item.overtimeHours,
        shiftType: item.shiftType,
        notes: item.notes,
      };
    });
    return map;
  }, [attendanceList, empId]);

  const todayStr = dayjs().format("YYYY-MM-DD");

  const getTileClassName = ({ date, view }) => {
    if (view !== "month") return null;
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    const rec = attendanceMap[dateStr];
    // A real recorded status always wins over the plain "future" grayout —
    // see EmployeeDetail/AttendanceTab.jsx for the same fix and reasoning.
    if (rec && STATUS_CONFIG[rec.status]) return STATUS_CONFIG[rec.status].className;
    if (dateStr > todayStr) return "attendance-future";
    return null;
  };

  const getTileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    const rec = attendanceMap[dateStr];
    if (!rec) return null;
    const tooltip = [
      `${t("attendance:status")}: ${rec.status}`,
      rec.checkIn && rec.checkOut
        ? `${t("attendance:check_in")}: ${rec.checkIn} | ${t("attendance:check_out")}: ${rec.checkOut}`
        : "",
      rec.overtimeHours ? `${t("attendance:overtime_hours")}: ${rec.overtimeHours}h` : "",
      rec.shiftType ? `${t("attendance:shift_type")}: ${rec.shiftType}` : "",
      rec.notes ? `${t("attendance:notes")}: ${rec.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return (
      <span title={tooltip} className="attendance-tile-tooltip">
        {date.getDate()}
      </span>
    );
  };

  const handleEmployeeChange = (v) => {
    setFilterEmployee(v);
    if (v?._id) {
      setActiveDate(new Date(filterYear, filterMonth, 1));
    }
  };

  const handleMonthChange = (v) => {
    setFilterMonth(v?.id ?? new Date().getMonth());
    setActiveDate(new Date(filterYear, v?.id ?? filterMonth, 1));
  };

  const handleYearChange = (v) => {
    setFilterYear(v?.id ?? new Date().getFullYear());
    setActiveDate(new Date(v?.id ?? filterYear, filterMonth, 1));
  };

  const locale = i18n.language === "ar" ? "ar" : "en";
  const isRTL = i18n.language === "ar";
  const pageLoading = (employeesLoading && !employees.length) || (attendanceLoading && !attendanceList.length);

  if (!checkRoleAuth(view_attendance)) return null;

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
              {t("attendance:attendance_detail")}
            </h1>
            <p className="text-mutedForeground">
              {t("attendance:calendar_view")}
            </p>
          </div>
        </div>

        {pageLoading ? (
          <div className="space-y-6">
            <SkeletonDetail fields={3} />
            <SkeletonChart height={360} />
          </div>
        ) : (
        <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 flex-wrap">
            <div className="min-w-[200px]">
              <SelectDropdown
                label={t("attendance:filter_by_employee")}
                data={employeeOptions}
                selected={selectedEmployee || {}}
                setSelected={handleEmployeeChange}
                hideClear
              />
            </div>
            <div className="min-w-[140px]">
              <SelectDropdown
                label={t("attendance:filter_by_month")}
                data={monthOptions}
                selected={monthOptions.find((m) => m.id === filterMonth) || monthOptions[0]}
                setSelected={handleMonthChange}
                hideClear
              />
            </div>
            <div className="min-w-[120px]">
              <SelectDropdown
                label={t("attendance:filter_by_year")}
                data={yearOptions}
                selected={yearOptions.find((y) => y.id === filterYear) || yearOptions[2]}
                setSelected={handleYearChange}
                hideClear
              />
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
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

          {/* Calendar */}
          <div className="attendance-calendar-wrapper">
            <Calendar
              locale={locale}
              value={activeDate}
              activeStartDate={new Date(filterYear, filterMonth, 1)}
              onActiveStartDateChange={({ activeStartDate }) => {
                setActiveDate(activeStartDate);
                setFilterMonth(activeStartDate.getMonth());
                setFilterYear(activeStartDate.getFullYear());
              }}
              tileClassName={getTileClassName}
              tileContent={getTileContent}
              view="month"
              minDetail="month"
              maxDetail="month"
              showNeighboringMonth={false}
              className="rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 overflow-hidden [&_.react-calendar__navigation]:flex [&_.react-calendar__navigation]:items-center [&_.react-calendar__navigation]:gap-2 [&_.react-calendar__navigation]:p-3 [&_.react-calendar__navigation]:border-b [&_.react-calendar__navigation]:border-slate-200 [&_.react-calendar__navigation]:dark:border-white/20 [&_.react-calendar__navigation__label]:text-slate-900 [&_.react-calendar__navigation__label]:dark:text-white [&_.react-calendar__navigation__label]:font-semibold [&_.react-calendar__navigation__arrow]:text-teal-600 [&_.react-calendar__navigation__arrow]:dark:text-teal-400 [&_.react-calendar__month-view__weekdays]:text-slate-600 [&_.react-calendar__month-view__weekdays]:dark:text-white/70 [&_.react-calendar__tile]:rounded-lg [&_.react-calendar__tile]:transition-colors"
            />
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceDetail;
