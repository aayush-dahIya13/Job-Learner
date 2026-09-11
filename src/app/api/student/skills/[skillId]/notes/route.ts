import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUserId } from "@/lib/auth";
import { query } from "@/lib/db";

const noteSchema = z.object({ note: z.string().trim().min(1, "Write a progress note before saving.").max(3000, "A note can be at most 3,000 characters.") });

function skillId(value: string) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function ownsSkill(userId: number, id: number) {
  const result = await query("SELECT 1 FROM student_skills WHERE user_id=$1 AND skill_id=$2", [userId, id]);
  return Boolean(result.rowCount);
}

export async function GET(_request: Request, { params }: { params: Promise<{ skillId: string }> }) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    const id = skillId((await params).skillId);
    if (!id) return NextResponse.json({ error: "Invalid skill." }, { status: 400 });
    if (!await ownsSkill(userId, id)) return NextResponse.json({ error: "Skill not found." }, { status: 404 });
    const result = await query<{ id: number; note: string; createdAt: string }>("SELECT id, note, created_at AS \"createdAt\" FROM student_skill_notes WHERE user_id=$1 AND skill_id=$2 ORDER BY created_at DESC, id DESC", [userId, id]);
    return NextResponse.json({ notes: result.rows });
  } catch {
    return NextResponse.json({ error: "Unable to load skill notes." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ skillId: string }> }) {
  try {
    const userId = await currentUserId();
    if (!userId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    const id = skillId((await params).skillId);
    const parsed = noteSchema.safeParse(await request.json());
    if (!id || !parsed.success) return NextResponse.json({ error: parsed.error?.issues[0]?.message ?? "Invalid note." }, { status: 400 });
    if (!await ownsSkill(userId, id)) return NextResponse.json({ error: "Skill not found." }, { status: 404 });
    const result = await query<{ id: number; note: string; createdAt: string }>("INSERT INTO student_skill_notes(user_id, skill_id, note) VALUES($1,$2,$3) RETURNING id, note, created_at AS \"createdAt\"", [userId, id, parsed.data.note]);
    return NextResponse.json({ success: true, note: result.rows[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to save note." }, { status: 500 });
  }
}
