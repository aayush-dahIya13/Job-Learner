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
  console.log("=== PHASE 3: COMPREHENSIVE VERIFIED SKILL PROFILE TESTS ===");

  const { getVerifiedSkillProfile } = await import("../src/lib/verified-skill-profile");
  const { query } = await import("../src/lib/db");

  // Find users with assessment attempts
  const usersRes = await query<{ user_id: number; attempt_count: number }>(
    `SELECT user_id::integer AS user_id, COUNT(*)::integer AS attempt_count
     FROM assessment_attempts
     WHERE status = 'completed'
     GROUP BY user_id
     ORDER BY attempt_count DESC`
  );

  const testUserIds: number[] = usersRes.rows.map((r) => r.user_id);
  
  // Also get a user with 0 attempts for scenario A
  const noAttRes = await query<{ id: number }>(
    `SELECT u.id::integer AS id FROM users u
     LEFT JOIN assessment_attempts aa ON aa.user_id = u.id AND aa.status = 'completed'
     WHERE aa.id IS NULL AND u.role = 'student'
     LIMIT 1`
  );
  if (noAttRes.rows[0]) testUserIds.push(noAttRes.rows[0].id);

  console.log(`Found ${testUserIds.length} candidate test users.`);

  for (const userId of testUserIds) {
    console.log(`\n==================================================`);
    console.log(`TESTING USER ID: ${userId}`);
    console.log(`==================================================`);

    const profile = await getVerifiedSkillProfile(userId);

    console.log(`Target Job Role: ${profile.targetJobRole ? profile.targetJobRole.title : "None"}`);
    console.log(`Overall Alignment Score: ${profile.overallAlignmentScore}%`);
    console.log(`Total Skills: ${profile.totalSkills} (Verified: ${profile.verifiedSkillsCount}, Unverified: ${profile.unverifiedSkillsCount})`);
    console.log(`Meets Requirement: ${profile.meetsRequirementCount}, Below Requirement: ${profile.belowRequirementCount}`);

    for (const skill of profile.skills) {
      console.log(`\n  Skill: ${skill.skillName}`);
      console.log(`    Self-Reported: ${skill.selfReportedLevel ?? "None"}`);
      console.log(`    Diagnostic: ${skill.diagnosticScore !== null ? `${skill.diagnosticScore}% (L${skill.diagnosticLevel})` : "None"}`);
      console.log(`    Latest Demonstrated: ${skill.latestDemonstratedScore !== null ? `${skill.latestDemonstratedScore}% (L${skill.demonstratedLevel})` : "None"}`);
      console.log(`    Required Level: ${skill.requiredLevel ?? "None"}`);
      console.log(`    Improvement: ${skill.improvementPercentage !== null ? `+${skill.improvementPercentage}%` : "None"}`);
      console.log(`    Status: ${skill.status}`);
      console.log(`    Evidence Count: ${skill.evidenceCount}`);

      // Verification of strict status rules:
      const allowed = ["UNVERIFIED", "BELOW_REQUIREMENT", "MEETS_REQUIREMENT"];
      if (!allowed.includes(skill.status)) {
        throw new Error(`TEST FAIL: Invalid status enum '${skill.status}' for skill ${skill.skillName}`);
      }

      if (skill.evidenceCount === 0) {
        if (skill.status !== "UNVERIFIED") {
          throw new Error(`TEST FAIL: Skill ${skill.skillName} has 0 evidence but status is ${skill.status}`);
        }
      } else if (skill.requiredLevel !== null) {
        if (skill.demonstratedLevel! >= skill.requiredLevel) {
          if (skill.status !== "MEETS_REQUIREMENT") {
            throw new Error(`TEST FAIL: Skill ${skill.skillName} L${skill.demonstratedLevel} >= L${skill.requiredLevel} must be MEETS_REQUIREMENT`);
          }
        } else {
          if (skill.status !== "BELOW_REQUIREMENT") {
            throw new Error(`TEST FAIL: Skill ${skill.skillName} L${skill.demonstratedLevel} < L${skill.requiredLevel} must be BELOW_REQUIREMENT`);
          }
        }
      } else {
        if (skill.status !== "MEETS_REQUIREMENT") {
          throw new Error(`TEST FAIL: Assessed skill ${skill.skillName} without role requirement must be MEETS_REQUIREMENT`);
        }
      }

      if (skill.latestDemonstratedScore !== null && skill.diagnosticScore !== null) {
        const expectedDelta = skill.latestDemonstratedScore - skill.diagnosticScore;
        if (skill.improvementPercentage !== expectedDelta) {
          throw new Error(`TEST FAIL: Improvement percentage mismatch for ${skill.skillName}`);
        }
      }
    }
  }

  console.log("\n==================================================");
  console.log("✅ ALL COMPREHENSIVE INTEGRATION TESTS PASSED!");
  console.log("==================================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
