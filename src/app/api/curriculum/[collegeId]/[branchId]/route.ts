import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { getStudentCurriculum } from "@/lib/student-curriculum";

// Compatibility endpoint. Supplied IDs are verified against the authenticated profile.
export async function GET(_: Request, { params }: { params: Promise<{ collegeId: string; branchId: string }> }) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const { collegeId, branchId } = await params;
  const requestedCollegeId = Number(collegeId), requestedBranchId = Number(branchId);
  if (!Number.isSafeInteger(requestedCollegeId) || !Number.isSafeInteger(requestedBranchId)) return NextResponse.json({ error: "Invalid curriculum request." }, { status: 400 });
  try {
    const curriculum = await getStudentCurriculum(userId);
    if (curriculum.college?.id !== requestedCollegeId || curriculum.branch?.id !== requestedBranchId) return NextResponse.json({ error: "You can only view the curriculum for your own student profile." }, { status: 403 });
    return NextResponse.json(curriculum);
  } catch (error) {
    console.error("Could not load student curriculum:", error);
    return NextResponse.json({ error: "Unable to load your curriculum right now. Please try again." }, { status: 503 });
  }
}
