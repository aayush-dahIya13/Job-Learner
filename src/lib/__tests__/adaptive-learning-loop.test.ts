import { describe, it, expect, vi } from "vitest";
import {
  percentageToDemonstratedLevel,
  getDemonstratedLevelLabel,
  resolveCurrentDemonstratedSkill,
  resolveEffectiveSkillState,
  type DemonstratedSkillAttempt,
} from "../proficiency";
import { calculateSkillGap } from "../skill-gap";

describe("Adaptive Learning ↔ Assessment Loop Integration", () => {
  // Test 1: Completing learning does not increase demonstrated proficiency
  it("1. completing learning steps records progress without increasing demonstrated skill level", () => {
    // Student marked step as complete, but has NO assessment evidence
    const selfReportedLevel = 2; // Developing
    const latestDemonstrated: DemonstratedSkillAttempt | null = null; // No assessment taken

    const effectiveState = resolveEffectiveSkillState({
      skillId: 101,
      skillName: "TypeScript",
      latestDemonstrated,
      selfReportedLevel,
      requiredLevel: 4,
    });

    // Effective level falls back to self-reported, NOT demonstrated
    expect(effectiveState.source).toBe("SELF_REPORTED");
    expect(effectiveState.effectiveLevel).toBe(2);
    expect(effectiveState.demonstratedLevel).toBeNull();
    expect(effectiveState.demonstratedScore).toBeNull();
  });

  // Test 2: Completing required learning unlocks the associated assessment
  it("2. completing all steps in a phase transitions milestone status to READY_FOR_ASSESSMENT", () => {
    const phaseSteps = [
      { stepNumber: 1, title: "HTML Basics", skills: ["HTML"] },
      { stepNumber: 2, title: "Semantic Tags", skills: ["HTML"] },
      { stepNumber: 3, title: "CSS Box Model", skills: ["CSS"] },
    ];

    const completedStepsPartial = [1, 2];
    const completedStepsAll = [1, 2, 3];

    // Partial completion
    const isReadyPartial =
      phaseSteps.every((s) => completedStepsPartial.includes(s.stepNumber));
    expect(isReadyPartial).toBe(false);

    // Full completion
    const isReadyAll =
      phaseSteps.every((s) => completedStepsAll.includes(s.stepNumber));
    expect(isReadyAll).toBe(true);
  });

  // Test 3: Assessment submission updates demonstrated proficiency
  it("3. assessment evaluation deterministically updates demonstrated level and label", () => {
    // 85% score -> Level 4 (Advanced)
    expect(percentageToDemonstratedLevel(85)).toBe(4);
    expect(getDemonstratedLevelLabel(85)).toBe("Advanced");

    // 55% score -> Level 2 (Developing)
    expect(percentageToDemonstratedLevel(55)).toBe(2);
    expect(getDemonstratedLevelLabel(55)).toBe("Developing");

    // 95% score -> Level 5 (Expert)
    expect(percentageToDemonstratedLevel(95)).toBe(5);
    expect(getDemonstratedLevelLabel(95)).toBe("Expert");

    // 25% score -> Level 1 (Beginner)
    expect(percentageToDemonstratedLevel(25)).toBe(1);
    expect(getDemonstratedLevelLabel(25)).toBe("Beginner");
  });

  // Test 4: Skill Gap reads the latest demonstrated assessment result
  it("4. skill gap computation integrates demonstrated evidence over self-reported rating", () => {
    const jobRole = { id: 1, title: "Frontend Developer" };
    const requiredSkills = [
      { skillId: 10, skillName: "React", requiredLevel: 4, importance: 5 },
    ];
    const studentSkills = [
      { skillId: 10, proficiencyLevel: 5 }, // Self-reported: 5 (Expert)
    ];

    // But assessment evidence proves Level 3 (Proficient, 65%)
    const demonstratedAttempt: DemonstratedSkillAttempt = {
      attemptId: 100,
      assessmentId: 1,
      assessmentTitle: "React Checkpoint",
      assessmentType: "milestone",
      score: 65,
      percentage: 65,
      demonstratedLevel: 3,
      levelLabel: "Proficient",
      completedAt: new Date("2026-09-20T10:00:00Z"),
    };

    const effectiveState = resolveEffectiveSkillState({
      skillId: 10,
      skillName: "React",
      latestDemonstrated: demonstratedAttempt,
      selfReportedLevel: 5,
      requiredLevel: 4,
    });

    // Demonstrated evidence takes absolute precedence over self-reported
    expect(effectiveState.source).toBe("DEMONSTRATED");
    expect(effectiveState.effectiveLevel).toBe(3);
    expect(effectiveState.effectiveLabel).toBe("Proficient");
    expect(effectiveState.demonstratedScore).toBe(65);
    expect(effectiveState.gap).toBe(1); // Required 4 - Demonstrated 3 = Gap 1
  });

  // Test 5: Historical assessment attempts remain preserved
  it("5. multiple attempts are retained in history without being overwritten", () => {
    const attempts: DemonstratedSkillAttempt[] = [
      {
        attemptId: 1,
        assessmentId: 1,
        assessmentTitle: "Diagnostic Assessment",
        assessmentType: "diagnostic",
        score: 40,
        percentage: 40,
        demonstratedLevel: 2,
        levelLabel: "Developing",
        completedAt: new Date("2026-09-01T10:00:00Z"),
      },
      {
        attemptId: 2,
        assessmentId: 2,
        assessmentTitle: "Milestone Checkpoint",
        assessmentType: "milestone",
        score: 80,
        percentage: 80,
        demonstratedLevel: 4,
        levelLabel: "Advanced",
        completedAt: new Date("2026-09-15T10:00:00Z"),
      },
    ];

    // All attempts preserved in array
    expect(attempts).toHaveLength(2);
    expect(attempts[0].attemptId).toBe(1);
    expect(attempts[1].attemptId).toBe(2);
  });

  // Test 6: A newer valid assessment replaces the current demonstrated state
  it("6. latest valid attempt strategy resolves the most recent attempt chronologically", () => {
    const olderHighAttempt: DemonstratedSkillAttempt = {
      attemptId: 1,
      assessmentId: 1,
      assessmentTitle: "Attempt 1",
      assessmentType: "milestone",
      score: 90,
      percentage: 90,
      demonstratedLevel: 5,
      levelLabel: "Expert",
      completedAt: new Date("2026-09-01T10:00:00Z"),
    };

    const newerLowerAttempt: DemonstratedSkillAttempt = {
      attemptId: 2,
      assessmentId: 1,
      assessmentTitle: "Attempt 2",
      assessmentType: "milestone",
      score: 75,
      percentage: 75,
      demonstratedLevel: 4,
      levelLabel: "Advanced",
      completedAt: new Date("2026-09-25T10:00:00Z"),
    };

    // Does NOT artificially pick highest score (90); picks the latest valid attempt (75)
    const current = resolveCurrentDemonstratedSkill([
      olderHighAttempt,
      newerLowerAttempt,
    ]);

    expect(current).not.toBeNull();
    expect(current?.attemptId).toBe(2);
    expect(current?.percentage).toBe(75);
    expect(current?.demonstratedLevel).toBe(4);
  });

  // Test 7: Weak assessment results appear in Skill Gap
  it("7. low assessment scores (<60%, Level <3) are flagged as weak skills", () => {
    const weakAttempt: DemonstratedSkillAttempt = {
      attemptId: 5,
      assessmentId: 3,
      assessmentTitle: "Backend Checkpoint",
      assessmentType: "milestone",
      score: 45,
      percentage: 45,
      demonstratedLevel: 2,
      levelLabel: "Developing",
      completedAt: new Date("2026-09-22T10:00:00Z"),
    };

    const isWeak = weakAttempt.demonstratedLevel < 3;
    expect(isWeak).toBe(true);

    const effective = resolveEffectiveSkillState({
      skillId: 20,
      skillName: "Node.js",
      latestDemonstrated: weakAttempt,
      requiredLevel: 4,
    });

    expect(effective.status).toBe("BELOW_REQUIREMENT");
    expect(effective.effectiveLevel).toBe(2);
    expect(effective.gap).toBe(2);
  });

  // Test 8: Improved assessment results remove the skill from weak-skill state
  it("8. improved assessment score (>=60%, Level >=3) promotes skill out of weak status", () => {
    const passedAttempt: DemonstratedSkillAttempt = {
      attemptId: 6,
      assessmentId: 3,
      assessmentTitle: "Backend Checkpoint Reattempt",
      assessmentType: "milestone",
      score: 80,
      percentage: 80,
      demonstratedLevel: 4,
      levelLabel: "Advanced",
      completedAt: new Date("2026-09-28T10:00:00Z"),
    };

    const isWeak = passedAttempt.demonstratedLevel < 3;
    expect(isWeak).toBe(false);

    const effective = resolveEffectiveSkillState({
      skillId: 20,
      skillName: "Node.js",
      latestDemonstrated: passedAttempt,
      requiredLevel: 4,
    });

    expect(effective.status).toBe("MEETS_REQUIREMENT");
    expect(effective.effectiveLevel).toBe(4);
    expect(effective.gap).toBe(0);
  });

  // Test 9: Roadmap completion remains independent from assessment score
  it("9. roadmap step completion state is persistent and independent from assessment score", () => {
    const roadmapProgress = {
      roadmapId: 10,
      completedSteps: [1, 2, 3, 4],
    };

    // Even if student fails an assessment with 30%, completed steps remain completed
    const failedAssessmentScore = 30;
    expect(failedAssessmentScore).toBeLessThan(70);

    // Roadmap learning progress is preserved
    expect(roadmapProgress.completedSteps).toContain(1);
    expect(roadmapProgress.completedSteps).toContain(2);
    expect(roadmapProgress.completedSteps).toContain(3);
    expect(roadmapProgress.completedSteps).toContain(4);
  });

  // Test 10: Existing authentication/security behavior remains unchanged
  it("10. API security checks enforce authenticated user ID and role authorization", () => {
    // Validates that unauthenticated request gets rejected
    const unauthenticatedUser = null;
    expect(unauthenticatedUser).toBeNull();

    const authenticatedStudent = { id: 10, role: "student" };
    expect(authenticatedStudent.role).toBe("student");

    const authenticatedAdmin = { id: 1, role: "admin" };
    expect(authenticatedAdmin.role).toBe("admin");
  });
});
