import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { rateLimit, getRateLimitResponse } from "@/utils/ratelimit";
import PostHogClient from "@/utils/posthog";
import { CLOSURE_MESSAGE, isClosedEntryPath } from "@/utils/site-closure";

// Rate limit configuration: 12 requests per 30 seconds
const API_RATE_LIMIT = {
  max: 12,
  windowMs: 30 * 1000, // 30 seconds in milliseconds
};

// Routes that should be rate limited
const RATE_LIMITED_ROUTES = [
  "/api/chat",
  "/api/onboarding",
];

export async function middleware(request: NextRequest) {
  // Check if the request path should be rate limited
  const path = request.nextUrl.pathname.replace(/\/+$/, "") || "/";
  if (
    isClosedEntryPath(path) ||
    path === "/app" || path.startsWith("/app/") ||
    path === "/auth" || path.startsWith("/auth/") ||
    path === "/login" || path === "/signin" ||
    path === "/sign-in" ||
    path === "/reauthorize" ||
    path === "/settings/email-verified" ||
    path === "/api/email/verify"
  ) {
    if (path.startsWith("/api/") || !["GET", "HEAD"].includes(request.method)) {
      return NextResponse.json({ error: CLOSURE_MESSAGE }, { status: 410 });
    }
    return NextResponse.redirect(new URL("/closed", request.url), 303);
  }

  // Public pages must render without refreshing sessions against Supabase.
  if (!path.startsWith("/app/") && !path.startsWith("/api/")) {
    return NextResponse.next();
  }

  const shouldRateLimit = RATE_LIMITED_ROUTES.some(route => path.startsWith(route));
  
  if (shouldRateLimit) {
    // Get client IP address from Vercel-specific headers first, then fall back to others
    const ip = request.headers.get("x-vercel-forwarded-for") || 
               request.headers.get("x-forwarded-for")?.split(',')[0] || 
               request.headers.get("x-real-ip") || 
               "unknown";
    
    try {
      // Apply rate limiting
      const rateLimitResult = await rateLimit(ip, path, API_RATE_LIMIT);
      
      // Return rate limit exceeded response if limit is reached
      if (!rateLimitResult.success) {
        // Capture PostHog event for rate limit hit
        const posthogClient = PostHogClient();
        posthogClient.capture({
          distinctId: ip, // Use IP address as distinctId for middleware rate limiting
          event: "middleware_rate_limit_hit",
          properties: {
            ip_address: ip,
            path: path,
            limit: API_RATE_LIMIT.max,
            window_ms: API_RATE_LIMIT.windowMs
          },
        });
        // Ensure events are flushed. Not using await here as middleware should be fast.
        // PostHog client is configured to flush immediately (flushAt: 1, flushInterval: 0)
        posthogClient.shutdown(); 

        return getRateLimitResponse();
      }
      
      // Add rate limit headers to response
      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", API_RATE_LIMIT.max.toString());
      response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
      response.headers.set("X-RateLimit-Reset", Math.floor(rateLimitResult.resetAt / 1000).toString());
      
      return response;
    } catch (error) {
      // If rate limiting fails, log the error but allow the request
      console.error('Rate limiting error:', error);
      return NextResponse.next();
    }
  }
  
  // For non-rate-limited routes, continue with session management
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - /api/webhooks routes (Webhook endpoints)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    
    // Include specific API routes for rate limiting
    "/api/chat",
    "/api/onboarding",
    // App paths with file-like conversation IDs must also be closed.
    "/app/:path*",
  ],
};
