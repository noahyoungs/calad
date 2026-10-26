import { createClient } from "@/utils/supabase/server";

/**
 * Utility functions for working with Lemon Squeezy subscriptions
 */

/**
 * Gets a user's subscription details
 * 
 * @param userId The user ID to check
 * @returns The subscription details or null if not found
 */
export async function getUserSubscription(userId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching subscription:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getUserSubscription:", error);
    return null;
  }
}

/**
 * Checks if a webhook signature from Lemon Squeezy is valid
 * 
 * @param payload The raw request body
 * @param signature The signature from the x-signature header
 * @returns Boolean indicating if the signature is valid
 */
export function verifyLemonSqueezySignature(payload: string, signature: string | null): boolean {
  if (!signature) return false;
  
  try {
    const crypto = require("crypto");
    const signingSecret = process.env.LEMON_SQUEEZY_SIGNING_SECRET;
    
    if (!signingSecret) {
      console.error("LEMON_SQUEEZY_SIGNING_SECRET is not set");
      return false;
    }
    
    const computedSignature = crypto
      .createHmac("sha256", signingSecret)
      .update(payload)
      .digest("hex");
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

/**
 * Formats a subscription status for display
 * 
 * @param subscription The subscription object
 * @returns A formatted status string
 */
export function formatSubscriptionStatus(subscription: any) {
  if (!subscription) {
    return "No subscription";
  }
  
  if (!subscription.is_active) {
    return "Inactive";
  }
  
  if (subscription.plan_type === "free") {
    return "Free Plan";
  }
  
  // For plus subscriptions
  const endDate = subscription.subscription_end_date 
    ? new Date(subscription.subscription_end_date) 
    : null;
  
  if (!endDate) {
    return "cal.ad Plus";
  }
  
  // Format the end date
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  const formattedDate = endDate.toLocaleDateString(undefined, options);
  
  return `cal.ad Plus (until ${formattedDate})`;
}

/**
 * Gets the number of days remaining in a subscription
 * 
 * @param subscription The subscription object
 * @returns The number of days remaining or null if no end date
 */
export function getDaysRemaining(subscription: any) {
  if (!subscription || !subscription.is_active || !subscription.subscription_end_date) {
    return null;
  }
  
  const endDate = new Date(subscription.subscription_end_date);
  const now = new Date();
  
  // Calculate the difference in days
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}
