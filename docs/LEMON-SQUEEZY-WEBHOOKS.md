# Lemon Squeezy Webhooks Integration

This document describes how the Lemon Squeezy webhooks are integrated with the application to handle subscription events.

## Overview

Lemon Squeezy is used as the payment processor for subscription management. When a user subscribes, updates, or cancels their subscription in Lemon Squeezy, webhook events are sent to our application to update the user's subscription status in our database.

## Webhook Endpoint

The webhook endpoint is located at:

```
/api/webhooks/lemon-squeezy
```

This endpoint handles all webhook events from Lemon Squeezy.

## Webhook Events Handled

The following webhook events are handled:

- `subscription_created`: When a user subscribes to a plan
- `subscription_updated`: When a subscription is updated
- `subscription_cancelled`: When a user cancels their subscription
- `subscription_resumed`: When a user resumes a cancelled subscription
- `subscription_expired`: When a subscription expires
- `order_created`: When a new order is created

## Webhook Signature Verification

All webhook requests from Lemon Squeezy are signed with an HMAC signature. The signature is verified using the `LEMON_SQUEEZY_SIGNING_SECRET` environment variable.

```typescript
function verifyLemonSqueezySignature(payload: string, signature: string | null): boolean {
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
```

## Database Schema

Subscription data is stored in the `subscriptions` table in the database. The table has the following structure:

```sql
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY DEFAULT cuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  lemon_squeezy_customer_id TEXT,
  lemon_squeezy_subscription_id TEXT,
  lemon_squeezy_order_id TEXT,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_user_subscription UNIQUE (user_id)
);
```

## Utility Functions

The following utility functions are available for working with subscriptions:

- `isProUser(userId: string)`: Checks if a user has a pro subscription
- `checkEmailEventLimit(userId: string)`: Checks if a user has exceeded their email event limit
- `recordEmailEvent(userId: string, emailId: string)`: Records an email-to-calendar event for usage tracking
- `getUserSubscription(userId: string)`: Gets a user's subscription details
- `formatSubscriptionStatus(subscription: any)`: Formats a subscription status for display
- `getDaysRemaining(subscription: any)`: Gets the number of days remaining in a subscription

## Setting Up Lemon Squeezy Webhooks

To set up Lemon Squeezy webhooks:

1. Log in to your Lemon Squeezy account
2. Go to Settings > Webhooks
3. Click "Add Webhook"
4. Enter your webhook URL: `https://your-domain.com/api/webhooks/lemon-squeezy`
5. Select the following events:
   - `subscription_created`: When a new subscription is created
   - `subscription_updated`: When a subscription is updated
   - `subscription_cancelled`: When a subscription is cancelled
   - `subscription_resumed`: When a cancelled subscription is resumed
   - `subscription_expired`: When a subscription expires
   - `order_created`: When a new order is created
6. Save the webhook
7. Copy the signing secret and set it as the `LEMON_SQUEEZY_SIGNING_SECRET` environment variable in your application

> **Important**: Make sure your middleware is configured to exclude the webhook endpoint from authentication checks. The webhook endpoint should be accessible without authentication since Lemon Squeezy will not provide authentication credentials.

## Testing Webhooks

You can test webhooks locally using tools like [ngrok](https://ngrok.com/) to create a public URL that forwards to your local development server.

1. Start your local development server
2. Start ngrok: `ngrok http 3000`
3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
4. Set up a webhook in Lemon Squeezy using the ngrok URL: `https://abc123.ngrok.io/api/webhooks/lemon-squeezy`
5. Trigger webhook events in Lemon Squeezy (e.g., create a test subscription)
6. Check your local server logs to see the webhook events being processed

## Troubleshooting

If webhooks are not being processed correctly, check the following:

1. Make sure the `LEMON_SQUEEZY_SIGNING_SECRET` environment variable is set correctly
2. Check the server logs for any errors in the webhook handler
3. Verify that the webhook URL is correct in Lemon Squeezy
4. Check that the webhook events you want to receive are selected in Lemon Squeezy
5. If using ngrok for local testing, make sure ngrok is running and the URL is correct
