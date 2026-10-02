import { describe, it, expect } from "vitest";
import { buildSkillProgressHistory } from "../student-assessment";
import { getDemonstratedLevelLabel, percentageToDemonstratedLevel } from "../proficiency";

describe("Assessment-Based Skill Progress History", () => {
  // Test 1: Empty history returns empty array
  it("1. empty history returns an empty array", () => {
    const result = buildSkillProgressHistory({ rawHistory: [] });
    expect(result).toEqual([]);
  });

  // Test 2: Single-assessment history resolves baseline and neutral state
  it("2. single-assessment history returns single data point and correct proficiency label", () => {
    const rawHistory = [
      {
        skillId: 10,
        skillName: "TypeScript",
        attemptId: 101,
        assessmentTitle: "TypeScript Diagnostic",
        assessmentType: "diagnostic",
        percentage: 65,
        demonstratedLevel: 3,
        completedAt: "2026-09-01T10:00:00Z",
      },
    ];

    const result = buildSkillProgressHistory({ rawHistory });
    expect(result).toHaveLength(1);

    const skill = result[0];
    expect(skill.skillName).toBe("TypeScript");
    expect(skill.attempts).toHaveLength(1);
    expect(skill.diagnosticPercentage).toBe(65);
    expect(skill.latestPercentage).toBe(65);
    expect(skill.latestDemonstratedLevel).toBe(3);
    expect(skill.latestLevelLabel).toBe("Proficient");
    expect(skill.improvementPercentage).toBeNull(); // Single assessment -> no delta computed
  });

  // Test 3: Chronological ordering of assessment history (regardless of insertion order)
  it("3. assessment attempts are ordered chronologically by completedAt ascending", () => {
    const rawHistory = [
      {
        skillId: 10,
        skillName: "React",
        attemptId: 103,
        assessmentTitle: "Milestone Checkpoint 2",
        assessmentType: "milestone",
        percentage: 85,
        demonstratedLevel: 4,
        completedAt: "2026-09-25T10:00:00Z", // Latest
      },
      {
        skillId: 10,
        skillName: "React",
        attemptId: 101,
        assessmentTitle: "Diagnostic Assessment",
        assessmentType: "diagnostic",
        percentage: 45,
        demonstratedLevel: 2,
        completedAt: "2026-09-01T10:00:00Z", // First
      },
      {
        skillId: 10,
        skillName: "React",
        attemptId: 102,
        assessmentTitle: "Milestone Checkpoint 1",
        assessmentType: "milestone",
        percentage: 65,
        demonstratedLevel: 3,
        completedAt: "2026-09-15T10:00:00Z", // Middle
      },
    ];

    const result = buildSkillProgressHistory({ rawHistory });
    expect(result).toHaveLength(1);

    const skill = result[0];
    expect(skill.attempts).toHaveLength(3);
    expect(skill.attempts[0].attemptId).toBe(101); // Sep 1
    expect(skill.attempts[1].attemptId).toBe(102); // Sep 15
    expect(skill.attempts[2].attemptId).toBe(103); // Sep 25
  });

  // Test 4: Latest score and latest demonstrated level resolution
  it("4. latest score resolution correctly picks the most recent attempt", () => {
    const rawHistory = [
      {
        skillId: 20,
        skillName: "Node.js",
        attemptId: 1,
        assessmentTitle: "Attempt 1",
        assessmentType: "diagnostic",
        percentage: 50,
        demonstratedLevel: 2,
        completedAt: "2026-08-01T10:00:00Z",
      },
      {
        skillId: 20,
        skillName: "Node.js",
        attemptId: 2,
        assessmentTitle: "Attempt 2",
        assessmentType: "milestone",
        percentage: 90,
        demonstratedLevel: 5,
        completedAt: "2026-09-01T10:00:00Z",
      },
    ];

    const result = buildSkillProgressHistory({ rawHistory });
    const skill = result[0];
    expect(skill.latestPercentage).toBe(90);
    expect(skill.latestDemonstratedLevel).toBe(5);
    expect(skill.latestLevelLabel).toBe("Expert");
  });

  // Test 5: Multiple assessments showing improvement (+ delta)
  it("5. multiple assessments showing score improvement calculate positive percentage delta", () => {
    const rawHistory = [
      {
        skillId: 30,
        skillName: "SQL",
        attemptId: 1,
        assessmentTitle: "Diagnostic",
        assessmentType: "diagnostic",
        percentage: 40,
        demonstratedLevel: 2,
        completedAt: "2026-09-01T10:00:00Z",
      },
      {
        skillId: 30,
        skillName: "SQL",
        attemptId: 2,
        assessmentTitle: "Checkpoint 1",
        assessmentType: "milestone",
        percentage: 75,
        demonstratedLevel: 4,
        completedAt: "2026-09-20T10:00:00Z",
      },
    ];

    const result = buildSkillProgressHistory({ rawHistory });
    const skill = result[0];
    expect(skill.diagnosticPercentage).toBe(40);
    expect(skill.latestPercentage).toBe(75);
    expect(skill.improvementPercentage).toBe(35); // 75 - 40 = +35
  });

  // Test 6: Multiple assessments showing decline (- delta)
  it("6. multiple assessments showing score decline calculate negative percentage delta", () => {
    const rawHistory = [
      {
        skillId: 40,
        skillName: "Docker",
        attemptId: 1,
        assessmentTitle: "Diagnostic",
        assessmentType: "diagnostic",
        percentage: 80,
        demonstratedLevel: 4,
        completedAt: "2026-09-01T10:00:00Z",
      },
      {
        skillId: 40,
        skillName: "Docker",
        attemptId: 2,
        assessmentTitle: "Checkpoint 1",
        assessmentType: "milestone",
        percentage: 60,
        demonstratedLevel: 3,
        completedAt: "2026-09-20T10:00:00Z",
      },
    ];

    const result = buildSkillProgressHistory({ rawHistory });
    const skill = result[0];
    expect(skill.diagnosticPercentage).toBe(80);
    expect(skill.latestPercentage).toBe(60);
    expect(skill.improvementPercentage).toBe(-20); // 60 - 80 = -20
  });

  // Test 7: Proficiency label conversion via centralized src/lib/proficiency.ts
  it("7. proficiency labels are resolved strictly using src/lib/proficiency.ts model", () => {
    const scores = [
      { percentage: 25, expectedLevel: 1, expectedLabel: "Beginner" },
      { percentage: 45, expectedLevel: 2, expectedLabel: "Developing" },
      { percentage: 65, expectedLevel: 3, expectedLabel: "Proficient" },
      { percentage: 80, expectedLevel: 4, expectedLabel: "Advanced" },
      { percentage: 95, expectedLevel: 5, expectedLabel: "Expert" },
    ];

    for (const item of scores) {
      expect(percentageToDemonstratedLevel(item.percentage)).toBe(item.expectedLevel);
      expect(getDemonstratedLevelLabel(item.percentage)).toBe(item.expectedLabel);
    }
  });
});
