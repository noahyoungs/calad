import { google } from "googleapis";
import crypto from "crypto";
import { createAdminClient } from '@/utils/supabase/admin';

type OAuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
};

type OAuthResponse = {
  success: boolean;
  data?: OAuthTokens;
  error?: string;
};

type RevokeTokensResponse = {
  success: boolean;
  error?: string;
  details?: {
    revokedCount: number;
    failedCount: number;
  };
};

/**
 * Encrypt a string using AES-256-CBC with the APP_SECRET
 */
export function encryptToken(text: string | null): string | null {
  if (!text) return null;
  
  const secret = process.env.APP_SECRET;
  if (!secret) {
    console.error("APP_SECRET environment variable is not set");
    throw new Error("APP_SECRET environment variable is not set");
  }
  
  try {
    // Create a 32 byte key from the secret
    const key = crypto.createHash('sha256').update(String(secret)).digest('base64').substring(0, 32);
    // Create a random initialization vector
    const iv = crypto.randomBytes(16);
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Return IV and encrypted data
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error("Failed to encrypt token:", error);
    return null;
  }
}

/**
 * Decrypt a string using AES-256-CBC with the APP_SECRET
 */
export function decryptToken(text: string | null): string | null {
  if (!text) return null;
  
  const secret = process.env.APP_SECRET;
  if (!secret) {
    console.error("APP_SECRET environment variable is not set");
    throw new Error("APP_SECRET environment variable is not set");
  }
  
  try {
    // Create a 32 byte key from the secret
    const key = crypto.createHash('sha256').update(String(secret)).digest('base64').substring(0, 32);
    // Split IV and encrypted data
    const parts = text.split(':');
    if (parts.length !== 2) return null;
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    // Decrypt
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("Error decrypting token:", error);
    return null;
  }
}

/**
 * Safely converts an expiry timestamp to an ISO string
 * Returns null if the date is invalid or out of range
 */
function safeExpiryDate(expiryTimestamp: number | undefined | null): string | null {
  if (!expiryTimestamp) return null;
  
  try {
    // Convert to milliseconds if in seconds
    const msTimestamp = expiryTimestamp < 253402300800 // 9999-12-31
      ? expiryTimestamp * 1000
      : expiryTimestamp;
    
    // Validate the date is within reasonable bounds
    const date = new Date(msTimestamp);
    if (date.getFullYear() > 9999 || date.getFullYear() < 1970) {
      console.warn("Expiry date out of reasonable range:", date.toISOString());
      return null;
    }
    
    return date.toISOString();
  } catch (error) {
    console.error("Error converting expiry date:", error);
    return null;
  }
}

export async function refreshGoogleToken(
  refreshToken: string,
  userId: string
): Promise<OAuthResponse> {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error("Missing required OAuth credentials");
    }
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    );
    
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Create admin client that bypasses RLS
    const supabase = createAdminClient();

    // Encrypt the refresh token before storing
    const newRefreshToken = credentials.refresh_token || refreshToken;
    const encryptedRefreshToken = encryptToken(newRefreshToken);
    
    // Convert expiry timestamp for storage (will be ISO string)
    const expiresAt = safeExpiryDate(credentials.expiry_date);
    
    // Store the refreshed tokens using upsert due to unique constraint
    const { error } = await supabase.from("user_sessions").upsert({
      user_id: userId,
      provider: 'google',
      provider_token: credentials.access_token,
      provider_refresh_token: encryptedRefreshToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,provider'
    });

    if (error) {
      console.error("Failed to store refreshed tokens:", error);
      throw new Error(`Failed to store refreshed tokens: ${error.message}`);
    }
    
    // For the return value, we want the raw timestamp in milliseconds
    const expiryInMs = credentials.expiry_date ? credentials.expiry_date * 1000 : null;

    console.info("Successfully refreshed Google token for user", userId, "with expiry", expiryInMs);
    
    return {
      success: true,
      data: {
        accessToken: credentials.access_token || null,
        refreshToken: newRefreshToken,
        expiresAt: expiryInMs
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Revoke Google OAuth tokens for a user
 * This will attempt to revoke both the access and refresh tokens from both
 * the auth session and user_sessions table
 */
export async function revokeGoogleTokens(userId: string): Promise<RevokeTokensResponse> {
  try {
    // Create admin client that bypasses RLS
    const supabase = createAdminClient();

    // Get tokens from user_sessions
    const { data: sessionData } = await supabase
      .from("user_sessions")
      .select("provider_token, provider_refresh_token")
      .eq("user_id", userId)
      .eq("provider", "google")
      .single();

    // Get tokens from auth session
    const { data } = await supabase.auth.admin.getUserById(userId);
    const authProviderToken = data.user?.app_metadata?.provider_token;
    const authRefreshToken = data.user?.app_metadata?.provider_refresh_token;

    // Collect all tokens to revoke (remove duplicates and nulls)
    const tokensToRevoke = Array.from(new Set([
      sessionData?.provider_token,
      sessionData?.provider_refresh_token,
      authProviderToken,
      authRefreshToken
    ].filter(Boolean)));

    let revokedCount = 0;
    let failedCount = 0;

    // Revoke each token
    for (const token of tokensToRevoke) {
      try {
        console.log("Attempting to revoke Google OAuth token");
        const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Token revocation failed:", errorText);
          failedCount++;
        } else {
          console.log("Successfully revoked Google OAuth token");
          revokedCount++;
        }
      } catch (error) {
        console.error("Failed to revoke token:", error);
        failedCount++;
      }
    }

    // Clean up the user_sessions table regardless of revocation success
    const { error: deleteError } = await supabase
      .from("user_sessions")
      .delete()
      .eq("user_id", userId)
      .eq("provider", "google");

    if (deleteError) {
      console.error("Failed to delete user_sessions record:", deleteError);
    }

    return {
      success: revokedCount > 0 || tokensToRevoke.length === 0,
      details: {
        revokedCount,
        failedCount
      }
    };
  } catch (error) {
    console.error("Error in revokeGoogleTokens:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      details: {
        revokedCount: 0,
        failedCount: 0
      }
    };
  }
}