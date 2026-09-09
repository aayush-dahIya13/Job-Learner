import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { getStudentSkillGap } from "@/lib/student-skill-gap";
export async function GET() { const userId = await currentUserId(); if (!userId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 }); const gap = await getStudentSkillGap(userId); return gap ? NextResponse.json(gap) : NextResponse.json({ error: "Choose a target job role to view your skill gap.", code: "NO_CAREER_GOAL" }, { status: 404 }); }
