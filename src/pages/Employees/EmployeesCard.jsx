import { LuBuilding2, LuUsers, LuUserCheck } from "react-icons/lu";
import { useTranslation } from "react-i18next";

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-[20px] p-6 transition-all duration-300 hover:border-teal-500/35 hover:-translate-y-1 dark:hover:border-white/20">
    <div className="flex flex-row items-center justify-between gap-3">
      <span className="flex-1 text-slate-500 dark:text-white/80 text-sm font-semibold">{label}</span>
      <div className="shrink-0 w-12 h-12 rounded-[14px] flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600 text-white">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div className="mt-3">
      <div className="text-slate-900 dark:text-white text-[1.875rem] font-extrabold tracking-tight">{value}</div>
    </div>
  </div>
);

export default function EmployeesCard({ data }) {
  const { t } = useTranslation();
  const stats = [
    { label: t("employees:total_employees"), value: data?.total ?? 5, icon: LuUsers },
    { label: t("employees:active_employees"), value: data?.active ?? 4, icon: LuUserCheck },
    { label: t("employees:departments"), value: data?.departments ?? 4, icon: LuBuilding2 },
  ];

  return (
    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} />
      ))}
    </div>
  );
}
