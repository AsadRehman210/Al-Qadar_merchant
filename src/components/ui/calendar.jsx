import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// minDate/maxDate are a convenience this wrapper adds on top of react-day-picker's
// own `disabled` matcher — the pasted DateRangePicker passes both.
function Calendar({ className, classNames, minDate, maxDate, disabled, ...props }) {
  const disabledMatchers = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
    ...(disabled ? [disabled] : []),
  ];

  return (
    <DayPicker
      showOutsideDays
      disabled={disabledMatchers.length ? disabledMatchers : undefined}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-3",
        month_caption: "flex justify-center items-center h-9 font-medium text-sm text-slate-900",
        nav: "flex items-center justify-between absolute inset-x-1 top-1",
        button_previous: "h-7 w-7 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100",
        button_next: "h-7 w-7 inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100",
        weekdays: "flex",
        weekday: "w-9 text-center text-xs font-medium text-slate-500",
        week: "flex w-full mt-1",
        day: "h-9 w-9 text-center text-sm p-0 relative",
        day_button: "h-9 w-9 rounded-md text-sm hover:bg-teal-50 aria-selected:opacity-100",
        selected: "bg-teal-500 text-white hover:bg-teal-500 hover:text-white",
        today: "font-semibold text-teal-600",
        outside: "text-slate-300",
        disabled: "text-slate-300 opacity-50",
        range_start: "rounded-l-md bg-teal-500 text-white",
        range_end: "rounded-r-md bg-teal-500 text-white",
        range_middle: "bg-teal-100 text-teal-900 rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...rest }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" {...rest} />
          ) : (
            <ChevronRight className="h-4 w-4" {...rest} />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
