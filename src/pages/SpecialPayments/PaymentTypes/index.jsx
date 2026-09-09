import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { IoAdd } from "react-icons/io5";
import { toast } from "react-toastify";
import { FiEdit2, FiTrash2, FiArrowLeft, FiCheck, FiX, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import FormInput from "components/FormInput";
import { useForm } from "react-hook-form";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import {
  fetchSpTypes,
  showSpTypes,
  showSpTypesLoading,
  createSpType,
  updateSpType,
  deleteSpType,
  fetchSpecialPayments,
  showSpecialPayments,
} from "store/slices/payrollBatchSlice";
import { SkeletonList } from "components/Skeleton";

const { view_special_payment_type, add_special_payment_type, edit_special_payment_type, delete_special_payment_type } = alqadar_role_ids;

const AMOUNT_MODES = [
  { id: "fixed",     label: "Fixed Amount (SAR)",       hint: "Every employee gets the same fixed SAR amount" },
  { id: "pct_basic", label: "% of Basic Salary",        hint: "Calculated as percentage of each employee's basic salary" },
  { id: "pct_gross", label: "% of Gross Salary",        hint: "Calculated as percentage of each employee's total gross earnings" },
];

const EMOJI_PRESETS = ["🌙", "🐑", "✨", "🏆", "🎯", "🤝", "💰", "🎁", "⭐", "🎉", "💎", "🙌"];

const modeBadge = (mode) => {
  if (mode === "fixed") return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
  if (mode === "pct_basic") return "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300";
  return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
};

const modeLabel = (mode, value) => {
  if (mode === "fixed") return `SAR ${(value || 0).toLocaleString()}`;
  if (mode === "pct_basic") return `${value}% of Basic`;
  if (mode === "pct_gross") return `${value}% of Gross`;
  return "-";
};

const TypeForm = ({ initial, onSave, onCancel, t }) => {
  const isEdit = !!initial;
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: initial?.name || "",
      description: initial?.description || "",
      icon: initial?.icon || "💰",
      amountMode: initial?.amountMode || "fixed",
      amountValue: initial?.amountValue || "",
    },
  });
  const watchedMode = watch("amountMode");
  const watchedIcon = watch("icon");

  return (
    <form onSubmit={handleSubmit((data) => onSave({ ...data, amountValue: parseFloat(data.amountValue) || 0 }))}
      className="bg-white dark:bg-white/10 border-2 border-teal-200 dark:border-teal-500/30 rounded-2xl p-6 space-y-5">
      <h3 className="font-bold text-slate-800 dark:text-white">
        {isEdit ? t("payroll:sp_edit_type") : t("payroll:sp_add_type")}
      </h3>

      {/* Name + icon row */}
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <FormInput
            label={t("payroll:sp_type_icon")}
            name="icon"
            register={register}
            maxLength={2}
            inputClass="!w-14 !h-11 !rounded-xl !text-center !text-2xl !p-0"
            labelClass="!text-xs"
            wrapperClass="shrink-0"
          />
        </div>
        <div className="flex-1 min-w-0">
          <FormInput label={t("payroll:sp_type_name")} name="name" register={register} errors={errors} required
            pattern={/[a-zA-Z0-9\s.'-]/} minLength={2} maxLength={100}
            placeholder="e.g. Eid ul-Fitr Bonus" />
        </div>
      </div>

      {/* Emoji presets */}
      <div>
        <p className="text-xs text-slate-500 dark:text-white/50 mb-1.5">{t("payroll:sp_icon_presets")}</p>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_PRESETS.map((em) => (
            <button key={em} type="button" onClick={() => setValue("icon", em)}
              className={`w-9 h-9 rounded-lg text-lg transition-all ${watchedIcon === em ? "bg-teal-100 ring-2 ring-teal-400" : "bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20"}`}>
              {em}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <FormInput label={t("payroll:notes")} name="description" register={register} errors={errors}
        maxLength={500}
        placeholder={t("payroll:sp_type_desc_placeholder")} />

      {/* Amount Mode */}
      <div>
        <label className="text-sm font-medium text-linkText mb-2 block">{t("payroll:sp_amount_mode")} *</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {AMOUNT_MODES.map((m) => (
            <label key={m.id}
              className={`flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${watchedMode === m.id ? "border-teal-400 bg-teal-50 dark:bg-teal-500/10" : "border-slate-200 dark:border-white/10 hover:border-teal-200"}`}>
              <input type="radio" value={m.id} {...register("amountMode", { required: true })} className="mt-0.5 accent-teal-500" />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">{m.label}</p>
                <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">{m.hint}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Amount Value */}
      <div className="flex items-end gap-3">
        <div className="w-44">
          <FormInput
            label={watchedMode === "fixed" ? t("payroll:sp_amount_value_sar") : t("payroll:sp_amount_value_pct")}
            name="amountValue" type="number" register={register} errors={errors} required
            min={0} max={watchedMode === "fixed" ? undefined : 100}
            decimal decimalPlaces={3} maxLength={10}
            placeholder={watchedMode === "fixed" ? "e.g. 2000" : "e.g. 10"} />
        </div>
        <p className="text-sm text-slate-500 dark:text-white/60 pb-1">
          {watchedMode === "fixed" ? "SAR" : "%"}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <Button type="button" title={t("cancel")} onClick={onCancel}
          className="!w-auto !rounded-lg !h-9 !px-4 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white !border-0" />
        <Button type="submit" title={isEdit ? t("payroll:sp_save_type") : t("payroll:sp_add_type")}
          icon={FiCheck} iconClass="h-3.5 w-3.5 text-white"
          className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600" />
      </div>
    </form>
  );
};

const PaymentTypes = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isRTL = i18n.language === "ar";
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const types = useSelector(showSpTypes);
  const typesLoading = useSelector(showSpTypesLoading);
  const allPayments = useSelector(showSpecialPayments);

  useEffect(() => {
    dispatch(fetchSpTypes());
    dispatch(fetchSpecialPayments());
  }, [dispatch]);

  const usageCount = (typeId) => allPayments.filter((p) => p.typeId === typeId).length;

  const handleAdd = async (data) => {
    try {
      await dispatch(createSpType(data)).unwrap();
      await dispatch(fetchSpTypes());
      setShowAdd(false);
    } catch (err) {
      toast.error(err || "Failed to add type.");
    }
  };
  const handleEdit = async (id, data) => {
    try {
      await dispatch(updateSpType({ id, data })).unwrap();
      await dispatch(fetchSpTypes());
      setEditId(null);
    } catch (err) {
      toast.error(err || "Failed to update type.");
    }
  };
  const handleDelete = async (id) => {
    try {
      await dispatch(deleteSpType(id)).unwrap();
      await dispatch(fetchSpTypes());
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error(err || "Failed to delete type.");
    }
  };

  if (!checkRoleAuth(view_special_payment_type)) return null;

  return (
    <div className="relative min-h-[60vh]">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1] max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/special-payments")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{t("payroll:sp_manage_types")}</h1>
            <p className="text-mutedForeground mt-0.5">{t("payroll:sp_manage_types_desc")}</p>
          </div>
          {!showAdd && checkRoleAuth(add_special_payment_type) && (
            <Button type="button" title={t("payroll:sp_add_type")} icon={IoAdd} iconClass="h-5 w-5 text-white"
              onClick={() => { setShowAdd(true); setEditId(null); }}
              className="!w-auto !rounded-md !h-11 !px-5 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600" />
          )}
        </div>

        {/* Info banner */}
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
          <span className="text-base shrink-0">ℹ️</span>
          <span>{t("payroll:sp_types_info_banner")}</span>
        </div>

        {/* Add form */}
        {showAdd && checkRoleAuth(add_special_payment_type) && (
          <TypeForm t={t} onSave={handleAdd} onCancel={() => setShowAdd(false)} />
        )}

        {/* Types table */}
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <h2 className="font-bold text-xl text-slate-900 dark:text-white mb-5">
            {t("payroll:sp_type_list")} <span className="text-sm font-normal text-slate-400">({types.length})</span>
          </h2>

          {typesLoading ? (
            <SkeletonList rows={4} />
          ) : types.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-4xl mb-2">💰</p>
              <p className="font-medium">{t("payroll:sp_no_types")}</p>
              <p className="text-sm mt-1">{t("payroll:sp_no_types_hint")}</p>
            </div>
          ) : (
          <div className="space-y-3">
            {types.map((type) => {
              const usage = usageCount(type.id);
              const isEditing = editId === type.id;
              const isDeleteConfirm = deleteConfirmId === type.id;

              if (isEditing) {
                return checkRoleAuth(edit_special_payment_type) ? (
                  <TypeForm key={type.id} t={t} initial={type}
                    onSave={(data) => handleEdit(type.id, data)}
                    onCancel={() => setEditId(null)} />
                ) : null;
              }

              return (
                <div key={type.id}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-white/10 hover:border-teal-200 dark:hover:border-teal-500/30 transition-all bg-slate-50/50 dark:bg-white/5">
                  {/* Icon */}
                  <span className="text-3xl shrink-0 w-12 h-12 flex items-center justify-center bg-white dark:bg-white/10 rounded-xl shadow-sm border border-slate-200 dark:border-white/10">
                    {type.icon || "💰"}
                  </span>

                  {/* Name + desc */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">{type.name}</p>
                    {type.description && (
                      <p className="text-xs text-slate-500 dark:text-white/60 truncate mt-0.5">{type.description}</p>
                    )}
                  </div>

                  {/* Amount rule badge */}
                  <div className="shrink-0 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${modeBadge(type.amountMode)}`}>
                      {modeLabel(type.amountMode, type.amountValue)}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {AMOUNT_MODES.find((m) => m.id === type.amountMode)?.label}
                    </p>
                  </div>

                  {/* Usage */}
                  <div className="shrink-0 text-center w-16">
                    <p className="font-bold text-slate-800 dark:text-white">{usage}</p>
                    <p className="text-xs text-slate-400">{t("payroll:sp_type_usage")}</p>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-1">
                    {isDeleteConfirm ? (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/30">
                        <span className="text-xs text-rose-700 dark:text-rose-300 mr-1">{t("payroll:confirm_delete")}</span>
                        <button type="button" onClick={() => handleDelete(type.id)}
                          className="h-6 w-6 flex items-center justify-center rounded-lg bg-rose-500 text-white hover:bg-rose-600">
                          <FiCheck className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => setDeleteConfirmId(null)}
                          className="h-6 w-6 flex items-center justify-center rounded-lg bg-slate-200 dark:bg-white/20 text-slate-600 hover:bg-slate-300">
                          <FiX className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {checkRoleAuth(edit_special_payment_type) && (
                          <button type="button"
                            onClick={() => { setEditId(type.id); setShowAdd(false); }}
                            className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-teal-100 dark:hover:bg-teal-500/20 text-slate-500 hover:text-teal-600 transition-colors">
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {checkRoleAuth(delete_special_payment_type) && (
                          <button type="button"
                            disabled={usage > 0}
                            onClick={() => setDeleteConfirmId(type.id)}
                            title={usage > 0 ? t("payroll:sp_type_in_use_warning") : t("payroll:sp_delete_type")}
                            className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentTypes;
