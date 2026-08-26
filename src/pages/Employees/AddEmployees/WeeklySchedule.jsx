import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { FiClock } from "react-icons/fi";

import { weekdayLabelKeys as DAY_LABEL_KEY } from "global/constant";

/**
 * Day-by-day working hours for one employee — replaces the old single
 * "shift_type" dropdown (one shift, same hours every day) so each day can
 * have its own hours, or be marked a day off entirely.
 */
const WeeklySchedule = ({ value, onChange }) => {
  const { t } = useTranslation();
  const { setValue } = useFormContext();

  // Keep the shared form's "weekly_schedule" field in sync so it's part of
  // whatever the wizard ultimately submits, same as every other field here.
  useEffect(() => {
    setValue("weekly_schedule", value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const updateDay = (idx, patch) => {
    onChange(value.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  const noWorkingDays = value.every((d) => !d.isWorking);
  const hasInvalidRange = value.some(
    (d) => d.isWorking && d.start && d.end && d.start >= d.end,
  );

  return (
    <div className="md:col-span-2">
      <label className="text-sm font-medium text-linkText leading-6 mb-2 flex items-center gap-1.5">
        <FiClock className="h-4 w-4" />
        {t("employees:weekly_schedule")}
        <span className="text-[#EC1212]">*</span>
      </label>
      <div className="rounded-xl border border-[#E0E5F2] dark:border-white/20 overflow-hidden">
        <div className="hidden sm:grid grid-cols-[110px_100px_1fr_1fr] items-center bg-slate-50 dark:bg-white/10 px-4 py-2 text-xs font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wide">
          <span>{t("employees:day")}</span>
          <span>{t("status")}</span>
          <span>{t("employees:start_time")}</span>
          <span>{t("employees:end_time")}</span>
        </div>
        {value.map((d, idx) => (
          <div
            key={d.day}
            className="grid grid-cols-2 sm:grid-cols-[110px_100px_1fr_1fr] items-center px-4 py-2.5 gap-2 border-t border-[#E0E5F2] dark:border-white/10 first:border-t-0"
          >
            <span className="text-sm font-medium text-slate-700 dark:text-white/90">
              {t(DAY_LABEL_KEY[d.day])}
            </span>
            <button
              type="button"
              onClick={() => updateDay(idx, { isWorking: !d.isWorking })}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors w-fit ${
                d.isWorking
                  ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                  : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/50"
              }`}
            >
              {d.isWorking ? t("employees:working") : t("employees:day_off")}
            </button>
            {d.isWorking ? (
              <>
                <input
                  type="time"
                  value={d.start}
                  onChange={(e) => updateDay(idx, { start: e.target.value })}
                  className="h-9 rounded-lg border border-[#E0E5F2] dark:border-white/20 bg-white dark:bg-white/10 px-2 text-sm text-slate-900 dark:text-white"
                />
                <input
                  type="time"
                  value={d.end}
                  onChange={(e) => updateDay(idx, { end: e.target.value })}
                  className="h-9 rounded-lg border border-[#E0E5F2] dark:border-white/20 bg-white dark:bg-white/10 px-2 text-sm text-slate-900 dark:text-white"
                />
              </>
            ) : (
              <span className="col-span-2 text-xs text-slate-400 dark:text-white/40">—</span>
            )}
          </div>
        ))}
      </div>
      {noWorkingDays && (
        <p className="text-red text-xs mt-1.5">{t("employees:schedule_needs_working_day")}</p>
      )}
      {!noWorkingDays && hasInvalidRange && (
        <p className="text-red text-xs mt-1.5">{t("employees:schedule_invalid_range")}</p>
      )}
    </div>
  );
};


export default WeeklySchedule;
