import { RegisterOtp } from "assets";
import Button from "components/Button";
import { useRef, useState } from "react";

const SendOtp = ({
  timeLeft,
  sendOtp,
  title,
  description,
  titleClass,
  descClass,
  onSubmit,
  status,
}) => {
  const inputRefs = useRef([]);
  const [isOtpComplete, setIsOtpComplete] = useState(false);
  // Convert seconds to MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleChange = (e, index) => {
    const { value } = e.target;
    if (/^\d$/.test(value)) {
      if (index < inputRefs.current.length - 1) {
        inputRefs.current[index + 1].focus();
      }
    } else {
      e.target.value = value.slice(0, 1);
    }
    // Check if all inputs are filled
    const allFilled = inputRefs.current.every(
      (input) => input && input.value && input.value.length === 1
    );
    setIsOtpComplete(allFilled);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleOtp = () => {
    const otp = inputRefs.current.map((input) => input.value).join("");
    if (onSubmit) {
      onSubmit(otp);
    }
  };

  return (
    <>
      <h2
        className={`${
          titleClass || ""
        } self-start text-3xl font-medium tracking-tight text-[#2B3674] leading-[56px] mt-4`}
      >
        {title || ""}
      </h2>
      <p className={`${descClass || ""} text-sm font-normal text-black `}>
        {description || ""}
      </p>
      <div className="py-32 text-center">
        <img
          src={RegisterOtp}
          alt="RegisterOtp"
          className="size-[118px] m-auto"
        />
        <div className="flex flex-wrap gap-3 item-center justify-center mt-8">
          {[0, 1, 2, 3, 4, 5].map((_, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="number"
              maxLength={1}
              className="size-14 border border-[#EDEFF2] rounded-2xl text-center"
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>
        {/* Pass timer state to child component */}
        <div className="mt-7 text-blue text-3xl">
          {timeLeft ? formatTime(timeLeft) : "0:00"}
        </div>
        <p className="text-[#9CA3AF] text-sm font-normal mt-6">
          Didn’t receive code?{" "}
          <button
            type="button"
            onClick={sendOtp}
            disabled={timeLeft > 0}
            className="text-blue disabled:opacity-50 !font-bold inline-block disabled:cursor-not-allowed"
          >
            Resend Code
          </button>
        </p>
      </div>
      <Button
        type="button"
        title="Continue"
        loading={status}
        disabled={status || !isOtpComplete}
        onClick={handleOtp}
        btn="primary"
        className="w-full"
      />
    </>
  );
};

export default SendOtp;
