import { getTokensFromAuthOrSession, } from "@/actions/oauth-actions";
import { google } from "googleapis";

// Define interface for calendar items returned by Google API
export interface GoogleCalendarListItem {
  id: string;
  summary: string;
  description?: string | null;
  backgroundColor: string;
  foregroundColor: string;
  accessRole: string;
  primary?: boolean | null;
}

/**
 * Fetches the list of calendars available on the user's Google account
 * Only returns calendars where the user has write access (accessRole of "writer" or "owner")
 * 
 * @param userId The Supabase user ID
 * @returns Array of calendar objects with id and summary
 */
export async function fetchUserCalendars(userId: string): Promise<{
  calendars: GoogleCalendarListItem[];
  error?: string;
}> {
  let userCalendars: GoogleCalendarListItem[] = [];
  
  try {
    console.log("Attempting to get OAuth tokens for user:", userId);
    
    // Get tokens from auth session or user_sessions table
    const tokensResult = await getTokensFromAuthOrSession("google");
    
    if (!tokensResult.success || !tokensResult.data?.accessToken) {
      console.log("No valid tokens found:", tokensResult.error || "No valid tokens found");
      return {
        calendars: [],
        error: tokensResult.error || "No valid tokens found"
      };
    }

    const { accessToken } = tokensResult.data;

    // Initialize Google Calendar API
    const calendar = google.calendar({
      version: 'v3',
      auth: new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      )
    });

    // Set access token
    const auth = calendar.context._options.auth;
    if (auth instanceof google.auth.OAuth2) {
      auth.setCredentials({
        access_token: accessToken
      });
    }

    // Fetch calendar list
    const response = await calendar.calendarList.list();
    
    // Map response to our interface and filter for write access
    userCalendars = response.data.items?.map(item => ({
      id: item.id || '',
      summary: item.summary || '',
      description: item.description || undefined,
      backgroundColor: item.backgroundColor || '#000000',
      foregroundColor: item.foregroundColor || '#FFFFFF',
      accessRole: item.accessRole || 'reader',
      primary: item.primary || undefined
    })).filter(calendar => 
      calendar.accessRole === 'writer' || calendar.accessRole === 'owner'
    ) || [];

    console.log(`Retrieved ${userCalendars.length} calendars with write access for user`);
    return { calendars: userCalendars };
  } catch (error: any) {
    console.error("Error fetching user calendars:", error);
    return { 
      calendars: [], 
      error: error.message || "Unknown error fetching calendars" 
    };
  }
}