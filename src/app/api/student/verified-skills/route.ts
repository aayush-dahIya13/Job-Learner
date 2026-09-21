import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { getVerifiedSkillProfile } from "@/lib/verified-skill-profile";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  try {
    const profile = await getVerifiedSkillProfile(userId);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to fetch verified skill profile:", error);
    return NextResponse.json(
      { error: "Failed to retrieve verified skill profile." },
      { status: 500 }
    );
  }
}
