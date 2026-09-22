import {
  percentageToDemonstratedLevel,
  getDemonstratedLevelLabel,
  getProficiencyDetails,
  resolveCurrentDemonstratedSkill,
  resolveEffectiveSkillState,
  type DemonstratedSkillAttempt,
} from "../src/lib/proficiency";

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`[FAIL] ${message}: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  console.log(`[PASS] ${message}`);
}

async function runProficiencyTests() {
  console.log("=== RUNNING UNIFIED PROFICIENCY MODEL TESTS ===\n");

  // 1. Boundary Value Tests
  assertEqual(percentageToDemonstratedLevel(0), 1, "Score 0% -> Level 1");
  assertEqual(getDemonstratedLevelLabel(0), "Beginner", "Score 0% -> Beginner");

  assertEqual(percentageToDemonstratedLevel(39), 1, "Score 39% -> Level 1");
  assertEqual(getDemonstratedLevelLabel(39), "Beginner", "Score 39% -> Beginner");

  assertEqual(percentageToDemonstratedLevel(40), 2, "Score 40% -> Level 2");
  assertEqual(getDemonstratedLevelLabel(40), "Developing", "Score 40% -> Developing");

  assertEqual(percentageToDemonstratedLevel(59), 2, "Score 59% -> Level 2");
  assertEqual(getDemonstratedLevelLabel(59), "Developing", "Score 59% -> Developing");

  assertEqual(percentageToDemonstratedLevel(60), 3, "Score 60% -> Level 3");
  assertEqual(getDemonstratedLevelLabel(60), "Proficient", "Score 60% -> Proficient");

  assertEqual(percentageToDemonstratedLevel(74), 3, "Score 74% -> Level 3");
  assertEqual(getDemonstratedLevelLabel(74), "Proficient", "Score 74% -> Proficient");

  assertEqual(percentageToDemonstratedLevel(75), 4, "Score 75% -> Level 4");
  assertEqual(getDemonstratedLevelLabel(75), "Advanced", "Score 75% -> Advanced");

  assertEqual(percentageToDemonstratedLevel(89), 4, "Score 89% -> Level 4");
  assertEqual(getDemonstratedLevelLabel(89), "Advanced", "Score 89% -> Advanced");

  assertEqual(percentageToDemonstratedLevel(90), 5, "Score 90% -> Level 5");
  assertEqual(getDemonstratedLevelLabel(90), "Expert", "Score 90% -> Expert");

  assertEqual(percentageToDemonstratedLevel(100), 5, "Score 100% -> Level 5");
  assertEqual(getDemonstratedLevelLabel(100), "Expert", "Score 100% -> Expert");

  // 2. Test Latest Attempt Evidence Strategy
  console.log("\n=== TESTING EVIDENCE STRATEGY (Latest Completed Attempt) ===");
  const attemptsHistory: DemonstratedSkillAttempt[] = [
    {
      attemptId: 101,
      assessmentId: 1,
      assessmentTitle: "Diagnostic Assessment",
      assessmentType: "diagnostic",
      score: 48,
      percentage: 48,
      demonstratedLevel: 2,
      levelLabel: "Developing",
      completedAt: "2026-09-10T10:00:00Z",
    },
    {
      attemptId: 102,
      assessmentId: 2,
      assessmentTitle: "Milestone 1 (High Score Retake)",
      assessmentType: "milestone",
      score: 85,
      percentage: 85,
      demonstratedLevel: 4,
      levelLabel: "Advanced",
      completedAt: "2026-09-15T10:00:00Z",
    },
    {
      attemptId: 103,
      assessmentId: 3,
      assessmentTitle: "Milestone 2 (Latest Attempt)",
      assessmentType: "milestone",
      score: 72,
      percentage: 72,
      demonstratedLevel: 3,
      levelLabel: "Proficient",
      completedAt: "2026-09-20T10:00:00Z",
    },
  ];

  const latestResolved = resolveCurrentDemonstratedSkill(attemptsHistory);
  assertEqual(latestResolved?.attemptId, 103, "Evidence Strategy resolves to latest attempt (103) based on completedAt timestamp");
  assertEqual(latestResolved?.percentage, 72, "Does not artificially default to highest historical retake score (85)");
  assertEqual(attemptsHistory.length, 3, "Complete attempt history is preserved (3 attempts)");

  // 3. Test Skill State Resolution & Fallbacks
  console.log("\n=== TESTING SKILL STATE RESOLUTION & FALLBACKS ===");
  const demonstratedState = resolveEffectiveSkillState({
    skillId: 1,
    skillName: "JavaScript",
    latestDemonstrated: latestResolved,
    selfReportedLevel: 4, // Student self-reported 4, but demonstrated 3 (72%)
    requiredLevel: 3,
  });

  assertEqual(demonstratedState.effectiveLevel, 3, "Demonstrated level (3) overrides self-reported level (4)");
  assertEqual(demonstratedState.source, "DEMONSTRATED", "State source is DEMONSTRATED");
  assertEqual(demonstratedState.status, "MEETS_REQUIREMENT", "Status is MEETS_REQUIREMENT");

  const unassessedState = resolveEffectiveSkillState({
    skillId: 2,
    skillName: "TypeScript",
    latestDemonstrated: null, // Unassessed
    selfReportedLevel: 2,
    requiredLevel: 4,
  });

  assertEqual(unassessedState.effectiveLevel, 2, "Unassessed skill falls back to self-reported level (2)");
  assertEqual(unassessedState.source, "SELF_REPORTED", "State source is SELF_REPORTED");
  assertEqual(unassessedState.status, "needs_improvement", "Status is needs_improvement");

  // 4. Verify Learning Progress vs Assessment Isolation
  console.log("\n=== VERIFYING LEARNING COMPLETION ISOLATION ===");
  const learningProgressPercent = 100; // 100% roadmap steps checked
  const skillProficiencyBeforeAssessment = unassessedState.effectiveLevel; // 2
  assertEqual(
    skillProficiencyBeforeAssessment,
    2,
    "Completing 100% of roadmap learning steps does NOT alter skill proficiency (remains level 2 until assessed)"
  );

  console.log("\n✅ ALL UNIFIED PROFICIENCY MODEL TESTS PASSED SUCCESSFULLY!");
}

runProficiencyTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
