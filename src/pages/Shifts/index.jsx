import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit2, FiTrash2, FiClock } from "react-icons/fi";
import { IoAdd } from "react-icons/io5";
import { useForm } from "react-hook-form";
import Button from "components/Button";
import FormInput from "components/FormInput";
import ActionPopup from "components/ActionPopup";
import {
  getShifts,
  addShift,
  updateShift,
  deleteShift,
  calcShiftWorkingHours,
} from "./shiftsFakeData";

const ShiftForm = ({ existing, onDone }) => {
  const { t } = useTranslation();
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: existing?.name || "",
      start: existing?.start || "09:00",
      end: existing?.end || "18:00",
      breakMinutes: existing?.breakMinutes ?? 60,
    },
  });

  const start = watch("start");
  const end = watch("end");
  const breakMinutes = watch("breakMinutes");
  const previewHours = calcShiftWorkingHours(start, end, +breakMinutes || 0);

  const onSubmit = (data) => {
    if (existing) updateShift(existing.id, data);
    else addShift(data);
    onDone?.();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 border border-slate-200 dark:border-white/20 rounded-2xl bg-slate-50 dark:bg-white/5"
    >
      <FormInput
        label={t("employees:shift_name")}
        name="name"
        register={register}
        errors={errors}
        required
        className="lg:col-span-2"
      />
      <FormInput label={t("employees:start_time")} name="start" type="time" register={register} errors={errors} required />
      <FormInput label={t("employees:end_time")} name="end" type="time" register={register} errors={errors} required />
      <FormInput label={t("employees:break_minutes")} name="breakMinutes" type="number" register={register} errors={errors} />
      <div>
        <label className="text-sm text-linkText font-medium leading-6 mb-1 block">
          {t("employees:working_hours")}
        </label>
        <div className="h-[46px] rounded-lg border border-[#E0E5F2] bg-white dark:bg-white/10 dark:border-white/20 flex items-center px-4 text-sm font-semibold text-slate-700 dark:text-white/90">
          {previewHours}h
        </div>
      </div>
      <div className="lg:col-span-4 flex gap-3 justify-end pt-2 border-t border-slate-200 dark:border-white/20">
        <Button type="button" title={t("cancel")} onClick={onDone} className="!rounded-lg !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
        <Button type="submit" title={t("save")} btn="primary" className="!rounded-lg !bg-teal-500 !border-0" />
      </div>
    </form>
  );
};

const Shifts = () => {
  const { t } = useTranslation();
  const deleteRef = useRef();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [, setTick] = useState(0);
  const list = getShifts();

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1] space-y-6">
        <div className="flex flex-wrap items-center gap-4 dark:text-white">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{t("employees:shifts_title")}</h1>
            <p className="text-mutedForeground">{t("employees:shifts_desc")}</p>
          </div>
          <Button
            type="button"
            title={t("employees:add_shift")}
            icon={IoAdd}
            iconClass="h-4 w-4 text-white"
            btn="primary"
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="!w-auto !rounded-md !h-10 !px-4 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600"
          />
        </div>

        {showForm && !editing && (
          <ShiftForm onDone={() => { setShowForm(false); setTick((n) => n + 1); }} />
        )}
        {editing && showForm && (
          <ShiftForm
            existing={editing}
            onDone={() => { setEditing(null); setShowForm(false); setTick((n) => n + 1); }}
          />
        )}

        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  {[
                    t("employees:shift_name"),
                    t("employees:start_time"),
                    t("employees:end_time"),
                    t("employees:break_minutes"),
                    t("employees:working_hours"),
                    t("actions"),
                  ].map((h) => (
                    <th key={h} className="px-4 py-4 text-start font-semibold text-white/95 whitespace-nowrap first:pl-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400 dark:text-white/40">
                      <FiClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {t("employees:no_shifts")}
                    </td>
                  </tr>
                ) : (
                  list.map((shift) => (
                    <tr key={shift.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10">
                      <td className="px-4 py-4 pl-6 font-semibold text-slate-900 dark:text-white">{shift.name}</td>
                      <td className="px-4 py-4">{shift.start}</td>
                      <td className="px-4 py-4">{shift.end}</td>
                      <td className="px-4 py-4">{shift.breakMinutes}m</td>
                      <td className="px-4 py-4">{shift.workingHours}h</td>
                      <td className="px-4 py-4 pr-6">
                        <div className="flex gap-2 text-slate-500 dark:text-white/70">
                          <button type="button" onClick={() => { setEditing(shift); setShowForm(true); }} className="hover:text-teal-600">
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDeletingId(shift.id); deleteRef.current?.openModal?.(shift); }}
                            className="hover:text-red-600"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ActionPopup
        ref={deleteRef}
        title={t("employees:delete_shift")}
        description={t("employees:confirm_delete_shift")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={() => {
          if (deletingId) { deleteShift(deletingId); setTick((n) => n + 1); }
          deleteRef.current?.closeModal?.();
        }}
      />
    </div>
  );
};

export default Shifts;
