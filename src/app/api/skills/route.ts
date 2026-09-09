import { NextResponse } from "next/server";
import { query } from "@/lib/db";
export async function GET() { const result = await query<{ id: number; name: string; category: string; description: string }>("SELECT id::integer AS id, name, category, description FROM skills ORDER BY name"); return NextResponse.json({ skills: result.rows }); }
