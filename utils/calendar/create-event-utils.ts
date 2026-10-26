import { CalendarEvent, GoogleCalendarEvent as FormattedGoogleCalendarEvent } from './types'; // Assuming GoogleCalendarEvent is the formatted type from utils/calendar/types
import { CalendarActionResult } from './types';
import { 
  executeCalendarOperation,
  GoogleCalendarEventResponse,
  formatCalendarEvents,
} from './common-utils'; // common-utils is in the same directory
import { validateTimeZone } from '@/utils/timeZoneUtils';

/**
 * Internal version of addCalendarEvent that uses admin client and doesn't check auth
 */
export async function addCalendarEventInternal(
  userId: string,
  eventData: CalendarEvent
): Promise<CalendarActionResult> {
  // Validate time zones if present
  if (eventData.start.timeZone) {
    const startTzValidation = validateTimeZone(eventData.start.timeZone);
    if (!startTzValidation.valid) {
      return {
        success: false,
        error: "Invalid start time zone",
        details: startTzValidation.error
      };
    }
  }
  
  if (eventData.end.timeZone) {
    const endTzValidation = validateTimeZone(eventData.end.timeZone);
    if (!endTzValidation.valid) {
      return {
        success: false,
        error: "Invalid end time zone",
        details: endTzValidation.error
      };
    }
  }

  // Define the create operation
  const createOperation = async (calendar: any, calendarId: string) => {
    const rawEventResponse = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: eventData,
      conferenceDataVersion: typeof eventData.conferenceData !== 'undefined' ? 1 : 0,
    });

    const rawCreatedEvent = rawEventResponse.data as GoogleCalendarEventResponse;
    let formattedEvent: FormattedGoogleCalendarEvent;

      formattedEvent = formatCalendarEvents([rawCreatedEvent])[0];
    
    return {
      event: formattedEvent, // Return the fully formatted event
      eventLink: rawCreatedEvent.htmlLink // Link from the raw response
    };
  };
  
  return executeCalendarOperation(
    userId,
    'create calendar event',
    createOperation,
    {
      eventSummary: eventData.summary,
      eventType: eventData.start.date ? 'all-day' : 'timed',
      hasAttendees: !!eventData.attendees?.length,
      hasGoogleMeet: !!eventData.conferenceData,
      start: eventData.start,
      end: eventData.end,
      hasLocation: !!eventData.location,
      attendeeCount: eventData.attendees?.length || 0
    }
  );
}
