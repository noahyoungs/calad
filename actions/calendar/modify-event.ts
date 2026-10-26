'use server';

import { CalendarEvent } from "./types";
import { CalendarActionResult } from "./types";
import { setupCalendarClient, refreshTokenAndRetry, handleGoogleAPIError } from "./client-setup";
import { isProUser } from "@/utils/subscription-utils";
import { formatCalendarEvents } from "@/utils/calendar/common-utils";

type CalendarClientSetupResult = {
  success: true;
  calendar: any;
  calendarId: string;
  oauth2Client: any;
  user: any;
} | {
  success: false;
  error: string;
  details?: string;
  source?: string;
};

export async function modifyCalendarEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarActionResult> {
  try {
    // Set up calendar client and get necessary data
    const clientSetup = await setupCalendarClient() as CalendarClientSetupResult;
    if (!clientSetup.success) {
      return {
        success: false,
        error: clientSetup.error,
        details: clientSetup.details,
        source: clientSetup.source
      };
    }

    const { calendar, calendarId, user } = clientSetup;
    
    // Check if user is a plus user
    const isPro = await isProUser(user.id);
    if (!isPro) {
      return {
        success: false,
        error: "cal.ad Plus required",
        details: "Modifying calendar events requires a cal.ad Plus subscription."
      };
    }
    
    // First, get the current event to merge with updates
    let currentEvent;
    try {
      const response = await calendar.events.get({
        calendarId,
        eventId
      });
      currentEvent = response.data;
    } catch (getError: any) {
      if (getError.response?.status === 404) {
        return {
          success: false,
          error: "Event not found",
          details: "The event you're trying to modify no longer exists."
        };
      }
      throw getError;
    }

    // Create update data by preserving the entire existing event structure
    const updateData = { ...currentEvent };
    
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
    
    // Handle start and end times/dates
    if (eventData.start) {
      if (!updateData.start) updateData.start = {};
      
      // Check if converting to timed event
      if (eventData.start.dateTime !== undefined) {
        if (eventData.start.dateTime === null) {
          // Converting to all-day
          delete updateData.start.dateTime;
          if (eventData.start.date) {
            updateData.start.date = eventData.start.date;
          }
        } else {
          // Updating or converting to timed event
          updateData.start.dateTime = eventData.start.dateTime;
          delete updateData.start.date;
        }
      } else if (eventData.start.date !== undefined) {
        if (eventData.start.date === null) {
          // Converting to timed event
          delete updateData.start.date;
          if (eventData.start.dateTime) {
            updateData.start.dateTime = eventData.start.dateTime;
          }
        } else {
          // Updating or converting to all-day event
          updateData.start.date = eventData.start.date;
          delete updateData.start.dateTime;
        }
      }
      
      // Update timeZone if provided
      if (eventData.start.timeZone !== undefined) {
        updateData.start.timeZone = eventData.start.timeZone;
      }
    }
    
    if (eventData.end) {
      if (!updateData.end) updateData.end = {};
      
      // Check if converting to timed event
      if (eventData.end.dateTime !== undefined) {
        if (eventData.end.dateTime === null) {
          // Converting to all-day
          delete updateData.end.dateTime;
          if (eventData.end.date) {
            updateData.end.date = eventData.end.date;
          }
        } else {
          // Updating or converting to timed event
          updateData.end.dateTime = eventData.end.dateTime;
          delete updateData.end.date;
        }
      } else if (eventData.end.date !== undefined) {
        if (eventData.end.date === null) {
          // Converting to timed event
          delete updateData.end.date;
          if (eventData.end.dateTime) {
            updateData.end.dateTime = eventData.end.dateTime;
          }
        } else {
          // Updating or converting to all-day event
          updateData.end.date = eventData.end.date;
          delete updateData.end.dateTime;
        }
      }
      
      // Update timeZone if provided
      if (eventData.end.timeZone !== undefined) {
        updateData.end.timeZone = eventData.end.timeZone;
      }
    }
    
    // Update conferenceData if it's not undefined
    if (typeof eventData.conferenceData !== 'undefined') {
      updateData.conferenceData = eventData.conferenceData;
    }
    
    // Update attendees if provided
    if (eventData.attendees !== undefined) {
      updateData.attendees = eventData.attendees;
    }
    
    // Update reminders if provided
    if (eventData.reminders !== undefined) {
      updateData.reminders = eventData.reminders;
    }
    
    // Update recurrence if provided
    if (eventData.recurrence !== undefined) {
      updateData.recurrence = eventData.recurrence;
    }

    console.log("Attempting to update calendar event:", JSON.stringify({
      eventId,
      fields: Object.keys(eventData)
    }, null, 2));

    // Log the final update request payload
    console.log("Calendar update request payload:", JSON.stringify({
      calendarId,
      eventId,
      requestBody: updateData,
      conferenceDataVersion: typeof eventData.conferenceData !== 'undefined' ? 1 : 0,
    }, null, 2));

    try {
      // Update event
      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: updateData,
        conferenceDataVersion: typeof eventData.conferenceData !== 'undefined' ? 1 : 0,
      });
      
      console.log("Calendar event updated successfully:", response.data.id);
      
      // Format the updated event
      const formattedEvent = formatCalendarEvents([response.data])[0];
      return {
        success: true,
        event: formattedEvent,
        eventLink: response.data.htmlLink || undefined
      };
    } catch (apiError: any) {
      // If we get a 401, try refreshing the token
      if (apiError.response?.status === 401) {
        console.log("Received 401 during update, attempting to refresh token...");
        
        return await refreshTokenAndRetry(calendar, async () => {
          // Log retry request payload
          console.log("Retry calendar update request payload:", JSON.stringify({
            calendarId,
            eventId,
            requestBody: updateData,
            conferenceDataVersion: typeof eventData.conferenceData !== 'undefined' ? 1 : 0,
          }, null, 2));
          
          const retryResponse = await calendar.events.update({
            calendarId,
            eventId,
            requestBody: updateData,
            conferenceDataVersion: typeof eventData.conferenceData !== 'undefined' ? 1 : 0,
          });
          
          // Format the updated event after retry
          const formattedRetryEvent = formatCalendarEvents([retryResponse.data])[0];
          return {
            success: true,
            event: formattedRetryEvent,
            eventLink: retryResponse.data.htmlLink || undefined
          };
        });
      }
      
      // Handle other API errors
      if (apiError.response) {
        return handleGoogleAPIError(apiError);
      }
      
      throw apiError;
    }
  } catch (error: any) {
    console.error("Error modifying calendar event:", error);
    
    return { 
      success: false,
      error: error.message || "Failed to modify calendar event"
    };
  }
}
