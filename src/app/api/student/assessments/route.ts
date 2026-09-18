import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  getActiveAssessmentForRole,
  getActiveStudentAttempt,
  startAssessmentAttempt,
} from "@/lib/student-assessment";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get active career goal
  const goalRes = await query<{ job_role_id: number; title: string }>(
    `SELECT scg.job_role_id::integer AS job_role_id, jr.title 
     FROM student_career_goals scg 
     JOIN job_roles jr ON jr.id = scg.job_role_id 
     WHERE scg.user_id = $1`,
    [userId]
  );

  const goal = goalRes.rows[0];
  if (!goal) {
    return NextResponse.json(
      { error: "Please choose a career goal before taking an assessment.", code: "NO_CAREER_GOAL" },
      { status: 400 }
    );
  }

  const assessment = await getActiveAssessmentForRole(goal.job_role_id);
  const activeAttempt = await getActiveStudentAttempt(userId, assessment?.id);

  // Get past completed attempts
  const pastAttemptsRes = await query<{
    id: number;
    assessment_id: number;
    title: string;
    started_at: Date;
    completed_at: Date | null;
    score: string | null;
    percentage: string | null;
    status: string;
    attempt_number: number;
  }>(
    `SELECT aa.id::integer AS id, aa.assessment_id::integer AS assessment_id, a.title,
            aa.started_at, aa.completed_at, aa.score::text, aa.percentage::text, aa.status, aa.attempt_number
     FROM assessment_attempts aa
     JOIN assessments a ON a.id = aa.assessment_id
     WHERE aa.user_id = $1 AND aa.status = 'completed'
     ORDER BY aa.completed_at DESC LIMIT 10`,
    [userId]
  );

  const pastAttempts = pastAttemptsRes.rows.map((row) => ({
    id: row.id,
    assessmentId: row.assessment_id,
    title: row.title,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    score: row.score ? Number(row.score) : null,
    percentage: row.percentage ? Number(row.percentage) : null,
    status: row.status,
    attemptNumber: row.attempt_number,
  }));

  return NextResponse.json({
    careerGoal: goal,
    assessment,
    activeAttempt,
    pastAttempts,
  });
}

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  let assessmentId = Number(body.assessmentId);

  if (!assessmentId) {
    // Lookup default active assessment for current student career goal
    const goalRes = await query<{ job_role_id: number }>(
      `SELECT job_role_id::integer FROM student_career_goals WHERE user_id = $1`,
      [userId]
    );
    if (!goalRes.rows[0]) {
      return NextResponse.json({ error: "No career goal set." }, { status: 400 });
    }
    const assessment = await getActiveAssessmentForRole(goalRes.rows[0].job_role_id);
    if (!assessment) {
      return NextResponse.json({ error: "No active diagnostic assessment found for your career goal." }, { status: 404 });
    }
    assessmentId = assessment.id;
  }

  const attemptId = await startAssessmentAttempt(userId, assessmentId);
  return NextResponse.json({ attemptId });
}
