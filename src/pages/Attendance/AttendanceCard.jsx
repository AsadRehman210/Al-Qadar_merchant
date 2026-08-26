import { LuCalendarCheck, LuUserCheck, LuUserX, LuClock } from "react-icons/lu";
import { useTranslation } from "react-i18next";

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-[20px] p-6 transition-all duration-300 hover:border-teal-500/35 hover:-translate-y-1 dark:hover:border-white/20">
    <div className="flex flex-row items-center justify-between gap-3">
      <span className="flex-1 text-slate-500 dark:text-white/80 text-sm font-semibold">
        {label}
      </span>
      <div className="shrink-0 w-12 h-12 rounded-[14px] flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 text-white">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div className="mt-3">
      <div className="text-slate-900 dark:text-white text-[1.875rem] font-extrabold tracking-tight">
        {value}
      </div>
    </div>
  </div>
);

export default function AttendanceCard({ data }) {
  const { t } = useTranslation();
  const stats = [
    {
      label: t("attendance:total_records"),
      value: data?.total ?? 0,
      icon: LuCalendarCheck,
    },
    {
      label: t("attendance:present_today"),
      value: data?.presentToday ?? 0,
      icon: LuUserCheck,
    },
    {
      label: t("attendance:absent_today"),
      value: data?.absentToday ?? 0,
      icon: LuUserX,
    },
    {
      label: t("attendance:on_leave_today"),
      value: data?.onLeaveToday ?? 0,
      icon: LuClock,
    },
  ];

  return (
    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
      ))}
    </div>
  );
}
