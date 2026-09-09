import { NextResponse } from "next/server";
import { query } from "@/lib/db";
export async function GET() { const result = await query<{ id: number; title: string; description: string; category: string }>("SELECT id::integer AS id, title, description, category FROM job_roles ORDER BY title"); return NextResponse.json({ jobRoles: result.rows }); }
