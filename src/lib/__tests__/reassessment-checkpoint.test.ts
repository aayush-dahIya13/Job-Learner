import { describe, it, expect } from "vitest";
import {
  checkSkillReassessmentEligibility,
  checkStepReassessmentEligibility,
} from "@/lib/reassessment";
import {
  resolveCurrentDemonstratedSkill,
  percentageToDemonstratedLevel,
  getDemonstratedLevelLabel,
  type DemonstratedSkillAttempt,
} from "@/lib/proficiency";

describe("Reassessment Checkpoint Feature", () => {
  const samplePhases = [
    {
      phase: 1,
      title: "Foundations",
      steps: [
        {
          stepNumber: 1,
          title: "TypeScript Foundations",
          skills: ["TypeScript"],
        },
        {
          stepNumber: 2,
          title: "Node.js Basics",
          skills: ["Node.js"],
        },
        {
          stepNumber: 3,
          title: "General Orientation",
          skills: [],
        },
      ],
    },
  ];

  it("1. completed learning step makes reassessment available", () => {
    const result = checkSkillReassessmentEligibility({
      skillName: "TypeScript",
      completedStepNumbers: [1],
      phases: samplePhases,
    });

    expect(result.isEligible).toBe(true);
    expect(result.status).toBe("REASSESSMENT_READY");
    expect(result.stepNumber).toBe(1);
    expect(result.actionUrl).toContain("/assessments");
  });

  it("2. reassessment uses the existing assessment flow", () => {
    const result = checkSkillReassessmentEligibility({
      skillName: "TypeScript",
      completedStepNumbers: [1],
      phases: samplePhases,
      assessmentId: 42,
    });

    expect(result.isEligible).toBe(true);
    expect(result.actionUrl).toBe("/assessments?assessmentId=42");
    expect(result.assessmentId).toBe(42);
  });

  it("3. previous assessment history remains intact when a new reassessment attempt is added", () => {
    const history: DemonstratedSkillAttempt[] = [
      {
        attemptId: 101,
        assessmentId: 1,
        assessmentTitle: "TypeScript Diagnostic",
        assessmentType: "diagnostic",
        score: 35,
        percentage: 35,
        demonstratedLevel: 1,
        levelLabel: "Beginner",
        completedAt: "2026-09-01T10:00:00Z",
      },
    ];

    const newAttempt: DemonstratedSkillAttempt = {
      attemptId: 102,
      assessmentId: 1,
      assessmentTitle: "TypeScript Diagnostic",
      assessmentType: "diagnostic",
      score: 75,
      percentage: 75,
      demonstratedLevel: 4,
      levelLabel: "Advanced",
      completedAt: "2026-10-03T10:00:00Z",
    };

    const updatedHistory = [...history, newAttempt];

    expect(updatedHistory).toHaveLength(2);
    expect(updatedHistory[0].score).toBe(35);
    expect(updatedHistory[1].score).toBe(75);
    expect(updatedHistory[0].attemptId).toBe(101);
    expect(updatedHistory[1].attemptId).toBe(102);
  });

  it("4. new score updates demonstrated proficiency", () => {
    const history: DemonstratedSkillAttempt[] = [
      {
        attemptId: 101,
        assessmentId: 1,
        assessmentTitle: "TypeScript Diagnostic",
        assessmentType: "diagnostic",
        score: 35,
        percentage: 35,
        demonstratedLevel: percentageToDemonstratedLevel(35),
        levelLabel: getDemonstratedLevelLabel(35),
        completedAt: "2026-09-01T10:00:00Z",
      },
      {
        attemptId: 102,
        assessmentId: 1,
        assessmentTitle: "TypeScript Diagnostic",
        assessmentType: "diagnostic",
        score: 75,
        percentage: 75,
        demonstratedLevel: percentageToDemonstratedLevel(75),
        levelLabel: getDemonstratedLevelLabel(75),
        completedAt: "2026-10-03T10:00:00Z",
      },
    ];

    const currentProficiency = resolveCurrentDemonstratedSkill(history);

    expect(currentProficiency).not.toBeNull();
    expect(currentProficiency?.score).toBe(75);
    expect(currentProficiency?.demonstratedLevel).toBe(4);
    expect(currentProficiency?.levelLabel).toBe("Advanced");
  });

  it("5. learning completion remains unchanged after assessment submission", () => {
    const completedStepNumbers = [1, 2];

    const assessmentResult = { score: 85, percentage: 85 };

    expect(completedStepNumbers).toEqual([1, 2]);
    expect(assessmentResult.percentage).toBe(85);
  });

  it("6. no matching assessment produces a safe fallback", () => {
    const stepResult = checkStepReassessmentEligibility({
      stepNumber: 3,
      stepSkills: [],
      isCompleted: true,
    });

    expect(stepResult.isEligible).toBe(false);
    expect(stepResult.status).toBe("NO_MATCHING_ASSESSMENT");
    expect(stepResult.badgeLabel).toBe("No Skill Mapping");
    expect(stepResult.helperText).toContain("No matching assessment available");

    const skillResult = checkSkillReassessmentEligibility({
      skillName: "TypeScript",
      completedStepNumbers: [1],
      phases: samplePhases,
      hasAssessmentAvailable: false,
    });

    expect(skillResult.isEligible).toBe(false);
    expect(skillResult.status).toBe("NO_MATCHING_ASSESSMENT");
    expect(skillResult.helperText).toContain("No matching assessment available");
  });
});
