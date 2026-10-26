import { createAdminClient } from '@/utils/supabase/admin';
import { decryptToken } from '@/utils/oauth-utils';
import { OAuthTokens } from './types';

/**
 * Internal version of getTokensFromAuthOrSession that only checks database
 */
export async function getTokensFromDatabaseOnly(
  provider: string,
  userId: string
): Promise<{ success: boolean; data?: OAuthTokens }> {
  const supabase = createAdminClient();
  
  try {
    const { data, error } = await supabase
      .from("user_sessions")
      .select("provider_token, provider_refresh_token, expires_at")
      .eq("user_id", userId)
      .eq("provider", provider)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error("Database error retrieving tokens:", {
        error: error.message,
        details: error.details,
        hint: error.hint,
        userId,
        provider
      });
      return {
        success: false,
        data: {
          accessToken: null,
          refreshToken: undefined,
          expiresAt: null,
          source: null
        }
      };
    }

    if (!data) {
      console.warn("No tokens found in database:", {
        userId,
        provider
      });
      return {
        success: true,
        data: {
          accessToken: null,
          refreshToken: undefined,
          expiresAt: null,
          source: null
        }
      };
    }
    
    // Decrypt the refresh token before returning - this is important because refreshGoogleToken
    // expects a decrypted token, and other code paths (like in oauth-actions.ts) decrypt before passing
    const decryptedRefreshToken = data.provider_refresh_token ? decryptToken(data.provider_refresh_token) || undefined : undefined;
    
    return {
      success: true,
      data: {
        accessToken: data.provider_token,
        refreshToken: decryptedRefreshToken,
        expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : null,
        source: 'user_sessions'
      }
    };
  } catch (error: any) {
    console.error("Unexpected error retrieving tokens:", {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      context: {
        userId,
        provider
      }
    });
    return {
      success: false,
      data: {
        accessToken: null,
        refreshToken: undefined,
        expiresAt: null,
        source: null
      }
    };
  }
}
