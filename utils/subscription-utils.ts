import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

/**
 * Checks if a user has a plus subscription using RLS (for authenticated requests)
 * @param userId The user ID to check
 * @returns Boolean indicating if the user is a plus user
 */
export async function isProUser(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Call the is_pro_user function
    const { data, error } = await supabase.rpc('is_pro_user', {
      p_user_id: userId
    });
    
    if (error) {
      console.error("Error checking plus status:", error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error("Error in isProUser:", error);
    return false;
  }
}

/**
 * Checks if a user has a plus subscription using admin client (for webhook handlers)
 * @param userId The user ID to check
 * @returns Boolean indicating if the user is a plus user
 */
export async function isProUserAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    
    // Call the is_pro_user function
    const { data, error } = await supabase.rpc('is_pro_user', {
      p_user_id: userId
    });
    
    if (error) {
      console.error("Error checking plus status (admin):", error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error("Error in isProUserAdmin:", error);
    return false;
  }
}

/**
 * Checks if a user has exceeded their email event limit
 * @param userId The user ID to check
 * @returns Boolean indicating if the user can create more email events
 */
export async function checkEmailEventLimit(userId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    
    // Call the check_email_event_limit function
    const { data, error } = await supabase.rpc('check_email_event_limit', {
      p_user_id: userId
    });
    
    if (error) {
      console.error("Error checking email event limit:", error);
      return false;
    }
    
    // Check if the user has the ability to create events
    if (data === true) {
      // Additional check to see if they're at exactly 10 events (the limit is 10)
      // We need to count events directly here as a safeguard
      const { count, error: countError } = await supabase
        .from('email_event_usage')
        .select('*', { count: 'exact', head: false })
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        
      if (countError) {
        console.error("Error counting email events:", countError);
        return false;
      }
      
      // If they already have 10 events, they've reached the limit exactly
      if (count != null && count >= 10) {
        return false;
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error in checkEmailEventLimit:", error);
    return false;
  }
}

/**
 * Records an email-to-calendar event for usage tracking
 * @param userId The user ID
 * @param emailId The email message ID
 * @returns Boolean indicating if the record was created successfully
 */
export async function recordEmailEvent(userId: string, emailId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from('email_event_usage')
      .insert({
        user_id: userId,
        email_id: emailId
      });
    
    if (error) {
      console.error("Error recording email event:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in recordEmailEvent:", error);
    return false;
  }
}
