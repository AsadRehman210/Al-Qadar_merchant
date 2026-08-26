import moment from "moment";
import { useEffect, useRef, useState } from "react";
import DatePicker from "react-multi-date-picker";
import Calender from "images/icons/calender.png";
import "./index.css";
import Button from "components/Button";
import { useTranslation } from "react-i18next";

const MultiRangeDatepicker = ({
  selectedDateType,
  onChange,
  defaultDate,
  maxDate,
  minDate,
  hideCancelButton = false,
}) => {
  const { t } = useTranslation();
  const datePickerRef = useRef(null);
  const [date, setDate] = useState([]);
  const [formatDate, setFormatDate] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [tempDate, setTempDate] = useState([]);
  // const [tempFormatDate, setTempFormatDate] = useState("");

  const toggleDatePicker = () => {
    if (isOpen) {
      datePickerRef.current.closeCalendar();
    } else {
      datePickerRef.current.openCalendar();
    }
    setIsOpen(!isOpen);
  };

  const submitDate = () => {
    if (date.length === 2) {
      const startDate = moment(date[0]);
      const endDate = moment(date[1]);

      if (!validateRange(startDate, endDate, maxDate)) {
        return; // Don't submit if invalid range
      }

      setIsSubmitting(true);
      datePickerRef.current.closeCalendar();
      setIsOpen(!isOpen);
      onChange(formatDate);

      // Reset submitting flag after a short delay
      setTimeout(() => {
        setIsSubmitting(false);
      }, 100);
    }
  };

  const cancelDate = () => {
    datePickerRef.current.closeCalendar();
    setIsOpen(!isOpen);
    setDate([]);
    onChange("");
    setFormatDate("");
  };

  // Listen for calendar close (outside click)
  // useEffect(() => {
  //   function handleCalendarClose() {
  //     // If calendar is open and the calendar closes (not by submit/cancel), reset to last submitted
  //     if (!datePickerRef.current?.isOpen && isOpen) {
  //       setIsOpen(false);
  //       setTempDate(date); // Reset to last submitted date
  //       setTempFormatDate(formatDate);
  //       // Do not call onChange - keep the last submitted state
  //     }
  //   }
  //   document.addEventListener("mousedown", handleCalendarClose);
  //   return () => document.removeEventListener("mousedown", handleCalendarClose);
  // }, [isOpen, date, formatDate]);

  const validateRange = (startDate, endDate, maxDate) => {
    // Skip validation for type ID 6 to allow future dates
    if (selectedDateType?.id === 6) {
      return true;
    }

    let maxRange;
    let errorMessage = "";

    if (maxDate) {
      maxRange = moment(maxDate);
      errorMessage = t("booking:you_can_select_date_range_up_to", {
        date: maxRange.format("D MMM YYYY"),
      });
    } else {
      if (selectedDateType?.id === 1) {
        maxRange = moment(startDate).add(30, "days");
        errorMessage = t("booking:you_can_select_maximum_days", { days: 30 });
      } else if (selectedDateType?.id === 2) {
        maxRange = moment(startDate).add(8, "weeks");
        errorMessage = t("booking:you_can_select_maximum_weeks", { weeks: 8 });
      } else if (selectedDateType?.id === 3) {
        maxRange = moment(startDate).add(12, "months");
        errorMessage = t("booking:you_can_select_maximum_months", {
          months: 12,
        });
      } else if (selectedDateType?.id === 4) {
        maxRange = moment(startDate).add(6, "years");
        errorMessage = t("booking:you_can_select_maximum_years", { years: 6 });
      } else if (selectedDateType?.id === 5) {
        maxRange = null;
        errorMessage = "";
      }
    }

    if (endDate && maxRange && moment(endDate).isAfter(maxRange)) {
      alert(errorMessage);
      return false;
    }
    return true;
  };

  const handleDateChange = (dates) => {
    if (!dates || dates.length === 0) {
      // setDate([]);
      setFormatDate("");
      return;
    }

    let startDate = moment(dates[0].toDate());
    let endDate = dates.length === 2 ? moment(dates[1].toDate()) : null;

    // Adjust start and end dates for selected types
    if (selectedDateType?.id === 1) {
      endDate = startDate;
    } else if (selectedDateType?.id === 2) {
      startDate = moment(startDate).startOf("week");
      endDate = moment(startDate).endOf("week");
    } else if (selectedDateType?.id === 20) {
      // For 20 days, always select a 20-day range from the selected start date
      endDate = moment(startDate).add(19, "days");
    } else if (selectedDateType?.id === 6) {
      // For type 6, when single date selected, add 2 days (total 3-day range)
      endDate = moment(startDate).add(2, "days");

      if (!endDate) {
        endDate = moment(startDate).add(2, "days");
      }
      // Allow manual range selection (start and end dates) if user selects two dates
    } else if (selectedDateType?.id === 3) {
      startDate = moment(startDate).startOf("month");
      endDate = endDate ? moment(endDate).endOf("month") : null;
    } else if (selectedDateType?.id === 4) {
      // For yearly selection, adjust dates to start/end of year
      startDate = moment(startDate).startOf("year");
      if (endDate) {
        endDate = moment(endDate).endOf("year");
      }
    } else if (selectedDateType?.id === 30) {
      endDate = moment(startDate).add(29, "days");
    }

    const adjustedDates = [startDate.toDate()];
    if (endDate) adjustedDates.push(endDate.toDate());

    setDate(adjustedDates);

    const startFormatted = startDate.format("D MMM YYYY");
    const endFormatted = endDate ? endDate.format("D MMM YYYY") : null;

    const formattedRange =
      endFormatted && startFormatted !== endFormatted
        ? `${startFormatted} - ${endFormatted}`
        : startFormatted;

    setFormatDate(formattedRange);
  };

  useEffect(() => {
    // Don't update during submit to prevent blinking
    if (isSubmitting) return;

    if (defaultDate && defaultDate.length > 0) {
      const dates = defaultDate.map((date) =>
        date.toDate ? date.toDate() : new Date(date)
      );

      // Format the dates for display
      const startDate = moment(dates[0]);
      const endDate = dates.length === 2 ? moment(dates[1]) : null;
      const startFormatted = startDate.format("D MMM YYYY");
      const endFormatted = endDate ? endDate.format("D MMM YYYY") : null;
      const newFormattedRange =
        endFormatted && startFormatted !== endFormatted
          ? `${startFormatted} - ${endFormatted}`
          : startFormatted;

      setDate(dates);
      setFormatDate(newFormattedRange);
    } else if (defaultDate && defaultDate.length === 0) {
      // Reset the component when defaultDate is cleared
      setDate([]);
      setFormatDate("");
    }
  }, [selectedDateType, defaultDate, isSubmitting]);

  return (
    <div>
      <div className="relative">
        <div
          onClick={toggleDatePicker}
          className={`cursor-pointer text-sm relative h-[46px] flex items-center rounded-xl border border-[#E2E8F0] transition duration-300 hover:border-primary focus:border-primary pl-12 p-[8px_16px] w-full z-20 ${
            !formatDate ? "text-gray" : "text-[#64748B]"
          }`}
        >
          <img
            src={Calender}
            className="absolute left-3 top-1/2 transform -translate-y-1/2"
          />
          {formatDate ? (
            <span dir="ltr">{formatDate}</span>
          ) : (
            t("booking:select_date_range_placeholder")
          )}
        </div>
        <div className="[&_input]:opacity-0 !z-[9999] bottom-0 w-full absolute custom-range">
          <DatePicker
            ref={datePickerRef}
            range
            value={date}
            onChange={handleDateChange}
            onlyYearPicker={selectedDateType?.id === 4}
            onlyMonthPicker={selectedDateType?.id === 3}
            maxDate={maxDate ? new Date(maxDate) : undefined}
            minDate={minDate ? new Date(minDate) : undefined}
            plugins={[
              <CalenderHeader key="header" position="top" t={t} />,
              <CalenderFooter
                key="footer"
                cancelDate={cancelDate}
                submitDate={submitDate}
                position="bottom"
                hideCancelButton={hideCancelButton}
                t={t}
              />,
            ]}
          />
        </div>
      </div>
    </div>
  );
};

const CalenderHeader = ({ t }) => (
  <div className="px-4">
    <h3 className="py-4 text-left border-b border-[#F1F2F4] text-heading text-lg font-medium">
      {t("booking:set_date_range")}
    </h3>
  </div>
);

const CalenderFooter = ({ cancelDate, submitDate, hideCancelButton, t }) => (
  <div className="flex gap-3 justify-end p-4 pt-0">
    {!hideCancelButton && (
      <Button
        title={t("cancel")}
        onClick={cancelDate}
        className="text-[#C71C1C] border-[#C71C1C] !h-11 !w-auto px-6"
      />
    )}
    <Button
      onClick={submitDate}
      title={t("submit")}
      btn="primary"
      className="!h-11 !w-auto px-6"
    />
  </div>
);

export default MultiRangeDatepicker;
