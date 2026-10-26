import { z } from 'zod';
import { timeZoneSchemaEnum, timeZoneSchemaUnvalidated } from '@/utils/timeZoneUtils';

// Define a function to create the schemas with default timezone
export function createEmailSchemas(defaultTimeZone: string) {

  // Create separate schemas for timed and all-day events
  const timedEventSchema = z.object({
    summary: z.string().describe("The title of the event"),
    description: z.string().optional().describe("The description of the event"),
    location: z.string().optional().describe("The location of the event"),
    
    // For timed events
    startDateTime: z.string().describe("The start date and time of the event in ISO format"),
    endDateTime: z.string().describe("The end date and time of the event in ISO format"),
    
    // Time zones
    startTimeZone: timeZoneSchemaEnum.optional().default(defaultTimeZone).describe("The timezone for the start time. Must be a valid IANA time zone like America/New_York"),
    endTimeZone: timeZoneSchemaEnum.optional().default(defaultTimeZone).describe("The timezone for the end time. Must be a valid IANA time zone like America/New_York"),
    
    // Common optional fields
    addGoogleMeet: z.boolean().optional().describe("Whether to add Google Meet video conferencing"),
    attendees: z.array(z.string()).optional().describe("List of email addresses to invite. Set to an empty array to remove all attendees."),
    notificationMinutesBefore: z.array(z.number()).describe("When to send notifications before the event, in minutes (e.g. [10, 60, 1440] for 10 minutes, 1 hour, and 1 day before. Set to an empty array to disable notifications.)").optional(),
    recurrence: z.string().describe(`Recurrence pattern in RFC 5545 format (e.g. "RRULE:FREQ=DAILY;COUNT=5" for daily for 5 occurrences, "RRULE:FREQ=WEEKLY;UNTIL=20240630T000000Z;BYDAY=MO,WE,FR" for MWF until June 30, 2024, "RRULE:FREQ=MONTHLY;BYMONTHDAY=10" for monthly on the 10th day). Set to an empty string to remove the recurrence.`).optional(),
  })

  const allDayEventSchema = z.object({
    summary: z.string().describe("The title of the event"),
    description: z.string().optional().describe("The description of the event"),
    location: z.string().optional().describe("The location of the event"),
    
    // For all-day events
    startDate: z.string().describe("The start date of the event in YYYY-MM-DD format"),
    endDate: z.string().describe("The end date of the event in YYYY-MM-DD format"),
    
    // Time zones
    startTimeZone: timeZoneSchemaEnum.optional().default(defaultTimeZone).describe("The timezone for the start time. Must be a valid IANA time zone like America/New_York"),
    endTimeZone: timeZoneSchemaEnum.optional().default(defaultTimeZone).describe("The timezone for the start time. Must be a valid IANA time zone like America/New_York"),
    
    // Common optional fields
    addGoogleMeet: z.boolean().optional().describe("Whether to add Google Meet video conferencing"),
    attendees: z.array(z.string()).optional().describe("List of email addresses to invite"),
    notificationMinutesBefore: z.array(z.number()).describe("When to send notifications before the event, in minutes (e.g. [10, 60, 1440] for 10 minutes, 1 hour, and 1 day before)").optional(),
    recurrence: z.string().describe(`Recurrence pattern in RFC 5545 format (e.g. "RRULE:FREQ=DAILY;COUNT=5" for daily for 5 occurrences, "RRULE:FREQ=WEEKLY;UNTIL=20240630T000000Z;BYDAY=MO,WE,FR" for MWF until June 30, 2024, "RRULE:FREQ=MONTHLY;BYMONTHDAY=10" for monthly on the 10th day)`).optional(),
  })

  const emailReplySchema = z.object({
    subject: z.string().describe("The subject of the email, in plain text"),
    body: z.string().describe("The body of the email, in markdown"),
  });

  const timeZoneConversionSchema = z.object({
    dateTime: z.string().describe("The date and time to convert. Can be a time only (e.g., '3:00 PM', '15:00') or a full date and time (e.g., '2023-11-25T15:30:00'). If only a time is provided, today's date will be used."),
    fromTimeZone: timeZoneSchemaUnvalidated.optional().default(defaultTimeZone).describe("The source time zone in IANA format (e.g., 'America/New_York')"),
    toTimeZone: timeZoneSchemaUnvalidated.optional().default(defaultTimeZone).describe("The target time zone in IANA format (e.g., 'Asia/Tokyo')"),
  });

  const listCalendarEventsSchema = z.object({
    timeMin: z.string().describe("The start time of the range to search for events in ISO format (e.g. '2023-11-25T00:00:00Z')"),
    timeMax: z.string().describe("The end time of the range to search for events in ISO format (e.g. '2023-11-26T23:59:59Z')"),
    timeZone: timeZoneSchemaUnvalidated.optional().default(defaultTimeZone).describe("The time zone to use for the search"),
  });

  const searchCalendarEventsSchema = z.object({
    query: z.string().describe("Free text search terms to find events that match these terms in summary, description, location, attendee names/emails, etc."),
    timeMin: z.string().optional().describe("Optional: The start time of the range to search for events in ISO format (e.g. '2023-11-25T00:00:00Z')"),
    timeMax: z.string().optional().describe("Optional: The end time of the range to search for events in ISO format (e.g. '2023-11-26T23:59:59Z')"),
    timeZone: timeZoneSchemaUnvalidated.optional().default(defaultTimeZone).describe("Optional: The time zone to use for the search"),
  });

  const modifyCalendarEventSchema = z.object({
    eventId: z.string().describe("The ID of the event to modify"),
    summary: z.string().describe("The title of the event").optional(),
    description: z.string().describe("The description of the event").optional(),
    location: z.string().describe("The location of the event").optional(),
    startDateTime: z.string().describe("The start date and time of a timed event in ISO format").optional(),
    endDateTime: z.string().describe("The end date and time of a timed event in ISO format").optional(),
    startDate: z.string().describe("The start date of an all-day event in YYYY-MM-DD format").optional(),
    endDate: z.string().describe("The end date of an all-day event in YYYY-MM-DD format").optional(),
    startTimeZone: timeZoneSchemaEnum.optional().describe("The timezone for the start time. Must be a valid IANA time zone like America/New_York"),
    endTimeZone: timeZoneSchemaEnum.optional().describe("The timezone for the start time. Must be a valid IANA time zone like America/New_York"),
    addGoogleMeet: z.boolean().describe("Set to true to add Google Meet video conferencing to the event. Set to false to remove it.").optional(),
    attendees: z.array(z.string()).describe("List of email addresses to invite to the event").optional(),
    notificationMinutesBefore: z.array(z.number()).describe("When to send notifications before the event, in minutes (e.g. [10, 60, 1440] for 10 minutes, 1 hour, and 1 day before)").optional(),
    recurrence: z.string().describe(`Recurrence pattern in RFC 5545 format (e.g. "RRULE:FREQ=DAILY;COUNT=5" for daily for 5 occurrences, "RRULE:FREQ=WEEKLY;UNTIL=20240630T000000Z;BYDAY=MO,WE,FR" for MWF until June 30, 2024, "RRULE:FREQ=MONTHLY;BYMONTHDAY=10" for monthly on the 10th day)`).optional(),
  }).superRefine((data, ctx) => {
    // Apply default time zones only if date/time fields are provided
    if (data.startDateTime || data.startDate) {
      if (data.startTimeZone === undefined) {
        data.startTimeZone = defaultTimeZone;
      }
    }
    
    if (data.endDateTime || data.endDate) {
      if (data.endTimeZone === undefined) {
        data.endTimeZone = defaultTimeZone;
      }
    }
    
    return data;
  });

  const deleteCalendarEventSchema = z.object({
    eventId: z.string().describe("The ID of the event to delete"),
  });

  return {

    allDayEventSchema,
    timedEventSchema,
    emailReplySchema,
    timeZoneConversionSchema,
    listCalendarEventsSchema,
    searchCalendarEventsSchema,
    modifyCalendarEventSchema,
    deleteCalendarEventSchema
  };
}

// Static interfaces that don't depend on defaultTimeZone
export interface TextPart {
  type: 'text';
  text: string;
}

export interface ImagePart {
  type: 'image';
  image: string;
  mimeType: string;
}

export interface FilePart {
  type: 'file';
  data: string;
  mimeType: string;
}

export type MessagePart = TextPart | ImagePart | FilePart;

export interface EmailMessage {
  role: 'user' | 'system' | 'assistant';
  content: string | MessagePart[];
}
