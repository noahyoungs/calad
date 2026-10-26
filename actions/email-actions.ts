import { createClient } from "@/utils/supabase/server";
import { createServerClient } from "@supabase/ssr";
import {
  ActionResponse,
  ActionError,
  ActionErrorCode,
  handleActionError,
  requireAuth,
} from "./types";
import { UserEmail } from "./settings-actions";
import { sendVerificationEmail, checkEmailRateLimit } from "@/utils/email/email-utils";
import { recordVerificationAttempt } from "@/utils/email-verification";
import PostHogClient from "@/utils/posthog";

/**
 * Validates and cleans up a list of email addresses
 */
function validateAndCleanEmails(emailInput: string): string[] {
  return emailInput
    .split(",")
    .map((email) => email.trim())
    .filter(
      (email) => email.length > 0 && email.includes("@") && email.includes(".")
    );
}

/**
 * Check if any emails already exist in the system using admin client to bypass RLS
 */
async function checkExistingEmails(emails: string[]): Promise<string[]> {
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: existingEmails } = await adminClient
    .from("user_emails")
    .select("email")
    .in("email", emails);

  console.debug("Checked for existing emails:", {
    checked: emails,
    existing: existingEmails?.map((e) => e.email) || [],
  });

  return existingEmails?.map((e) => e.email) || [];
}

/**
 * Adds one or more email addresses to a user's account
 * @param userId The ID of the user to add emails for
 * @param emailInput A comma-separated string of email addresses or a single email address
 * @param userName Optional user name for the verification email
 * @returns ActionResponse containing the added email records
 */
export async function addUserEmails(
  userId: string,
  emailInput: string,
  userName?: string
): Promise<ActionResponse<UserEmail[]>> {
  const supabase = await createClient();

  console.debug(
    "Adding emails for user",
    userId,
    "with email input",
    emailInput
  );

  // check auth
  const user = await requireAuth(supabase);
  // make sure user id matches
  if (user.id !== userId) {
    throw new ActionError("Unauthorized", ActionErrorCode.UNAUTHORIZED);
  }

  try {
    // Validate and clean up emails
    const validEmails = validateAndCleanEmails(emailInput);
    console.debug("Validated emails:", validEmails);

    if (validEmails.length === 0) {
      throw new ActionError(
        "No valid email addresses provided",
        ActionErrorCode.VALIDATION_ERROR
      );
    }

    // Check for existing emails using admin client before attempting to insert
    const existingEmails = await checkExistingEmails(validEmails);
    const newEmails = validEmails.filter(
      (email) => !existingEmails.includes(email)
    );

    console.debug("Email validation results:", {
      validEmails,
      existingEmails,
      newEmails,
    });

    if (existingEmails.length > 0) {
      const message = `These emails are already registered:\n- ${existingEmails.join(", ")}\nPlease try again with different emails. No emails were added to the account.`;

      console.debug("Duplicate emails found:", {
        message,
        existingEmails,
        newEmails,
      });

      throw new ActionError(message, ActionErrorCode.VALIDATION_ERROR);
    }

    // Check rate limits for all emails before attempting to insert any
    const rateLimitChecks = await Promise.all(
      newEmails.map(async (email) => {
        const check = await checkEmailRateLimit(email);
        return { email, ...check };
      })
    );
    
    const rateLimitedEmails = rateLimitChecks
      .filter(check => check.isRateLimited)
      .map(check => {
        const hoursRemaining = Math.ceil((check.timeRemaining || 0) / (60 * 60 * 1000));
        return `${check.email} (cooldown: ~${hoursRemaining} hours)`;
      });
    
    // If any emails are rate limited, throw an error and don't add any emails
    if (rateLimitedEmails.length > 0) {
      const message = `The following emails have received too many verification attempts:\n- ${rateLimitedEmails.join("\n- ")}\n\nPlease try again later or use different email addresses. No emails were added to the account.`;
      
      console.debug("Rate limited emails:", {
        message,
        rateLimitedEmails,
      });

      // Capture PostHog event
      const posthogClient = PostHogClient();
      posthogClient.capture({
        distinctId: userId,
        event: "email_rate_limit_hit",
        properties: {
          source: "addUserEmails",
          rate_limited_emails: rateLimitedEmails.map(email => email.split(" (cooldown")[0]), // Extract just the email
          // It might be useful to log the full rateLimitedEmails array with cooldowns too
          // raw_rate_limited_info: rateLimitedEmails
        },
      });
      await posthogClient.shutdown(); // Ensure events are flushed
      
      throw new ActionError(message, ActionErrorCode.RATE_LIMITED);
    }

    // If isFirstEmail is not provided, check if this is the first email
    const { count, error: countError } = await supabase
      .from("user_emails")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      console.error("Error counting existing emails:", countError);
      throw new ActionError(
        "Failed to count emails",
        ActionErrorCode.DATABASE_ERROR
      );
    }

    const isFirstEmail = count === 0;
    console.debug("Checked if first email:", { count, isFirstEmail });

    // Prepare email records for insertion
    const emailRecords = newEmails.map((email, index) => ({
      user_id: userId,
      email: email,
      is_primary: isFirstEmail && index === 0, // Make the first email primary if it's the first one
    }));

    console.debug("Preparing to insert emails:", emailRecords);

    // Insert all emails at once
    const { data: addedEmails, error } = await supabase
      .from("user_emails")
      .insert(emailRecords)
      .select();

    if (error) {
      console.error("Error adding emails:", {
        error,
        errorCode: error.code,
        details: error.details,
        hint: error.hint,
        userId,
        emails: newEmails,
      });

      throw new ActionError(
        "Failed to add emails",
        ActionErrorCode.DATABASE_ERROR
      );
    }

    console.debug("Successfully added emails:", addedEmails);

    // Send verification emails for all added emails
    const verificationPromises = addedEmails.map(async (emailRecord) => {
      try {
        // Get user's name if not provided
        if (userName === undefined) {
          const { data: userData } = await supabase
            .from("users")
            .select("name")
            .eq("id", userId)
            .single();

          userName = userData?.name;
        }

        // Send verification email
        await sendVerificationEmail(
          emailRecord.email,
          userId,
          userName
        );
        
        // Record the verification attempt for rate limiting
        await recordVerificationAttempt(emailRecord.email);
        
        console.debug("Sent verification email to:", emailRecord.email);
      } catch (error) {
        console.error(
          `Failed to send verification email to ${emailRecord.email}:`,
          error
        );
      }
    });

    // Wait for all verification emails to be sent
    await Promise.all(verificationPromises);

    const response = { success: true, data: addedEmails };
    
    console.debug("Returning success response:", response);
    return response;
  } catch (error) {
    console.error("Error adding emails:", error);
    return handleActionError<UserEmail[]>(error);
  }
}

/**
 * Resends a verification email to a user's email address
 * @param userId The ID of the user
 * @param emailId The ID of the email to verify
 * @returns ActionResponse indicating success or failure
 */
export async function resendVerificationEmail(
  userId: string,
  emailId: string
): Promise<ActionResponse> {
  const supabase = await createClient();

  console.debug("Resending verification email for user", userId, "with email ID", emailId);

  // check auth
  const user = await requireAuth(supabase);
  // make sure user id matches
  if (user.id !== userId) {
    throw new ActionError("Unauthorized", ActionErrorCode.UNAUTHORIZED);
  }

  try {
    // Get the email record
    const { data: emailRecord, error: emailError } = await supabase
      .from("user_emails")
      .select("*")
      .eq("id", emailId)
      .eq("user_id", userId)
      .single();

    if (emailError || !emailRecord) {
      console.error("Error finding email record:", emailError);
      throw new ActionError(
        "Email not found",
        ActionErrorCode.NOT_FOUND
      );
    }

    // If email is already verified, return error
    if (emailRecord.is_verified) {
      throw new ActionError(
        "This email is already verified",
        ActionErrorCode.VALIDATION_ERROR
      );
    }

    // Check rate limit before sending
    const rateLimitCheck = await checkEmailRateLimit(emailRecord.email);
    
    if (rateLimitCheck.isRateLimited) {
      const hoursRemaining = Math.ceil((rateLimitCheck.timeRemaining || 0) / (60 * 60 * 1000));
      const message = `This email has received too many verification attempts. Please try again in approximately ${hoursRemaining} hours.`;
      
      console.debug("Rate limited email:", {
        message,
        email: emailRecord.email,
      });

      // Capture PostHog event
      const posthogClient = PostHogClient();
      posthogClient.capture({
        distinctId: userId,
        event: "email_rate_limit_hit",
        properties: {
          source: "resendVerificationEmail",
          rate_limited_email: emailRecord.email,
        },
      });
      await posthogClient.shutdown(); // Ensure events are flushed
      
      throw new ActionError(message, ActionErrorCode.RATE_LIMITED);
    }

    // Get user's name
    const { data: userData } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    const userName = userData?.name;

    // Send verification email
    await sendVerificationEmail(
      emailRecord.email,
      userId,
      userName
    );
    
    // Record the verification attempt for rate limiting
    await recordVerificationAttempt(emailRecord.email);
    
    console.debug("Successfully resent verification email to:", emailRecord.email);

    return { success: true };
  } catch (error) {
    console.error("Error resending verification email:", error);
    return handleActionError(error);
  }
}
