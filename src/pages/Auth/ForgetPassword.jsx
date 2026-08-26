import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SendOtp from "components/SendOtp";
import useTimer from "components/useTimer";
import {
  showStatus,
  setStatus,
  requestPasswordResetOtpErp,
  verifyOtpErp,
  resetPasswordWithOtpErp,
} from "store/slices/authSlice";
import "./Login.css";

const ForgetPassword = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [email, setEmailState] = useState("");
  const [otp, setOtp] = useState("");
  const dispatch = useDispatch();
  const status = useSelector(showStatus);
  const navigate = useNavigate();
  const { timeLeft, startTimer } = useTimer(60);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
  } = useForm({ mode: "onChange" });

  const {
    register: registerPw,
    handleSubmit: handleSubmitPw,
    getValues: getValuesPw,
    formState: { errors: errorsPw, isValid: isValidPw },
  } = useForm({ mode: "onChange" });

  const handleSendOtp = async (field) => {
    dispatch(setStatus(true));
    try {
      await dispatch(requestPasswordResetOtpErp(field.email)).unwrap();
      toast.success(t("otp_sent", { defaultValue: "A verification code has been sent to your email." }));
      setEmailState(field.email);
      setStep(2);
      startTimer();
    } catch (err) {
      toast.error(err || t("otp_send_failed", { defaultValue: "Could not send the code. Please try again." }));
    } finally {
      dispatch(setStatus(false));
    }
  };

  const resendOtp = async () => {
    dispatch(setStatus(true));
    try {
      await dispatch(requestPasswordResetOtpErp(email)).unwrap();
      toast.success(t("otp_sent", { defaultValue: "A verification code has been sent to your email." }));
      startTimer();
    } catch (err) {
      toast.error(err || t("otp_send_failed", { defaultValue: "Could not send the code. Please try again." }));
    } finally {
      dispatch(setStatus(false));
    }
  };

  // Verified immediately against /auth/verify-otp — a wrong/expired code
  // shows an error right here instead of silently moving on and only
  // failing later at the final reset-password submit. This check doesn't
  // consume the OTP (resetPasswordWithOtp still does that), so the user can
  // re-enter it here as many times as the rate limit allows.
  const handleOtpComplete = async (code) => {
    dispatch(setStatus(true));
    try {
      await dispatch(verifyOtpErp({ email, otp: code })).unwrap();
      setOtp(code);
      setStep(3);
    } catch (err) {
      toast.error(err || t("otp_invalid", { defaultValue: "Invalid or expired code." }));
    } finally {
      dispatch(setStatus(false));
    }
  };

  const handleResetPassword = async () => {
    const password = getValuesPw("password");
    const confirm_password = getValuesPw("confirm_password");
    if (password !== confirm_password) {
      toast.error(t("password_same", { defaultValue: "Passwords do not match." }));
      return;
    }
    dispatch(setStatus(true));
    try {
      await dispatch(resetPasswordWithOtpErp({ email, otp, password })).unwrap();
      toast.success(t("password_reset_success", { defaultValue: "Password has been reset successfully." }));
      navigate("/");
    } catch (err) {
      toast.error(err || t("password_reset_failed", { defaultValue: "Could not reset password. Please try again." }));
    } finally {
      dispatch(setStatus(false));
    }
  };

  return (
    <>
      <Helmet>
        <title>Al-Qadar | Forgot Password</title>
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
                <span className="login-logo-icon">R</span>
                <span className="login-logo-text">Al-Qadar</span>
              </div>
              <p className="login-subtitle">
                {step === 1
                  ? t("forgot_password_subtitle", { defaultValue: "Enter your email to receive a reset code" })
                  : step === 2
                    ? t("otp_subtitle", { defaultValue: "Enter the 6-digit code sent to your email" })
                    : t("new_password_subtitle", { defaultValue: "Choose a new password" })}
              </p>
            </div>

            {step === 1 && (
              <form onSubmit={handleSubmit(handleSendOtp)} className="login-form">
                <FormInput
                  label={t("email", { defaultValue: "Email" })}
                  placeholder="name@company.com"
                  type="email"
                  name="email"
                  errors={errors}
                  register={register}
                  required={t("email_required", { defaultValue: "Enter your email" })}
                  labelClass="!text-white"
                  inputClass="!bg-white/10 !border-white/20 !text-white placeholder:!text-white/50 focus:!border-teal-400"
                />
                <Button
                  type="submit"
                  title={t("send_code", { defaultValue: "Send Code" })}
                  btn="primary"
                  loading={status}
                  disabled={status || !isValid}
                  className="!w-full !h-[52px] border-none"
                />
                <Link to="/" className="login-forgot-link login-back-link">
                  {t("back_to_sign_in", { defaultValue: "Back to Sign In" })}
                </Link>
              </form>
            )}

            {step === 2 && (
              <div className="login-form">
                <SendOtp
                  timeLeft={timeLeft}
                  sendOtp={resendOtp}
                  titleClass="!hidden"
                  description={t("otp_sent_to", { defaultValue: `We've sent a code to ${email}. It expires in 1 minute.` })}
                  descClass="!text-white/70"
                  onSubmit={handleOtpComplete}
                  status={status}
                />
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleSubmitPw(handleResetPassword)} className="login-form">
                <FormInput
                  label={t("password", { defaultValue: "New Password" })}
                  placeholder={t("enter_password", { defaultValue: "Min. 8 characters" })}
                  type="password"
                  name="password"
                  errors={errorsPw}
                  register={registerPw}
                  getValues={getValuesPw}
                  required={t("enter_password", { defaultValue: "Enter your password" })}
                  labelClass="!text-white"
                  inputClass="!bg-white/10 !border-white/20 !text-white placeholder:!text-white/50 focus:!border-teal-400"
                />
                <FormInput
                  label={t("confirm_password", { defaultValue: "Confirm Password" })}
                  placeholder={t("enter_confirm_password", { defaultValue: "Re-enter password" })}
                  type="password"
                  name="confirm_password"
                  errors={errorsPw}
                  register={registerPw}
                  required={t("enter_confirm_password", { defaultValue: "Confirm your password" })}
                  labelClass="!text-white"
                  inputClass="!bg-white/10 !border-white/20 !text-white placeholder:!text-white/50 focus:!border-teal-400"
                />
                <Button
                  type="submit"
                  title={t("save", { defaultValue: "Save" })}
                  btn="primary"
                  loading={status}
                  disabled={status || !isValidPw}
                  className="!w-full !h-[52px] border-none"
                />
              </form>
            )}
          </div>

          <div className="login-welcome">
            <h1>{t("forgot_password?", { defaultValue: "Forgot your password?" })}</h1>
            <p>
              {t("forgot_password_hint", {
                defaultValue: "No worries — verify your email and you'll be back in within a minute.",
              })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgetPassword;
