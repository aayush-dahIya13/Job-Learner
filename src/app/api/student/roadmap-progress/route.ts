import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { query } from "@/lib/db";
import { latestRoadmap } from "@/lib/ai/store";

export const runtime = "nodejs";

// GET /api/student/roadmap-progress -> Returns completed step numbers for student's active roadmap
export async function GET() {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const roadmap = await latestRoadmap(userId);
    if (!roadmap || !roadmap.id) {
      return NextResponse.json({ completedSteps: [] });
    }

    const result = await query<{ step_number: number }>(
      `SELECT step_number 
       FROM student_roadmap_progress 
       WHERE user_id = $1 AND roadmap_id = $2 
       ORDER BY step_number ASC`,
      [userId, roadmap.id]
    );

    const completedSteps = result.rows.map((row) => row.step_number);
    return NextResponse.json({ completedSteps });
  } catch (error) {
    console.error("Failed to fetch roadmap progress:", error);
    return NextResponse.json({ error: "Failed to load progress." }, { status: 500 });
  }
}

// POST /api/student/roadmap-progress -> Toggle/set step completion state in DB
export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { stepNumber, completed } = body;

    if (typeof stepNumber !== "number") {
      return NextResponse.json({ error: "Invalid stepNumber provided." }, { status: 400 });
    }

    const roadmap = await latestRoadmap(userId);
    if (!roadmap || !roadmap.id) {
      return NextResponse.json({ error: "No active roadmap found for student." }, { status: 404 });
    }

    if (completed) {
      await query(
        `INSERT INTO student_roadmap_progress (user_id, roadmap_id, step_number, completed_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, roadmap_id, step_number) DO UPDATE
         SET completed_at = NOW()`,
        [userId, roadmap.id, stepNumber]
      );
    } else {
      await query(
        `DELETE FROM student_roadmap_progress 
         WHERE user_id = $1 AND roadmap_id = $2 AND step_number = $3`,
        [userId, roadmap.id, stepNumber]
      );
    }

    const result = await query<{ step_number: number }>(
      `SELECT step_number 
       FROM student_roadmap_progress 
       WHERE user_id = $1 AND roadmap_id = $2 
       ORDER BY step_number ASC`,
      [userId, roadmap.id]
    );

    const completedSteps = result.rows.map((row) => row.step_number);
    return NextResponse.json({ success: true, completedSteps });
  } catch (error) {
    console.error("Failed to update roadmap progress:", error);
    return NextResponse.json({ error: "Failed to update progress." }, { status: 500 });
  }
}
