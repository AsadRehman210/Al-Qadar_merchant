import { useState, useEffect } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import Datepicker from "components/Datepicker";
import Button from "components/Button";
import Checkboxes from "components/Checkboxes";
import Calender from "images/icons/calender.png";
import { IoAdd, IoTrashOutline, IoPencilOutline, IoCloseOutline } from "react-icons/io5";

const DEFAULT_EDUCATION = {
  degree_name: "",
  field_major: "",
  institute_university: "",
  board_university: "",
  country_city: "",
  end_date: "",
  percentage_cgpa: "",
};

const DEFAULT_CERTIFICATE = {
  certificate_name: "",
  issuing_organization: "",
  issue_date: "",
  expiry_date: "",
  certificate_id: "",
  no_expiry: true,
};

const DEFAULT_SKILL = {
  skill_name: "",
  proficiency_level: "beginner",
  years_experience: "",
  skill_type: "",
};

const PROFICIENCY_OPTIONS = [
  { title: "Beginner", id: "beginner" },
  { title: "Intermediate", id: "intermediate" },
  { title: "Advanced", id: "advanced" },
  { title: "Expert", id: "expert" },
];

const SKILL_TYPE_OPTIONS = [
  { title: "Technical", id: "technical" },
  { title: "Soft Skill", id: "soft_skill" },
  { title: "Language", id: "language" },
];

// Read-only rows table shown below each section's draft form — matches the
// table look used across the app (EmployeeDetail's Qualification/Salary
// tabs) so what you add here looks the same as how it's displayed later.
const EntryTable = ({ columns, rows, minWidth, onEdit, onDelete, editingIndex }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 mb-5">
    <div className={minWidth}>
      <table className="w-full border-collapse text-sm mb-0">
        <thead>
          <tr className="bg-[var(--color-teal-500)] border-none">
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 text-start font-semibold text-white/95 border-none whitespace-nowrap first:pl-5">
                {col}
              </th>
            ))}
            <th className="w-[90px] px-4 py-3 border-none" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className={`transition-colors border-b border-slate-100 dark:border-white/5 last:border-b-0 ${
                editingIndex === idx
                  ? "bg-teal-50 dark:bg-teal-500/10"
                  : "hover:bg-slate-50 dark:hover:bg-white/5"
              }`}
            >
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className={`px-4 py-3 align-middle text-slate-700 dark:text-white/90 whitespace-nowrap first:pl-5 ${
                    cIdx === 0 ? "font-medium text-slate-900 dark:text-white" : ""
                  }`}
                >
                  {cell || "-"}
                </td>
              ))}
              <td className="px-4 py-3 align-middle">
                <div className="flex items-center gap-1 justify-end pr-1">
                  <button
                    type="button"
                    onClick={() => onEdit(idx)}
                    className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-500/10"
                  >
                    <IoPencilOutline className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(idx)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <IoTrashOutline className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Qualification = ({ setSelectedIndex, setValidValues }) => {
  const { t } = useTranslation();
  const {
    register,
    control,
    setValue,
    trigger,
    watch,
    getValues,
    formState: { errors },
  } = useFormContext();

  const educationFields = useFieldArray({ control, name: "education" });
  const certificateFields = useFieldArray({ control, name: "certificates" });
  const skillFields = useFieldArray({ control, name: "skills" });

  const [eduEditIndex, setEduEditIndex] = useState(null);
  const [certEditIndex, setCertEditIndex] = useState(null);
  const [skillEditIndex, setSkillEditIndex] = useState(null);

  const [eduEndDate, setEduEndDate] = useState("");
  const [certIssueDate, setCertIssueDate] = useState("");
  const [certExpiryDate, setCertExpiryDate] = useState("");
  const [selProficiency, setSelProficiency] = useState(PROFICIENCY_OPTIONS[0]);
  const [selSkillType, setSelSkillType] = useState(null);

  // Draft fields live at a fixed (non-array) path so they can reuse the same
  // FormInput/Datepicker components as the rest of the wizard — they're only
  // folded into the real education/certificates/skills arrays on "Add".
  const resetEduDraft = () => {
    setValue("_draftEducation", { ...DEFAULT_EDUCATION });
    setEduEndDate("");
    setEduEditIndex(null);
  };
  const resetCertDraft = () => {
    setValue("_draftCertificate", { ...DEFAULT_CERTIFICATE });
    setCertIssueDate("");
    setCertExpiryDate("");
    setCertEditIndex(null);
  };
  const resetSkillDraft = () => {
    setValue("_draftSkill", { ...DEFAULT_SKILL });
    setSelProficiency(PROFICIENCY_OPTIONS[0]);
    setSelSkillType(null);
    setSkillEditIndex(null);
  };

  useEffect(() => {
    resetEduDraft();
    resetCertDraft();
    resetSkillDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddEducation = async () => {
    const valid = await trigger("_draftEducation.degree_name");
    if (!valid) return;
    const draft = getValues("_draftEducation");
    if (eduEditIndex != null) educationFields.update(eduEditIndex, draft);
    else educationFields.append(draft);
    resetEduDraft();
  };
  const handleEditEducation = (index) => {
    const item = educationFields.fields[index];
    setValue("_draftEducation", { ...DEFAULT_EDUCATION, ...item });
    setEduEndDate(item.end_date || "");
    setEduEditIndex(index);
  };

  const handleAddCertificate = async () => {
    const valid = await trigger("_draftCertificate.certificate_name");
    if (!valid) return;
    const draft = getValues("_draftCertificate");
    if (certEditIndex != null) certificateFields.update(certEditIndex, draft);
    else certificateFields.append(draft);
    resetCertDraft();
  };
  const handleEditCertificate = (index) => {
    const item = certificateFields.fields[index];
    setValue("_draftCertificate", { ...DEFAULT_CERTIFICATE, ...item });
    setCertIssueDate(item.issue_date || "");
    setCertExpiryDate(item.expiry_date || "");
    setCertEditIndex(index);
  };

  const handleAddSkill = async () => {
    const valid = await trigger("_draftSkill.skill_name");
    if (!valid) return;
    const draft = getValues("_draftSkill");
    if (skillEditIndex != null) skillFields.update(skillEditIndex, draft);
    else skillFields.append(draft);
    resetSkillDraft();
  };
  const handleEditSkill = (index) => {
    const item = skillFields.fields[index];
    setValue("_draftSkill", { ...DEFAULT_SKILL, ...item });
    setSelProficiency(
      PROFICIENCY_OPTIONS.find((o) => o.id === item.proficiency_level) || PROFICIENCY_OPTIONS[0],
    );
    setSelSkillType(SKILL_TYPE_OPTIONS.find((o) => o.id === item.skill_type) || null);
    setSkillEditIndex(index);
  };

  const onNext = (e) => {
    e.preventDefault();
    setValidValues(3);
    setSelectedIndex(3);
  };

  const certNoExpiry = watch("_draftCertificate.no_expiry");

  return (
    <form onSubmit={onNext} className="w-full">
      <div className="space-y-10">
        {/* Education Section */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t("employees:education")}
          </h3>

          {educationFields.fields.length > 0 && (
            <EntryTable
              columns={[
                t("employees:degree_name"),
                t("employees:field_major"),
                t("employees:board_university"),
                t("employees:end_date_passing_year"),
                t("employees:percentage_cgpa"),
              ]}
              minWidth="min-w-[700px]"
              editingIndex={eduEditIndex}
              rows={educationFields.fields.map((e) => [
                e.degree_name,
                e.field_major,
                [e.institute_university, e.board_university].filter(Boolean).join(" • "),
                e.end_date,
                e.percentage_cgpa,
              ])}
              onEdit={handleEditEducation}
              onDelete={(idx) => {
                educationFields.remove(idx);
                if (eduEditIndex === idx) resetEduDraft();
              }}
            />
          )}

          <div className="p-5 rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50/50 dark:bg-white/5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t("employees:degree_name")}
                name="_draftEducation.degree_name"
                register={register}
                errors={errors}
                required
                placeholder="e.g. BSc, MBA"
                minLength={2}
                maxLength={100}
              />
              <FormInput
                label={t("employees:field_major")}
                name="_draftEducation.field_major"
                register={register}
                errors={errors}
                placeholder="e.g. Computer Science"
                minLength={2}
                maxLength={100}
              />
              <FormInput
                label={t("employees:board_university")}
                name="_draftEducation.board_university"
                register={register}
                errors={errors}
                placeholder="e.g. HEC, CBSE"
                minLength={2}
                maxLength={100}
              />
              <FormInput
                label={t("employees:country_city")}
                name="_draftEducation.country_city"
                register={register}
                errors={errors}
                placeholder="e.g. Riyadh, Saudi Arabia"
                pattern={/[a-zA-Z\s.,'-]/}
                minLength={2}
                maxLength={100}
              />
              <div className="relative">
                <Datepicker
                  label={t("employees:end_date_passing_year")}
                  name="_draftEducation.end_date"
                  register={register}
                  errors={errors}
                  position="right"
                  Icon={Calender}
                  trigger={trigger}
                  setValue={setValue}
                  selected={eduEndDate}
                  setSelected={setEduEndDate}
                  isDefaultSelection={false}
                />
              </div>
              <FormInput
                label={t("employees:percentage_cgpa")}
                name="_draftEducation.percentage_cgpa"
                register={register}
                errors={errors}
                placeholder="e.g. 3.5 CGPA or 85%"
                maxLength={20}
              />
            </div>
            <div className="flex items-center gap-3 justify-end pt-1">
              {eduEditIndex != null && (
                <Button
                  type="button"
                  icon={IoCloseOutline}
                  title={t("cancel")}
                  btn="outline"
                  className="!rounded-lg !h-10 !text-sm"
                  onClick={resetEduDraft}
                />
              )}
              <Button
                type="button"
                icon={IoAdd}
                title={eduEditIndex != null ? t("employees:update_education") : t("employees:add_education")}
                btn="primary"
                className="!rounded-lg !h-10 !text-sm"
                onClick={handleAddEducation}
              />
            </div>
          </div>
        </div>

        {/* Certificates Section */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t("employees:certifications")}
          </h3>

          {certificateFields.fields.length > 0 && (
            <EntryTable
              columns={[
                t("employees:certificate_name"),
                t("employees:issuing_organization"),
                t("employees:certificate_id"),
                t("employees:issue_date"),
                t("employees:expiry_date"),
              ]}
              minWidth="min-w-[680px]"
              editingIndex={certEditIndex}
              rows={certificateFields.fields.map((c) => [
                c.certificate_name,
                c.issuing_organization,
                c.certificate_id,
                c.issue_date,
                c.no_expiry ? t("employees:no_expiry") : c.expiry_date,
              ])}
              onEdit={handleEditCertificate}
              onDelete={(idx) => {
                certificateFields.remove(idx);
                if (certEditIndex === idx) resetCertDraft();
              }}
            />
          )}

          <div className="p-5 rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50/50 dark:bg-white/5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t("employees:certificate_name")}
                name="_draftCertificate.certificate_name"
                register={register}
                errors={errors}
                required
                placeholder="e.g. AWS Certified Developer"
                minLength={2}
                maxLength={100}
              />
              <FormInput
                label={t("employees:issuing_organization")}
                name="_draftCertificate.issuing_organization"
                register={register}
                errors={errors}
                placeholder="e.g. Microsoft, Google"
                minLength={2}
                maxLength={100}
              />
              <div className="relative">
                <Datepicker
                  label={t("employees:issue_date")}
                  name="_draftCertificate.issue_date"
                  register={register}
                  errors={errors}
                  position="right"
                  Icon={Calender}
                  trigger={trigger}
                  setValue={setValue}
                  selected={certIssueDate}
                  setSelected={setCertIssueDate}
                  isDefaultSelection={false}
                />
              </div>
              <FormInput
                label={t("employees:certificate_id")}
                name="_draftCertificate.certificate_id"
                register={register}
                errors={errors}
                placeholder="License / Certificate ID"
                pattern={/[A-Za-z0-9\-_]/}
                minLength={2}
                maxLength={100}
              />
              <Controller
                name="_draftCertificate.no_expiry"
                control={control}
                render={({ field }) => (
                  <Checkboxes
                    enabled={!!field.value}
                    onChange={field.onChange}
                    label={t("employees:no_expiry")}
                    labelClass="text-sm font-medium text-slate-700 dark:text-white/90"
                    fieldClass="pt-6"
                  />
                )}
              />
              {!certNoExpiry && (
                <div className="relative">
                  <Datepicker
                    label={t("employees:expiry_date")}
                    name="_draftCertificate.expiry_date"
                    register={register}
                    errors={errors}
                    position="right"
                    Icon={Calender}
                    trigger={trigger}
                    setValue={setValue}
                    selected={certExpiryDate}
                    setSelected={setCertExpiryDate}
                    isDefaultSelection={false}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 justify-end pt-1">
              {certEditIndex != null && (
                <Button
                  type="button"
                  icon={IoCloseOutline}
                  title={t("cancel")}
                  btn="outline"
                  className="!rounded-lg !h-10 !text-sm"
                  onClick={resetCertDraft}
                />
              )}
              <Button
                type="button"
                icon={IoAdd}
                title={certEditIndex != null ? t("employees:update_certificate") : t("employees:add_certificate")}
                btn="primary"
                className="!rounded-lg !h-10 !text-sm"
                onClick={handleAddCertificate}
              />
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t("employees:skills")}
          </h3>

          {skillFields.fields.length > 0 && (
            <EntryTable
              columns={[
                t("employees:skill_name"),
                t("employees:proficiency_level"),
                t("employees:skill_type"),
                t("employees:years_experience"),
              ]}
              minWidth="min-w-[560px]"
              editingIndex={skillEditIndex}
              rows={skillFields.fields.map((s) => [
                s.skill_name,
                s.proficiency_level,
                s.skill_type ? s.skill_type.replace("_", " ") : "",
                s.years_experience,
              ])}
              onEdit={handleEditSkill}
              onDelete={(idx) => {
                skillFields.remove(idx);
                if (skillEditIndex === idx) resetSkillDraft();
              }}
            />
          )}

          <div className="p-5 rounded-xl border border-slate-200 dark:border-white/20 bg-slate-50/50 dark:bg-white/5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label={t("employees:skill_name")}
                name="_draftSkill.skill_name"
                register={register}
                errors={errors}
                required
                placeholder="e.g. React.js, Communication, Excel"
                minLength={2}
                maxLength={100}
              />
              <SelectDropdown
                label={t("employees:proficiency_level")}
                data={PROFICIENCY_OPTIONS}
                selected={selProficiency}
                setSelected={setSelProficiency}
                name="_draftSkill.proficiency_level"
                valueKey="id"
                register={register}
                setValue={setValue}
                trigger={trigger}
                hideClear
              />
              <FormInput
                label={t("employees:years_experience")}
                name="_draftSkill.years_experience"
                register={register}
                errors={errors}
                type="number"
                placeholder="e.g. 2"
                min={0}
                max={50}
              />
              <SelectDropdown
                label={`${t("employees:skill_type")} (${t("employees:optional")})`}
                data={SKILL_TYPE_OPTIONS}
                selected={selSkillType || {}}
                setSelected={(v) => {
                  // Clearing sets `{}` — the component's own setValue effect
                  // no-ops on an empty formValue, so clear the RHF field here
                  // directly rather than relying on it.
                  setSelSkillType(v);
                  setValue("_draftSkill.skill_type", v?.id || "");
                }}
                name="_draftSkill.skill_type"
                valueKey="id"
                register={register}
                setValue={setValue}
                trigger={trigger}
                placeholder={t("employees:select")}
              />
            </div>
            <div className="flex items-center gap-3 justify-end pt-1">
              {skillEditIndex != null && (
                <Button
                  type="button"
                  icon={IoCloseOutline}
                  title={t("cancel")}
                  btn="outline"
                  className="!rounded-lg !h-10 !text-sm"
                  onClick={resetSkillDraft}
                />
              )}
              <Button
                type="button"
                icon={IoAdd}
                title={skillEditIndex != null ? t("employees:update_skill") : t("employees:add_skill")}
                btn="primary"
                className="!rounded-lg !h-10 !text-sm"
                onClick={handleAddSkill}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
        <Button
          type="button"
          title={t("back")}
          btn="outline"
          onClick={() => setSelectedIndex(1)}
        />
        <Button type="submit" title={t("next")} btn="primary" />
      </div>
    </form>
  );
};

export default Qualification;
