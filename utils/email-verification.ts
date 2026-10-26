import { Redis } from '@upstash/redis'
import { EMAIL_VERIFICATION_RATE_LIMITS } from './email/config'

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.REDIS_URL || process.env.KV_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
})

const WINDOW_SECONDS = EMAIL_VERIFICATION_RATE_LIMITS.TIME_WINDOW_HOURS * 60 * 60;

export async function canVerifyEmail(email: string): Promise<{ allowed: boolean; timeRemaining?: number }> {
  const attemptsKey = `email-verification:${email}:attempts`;
  const firstAttemptKey = `email-verification:${email}:first-attempt`;
  
  // Get current count and first attempt time
  const [count, firstAttempt] = await Promise.all([
    redis.get<number>(attemptsKey),
    redis.get<number>(firstAttemptKey)
  ]);
  
  const now = Date.now();
  
  // If first attempt or window expired, allow and reset
  if (!count || !firstAttempt) {
    await Promise.all([
      redis.setex(attemptsKey, WINDOW_SECONDS, 1),
      redis.setex(firstAttemptKey, WINDOW_SECONDS, now)
    ]);
    return { allowed: true };
  }
  
  // Check if within attempt limit
  if (Number(count) >= EMAIL_VERIFICATION_RATE_LIMITS.MAX_ATTEMPTS_PER_EMAIL) {
    return { 
      allowed: false,
      timeRemaining: EMAIL_VERIFICATION_RATE_LIMITS.COOLDOWN_HOURS * 60 * 60 * 1000
    };
  }
  
  // Increment attempt count
  await redis.incrby(attemptsKey, 1);
  return { allowed: true };
}

export async function recordVerificationAttempt(email: string): Promise<void> {
  const attemptsKey = `email-verification:${email}:attempts`;
  const firstAttemptKey = `email-verification:${email}:first-attempt`;
  const now = Date.now();
  
  // Initialize or increment attempts
  const count = await redis.get<number>(attemptsKey);
  if (!count) {
    await Promise.all([
      redis.setex(attemptsKey, WINDOW_SECONDS, 1),
      redis.setex(firstAttemptKey, WINDOW_SECONDS, now)
    ]);
  } else {
    await redis.incrby(attemptsKey, 1);
  }
}

export async function getVerificationAttempts(email: string): Promise<number> {
  const attemptsKey = `email-verification:${email}:attempts`;
  const count = await redis.get<number>(attemptsKey);
  return count || 0;
}

export async function resetVerificationAttempts(email: string): Promise<void> {
  const attemptsKey = `email-verification:${email}:attempts`;
  const firstAttemptKey = `email-verification:${email}:first-attempt`;
  await Promise.all([
    redis.del(attemptsKey),
    redis.del(firstAttemptKey)
  ]);
} 