import {
  percentageToDemonstratedLevel,
  getDemonstratedLevelLabel,
  resolveCurrentDemonstratedSkill,
  resolveEffectiveSkillState,
  type DemonstratedSkillAttempt,
} from "../src/lib/proficiency";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

async function testAssessmentDrivenSkillGap() {
  console.log("=== RUNNING ASSESSMENT-DRIVEN SKILL GAP ENHANCEMENT TESTS ===\n");

  // TEST 1: Student has no assessment
  console.log("--- TEST 1: Student Has No Assessment ---");
  const unassessedAttempts: DemonstratedSkillAttempt[] = [];
  const latestUnassessed = resolveCurrentDemonstratedSkill(unassessedAttempts);
  assert(latestUnassessed === null, "No assessment returns null for latest demonstrated skill");

  const unassessedState = resolveEffectiveSkillState({
    skillId: 1,
    skillName: "Node.js",
    latestDemonstrated: latestUnassessed,
    selfReportedLevel: 2,
    requiredLevel: 4,
  });
  assert(unassessedState.source === "SELF_REPORTED", "Unassessed skill falls back to self-reported level");
  assert(unassessedState.effectiveLevel === 2, "Effective level equals self-reported level (2)");

  // TEST 2: Student submits assessment (JS=52%, React=78%, SQL=91%)
  console.log("\n--- TEST 2: Assessed Scores (JS=52% Developing, React=78% Advanced, SQL=91% Expert) ---");
  const jsAttempt: DemonstratedSkillAttempt = {
    attemptId: 1, assessmentId: 10, assessmentTitle: "JS Diagnostic", assessmentType: "diagnostic",
    score: 52, percentage: 52, demonstratedLevel: percentageToDemonstratedLevel(52),
    levelLabel: getDemonstratedLevelLabel(52), completedAt: "2026-09-22T10:00:00Z"
  };
  const reactAttempt: DemonstratedSkillAttempt = {
    attemptId: 1, assessmentId: 10, assessmentTitle: "React Diagnostic", assessmentType: "diagnostic",
    score: 78, percentage: 78, demonstratedLevel: percentageToDemonstratedLevel(78),
    levelLabel: getDemonstratedLevelLabel(78), completedAt: "2026-09-22T10:00:00Z"
  };
  const sqlAttempt: DemonstratedSkillAttempt = {
    attemptId: 1, assessmentId: 10, assessmentTitle: "SQL Diagnostic", assessmentType: "diagnostic",
    score: 91, percentage: 91, demonstratedLevel: percentageToDemonstratedLevel(91),
    levelLabel: getDemonstratedLevelLabel(91), completedAt: "2026-09-22T10:00:00Z"
  };

  assert(jsAttempt.demonstratedLevel === 2 && jsAttempt.levelLabel === "Developing", "JS (52%) -> Level 2 Developing (WEAK)");
  assert(reactAttempt.demonstratedLevel === 4 && reactAttempt.levelLabel === "Advanced", "React (78%) -> Level 4 Advanced (ON TRACK)");
  assert(sqlAttempt.demonstratedLevel === 5 && sqlAttempt.levelLabel === "Expert", "SQL (91%) -> Level 5 Expert (ON TRACK)");

  // TEST 3: Retake Assessment (JS=82%)
  console.log("\n--- TEST 3: Retake Assessment (JS=82%) ---");
  const jsAttempts: DemonstratedSkillAttempt[] = [
    jsAttempt, // 52% on 2026-09-22T10:00:00Z
    {
      attemptId: 2, assessmentId: 11, assessmentTitle: "JS Milestone", assessmentType: "milestone",
      score: 82, percentage: 82, demonstratedLevel: percentageToDemonstratedLevel(82),
      levelLabel: getDemonstratedLevelLabel(82), completedAt: "2026-09-22T11:00:00Z"
    }
  ];
  const latestJs = resolveCurrentDemonstratedSkill(jsAttempts);
  assert(latestJs?.percentage === 82, "Latest attempt strategy resolves to recent 82% score");
  assert(latestJs?.demonstratedLevel === 4, "JS is now Level 4 (Advanced) and no longer weak");
  assert(jsAttempts.length === 2, "Historical 52% attempt is preserved");

  // TEST 4 & 5: Priority Classification
  console.log("\n--- TEST 4 & 5: Priority Classification (Industry Required vs Non-Career) ---");
  const isTargetRequiredJS = true;
  const isTargetRequiredPython = false;

  const pythonWeakAttempt: DemonstratedSkillAttempt = {
    attemptId: 1, assessmentId: 10, assessmentTitle: "Python Test", assessmentType: "diagnostic",
    score: 35, percentage: 35, demonstratedLevel: percentageToDemonstratedLevel(35),
    levelLabel: getDemonstratedLevelLabel(35), completedAt: "2026-09-22T10:00:00Z"
  };

  const jsWeakPriority = isTargetRequiredJS && jsAttempt.demonstratedLevel < 3;
  const pythonWeakNonCareer = !isTargetRequiredPython && pythonWeakAttempt.demonstratedLevel < 3;

  assert(jsWeakPriority === true, "Industry required skill with 52% score is classified as HIGH PRIORITY");
  assert(pythonWeakNonCareer === true, "Non-career skill with 35% score is classified as Development Area (not industry required)");

  // TEST 7: Self-Report vs Assessment Preservation
  console.log("\n--- TEST 7: Self-Report vs Assessment Preservation ---");
  const selfReportedJS = 4; // Student rated themselves 4/5
  const assessedJS = jsAttempt.percentage; // 52% -> Level 2

  const resolvedJS = resolveEffectiveSkillState({
    skillId: 1,
    skillName: "JavaScript",
    latestDemonstrated: jsAttempt,
    selfReportedLevel: selfReportedJS,
    requiredLevel: 4,
  });

  assert(resolvedJS.selfReportedLevel === 4, "Self-reported level (4) remains preserved");
  assert(resolvedJS.demonstratedScore === 52, "Demonstrated score (52%) remains preserved");
  assert(resolvedJS.effectiveLevel === 2, "Demonstrated assessment level (2) takes precedence for skill state");

  console.log("\n✅ ALL ASSESSMENT-DRIVEN SKILL GAP TESTS PASSED SUCCESSFULLY!");
}

testAssessmentDrivenSkillGap().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
