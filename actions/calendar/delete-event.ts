'use server';

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

export async function deleteCalendarEvent(eventId: string): Promise<CalendarActionResult> {
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
    
    // Check if user is a plususer
    const isPro = await isProUser(user.id);
    if (!isPro) {
      return {
        success: false,
        error: "cal.ad Plus required",
        details: "Deleting calendar events requires a cal.ad Plus subscription."
      };
    }
    console.log("Attempting to delete calendar event:", eventId);

    let eventDetails: any = undefined;
    try {
      // First, get the event details before deleting
      const eventResponse = await calendar.events.get({
        calendarId,
        eventId
      });
      
      eventDetails = eventResponse.data;
      
      // Delete the event
      await calendar.events.delete({
        calendarId,
        eventId
      });
      
      console.log("Calendar event deleted successfully:", eventId);
      
      // Format the deleted event details if available
      let formattedEvent = eventDetails ? formatCalendarEvents([eventDetails])[0] : undefined;
      return {
        success: true,
        event: formattedEvent,
        eventLink: eventDetails?.htmlLink || undefined
      };
    } catch (apiError: any) {
      // If we get a 401, try refreshing the token
      if (apiError.response?.status === 401) {
        console.log("Received 401 during deletion, attempting to refresh token...");
        
        return await refreshTokenAndRetry(calendar, async () => {
          await calendar.events.delete({
            calendarId,
            eventId
          });
          
          // Format the deleted event details if available
          let formattedEvent = eventDetails ? formatCalendarEvents([eventDetails])[0] : undefined;
          return {
            success: true,
            event: formattedEvent,
            eventLink: eventDetails?.htmlLink || undefined
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
    console.error("Error deleting calendar event:", error);
    
    return { 
      success: false,
      error: error.message || "Failed to delete calendar event"
    };
  }
}
