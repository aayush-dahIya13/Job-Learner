import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { generateCareerAnalysis, AiServiceError } from "@/lib/ai/gemini";
import { AiContextError, loadAiStudentContext } from "@/lib/ai/student-context";
import { latestAnalysis, saveAnalysis } from "@/lib/ai/store";
import {
  checkRateLimit,
  getClientIp,
  createRateLimitResponse,
  RATE_LIMIT_PRESETS,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  if (error instanceof AiContextError || error instanceof AiServiceError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.code === "AI_NOT_CONFIGURED" ? 503 : 422 }
    );
  }
  return NextResponse.json(
    { error: "Unable to generate career insights right now." },
    { status: 500 }
  );
}

export async function GET() {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }
  try {
    return NextResponse.json({ analysis: await latestAnalysis(userId) });
  } catch {
    return NextResponse.json(
      { error: "Unable to load career insights." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(
    `ai:career-analysis:${userId || clientIp}`,
    RATE_LIMIT_PRESETS.AI_GENERATE
  );
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const context = await loadAiStudentContext(userId);
    const analysis = await generateCareerAnalysis(context);
    await saveAnalysis(
      userId,
      context.career.id,
      context.skillGap.readinessScore,
      analysis
    );
    return NextResponse.json(
      {
        analysis: {
          analysis,
          generated_at: new Date().toISOString(),
          readiness_score: context.skillGap.readinessScore,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
