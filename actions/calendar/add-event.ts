'use server';

import { CalendarEvent } from "./types"; // Input type
import { CalendarActionResult } from "./types";
import { GoogleCalendarEvent as FormattedGoogleCalendarEvent } from "@/utils/calendar/types"; // Output type from common utils
import { setupCalendarClient, refreshTokenAndRetry, handleGoogleAPIError } from "./client-setup";
import { 
  GoogleCalendarEventResponse, 
  formatCalendarEvents, 
} from "@/utils/calendar/common-utils";

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

async function createCalendarEventAndFormat(
  calendar: any, 
  eventData: any, 
  calendarId: string
): Promise<{data: FormattedGoogleCalendarEvent, raw: GoogleCalendarEventResponse}> {
  const rawEventResponse = await calendar.events.insert({
    calendarId: calendarId,
    requestBody: eventData,
    conferenceDataVersion: typeof eventData.conferenceData !== undefined ? 1 : 0, // Corrected from != null
  });

  const rawCreatedEvent = rawEventResponse.data as GoogleCalendarEventResponse;
  let formattedEvent: FormattedGoogleCalendarEvent;

  formattedEvent = formatCalendarEvents([rawCreatedEvent])[0];
  
  return { data: formattedEvent, raw: rawCreatedEvent };
}

export async function addCalendarEvent(eventData: CalendarEvent): Promise<CalendarActionResult> {
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
    console.log("Attempting to create calendar event:", JSON.stringify(eventData, null, 2));

    try {
      // First attempt to create event
      const { data: formattedCreatedEvent, raw: rawEventDetails } = await createCalendarEventAndFormat(calendar, eventData, calendarId);
      console.log("Calendar event created successfully!");
      
      return {
        success: true,
        event: formattedCreatedEvent, // Return the fully formatted event
        eventLink: rawEventDetails.htmlLink || undefined
      };
    } catch (apiError: any) {
      // If we get a 401, try refreshing the token
      if (apiError.response?.status === 401) {
        console.log("Received 401, attempting to refresh token...");
        
        return await refreshTokenAndRetry(calendar, async () => {
          const { data: retryFormattedEvent, raw: retryRawDetails } = await createCalendarEventAndFormat(calendar, eventData, calendarId);
          return {
            success: true,
            event: retryFormattedEvent, // Return the fully formatted event
            eventLink: retryRawDetails.htmlLink || undefined
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
    console.error("Error creating calendar event:", error);
    
    return { 
      success: false,
      error: error.message || "Failed to create calendar event"
    };
  }
}
