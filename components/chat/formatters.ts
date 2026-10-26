import { format, parseISO } from "date-fns";


/**
 * Helper function to format calendar event date/time
 */
export const formatEventDateTime = (dateStr: string) => {
  try {
    const date = parseISO(dateStr);
    return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
  } catch (error) {
    return dateStr; // Fallback to original string if parsing fails
  }
};


/**
 * Prepares the changes array for the ModifyEventConfirmation component
 */
export const prepareModificationChanges = (args: any) => {

  console.log('Preparing modification changes for args:', JSON.stringify(args, null, 2));
  const changes = [];

  if (args.summary) changes.push({ field: "summary", newValue: args.summary });
  if (args.description)
    changes.push({ field: "description", newValue: args.description });
  if (args.location)
    changes.push({ field: "location", newValue: args.location });

  // Handle date/time fields
  if (args.startDateTime)
    changes.push({
      field: "start date/time",
      newValue: args.startDateTime,
    });
  if (args.endDateTime)
    changes.push({
      field: "end date/time",
      newValue: args.endDateTime,
    });
  if (args.startDate)
    changes.push({ field: "start date", newValue: args.startDate });
  if (args.endDate) changes.push({ field: "end date", newValue: args.endDate });

  // Handle time zones
  if (args.startTimeZone)
    changes.push({ field: "start time zone", newValue: args.startTimeZone });
  if (args.endTimeZone)
    changes.push({ field: "end time zone", newValue: args.endTimeZone });

  // Handle other fields
  if (args.addGoogleMeet !== undefined)
    changes.push({ field: "add Google Meet", newValue: args.addGoogleMeet });
  if (args.attendees && args.attendees.length > 0) {
    changes.push({ field: "attendees", newValue: args.attendees.join(", ") });
  } else if (args.attendees) {
    changes.push({ field: "attendees", newValue: "No attendees" });
  }
  if (
    args.notificationMinutesBefore &&
    args.notificationMinutesBefore.length > 0
  ) {
    changes.push({
      field: "notifications",
      newValue:
        args.notificationMinutesBefore
          .map((min: number) => {
            if (min >= 1440) return `${min / 1440} day(s)`;
            if (min >= 60) return `${min / 60} hour(s)`;
            return `${min} minute(s)`;
          })
          .join(", ") + " before",
    });
  } else if (args.notificationMinutesBefore) {
    changes.push({ field: "notifications", newValue: "No notifications" });
  }
  if (typeof args.recurrence === "string")
    changes.push({ field: "recurrence", newValue: args.recurrence });

  return changes;
};
