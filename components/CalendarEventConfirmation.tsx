import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Form,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { DateValue, parseDate, parseDateTime } from "@internationalized/date";
import { CalendarEvent } from "../utils/calendarTypes";
import { dateValueToISOString, dateValueToDateString } from "../utils/dateUtils";
import EventFormFields from "./calendar/EventFormFields";
import { formatRecurrence, formatEventSummary as formatEventSummaryUtil } from "@/utils/calendar/event-confirmation-utils";

/*
 * Calendar Event Confirmation Component
 * 
 * This component provides a form for creating and editing calendar events.
 * 
 * Time Zone Implementation:
 * - Uses the IANA Time Zone Database format (e.g., "America/New_York")
 * - Gets all available time zones using the Intl.supportedValuesOf API when available
 * - Falls back to a comprehensive list of common time zones
 * - Groups time zones by region (Africa, America, Asia, etc.) for better organization
 * - Displays time zones with their full names and UTC offsets for better readability
 * - Validates selected time zones against the available options
 */

interface CalendarEventConfirmationProps {
  toolName: "createCalendarEvent" | "createAllDayEvent";
  args?: {
    summary?: string;
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    startDateTime?: string;
    endDateTime?: string;
    startTimeZone?: string;
    endTimeZone?: string;
    addGoogleMeet?: boolean;
    attendees?: string[];
    notificationMinutesBefore?: number[];
    recurrence?: string;
  };
  onConfirm?: (updatedEvent: CalendarEvent) => Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
  showButtons?: boolean;
  processing?: boolean;
}

export default function CalendarEventConfirmation({
  toolName,
  args = {},
  onConfirm,
  onCancel,
  disabled = false,
  showButtons = true,
  processing = false,
}: CalendarEventConfirmationProps) {
  
  // Log the args object to debug only when not disabled
  useEffect(() => {
    if (!disabled) {
      console.log('Calendar args received:', args);
      console.log('Has date properties:', {
        startDate: Boolean(args.startDate),
        endDate: Boolean(args.endDate),
        startDateTime: Boolean(args.startDateTime),
        endDateTime: Boolean(args.endDateTime)
      });
      console.log('Advanced properties:', {
        addGoogleMeet: Boolean(args.addGoogleMeet),
        attendees: args.attendees ? `${args.attendees.length} attendees` : 'none',
        notifications: args.notificationMinutesBefore 
          ? `[${args.notificationMinutesBefore.join(', ')}]` 
          : 'default',
        recurrence: args.recurrence || 'none'
      });
    }
  }, [args, disabled]);
  
  // Determine if this is an all-day event based on the tool name
  const [isAllDayEvent, setIsAllDayEvent] = useState(() => {
    const isAllDay = toolName === "createAllDayEvent";
    if (!disabled) {
      console.log('Setting isAllDayEvent to:', isAllDay, 'based on toolName:', toolName);
    }
    return isAllDay;
  });

  // Parse start and end dates/times and ensure they have the correct granularity
  // based on whether this is an all-day event or not
  const parseWithCorrectGranularity = (dateStr: string | undefined, isAllDay: boolean): DateValue | null => {
    if (!dateStr) return null;
    
    try {
      // Strip out any timezone offset (e.g. +00:00, -05:30) from the string
      const cleanDateStr = dateStr.replace(/([+-]\d{2}:?\d{2})?Z?$/, '');
      
      if (isAllDay) {
        // For all-day events, only use the date part
        const dateOnly = cleanDateStr.split('T')[0];
        return parseDate(dateOnly);
      } else if (cleanDateStr.includes('T')) {
        // For time-specific events with a time component
        return parseDateTime(cleanDateStr);
      } else {
        // For date strings that need to be converted to time-specific
        // Add a default time (noon) to avoid timezone issues
        return parseDateTime(`${cleanDateStr}T12:00:00`);
      }
    } catch (e) {
      // Removed disabled check to prevent dependency on props in this function
      return null;
    }
  };
  
  // Initialize date values only once on component mount or when args change significantly
  const [startDateValue, setStartDateValue] = useState<DateValue | null>(null);
  const [endDateValue, setEndDateValue] = useState<DateValue | null>(null);
  
  useEffect(() => {

    
    const newStartDateValue = isAllDayEvent
      ? parseWithCorrectGranularity(args.startDate, true)
      : parseWithCorrectGranularity(args.startDateTime, false);
      
    const newEndDateValue = isAllDayEvent
      ? parseWithCorrectGranularity(args.endDate, true)
      : parseWithCorrectGranularity(args.endDateTime, false);
    
    setStartDateValue(newStartDateValue);
    setEndDateValue(newEndDateValue);
    
    // Only log when not disabled to prevent unnecessary renders
    if (!disabled) {
      console.log('Parsed date values with correct granularity:', {
        startDateValue: newStartDateValue ? newStartDateValue.toString() : null,
        endDateValue: newEndDateValue ? newEndDateValue.toString() : null,
        isAllDayEvent
      });
    }
  }, [args.startDate, args.endDate, args.startDateTime, args.endDateTime, isAllDayEvent]);

  // State for form fields - handle undefined values gracefully
  const [summary, setSummary] = useState(args.summary || "");
  const [description, setDescription] = useState(args.description || "");
  const [location, setLocation] = useState(args.location || "");
  const [formStartDate, setFormStartDate] = useState<DateValue | null>(startDateValue);
  const [formEndDate, setFormEndDate] = useState<DateValue | null>(endDateValue);
  const [startTimeZone, setStartTimeZone] = useState(args.startTimeZone || "");
  const [endTimeZone, setEndTimeZone] = useState(args.endTimeZone || "");
  const [addGoogleMeet, setAddGoogleMeet] = useState(args.addGoogleMeet || false);
  const [attendees, setAttendees] = useState<string[]>(args.attendees || []);
  const [notificationMinutesBefore, setNotificationMinutesBefore] = useState<number[]>(() => {
    if (Array.isArray(args.notificationMinutesBefore) && args.notificationMinutesBefore.length > 0) {
      return args.notificationMinutesBefore;
    }
    return [];
  });
  const [recurrence, setRecurrence] = useState(() => {
    if (args.recurrence && typeof args.recurrence === 'string' && args.recurrence.trim().length > 0) {
      return args.recurrence;
    }
    return "";
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form fields when args changes
  useEffect(() => {
    if (disabled) return; // Skip updates when disabled to prevent infinite loops
    
    setSummary(args.summary || "");
    setDescription(args.description || "");
    setLocation(args.location || "");
    setStartTimeZone(args.startTimeZone || "");
    setEndTimeZone(args.endTimeZone || "");
    setAddGoogleMeet(args.addGoogleMeet || false);
    setAttendees(args.attendees || []);
    
    if (Array.isArray(args.notificationMinutesBefore) && args.notificationMinutesBefore.length > 0) {
      setNotificationMinutesBefore(args.notificationMinutesBefore);
    } else {
      setNotificationMinutesBefore([]);
    }
    
    if (args.recurrence && typeof args.recurrence === 'string' && args.recurrence.trim().length > 0) {
      setRecurrence(args.recurrence);
    } else {
      setRecurrence("");
    }

    // Update date values based on startDateValue and endDateValue
    if (startDateValue) setFormStartDate(startDateValue);
    if (endDateValue) setFormEndDate(endDateValue);
  }, [args, disabled, startDateValue, endDateValue]);

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    // If an event is provided, prevent default behavior
    e?.preventDefault();
    
    if (disabled) return; // Prevent submission while disabled

    // Validate required fields
    if (!summary.trim()) {
      console.error("Event title is required");
      return;
    }

    if (!formStartDate || !formEndDate) {
      console.error("Start and end dates are required");
      return;
    }

    setIsSubmitting(true);

    // Create updated event object
    const updatedEvent: CalendarEvent = {
      summary: summary.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      start: {},
      end: {},
    };

    if (isAllDayEvent) {
      // Format dates for all-day event
      updatedEvent.start.date = dateValueToDateString(formStartDate);
      updatedEvent.start.timeZone = startTimeZone.trim() || undefined;
      updatedEvent.end.date = dateValueToDateString(formEndDate);
      updatedEvent.end.timeZone = endTimeZone.trim() || startTimeZone.trim() || undefined;
    } else {
      // Format date and time for regular event
      updatedEvent.start.dateTime = dateValueToISOString(formStartDate, startTimeZone.trim() || undefined);
      updatedEvent.start.timeZone = startTimeZone.trim() || undefined;
      updatedEvent.end.dateTime = dateValueToISOString(formEndDate, endTimeZone.trim() || startTimeZone.trim() || undefined);
      updatedEvent.end.timeZone = endTimeZone.trim() || startTimeZone.trim() || undefined;
    }

    // Add Google Meet conferencing if enabled
    if (addGoogleMeet) {
      updatedEvent.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet"
          }
        }
      };
    }

    // Add attendees if any are specified
    if (attendees.length > 0) {
      updatedEvent.attendees = attendees.map(email => ({ email }));
    }

    // Add reminders if specified
    if (notificationMinutesBefore.length > 0) {
      updatedEvent.reminders = {
        useDefault: false,
        overrides: notificationMinutesBefore.map(minutes => ({
          method: "popup",
          minutes
        }))
      };
    } else {

    }

    // Add recurrence if specified
    if (recurrence) {
      updatedEvent.recurrence = [recurrence];
    }

    try {
      await onConfirm?.(updatedEvent);
    } catch (error) {
      console.error("Error submitting calendar event:", error);
      // Don't reset isSubmitting - we want it to stay true forever
    }
  };

  // Memoize the Card component to prevent unnecessary re-renders
  const cardOpacityClass = disabled ? 'opacity-70' : '';

  // State to control the modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format the event summary for the preview card using the utility function
  const eventSummaryForPreview = useMemo(() => {
    if (!summary && !formStartDate) {
        // If summary and start date are not yet available from props or state, show loading.
        // This check helps prevent trying to format with incomplete initial data.
        return "Event details loading...";
    }

    const eventForSummary: any = {
      summary: summary || "(No title)", // Provide a fallback for summary
      start: {},
      end: {},
    };

    if (isAllDayEvent) {
      if (formStartDate) eventForSummary.start.date = dateValueToDateString(formStartDate);
      // For all-day events, end.date from the form is exclusive. The util expects this.
      if (formEndDate) eventForSummary.end.date = dateValueToDateString(formEndDate);
      if (startTimeZone) eventForSummary.start.timeZone = startTimeZone;
      // Google Calendar API doesn't typically use end.timeZone for all-day events, 
      // but if provided and different, our util *could* show it. Let's stick to start.timeZone for all-day.
    } else {
      if (formStartDate) eventForSummary.start.dateTime = dateValueToISOString(formStartDate, startTimeZone || undefined);
      if (formEndDate) eventForSummary.end.dateTime = dateValueToISOString(formEndDate, endTimeZone || startTimeZone || undefined);
      if (startTimeZone) eventForSummary.start.timeZone = startTimeZone;
      if (endTimeZone || startTimeZone) eventForSummary.end.timeZone = endTimeZone || startTimeZone || undefined;
    }

    console.log('eventForSummary', eventForSummary);
    
    // If formStartDate is null (e.g. initially), but summary exists, pass at least summary.
    // The util handles missing start/end gracefully.
    if (!formStartDate) {
        if (summary) return `${summary} — Date not set`;
        return "Event details loading..."; // Fallback if even summary is missing
    }

    return formatEventSummaryUtil(eventForSummary);
  }, [summary, formStartDate, formEndDate, isAllDayEvent, startTimeZone, endTimeZone]);

  // Handle direct submission from the preview card
  const handleDirectSubmit = () => {
    if (disabled) return;
    handleSubmit(); // Call handleSubmit without an event
  };

  return (
    <div className="relative">
      {/* Spinner overlay when disabled */}
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-70 z-10 rounded-lg">
          <Spinner size="lg" color="primary" />
        </div>
      )}
      
      {/* Summary Preview Card */}
      <Card className={`mb-4 p-2 ${cardOpacityClass}`} shadow="sm">
        <CardHeader className="pb-0">
          <h3 className="text-lg font-medium">
            {disabled ? "Generating Calendar Event..." : "New Calendar Event"}
          </h3>
        </CardHeader>
        <CardBody className="py-4 ph-no-capture">
          <p className="text-md">{eventSummaryForPreview}</p>
          {recurrence && (
            <p className="text-base text-foreground/70 mt-1">🔄 {formatRecurrence(recurrence)}</p>
          )}
          {location && <p className="text-base text-foreground/70 mt-1">📍 {location}</p>}
          {description && <p className="text-base text-foreground/70 mt-1">📝 {description}</p>}
          {attendees && attendees.length > 0 && (
            <p className="text-base text-foreground/70 mt-1">
              👥 {attendees.length} {attendees.length === 1 ? 'attendee' : 'attendees'}: {attendees.join(', ')}
            </p>
          )}
          {addGoogleMeet && (
            <p className="text-base text-foreground/70 mt-1">🧑‍💻 Google Meet will be added</p>
          )}
          {notificationMinutesBefore && notificationMinutesBefore.length > 0 && (
            <p className="text-base text-foreground/70 mt-1">
              🔔 Notifications: {notificationMinutesBefore.map(min => 
                min >= 60 ? `${Math.floor(min / 60)} hour${Math.floor(min / 60) !== 1 ? 's' : ''}` : `${min} minute${min !== 1 ? 's' : ''}`
              ).join(', ')} before
            </p>
          )}
        </CardBody>
        {showButtons && (
          <CardFooter className="flex justify-end gap-2">
            <Button
              onPress={onCancel}
              variant="light"
              color="danger"
              type="button"
              isDisabled={isSubmitting || disabled}
            >
              Cancel
            </Button>
            <Button
              onPress={() => setIsModalOpen(true)}
              variant="flat"
              className="!text-foreground"
              isDisabled={disabled}
            >
              Edit Details
            </Button>
            <Button 
              onPress={handleDirectSubmit}
              color="primary" 
              isLoading={isSubmitting}
              isDisabled={disabled}
              className="!text-white"
            >
              Add to Calendar
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {/* Modal with Form */}
      <Modal 
        isOpen={isModalOpen} 
        onOpenChange={(open) => {
          // Only allow closing the modal when disabled, not opening
          if (disabled && open) return;
          setIsModalOpen(open);
        }}
        size="xl"
        scrollBehavior="outside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Edit Calendar Event
              </ModalHeader>
              <Form onSubmit={(e) => {
                handleSubmit(e);
                onClose();
              }}>
                <ModalBody>
                  <EventFormFields
                    summary={summary}
                    setSummary={setSummary}
                    description={description}
                    setDescription={setDescription}
                    location={location}
                    setLocation={setLocation}
                    isAllDayEvent={isAllDayEvent}
                    setIsAllDayEvent={setIsAllDayEvent}
                    startDate={formStartDate}
                    setStartDate={setFormStartDate}
                    endDate={formEndDate}
                    setEndDate={setFormEndDate}
                    startTimeZone={startTimeZone}
                    setStartTimeZone={setStartTimeZone}
                    endTimeZone={endTimeZone}
                    setEndTimeZone={setEndTimeZone}
                    addGoogleMeet={addGoogleMeet}
                    setAddGoogleMeet={setAddGoogleMeet}
                    attendees={attendees}
                    setAttendees={setAttendees}
                    notificationMinutesBefore={notificationMinutesBefore}
                    setNotificationMinutesBefore={setNotificationMinutesBefore}
                    recurrence={recurrence}
                    setRecurrence={setRecurrence}
                    disabled={disabled}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant="light"
                    color="danger"
                    onPress={onClose}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    color="primary"
                    isDisabled={disabled}
                    className="!text-white"
                  >
                    Add to Calendar
                  </Button>
                </ModalFooter>
              </Form>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
