import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { getStudentCurriculum } from "@/lib/student-curriculum";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  try { return NextResponse.json(await getStudentCurriculum(userId)); }
  catch (error) { console.error("Could not load student curriculum:", error); return NextResponse.json({ error: "Unable to load your curriculum right now. Please try again." }, { status: 503 }); }
}
