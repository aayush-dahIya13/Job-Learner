import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { query } from "@/lib/db";
import { profileSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  try {
    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile data." }, { status: 400 });
    const data = parsed.data;
    const valid = await query("SELECT 1 FROM college_branches WHERE college_id = $1 AND branch_id = $2", [data.collegeId, data.branchId]);
    if (!valid.rowCount) return NextResponse.json({ error: "That branch is not offered by the selected college." }, { status: 400 });
    await query("UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2", [data.fullName, userId]);
    await query("UPDATE student_profiles SET contact_number = $1, college_id = $2, branch_id = $3, current_year = $4, career_goal = $5, updated_at = NOW() WHERE user_id = $6", [data.contactNumber, data.collegeId, data.branchId, data.currentYear, data.careerGoal, userId]);
    return NextResponse.json({ ok: true });
  } catch (error) { console.error("Profile update failed:", error); return NextResponse.json({ error: "Unable to save your profile. Please try again." }, { status: 500 }); }
}
