import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { query } from "@/lib/db";
import { getMilestoneAssessmentsForUser, getSkillProgressHistory } from "@/lib/student-assessment";

export const runtime = "nodejs";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  try {
    const goalRes = await query<{ job_role_id: number }>(
      "SELECT job_role_id::integer FROM student_career_goals WHERE user_id = $1",
      [userId]
    );

    const jobRoleId = goalRes.rows[0]?.job_role_id;
    if (!jobRoleId) {
      return NextResponse.json({ milestones: [], progressHistory: [] });
    }

    const milestones = await getMilestoneAssessmentsForUser(userId, jobRoleId);
    const progressHistory = await getSkillProgressHistory(userId);

    return NextResponse.json({ milestones, progressHistory });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unable to fetch milestone assessments." },
      { status: 500 }
    );
  }
}
