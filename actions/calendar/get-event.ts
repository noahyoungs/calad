'use server';

import { CalendarActionResult } from "./types";
import { setupCalendarClient, refreshTokenAndRetry, handleGoogleAPIError } from "./client-setup";

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

async function getCalendarEvent(calendar: any, eventId: string, calendarId: string) {
  return await calendar.events.get({
    calendarId: calendarId,
    eventId: eventId,
  });
}

export async function getCalendarEventById(eventId: string): Promise<CalendarActionResult> {
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

    const { calendar, calendarId } = clientSetup;
    console.log("Attempting to retrieve calendar event with ID:", eventId);

    try {
      // First attempt to get the event
      const event = await getCalendarEvent(calendar, eventId, calendarId);
      console.log("Calendar event retrieved successfully!");
      
      return {
        success: true,
        event: event.data,
        eventLink: event.data.htmlLink || undefined
      };
    } catch (apiError: any) {
      // If we get a 401, try refreshing the token
      if (apiError.response?.status === 401) {
        console.log("Received 401, attempting to refresh token...");
        
        return await refreshTokenAndRetry(calendar, async () => {
          const retryEvent = await getCalendarEvent(calendar, eventId, calendarId);
          return {
            success: true,
            event: retryEvent.data,
            eventLink: retryEvent.data.htmlLink || undefined
          };
        });
      }
      
      // Handle other Google API errors
      if (apiError.response) {
        return handleGoogleAPIError(apiError);
      }
      
      throw apiError;
    }
  } catch (error: any) {
    console.error("Error retrieving calendar event:", error);
    
    return { 
      success: false,
      error: error.message || "Failed to retrieve calendar event"
    };
  }
} 