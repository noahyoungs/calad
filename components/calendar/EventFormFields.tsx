import React, { useState } from "react";
import {
  Input,
  Textarea,
  Checkbox,
  Card,
  Select,
  SelectItem,
  Chip,
  Button,
  Spacer,
} from "@heroui/react";
import { DateValue } from "@internationalized/date";
import DateTimeSelector from "./DateTimeSelector";
import NotificationTimeSelector from "./NotificationTimeSelector";
import { Icon } from "@iconify-icon/react";
import { FormMessage, Message } from "../form-message";

interface EventFormFieldsProps {
  summary: string;
  setSummary: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  isAllDayEvent: boolean;
  setIsAllDayEvent: (value: boolean) => void;
  startDate: DateValue | null;
  setStartDate: (value: DateValue | null) => void;
  endDate: DateValue | null;
  setEndDate: (value: DateValue | null) => void;
  startTimeZone: string;
  setStartTimeZone: (value: string) => void;
  endTimeZone: string;
  setEndTimeZone: (value: string) => void;
  addGoogleMeet: boolean;
  setAddGoogleMeet: (value: boolean) => void;
  attendees: string[];
  setAttendees: (value: string[]) => void;
  notificationMinutesBefore: number[];
  setNotificationMinutesBefore: (value: number[]) => void;
  recurrence: string;
  setRecurrence: (value: string) => void;
  disabled?: boolean;
}

// Recurrence options
const RECURRENCE_OPTIONS = [
  { value: "", label: "No recurrence" },
  { value: "RRULE:FREQ=DAILY", label: "Daily" },
  { value: "RRULE:FREQ=WEEKLY", label: "Weekly" },
  { value: "RRULE:FREQ=WEEKLY;BYDAY=MO", label: "Weekly on Monday" },
  { value: "RRULE:FREQ=WEEKLY;BYDAY=TU", label: "Weekly on Tuesday" },
  { value: "RRULE:FREQ=WEEKLY;BYDAY=WE", label: "Weekly on Wednesday" },
  { value: "RRULE:FREQ=WEEKLY;BYDAY=TH", label: "Weekly on Thursday" },
  { value: "RRULE:FREQ=WEEKLY;BYDAY=FR", label: "Weekly on Friday" },
  { value: "RRULE:FREQ=WEEKLY;BYDAY=SA", label: "Weekly on Saturday" },
  { value: "RRULE:FREQ=WEEKLY;BYDAY=SU", label: "Weekly on Sunday" },
  {
    value: "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    label: "Weekdays (Mon-Fri)",
  },
  { value: "RRULE:FREQ=WEEKLY;BYDAY=SA,SU", label: "Weekends (Sat-Sun)" },
  { value: "RRULE:FREQ=MONTHLY", label: "Monthly" },
  { value: "RRULE:FREQ=YEARLY", label: "Yearly" },
];

export default function EventFormFields({
  summary,
  setSummary,
  description,
  setDescription,
  location,
  setLocation,
  isAllDayEvent,
  setIsAllDayEvent,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  startTimeZone,
  setStartTimeZone,
  endTimeZone,
  setEndTimeZone,
  addGoogleMeet = false,
  setAddGoogleMeet = () => {},
  attendees = [],
  setAttendees = () => {},
  notificationMinutesBefore = [30],
  setNotificationMinutesBefore = () => {},
  recurrence = "",
  setRecurrence = () => {},
  disabled = false,
}: EventFormFieldsProps) {
  const handleAllDayToggle = (checked: boolean) => {
    console.log("Toggling all-day event to:", checked);
    setIsAllDayEvent(checked);
  };

  // Log the form data for debugging
  console.log("EventFormFields received props:", {
    summary: summary ? `"${summary}"` : "empty",
    description: description ? "has content" : "empty",
    location: location || "none",
    isAllDayEvent,
    notificationMinutesBefore: notificationMinutesBefore.length
      ? `[${notificationMinutesBefore.join(", ")}]`
      : "empty",
    recurrence: recurrence || "none",
  });

  // For recurrence, check if it's a predefined option or custom
  const isCustomRecurrence =
    recurrence &&
    !RECURRENCE_OPTIONS.some((option) => option.value === recurrence);

  // If it's a custom recurrence, add it to the options temporarily
  const extendedRecurrenceOptions = isCustomRecurrence
    ? [
        ...RECURRENCE_OPTIONS,
        { value: recurrence, label: `Custom: ${recurrence}` },
      ]
    : RECURRENCE_OPTIONS;

  const recurrenceSet = recurrence ? new Set([recurrence]) : new Set([]);

  console.log("Select component values:", {
    recurrenceSet: Array.from(recurrenceSet),
    isCustomRecurrence,
  });

  // State for new attendee email input
  const [newAttendeeEmail, setNewAttendeeEmail] = useState("");
  // Add state for email validation error message
  const [emailError, setEmailError] = useState<Message | null>(null);

  // Handle adding a new attendee
  const handleAddAttendee = () => {
    if (!newAttendeeEmail) return;

    // Clear any previous error
    setEmailError(null);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAttendeeEmail)) {
      // Display error message using FormMessage
      setEmailError({ error: "Invalid email address" });
      return;
    }

    if (!attendees.includes(newAttendeeEmail)) {
      setAttendees([...attendees, newAttendeeEmail]);
      setNewAttendeeEmail("");
    }
  };

  // Handle removing an attendee
  const handleRemoveAttendee = (email: string) => {
    setAttendees(attendees.filter((a) => a !== email));
  };

  // Handle key press in attendee input (add on Enter)
  const handleAttendeeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddAttendee();
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <label htmlFor="title">Event Title *</label>
        <Input
          id="title"
          placeholder="Add a title for your event"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          isDisabled={disabled}
          required
        />
      </div>
      <Spacer y={4} />
      <div className="flex flex-col">
        <label htmlFor="description">Description</label>
        <Textarea
          id="description"
          placeholder="Add event details"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          isDisabled={disabled}
          className=""
        />
      </div>
      <Spacer y={4} />
      <div className="flex flex-col">
        <label htmlFor="location">Location</label>
        <Input
          id="location"
          placeholder="Add location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          isDisabled={disabled}
        />
      </div>
      <Spacer y={4} />
      <div className="flex items-center">
        <Checkbox
          id="all-day"
          isSelected={isAllDayEvent}
          onValueChange={handleAllDayToggle}
          isDisabled={disabled}
        />
        <label htmlFor="all-day">All-day event</label>
      </div>
      <Spacer y={4} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col space-y-1">
          <label htmlFor="start-date">Start Date & Time *</label>
          <DateTimeSelector
            id="start-date"
            label="Start"
            date={startDate}
            onDateChange={setStartDate}
            timeZone={startTimeZone}
            onTimeZoneChange={setStartTimeZone}
            isAllDay={isAllDayEvent}
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label htmlFor="end-date">End Date & Time *</label>
          <DateTimeSelector
            id="end-date"
            label="End"
            date={endDate}
            onDateChange={setEndDate}
            timeZone={endTimeZone}
            onTimeZoneChange={setEndTimeZone}
            isAllDay={isAllDayEvent}
          />
        </div>
      </div>
      <Spacer y={4} />
      <div className="flex flex-col space-y-1">
        <label htmlFor="recurrence">Repeat</label>
        <Select
          id="recurrence"
          isDisabled={disabled}
          selectedKeys={recurrenceSet}
          onSelectionChange={(keys) => {
            // @ts-ignore - We know this will be a string
            const selectedValue = (Array.from(keys)[0] as string) || "";
            console.log(`Selected recurrence: ${selectedValue}`);
            setRecurrence(selectedValue);
          }}
        >
          {extendedRecurrenceOptions.map((option) => (
            <SelectItem key={option.value} textValue={option.label}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>
      <Spacer y={4} />
      <div className="flex flex-col space-y-1">
        <label htmlFor="notifications">Notifications</label>
        <NotificationTimeSelector
          notificationTimes={notificationMinutesBefore}
          onChange={setNotificationMinutesBefore}
          disabled={disabled}
        />
      </div>
      <Spacer y={4} />
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="google-meet"
            isSelected={addGoogleMeet}
            onValueChange={(checked) => setAddGoogleMeet(checked)}
            isDisabled={disabled}
          />
          <label htmlFor="google-meet">
            Add Google Meet video conferencing
          </label>
        </div>
      </div>
      <Spacer y={4} />
      <div className="flex flex-col space-y-2">
        <label>Attendees</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {attendees.map((email) => (
            <Chip
              key={email}
              onClose={() => handleRemoveAttendee(email)}
              isDisabled={disabled}
              variant="flat"
              color="primary"
              radius="sm"
            >
              {email}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add attendee (email)"
            value={newAttendeeEmail}
            onChange={(e) => setNewAttendeeEmail(e.target.value)}
            onKeyDown={handleAttendeeKeyPress}
            isDisabled={disabled}
            className="flex-1"
          />
          <Button
            color="primary"
            variant="flat"
            onPress={handleAddAttendee}
            isDisabled={disabled || !newAttendeeEmail}
            isIconOnly
          >
            <Icon icon="tabler:plus" className="" />
          </Button>
        </div>
        {emailError && (
          <div className="mt-2">
            <FormMessage message={emailError} />
          </div>
        )}
      </div>
    </div>
  );
}
