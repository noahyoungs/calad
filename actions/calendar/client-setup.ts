'use server';

import { createClient } from "@/utils/supabase/server";
import { google } from "googleapis";
import { getTokensFromAuthOrSession } from "@/actions/oauth-actions";
import { requireAuth } from "@/actions/types";
import { fetchSelectedCalendar } from "@/actions/settings-actions";
import { CalendarActionResult } from "./types";

export async function setupCalendarClient() {
  const supabase = await createClient();

  try {
    // Verify authentication using our requireAuth helper
    const user = await requireAuth(supabase);

    // Get the selected calendar ID from settings
    const selectedCalendarResult = await fetchSelectedCalendar();
    // Default to 'primary' if no calendar is selected or if there's an error
    const calendarId = selectedCalendarResult.success && selectedCalendarResult.data ? selectedCalendarResult.data : 'primary';
    console.log("Using calendar ID:", calendarId);

    // First attempt to get tokens
    let tokensResult = await getTokensFromAuthOrSession("google");

    if (!tokensResult.success || !tokensResult.data?.accessToken) {
      console.error("Error retrieving initial tokens for user:", user.id);
      return { 
        success: false,
        error: "Google authentication token not available",
        details: "Please sign in again with Google",
        source: tokensResult.data?.source || undefined
      };
    }

    let { accessToken, refreshToken } = tokensResult.data;
    console.log("Successfully retrieved tokens from source:", tokensResult.data.source);

    // Set up Google Calendar API client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    return {
      success: true,
      calendar,
      calendarId,
      oauth2Client,
      user
    };
  } catch (error: any) {
    console.error("Error setting up calendar client:", error);
    return {
      success: false,
      error: error.message || "Failed to set up calendar client"
    };
  }
}

export async function refreshTokenAndRetry<T>(
  calendar: any,
  operation: () => Promise<T>
): Promise<T | CalendarActionResult> {
  try {
    // Force a fresh token fetch
    const tokensResult = await getTokensFromAuthOrSession("google");
    
    if (!tokensResult.success || !tokensResult.data?.accessToken) {
      return { 
        success: false,
        error: "Google Calendar authentication failed",
        details: "Unable to refresh authentication. Please sign in again.",
        source: "token_refresh_failed"
      };
    }

    // Update credentials with fresh token
    calendar.context._options.auth.setCredentials({
      access_token: tokensResult.data.accessToken,
      refresh_token: tokensResult.data.refreshToken,
    });

    // Retry the operation with fresh token
    return await operation();
  } catch (retryError: any) {
    // If we still get a 401 after refresh, user needs to re-authenticate
    if (retryError.response?.status === 401) {
      return { 
        success: false,
        error: "Google Calendar authentication failed",
        details: "Your Google authentication has expired. Please sign in again.",
        source: "token_refresh_failed"
      };
    }
    throw retryError;
  }
}

export async function handleGoogleAPIError(error: any): Promise<CalendarActionResult> {
  console.error("Google API error details:", JSON.stringify({
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data
  }, null, 2));
  
  if (error.response?.status === 403) {
    return { 
      success: false,
      error: "Google Calendar access forbidden",
      details: "You don't have permission to access this calendar or perform this operation."
    };
  }

  if (error.response?.status === 404) {
    return { 
      success: false,
      error: "Calendar or event not found",
      details: "The calendar or event you're trying to access no longer exists or is not accessible."
    };
  }

  if (error.response?.status === 400) {
    return {
      success: false,
      error: "Google Calendar API Bad Request",
      details: error.response?.data?.error?.errors?.map((e: any) => e.message).join(", ") || 
              JSON.stringify(error.response?.data || error.response?.data?.error?.message || {})
    };
  }

  return {
    success: false,
    error: `Google Calendar API error: ${error.response?.status || 'Unknown'}`,
    details: error.response?.data?.error?.message || "An unexpected error occurred"
  };
}
