import { CalendarActionResult } from './types';
import { executeCalendarOperation } from './common-utils';

/**
 * Internal version of deleteCalendarEvent that uses admin client and doesn't check auth
 */
export async function deleteCalendarEventInternal(
  userId: string,
  eventId: string
): Promise<CalendarActionResult> {
  // First, get the event details to return in the response
  let eventDetails: any;
  
  // Define the delete operation
  const deleteOperation = async (calendar: any, calendarId: string) => {
    try {
      const eventResponse = await calendar.events.get({
        calendarId: calendarId,
        eventId: eventId
      });
      eventDetails = eventResponse.data;
    } catch (getError) {
      console.warn("Could not retrieve event details before deletion:", {
        error: getError,
        eventId,
        calendarId
      });
      // Continue with deletion even if we can't get event details
    }
    
    // Delete the event
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });
    
    return {
      event: eventDetails || { id: eventId }
    };
  };
  
  return executeCalendarOperation(
    userId,
    'delete calendar event',
    deleteOperation,
    { eventId, eventSummary: eventDetails?.summary }
  );
}
