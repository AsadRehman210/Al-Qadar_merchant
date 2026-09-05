import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import {
  FiBriefcase,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";
import { defaultWeeklySchedule } from "global/helper";
import {
  weekdayLabelKeys as DAY_LABEL_KEY,
  employeeStatusOptions,
  employeeStatusBadge,
} from "global/constant";

const OfficialDetailsTab = ({ data }) => {
  const { t } = useTranslation();

  const workFields = [
    { icon: FiBriefcase, label: t("employees:employee_id"), value: data?.employee_id },
    { icon: FiBriefcase, label: t("employees:department"), value: data?.department },
    { icon: FiUser, label: t("employees:role"), value: data?.role },
    { icon: FiCalendar, label: t("employees:joining_date"), value: data?.joining_date },
    { icon: FiUser, label: t("employees:manager"), value: data?.manager },
    { icon: FiMapPin, label: t("employees:work_location"), value: data?.work_location },
  ];

  const statusLabel =
    employeeStatusOptions.find((s) => s.id === data?.status)?.title ||
    data?.status;
  const statusBadgeClass =
    employeeStatusBadge[data?.status] ||
    "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70";

  const LIFECYCLE_DATE_FIELD = {
    probation: { label: t("employees:probation_end"), value: data?.probation_end },
    resigned: { label: t("employees:resignation_date"), value: data?.resignation_date },
    retired: { label: t("employees:retirement_date"), value: data?.retirement_date },
    terminated: { label: t("employees:termination_date"), value: data?.termination_date },
    absconding: { label: t("employees:last_seen_date"), value: data?.last_seen_date },
  };
  const lifecycleDate = LIFECYCLE_DATE_FIELD[data?.status];

  const statusFields = [
    { icon: FiBriefcase, label: t("employees:employment_type"), value: data?.employment_type },
    ...(lifecycleDate ? [{ icon: FiCalendar, label: lifecycleDate.label, value: lifecycleDate.value }] : []),
  ];

  const weeklySchedule = data?.weekly_schedule?.length
    ? data.weekly_schedule
    : defaultWeeklySchedule;

  // weeklyScheduleHistory is append-only: [...older entries, currentEntry].
  // The entry right before the last one is the most recent PAST schedule —
  // that's the "previous" schedule to contrast against the current one.
  const history = data?.weeklyScheduleHistory || [];
  const currentEntry = history.length ? history[history.length - 1] : null;
  const previousEntry = history.length >= 2 ? history[history.length - 2] : null;
  const previousUntil = currentEntry?.effectiveFrom
    ? dayjs(currentEntry.effectiveFrom).subtract(1, "day")
    : null;

  const renderScheduleGrid = (schedule, muted = false) => (
    <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 ${muted ? "opacity-60" : ""}`}>
      {schedule.map((d) => (
        <div
          key={d.day}
          className={`rounded-xl border p-3 text-center ${
            d.isWorking
              ? "border-teal-500/20 bg-teal-50/60 dark:bg-teal-500/10"
              : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-white/60">
            {t(DAY_LABEL_KEY[d.day])}
          </p>
          {d.isWorking ? (
            <p className="text-sm font-medium text-teal-700 dark:text-teal-300 mt-1">
              {d.start}–{d.end}
            </p>
          ) : (
            <p className="text-sm text-slate-400 dark:text-white/40 mt-1">
              {t("employees:day_off")}
            </p>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Information */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-teal-500/15 dark:bg-teal-500/25 translate-x-1/4 translate-y-1/4" />
          <h3 className="relative flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
            <span className="p-2 rounded-xl bg-teal-500/10 dark:bg-teal-500/20">
              <FiBriefcase className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </span>
            {t("employees:work_information")}
          </h3>
          <div className="relative space-y-4">
            {workFields.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-transparent hover:border-teal-500/20 hover:bg-teal-50/30 dark:hover:bg-teal-500/5 transition-all"
              >
                <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                    {value || "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status & Schedule */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-36 h-36 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 -translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 translate-x-1/4 translate-y-1/4" />
          <h3 className="relative flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
            <span className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
              <FiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </span>
            {t("employees:status_schedule")}
          </h3>
          <div className="relative space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-transparent">
              <FiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase tracking-wider">
                  {t("status")}
                </p>
                <span
                  className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass}`}
                >
                  {statusLabel || "-"}
                </span>
              </div>
            </div>
            {statusFields.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-transparent hover:border-emerald-500/20 hover:bg-emerald-50/20 dark:hover:bg-emerald-500/5 transition-all"
              >
                <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                    {value || "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
          <span className="p-2 rounded-xl bg-teal-500/10 dark:bg-teal-500/20">
            <FiClock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </span>
          {t("employees:weekly_schedule")}
        </h3>

        {previousEntry && (
          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-3">
            {t("employees:current_schedule")}
            {currentEntry?.effectiveFrom && (
              <> · {t("employees:effective_from")} {dayjs(currentEntry.effectiveFrom).format("DD MMM YYYY")}</>
            )}
          </p>
        )}
        {renderScheduleGrid(weeklySchedule)}

        {previousEntry && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
            <p className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wide mb-3">
              {t("employees:previous_schedule")}
              {" · "}
              {dayjs(previousEntry.effectiveFrom).format("DD MMM YYYY")}
              {previousUntil && <> – {previousUntil.format("DD MMM YYYY")}</>}
            </p>
            {renderScheduleGrid(previousEntry.schedule, true)}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficialDetailsTab;
