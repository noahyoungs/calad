# Email Verification Rate Limiting

This document describes the rate limiting system implemented to prevent email verification spam.

## Overview

To prevent abuse of the email verification system (where someone could repeatedly add and remove an email address to spam verification emails), we've implemented a time-based rate limiting mechanism.

## How It Works

1. Before adding any new emails to a user's account, the system checks if any of the emails have exceeded the rate limit
2. If any email is rate limited, the entire operation is rejected with a `RATE_LIMITED` error code
3. Each time a verification email is sent, a record is created in the `email_verification_attempts` table
4. A cooldown period must pass before an email that has reached the limit can be added again

## Configuration

The rate limiting parameters are defined in `utils/email/config.ts`:

```typescript
export const EMAIL_VERIFICATION_RATE_LIMITS = {
  MAX_ATTEMPTS_PER_EMAIL: 3, // Maximum verification attempts per email in the time window
  TIME_WINDOW_HOURS: 24,     // Time window in hours (rolling window)
  COOLDOWN_HOURS: 24,        // Cooldown period after reaching the limit
};
```

These parameters can be adjusted based on your needs:
- `MAX_ATTEMPTS_PER_EMAIL`: How many emails can be sent in the time window
- `TIME_WINDOW_HOURS`: The rolling time window during which attempts are counted
- `COOLDOWN_HOURS`: How long an email must wait after being rate limited

## Implementation

The rate limiting system is implemented through utility functions in `utils/email/email-utils.ts`:

```typescript
// Check if an email has reached the rate limit
export async function checkEmailRateLimit(email: string): Promise<{ isRateLimited: boolean; timeRemaining?: number }>

// Record a verification attempt for rate limiting
export async function recordVerificationAttempt(email: string): Promise<void>
```

These functions are used in the `addUserEmails` function in `actions/email-actions.ts` to check rate limits before adding any emails.

## Atomic Operation

The rate limiting check is atomic - if any email in a batch is rate limited, the entire operation fails. This prevents users from circumventing the rate limit by mixing rate-limited emails with new ones.

The flow works as follows:
1. Check if any emails are already registered (existing behavior)
2. Check if any emails are rate limited (new behavior)
3. Only if all emails pass both checks will they be added to the user's account

## Database Structure

The `email_verification_attempts` table tracks each verification attempt:

```sql
CREATE TABLE IF NOT EXISTS public.email_verification_attempts (
  id TEXT PRIMARY KEY DEFAULT cuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT email_verification_attempts_email_idx UNIQUE (email, created_at)
);
```

## Automatic Cleanup

To prevent the verification attempts table from growing too large, we've implemented automatic cleanup:

```sql
CREATE OR REPLACE FUNCTION cleanup_old_verification_attempts()
RETURNS void AS $$
BEGIN
  -- Delete attempts older than 30 days
  DELETE FROM public.email_verification_attempts
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

A scheduled job runs this cleanup daily at 3 AM (requires pg_cron extension).

## User Experience

When a user tries to add an email that's been rate limited, they'll receive an error message explaining the situation:

```
The following emails have received too many verification attempts recently and are temporarily rate limited:
- example@example.com (cooldown: ~24 hours)

Please try again later or use different email addresses.
```

None of the emails will be added to their account, and they need to wait until the cooldown period ends or use different email addresses.

## Testing the Rate Limiting

To test the rate limiting system:

1. Add the same email address multiple times (beyond the maximum attempts)
2. Try to add the email again and verify it is rejected
3. Try to add a batch of emails containing both rate-limited and non-rate-limited emails, and verify the entire batch is rejected
4. Wait for the cooldown period to end and verify that the email can be added again 