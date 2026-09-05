import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight, FiEdit2, FiTrash2 } from "react-icons/fi";
import { IoAdd } from "react-icons/io5";
import { useForm } from "react-hook-form";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import ActionPopup from "components/ActionPopup";
import { SkeletonTable } from "components/Skeleton";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  fetchLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  showLeaveTypes,
  showLeaveTypesLoading,
} from "store/slices/leaveTypeSlice";
import { leaveApplicableGenderOptions, activeInactiveOptions } from "global/constant";

const { add_employee } = rafeeqi_role_ids;
const LeaveTypeForm = ({ existing, onDone }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [selGender, setSelGender] = useState(leaveApplicableGenderOptions.find((g) => g.id === (existing?.applicableGender || "all")) || leaveApplicableGenderOptions[0]);
  const [selStatus, setSelStatus] = useState(activeInactiveOptions.find((s) => s.id === (existing?.status || "Active")) || activeInactiveOptions[0]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: existing?.name || "",
      daysPerYear: existing?.daysPerYear || 0,
      carryForward: existing?.carryForward || 0,
      minNoticeDays: existing?.minNoticeDays || 0,
      maxDaysAtOnce: existing?.maxDaysAtOnce || 30,
    },
  });

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      daysPerYear: +data.daysPerYear,
      carryForward: +data.carryForward,
      minNoticeDays: +data.minNoticeDays,
      maxDaysAtOnce: +data.maxDaysAtOnce,
      paid: data.paid === true || data.paid === "true" || data.paid === "on",
      requiresDocument: data.requiresDocument === true || data.requiresDocument === "true" || data.requiresDocument === "on",
      applicableGender: selGender.id,
      status: selStatus.id,
    };
    try {
      if (existing) await dispatch(updateLeaveType({ id: existing.id, data: payload })).unwrap();
      else await dispatch(createLeaveType(payload)).unwrap();
      toast.success(t("leave:type_save_success"));
      onDone?.();
    } catch (err) {
      toast.error(err || t("leave:type_save_failed"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 border border-slate-200 dark:border-white/20 rounded-2xl bg-slate-50 dark:bg-white/5">
      <FormInput
        label={t("leave:type_name")}
        name="name"
        register={register}
        errors={errors}
        required
        className="lg:col-span-2"
        pattern={/[a-zA-Z0-9\s.'-]/}
        minLength={2}
        maxLength={100}
      />
      <FormInput
        label={t("leave:days_per_year")}
        name="daysPerYear"
        type="number"
        register={register}
        errors={errors}
        required
        min={0}
        max={365}
      />
      <FormInput
        label={t("leave:carry_forward")}
        name="carryForward"
        type="number"
        register={register}
        errors={errors}
        min={0}
        max={365}
      />
      <FormInput
        label={t("leave:min_notice")}
        name="minNoticeDays"
        type="number"
        register={register}
        errors={errors}
        min={0}
        max={365}
      />
      <FormInput
        label={t("leave:max_at_once")}
        name="maxDaysAtOnce"
        type="number"
        register={register}
        errors={errors}
        min={1}
        max={365}
      />
      <SelectDropdown label="leave:applicable_gender" data={leaveApplicableGenderOptions} selected={selGender} setSelected={(v) => setSelGender(v || leaveApplicableGenderOptions[0])} />
      <SelectDropdown label="leave:status" data={activeInactiveOptions} selected={selStatus} setSelected={(v) => setSelStatus(v || activeInactiveOptions[0])} />
      <div className="flex items-center gap-6 pt-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" {...register("paid")} defaultChecked={existing?.paid !== false} className="rounded accent-teal-500" />
          <span className="text-linkText">{t("leave:paid_leave")}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" {...register("requiresDocument")} defaultChecked={!!existing?.requiresDocument} className="rounded accent-teal-500" />
          <span className="text-linkText">{t("leave:doc_required")}</span>
        </label>
      </div>
      <div className="lg:col-span-3 flex gap-3 justify-end pt-2 border-t border-slate-200 dark:border-white/20">
        <Button type="button" title={t("cancel")} onClick={onDone} className="!rounded-lg !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
        <Button type="submit" title={t("save")} btn="primary" className="!rounded-lg !bg-teal-500 !border-0" />
      </div>
    </form>
  );
};

const LeaveTypes = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const deleteRef = useRef();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const isRTL = i18n.language === "ar";
  const list = useSelector(showLeaveTypes);
  const loading = useSelector(showLeaveTypesLoading);

  useEffect(() => {
    dispatch(fetchLeaveTypes());
  }, [dispatch]);

  if (!checkRoleAuth(add_employee)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1] space-y-6">
        <div className="flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/leave-management")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{t("leave:leave_types")}</h1>
            <p className="text-mutedForeground">{t("leave:leave_types_desc")}</p>
          </div>
          <Button
            type="button"
            title={t("leave:add_type")}
            icon={IoAdd}
            iconClass="h-4 w-4 text-white"
            btn="primary"
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="!w-auto !rounded-md !h-10 !px-4 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600"
          />
        </div>

        {showForm && !editing && (
          <LeaveTypeForm onDone={() => setShowForm(false)} />
        )}

        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-md overflow-hidden">
          {loading ? (
            <div className="p-4">
              <SkeletonTable rows={6} columns={9} />
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  {[t("leave:type_name"), t("leave:days_per_year"), t("leave:carry_forward"), t("leave:min_notice"), t("leave:max_at_once"), t("leave:gender"), t("leave:paid_leave"), t("leave:doc_required"), t("status"), t("leave:actions")].map((h) => (
                    <th key={h} className="px-4 py-4 text-start font-semibold text-white/95 whitespace-nowrap first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((type) => (
                  <tr key={type.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10">
                    <td className="px-4 py-4 pl-6 font-semibold text-slate-900 dark:text-white">{type.name}</td>
                    <td className="px-4 py-4 text-center">{type.daysPerYear === 999 ? "∞" : type.daysPerYear}</td>
                    <td className="px-4 py-4 text-center">{type.carryForward}</td>
                    <td className="px-4 py-4 text-center">{type.minNoticeDays}d</td>
                    <td className="px-4 py-4 text-center">{type.maxDaysAtOnce}d</td>
                    <td className="px-4 py-4 text-center capitalize">{type.applicableGender}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${type.paid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {type.paid ? t("yes") : t("no")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${type.requiresDocument ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                        {type.requiresDocument ? t("yes") : t("no")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${type.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {type.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 pr-6">
                      <div className="flex gap-2 text-slate-500 dark:text-white/70">
                        <button type="button" onClick={() => { setEditing(type); setShowForm(true); }} className="hover:text-teal-600">
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDeletingId(type.id); deleteRef.current?.openModal?.(type); }}
                          className="hover:text-red-600"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {editing && showForm && (
          <div className="mt-4">
            <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-white">{t("leave:edit_type")}: {editing.name}</p>
            <LeaveTypeForm
              existing={editing}
              onDone={() => { setEditing(null); setShowForm(false); }}
            />
          </div>
        )}
      </div>

      <ActionPopup
        ref={deleteRef}
        title={t("leave:delete_type")}
        description={t("leave:confirm_delete_type")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={async () => {
          if (deletingId) {
            try {
              await dispatch(deleteLeaveType(deletingId)).unwrap();
              toast.success(t("leave:type_delete_success"));
            } catch (err) {
              toast.error(err || t("leave:type_delete_failed"));
            }
          }
          deleteRef.current?.closeModal?.();
        }}
      />
    </div>
  );
};

export default LeaveTypes;
