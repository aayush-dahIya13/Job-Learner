import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { SignJWT } from "jose";

const TEST_SECRET = "super-secret-key-for-job-learner-tests-32chars";
process.env.AUTH_SECRET = TEST_SECRET;

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

const mockRedirect = vi.fn((url: string) => {
  const error = new Error(`NEXT_REDIRECT: ${url}`);
  (error as any).digest = `NEXT_REDIRECT;replace;${url};307;;`;
  throw error;
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
}));

import { requireApiUser, requireApiAdmin, requireUserId, requireAdmin } from "../auth";
import { query } from "@/lib/db";

async function createTestToken(userId: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(TEST_SECRET));
}

describe("API Auth & Authorization Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireApiUser", () => {
    it("returns HTTP 401 JSON response when unauthenticated (no redirect)", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await requireApiUser();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
        const json = await result.response.json();
        expect(json.error).toBe("Unauthorized");
      }
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("returns success with userId when authenticated", async () => {
      const token = await createTestToken(42);
      mockCookieStore.get.mockReturnValue({ value: token });

      const result = await requireApiUser();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.userId).toBe(42);
      }
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("requireApiAdmin", () => {
    it("returns HTTP 401 JSON response when unauthenticated (no redirect)", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await requireApiAdmin();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
        const json = await result.response.json();
        expect(json.error).toBe("Unauthorized");
      }
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("returns HTTP 403 JSON response when authenticated as non-admin student (no redirect)", async () => {
      const token = await createTestToken(10);
      mockCookieStore.get.mockReturnValue({ value: token });
      (query as any).mockResolvedValue({
        rows: [{ role: "student" }],
        rowCount: 1,
      });

      const result = await requireApiAdmin();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(403);
        const json = await result.response.json();
        expect(json.error).toBe("Forbidden");
      }
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("returns success with userId when authenticated as admin", async () => {
      const token = await createTestToken(1);
      mockCookieStore.get.mockReturnValue({ value: token });
      (query as any).mockResolvedValue({
        rows: [{ role: "admin" }],
        rowCount: 1,
      });

      const result = await requireApiAdmin();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.userId).toBe(1);
      }
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("Page Route Helpers (requireUserId / requireAdmin)", () => {
    it("preserves redirect to /login for page routes when unauthenticated", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await expect(requireUserId()).rejects.toThrow("NEXT_REDIRECT: /login");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("preserves redirect to /dashboard for page routes when student visits admin page", async () => {
      const token = await createTestToken(10);
      mockCookieStore.get.mockReturnValue({ value: token });
      (query as any).mockResolvedValue({
        rows: [{ role: "student" }],
        rowCount: 1,
      });

      await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT: /dashboard");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });
  });
});
