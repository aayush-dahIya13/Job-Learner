import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { withTransaction } from "@/lib/db";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid registration data." }, { status: 400 });
    const data = parsed.data;
    const passwordHash = await bcrypt.hash(data.password, 12);
    const userId = await withTransaction(async (client) => {
      const lookup = await client.query("SELECT 1 FROM college_branches WHERE college_id = $1 AND branch_id = $2", [data.collegeId, data.branchId]);
      if (!lookup.rowCount) throw new Error("That branch is not offered by the selected college.");
      const user = await client.query<{ id: number }>("INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id", [data.fullName, data.email, passwordHash]);
      const id = user.rows[0].id;
      await client.query("INSERT INTO student_profiles (user_id, contact_number, college_id, branch_id, current_year, career_goal) VALUES ($1, $2, $3, $4, $5, $6)", [id, data.contactNumber, data.collegeId, data.branchId, data.currentYear, data.careerGoal]);
      return id;
    });
    await createSession(userId);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const message = error instanceof Error ? error.message : "Unable to create your account.";
    console.error("Registration failed:", error);
    return NextResponse.json({ error: message.includes("valid college") ? message : "Unable to create your account. Please try again." }, { status: 500 });
  }
}
