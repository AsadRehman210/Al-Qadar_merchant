"use client";
import { differenceInCalendarDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { toast } from "react-toastify";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (date: DateRange) => void;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: (date: Date) => boolean;
  numberOfMonths?: number;
  enableTime?: boolean;
  defaultFromTime?: string;
  defaultToTime?: string;
  maxSelectableDays?: number;
  maxSelectableDaysToastMessage?: string;
}

const toTimeString = (date?: Date) => {
  if (!date) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const applyTimeToDate = (date: Date, time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const nextDate = new Date(date);
  nextDate.setHours(
    Number.isFinite(hours) ? hours : 0,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0,
  );
  return nextDate;
};

const isSameDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const getMinutesFromTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const safeHours = Number.isFinite(hours) ? hours : 0;
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
  return safeHours * 60 + safeMinutes;
};

const clampToTimeAfterFrom = (fromTime: string, toTime: string) => {
  if (getMinutesFromTime(toTime) > getMinutesFromTime(fromTime)) {
    return toTime;
  }

  const fromMinutes = getMinutesFromTime(fromTime);
  if (fromMinutes >= 23 * 60 + 59) return "23:59";

  const nextMinutes = fromMinutes + 1;
  const hours = String(Math.floor(nextMinutes / 60)).padStart(2, "0");
  const minutes = String(nextMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getDayCount = (from: Date, to: Date) =>
  Math.abs(differenceInCalendarDays(to, from)) + 1;

const clampToSelectableDays = (
  range: DateRange,
  previousRange: DateRange,
  maxSelectableDays?: number,
) => {
  if (
    !maxSelectableDays ||
    maxSelectableDays < 1 ||
    !range.from ||
    !range.to ||
    getDayCount(range.from, range.to) <= maxSelectableDays
  ) {
    return { range, wasClamped: false };
  }

  const selectedDate =
    previousRange?.from && !isSameDay(previousRange.from, range.from)
      ? range.from
      : range.to;

  return {
    range: { from: selectedDate, to: selectedDate },
    wasClamped: true,
  };
};

export function DateRangePicker({
  value,
  onChange,
  className,
  minDate,
  maxDate,
  disabled,
  numberOfMonths = 2,
  enableTime = false,
  defaultFromTime = "00:00",
  defaultToTime = "23:59",
  maxSelectableDays,
  maxSelectableDaysToastMessage,
}: DateRangePickerProps) {
  const fromTime = toTimeString(value?.from) || defaultFromTime;
  const toTime = toTimeString(value?.to) || defaultToTime;

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange({ from: undefined, to: undefined });
      return;
    }

    const { range: limitedRange, wasClamped } = clampToSelectableDays(
      range,
      value,
      maxSelectableDays,
    );

    if (wasClamped) {
      toast.warning(
        maxSelectableDaysToastMessage ||
          `You can select up to ${maxSelectableDays} day${
            maxSelectableDays === 1 ? "" : "s"
          } at a time.`,
        {
          toastId: "date-range-max-selectable-days",
        },
      );
    }

    if (!enableTime) {
      onChange(limitedRange);
      return;
    }

    const nextFromTime = !wasClamped && value?.from
      ? toTimeString(value.from) || defaultFromTime
      : defaultFromTime;
    const rawNextToTime = value?.to
      ? toTimeString(value.to) || defaultToTime
      : defaultToTime;
    const nextToTime =
      limitedRange.from &&
      limitedRange.to &&
      isSameDay(limitedRange.from, limitedRange.to)
        ? clampToTimeAfterFrom(nextFromTime, rawNextToTime)
        : rawNextToTime;

    const nextFrom = limitedRange.from
      ? applyTimeToDate(limitedRange.from, nextFromTime)
      : undefined;
    const nextTo = limitedRange.to
      ? applyTimeToDate(limitedRange.to, nextToTime)
      : undefined;

    onChange({ from: nextFrom, to: nextTo });
  };

  const handleFromTimeChange = (time: string) => {
    if (!value?.from) return;
    const nextFrom = applyTimeToDate(value.from, time);
    let nextTo = value.to;

    if (value.to && isSameDay(value.from, value.to)) {
      const nextToTime = clampToTimeAfterFrom(
        time,
        toTimeString(value.to) || defaultToTime,
      );
      nextTo = applyTimeToDate(value.to, nextToTime);
    }

    onChange({
      ...value,
      from: nextFrom,
      to: nextTo,
    });
  };

  const handleToTimeChange = (time: string) => {
    if (!value?.to) return;
    let nextToTime = time;
    if (value.from && isSameDay(value.from, value.to)) {
      const fromTimeValue = toTimeString(value.from) || defaultFromTime;
      if (getMinutesFromTime(time) <= getMinutesFromTime(fromTimeValue)) {
        toast.warning("To time must be greater than from time.", {
          toastId: "date-range-invalid-to-time",
        });
      }
      nextToTime = clampToTimeAfterFrom(fromTimeValue, time);
    }
    onChange({
      ...value,
      to: applyTimeToDate(value.to, nextToTime),
    });
  };

  return (
    <div className={cn("", className)}>
      <Popover modal>
        <PopoverTrigger asChild>
          <Button
            id="date"
            data-testid="date-range-trigger"
            variant={"outline"}
            className={cn(
              "w-full min-w-0 h-auto py-2 gap-3 justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 whitespace-normal break-words leading-tight">
              {value?.from ? (
                value.to ? (
                  <>
                    {format(
                      value.from,
                      enableTime ? "LLL dd, y hh:mm a" : "LLL dd, y",
                    )}{" "}
                    -{" "}
                    {format(
                      value.to,
                      enableTime ? "LLL dd, y hh:mm a" : "LLL dd, y",
                    )}
                  </>
                ) : (
                  format(value.from, enableTime ? "LLL dd, y hh:mm a" : "LLL dd, y")
                )
              ) : (
                "Pick a date range"
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-y-auto p-0 overscroll-contain"
          align="start"
          style={{
            maxHeight:
              "min(var(--radix-popover-content-available-height, 80vh), calc(100vh - 2rem))",
          }}
        >
          <Calendar
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={handleDateSelect}
            numberOfMonths={numberOfMonths}
            minDate={minDate}
            maxDate={maxDate}
            disabled={disabled}
            required
          />
          {enableTime && (
            <div className="border-t p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  className="text-sm text-muted-foreground"
                  htmlFor="range-from-time"
                >
                  From time
                </label>
                <input
                  id="range-from-time"
                  type="time"
                  value={fromTime}
                  onChange={(e) => handleFromTimeChange(e.target.value)}
                  disabled={!value?.from}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label
                  className="text-sm text-muted-foreground"
                  htmlFor="range-to-time"
                >
                  To time
                </label>
                <input
                  id="range-to-time"
                  type="time"
                  value={toTime}
                  onChange={(e) => handleToTimeChange(e.target.value)}
                  disabled={!value?.to}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                />
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
