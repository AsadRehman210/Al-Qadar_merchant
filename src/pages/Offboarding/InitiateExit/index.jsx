import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import moment from "moment";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import SelectDropdown from "components/SelectDropdown";
import Datepicker from "components/Datepicker";
import Calender from "images/icons/calender.png";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { exitTypeOptions } from "global/constant";
import { initiateExit, fetchActiveExitForEmployee } from "store/slices/offboardingSlice";
import { toast } from "react-toastify";

const InitiateExit = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const isRTL = i18n.language === "ar";

  const employees = useSelector(showEmployees);
  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const employeeOptions = useMemo(
    () => employees.filter((e) => ["active", "probation"].includes(e.status)).map((e) => ({
      id: e.id,
      title: `${e.first_name || ""} ${e.last_name || ""} (${e.employeeCode || ""})`.trim(),
    })),
    [employees],
  );
  const preselectId = searchParams.get("employeeId");

  const [selEmployee, setSelEmployee] = useState(null);
  const [selExitType, setSelExitType] = useState(exitTypeOptions[0]);
  const [selResignationDate, setSelResignationDate] = useState("");
  const [selLastWorkingDay, setSelLastWorkingDay] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectId && employeeOptions.length) {
      setSelEmployee(employeeOptions.find((e) => e.id === preselectId) || null);
    }
  }, [preselectId, employeeOptions]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: { noticePeriodDays: 30, reason: "", notes: "" },
  });

  const noticePeriodDays = watch("noticePeriodDays");

  // Auto-suggest the last working day from resignation date + notice period
  // (Datepicker's own effect syncs `selected` into the form once set below).
  // Datepicker stores/expects DD-MM-YYYY (see its own `changeDate`/`pickerValue`
  // logic)  parsing/formatting with that same format here, not the default
  // ISO-ish parse, is what keeps this suggestion (and the calendar it feeds)
  // actually valid instead of silently producing "Invalid Date".
  useEffect(() => {
    if (selResignationDate && noticePeriodDays) {
      const suggested = moment(selResignationDate, "DD-MM-YYYY").add(Number(noticePeriodDays) || 0, "day").format("DD-MM-YYYY");
      setSelLastWorkingDay(suggested);
    }
  }, [selResignationDate, noticePeriodDays]);

  const onSubmit = async (data) => {
    if (!selEmployee?.id) {
      toast.error(t("offboarding:select_employee_error"));
      return;
    }
    if (selResignationDate && selLastWorkingDay
      && moment(selLastWorkingDay, "DD-MM-YYYY").isBefore(moment(selResignationDate, "DD-MM-YYYY"))) {
      toast.error(t("offboarding:last_working_after_resignation", "Last working day must be on or after resignation date"));
      return;
    }
    setSubmitting(true);
    try {
      const active = await dispatch(fetchActiveExitForEmployee(selEmployee.id)).unwrap();
      if (active) {
        toast.error(t("offboarding:already_in_progress"));
        return;
      }
      // Datepicker stores DD-MM-YYYY; the backend's Date-typed fields need ISO.
      const toIso = (d) => (d ? moment(d, "DD-MM-YYYY").format("YYYY-MM-DD") : undefined);
      const exit = await dispatch(initiateExit({
        employeeId: selEmployee.id,
        exitType: selExitType?.id,
        reason: data.reason,
        noticePeriodDays: Number(data.noticePeriodDays) || 0,
        resignationDate: toIso(selResignationDate),
        lastWorkingDay: toIso(selLastWorkingDay || data.lastWorkingDay),
      })).unwrap();
      toast.success(t("offboarding:exit_initiated"));
      navigate(`/offboarding/detail/${exit.id}`);
    } catch (err) {
      toast.error(err || t("offboarding:already_in_progress"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/offboarding")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20 dark:text-white/90 transition-all"
            iconClass="!text-lg"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("offboarding:initiate_exit")}</h1>
            <p className="text-mutedForeground text-sm mt-1">{t("offboarding:initiate_exit_desc")}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectDropdown
              label={t("offboarding:employee")}
              data={employeeOptions}
              selected={selEmployee || {}}
              setSelected={(v) => setSelEmployee(v?.id ? v : null)}
              name="employeeId"
              register={register}
              setValue={setValue}
              trigger={trigger}
              required
            />
            <SelectDropdown
              label={t("offboarding:exit_type")}
              data={exitTypeOptions}
              selected={selExitType}
              setSelected={(v) => setSelExitType(v || exitTypeOptions[0])}
              name="exitType"
              register={register}
              setValue={setValue}
              trigger={trigger}
              required
            />
            <FormInput
              label={t("offboarding:notice_period_days")}
              name="noticePeriodDays"
              type="number"
              register={register}
              errors={errors}
              required
              min={0}
              max={365}
            />
            <div className="relative">
              <Datepicker
                label={t("offboarding:resignation_date")}
                name="resignationDate"
                errors={errors}
                position="right"
                Icon={Calender}
                register={register}
                trigger={trigger}
                setValue={setValue}
                selected={selResignationDate}
                setSelected={setSelResignationDate}
                defaultValue={false}
                required
              />
            </div>
            <div className="relative">
              <Datepicker
                label={t("offboarding:last_working_day")}
                name="lastWorkingDay"
                errors={errors}
                position="right"
                Icon={Calender}
                register={register}
                trigger={trigger}
                setValue={setValue}
                selected={selLastWorkingDay}
                setSelected={setSelLastWorkingDay}
                defaultValue={false}
                required
                min={selResignationDate || undefined}
                minErrorMessage={t("offboarding:last_working_after_resignation", "Last working day must be on or after resignation date")}
              />
              <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
                {t("offboarding:last_working_day_hint")}
              </p>
            </div>
            <FormTextarea
              wrapperClass="lg:col-span-2"
              label={t("offboarding:reason")}
              required
              name="reason"
              register={register}
              errors={errors}
              rows={3}
              minLength={5}
              maxLength={{ value: 500, message: "Maximum length is 500 characters" }}
              placeholder={t("offboarding:reason_placeholder")}
            />
            <div className="lg:col-span-2">
              <FormInput
                label={t("offboarding:notes")}
                name="notes"
                register={register}
                errors={errors}
                maxLength={500}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button
              type="button"
              title={t("cancel")}
              onClick={() => navigate("/offboarding")}
              className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
            />
            <Button
              type="submit"
              title={t("offboarding:initiate_exit")}
              btn="primary"
              disabled={submitting}
              className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default InitiateExit;
