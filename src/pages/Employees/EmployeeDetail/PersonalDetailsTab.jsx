import { useTranslation } from "react-i18next";
import ImageWithFallback from "components/ImageWithFallback";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiDroplet,
  FiHeart,
  FiGlobe,
  FiCreditCard,
  FiAlertTriangle,
  FiShield,
} from "react-icons/fi";

const PersonalDetailsTab = ({ data }) => {
  const { t } = useTranslation();

  const fullName =
    [
      data?.first_name || data?.name?.split(" ")[0],
      data?.last_name || data?.name?.split(" ")[1],
    ]
      .filter(Boolean)
      .join(" ") || "-";

  const contactFields = [
    { icon: FiMail, label: t("email"), value: data?.email },
    { icon: FiPhone, label: t("employees:phone"), value: data?.phone },
    {
      icon: FiPhone,
      label: t("employees:emergency_contact"),
      value: data?.emergency_contact,
    },
  ];

  const personalFields = [
    { icon: FiUser, label: t("employees:gender"), value: data?.gender },
    { icon: FiCalendar, label: t("employees:dob"), value: data?.dob },
    {
      icon: FiDroplet,
      label: t("employees:blood_group"),
      value: data?.blood_group,
    },
    {
      icon: FiHeart,
      label: t("employees:marital_status"),
      value: data?.marital_status,
    },
    {
      icon: FiGlobe,
      label: t("employees:nationality"),
      value: data?.nationality,
    },
    {
      icon: FiCreditCard,
      label: t("employees:national_id"),
      value: data?.national_id,
    },
    {
      icon: FiCalendar,
      label: t("employees:national_id_expiry"),
      value: data?.national_id_expiry,
      expiry: true,
    },
  ];

  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const diff = new Date(dateStr) - new Date();
    return diff > 0 && diff < 60 * 24 * 60 * 60 * 1000; // matches Compliance module's default window
  };
  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const workPermitFields = data?.nationality_type === "Expatriate" || data?.work_permit_no
    ? [
        { icon: FiShield, label: t("employees:work_permit_no"), value: data?.work_permit_no, expiry: false },
        { icon: FiCalendar, label: t("employees:work_permit_expiry"), value: data?.work_permit_expiry, expiry: true },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-500/20 dark:via-emerald-500/10 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 translate-x-1/4 translate-y-1/4" />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <div className="h-28 w-28 rounded-2xl overflow-hidden border-4 border-white dark:border-white/20 shadow-lg ring-2 ring-teal-500/20">
              <ImageWithFallback
                src={data?.image}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-lg bg-teal-500 text-white text-xs font-semibold shadow-md">
              {data?.employee_id || "ID"}
            </div>
          </div>
          <div className="flex-1 text-center sm:text-start">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {fullName}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {t("employees:personal_details")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact - Triadic accent: teal primary */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/2 -translate-y-1/2" />
          <h3 className="relative flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
            <span className="p-2 rounded-xl bg-teal-500/10 dark:bg-teal-500/20">
              <FiMail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </span>
            {t("contact_information")}
          </h3>
          <div className="space-y-4">
            {contactFields.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-transparent hover:border-teal-500/20 hover:bg-teal-50/30 dark:hover:bg-teal-500/5 transition-all"
              >
                <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase tracking-wider">
                    {label}
                  </p>
                  <p
                    className="font-medium text-slate-900 dark:text-white mt-0.5"
                    dir="ltr"
                  >
                    {value || "-"}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-transparent hover:border-teal-500/20 hover:bg-teal-50/30 dark:hover:bg-teal-500/5 transition-all">
              <FiMapPin className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase tracking-wider">
                  {t("address")}
                </p>
                <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                  {data?.address || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal - Analogous harmony */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 translate-x-1/4 -translate-y-1/4" />
          <h3 className="relative flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
            <span className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
              <FiUser className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </span>
            {t("employees:personal_details")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {personalFields.map(({ icon: Icon, label, value, expiry }) => {
              const expired = expiry && isExpired(value);
              const soon = expiry && !expired && isExpiringSoon(value);
              return (
                <div
                  key={label}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    expired
                      ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30"
                      : soon
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30"
                      : "bg-slate-50/80 dark:bg-white/5 border-transparent hover:border-emerald-500/20 hover:bg-emerald-50/20 dark:hover:bg-emerald-500/5"
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${expired ? "text-rose-500" : soon ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-white/60 truncate">{label}</p>
                    <p className="font-medium text-slate-900 dark:text-white truncate">{value || "-"}</p>
                    {expired && <p className="text-xs text-rose-600 font-semibold">⚠ {t("orgHr:expired")}</p>}
                    {soon && <p className="text-xs text-amber-600 font-semibold">⚠ {t("orgHr:expiring_soon")}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Identity & Work Authorization Card */}
      {(data?.nationality_type || data?.work_permit_no) && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-500/20 dark:bg-blue-500/30 translate-x-1/4 -translate-y-1/4" />
          <h3 className="relative flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
            <span className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/20">
              <FiShield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </span>
            {t("employees:work_authorization")}
            <span className={`ltr:ml-auto rtl:mr-auto px-3 py-1 rounded-full text-xs font-semibold ${data?.nationality_type === "Expatriate" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}>
              {data?.nationality_type || "Saudi"}
            </span>
          </h3>
          {workPermitFields.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-white/60">{t("employees:saudi_no_permit_needed")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workPermitFields.map(({ icon: Icon, label, value, expiry }) => {
                const expired = expiry && isExpired(value);
                const soon = expiry && !expired && isExpiringSoon(value);
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      expired
                        ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30"
                        : soon
                        ? "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30"
                        : "bg-slate-50/80 dark:bg-white/5 border-transparent hover:border-blue-500/20"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${expired ? "text-rose-500" : soon ? "text-amber-500" : "text-blue-600 dark:text-blue-400"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500 dark:text-white/60 truncate">{label}</p>
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{value || "-"}</p>
                      {expired && <p className="text-xs text-rose-600 font-bold flex items-center gap-1"><FiAlertTriangle className="h-3 w-3" /> {t("orgHr:expired")}</p>}
                      {soon && <p className="text-xs text-amber-600 font-bold flex items-center gap-1"><FiAlertTriangle className="h-3 w-3" /> {t("orgHr:expiring_soon")}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonalDetailsTab;
