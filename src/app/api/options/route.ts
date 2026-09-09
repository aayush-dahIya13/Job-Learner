import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const [colleges, branches] = await Promise.all([
      query<{ id: number; name: string }>("SELECT id, name FROM colleges ORDER BY name"),
      query<{ id: number; name: string }>("SELECT id, name FROM branches ORDER BY name"),
    ]);
    return NextResponse.json({ colleges: colleges.rows, branches: branches.rows });
  } catch (error) {
    console.error("Could not load options:", error);
    return NextResponse.json({ error: "Could not load college and branch options. Check database setup." }, { status: 503 });
  }
}
