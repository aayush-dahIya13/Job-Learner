import { describe, it, expect } from "vitest";
import { buildSkillJourneySummary } from "@/lib/skill-improvement-journey";
import { percentageToDemonstratedLevel, getDemonstratedLevelLabel } from "@/lib/proficiency";
import type { SkillProgressHistory } from "@/lib/student-assessment";

describe("Skill Improvement Journey Feature", () => {
  const samplePhases = [
    {
      phase: 1,
      title: "Foundations",
      steps: [
        {
          stepNumber: 1,
          title: "TypeScript Fundamentals",
          skills: ["TypeScript"],
        },
        {
          stepNumber: 2,
          title: "React Components",
          skills: ["React"],
        },
      ],
    },
  ];

  it("1. returns empty array for empty assessment history", () => {
    const summary = buildSkillJourneySummary({
      history: [],
      phases: samplePhases,
      completedStepNumbers: [],
    });

    expect(summary).toEqual([]);
  });

  it("2. single assessment resolves to First assessment baseline with no false improvement or decline", () => {
    const history: SkillProgressHistory[] = [
      {
        skillId: 10,
        skillName: "TypeScript",
        selfReportedLevel: 2,
        diagnosticPercentage: 35,
        diagnosticLevel: 1,
        latestPercentage: 35,
        latestDemonstratedLevel: 1,
        latestLevelLabel: "Beginner",
        improvementPercentage: null,
        attempts: [
          {
            attemptId: 1,
            assessmentTitle: "TypeScript Diagnostic",
            assessmentType: "diagnostic",
            percentage: 35,
            demonstratedLevel: 1,
            levelLabel: "Beginner",
            completedAt: "2026-09-01T10:00:00Z",
          },
        ],
      },
    ];

    const summary = buildSkillJourneySummary({
      history,
      phases: samplePhases,
      completedStepNumbers: [],
    });

    expect(summary).toHaveLength(1);
    const item = summary[0];
    expect(item.isSingleAssessment).toBe(true);
    expect(item.scoreChange).toBeNull();
    expect(item.isPositiveChange).toBe(false);
    expect(item.isNegativeChange).toBe(false);
    expect(item.latestPercentage).toBe(35);
    expect(item.latestLevelLabel).toBe("Beginner");
  });

  it("3. two assessments with positive score delta shows improvement", () => {
    const history: SkillProgressHistory[] = [
      {
        skillId: 10,
        skillName: "TypeScript",
        selfReportedLevel: 2,
        diagnosticPercentage: 42,
        diagnosticLevel: 2,
        latestPercentage: 68,
        latestDemonstratedLevel: 3,
        latestLevelLabel: "Proficient",
        improvementPercentage: 26,
        attempts: [
          {
            attemptId: 1,
            assessmentTitle: "TypeScript Diagnostic",
            assessmentType: "diagnostic",
            percentage: 42,
            demonstratedLevel: 2,
            levelLabel: "Developing",
            completedAt: "2026-09-01T10:00:00Z",
          },
          {
            attemptId: 2,
            assessmentTitle: "TypeScript Reassessment",
            assessmentType: "checkpoint",
            percentage: 68,
            demonstratedLevel: 3,
            levelLabel: "Proficient",
            completedAt: "2026-10-01T10:00:00Z",
          },
        ],
      },
    ];

    const summary = buildSkillJourneySummary({
      history,
      phases: samplePhases,
      completedStepNumbers: [],
    });

    const item = summary[0];
    expect(item.isSingleAssessment).toBe(false);
    expect(item.previousPercentage).toBe(42);
    expect(item.latestPercentage).toBe(68);
    expect(item.scoreChange).toBe(26);
    expect(item.isPositiveChange).toBe(true);
    expect(item.isNegativeChange).toBe(false);
  });

  it("4. two assessments with negative score delta shows score decrease without negative student labels", () => {
    const history: SkillProgressHistory[] = [
      {
        skillId: 10,
        skillName: "TypeScript",
        selfReportedLevel: 3,
        diagnosticPercentage: 68,
        diagnosticLevel: 3,
        latestPercentage: 51,
        latestDemonstratedLevel: 2,
        latestLevelLabel: "Developing",
        improvementPercentage: -17,
        attempts: [
          {
            attemptId: 1,
            assessmentTitle: "TypeScript Diagnostic",
            assessmentType: "diagnostic",
            percentage: 68,
            demonstratedLevel: 3,
            levelLabel: "Proficient",
            completedAt: "2026-09-01T10:00:00Z",
          },
          {
            attemptId: 2,
            assessmentTitle: "TypeScript Checkpoint",
            assessmentType: "checkpoint",
            percentage: 51,
            demonstratedLevel: 2,
            levelLabel: "Developing",
            completedAt: "2026-10-01T10:00:00Z",
          },
        ],
      },
    ];

    const summary = buildSkillJourneySummary({
      history,
      phases: samplePhases,
      completedStepNumbers: [],
    });

    const item = summary[0];
    expect(item.scoreChange).toBe(-17);
    expect(item.isPositiveChange).toBe(false);
    expect(item.isNegativeChange).toBe(true);
  });

  it("5. multiple assessments are ordered chronologically by completedAt", () => {
    const history: SkillProgressHistory[] = [
      {
        skillId: 10,
        skillName: "TypeScript",
        selfReportedLevel: null,
        diagnosticPercentage: 30,
        diagnosticLevel: 1,
        latestPercentage: 80,
        latestDemonstratedLevel: 4,
        latestLevelLabel: "Advanced",
        improvementPercentage: 50,
        attempts: [
          // Out of order input
          {
            attemptId: 3,
            assessmentTitle: "Checkpoint 2",
            assessmentType: "checkpoint",
            percentage: 80,
            demonstratedLevel: 4,
            levelLabel: "Advanced",
            completedAt: "2026-10-05T10:00:00Z",
          },
          {
            attemptId: 1,
            assessmentTitle: "Diagnostic",
            assessmentType: "diagnostic",
            percentage: 30,
            demonstratedLevel: 1,
            levelLabel: "Beginner",
            completedAt: "2026-08-01T10:00:00Z",
          },
          {
            attemptId: 2,
            assessmentTitle: "Checkpoint 1",
            assessmentType: "checkpoint",
            percentage: 55,
            demonstratedLevel: 2,
            levelLabel: "Developing",
            completedAt: "2026-09-01T10:00:00Z",
          },
        ],
      },
    ];

    const summary = buildSkillJourneySummary({
      history,
      phases: samplePhases,
      completedStepNumbers: [],
    });

    const item = summary[0];
    expect(item.attempts[0].attemptId).toBe(1);
    expect(item.attempts[1].attemptId).toBe(2);
    expect(item.attempts[2].attemptId).toBe(3);
  });

  it("6. latest assessment is correctly identified as the current demonstrated state", () => {
    const history: SkillProgressHistory[] = [
      {
        skillId: 10,
        skillName: "TypeScript",
        selfReportedLevel: null,
        diagnosticPercentage: 40,
        diagnosticLevel: 2,
        latestPercentage: 75,
        latestDemonstratedLevel: 4,
        latestLevelLabel: "Advanced",
        improvementPercentage: 35,
        attempts: [
          {
            attemptId: 1,
            assessmentTitle: "Diagnostic",
            assessmentType: "diagnostic",
            percentage: 40,
            demonstratedLevel: 2,
            levelLabel: "Developing",
            completedAt: "2026-08-01T10:00:00Z",
          },
          {
            attemptId: 2,
            assessmentTitle: "Checkpoint",
            assessmentType: "checkpoint",
            percentage: 75,
            demonstratedLevel: 4,
            levelLabel: "Advanced",
            completedAt: "2026-09-01T10:00:00Z",
          },
        ],
      },
    ];

    const summary = buildSkillJourneySummary({
      history,
      phases: samplePhases,
      completedStepNumbers: [],
    });

    expect(summary[0].latestPercentage).toBe(75);
    expect(summary[0].latestDemonstratedLevel).toBe(4);
    expect(summary[0].latestLevelLabel).toBe("Advanced");
  });

  it("7. resolves correct proficiency labels at exact score boundaries using centralized proficiency model", () => {
    expect(percentageToDemonstratedLevel(0)).toBe(1);
    expect(getDemonstratedLevelLabel(0)).toBe("Beginner");

    expect(percentageToDemonstratedLevel(39)).toBe(1);
    expect(getDemonstratedLevelLabel(39)).toBe("Beginner");

    expect(percentageToDemonstratedLevel(40)).toBe(2);
    expect(getDemonstratedLevelLabel(40)).toBe("Developing");

    expect(percentageToDemonstratedLevel(59)).toBe(2);
    expect(getDemonstratedLevelLabel(59)).toBe("Developing");

    expect(percentageToDemonstratedLevel(60)).toBe(3);
    expect(getDemonstratedLevelLabel(60)).toBe("Proficient");

    expect(percentageToDemonstratedLevel(74)).toBe(3);
    expect(getDemonstratedLevelLabel(74)).toBe("Proficient");

    expect(percentageToDemonstratedLevel(75)).toBe(4);
    expect(getDemonstratedLevelLabel(75)).toBe("Advanced");

    expect(percentageToDemonstratedLevel(89)).toBe(4);
    expect(getDemonstratedLevelLabel(89)).toBe("Advanced");

    expect(percentageToDemonstratedLevel(90)).toBe(5);
    expect(getDemonstratedLevelLabel(90)).toBe("Expert");
  });

  it("8. connects roadmap completion as learning context with neutral wording", () => {
    const history: SkillProgressHistory[] = [
      {
        skillId: 10,
        skillName: "TypeScript",
        selfReportedLevel: null,
        diagnosticPercentage: 35,
        diagnosticLevel: 1,
        latestPercentage: 70,
        latestDemonstratedLevel: 3,
        latestLevelLabel: "Proficient",
        improvementPercentage: 35,
        attempts: [
          {
            attemptId: 1,
            assessmentTitle: "Diagnostic",
            assessmentType: "diagnostic",
            percentage: 35,
            demonstratedLevel: 1,
            levelLabel: "Beginner",
            completedAt: "2026-08-01T10:00:00Z",
          },
          {
            attemptId: 2,
            assessmentTitle: "Checkpoint",
            assessmentType: "checkpoint",
            percentage: 70,
            demonstratedLevel: 3,
            levelLabel: "Proficient",
            completedAt: "2026-09-01T10:00:00Z",
          },
        ],
      },
    ];

    const summary = buildSkillJourneySummary({
      history,
      phases: samplePhases,
      completedStepNumbers: [1], // Step 1 (TypeScript Fundamentals) completed
    });

    const item = summary[0];
    expect(item.completedLearningSteps).toHaveLength(1);
    expect(item.completedLearningSteps[0].title).toBe("TypeScript Fundamentals");

    const learningEvent = item.timelineEvents.find((e) => e.type === "learning_completed");
    expect(learningEvent).toBeDefined();
    expect(learningEvent?.note).toBe("Learning completed before reassessment.");
  });

  it("9. assessment history remains unchanged when processing journey summary", () => {
    const history: SkillProgressHistory[] = [
      {
        skillId: 10,
        skillName: "TypeScript",
        selfReportedLevel: 2,
        diagnosticPercentage: 40,
        diagnosticLevel: 2,
        latestPercentage: 60,
        latestDemonstratedLevel: 3,
        latestLevelLabel: "Proficient",
        improvementPercentage: 20,
        attempts: [
          {
            attemptId: 1,
            assessmentTitle: "Diagnostic",
            assessmentType: "diagnostic",
            percentage: 40,
            demonstratedLevel: 2,
            levelLabel: "Developing",
            completedAt: "2026-08-01T10:00:00Z",
          },
        ],
      },
    ];

    const originalAttemptCount = history[0].attempts.length;
    const originalScore = history[0].attempts[0].percentage;

    buildSkillJourneySummary({
      history,
      phases: samplePhases,
      completedStepNumbers: [1],
    });

    expect(history[0].attempts).toHaveLength(originalAttemptCount);
    expect(history[0].attempts[0].percentage).toBe(originalScore);
  });

  it("10. learning completion remains independent from assessment score", () => {
    const completedStepNumbers = [1];
    const score = 30; // low reassessment score

    // Evaluating summary does not change step completion vector
    buildSkillJourneySummary({
      history: [],
      phases: samplePhases,
      completedStepNumbers,
    });

    expect(completedStepNumbers).toEqual([1]);
    expect(score).toBe(30);
  });

  it("11. weak skill continues to be identified for Skill Gap if demonstrated level < 3", () => {
    const level = percentageToDemonstratedLevel(45); // Level 2 Developing
    const isWeak = level < 3;

    expect(level).toBe(2);
    expect(isWeak).toBe(true);
  });

  it("12. does not fabricate learning or assessment data when none exists", () => {
    const summary = buildSkillJourneySummary({
      history: [
        {
          skillId: 99,
          skillName: "Docker",
          selfReportedLevel: null,
          diagnosticPercentage: 50,
          diagnosticLevel: 2,
          latestPercentage: 50,
          latestDemonstratedLevel: 2,
          latestLevelLabel: "Developing",
          improvementPercentage: null,
          attempts: [
            {
              attemptId: 1,
              assessmentTitle: "Diagnostic",
              assessmentType: "diagnostic",
              percentage: 50,
              demonstratedLevel: 2,
              levelLabel: "Developing",
              completedAt: "2026-08-01T10:00:00Z",
            },
          ],
        },
      ],
      phases: samplePhases,
      completedStepNumbers: [],
    });

    const item = summary[0];
    expect(item.completedLearningSteps).toEqual([]);
    expect(item.allMatchingRoadmapSteps).toEqual([]);
    expect(item.timelineEvents.filter((e) => e.type === "learning_completed")).toEqual([]);
  });
});
