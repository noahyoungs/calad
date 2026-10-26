"use server";

import { createClient } from "@/utils/supabase/server";
import { createServerClient } from "@supabase/ssr";
import {
  fetchUserCalendars as fetchGoogleCalendarsUtil,
  GoogleCalendarListItem,
} from "@/utils/fetch-google-calendars";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Storage } from '@google-cloud/storage';
import { ActionResponse, ActionError, ActionErrorCode, handleActionError, requireAuth } from "./types";
import { fetchSelectedCalendarInternal } from "@/utils/calendar";
import { revokeGoogleTokens } from "@/utils/oauth-utils";
import { addUserEmails, resendVerificationEmail as resendVerificationEmailAction } from "./email-actions";
import { isProUser } from "@/utils/subscription-utils";

// Define types based on Supabase schema (adjust if necessary)
export type UserSettings = {
  name: string | null;
  timezone: string | null;
  custom_instructions: string | null;
};

export type UserEmail = {
  id: string;
  email: string;
  default_calendar: string | null; // Keep for potential future use, but ignore for now
  is_verified: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type UserCalendar = {
  id: string;
  provider: string;
  name: string;
  selected: boolean;
  created_at: string;
  updated_at: string;
};

// --- Fetch Actions ---

export async function fetchUserName(): Promise<ActionResponse<string | null>> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);

    const { data, error } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();

    if (error) {
      throw new ActionError("Failed to fetch user name", ActionErrorCode.DATABASE_ERROR);
    }

    return { success: true, data: data?.name };
  } catch (error) {
    return handleActionError<string | null>(error);
  }
}

export async function fetchUserSettings(): Promise<ActionResponse<UserSettings | null>> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);

    const { data, error } = await supabase
      .from("users")
      .select("name, timezone, custom_instructions")
      .eq("id", user.id)
      .single();

    if (error) {
      throw new ActionError("Failed to fetch user settings", ActionErrorCode.DATABASE_ERROR);
    }

    return { success: true, data };
  } catch (error) {
    return handleActionError<UserSettings | null>(error);
  }
}

export async function fetchUserGoogleCalendars(): Promise<ActionResponse<{
  calendars: GoogleCalendarListItem[];
  error?: string;
}>> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);
    const result = await fetchGoogleCalendarsUtil(user.id);
    
    return { 
      success: true, 
      data: { 
        calendars: result.calendars,
        error: result.error
      }
    };
  } catch (error) {
    return handleActionError<{ calendars: GoogleCalendarListItem[]; error?: string; }>(error);
  }
}

export async function fetchSelectedCalendar(): Promise<ActionResponse<string | null>> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);
    return await fetchSelectedCalendarInternal(user.id);
  } catch (error) {
    return handleActionError<string | null>(error);
  }
}

/**
 * Fetches the user's subscription data
 */
export async function fetchUserSubscription(): Promise<ActionResponse<{
  subscription: any;
  isPro: boolean;
  daysRemaining: number | null;
  formattedStatus: string;
}>> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);

    // Get the subscription data
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, customer_portal_url")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
      throw new ActionError("Failed to fetch subscription data", ActionErrorCode.DATABASE_ERROR);
    }

    // Check if user is plus
    const isPro = await isProUser(user.id);

    // Calculate days remaining
    let daysRemaining = null;
    if (data?.is_active && data?.subscription_end_date) {
      const endDate = new Date(data.subscription_end_date);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemaining = daysRemaining > 0 ? daysRemaining : 0;
    }

    // Format status
    let formattedStatus = "No subscription";
    if (data) {
      if (!data.is_active) {
        formattedStatus = "Inactive";
      } else if (data.plan_type === "free") {
        formattedStatus = "Free Plan";
      } else {
        formattedStatus = "cal.ad Plus";
        if (data.subscription_end_date) {
          const endDate = new Date(data.subscription_end_date);
          const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          };
          const formattedDate = endDate.toLocaleDateString(undefined, options);
          formattedStatus = `cal.ad Plus (until ${formattedDate})`;
        }
      }
    }

    return { 
      success: true, 
      data: {
        subscription: data || null,
        isPro,
        daysRemaining,
        formattedStatus
      }
    };
  } catch (error) {
    return handleActionError<{
      subscription: any;
      isPro: boolean;
      daysRemaining: number | null;
      formattedStatus: string;
    }>(error);
  }
}

export async function fetchUserEmails(): Promise<ActionResponse<UserEmail[]>> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);

    const { data, error } = await supabase
      .from("user_emails")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      throw new ActionError("Failed to fetch user emails", ActionErrorCode.DATABASE_ERROR);
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return handleActionError<UserEmail[]>(error);
  }
}

// --- Update/Mutation Actions ---

const UpdateSettingsSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").nullable(),
  timezone: z.string().trim().min(1, "Timezone cannot be empty").nullable(),
  custom_instructions: z.string().nullable(),
});

export async function updateUserSettings(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);

    const validatedFields = UpdateSettingsSchema.safeParse({
      name: formData.get("name"),
      timezone: formData.get("timezone"),
      custom_instructions: formData.get("custom_instructions"),
    });

    if (!validatedFields.success) {
      throw new ActionError(
        validatedFields.error.flatten().fieldErrors.toString(),
        ActionErrorCode.VALIDATION_ERROR
      );
    }

    const { name, timezone, custom_instructions } = validatedFields.data;

    const { error } = await supabase
      .from("users")
      .update({
        name,
        timezone,
        custom_instructions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      throw new ActionError("Failed to update user settings", ActionErrorCode.DATABASE_ERROR);
    }

    revalidatePath("/app/chat/settings");
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

const UpdateCalendarSchema = z.object({
  calendarId: z.string().trim().min(1, "Calendar ID cannot be empty"),
});

export async function updateSelectedCalendar(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);

    const validatedFields = UpdateCalendarSchema.safeParse({
      calendarId: formData.get("calendarId"),
    });

    if (!validatedFields.success) {
      throw new ActionError(
        validatedFields.error.flatten().fieldErrors.toString(),
        ActionErrorCode.VALIDATION_ERROR
      );
    }

    const { calendarId } = validatedFields.data;

    // Fetch the calendar from Google to get its name
    const { calendars } = await fetchGoogleCalendarsUtil(user.id);
    const calendarToUpdate = calendars.find(cal => cal.id === calendarId);
    
    if (!calendarToUpdate) {
      throw new ActionError("Calendar not found in Google account", ActionErrorCode.NOT_FOUND);
    }

    // First ensure the calendar exists in our database
    const { data: existingCalendar, error: checkError } = await supabase
      .from("user_calendars")
      .select("id")
      .eq("user_id", user.id)
      .eq("id", calendarId)
      .maybeSingle();

    if (checkError) {
      throw new ActionError("Failed to check existing calendar", ActionErrorCode.DATABASE_ERROR);
    }

    if (!existingCalendar) {
      // Calendar doesn't exist, create it
      const { error: insertError } = await supabase
        .from("user_calendars")
        .insert({
          id: calendarId,
          user_id: user.id,
          provider: "google",
          name: calendarToUpdate.summary,
          selected: false // Will be set to true by the update_single_selected_calendar function
        });

      if (insertError) {
        throw new ActionError("Failed to insert calendar", ActionErrorCode.DATABASE_ERROR);
      }
    }

    // Now use the RPC function to update the selected status
    const { error } = await supabase.rpc('update_single_selected_calendar', {
      p_user_id: user.id,
      p_calendar_id: calendarId,
      p_provider: 'google'
    });

    if (error) {
      throw new ActionError("Failed to update selected calendar", ActionErrorCode.DATABASE_ERROR);
    }

    revalidatePath("/app/chat/settings");
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

const AddEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function addUserEmail(formData: FormData): Promise<ActionResponse<UserEmail>> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);

    const validatedFields = AddEmailSchema.safeParse({
      email: formData.get("email"),
    });

    if (!validatedFields.success) {
      throw new ActionError(
        validatedFields.error.flatten().fieldErrors.toString(),
        ActionErrorCode.VALIDATION_ERROR
      );
    }

    const { email } = validatedFields.data;
    
    const result = await addUserEmails(user.id, email);
    
    if (!result.success || !result.data) {
      throw new ActionError(result.error || "Failed to add email", ActionErrorCode.DATABASE_ERROR);
    }

    revalidatePath("/app/chat/settings");
    return { success: true, data: result.data[0] }; // Return first email since we only added one
  } catch (error) {
    return handleActionError<UserEmail>(error);
  }
}

const DeleteEmailSchema = z.object({
  emailId: z.string().trim().min(1, "Email ID cannot be empty"),
});

export async function deleteUserEmail(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);

    const validatedFields = DeleteEmailSchema.safeParse({
      emailId: formData.get("emailId"),
    });

    if (!validatedFields.success) {
      throw new ActionError(
        validatedFields.error.flatten().fieldErrors.toString(),
        ActionErrorCode.VALIDATION_ERROR
      );
    }

    const { emailId } = validatedFields.data;

    // Check if the email exists and belongs to the user
    const { data: emailToDelete, error: fetchError } = await supabase
      .from("user_emails")
      .select("id")
      .eq("id", emailId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      throw new ActionError("Email not found", ActionErrorCode.NOT_FOUND);
    }

    // Proceed with deletion (removed primary email check)
    const { error } = await supabase
      .from("user_emails")
      .delete()
      .eq("id", emailId)
      .eq("user_id", user.id); // Ensure user owns the email

    if (error) {
      throw new ActionError("Failed to delete email", ActionErrorCode.DATABASE_ERROR);
    }

    revalidatePath("/app/chat/settings");
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Deletes a user's account and all associated data
 */
export async function deleteUserAccount(): Promise<ActionResponse> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);

    // --- START POSTHOG DELETION ---
    const posthogProjectId = process.env.POSTHOG_PROJECT_ID;
    const posthogApiKey = process.env.POSTHOG_PERSONAL_KEY;
    const posthogApiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (posthogProjectId && posthogApiKey) {
      console.log(`Attempting PostHog data deletion for user ID: ${user.id}, Email: ${user.email}`);
      const posthogHeaders = {
        'Authorization': `Bearer ${posthogApiKey}`,
        'Content-Type': 'application/json',
      };

      const personIdsToDelete = new Set<string>();

      // 1. Find person by Supabase User ID (as distinct_id)
      try {
        let distinctIdUrl: string;
        const distinctIdPath = `/api/projects/${posthogProjectId}/persons?distinct_id=${encodeURIComponent(user.id)}`;
        if (posthogApiHost.startsWith('http://') || posthogApiHost.startsWith('https://')) {
          distinctIdUrl = `${posthogApiHost}${distinctIdPath}`;
        } else {
          distinctIdUrl = `https://${posthogApiHost}${distinctIdPath}`;
        }
        console.log(`PostHog: Fetching person by distinct_id URL: ${distinctIdUrl}`);
        const distinctIdResponse = await fetch(distinctIdUrl, { headers: posthogHeaders });
        
        if (distinctIdResponse.ok) {
          const distinctIdData = await distinctIdResponse.json();
          if (distinctIdData.results && distinctIdData.results.length > 0) {
            distinctIdData.results.forEach((person: any) => {
              if (person.id) {
                personIdsToDelete.add(person.id);
                console.log(`Found PostHog person ${person.id} by distinct_id ${user.id}`);
              }
            });
          }
        } else {
          console.error(`Failed to fetch PostHog person by distinct_id ${user.id}: ${distinctIdResponse.status} ${distinctIdResponse.statusText}`, await distinctIdResponse.text());
        }
      } catch (error) {
        console.error(`Error fetching PostHog person by distinct_id ${user.id}:`, error);
      }

      // 2. Find person by email (if email exists)
      if (user.email) {
        try {
          let emailUrl: string;
          const emailPath = `/api/projects/${posthogProjectId}/persons?email=${encodeURIComponent(user.email)}`;
          if (posthogApiHost.startsWith('http://') || posthogApiHost.startsWith('https://')) {
            emailUrl = `${posthogApiHost}${emailPath}`;
          } else {
            emailUrl = `https://${posthogApiHost}${emailPath}`;
          }
          console.log(`PostHog: Fetching person by email URL: ${emailUrl}`);
          const emailResponse = await fetch(emailUrl, { headers: posthogHeaders });

          if (emailResponse.ok) {
            const emailData = await emailResponse.json();
            if (emailData.results && emailData.results.length > 0) {
              emailData.results.forEach((person: any) => {
                if (person.id) {
                  personIdsToDelete.add(person.id);
                  console.log(`Found PostHog person ${person.id} by email ${user.email}`);
                }
              });
            }
          } else {
            console.error(`Failed to fetch PostHog person by email ${user.email}: ${emailResponse.status} ${emailResponse.statusText}`, await emailResponse.text());
          }
        } catch (error) {
          console.error(`Error fetching PostHog person by email ${user.email}:`, error);
        }
      } else {
        console.log(`User email not available, skipping PostHog search by email for user ID: ${user.id}`);
      }

      // 3. Delete the identified persons
      if (personIdsToDelete.size > 0) {
        console.log(`Attempting to delete PostHog persons: ${Array.from(personIdsToDelete).join(', ')}`);
        for (const personId of Array.from(personIdsToDelete)) {
          try {
            // According to PostHog docs, delete_events=true is a query parameter
            let deleteUrl: string;
            const deletePath = `/api/projects/${posthogProjectId}/persons/${personId}?delete_events=true`;
            if (posthogApiHost.startsWith('http://') || posthogApiHost.startsWith('https://')) {
              deleteUrl = `${posthogApiHost}${deletePath}`;
            } else {
              deleteUrl = `https://${posthogApiHost}${deletePath}`;
            }
            console.log(`PostHog: Deleting person URL: ${deleteUrl}`);
            const deleteResponse = await fetch(deleteUrl, { method: 'DELETE', headers: posthogHeaders });
            
            if (deleteResponse.ok) {
              console.log(`Successfully deleted PostHog person ${personId} and their events.`);
            } else if (deleteResponse.status === 404) {
              console.log(`PostHog person ${personId} not found for deletion (may have already been deleted).`);
            } else {
              console.error(`Failed to delete PostHog person ${personId}: ${deleteResponse.status} ${deleteResponse.statusText}`, await deleteResponse.text());
            }
          } catch (error) {
            console.error(`Error deleting PostHog person ${personId}:`, error);
          }
        }
      } else {
        console.log(`No PostHog person found for Supabase user ${user.id} (distinct_id) or email ${user.email}.`);
      }
    } else {
      console.warn("PostHog Project ID or API Key not configured in environment variables (POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_KEY). Skipping PostHog data deletion.");
    }
    // --- END POSTHOG DELETION ---

    // Check if user has an active Plus subscription that needs to be canceled
    const { data: subscriptionData } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("plan_type", "plus")
      .maybeSingle();

    // Cancel Lemon Squeezy subscription if it exists
    if (subscriptionData?.lemon_squeezy_subscription_id) {
      try {
        const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionData.lemon_squeezy_subscription_id}`, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
            'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`
          }
        });

        if (!response.ok) {
          console.error("Failed to cancel Lemon Squeezy subscription:", await response.text());
        }
      } catch (error) {
        console.error("Error canceling Lemon Squeezy subscription:", error);
        // Continue with account deletion even if subscription cancellation fails
      }
    }

    // 0. Revoke Google OAuth access
    console.log(`Attempting to revoke Google tokens for user ID: ${user.id}`);
    const revokeResult = await revokeGoogleTokens(user.id);
    console.log(`Google token revocation result for user ID ${user.id}:`, revokeResult);
    if (!revokeResult.success) {
      console.error("Failed to revoke Google tokens:", revokeResult.error, revokeResult.details);
    }

    // 1. Delete all files from Google Cloud Storage
    await deleteUserFiles(user.id);

    // 2. Delete the user from the users table which will trigger the cascade deletion
    // This will activate our trigger function to clean up related tables
    const { error: dbError } = await supabase
      .from("users")
      .delete()
      .eq("id", user.id);
    
    if (dbError) {
      throw new ActionError("Failed to delete user data", ActionErrorCode.DATABASE_ERROR);
    }

    // Create an admin client for auth operations
    const adminClient = createServerClient(
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

    // 3. Finally, delete the user's auth record
    const { error: authError } = await adminClient.auth.admin.deleteUser(user.id);
    if (authError) {
      throw new ActionError("Failed to delete user authentication record", ActionErrorCode.DATABASE_ERROR);
    }

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Deletes all user files from Google Cloud Storage
 */
async function deleteUserFiles(userId: string): Promise<void> {
  try {
    const credentials = {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      project_id: process.env.GCP_PROJECT_ID,
    }

    // Initialize Google Cloud Storage
    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials
    });

    const bucketName = process.env.GCS_BUCKET_NAME || 'calendar-ai-attachments';
    const bucket = storage.bucket(bucketName);
    
    // Delete all files in the user's folder
    const userPrefix = `users/${userId}/`;
    
    // List all files with the user's prefix
    const [files] = await bucket.getFiles({ prefix: userPrefix });
    
    // Delete each file
    const deletePromises = files.map(file => file.delete());
    await Promise.all(deletePromises);
    
    console.log(`Deleted ${files.length} files for user ${userId}`);
  } catch (error) {
    console.error("Error deleting user files:", error);
    throw new ActionError("Failed to delete user files", ActionErrorCode.DATABASE_ERROR);
  }
}

const ResendVerificationSchema = z.object({
  emailId: z.string().trim().min(1, "Email ID cannot be empty"),
});

export async function resendVerificationEmail(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();
  
  try {
    const user = await requireAuth(supabase);

    const validatedFields = ResendVerificationSchema.safeParse({
      emailId: formData.get("emailId"),
    });

    if (!validatedFields.success) {
      throw new ActionError(
        validatedFields.error.flatten().fieldErrors.toString(),
        ActionErrorCode.VALIDATION_ERROR
      );
    }

    const { emailId } = validatedFields.data;

    // Call the action to resend verification email
    const result = await resendVerificationEmailAction(user.id, emailId);
    
    if (!result.success) {
      throw new ActionError(result.error || "Failed to resend verification email", 
        result.code || ActionErrorCode.UNKNOWN_ERROR);
    }

    revalidatePath("/app/chat/settings");
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
