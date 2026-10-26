import React, { useEffect, useState } from "react";
import { DatePicker } from "@heroui/react";
import { 
  DateValue, 
  parseDate, 
  parseDateTime,
  getLocalTimeZone, 
  today,
  CalendarDateTime,
  CalendarDate,
  toCalendarDateTime,
  toCalendarDate
} from "@internationalized/date";
import TimeZoneSelector from "./TimeZoneSelector";

interface DateTimeSelectorProps {
  id: string;
  label: string;
  date: DateValue | null;
  onDateChange: (date: DateValue | null) => void;
  timeZone: string;
  onTimeZoneChange: (timeZone: string) => void;
  isAllDay: boolean;
  timeZoneHelpText?: string;
  minValue?: DateValue;
  variant?: "bordered" | "underlined";
}

const DateTimeSelector = React.memo(function DateTimeSelector({
  id,
  label,
  date,
  onDateChange,
  timeZone,
  onTimeZoneChange,
  isAllDay,
  timeZoneHelpText,
  minValue,
  variant,
}: DateTimeSelectorProps) {

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={`${id}-date`} className="block text-sm font-medium">
          {label}
        </label>
        <DatePicker
          id={`${id}-date`}
          value={date ? (isAllDay ? date : toCalendarDateTime(date)) : undefined}
          onChange={onDateChange}
          granularity={isAllDay ? "day" : "minute"}
          isRequired
          minValue={minValue}
          variant={variant}
        />
      </div>

      <TimeZoneSelector
        id={`${id}-timezone`}
        selectedTimeZone={timeZone}
        onTimeZoneChange={onTimeZoneChange}
        label={`${label} Time Zone`}
        helpText={timeZoneHelpText}
        variant={variant}
      />
    </div>
  );
});

export default DateTimeSelector; 