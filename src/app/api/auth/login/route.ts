import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import {
  checkRateLimit,
  getClientIp,
  createRateLimitResponse,
  RATE_LIMIT_PRESETS,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(
    `auth:login:${clientIp}`,
    RATE_LIMIT_PRESETS.AUTH_LOGIN
  );
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid credentials." },
        { status: 400 }
      );
    }
    const { email, password } = parsed.data;
    const result = await query<{ id: number; password_hash: string }>(
      "SELECT id, password_hash FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { error: "Unable to sign in right now. Please try again." },
      { status: 500 }
    );
  }
}
