import { describe, it, expect, vi } from "vitest";
import { getStudentLearningStatus } from "@/lib/student-dashboard-status";
import { percentageToDemonstratedLevel, getDemonstratedLevelLabel } from "@/lib/proficiency";
import * as studentSkillGap from "@/lib/student-skill-gap";
import * as studentAssessment from "@/lib/student-assessment";
import * as aiStore from "@/lib/ai/store";

describe("Student Dashboard Status Aggregation", () => {
  it("1. complete student data returns all dashboard sections", async () => {
    vi.spyOn(studentSkillGap, "getStudentSkillGap").mockResolvedValue({
      jobRole: { id: 1, title: "Full Stack Engineer" },
      readinessScore: 78,
      summary: { totalRequiredSkills: 10, masteredSkills: 7, needsImprovement: 2, missingSkills: 1 },
      assessmentWeakSkills: [
        {
          skillId: 101,
          skillName: "SQL",
          score: 38,
          level: 1,
          label: "Beginner",
          isIndustryRequired: true,
          isHighPriority: true,
          completedAt: new Date().toISOString(),
        },
      ],
      hasTakenAssessment: true,
      lastAssessedAt: new Date().toISOString(),
      skills: [],
      progressHistory: [
        {
          skillId: 102,
          skillName: "React",
          selfReportedLevel: 3,
          diagnosticPercentage: 42,
          diagnosticLevel: 2,
          latestPercentage: 68,
          latestDemonstratedLevel: 3,
          latestLevelLabel: "Proficient",
          improvementPercentage: 26,
          attempts: [
            {
              attemptId: 1,
              assessmentTitle: "React Baseline",
              assessmentType: "diagnostic",
              percentage: 42,
              demonstratedLevel: 2,
              levelLabel: "Developing",
              completedAt: "2026-09-01T10:00:00Z",
            },
            {
              attemptId: 2,
              assessmentTitle: "React Checkpoint",
              assessmentType: "checkpoint",
              percentage: 68,
              demonstratedLevel: 3,
              levelLabel: "Proficient",
              completedAt: "2026-10-01T10:00:00Z",
            },
          ],
        },
      ],
    } as any);

    vi.spyOn(studentAssessment, "getLatestCompletedAssessment").mockResolvedValue({
      attemptId: 2,
      assessmentId: 10,
      title: "Full Stack Milestone",
      assessmentType: "checkpoint",
      completedAt: "2026-10-01T10:00:00Z",
      score: 68,
      percentage: 68,
      attemptNumber: 2,
      skillsCount: 5,
      skills: [],
    });

    vi.spyOn(studentAssessment, "getSkillProgressHistory").mockResolvedValue([
      {
        skillId: 102,
        skillName: "React",
        selfReportedLevel: 3,
        diagnosticPercentage: 42,
        diagnosticLevel: 2,
        latestPercentage: 68,
        latestDemonstratedLevel: 3,
        latestLevelLabel: "Proficient",
        improvementPercentage: 26,
        attempts: [
          {
            attemptId: 1,
            assessmentTitle: "React Baseline",
            assessmentType: "diagnostic",
            percentage: 42,
            demonstratedLevel: 2,
            levelLabel: "Developing",
            completedAt: "2026-09-01T10:00:00Z",
          },
          {
            attemptId: 2,
            assessmentTitle: "React Checkpoint",
            assessmentType: "checkpoint",
            percentage: 68,
            demonstratedLevel: 3,
            levelLabel: "Proficient",
            completedAt: "2026-10-01T10:00:00Z",
          },
        ],
      },
    ]);

    vi.spyOn(aiStore, "latestRoadmap").mockResolvedValue({
      id: 99,
      readiness_score: 78,
      generated_at: new Date().toISOString(),
      phases: [
        {
          phase: 1,
          title: "Database Mastery",
          steps: [
            { stepNumber: 1, title: "SQL Indexing", skills: ["SQL"] },
          ],
        },
      ],
    } as any);

    vi.spyOn(studentSkillGap, "getCompletedRoadmapStepNumbers").mockResolvedValue([]);

    const status = await getStudentLearningStatus(1);

    expect(status.hasTargetRole).toBe(true);
    expect(status.jobRoleTitle).toBe("Full Stack Engineer");
    expect(status.readinessScore).toBe(78);
    expect(status.hasTakenAssessment).toBe(true);
    expect(status.improvingSkills).toHaveLength(1);
    expect(status.improvingSkills[0].skillName).toBe("React");
    expect(status.improvingSkills[0].scoreChange).toBe(26);
    expect(status.attentionSkills).toHaveLength(1);
    expect(status.attentionSkills[0].skillName).toBe("SQL");
    expect(status.latestAssessment?.title).toBe("Full Stack Milestone");
    expect(status.recommendation.status).toBe("RECOMMENDED");
  });

  it("2. no assessment history returns safe empty state", async () => {
    vi.spyOn(studentSkillGap, "getStudentSkillGap").mockResolvedValue(null);
    vi.spyOn(studentAssessment, "getLatestCompletedAssessment").mockResolvedValue(null);
    vi.spyOn(studentAssessment, "getSkillProgressHistory").mockResolvedValue([]);
    vi.spyOn(aiStore, "latestRoadmap").mockResolvedValue(null);

    const status = await getStudentLearningStatus(1);

    expect(status.hasTargetRole).toBe(false);
    expect(status.readinessScore).toBeNull();
    expect(status.hasTakenAssessment).toBe(false);
    expect(status.improvingSkills).toEqual([]);
    expect(status.attentionSkills).toEqual([]);
    expect(status.latestAssessment).toBeNull();
    expect(status.recommendation.status).toBe("NO_WEAK_SKILL");
  });

  it("3. single assessment is NOT treated as an improving skill", async () => {
    vi.spyOn(studentSkillGap, "getStudentSkillGap").mockResolvedValue(null);
    vi.spyOn(studentAssessment, "getLatestCompletedAssessment").mockResolvedValue(null);
    vi.spyOn(aiStore, "latestRoadmap").mockResolvedValue(null);
    vi.spyOn(studentAssessment, "getSkillProgressHistory").mockResolvedValue([
      {
        skillId: 102,
        skillName: "React",
        selfReportedLevel: 3,
        diagnosticPercentage: 70,
        diagnosticLevel: 3,
        latestPercentage: 70,
        latestDemonstratedLevel: 3,
        latestLevelLabel: "Proficient",
        improvementPercentage: null,
        attempts: [
          {
            attemptId: 1,
            assessmentTitle: "React Baseline",
            assessmentType: "diagnostic",
            percentage: 70,
            demonstratedLevel: 3,
            levelLabel: "Proficient",
            completedAt: "2026-09-01T10:00:00Z",
          },
        ],
      },
    ]);

    const status = await getStudentLearningStatus(1);

    expect(status.improvingSkills).toEqual([]);
  });

  it("4. two assessments with positive score change identify an improving skill", async () => {
    vi.spyOn(studentAssessment, "getSkillProgressHistory").mockResolvedValue([
      {
        skillId: 105,
        skillName: "Node.js",
        selfReportedLevel: 2,
        diagnosticPercentage: 40,
        diagnosticLevel: 2,
        latestPercentage: 75,
        latestDemonstratedLevel: 4,
        latestLevelLabel: "Advanced",
        improvementPercentage: 35,
        attempts: [
          {
            attemptId: 10,
            assessmentTitle: "Node Baseline",
            assessmentType: "diagnostic",
            percentage: 40,
            demonstratedLevel: 2,
            levelLabel: "Developing",
            completedAt: "2026-08-01T10:00:00Z",
          },
          {
            attemptId: 11,
            assessmentTitle: "Node Checkpoint",
            assessmentType: "checkpoint",
            percentage: 75,
            demonstratedLevel: 4,
            levelLabel: "Advanced",
            completedAt: "2026-09-01T10:00:00Z",
          },
        ],
      },
    ]);

    const status = await getStudentLearningStatus(1);

    expect(status.improvingSkills).toHaveLength(1);
    expect(status.improvingSkills[0].skillName).toBe("Node.js");
    expect(status.improvingSkills[0].previousPercentage).toBe(40);
    expect(status.improvingSkills[0].latestPercentage).toBe(75);
    expect(status.improvingSkills[0].scoreChange).toBe(35);
  });

  it("5. negative score change is NOT listed as an improving skill", async () => {
    vi.spyOn(studentAssessment, "getSkillProgressHistory").mockResolvedValue([
      {
        skillId: 105,
        skillName: "Node.js",
        selfReportedLevel: 3,
        diagnosticPercentage: 70,
        diagnosticLevel: 3,
        latestPercentage: 55,
        latestDemonstratedLevel: 2,
        latestLevelLabel: "Developing",
        improvementPercentage: -15,
        attempts: [
          {
            attemptId: 10,
            assessmentTitle: "Baseline",
            assessmentType: "diagnostic",
            percentage: 70,
            demonstratedLevel: 3,
            levelLabel: "Proficient",
            completedAt: "2026-08-01T10:00:00Z",
          },
          {
            attemptId: 11,
            assessmentTitle: "Checkpoint",
            assessmentType: "checkpoint",
            percentage: 55,
            demonstratedLevel: 2,
            levelLabel: "Developing",
            completedAt: "2026-09-01T10:00:00Z",
          },
        ],
      },
    ]);

    const status = await getStudentLearningStatus(1);

    expect(status.improvingSkills).toEqual([]);
  });

  it("6. proficiency labels match centralized src/lib/proficiency.ts", () => {
    expect(getDemonstratedLevelLabel(30)).toBe("Beginner");
    expect(getDemonstratedLevelLabel(50)).toBe("Developing");
    expect(getDemonstratedLevelLabel(65)).toBe("Proficient");
    expect(getDemonstratedLevelLabel(80)).toBe("Advanced");
    expect(getDemonstratedLevelLabel(95)).toBe("Expert");

    expect(percentageToDemonstratedLevel(30)).toBe(1);
    expect(percentageToDemonstratedLevel(50)).toBe(2);
    expect(percentageToDemonstratedLevel(65)).toBe(3);
    expect(percentageToDemonstratedLevel(80)).toBe(4);
    expect(percentageToDemonstratedLevel(95)).toBe(5);
  });

  it("7. dashboard data aggregation is strictly read-only and does not mutate underlying inputs", async () => {
    const rawWeakSkills = [
      {
        skillId: 1,
        skillName: "Go",
        score: 30,
        level: 1,
        label: "Beginner" as const,
        isIndustryRequired: true,
        isHighPriority: true,
        completedAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(studentSkillGap, "getStudentSkillGap").mockResolvedValue({
      jobRole: { id: 1, title: "Backend Dev" },
      readinessScore: 60,
      summary: { totalRequiredSkills: 5, masteredSkills: 3, needsImprovement: 1, missingSkills: 1 },
      assessmentWeakSkills: rawWeakSkills,
      hasTakenAssessment: true,
      lastAssessedAt: new Date().toISOString(),
      skills: [],
      progressHistory: [],
    } as any);

    const status = await getStudentLearningStatus(1);

    // Verify weak skills array was read without mutating input
    expect(status.attentionSkills[0].skillName).toBe("Go");
    expect(rawWeakSkills[0].score).toBe(30);
  });
});
