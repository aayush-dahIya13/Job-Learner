import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { getAttemptDetails } from "@/lib/student-assessment";

export async function GET(_req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { attemptId: rawId } = await params;
  const attemptId = Number(rawId);
  if (!attemptId) return NextResponse.json({ error: "Invalid attempt ID" }, { status: 400 });

  const details = await getAttemptDetails(userId, attemptId);
  if (!details) return NextResponse.json({ error: "Attempt details not found." }, { status: 404 });

  return NextResponse.json(details);
}
