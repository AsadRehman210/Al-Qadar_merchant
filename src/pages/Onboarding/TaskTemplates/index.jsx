import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight, FiEdit2, FiTrash2, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { IoAdd } from "react-icons/io5";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import ActionPopup from "components/ActionPopup";
import TableState from "components/TableState";
import { onboardingTaskCategoryOptions } from "global/constant";
import {
  fetchOnboardingTemplates,
  showOnboardingTemplates,
  showOnboardingTemplatesLoading,
  createOnboardingTemplate,
  updateOnboardingTemplate,
  deleteOnboardingTemplate,
  reorderOnboardingTemplates,
} from "store/slices/onboardingSlice";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { view_onboarding_template, add_onboarding_template, edit_onboarding_template, delete_onboarding_template } = alqadar_role_ids;

const TaskTemplateForm = ({ existing, onDone }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [selCategory, setSelCategory] = useState(
    onboardingTaskCategoryOptions.find((c) => c.id === existing?.category) || onboardingTaskCategoryOptions[0],
  );
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { label: existing?.label || "" },
  });

  const onSubmit = async (data) => {
    if (!selCategory?.id) {
      toast.error(t("hrhub:category_required", "Category is required"));
      return;
    }
    const payload = { label: data.label, category: selCategory.id, required: data.required === true || data.required === "on" };
    if (existing) await dispatch(updateOnboardingTemplate({ id: existing.id, data: payload }));
    else await dispatch(createOnboardingTemplate(payload));
    onDone?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border border-slate-200 dark:border-white/20 rounded-2xl bg-slate-50 dark:bg-white/5">
      <FormInput
        label={t("hrhub:task_label")}
        name="label"
        register={register}
        errors={errors}
        required
        className="md:col-span-2"
        pattern={/[a-zA-Z0-9\s.'-]/}
        minLength={2}
        maxLength={100}
      />
      <SelectDropdown label="hrhub:task_category" data={onboardingTaskCategoryOptions} selected={selCategory} setSelected={(v) => setSelCategory(v || onboardingTaskCategoryOptions[0])} required hideClear />
      <label className="flex items-center gap-2 cursor-pointer text-sm md:col-span-3">
        <input type="checkbox" {...register("required")} defaultChecked={existing?.required !== false} className="rounded accent-teal-500" />
        <span className="text-linkText">{t("hrhub:task_required")}</span>
      </label>
      <div className="md:col-span-3 flex gap-3 justify-end pt-2 border-t border-slate-200 dark:border-white/20">
        <Button type="button" title={t("cancel")} onClick={onDone} className="!rounded-lg !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
        <Button type="submit" title={t("save")} btn="primary" className="!rounded-lg !bg-teal-500 !border-0" />
      </div>
    </form>
  );
};

const TaskTemplates = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const deleteRef = useRef();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const isRTL = i18n.language === "ar";

  const list = useSelector(showOnboardingTemplates);
  const loading = useSelector(showOnboardingTemplatesLoading);

  useEffect(() => {
    dispatch(fetchOnboardingTemplates());
  }, [dispatch]);

  if (!checkRoleAuth(view_onboarding_template)) return null;

  const move = (id, direction) => {
    const idx = list.findIndex((t) => t.id === id);
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapWith < 0 || swapWith >= list.length) return;
    const orderedIds = list.map((t) => t.id);
    [orderedIds[idx], orderedIds[swapWith]] = [orderedIds[swapWith], orderedIds[idx]];
    dispatch(reorderOnboardingTemplates(orderedIds));
  };

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1] space-y-6">
        <div className="flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/onboarding")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{t("hrhub:manage_checklist")}</h1>
            <p className="text-mutedForeground">{t("hrhub:manage_checklist_desc")}</p>
          </div>
          {checkRoleAuth(add_onboarding_template) && (
            <Button
              type="button"
              title={t("hrhub:add_task")}
              icon={IoAdd}
              iconClass="h-4 w-4 text-white"
              btn="primary"
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="!w-auto !rounded-md !h-10 !px-4 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600"
            />
          )}
        </div>

        {showForm && (editing ? checkRoleAuth(edit_onboarding_template) : checkRoleAuth(add_onboarding_template)) && (
          <TaskTemplateForm
            existing={editing}
            onDone={() => { setShowForm(false); setEditing(null); }}
          />
        )}

        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  {[t("hrhub:order"), t("hrhub:task_label"), t("hrhub:task_category"), t("hrhub:task_required"), t("status"), t("leave:actions")].map((h) => (
                    <th key={h} className="px-4 py-4 text-start font-semibold text-white/95 whitespace-nowrap first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <TableState loading data={[]} colSpan={6} />}
                {!loading && list.map((tpl, idx) => (
                  <tr key={tpl.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10">
                    <td className="px-4 py-4 pl-6">
                      <div className="flex items-center gap-1">
                        {checkRoleAuth(edit_onboarding_template) && (
                          <>
                            <button type="button" disabled={idx === 0} onClick={() => move(tpl.id, "up")} className="disabled:opacity-20 hover:text-teal-600 text-slate-500">
                              <FiArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" disabled={idx === list.length - 1} onClick={() => move(tpl.id, "down")} className="disabled:opacity-20 hover:text-teal-600 text-slate-500">
                              <FiArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">{tpl.label}</td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70">
                        {onboardingTaskCategoryOptions.find((c) => c.id === tpl.category)?.title}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${tpl.required ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"}`}>
                        {tpl.required ? t("hrhub:required") : t("hrhub:optional")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {checkRoleAuth(edit_onboarding_template) ? (
                        <button
                          type="button"
                          onClick={() => dispatch(updateOnboardingTemplate({ id: tpl.id, data: { active: !tpl.active } }))}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${tpl.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"}`}
                        >
                          {tpl.active ? t("active") : t("inactive")}
                        </button>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${tpl.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"}`}>
                          {tpl.active ? t("active") : t("inactive")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 pr-6">
                      <div className="flex gap-2 text-slate-500 dark:text-white/70">
                        {checkRoleAuth(edit_onboarding_template) && (
                          <button type="button" onClick={() => { setEditing(tpl); setShowForm(true); }} className="hover:text-teal-600">
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                        )}
                        {checkRoleAuth(delete_onboarding_template) && (
                          <button
                            type="button"
                            onClick={() => { setDeletingId(tpl.id); deleteRef.current?.openModal?.(tpl); }}
                            className="hover:text-red-600"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && list.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">{t("hrhub:no_tasks")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ActionPopup
        ref={deleteRef}
        title={t("hrhub:delete_task")}
        description={t("hrhub:confirm_delete_task")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={() => {
          if (deletingId) dispatch(deleteOnboardingTemplate(deletingId));
          deleteRef.current?.closeModal?.();
        }}
      />
    </div>
  );
};

export default TaskTemplates;
