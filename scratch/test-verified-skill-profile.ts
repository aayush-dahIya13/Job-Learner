import fs from "fs";
import path from "path";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    for (const line of envConfig.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const eqIdx = trimmed.indexOf("=");
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
} catch (e) {
  console.warn("Could not load .env.local:", e);
}

async function runTests() {
  console.log("=== VERIFIED SKILL PROFILE SCRATCH SCRIPT ===");
  const { getVerifiedSkillProfile } = await import("../src/lib/verified-skill-profile");
  const { query } = await import("../src/lib/db");

  const usersRes = await query<{ user_id: number }>(
    `SELECT DISTINCT user_id::integer AS user_id FROM assessment_attempts WHERE status = 'completed' LIMIT 3`
  );

  for (const row of usersRes.rows) {
    const profile = await getVerifiedSkillProfile(row.user_id);
    console.log(`User ${row.user_id}: Verified Skills Count = ${profile.verifiedSkillsCount}, Coverage = ${profile.verificationCoveragePercentage}%`);
  }
}

runTests().catch(console.error);
