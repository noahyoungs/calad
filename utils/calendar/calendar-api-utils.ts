import { createServerClient } from "@supabase/ssr";
import { google } from "googleapis";
import { refreshGoogleToken } from '@/utils/oauth-utils';
import { getTokensFromDatabaseOnly } from './token-utils';
import { CalendarActionResult } from './types';

/**
 * Internal version of fetchSelectedCalendar that uses admin client
 */
export async function fetchSelectedCalendarInternal(userId: string): Promise<{ success: boolean; data: string | null }> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {},
      }
    }
  );

  try {
    const { data, error } = await supabase
      .from("user_calendars")
      .select("id")
      .eq("user_id", userId)
      .eq("selected", true)
      .maybeSingle();

    if (error) {
      return { success: false, data: null };
    }

    return { success: true, data: data?.id || null };
  } catch (error) {
    return { success: false, data: null };
  }
}

export async function setupGoogleCalendarClient(userId: string): Promise<{ success: boolean; calendar?: any; error?: string; details?: string; source?: string }> {
  // Get tokens directly from database
  console.log('Attempting to retrieve tokens from database for user:', userId);
  let tokensResult = await getTokensFromDatabaseOnly("google", userId);
  console.log('Token retrieval result:', {
    success: tokensResult.success,
    hasAccessToken: !!tokensResult.data?.accessToken,
    hasRefreshToken: !!tokensResult.data?.refreshToken,
    tokenSource: tokensResult.data?.source,
    expiresAt: tokensResult.data?.expiresAt ? new Date(tokensResult.data.expiresAt).toISOString() : null
  });

  if (!tokensResult.success || !tokensResult.data?.accessToken) {
    console.error("Failed to get valid tokens:", {
      userId,
      success: tokensResult.success,
      tokenData: {
        hasAccessToken: !!tokensResult.data?.accessToken,
        hasRefreshToken: !!tokensResult.data?.refreshToken,
        source: tokensResult.data?.source,
        expiresAt: tokensResult.data?.expiresAt
      }
    });
    return { 
      success: false,
      error: "Google authentication token not available",
      details: "Please go to https://cal.ad/reauthorize to reauthorize your Google Calendar.",
      source: tokensResult.data?.source || undefined
    };
  }

  const { accessToken, refreshToken } = tokensResult.data;
  console.log("Successfully retrieved tokens:", {
    source: tokensResult.data.source,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    expiresAt: tokensResult.data.expiresAt ? new Date(tokensResult.data.expiresAt).toISOString() : null
  });

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
    calendar
  };
}

export async function handleGoogleAPIError(
  error: any,
  userId: string,
  refreshToken: string | undefined,
  oauth2Client: any,
  operation: () => Promise<any>
): Promise<CalendarActionResult> {
  // If we get a 401 or invalid_grant, try refreshing the token
  if (error.response?.status === 401 || 
      (error.response?.data?.error === 'invalid_grant' && refreshToken)) {
    console.log("Token expired or invalid, attempting to refresh...");
    
    try {
      if (!refreshToken) {
        return {
          success: false,
          error: "Failed to refresh Google Calendar authentication. Please go to https://cal.ad/reauthorize to reauthorize your Google Calendar.",
          details: "No refresh token available.",
          source: "token_refresh_failed"
        };
      }

      // Use the proper token refresh function
      const refreshResult = await refreshGoogleToken(refreshToken, userId);
      
      if (!refreshResult.success || !refreshResult.data?.accessToken) {
        console.error("Failed to refresh token:", refreshResult.error);
        return {
          success: false,
          error: "Failed to refresh Google Calendar authentication. Please go to https://cal.ad/reauthorize to reauthorize your Google Calendar.",
          details: refreshResult.error || "Please sign in to Google Calendar again",
          source: "token_refresh_failed"
        };
      }

      // Update the client with new credentials
      oauth2Client.setCredentials({
        access_token: refreshResult.data.accessToken,
        refresh_token: refreshResult.data.refreshToken || refreshToken
      });
      
      // Retry the operation with new token
      try {
        const result = await operation();
        return result;
      } catch (retryError: any) {
        console.error("Failed to perform operation after token refresh:", {
          error: retryError.message,
          response: retryError.response?.data,
          status: retryError.response?.status
        });
        return {
          success: false,
          error: "Failed to perform operation after refreshing authentication",
          details: retryError.response?.data?.error?.message || "Please try again",
          source: "calendar_api_error_after_refresh"
        };
      }
    } catch (refreshError: any) {
      console.error("Failed to refresh token:", {
        error: refreshError.message,
        stack: refreshError.stack
      });
      return {
        success: false,
        error: "Failed to refresh Google Calendar authentication. Please go to https://cal.ad/reauthorize to reauthorize your Google Calendar.",
        details: "Please sign in to Google Calendar again",
        source: "token_refresh_failed"
      };
    }
  }
  
  // Handle other Google API errors
  if (error.response) {
    console.error("Google Calendar API error:", {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
      headers: error.response.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params
      }
    });
    
    if (error.response.status === 403) {
      return { 
        success: false,
        error: "Google Calendar access forbidden",
        details: "No permission to access this calendar or perform this operation",
        source: "api_error"
      };
    }

    if (error.response.status === 404) {
      return { 
        success: false,
        error: "Calendar not found",
        details: "The specified calendar was not found in the Google Calendar account",
        source: "api_error"
      };
    }

    if (error.response.status === 400) {
      // For Bad Request, extract as much detail as possible
      console.error("Google Calendar API 400 error:", {
        status: error.response.status,
        errorData: error.response.data,
        errorArray: error.response.data?.error?.errors || [],
        errorMessage: error.response.data?.error?.message,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
        requestParams: error.config?.params,
        requestHeaders: error.config?.headers,
        firstErrorDomain: error.response.data?.error?.errors?.[0]?.domain,
        firstErrorReason: error.response.data?.error?.errors?.[0]?.reason
      });
      
      const errorDetails = error.response.data?.error?.errors?.[0]?.message || 
                          error.response.data?.error?.message ||
                          JSON.stringify(error.response.data);
      
      const errorReason = error.response.data?.error?.errors?.[0]?.reason || 'unknown';
      
      return {
        success: false,
        error: `Google Calendar API Bad Request: ${errorReason}`,
        details: errorDetails,
        source: "api_error",
        errorCode: error.response.data?.error?.code || 400,
        errorReason: errorReason
      };
    }

    return {
      success: false,
      error: `Google Calendar API error: ${error.response.status}`,
      details: error.response.data?.error?.message || "Unknown API error",
      source: "api_error"
    };
  }
  
  throw error;
}
