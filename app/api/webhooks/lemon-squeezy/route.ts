import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from "next/server";
import { verifyLemonSqueezySignature } from "@/utils/lemon-squeezy-utils";
import { PostHog } from 'posthog-node';

// Initialize PostHog Client
const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  flushAt: 1,
  flushInterval: 0,
});

/**
 * Handles webhook events from Lemon Squeezy
 * 
 * Events handled:
 * - subscription_created: When a user subscribes to a plan
 * - subscription_updated: When a subscription is updated
 * - subscription_cancelled: When a user cancels their subscription
 * - subscription_resumed: When a user resumes a cancelled subscription
 * - subscription_expired: When a subscription expires
 * - order_created: When a new order is created
 */
export async function POST(req: NextRequest) {
  try {
    // Get the raw request body as text for signature verification
    const rawBody = await req.text();
    
    // Verify the webhook signature
    const signature = req.headers.get("x-signature");
    if (!verifyLemonSqueezySignature(rawBody, signature)) {
      console.error("Invalid Lemon Squeezy webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    
    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    const { meta, data } = payload;
    const eventName = meta.event_name;
    
    console.log(`Processing Lemon Squeezy webhook: ${eventName}`);
    
    // Handle different event types
    switch (eventName) {
      case "subscription_created":
        await handleSubscriptionCreated(data, meta);
        break;
      case "subscription_updated":
        await handleSubscriptionUpdated(data, meta);
        break;
      case "subscription_cancelled":
        await handleSubscriptionCancelled(data);
        break;
      case "subscription_resumed":
        await handleSubscriptionResumed(data);
        break;
      case "subscription_expired":
        await handleSubscriptionExpired(data);
        break;
      case "order_created":
        await handleOrderCreated(data);
        break;
      default:
        console.log(`Unhandled Lemon Squeezy event: ${eventName}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lemon Squeezy webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


/**
 * Handles the subscription_created event
 * 
 * @param data The webhook event data
 * @param meta The webhook meta data
 */
async function handleSubscriptionCreated(data: any, meta: any) {
  const adminClient = createAdminClient();
  
  try {
    // Extract subscription data
    const attributes = data.attributes;
    console.log('Subscription attributes:', JSON.stringify(attributes, null, 2));
    
    const customerId = attributes.customer_id;
    const subscriptionId = data.id;
    const orderId = attributes.order_id;
    const startsAt = attributes.renews_at || attributes.created_at;
    const endsAt = attributes.ends_at;
    const status = attributes.status; // active, cancelled, expired, etc.
    const customerPortalUrl = attributes.urls?.customer_portal;
    const variantId = attributes.variant_id;
    
    // Get customer email and custom data
    let userEmail = attributes.user_email || null;
    let providedUserId = null;

    // Get custom data from meta object
    try {
      const customData = meta?.custom_data;
      console.log('Custom data from meta:', customData);
      
      if (customData && typeof customData === 'object' && customData.user_id) {
        providedUserId = customData.user_id;
      }
    } catch (error) {
      console.error("Error accessing custom_data:", error);
    }
    
    // Log the data we received
    console.log('Processing subscription creation:', {
      subscriptionId,
      customerId,
      userEmail,
      providedUserId,
      status,
      customData: meta?.custom_data
    });

    if (!providedUserId) {
      console.error("No user ID found in custom_data");
      return;
    }

    // First check if the user exists in auth.users using admin client
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(providedUserId);
    
    if (authError || !authUser?.user) {
      console.error("User not found in auth.users:", providedUserId, authError);
      return;
    }

    // Then check if the user exists in public.users, create if not
    const { data: publicUser, error: publicUserError } = await adminClient
      .from("users")
      .select("id")
      .eq("id", providedUserId)
      .single();

    if (publicUserError && publicUserError.code === 'PGRST116') {
      // User doesn't exist in public.users, create them
      const { error: insertError } = await adminClient
        .from("users")
        .insert({ 
          id: providedUserId,
          onboarding_completed: false
        });

      if (insertError) {
        console.error("Error creating user record:", insertError);
        return;
      }
      console.log("Created user record in public.users");
    } else if (publicUserError) {
      console.error("Error checking public.users:", publicUserError);
      return;
    }

    // If we have an email, verify it belongs to the user as a secondary check
    if (userEmail) {
      const { data: userEmails, error: emailError } = await adminClient
        .from("user_emails")
        .select("user_id")
        .eq("email", userEmail)
        .eq("user_id", providedUserId);

      if (emailError) {
        console.error("Error verifying user email:", emailError);
      } else if (!userEmails || userEmails.length === 0) {
        console.warn("Email verification failed - email may be different than registered:", userEmail);
      }
    }
    
    // Update or insert subscription record using admin client
    const { error: upsertError } = await adminClient
      .from("subscriptions")
      .upsert({
        user_id: providedUserId,
        plan_type: "plus",
        product_id: process.env.LEMON_SQUEEZY_PRODUCT_ID,
        variant_id: variantId,
        is_active: status === "active",
        lemon_squeezy_customer_id: customerId,
        lemon_squeezy_subscription_id: subscriptionId,
        lemon_squeezy_order_id: orderId,
        subscription_start_date: startsAt,
        subscription_end_date: endsAt,
        customer_portal_url: customerPortalUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });
    
    if (upsertError) {
      console.error("Error updating subscription:", upsertError);
    } else {
      console.log(`Subscription created/updated for user ${providedUserId}`);
      if (posthogClient && providedUserId) {
        posthogClient.capture({
          distinctId: providedUserId,
          event: 'subscription_created',
          properties: {
            plan_type: "plus", // Assuming "plus" as per existing logic
            variant_id: variantId,
            status: status,
          }
        });
        await posthogClient.flush();
      }
    }
  } catch (error) {
    console.error("Error handling subscription_created:", error);
  }
}

/**
 * Handles the subscription_updated event
 * 
 * @param data The webhook event data
 * @param meta The webhook meta data
 */
async function handleSubscriptionUpdated(data: any, meta: any) {
  const adminClient = createAdminClient();
  
  try {
    // Extract subscription data
    const attributes = data.attributes;
    const subscriptionId = data.id;
    const status = attributes.status;
    const startsAt = attributes.renews_at || attributes.created_at;
    const endsAt = attributes.ends_at; // This might be a string date
    const customerPortalUrl = attributes.urls?.customer_portal;
    
    // Log the update attempt
    console.log('Processing subscription update:', {
      subscriptionId,
      status,
      startsAt,
      endsAt,
      rawAttributes: attributes // Log raw attributes for debugging
    });
    
    // Determine active status more carefully
    let calculatedIsActive = status === "active";
    if (status === "cancelled" && endsAt) {
      if (new Date(endsAt) > new Date()) {
        calculatedIsActive = true;
      }
    }
    // Add other statuses that should make it definitively inactive if necessary
    // For example, "expired", "unpaid"
    if (status === "expired" || status === "unpaid") {
        calculatedIsActive = false;
    }

    // Try to get user_id from custom_data if available
    let providedUserId = null;
    try {
      if (attributes.custom_data) {
        const customData = typeof attributes.custom_data === 'string'
          ? JSON.parse(attributes.custom_data)
          : attributes.custom_data;
        providedUserId = customData.user_id;
      }
    } catch (error) {
      console.error("Error parsing custom_data in update:", error);
    }
    
    // Find the subscription by Lemon Squeezy subscription ID
    const { data: subscriptionData, error: subscriptionError } = await adminClient
      .from("subscriptions")
      .select("id, user_id, plan_type")
      .eq("lemon_squeezy_subscription_id", subscriptionId)
      .single();
    
    if (subscriptionError) {
      console.error("Error finding subscription:", subscriptionError);
      
      // If we have a user ID from custom data, try to update by user ID
      if (providedUserId) {
        console.log("Attempting to update subscription by user ID:", providedUserId);
        const { error: updateByUserError } = await adminClient
          .from("subscriptions")
          .update({
            is_active: calculatedIsActive,
            subscription_start_date: startsAt,
            subscription_end_date: endsAt,
            customer_portal_url: customerPortalUrl,
            lemon_squeezy_subscription_id: subscriptionId,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", providedUserId);
        
        if (updateByUserError) {
          console.error("Error updating subscription by user ID:", updateByUserError);
        } else {
          console.log(`Subscription updated for user ${providedUserId} by user ID`);
        }
      }
      return;
    }
    
    if (!subscriptionData) {
      console.error("Subscription not found for ID:", subscriptionId);
      return;
    }
    
    // Update the subscription record
    const { error: updateError } = await adminClient
      .from("subscriptions")
      .update({
        is_active: calculatedIsActive,
        subscription_start_date: startsAt,
        subscription_end_date: endsAt,
        customer_portal_url: customerPortalUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", subscriptionData.id);
    
    if (updateError) {
      console.error("Error updating subscription:", updateError);
    } else {
      console.log(`Subscription updated for user ${subscriptionData.user_id}:`, {
        subscriptionId,
        status,
        planType: subscriptionData.plan_type
      });
      if (posthogClient && subscriptionData?.user_id) {
        posthogClient.capture({
          distinctId: subscriptionData.user_id,
          event: 'subscription_updated',
          properties: {
            status: status,
            plan_type: subscriptionData.plan_type,
          }
        });
        await posthogClient.flush();
      }
    }
  } catch (error) {
    console.error("Error handling subscription_updated:", error);
  }
}

/**
 * Handles the subscription_cancelled event
 * 
 * @param data The webhook event data
 */
async function handleSubscriptionCancelled(data: any) {
  const adminClient = createAdminClient();
  
  try {
    // Extract subscription data
    const subscriptionId = data.id;
    const endsAt = data.attributes.ends_at;
    
    // Find the subscription by Lemon Squeezy subscription ID
    const { data: subscriptionData, error: subscriptionError } = await adminClient
      .from("subscriptions")
      .select("id, user_id")
      .eq("lemon_squeezy_subscription_id", subscriptionId)
      .single();
    
    if (subscriptionError || !subscriptionData) {
      console.error("Subscription not found:", subscriptionError);
      return;
    }
    
    // Update the subscription record
    // Note: We don't set is_active to false immediately because the subscription
    // is still active until the end date
    const { error } = await adminClient
      .from("subscriptions")
      .update({
        subscription_end_date: endsAt,
        updated_at: new Date().toISOString()
      })
      .eq("id", subscriptionData.id);
    
    if (error) {
      console.error("Error updating subscription:", error);
    } else {
      console.log(`Subscription cancelled for user ${subscriptionData.user_id}, ends at ${endsAt}`);
      if (posthogClient && subscriptionData?.user_id) {
        posthogClient.capture({
          distinctId: subscriptionData.user_id,
          event: 'subscription_cancelled',
          properties: {
            ends_at: endsAt,
          }
        });
        await posthogClient.flush();
      }
    }
  } catch (error) {
    console.error("Error handling subscription_cancelled:", error);
  }
}

/**
 * Handles the subscription_resumed event
 * 
 * @param data The webhook event data
 */
async function handleSubscriptionResumed(data: any) {
  const adminClient = createAdminClient();
  
  try {
    // Extract subscription data
    const subscriptionId = data.id;
    const attributes = data.attributes;
    const startsAt = attributes.renews_at || attributes.created_at;
    const endsAt = attributes.ends_at;
    const customerPortalUrl = attributes.urls?.customer_portal;
    
    // Find the subscription by Lemon Squeezy subscription ID
    const { data: subscriptionData, error: subscriptionError } = await adminClient
      .from("subscriptions")
      .select("id, user_id")
      .eq("lemon_squeezy_subscription_id", subscriptionId)
      .single();
    
    if (subscriptionError || !subscriptionData) {
      console.error("Subscription not found:", subscriptionError);
      return;
    }
    
    // Update the subscription record
    const { error } = await adminClient
      .from("subscriptions")
      .update({
        is_active: true,
        subscription_start_date: startsAt,
        subscription_end_date: endsAt,
        customer_portal_url: customerPortalUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", subscriptionData.id);
    
    if (error) {
      console.error("Error updating subscription:", error);
    } else {
      console.log(`Subscription resumed for user ${subscriptionData.user_id}`);
      if (posthogClient && subscriptionData?.user_id) {
        posthogClient.capture({
          distinctId: subscriptionData.user_id,
          event: 'subscription_resumed',
          properties: {
            // Assuming plan_type remains the same or is not critical here
            // Add if necessary based on actual resume behavior
          }
        });
        await posthogClient.flush();
      }
    }
  } catch (error) {
    console.error("Error handling subscription_resumed:", error);
  }
}

/**
 * Handles the subscription_expired event
 * 
 * @param data The webhook event data
 */
async function handleSubscriptionExpired(data: any) {
  const adminClient = createAdminClient();
  
  try {
    // Extract subscription data
    const subscriptionId = data.id;
    
    // Find the subscription by Lemon Squeezy subscription ID
    const { data: subscriptionData, error: subscriptionError } = await adminClient
      .from("subscriptions")
      .select("id, user_id")
      .eq("lemon_squeezy_subscription_id", subscriptionId)
      .single();
    
    if (subscriptionError || !subscriptionData) {
      console.error("Subscription not found:", subscriptionError);
      return;
    }
    
    // Update the subscription record to revert to free plan
    const { error } = await adminClient
      .from("subscriptions")
      .update({
        is_active: true, // Keep active since they're on free plan now
        plan_type: "free",
        lemon_squeezy_customer_id: null,
        lemon_squeezy_subscription_id: null,
        lemon_squeezy_order_id: null,
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: null,
        customer_portal_url: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", subscriptionData.id);
    
    if (error) {
      console.error("Error updating subscription:", error);
    } else {
      console.log(`User ${subscriptionData.user_id} reverted to free plan after plus subscription expired`);
      if (posthogClient && subscriptionData?.user_id) {
        posthogClient.capture({
          distinctId: subscriptionData.user_id,
          event: 'subscription_expired',
          properties: {
            reverted_to_plan_type: "free",
          }
        });
        await posthogClient.flush();
      }
    }
  } catch (error) {
    console.error("Error handling subscription_expired:", error);
  }
}

/**
 * Handles the order_created event
 * 
 * @param data The webhook event data
 */
async function handleOrderCreated(data: any) {
  // For now, we'll just log the order creation
  // This could be expanded to handle one-time purchases or other order types
  console.log("Order created:", data.id);
}
