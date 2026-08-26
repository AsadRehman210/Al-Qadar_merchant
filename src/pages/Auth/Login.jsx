import { Helmet } from "react-helmet";
import Button from "components/Button";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  showStatus,
  loginErp,
  setStatus,
  showBranding,
} from "store/slices/authSlice";
import {
  addPassword,
  addEmail,
  showPassword,
  showEmail,
  clearUserData,
} from "store/slices/uniqueSlice";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import FormInput from "components/FormInput";
import Checkboxes from "components/Checkboxes";
import { LogoFull } from "assets";
import ImageWithFallback from "components/ImageWithFallback";
import "./Login.css";

const Login = () => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [loginError, setLoginError] = useState("");
  const email = useSelector(showEmail);
  const password = useSelector(showPassword);
  const status = useSelector(showStatus);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const showBrandingData = useSelector(showBranding);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
  });
  useEffect(() => {
    if (email) {
      setEnabled(true);
      setValue("email", email);
      setValue("password", password);
      trigger("email");
      trigger("password");
    }
  }, []);

  const handleLogin = async (field) => {
    setLoginError("");
    const password = field.password?.trim?.() ?? "";
    dispatch(clearUserData());
    try {
      await dispatch(loginErp({ email: field.email, password })).unwrap();
      if (enabled) {
        dispatch(addPassword(password));
        dispatch(addEmail(field.email));
      } else {
        dispatch(addPassword(""));
        dispatch(addEmail(""));
      }
      toast.success("Login successful.");
      navigate("/dashboard");
      dispatch(setStatus(false));
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || "Login failed";
      setLoginError(msg);
      toast.error(msg);
      dispatch(setStatus(false));
    }
  };

  return (
    <>
      <Helmet>
        <title>Al-Qadar | Login</title>
      </Helmet>
      <div className="login-page">
        <div className="login-bg">
          <div className="login-shape login-shape-1" />
          <div className="login-shape login-shape-2" />
          <div className="login-shape login-shape-3" />
          <div className="login-grid" />
        </div>

        <div className="login-content">
          <div className="login-card">
            <div className="login-card-glow" />
            <div className="login-header">
              <div className="login-logo">
                {showBrandingData?.primary_logo ? (
                  <ImageWithFallback
                    src={showBrandingData.primary_logo}
                    className="login-logo-img"
                    fallbackSrc={LogoFull}
                    alt={showBrandingData?.organizationData?.name}
                  />
                ) : (
                  <>
                    <span className="login-logo-icon">R</span>
                    <span className="login-logo-text">Al-Qadar</span>
                  </>
                )}
              </div>
              <p className="login-subtitle">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit(handleLogin)} className="login-form">
              {loginError && <div className="login-error">{loginError}</div>}
              <FormInput
                label="Email"
                placeholder={t("email") || "name@company.com"}
                type="email"
                name="email"
                errors={errors}
                register={register}
                required="Enter your email"
                labelClass="!text-white"
                inputClass="!bg-white/10 !border-white/20 !text-white placeholder:!text-white/50 focus:!border-teal-400"
              />
              <FormInput
                label="Password"
                placeholder="Enter your password"
                type="password"
                name="password"
                errors={errors}
                register={register}
                required={t("enter_password") || "Enter your password"}
                skipPasswordStrength
                getValues={getValues}
                labelClass="!text-white"
                inputClass="!bg-white/10 !border-white/20 !text-white placeholder:!text-white/50 focus:!border-teal-400"
              />
              <div className="login-options">
                <div className="flex flex-row flex-wrap items-center justify-between gap-3 w-full">
                  <div className="shrink-0">
                    <Checkboxes
                      label={t("Keep me logged in") || "Remember me"}
                      enabled={enabled}
                      onChange={setEnabled}
                      checkClass="bg-[var(--color-teal-500)]"
                      labelClass="!text-white/90"
                    />
                  </div>
                  <Link
                    to="/forget-password"
                    className="login-forgot-link shrink-0"
                  >
                    {t("forgot_password?") || "Forgot password?"}
                  </Link>
                </div>
              </div>
              <Button
                type="submit"
                title="Sign In"
                btn="primary"
                loading={status}
                disabled={status || !isValid}
                className=" !w-full !h-[52px] border-none"
              />
            </form>

            <p className="login-footer">
              Don&apos;t have an account? Please contact your administrator.
            </p>
          </div>

          <div className="login-welcome">
            <h1>Welcome back</h1>
            <p>
              Manage your workforce, attendance, payroll and more from one
              place.
            </p>
            <ul className="login-features">
              <li>Employee management</li>
              <li>Leave & attendance</li>
              <li>Payroll & reports</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
