import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import Button from "components/Button";
import PhoneNumberInput from "components/PhoneNumberInput";
import { SkeletonDetail } from "components/Skeleton";
import { fetchActiveRoles, showActiveRoles } from "store/slices/roleSlice";
import {
  createUser,
  updateUser,
  fetchUserById,
  clearCurrentUser,
  showCurrentErpUser,
  showCurrentErpUserLoading,
  showErpUserSaving,
} from "store/slices/userSlice";
import { userRoleStatusOptions } from "global/constant";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { add_user, edit_user } = alqadar_role_ids;

const AddUser = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const editData = useSelector(showCurrentErpUser);
  const loadingEdit = useSelector(showCurrentErpUserLoading);
  const saving = useSelector(showErpUserSaving);
  const activeRoles = useSelector(showActiveRoles);

  const roleOptions = useMemo(
    () => (activeRoles || []).map((r) => ({ id: r.id, title: r.role_name })),
    [activeRoles],
  );

  const [role, setRole] = useState(null);
  const [selStatus, setSelStatus] = useState(userRoleStatusOptions[0]);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    setError,
    formState: { errors },
  } = useForm({ mode: "onChange" });

  useEffect(() => {
    dispatch(fetchActiveRoles());
    if (id) dispatch(fetchUserById(id));
    return () => dispatch(clearCurrentUser());
  }, [id, dispatch]);

  useEffect(() => {
    if (id && editData?.id) {
      setValue("first_name", editData.first_name || "");
      setValue("last_name", editData.last_name || "");
      setValue("email", editData.email || "");
      setValue("phone", editData.phone || "");
      setSelStatus(userRoleStatusOptions.find((o) => o.id === editData.status) || userRoleStatusOptions[0]);
    }
  }, [id, editData, setValue]);

  useEffect(() => {
    if (id && editData?.roleId && roleOptions.length) {
      const found = roleOptions.find((o) => o.id === editData.roleId);
      if (found) setRole(found);
    }
  }, [id, editData, roleOptions]);

  const onSubmit = async (field) => {
    if (!role?.id) {
      toast.error(t("select_role"));
      return;
    }
    if (field.password && field.password !== field.confirm_password) {
      setError("confirm_password", { type: "manual", message: t("password_does_not_match") });
      return;
    }
    if (!id && !field.password) {
      setError("password", { type: "manual", message: t("enter_password") });
      return;
    }

    const payload = {
      first_name: field.first_name.trim(),
      last_name: field.last_name?.trim() || "",
      email: field.email.trim(),
      phone: field.phone || "",
      roleId: role.id,
      status: selStatus?.id || "active",
    };
    if (field.password) payload.password = field.password;

    try {
      if (id) await dispatch(updateUser({ id, data: payload })).unwrap();
      else await dispatch(createUser(payload)).unwrap();
      toast.success(id ? t("updated_successfully") : t("added_successfully"));
      navigate("/users");
    } catch (e) {
      toast.error(e || t("something_went_wrong"));
    }
  };

  if ((id && !checkRoleAuth(edit_user)) || (!id && !checkRoleAuth(add_user))) return null;

  if (id && loadingEdit) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={8} />
      </div>
    );
  }

  const passwordValue = watch("password");

  return (
    <div className="relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight dark:text-white">
          {id ? t("edit_user") : t("add_user")}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <div className="grid md:grid-cols-2 gap-6">
            <FormInput
              label={t("first_name")}
              labelClass="text-linkText"
              placeholder={t("enter_first_name")}
              type="text"
              name="first_name"
              errors={errors}
              register={register}
              required={t("enter_first_name")}
              pattern={/^[a-zA-Z\s\-/]*$/}
            />
            <FormInput
              label={t("last_name")}
              labelClass="text-linkText"
              placeholder={t("enter_last_name")}
              type="text"
              name="last_name"
              errors={errors}
              register={register}
              pattern={/^[a-zA-Z\s\-/]*$/}
            />
            <FormInput
              label={t("email")}
              labelClass="text-linkText"
              placeholder={t("enter_email")}
              type="text"
              name="email"
              errors={errors}
              register={register}
              required={t("enter_email")}
            />
            <PhoneNumberInput
              name="phone"
              label={t("mobile_number")}
              errors={errors}
              register={register}
              setValue={setValue}
              trigger={trigger}
              labelClass="text-linkText"
              country="sa"
              defPhone={editData?.phone}
            />
            <SelectDropdown
              label="role"
              labelClass="text-linkText"
              data={roleOptions}
              selected={role}
              setSelected={setRole}
              classes="!h-[46px] !rounded-lg"
              placeholder={t("select_here")}
              name="roleId"
              errors={errors}
              register={register}
              required={t("select_role")}
              setValue={setValue}
              trigger={trigger}
              valueKey="id"
            />
            <SelectDropdown
              label="status"
              labelClass="text-linkText"
              data={userRoleStatusOptions}
              selected={selStatus}
              setSelected={setSelStatus}
              hideClear
              classes="!h-[46px] !rounded-lg"
            />
            <FormInput
              label={t("password")}
              labelClass="text-linkText"
              placeholder={t("enter_password")}
              type="password"
              name="password"
              errors={errors}
              register={register}
              required={!id ? t("enter_password") : ""}
            />
            <FormInput
              label={t("confirm_password")}
              labelClass="text-linkText"
              placeholder={t("enter_confirm_password")}
              type="password"
              name="confirm_password"
              errors={errors}
              register={register}
              required={!id || passwordValue ? t("enter_confirm_password") : ""}
            />
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Button type="button" title={t("cancel")} onClick={() => navigate("/users")} />
          <Button
            type="submit"
            title={id ? t("update_user") : t("add_user")}
            btn="primary"
            loading={saving}
            disabled={saving}
            className="!bg-gradient-to-br !from-teal-500 !to-teal-600 !text-white !border-0"
          />
        </div>
      </form>
    </div>
  );
};

export default AddUser;
