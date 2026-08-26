import { useEffect, useRef, useState, createElement } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import Error from "images/icons/error.png";
import "./index.css";
import { useTranslation } from "react-i18next";
import moment from "moment-timezone";

const Datepicker = ({
  label,
  labelClass,
  required,
  errors,
  name,
  max,
  min,
  defaultValue,
  trigger,
  setValue,
  selected,
  setSelected,
  position,
  Icon,
  icon,
  register,
  disabled,
  isTime,
  className,
  isDefaultSelection = true,
  customError,
  setCustomError,
  minErrorMessage = "Drop-off must be at least 30 minutes later than pickup",
  // Which month the calendar opens on before anything is picked — e.g. pass
  // the same value as `max` so a DOB field opens near the most recent
  // allowed birth year instead of the current month (irrelevant for DOB).
  currentDate,
}) => {
  const calendarIcon = Icon ?? icon;
  const dateRef = useRef();
  const wrapperRef = useRef(); // Ref for click outside + input query
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [hasValidationError, setHasValidationError] = useState(false);
  const initialView = currentDate
    ? new DateObject(moment(currentDate, "DD-MM-YYYY hh:mm A").toDate())
    : undefined;
  // react-multi-date-picker silently pre-fills the visible text with
  // today's date the moment an empty (no min/max-rejected) field opens —
  // React's own `selected` state never changes, so a user typing into what
  // looks like an empty field actually has their keystrokes appended after
  // that stray "today" text (e.g. "12-07-202601-06-2015" instead of
  // "01-06-2015"). Flagged on open, consumed on the first real keystroke.
  const needsClearRef = useRef(false);

  // ✅ Attach restriction to the real DatePicker input
  useEffect(() => {
    const inputEl = wrapperRef.current?.querySelector(".custom-date-input");
    if (!inputEl) return;

    const handleKeyDown = (e) => {
      const allowedKeys = [
        "Backspace",
        "Tab",
        "ArrowLeft",
        "ArrowRight",
        "Delete",
      ];

      // Define allowed characters based on isTime prop
      let allowedChars;
      if (isTime) {
        // For time picker: allow numbers, dashes, A, M, P, colon, and space
        allowedChars = /[0-9-AMP: ]/;
      } else {
        // For date picker: allow only numbers and dashes
        allowedChars = /[0-9-]/;
      }

      if (needsClearRef.current && allowedChars.test(e.key)) {
        inputEl.value = "";
        needsClearRef.current = false;
      }

      if (!allowedChars.test(e.key) && !allowedKeys.includes(e.key)) {
        e.preventDefault();
      }
    };

    inputEl.addEventListener("keydown", handleKeyDown);
    return () => {
      inputEl.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTime]);

  // Set default value on mount or when defaultValue changes
  useEffect(() => {
    if (!selected && defaultValue && isDefaultSelection) {
      setSelected(defaultValue);
    }
  }, [defaultValue, selected, setSelected, isDefaultSelection]);

  // Update form value when selected changes
  useEffect(() => {
    if (selected && setValue && trigger) {
      setValue(name, selected);
      trigger(name);
    }
  }, [selected, setValue, trigger, name]);

  // Reset validation error state when custom error is cleared
  useEffect(() => {
    if (!customError && hasValidationError) {
      setHasValidationError(false);
    }
  }, [customError, hasValidationError]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        dateRef.current?.closeCalendar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle date selection
  // const changeDate = (val) => {
  //   if (!val) {
  //     setSelected(null); // Clear selected date
  //     return;
  //   }
  //   let formattedDate;

  //   if (!selected && defaultValue && !isDefaultSelection) {
  //     formattedDate = defaultValue;
  //   } else {
  //     // Normal flow → use picked date
  //     if (isTime)
  //       formattedDate = moment(val.toDate()).format("DD-MM-YYYY hh:mm A");
  //     else formattedDate = moment(val.toDate()).format("DD-MM-YYYY");
  //   }
  //   setSelected(formattedDate);
  // };

  const changeDate = (val) => {
    if (!val) {
      setSelected(null);
      if (setCustomError) {
        setCustomError(null);
      }
      return null;
    }

    let pickedDate = moment(val.toDate());
    let minDate = min ? moment(min, "DD-MM-YYYY hh:mm A") : null;

    // Agar first time aur isDefaultSelection = false hai → defaultValue set karo
    if (!selected && defaultValue && !isDefaultSelection) {
      setSelected(defaultValue);
      if (setCustomError) {
        setCustomError(null);
      }
      return defaultValue;
    }

    // Check if picked date/time is before minimum date/time
    if (minDate && pickedDate.isBefore(minDate)) {
      // If selected date/time is before minimum, show error and set to null
      setSelected(null);
      setHasValidationError(true);
      if (setCustomError) {
        setCustomError(minErrorMessage);
      }
      return null;
    }

    // Clear any custom error if validation passes
    if (setCustomError) {
      setCustomError(null);
    }

    // Normal flow → picked date set karo
    let formattedDate = isTime
      ? pickedDate.format("DD-MM-YYYY hh:mm A")
      : pickedDate.format("DD-MM-YYYY");

    setSelected(formattedDate);
    return formattedDate;
  };

  const changeDefaultDate = () => {
    // Don't set any default value if there's a custom error or validation error
    if (customError || hasValidationError) {
      return;
    }

    if (!selected && defaultValue) {
      let minDate = min ? moment(min, "DD-MM-YYYY hh:mm A") : null;
      let defaultDate = moment(defaultValue, "DD-MM-YYYY hh:mm A");

      // Check if default value is before minimum date
      if (minDate && defaultDate.isBefore(minDate)) {
        setSelected(min);
      } else {
        setSelected(defaultValue);
      }
    } else if (!selected && isTime) {
      // If no default value and time picker is enabled, set current time
      const currentTime = moment().format("DD-MM-YYYY hh:mm A");
      setSelected(currentTime);
    } else if (!selected) {
      // Flag the stray "today" autofill (see needsClearRef above) to be
      // wiped the moment the user actually starts typing.
      needsClearRef.current = true;
    }
  };

  // Ensure DatePicker always receives a Date object instead of formatted string
  const pickerValue = selected
    ? moment(selected, isTime ? "DD-MM-YYYY hh:mm A" : "DD-MM-YYYY").toDate()
    : null;

  return (
    <div ref={wrapperRef} className="relative">
      {label ? (
        <label
          className={`text-sm text-linkText font-medium leading-6 mb-1 block ${
            labelClass || ""
          }`}
        >
          {label} <span className="text-[#EC1212]">{required ? "*" : ""}</span>
        </label>
      ) : null}
      <div
        className={`relative [&_.rmdp-time-picker]:[&_input]:!w-16 [&_input]:!h-[46px] [&_input]:disabled:cursor-not-allowed [&_input]:bg-white [&_>div]:w-full [&_input]:!rounded-lg [&_input]:!shadow-none [&_input]:!border [&_input]:!border-[#E0E5F2] [&_input]:text-sm [&_input]:!p-[8px_16px] [&_input]:w-full [&_input]:text-black [&_input]:placeholder:text-gray ${className} ${isRTL ? "datepicker-rtl" : ""}`}
      >
        <DatePicker
          value={pickerValue}
          name={name}
          // minDate={min}
          maxDate={max}
          currentDate={!pickerValue && initialView ? initialView : undefined}
          format={`${isTime ? "DD-MM-YYYY hh:mm A" : "DD-MM-YYYY"}`}
          placeholder={t("select_here")}
          onOpen={changeDefaultDate}
          onChange={changeDate}
          mapDays={({ date }) => {
            if (
              min &&
              moment(date.toDate()).isBefore(
                moment(min, "DD-MM-YYYY hh:mm A"),
                "day"
              )
            ) {
              return {
                disabled: true,
                style: { color: "#ccc" }, // grey out
              };
            }
          }}
          ref={dateRef}
          disabled={disabled}
          inputClass="custom-date-input" // 🔹 class for input targeting
          plugins={
            isTime && [
              <TimePicker
                key="time-picker"
                position="bottom"
                hideSeconds
                format="hh:mm A"
              />,
            ]
          }
        />

        {name ? (
          <input
            value={selected || ""}
            {...register(name, { required })}
            type="hidden"
          />
        ) : null}

        {calendarIcon ? (
          <div
            className={`absolute !w-auto top-1/2 transform -translate-y-1/2 pointer-events-none ${
              position === "right" ? "ltr:right-3 rtl:left-3" : "ltr:left-3 rtl:right-3"
            }`}
          >
            {typeof calendarIcon === "string" ? (
              <img
                src={calendarIcon}
                alt=""
                className="h-4 w-4 object-contain"
              />
            ) : (
              createElement(calendarIcon)
            )}
          </div>
        ) : null}
      </div>

      {(errors[name] || customError) && (
        <p className="text-red text-xs flex items-center gap-2 mt-1 font-medium">
          <img src={Error} className="" />
          {customError || errors[name].message}
        </p>
      )}
    </div>
  );
};

export default Datepicker;
