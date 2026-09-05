import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import FormTextarea from "components/FormTextarea";
import SelectDropdown from "components/SelectDropdown";
import { activeInactiveOptions as WAREHOUSE_STATUS_OPTS } from "global/constant";
import {
  fetchWarehouseById,
  createWarehouse,
  updateWarehouse,
  showCurrentWarehouse,
  clearCurrentWarehouse,
} from "store/slices/warehouseSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";

const AddWarehouse = () => {
  const { t } = useTranslation("warehouse");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id }   = useParams();
  const isEdit   = Boolean(id);

  const existing = useSelector(showCurrentWarehouse);
  const employees = useSelector(showEmployees);
  const [selStatus, setSelStatus] = useState(WAREHOUSE_STATUS_OPTS[0]);
  const employeeOptions = useMemo(
    () => employees.map((e) => ({ id: e.id, name: `${e.first_name || ""} ${e.last_name || ""}`.trim(), title: `${e.first_name || ""} ${e.last_name || ""}`.trim() })),
    [employees],
  );
  const [selManager, setSelManager] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { code: "", name: "", location: "", manager: "", capacity: "", unit: "sqm", description: "" },
  });

  useEffect(() => {
    dispatch(fetchEmployees({ status: "Active" }));
    if (id) dispatch(fetchWarehouseById(id));
    return () => dispatch(clearCurrentWarehouse());
  }, [id, dispatch]);

  useEffect(() => {
    if (existing && isEdit) {
      reset({
        code: existing.code,
        name: existing.name,
        location: existing.location,
        manager: existing.manager,
        capacity: existing.capacity,
        unit: existing.unit || "sqm",
        description: existing.description || "",
      });
      const s = WAREHOUSE_STATUS_OPTS.find((o) => o.id === existing.status);
      if (s) setSelStatus(s);
      const m = employeeOptions.find((o) => o.name === existing.manager);
      if (m) setSelManager(m);
    }
  }, [existing, isEdit, reset, employeeOptions]);

  const onSubmit = async (data) => {
    const payload = { ...data, capacity: Number(data.capacity) || 0, status: selStatus?.id };
    try {
      if (isEdit) await dispatch(updateWarehouse({ id, data: payload })).unwrap();
      else await dispatch(createWarehouse(payload)).unwrap();
      toast.success(isEdit ? t("update_success") : t("save_success"));
      navigate("/warehouse");
    } catch (err) {
      toast.error(err || t("save_error", { defaultValue: "Something went wrong" }));
    }
  };

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
        <Button type="button" onClick={() => navigate("/warehouse")} icon={FiArrowLeft} className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90" iconClass="!text-lg" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? t("edit_warehouse") : t("add_warehouse")}</h1>
          <p className="text-mutedForeground text-sm mt-1">{t("module_desc")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-white/10 rounded-3xl border border-slate-200 dark:border-white/20 p-8 border-l-4 !border-l-[var(--color-teal-500)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isEdit && (
            <FormInput label={t("code")} name="code" register={register} errors={errors} disabled />
          )}
          <FormInput label={t("name")}     name="name"     register={register} errors={errors} required={t("name_required")} placeholder={t("name")}
            pattern={/[a-zA-Z0-9\s.'-]/} minLength={2} maxLength={150} />
          <div>
            <SelectDropdown
              label={t("manager")}
              data={employeeOptions}
              selected={selManager}
              setSelected={(opt) => {
                setSelManager(opt);
                setValue("manager", opt?.name || "");
              }}
              classes="!h-[46px] !rounded-lg"
            />
            <input type="hidden" {...register("manager")} />
          </div>
          <FormInput label={t("capacity")} name="capacity" register={register} errors={errors} placeholder="5000" type="number" min={0} decimal decimalPlaces={2} maxLength={10} />
          <FormInput label={t("unit")}     name="unit"     register={register} errors={errors} placeholder="sqm / pallets" pattern={/[a-zA-Z0-9\s./-]/} maxLength={20} />
          <SelectDropdown label={t("status")} data={WAREHOUSE_STATUS_OPTS} selected={selStatus} setSelected={setSelStatus} hideClear classes="!h-[46px] !rounded-lg" />
          <FormInput label={t("location")} name="location" register={register} errors={errors} required={t("location_required")} placeholder={t("location_placeholder")}
            pattern={/[a-zA-Z0-9\s.'-]/} minLength={2} maxLength={150} />
          <div className="md:col-span-2 lg:col-span-3">
            <FormTextarea label={t("description")} name="description" register={register} errors={errors} placeholder={t("description_placeholder")} maxLength={500} rows={4} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-slate-200 dark:border-white/20">
          <Button type="button" title={t("cancel", { ns: "translation" })} onClick={() => navigate("/warehouse")} className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
          <Button type="submit" title={isEdit ? t("update", { ns: "translation" }) : t("save", { ns: "translation" })} btn="primary" className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0" />
        </div>
      </form>
    </div>
  );
};

export default AddWarehouse;
