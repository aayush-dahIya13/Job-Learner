import { NextResponse } from "next/server";

/**
 * In-Memory Sliding Window Rate Limiter for JOB-LEARNER
 *
 * NOTE ON ARCHITECTURE:
 * This in-memory implementation is instance-local. It provides lightweight, zero-dependency
 * rate limiting for single-instance and development deployments.
 * If the application is horizontally scaled across multiple server instances or serverless
 * edge workers in the future, rate limiting should be migrated to a shared distributed store
 * such as Redis or Upstash.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms
  retryAfter: number; // seconds
}

// In-memory store: key -> array of request timestamps in ms
const rateLimitStore = new Map<string, number[]>();

// Last cleanup timestamp to prevent map growth
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

function cleanupExpiredEntries(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, timestamps] of rateLimitStore.entries()) {
    // Drop entries whose timestamps are all older than 1 hour
    const recent = timestamps.filter((t) => now - t < 60 * 60 * 1000);
    if (recent.length === 0) {
      rateLimitStore.delete(key);
    } else if (recent.length < timestamps.length) {
      rateLimitStore.set(key, recent);
    }
  }
}

/**
 * Core rate limit checker using sliding-window log algorithm
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  currentTime: number = Date.now()
): RateLimitResult {
  cleanupExpiredEntries(currentTime);

  const windowStart = currentTime - config.windowMs;
  const existingTimestamps = rateLimitStore.get(key) || [];

  // Filter out timestamps outside the sliding window
  const validTimestamps = existingTimestamps.filter((t) => t > windowStart);

  if (validTimestamps.length >= config.maxRequests) {
    const oldest = validTimestamps[0];
    const resetTime = oldest + config.windowMs;
    const retryAfter = Math.max(1, Math.ceil((resetTime - currentTime) / 1000));

    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: resetTime,
      retryAfter,
    };
  }

  validTimestamps.push(currentTime);
  rateLimitStore.set(key, validTimestamps);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - validTimestamps.length,
    reset: currentTime + config.windowMs,
    retryAfter: 0,
  };
}

/**
 * Resets rate limit for a specific key (useful for tests or admin operations)
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
  lastCleanup = Date.now();
}

/**
 * Safely extract client IP from request headers
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Standard HTTP 429 response helper with standard retry headers
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests. Please slow down and try again later.",
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
      },
    }
  );
}

/**
 * Common presets for high-risk application endpoints
 */
export const RATE_LIMIT_PRESETS = {
  // Login: 10 attempts per minute per IP
  AUTH_LOGIN: { maxRequests: 10, windowMs: 60 * 1000 },
  // Registration: 5 requests per 15 minutes per IP
  AUTH_REGISTER: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  // AI generation: 10 requests per minute per user/IP
  AI_GENERATE: { maxRequests: 10, windowMs: 60 * 1000 },
  // Assessment start / submission: 20 actions per minute per user/IP
  ASSESSMENT_ACTION: { maxRequests: 20, windowMs: 60 * 1000 },
} as const;
