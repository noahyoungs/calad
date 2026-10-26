"use server";

import { createClient } from "@/utils/supabase/server";
import { ActionResponse } from "./types";

/**
 * Adds the user's auth email during disabled onboarding flow
 * This is a simplified version that doesn't send verification emails
 */
export async function addAuthEmailDuringOnboarding(
  userId: string,
  email: string,
  firstName: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    
    // Check if this email already exists for this user
    const { data: existingEmail } = await supabase
      .from("user_emails")
      .select("id")
      .eq("user_id", userId)
      .eq("email", email)
      .single();

    if (existingEmail) {
      // Email already exists, no need to add it again
      return { success: true };
    }

    // Check if this is the user's first email
    const { count } = await supabase
      .from("user_emails")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const isFirstEmail = count === 0;

    // Add the email
    const { error } = await supabase
      .from("user_emails")
      .insert({
        user_id: userId,
        email: email,
        is_primary: isFirstEmail,
        is_verified: false, // Will need to be verified later if user wants to use email features
      });

    if (error) {
      console.error("Error adding auth email:", error);
      // Don't throw error, just log it - this shouldn't block onboarding
      return { success: false, error: "Failed to add email" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in addAuthEmailDuringOnboarding:", error);
    return { success: false, error: "Internal error" };
  }
}