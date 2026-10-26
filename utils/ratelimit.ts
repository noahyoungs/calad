import { NextResponse } from "next/server";
import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.REDIS_URL || process.env.KV_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
})

export interface RateLimitConfig {
  max: number;      // Maximum number of requests
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export async function rateLimit(
  ip: string,
  path: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `ratelimit:${ip}:${path}`;
  
  // Use Redis transaction to ensure atomic operations
  const multi = redis.multi();
  
  // Get current count and TTL
  const [currentCount, ttl] = await Promise.all([
    redis.get<number>(key),
    redis.ttl(key)
  ]);
  
  let count = currentCount || 0;
  let resetAt = now + (ttl > 0 ? ttl * 1000 : config.windowMs);
  
  // If key doesn't exist or TTL expired, reset count and window
  if (!currentCount || ttl <= 0) {
    count = 1;
    resetAt = now + config.windowMs;
    await redis.setex(key, Math.ceil(config.windowMs / 1000), count);
  } else {
    // Increment count if within window
    count++;
    await redis.setex(key, Math.ceil((resetAt - now) / 1000), count);
  }
  
  const remaining = Math.max(0, config.max - count);
  const success = count <= config.max;

  return {
    success,
    limit: config.max,
    remaining,
    resetAt,
  };
}

export function getRateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: "Too many requests, please try again later" },
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
} 