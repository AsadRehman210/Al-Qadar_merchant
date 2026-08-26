import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { FiBook, FiAward, FiCode } from "react-icons/fi";

// Dates come back from the API as full ISO timestamps (e.g.
// "2026-08-02T00:00:00.000Z") — display just the date, not the time/TZ.
const fmtDate = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "");

const QualificationTab = ({ data }) => {
  const { t } = useTranslation();

  const educationList = Array.isArray(data?.education)
    ? data.education.filter((e) => e?.degree_name || e?.institute_university)
    : data?.education
      ? [{ degree_name: data.education, institute_university: "", field_major: "", percentage_cgpa: "" }]
      : [];

  const certificateList = Array.isArray(data?.certificates)
    ? data.certificates.filter((c) => c?.certificate_name || c?.issuing_organization)
    : data?.certifications
      ? data.certifications.split(",").map((c) => ({ certificate_name: c.trim(), issuing_organization: "" }))
      : [];

  const skillList = Array.isArray(data?.skills)
    ? data.skills.filter((s) => s?.skill_name)
    : data?.skills
      ? data.skills.split(",").map((s) => ({ skill_name: s.trim(), proficiency_level: "", skill_type: "" }))
      : [];

  const SectionCard = ({ icon: Icon, iconClass, title, minWidth, columns, rows, emptyTitle, emptyHint }) => (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4">
        <span className={`p-2 rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </span>
        {title}
        <span className="text-sm font-normal text-slate-400 dark:text-white/40">({rows.length})</span>
      </h3>
      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
          <div className={minWidth}>
            <table className="w-full border-collapse text-sm mb-0">
              <thead>
                <tr className="bg-[var(--color-teal-500)] border-none">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-start font-semibold text-white/95 border-none whitespace-nowrap first:pl-5"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:border-b-0"
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-4 py-3 align-middle text-slate-700 dark:text-white/90 whitespace-nowrap first:pl-5 first:font-medium first:text-slate-900 dark:first:text-white ${cIdx === 0 ? "" : ""}`}
                      >
                        {cell || "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${iconClass}`}>
            <Icon className="h-6 w-6" />
          </div>
          <p className="font-medium text-slate-700 dark:text-white/80">{emptyTitle}</p>
          <p className="text-sm text-slate-400 dark:text-white/40 mt-1">{emptyHint}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionCard
        icon={FiBook}
        iconClass="bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400"
        title={t("employees:education")}
        minWidth="min-w-[760px]"
        columns={[
          t("employees:degree_name"),
          t("employees:field_major"),
          t("employees:board_university"),
          t("employees:country_city"),
          t("employees:end_date_passing_year"),
          t("employees:percentage_cgpa"),
        ]}
        rows={educationList.map((edu) => [
          edu.degree_name,
          edu.field_major,
          [edu.institute_university, edu.board_university].filter(Boolean).join(" • "),
          edu.country_city,
          fmtDate(edu.end_date),
          edu.percentage_cgpa,
        ])}
        emptyTitle={t("employees:no_education_added")}
        emptyHint={t("employees:no_qualification_hint")}
      />

      <SectionCard
        icon={FiAward}
        iconClass="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
        title={t("employees:certifications")}
        minWidth="min-w-[680px]"
        columns={[
          t("employees:certificate_name"),
          t("employees:issuing_organization"),
          t("employees:certificate_id"),
          t("employees:issue_date"),
          t("employees:expiry_date"),
        ]}
        rows={certificateList.map((cert) => [
          cert.certificate_name,
          cert.issuing_organization,
          cert.certificate_id,
          fmtDate(cert.issue_date),
          cert.no_expiry ? t("employees:no_expiry") : fmtDate(cert.expiry_date),
        ])}
        emptyTitle={t("employees:no_certifications_added")}
        emptyHint={t("employees:no_qualification_hint")}
      />

      <SectionCard
        icon={FiCode}
        iconClass="bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
        title={t("employees:skills")}
        minWidth="min-w-[560px]"
        columns={[
          t("employees:skill_name"),
          t("employees:proficiency_level"),
          t("employees:skill_type"),
          t("employees:years_experience"),
        ]}
        rows={skillList.map((skill) => [
          skill.skill_name,
          skill.proficiency_level,
          skill.skill_type ? skill.skill_type.replace("_", " ") : "",
          skill.years_experience,
        ])}
        emptyTitle={t("employees:no_skills_added")}
        emptyHint={t("employees:no_qualification_hint")}
      />
    </div>
  );
};

export default QualificationTab;
