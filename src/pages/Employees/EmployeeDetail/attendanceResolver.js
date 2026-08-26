import dayjs from "dayjs";
import { WEEKLY_DAY_KEYS } from "../../Attendance/attendancePolicyStorage";
import { DEFAULT_WEEKLY_SCHEDULE } from "../employeesFakeData";

const ATTENDANCE_STATUS_MAP = {
  present: "present",
  absent: "absent",
  leave: "leave",
  holiday: "holiday",
  "half-day": "half_day",
  half_day: "half_day",
};

const dayKeyForDate = (dateStr) =>
  WEEKLY_DAY_KEYS[(dayjs(dateStr).day() + 6) % 7];

/** Expands each Approved leave's [fromDate, toDate] into individual dates within [rangeStart, rangeEnd]. */
const approvedLeaveDaysInRange = (leaves, rangeStart, rangeEnd) => {
  const days = [];
  (leaves || [])
    .filter((l) => l.status === "Approved")
    .forEach((l) => {
      let cur = dayjs(l.fromDate);
      const end = dayjs(l.toDate);
      while (cur.isBefore(end) || cur.isSame(end, "day")) {
        const d = cur.format("YYYY-MM-DD");
        if (d >= rangeStart && d <= rangeEnd) {
          days.push(l.halfDay && l.halfDay !== "full" ? { date: d, half: true } : { date: d, half: false });
        }
        cur = cur.add(1, "day");
      }
    });
  return days;
};

/**
 * Builds a { "YYYY-MM-DD": status } map for one employee's calendar month by
 * merging, in increasing precedence:
 *   1. Employee's weekly-off days + real Holiday Calendar entries → "holiday"
 *   2. Real approved leave for that employee                      → "leave"/"half_day"
 *   3. Real attendance records actually taken                     → present/absent/half_day/holiday
 * All three inputs (holidays, leaves, attendanceRecords) are real backend
 * data, pre-fetched by the caller (AttendanceTab) via Redux thunks — this
 * function stays a pure/sync merge so it can run per calendar tile render.
 */
export function buildEmployeeAttendanceMap(employee, monthDate, holidays, leaves, attendanceRecords) {
  const employeeId = employee?.id;
  const start = dayjs(monthDate).startOf("month");
  const end = dayjs(monthDate).endOf("month");
  const startStr = start.format("YYYY-MM-DD");
  const endStr = end.format("YYYY-MM-DD");

  const holidaysByDate = {};
  (holidays || []).forEach((h) => {
    if (!h.date) return;
    const hDate = dayjs(h.date);
    if (h.recurring) {
      // Recurring holidays match month+day across any year within this month's range.
      let cur = start;
      while (cur.isBefore(end) || cur.isSame(end, "day")) {
        if (cur.month() === hDate.month() && cur.date() === hDate.date()) {
          holidaysByDate[cur.format("YYYY-MM-DD")] = true;
        }
        cur = cur.add(1, "day");
      }
    } else {
      holidaysByDate[hDate.format("YYYY-MM-DD")] = true;
    }
  });

  const map = {};

  let cur = start;
  while (cur.isBefore(end) || cur.isSame(end, "day")) {
    const d = cur.format("YYYY-MM-DD");
    // Weekly-off days come from whichever schedule was actually in effect on
    // THIS date, not the employee's current schedule — a weekend that changed
    // from Fri/Sat to Sat/Sun on a given date must keep showing Fri/Sat for
    // dates before that change.
    const weeklyOffForDay = new Set(
      getScheduleForDate(employee, d).filter((s) => !s.isWorking).map((s) => s.day)
    );
    if (weeklyOffForDay.has(dayKeyForDate(d))) map[d] = "holiday";
    if (holidaysByDate[d]) map[d] = "holiday";
    cur = cur.add(1, "day");
  }

  if (employeeId) {
    approvedLeaveDaysInRange(leaves, startStr, endStr).forEach(({ date, half }) => {
      // A company holiday takes precedence over an approved leave that
      // happens to span it — the day was never going to be a working day.
      if (map[date] === "holiday") return;
      map[date] = half ? "half_day" : "leave";
    });
  }

  (attendanceRecords || [])
    .filter((r) => r.employeeId === employeeId)
    .forEach((r) => {
      const dateStr = dayjs(r.date).format("YYYY-MM-DD");
      if (dateStr < startStr || dateStr > endStr) return;
      const normalized = ATTENDANCE_STATUS_MAP[(r.status || "").toLowerCase()];
      if (normalized) map[dateStr] = normalized;
    });

  return map;
}

/** The employee's own day-by-day schedule, falling back to the standard default. */
export function getEmployeeWeeklySchedule(employee) {
  return employee?.weekly_schedule?.length
    ? employee.weekly_schedule
    : DEFAULT_WEEKLY_SCHEDULE;
}

/**
 * The schedule that was actually in effect for a given date, using the
 * employee's weeklyScheduleHistory (each entry: {schedule, effectiveFrom}).
 * Falls back to the current schedule when there's no history at all (an
 * employee whose schedule has never changed).
 */
export function getScheduleForDate(employee, dateStr) {
  const history = employee?.weeklyScheduleHistory;
  if (!history?.length) return getEmployeeWeeklySchedule(employee);

  const sorted = [...history].sort(
    (a, b) => dayjs(a.effectiveFrom).valueOf() - dayjs(b.effectiveFrom).valueOf(),
  );

  let applicable = sorted[0].schedule;
  for (const entry of sorted) {
    if (dayjs(entry.effectiveFrom).format("YYYY-MM-DD") <= dateStr) {
      applicable = entry.schedule;
    } else {
      break;
    }
  }
  return applicable?.length ? applicable : getEmployeeWeeklySchedule(employee);
}

/** Employee's effective schedule for display: per-day hours + derived weekly-off days. */
export function getEmployeeSchedule(employee) {
  const weeklySchedule = getEmployeeWeeklySchedule(employee);
  return {
    weeklySchedule,
    weeklyOffDays: weeklySchedule.filter((d) => !d.isWorking).map((d) => d.day),
  };
}
