import { CalendarActionResult, GoogleCalendarEvent } from './types';
import { fetchSelectedCalendarInternal, setupGoogleCalendarClient, handleGoogleAPIError } from './calendar-api-utils';
import { toZonedTime, format as formatTz } from 'date-fns-tz';

/**
 * Interface for Google Calendar event response from the API
 */
export interface GoogleCalendarEventResponse {
  recurringEventId?: string; // Added field
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
  }>;
  htmlLink?: string;
  status?: string;
  recurrence?: string[];
}

// Helper function to format events and attach parentRecurringEvent if applicable
// Moved from app/api/test/route.ts
export function formatEventsWithParent(
  events: GoogleCalendarEventResponse[], // Uses the extended GoogleCalendarEventResponse
  parentRecurringEventMap: Record<string, any> // Assuming parent events are already formatted by formatCalendarEvents
): GoogleCalendarEvent[] { // Returns the final, fully formatted event structure
  const formatted = formatCalendarEvents(events); // Initial formatting
  return formatted.map((evt, idx) => {
    const raw = events[idx]; // Get the original raw event to access recurringEventId
    if (raw.recurringEventId && parentRecurringEventMap[raw.recurringEventId]) {
      // Attach the pre-formatted parent event
      return { ...evt, parentRecurringEvent: parentRecurringEventMap[raw.recurringEventId] };
    }
    return evt;
  });
}

/**
 * Fetches and formats parent recurring events in parallel.
 * @param calendar The Google Calendar API client instance.
 * @param calendarId The ID of the calendar to query.
 * @param uniqueRecurringEventIds An array of unique string IDs for the parent events.
 * @param operationNameForLogging Optional string for more specific error logging.
 * @returns A map of recurringEventId to the formatted parent event.
 */
export async function fetchAndFormatParentRecurringEvents(
  calendar: any,
  calendarId: string,
  uniqueRecurringEventIds: string[],
  operationNameForLogging: string = 'parent event fetch' // Default logging name
): Promise<Record<string, any>> {
  const parentRecurringEventMap: Record<string, any> = {};
  if (uniqueRecurringEventIds.length === 0) {
    return parentRecurringEventMap;
  }

  const parentFetchResults = await Promise.all(
    uniqueRecurringEventIds.map(async (recurringId) => {
      try {
        const parentResp = await calendar.events.get({
          calendarId: calendarId,
          eventId: recurringId,
        });
        // Format the parent event (formatCalendarEvents returns an array)
        const formattedParent = formatCalendarEvents([parentResp.data as GoogleCalendarEventResponse])[0];
        return { recurringId, formatted: formattedParent };
      } catch (err) {
        console.error(`Failed to fetch parent event for recurringEventId ${recurringId} during ${operationNameForLogging}:`, err);
        return { recurringId, formatted: null };
      }
    })
  );

  for (const { recurringId, formatted } of parentFetchResults) {
    if (formatted) {
      parentRecurringEventMap[recurringId] = formatted;
    }
  }
  return parentRecurringEventMap;
}

/**
 * Format Google Calendar API events for LLM consumption
 */
export function formatCalendarEvents(events: GoogleCalendarEventResponse[]): GoogleCalendarEvent[] {
  // Filter out cancelled events
  const activeEvents = events.filter(event => event.status !== 'cancelled');

  return activeEvents.map((event: GoogleCalendarEventResponse) => {
    const isAllDay = Boolean(event.start?.date);
    let startObj: any = {};
    let endObj: any = {};

    if (isAllDay) {
      // For all-day events, return start and end as { date, timeZone }
      startObj = {
        date: event.start?.date || '',
        timeZone: event.start?.timeZone || ''
      };
      endObj = {
        date: event.end?.date || '',
        timeZone: event.end?.timeZone || ''
      };
    } else {
      // For timed events, convert dateTime and return as { dateTime, timeZone }
      let convertedStart = event.start?.dateTime || '';
      let convertedEnd = event.end?.dateTime || '';
      if (typeof event.start?.timeZone === 'string') {
        if (typeof event.start?.dateTime === 'string') {
          try {
            const parsedStart = new Date(event.start.dateTime);
            const zonedStart = toZonedTime(parsedStart, event.start.timeZone);
            convertedStart = formatTz(zonedStart, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: event.start.timeZone });
          } catch {
            convertedStart = event.start.dateTime;
          }
        }
        if (typeof event.end?.dateTime === 'string') {
          try {
            const parsedEnd = new Date(event.end.dateTime);
            const zonedEnd = toZonedTime(parsedEnd, event.start.timeZone);
            convertedEnd = formatTz(zonedEnd, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: event.start.timeZone });
          } catch {
            convertedEnd = event.end.dateTime;
          }
        }
      }
      startObj = {
        dateTime: convertedStart,
        timeZone: event.start?.timeZone || ''
      };
      endObj = {
        dateTime: convertedEnd,
        timeZone: event.end?.timeZone || ''
      };
    }

    const result = {
      id: event.id || '',
      summary: event.summary || 'Untitled Event',
      description: event.description || '',
      location: event.location || '',
      isAllDay,
      start: startObj,
      end: endObj,
      attendees: (event.attendees || []).map(attendee => attendee.email).join(', '),
      link: event.htmlLink || ''
    } as GoogleCalendarEvent;

    if (event.recurrence && event.recurrence.length > 0) {
      result.recurrence = event.recurrence[0];
    }
    return result;
  });
}

/**
 * Execute a calendar operation with common error handling and setup
 */
export async function executeCalendarOperation<T>(
  userId: string,
  operationName: string,
  operation: (calendar: any, calendarId: string) => Promise<T>,
  logContext: Record<string, any> = {}
): Promise<CalendarActionResult> {
  try {
    console.log(`Starting ${operationName} for user:`, {
      userId,
      ...logContext
    });

    // Get the selected calendar ID from settings
    const selectedCalendarResult = await fetchSelectedCalendarInternal(userId);
    // Default to 'primary' if no calendar is selected or if there's an error
    const calendarId = selectedCalendarResult.success && selectedCalendarResult.data ? selectedCalendarResult.data : 'primary';

    // Set up Google Calendar client
    const clientSetup = await setupGoogleCalendarClient(userId);
    if (!clientSetup.success) {
      return {
        success: false,
        error: clientSetup.error,
        details: clientSetup.details,
        source: clientSetup.source
      };
    }

    const calendar = clientSetup.calendar;
    console.log(`Attempting to ${operationName}:`, {
      calendarId,
      ...logContext
    });

    try {
      // Execute the operation
      const result = await operation(calendar, calendarId);
      console.log(`Calendar ${operationName} completed successfully:`, {
        ...logContext,
        calendarId
      });
      
      return {
        success: true,
        ...result
      };
    } catch (apiError: any) {
      // Handle API errors including token refresh
      return await handleGoogleAPIError(
        apiError,
        userId,
        clientSetup.calendar.context._options.auth.credentials.refresh_token,
        clientSetup.calendar.context._options.auth,
        async () => {
          const retryResult = await operation(calendar, calendarId);
          return {
            success: true,
            ...retryResult
          };
        }
      );
    }
  } catch (error: any) {
    console.error(`Unexpected error in ${operationName}:`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: {
        userId,
        ...logContext
      }
    });
    
    return { 
      success: false,
      error: error.message || `Failed to ${operationName}`,
      details: `An unexpected error occurred while ${operationName}`
    };
  }
}
