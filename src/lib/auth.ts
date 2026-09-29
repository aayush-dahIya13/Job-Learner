import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";

const COOKIE_NAME = "job_learner_session";
const maxAge = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured.");
  return new TextEncoder().encode(value);
}

export async function createSession(userId: number) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge });
}

export async function clearSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function currentUserId() {
  try {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.sub);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export async function requireUserId() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  return userId;
}

export async function requireAdmin() {
  const userId = await requireUserId();
  const result = await query<{ role: string }>("SELECT role FROM users WHERE id = $1", [userId]);
  if (result.rows[0]?.role !== "admin") redirect("/dashboard");
  return userId;
}

export type ApiAuthResult =
  | { success: true; userId: number }
  | { success: false; response: import("next/server").NextResponse };

export async function requireApiUser(): Promise<ApiAuthResult> {
  const { NextResponse } = await import("next/server");
  const userId = await currentUserId();
  if (!userId) {
    return {
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { success: true, userId };
}

export async function requireApiAdmin(): Promise<ApiAuthResult> {
  const { NextResponse } = await import("next/server");
  const userAuth = await requireApiUser();
  if (!userAuth.success) return userAuth;

  const result = await query<{ role: string }>("SELECT role FROM users WHERE id = $1", [userAuth.userId]);
  if (result.rows[0]?.role !== "admin") {
    return {
      success: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { success: true, userId: userAuth.userId };
}

