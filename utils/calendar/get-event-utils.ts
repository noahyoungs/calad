import { CalendarActionResult } from './types';
import { executeCalendarOperation, formatCalendarEvents, GoogleCalendarEventResponse } from './common-utils';
import { validateTimeZone } from '@/utils/timeZoneUtils';

export async function getCalendarEvent(
  userId: string,
  eventId: string,
  calendarId: string = 'primary',
  timeZone?: string
): Promise<CalendarActionResult> {
  // Validate time zone if provided
  if (timeZone) {
    const tzValidation = validateTimeZone(timeZone);
    if (!tzValidation.valid) {
      return {
        success: false,
        error: "Invalid time zone",
        details: tzValidation.error
      };
    }
  }

  // Define the get operation
  const getOperation = async (calendar: any, calendarIdParam: string) => {
    const response = await calendar.events.get({
      calendarId: calendarIdParam,
      eventId: eventId,
      timeZone: timeZone,
    });

    const event = response.data;
    
    // Format the event for LLM consumption
    const formattedEvents = formatCalendarEvents([event]);

    return {
      events: formattedEvents,
      eventId,
      calendarId: calendarIdParam,
      timeZone
    };
  };
  
  return executeCalendarOperation(
    userId,
    'get calendar event',
    getOperation,
    {
      eventId,
      calendarId,
      timeZone
    }
  );
}
