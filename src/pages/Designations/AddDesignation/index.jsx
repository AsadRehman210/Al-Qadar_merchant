import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import { SkeletonDetail } from "components/Skeleton";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { designationLevelOptions, designationGradeOptions, activeInactiveOptions as STATUS_OPTS } from "global/constant";
import {
  fetchDesignationById,
  createDesignation,
  updateDesignation,
  showCurrentDesignation,
  showCurrentDesignationLoading,
  clearCurrentDesignation,
} from "store/slices/designationSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { showUserData } from "store/slices/uniqueSlice";

const { add_designation, edit_designation } = alqadar_role_ids;

const AddDesignation = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const existing = useSelector(showCurrentDesignation);
  const loading = useSelector(showCurrentDesignationLoading);
  const departments = useSelector(showDepartments);
  const userData = useSelector(showUserData);
  const tenantCurrency = userData?.currency || "SAR";

  useEffect(() => {
    dispatch(fetchDepartments());
    if (id) dispatch(fetchDesignationById(id));
    return () => dispatch(clearCurrentDesignation());
  }, [id, dispatch]);

  const deptOpts = useMemo(
    () => departments.map((d) => ({ id: d.id, title: d.name })),
    [departments],
  );

  const [selLevel, setSelLevel] = useState(designationLevelOptions[4]);
  const [selGrade, setSelGrade] = useState(designationGradeOptions[3]);
  const [selStatus, setSelStatus] = useState(STATUS_OPTS[0]);
  const [selDept, setSelDept] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      code: "",
      title: "",
      shortName: "",
      minSalary: "",
      maxSalary: "",
      overtimeRate: "",
    },
  });

  useEffect(() => {
    const allowed = id ? checkRoleAuth(edit_designation) : checkRoleAuth(add_designation);
    if (!allowed) {
      toast.error("Not authorized");
      navigate("/designations");
    }
  }, [navigate, id]);

  useEffect(() => {
    if (existing && existing.id === id) {
      reset({
        code: existing.code || "",
        title: existing.title || "",
        shortName: existing.shortName || "",
        minSalary: existing.minSalary || "",
        maxSalary: existing.maxSalary || "",
        overtimeRate: existing.overtimeRate || "",
      });
      const lvl = designationLevelOptions.find((l) => l.id === existing.level);
      if (lvl) setSelLevel(lvl);
      const grd = designationGradeOptions.find((g) => g.id === existing.grade);
      if (grd) setSelGrade(grd);
      const st = STATUS_OPTS.find((s) => s.id === existing.status);
      if (st) setSelStatus(st);
      const dept = deptOpts.find((d) => d.id === existing.departmentId);
      if (dept) setSelDept(dept);
    }
  }, [existing, id, reset, deptOpts]);

  const onSubmit = async (data) => {
    if (data.minSalary !== "" && data.maxSalary !== ""
      && Number(data.maxSalary) < Number(data.minSalary)) {
      toast.error(t("designation:max_gte_min", "Max salary must be greater than or equal to min salary"));
      return;
    }
    const payload = {
      ...data,
      minSalary: data.minSalary === "" ? 0 : Number(data.minSalary),
      maxSalary: data.maxSalary === "" ? 0 : Number(data.maxSalary),
      overtimeRate: data.overtimeRate === "" ? 0 : Number(data.overtimeRate),
      level: selLevel?.id,
      grade: selGrade?.id,
      status: selStatus?.id,
      departmentId: selDept?.id,
    };
    try {
      if (id) {
        await dispatch(updateDesignation({ id, data: payload })).unwrap();
        toast.success(t("designation:update_success"));
      } else {
        await dispatch(createDesignation(payload)).unwrap();
        toast.success(t("designation:save_success"));
      }
      navigate("/designations");
    } catch (err) {
      toast.error(err || t("designation:save_failed"));
    }
  };

  if (id ? !checkRoleAuth(edit_designation) : !checkRoleAuth(add_designation)) return null;

  if (id && loading && !existing) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={8} />
      </div>
    );
  }

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/designations")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20 dark:text-white/90 transition-all"
            iconClass="!text-lg"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {id
                ? t("designation:edit_designation")
                : t("designation:add_designation")}
            </h1>
            <p className="text-mutedForeground text-sm mt-1">
              {t("designation:module_desc")}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormInput
              label={t("designation:code")}
              name="code"
              register={register}
              errors={errors}
              required
              placeholder="DES-001"
              pattern={/[A-Za-z0-9\-_]/}
              minLength={2}
              maxLength={100}
            />
            <FormInput
              label={t("designation:title")}
              name="title"
              register={register}
              errors={errors}
              required
              placeholder="e.g. Finance Manager"
              pattern={/[a-zA-Z0-9\s.'-]/}
              minLength={2}
              maxLength={100}
            />
            <FormInput
              label={t("designation:short_name")}
              name="shortName"
              register={register}
              errors={errors}
              placeholder="e.g. FM"
              pattern={/[A-Za-z0-9\-_]/}
              minLength={2}
              maxLength={20}
            />

            <SelectDropdown
              label={t("designation:department")}
              data={deptOpts}
              selected={selDept}
              setSelected={setSelDept}
              name="departmentId"
              valueKey="id"
              register={register}
              setValue={setValue}
              trigger={trigger}
              errors={errors}
              required
              placeholder={t("designation:select_department")}
            />

            <FormInput
              label={`${t("designation:min_salary")} (${tenantCurrency})`}
              name="minSalary"
              register={register}
              errors={errors}
              type="number"
              placeholder="0.00"
              min={0}
              decimal
              decimalPlaces={3}
              maxLength={10}
            />
            <FormInput
              label={`${t("designation:max_salary")} (${tenantCurrency})`}
              name="maxSalary"
              register={register}
              errors={errors}
              type="number"
              placeholder="0.00"
              min={0}
              decimal
              decimalPlaces={3}
              maxLength={10}
            />
            <FormInput
              label={`${t("designation:overtime_rate")} (${tenantCurrency}/hr)`}
              name="overtimeRate"
              register={register}
              errors={errors}
              type="number"
              placeholder="0.00"
              min={0}
              decimal
              decimalPlaces={3}
              maxLength={10}
            />

            <SelectDropdown
              label={t("designation:status")}
              data={STATUS_OPTS}
              selected={selStatus}
              setSelected={setSelStatus}
              hideClear
              classes="!h-[46px] !rounded-lg"
            />

          </div>

          <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button
              type="button"
              title={t("cancel")}
              onClick={() => navigate("/designations")}
              className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
            />
            <Button
              type="submit"
              title={id ? t("update") : t("save")}
              btn="primary"
              className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDesignation;
