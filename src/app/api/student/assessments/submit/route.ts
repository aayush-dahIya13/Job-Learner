import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { submitAssessmentAttempt } from "@/lib/student-assessment";

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const attemptId = Number(body.attemptId);
    const answers = Array.isArray(body.answers) ? body.answers : [];

    if (!attemptId) {
      return NextResponse.json({ error: "Missing attempt ID." }, { status: 400 });
    }

    const formattedAnswers = answers.map((a: { questionId: number; selectedOptionId: number | null }) => ({
      questionId: Number(a.questionId),
      selectedOptionId: a.selectedOptionId !== null ? Number(a.selectedOptionId) : null,
    }));

    const result = await submitAssessmentAttempt(userId, attemptId, formattedAnswers);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to submit assessment." }, { status: 400 });
  }
}
