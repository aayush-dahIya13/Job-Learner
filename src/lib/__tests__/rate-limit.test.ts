import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimitStore,
  getClientIp,
  createRateLimitResponse,
} from "../rate-limit";

describe("Rate Limiting Utility", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows requests below threshold", () => {
    const config = { maxRequests: 3, windowMs: 1000 };
    const key = "test:user:1";
    const now = 10000;

    const r1 = checkRateLimit(key, config, now);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r1.limit).toBe(3);

    const r2 = checkRateLimit(key, config, now + 100);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, config, now + 200);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("rejects requests after threshold", () => {
    const config = { maxRequests: 2, windowMs: 1000 };
    const key = "test:user:2";
    const now = 20000;

    checkRateLimit(key, config, now);
    checkRateLimit(key, config, now + 100);

    const blocked = checkRateLimit(key, config, now + 200);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThanOrEqual(1);
  });

  it("resets rate limit window correctly after window expiration", () => {
    const config = { maxRequests: 2, windowMs: 1000 };
    const key = "test:user:3";
    const now = 30000;

    checkRateLimit(key, config, now);
    checkRateLimit(key, config, now + 100);

    // Blocked before window expiry
    const blocked = checkRateLimit(key, config, now + 500);
    expect(blocked.success).toBe(false);

    // Allowed after window expiry (1001ms after oldest request)
    const allowedAfterExpiry = checkRateLimit(key, config, now + 1001);
    expect(allowedAfterExpiry.success).toBe(true);
    expect(allowedAfterExpiry.remaining).toBe(0); // 1 request from now+100 + 1 request from now+1001
  });

  it("isolates different clients", () => {
    const config = { maxRequests: 1, windowMs: 1000 };
    const keyA = "client:192.168.1.1";
    const keyB = "client:192.168.1.2";
    const now = 40000;

    const rA1 = checkRateLimit(keyA, config, now);
    expect(rA1.success).toBe(true);

    const rA2 = checkRateLimit(keyA, config, now + 50);
    expect(rA2.success).toBe(false);

    // Client B should not be affected by Client A
    const rB1 = checkRateLimit(keyB, config, now + 50);
    expect(rB1.success).toBe(true);
  });

  it("correctly extracts client IP from request headers", () => {
    const reqWithForwarded = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
    });
    expect(getClientIp(reqWithForwarded)).toBe("203.0.113.195");

    const reqWithRealIp = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.1" },
    });
    expect(getClientIp(reqWithRealIp)).toBe("198.51.100.1");

    const reqWithCfIp = new Request("https://example.com", {
      headers: { "cf-connecting-ip": "198.51.100.2" },
    });
    expect(getClientIp(reqWithCfIp)).toBe("198.51.100.2");

    const reqDefault = new Request("https://example.com");
    expect(getClientIp(reqDefault)).toBe("127.0.0.1");
  });

  it("generates correct HTTP 429 response structure and headers", async () => {
    const result = {
      success: false,
      limit: 10,
      remaining: 0,
      reset: 1700000060000,
      retryAfter: 60,
    };

    const response = createRateLimitResponse(result);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");

    const body = await response.json();
    expect(body.error).toContain("Too many requests");
    expect(body.retryAfter).toBe(60);
  });
});
