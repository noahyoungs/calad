"use server";

import { createClient } from "@/utils/supabase/server";
import { google } from "googleapis";
import { refreshGoogleToken, encryptToken, decryptToken } from "@/utils/oauth-utils";
import {
  ActionResponse,
  ActionError,
  ActionErrorCode,
  handleActionError,
  requireAuth,
} from "./types";

// Types
type OAuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  source?: string | null;
};

/**
 * Store OAuth tokens in the user_sessions table
 */
export async function storeOAuthTokens(
  provider: string,
  accessToken: string,
  refreshToken: string,
  expiresAt?: number
): Promise<ActionResponse> {
  const supabase = await createClient();

  try {
    const user = await requireAuth(supabase);

    if (!accessToken || !refreshToken) {
      throw new ActionError(
        "Access and refresh tokens are required",
        ActionErrorCode.VALIDATION_ERROR
      );
    }

    // Encrypt the refresh token before storing
    const encryptedRefreshToken = refreshToken
      ? encryptToken(refreshToken)
      : null;

    console.log("About to store OAuth tokens with values:", {
      user_id: user.id,
      provider,
      has_access_token: !!accessToken,
      has_refresh_token: !!encryptedRefreshToken,
      expires_at: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
    });

    // First try to get existing session
    const { data: existingSession } = await supabase
      .from("user_sessions")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .single();

    const { error } = await supabase.from("user_sessions").upsert(
      {
        id: existingSession?.id, // Use existing ID if available
        user_id: user.id,
        provider,
        provider_token: accessToken,
        provider_refresh_token: encryptedRefreshToken,
        expires_at: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,provider",
      }
    );

    console.log("Stored OAuth tokens:", {
      user_id: user.id,
      provider,
      provider_token: accessToken,
      provider_refresh_token: encryptedRefreshToken,
      expires_at: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
    });

    if (error) {
      console.error("Supabase error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw new ActionError(
        `Failed to store OAuth tokens: ${error.message}`,
        ActionErrorCode.DATABASE_ERROR
      );
    }

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}


/**
 * Check if token is expired or about to expire (within 5 minutes)
 */
function isTokenExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return false;
  const expirationBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() + expirationBuffer >= expiresAt;
}

/**
 * Get OAuth tokens from auth session first, falling back to user_sessions table
 */
export async function getTokensFromAuthOrSession(
  provider: string
): Promise<ActionResponse<OAuthTokens>> {
  const supabase = await createClient();

  try {
    // verify auth
    const user = await requireAuth(supabase);
    
    console.log("Attempting to retrieve tokens for user:", {
      userId: user.id,
      provider,
      retrievalMethod: "auth_session_first"
    });

    // First try to get tokens from auth session
    const { data: authData, error: authError } =
      await supabase.auth.getSession();

    if (!authError && authData.session?.provider_token) {
      const authToken = authData.session.provider_token;
      const authRefreshToken = authData.session.provider_refresh_token;
      const authExpiresAt = authData.session.expires_at
        ? authData.session.expires_at * 1000
        : null;

      // Check if auth token is expired
      if (!isTokenExpired(authExpiresAt)) {
        console.log("Successfully retrieved valid token from auth session:", {
          userId: user.id,
          provider,
          hasAccessToken: !!authToken,
          hasRefreshToken: !!authRefreshToken,
          expiresAt: authExpiresAt ? new Date(authExpiresAt).toISOString() : null,
          isExpired: false
        });
        
        return {
          success: true,
          data: {
            accessToken: authToken,
            refreshToken: authRefreshToken || null,
            expiresAt: authExpiresAt,
            source: "auth_session",
          },
        };
      } else {
        console.log("Auth session token is expired, falling back to user_sessions:", {
          userId: user.id,
          provider,
          expiresAt: authExpiresAt ? new Date(authExpiresAt).toISOString() : null
        });
      }
    } else {
      console.log("No valid auth session found, falling back to user_sessions:", {
        userId: user.id,
        provider,
        hasAuthError: !!authError,
        authErrorMessage: authError?.message
      });
    }

    // If auth session token is not available or expired, try user_sessions
    const { data, error } = await supabase
      .from("user_sessions")
      .select("provider_token, provider_refresh_token, expires_at")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to retrieve tokens from user_sessions:", {
        userId: user.id,
        provider,
        error: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new ActionError(
        "Failed to retrieve OAuth tokens",
        ActionErrorCode.DATABASE_ERROR
      );
    }

    if (!data) {
      console.log("No tokens found in user_sessions:", {
        userId: user.id,
        provider
      });
      return {
        success: true,
        data: {
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          source: null,
        },
      };
    }

    const decryptedRefreshToken = data.provider_refresh_token
      ? decryptToken(data.provider_refresh_token)
      : null;

    const accessToken = data.provider_token;
    const refreshToken = decryptedRefreshToken;
    const expiresAt = data.expires_at
      ? new Date(data.expires_at).getTime()
      : null;

    // If token exists but is expired, try to refresh it
    if (
      accessToken &&
      isTokenExpired(expiresAt) &&
      refreshToken &&
      provider === "google"
    ) {
      console.log("Token from user_sessions is expired, attempting refresh:", {
        userId: user.id,
        provider,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        hasRefreshToken: !!refreshToken
      });
      
      const refreshResult = await refreshGoogleToken(refreshToken, user.id);

      if (refreshResult.success && refreshResult.data?.accessToken) {
        console.log("Successfully refreshed expired token:", {
          userId: user.id,
          provider,
          newExpiresAt: refreshResult.data.expiresAt ? new Date(refreshResult.data.expiresAt).toISOString() : null
        });
        
        return {
          success: true,
          data: {
            ...refreshResult.data,
            source: "refreshed_token",
          },
        };
      } else {
        console.warn("Failed to refresh expired token:", {
          userId: user.id,
          provider,
          error: refreshResult.error
        });
      }
    }

    console.log("Retrieved tokens from user_sessions:", {
      userId: user.id,
      provider,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      isExpired: isTokenExpired(expiresAt)
    });

    return {
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresAt,
        source: "user_sessions",
      },
    };
  } catch (error) {
    return handleActionError<OAuthTokens>(error);
  }
}
