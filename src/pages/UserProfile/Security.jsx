import { useState } from "react";
import Button from "components/Button";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import FormInput from "components/FormInput";
import Error from "images/icons/error.png";
import { showStatus, resetPassword, setStatus } from "store/slices/authSlice";
import { showUserData } from "store/slices/uniqueSlice";
import { toast } from "react-toastify";
import { SUCCESS } from "global/config";

const Security = () => {
  const [error, setError] = useState();
  const { t } = useTranslation();
  const status = useSelector(showStatus);
  const userData = useSelector(showUserData);
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
  });

  const handleUpdateUserInfo = async (field) => {
    // set password validation
    if (field.new_password !== field.confirm_password) {
      toast.error(t("password_same"));
      setError(t("password_same"));
      return null;
    }
    delete field.confirm_password;
    field.email = userData?.email;
    setError("");
    try {
      const response = await dispatch(resetPassword(field)).unwrap();
      if (response?.response_code === SUCCESS) {
        toast.success(response?.message);
        reset();
        dispatch(setStatus(false));
      } else {
        toast.error(response?.message);
        dispatch(setStatus(false));
      }
    } catch (error) {
      toast.error(error);
      dispatch(setStatus(false));
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(handleUpdateUserInfo)}
        className="lg:max-w-[96%] w-full"
      >
        <div className="flex flex-wrap items-center gap-3 justify-between mb-5">
          <div>
            <h1 className="text-xl text-[#454545] dark:text-white tracking-[0.2px] font-semibold">
              {t("change_password")}
            </h1>
          </div>
        </div>
        <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
          <div className="md:col-span-2 md:grid md:grid-cols-2 gap-3">
            <FormInput
              placeholder={t("type_here")}
              label={t("old_password")}
              name="old_password"
              errors={errors}
              register={register}
              required={t("enter_old_password")}
              type="password"
              getValues={getValues}
              labelClass="!text-darkBlue"
            />
          </div>
          <FormInput
            placeholder={t("type_here")}
            label={t("new_password")}
            name="new_password"
            errors={errors}
            register={register}
            required={t("enter_new_password")}
            type="password"
            getValues={getValues}
            labelClass="!text-darkBlue"
          />
          <div>
            <FormInput
              placeholder={t("type_here")}
              label={t("confirm_password")}
              name="confirm_password"
              errors={errors}
              register={register}
              required={t("enter_confirm_password")}
              type="password"
              labelClass="!text-darkBlue"
            />
            {error && (
              <p className="text-[#ED4F9D] text-xs flex items-center gap-2 mt-1 font-medium">
                <img src={Error} className="" />
                {error}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <Button
            type="submit"
            disabled={!isValid || status}
            title={t("save")}
            loading={status}
            className="!w-1/4"
            btn="primary"
          />
        </div>
      </form>
    </>
  );
};

export default Security;
