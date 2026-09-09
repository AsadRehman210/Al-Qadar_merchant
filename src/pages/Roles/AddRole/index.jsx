import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import Button from "components/Button";
import PermissionMatrix from "components/PermissionMatrix";
import { SkeletonDetail } from "components/Skeleton";
import {
  createRole,
  updateRole,
  fetchRoleById,
  clearCurrentRole,
  showCurrentRole,
  showCurrentRoleLoading,
  showRoleSaving,
} from "store/slices/roleSlice";
import { userRoleStatusOptions } from "global/constant";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { add_role, edit_role } = alqadar_role_ids;

const AddRole = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const editData = useSelector(showCurrentRole);
  const loadingEdit = useSelector(showCurrentRoleLoading);
  const saving = useSelector(showRoleSaving);

  const [permissions, setPermissions] = useState([]);
  const [selStatus, setSelStatus] = useState(userRoleStatusOptions[0]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ mode: "onChange" });

  useEffect(() => {
    if (id) dispatch(fetchRoleById(id));
    return () => dispatch(clearCurrentRole());
  }, [id, dispatch]);

  useEffect(() => {
    if (id && editData?.id) {
      setValue("role_name", editData.role_name || "");
      setPermissions(editData.permissions || []);
      setSelStatus(userRoleStatusOptions.find((o) => o.id === editData.status) || userRoleStatusOptions[0]);
    }
  }, [id, editData, setValue]);

  const onSubmit = async (field) => {
    if (!permissions.length) {
      toast.error(t("please_add_permissions"));
      return;
    }
    const payload = {
      role_name: field.role_name.trim(),
      permissions,
      status: selStatus?.id || "active",
    };
    try {
      if (id) await dispatch(updateRole({ id, data: payload })).unwrap();
      else await dispatch(createRole(payload)).unwrap();
      toast.success(id ? t("updated_successfully") : t("added_successfully"));
      navigate("/roles");
    } catch (e) {
      toast.error(e || t("something_went_wrong"));
    }
  };

  if ((id && !checkRoleAuth(edit_role)) || (!id && !checkRoleAuth(add_role))) return null;

  if (id && loadingEdit) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={6} />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight dark:text-white">
          {id ? t("edit_role") : t("add_role")}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <div className="grid md:grid-cols-2 gap-6">
            <FormInput
              label={t("role_name")}
              labelClass="text-linkText"
              placeholder={t("enter_role_name")}
              type="text"
              name="role_name"
              errors={errors}
              register={register}
              required={t("enter_role_name")}
              pattern={/^[a-zA-Z0-9\s\-/]*$/}
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
          </div>
        </div>

        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <PermissionMatrix value={permissions} onChange={setPermissions} />
        </div>

        <div className="flex gap-4 justify-end">
          <Button type="button" title={t("cancel")} onClick={() => navigate("/roles")} />
          <Button
            type="submit"
            title={id ? t("update_role") : t("add_role")}
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

export default AddRole;
