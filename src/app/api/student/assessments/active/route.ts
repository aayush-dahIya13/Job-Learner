import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import {
  getAssessmentQuestions,
  getActiveStudentAttempt,
  getAttemptDetails,
} from "@/lib/student-assessment";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activeAttempt = await getActiveStudentAttempt(userId);
  if (!activeAttempt) {
    return NextResponse.json({ activeAttempt: null, questions: [] });
  }

  const questions = await getAssessmentQuestions(activeAttempt.assessment_id);

  return NextResponse.json({
    activeAttempt: {
      id: activeAttempt.id,
      assessmentId: activeAttempt.assessment_id,
      startedAt: activeAttempt.started_at,
      attemptNumber: activeAttempt.attempt_number,
    },
    questions,
  });
}
