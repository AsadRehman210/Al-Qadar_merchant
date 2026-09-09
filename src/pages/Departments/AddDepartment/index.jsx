import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import moment from "moment";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import Datepicker from "components/Datepicker";
import SelectDropdown from "components/SelectDropdown";
import { SkeletonDetail } from "components/Skeleton";
import Calender from "images/icons/calender.png";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import {
  fetchDepartmentById,
  createDepartment,
  updateDepartment,
  showCurrentDepartment,
  showCurrentDepartmentLoading,
  clearCurrentDepartment,
} from "store/slices/departmentSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { departmentStatusOptions } from "global/constant";

const { add_department, edit_department } = alqadar_role_ids;

const AddDepartment = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [selStatus, setSelStatus] = useState(departmentStatusOptions[0]);
  const [selEstablishedDate, setSelEstablishedDate] = useState("");
  const [selHod, setSelHod] = useState(null);

  const existing = useSelector(showCurrentDepartment);
  const loading = useSelector(showCurrentDepartmentLoading);
  const employees = useSelector(showEmployees);

  // Only an active employee can be Head of Department — matches the
  // backend's own validation (department-service.ts hodEmployeeIsActive).
  const hodOptions = useMemo(
    () =>
      employees
        .filter((e) => e.status === "active")
        .map((e) => ({ id: e.id, title: `${e.first_name || ""} ${e.last_name || ""}`.trim() || e.employeeCode })),
    [employees],
  );

  useEffect(() => {
    dispatch(fetchEmployees());
    if (id) dispatch(fetchDepartmentById(id));
    return () => dispatch(clearCurrentDepartment());
  }, [id, dispatch]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      departmentCode: "",
      name: "",
      description: "",
      location: "",
      establishedDate: "",
      status: "Active",
    },
  });

  useEffect(() => {
    if (existing && existing.id === id) {
      const establishedFmt = existing.establishedDate
        ? moment(existing.establishedDate).format("DD-MM-YYYY")
        : "";
      reset({
        departmentCode: existing.departmentCode || "",
        name: existing.name || "",
        description: existing.description || "",
        location: existing.location || "",
        establishedDate: establishedFmt,
        status: existing.status || "Active",
      });
      setSelEstablishedDate(establishedFmt);
      const st = departmentStatusOptions.find((o) => o.id === existing.status);
      if (st) setSelStatus(st);
      setSelHod(
        existing.hodEmployeeId ? { id: existing.hodEmployeeId, title: existing.hodName || "" } : null,
      );
    }
  }, [existing, id, reset]);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      status: selStatus?.id,
      hodEmployeeId: selHod?.id || null,
      establishedDate: data.establishedDate
        ? moment(data.establishedDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        : undefined,
    };
    try {
      if (id) {
        await dispatch(updateDepartment({ id, data: payload })).unwrap();
        toast.success(t("department:update_success"));
      } else {
        await dispatch(createDepartment(payload)).unwrap();
        toast.success(t("department:save_success"));
      }
      navigate("/departments");
    } catch (err) {
      toast.error(err || t("department:save_failed"));
    }
  };

  if (id ? !checkRoleAuth(edit_department) : !checkRoleAuth(add_department)) return null;

  if (id && loading && !existing) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={7} />
      </div>
    );
  }

  const isRTL = i18n.language === "ar";
  const maxEstablished = moment().format("DD-MM-YYYY");

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/departments")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {id
                ? t("department:edit_department")
                : t("department:add_department")}
            </h1>
            <p className="text-mutedForeground">
              {t("department:module_desc")}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormInput
              label={t("department:department_code")}
              name="departmentCode"
              register={register}
              errors={errors}
              placeholder="HR-001"
              required
              pattern={/[A-Za-z0-9\-_]/}
              minLength={2}
              maxLength={100}
            />
            <FormInput
              label={t("department:department_name")}
              name="name"
              register={register}
              errors={errors}
              required
              pattern={/[a-zA-Z0-9\s.'-]/}
              minLength={2}
              maxLength={100}
            />
            <SelectDropdown
              label={t("department:hod_name")}
              data={hodOptions}
              selected={selHod}
              setSelected={setSelHod}
              placeholder={t("department:select_hod")}
              emptyMessage={t("department:no_active_employees")}
            />
            <FormInput
              label={t("department:location")}
              name="location"
              register={register}
              errors={errors}
              pattern={/[a-zA-Z0-9\s.'-]/}
              minLength={2}
              maxLength={100}
            />
            <Datepicker
              label={t("department:established_date")}
              name="establishedDate"
              errors={errors}
              position="right"
              Icon={Calender}
              register={register}
              max={maxEstablished}
              trigger={trigger}
              setValue={setValue}
              selected={selEstablishedDate}
              setSelected={setSelEstablishedDate}
              defaultValue={false}
            />
            <SelectDropdown
              label="department:status"
              data={departmentStatusOptions}
              selected={selStatus}
              setSelected={setSelStatus}
              name="status"
              register={register}
              setValue={setValue}
              trigger={trigger}
              valueKey="id"
              required
            />
            <FormTextarea
              wrapperClass="lg:col-span-3"
              label={t("department:description")}
              name="description"
              register={register}
              errors={errors}
              rows={4}
              maxLength={{ value: 500, message: "Maximum length is 500 characters" }}
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button
              type="button"
              title={t("cancel")}
              btn="secondary"
              onClick={() => navigate("/departments")}
            />
            <Button type="submit" title={t("department:save")} btn="primary" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDepartment;
