import { CalendarActionResult } from './types';
import { 
  executeCalendarOperation, 
  formatEventsWithParent, 
  GoogleCalendarEventResponse,
  fetchAndFormatParentRecurringEvents // Import new helper
} from './common-utils';
import { validateTimeZone } from '@/utils/timeZoneUtils';

export async function fetchCalendarEvents(
  userId: string,
  timeMin: string,
  timeMax: string,
  timeZone: string
): Promise<CalendarActionResult> {
  // Validate time zone
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

  // Define the fetch operation
  const fetchOperation = async (calendar: any, calendarId: string) => {
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin,
      timeMax: timeMax,
      timeZone: timeZone,
      maxResults: 50,
      singleEvents: true, // Important for recurring event instances
    });

    const eventsFromApi = (response.data.items || []) as GoogleCalendarEventResponse[];
    
    // --- Begin parent recurring event logic ---
    // 1. Collect unique recurringEventIds
    const recurringEventIdSet = new Set<string>();
    for (const event of eventsFromApi) {
      if (event.recurringEventId) {
        recurringEventIdSet.add(event.recurringEventId);
      }
    }
    const uniqueRecurringEventIds = Array.from(recurringEventIdSet);

    // 2. Fetch and format parent recurring events using the common helper
    const parentRecurringEventMap = await fetchAndFormatParentRecurringEvents(
      calendar,
      calendarId,
      uniqueRecurringEventIds,
      'fetchCalendarEvents' // For specific logging
    );

    // 3. Format events and attach parentRecurringEvent if applicable
    const finalFormattedEvents = formatEventsWithParent(eventsFromApi, parentRecurringEventMap);
    // --- End parent recurring event logic ---

    return {
      events: finalFormattedEvents,
      timeZone: timeZone,
      timeMin: timeMin,
      timeMax: timeMax,
      calendarId
    };
  };
  
  return executeCalendarOperation(
    userId,
    'fetch calendar events',
    fetchOperation,
    {
      timeMin,
      timeMax,
      timeZone
    }
  );
}
