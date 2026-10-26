import { CalendarEvent } from './types';
import { CalendarActionResult } from './types';
import { executeCalendarOperation } from './common-utils';
import { validateTimeZone } from '@/utils/timeZoneUtils';

/**
 * Internal version of modifyCalendarEvent that uses admin client and doesn't check auth
 */
export async function modifyCalendarEventInternal(
  userId: string,
  eventId: string,
  eventData: Partial<CalendarEvent>
): Promise<CalendarActionResult> {
  // Validate time zones if present
  if (eventData.start?.timeZone) {
    const startTzValidation = validateTimeZone(eventData.start.timeZone);
    if (!startTzValidation.valid) {
      return {
        success: false,
        error: "Invalid start time zone",
        details: startTzValidation.error
      };
    }
  }
  
  if (eventData.end?.timeZone) {
    const endTzValidation = validateTimeZone(eventData.end.timeZone);
    if (!endTzValidation.valid) {
      return {
        success: false,
        error: "Invalid end time zone",
        details: endTzValidation.error
      };
    }
  }

  // Determine if we're converting to all-day event
  const isConvertingToTimed = eventData.start?.date === null || eventData.end?.date === null;
  const isConvertingToAllDay = eventData.start?.dateTime === null || eventData.end?.dateTime === null;
  
  // Debug log the actual event data
  console.log('Raw eventData for modification:', JSON.stringify({
    start: eventData.start,
    end: eventData.end,
    hasStartDate: !!eventData.start?.date,
    hasEndDate: !!eventData.end?.date,
    isConvertingToAllDay,
    isConvertingToTimed
  }, null, 2));

  // Define the modify operation
  const modifyOperation = async (calendar: any, calendarId: string) => {
    // First, fetch the existing event to avoid clearing unspecified fields
    const existingEvent = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId
    });
    
    // Create update data by merging existing event with provided changes
    const updateData: any = { ...existingEvent.data };
    
    // Update summary if provided (even if empty string)
    if ('summary' in eventData) {
      updateData.summary = eventData.summary;
    }
    
    // Update description if provided (even if empty string)
    if ('description' in eventData) {
      updateData.description = eventData.description;
    }
    
    // Update location if provided (even if empty string)
    if ('location' in eventData) {
      updateData.location = eventData.location;
    }
    
    // Handle event type conversion and updates
    if (isConvertingToAllDay) {
      console.log('Converting to or updating all-day event');
      
      // Set up structures if they don't exist
      updateData.start = updateData.start || {};
      updateData.end = updateData.end || {};
      
      // Remove dateTime properties when converting to all-day
      delete updateData.start.dateTime;
      delete updateData.end.dateTime;
      
      // Set date values if provided
      if (eventData.start?.date) {
        updateData.start.date = eventData.start.date;
      }
      
      if (eventData.end?.date) {
        updateData.end.date = eventData.end.date;
      }
      
      // Update timeZones if provided
      if (eventData.start?.timeZone) {
        updateData.start.timeZone = eventData.start.timeZone;
      }
      
      if (eventData.end?.timeZone) {
        updateData.end.timeZone = eventData.end.timeZone;
      }
    }
    else if (isConvertingToTimed) {
      console.log('Converting to or updating timed event');
      
      // Set up structures if they don't exist
      updateData.start = updateData.start || {};
      updateData.end = updateData.end || {};
      
      // Remove date properties when converting to timed
      delete updateData.start.date;
      delete updateData.end.date;
      
      // Set dateTime values
      if (eventData.start?.dateTime) {
        updateData.start.dateTime = eventData.start.dateTime;
      }
      
      if (eventData.end?.dateTime) {
        updateData.end.dateTime = eventData.end.dateTime;
      }
      
      // Update timeZones if provided
      if (eventData.start?.timeZone) {
        updateData.start.timeZone = eventData.start.timeZone;
      }
      
      if (eventData.end?.timeZone) {
        updateData.end.timeZone = eventData.end.timeZone;
      }
    }
    else if (eventData.start || eventData.end) {
      console.log('Updating event start/end without conversion');
      
      // Handle partial updates to start/end without changing event type
      if (eventData.start) {
        updateData.start = { ...updateData.start };
        
        // Check if we're updating an all-day event's date
        if (eventData.start.date) {
          console.log(`Setting start date to ${eventData.start.date}`);
          updateData.start.date = eventData.start.date;
        }
        
        if (eventData.start.timeZone) {
          updateData.start.timeZone = eventData.start.timeZone;
        }
      }
      
      if (eventData.end) {
        updateData.end = { ...updateData.end };
        
        // Check if we're updating an all-day event's date
        if (eventData.end.date) {
          console.log(`Setting end date to ${eventData.end.date}`);
          updateData.end.date = eventData.end.date;
        }
        
        if (eventData.end.timeZone) {
          updateData.end.timeZone = eventData.end.timeZone;
        }
      }
    }
    
    // Update attendees if provided
    if (eventData.attendees) {
      updateData.attendees = eventData.attendees;
    }
    
    // Update conferenceData if its not undefined
    if (typeof eventData.conferenceData !== 'undefined') {
      updateData.conferenceData = eventData.conferenceData;
    }

    // Update reminders if provided
    if (eventData.reminders) {
      updateData.reminders = eventData.reminders;
    }

    // Update recurrence if provided
    if (eventData.recurrence) {
      updateData.recurrence = eventData.recurrence;
    }
    
    // Log the final updateData for debugging
    console.log('Final event update data:', updateData);
    
    const event = await calendar.events.update({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: updateData,
      conferenceDataVersion: typeof eventData.conferenceData != undefined ? 1 : 0,
    });
    
    return {
      event: event.data,
      eventLink: event.data.htmlLink
    };
  };
  

  
  return executeCalendarOperation(
    userId,
    'modify calendar event',
    modifyOperation,
    {
      eventId,
      eventSummary: eventData.summary,
      hasAttendees: !!eventData.attendees?.length,
      hasGoogleMeet: !!eventData.conferenceData,
      hasLocation: !!eventData.location,
      attendeeCount: eventData.attendees?.length || 0,
      isConvertingToAllDay,
      isConvertingToTimed
    }
  );
}
