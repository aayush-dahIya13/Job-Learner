import { describe, it, expect, vi, beforeEach } from "vitest";
import { getVerifiedSkillProfile } from "@/lib/verified-skill-profile";

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
}));

vi.mock("@/lib/student-profile", () => ({
  getStudentProfileDetails: vi.fn(),
}));

vi.mock("@/lib/student-skill-gap", () => ({
  getStudentSkillGap: vi.fn(),
  getCompletedRoadmapStepNumbers: vi.fn(),
}));

vi.mock("@/lib/student-curriculum", () => ({
  getStudentCurriculum: vi.fn(),
}));

vi.mock("@/lib/ai/store", () => ({
  latestRoadmap: vi.fn(),
}));

import { query } from "@/lib/db";
import { getStudentProfileDetails } from "@/lib/student-profile";
import { getStudentSkillGap, getCompletedRoadmapStepNumbers } from "@/lib/student-skill-gap";
import { getStudentCurriculum } from "@/lib/student-curriculum";
import { latestRoadmap } from "@/lib/ai/store";

describe("Verified Skill Profile / Skill Passport Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. separates declared skills without evidence from verified skills with evidence", async () => {
    vi.mocked(getStudentProfileDetails).mockResolvedValue({
      userId: 1,
      fullName: "Jane Doe",
      email: "jane@example.com",
      contactNumber: "1234567890",
      collegeId: 101,
      collegeName: "State University",
      branchId: 201,
      branchName: "Computer Science",
      currentYear: 3,
      careerGoal: "Become a Full Stack Developer",
      targetRole: { id: 10, title: "Full Stack Engineer" },
      skills: [
        { skillId: 1, skillName: "React", category: "Frontend", proficiencyLevel: 4 },
        { skillId: 2, skillName: "Docker", category: "DevOps", proficiencyLevel: 2 },
      ],
      completeness: { completedCount: 7, totalFields: 7, percentage: 100, missingFields: [], isComplete: true },
    });

    vi.mocked(getStudentSkillGap).mockResolvedValue({
      jobRole: { id: 10, title: "Full Stack Engineer" },
      readinessScore: 78,
      assessmentWeakSkills: [],
      skillsWithGaps: [],
      meetsCount: 1,
      gapCount: 0,
      totalCount: 1,
    } as any);

    // History contains evidence only for skill 1 (React)
    vi.mocked(query).mockImplementation(async (sql: string) => {
      if (sql.includes("FROM skill_assessment_results")) {
        return {
          rows: [
            {
              skill_id: 1,
              skill_name: "React",
              category: "Frontend",
              attempt_id: 101,
              assessment_id: 5,
              assessment_title: "React Diagnostic Baseline",
              assessment_type: "diagnostic",
              score: "82",
              percentage: "82",
              demonstrated_level: 4,
              completed_at: new Date("2026-09-15"),
            },
          ],
        } as any;
      }
      if (sql.includes("FROM assessment_attempts")) {
        return { rows: [{ count: "1" }] } as any;
      }
      if (sql.includes("FROM job_role_skills")) {
        return { rows: [{ skill_id: 1, required_level: 4, importance: 5 }] } as any;
      }
      return { rows: [] } as any;
    });

    vi.mocked(latestRoadmap).mockResolvedValue(null as any);
    vi.mocked(getCompletedRoadmapStepNumbers).mockResolvedValue([]);
    vi.mocked(getStudentCurriculum).mockResolvedValue(null as any);

    const result = await getVerifiedSkillProfile(1);

    expect(result.student.fullName).toBe("Jane Doe");
    expect(result.readinessScore).toBe(78);
    expect(result.totalSkillsCount).toBe(2);
    expect(result.verifiedSkillsCount).toBe(1);
    expect(result.unverifiedDeclaredSkillsCount).toBe(1);
    expect(result.verificationCoveragePercentage).toBe(50); // 1/2 = 50%

    // React is in verifiedSkills
    expect(result.verifiedSkills).toHaveLength(1);
    expect(result.verifiedSkills[0].skillName).toBe("React");
    expect(result.verifiedSkills[0].latestDemonstratedScore).toBe(82);
    expect(result.verifiedSkills[0].demonstratedLevel).toBe(4);
    expect(result.verifiedSkills[0].status).toBe("VERIFIED");

    // Docker is in declaredSkills
    expect(result.declaredSkills).toHaveLength(1);
    expect(result.declaredSkills[0].skillName).toBe("Docker");
    expect(result.declaredSkills[0].proficiencyLevel).toBe(2);
  });

  it("2. assigns correct status levels (VERIFIED, DEVELOPING, NEEDS_IMPROVEMENT)", async () => {
    vi.mocked(getStudentProfileDetails).mockResolvedValue({
      userId: 2,
      fullName: "Alex Smith",
      email: "alex@example.com",
      contactNumber: "",
      collegeId: 101,
      collegeName: "Tech Institute",
      branchId: 201,
      branchName: "IT",
      currentYear: 2,
      careerGoal: "",
      targetRole: null,
      skills: [
        { skillId: 10, skillName: "Python", category: "Backend", proficiencyLevel: 3 },
        { skillId: 20, skillName: "SQL", category: "Database", proficiencyLevel: 3 },
        { skillId: 30, skillName: "CSS", category: "Frontend", proficiencyLevel: 2 },
      ],
      completeness: { completedCount: 5, totalFields: 7, percentage: 71, missingFields: ["Contact Number"], isComplete: false },
    });

    vi.mocked(getStudentSkillGap).mockResolvedValue(null);

    vi.mocked(query).mockImplementation(async (sql: string) => {
      if (sql.includes("FROM skill_assessment_results")) {
        return {
          rows: [
            // Python: 85% -> Level 4 -> VERIFIED
            {
              skill_id: 10,
              skill_name: "Python",
              category: "Backend",
              attempt_id: 201,
              assessment_id: 1,
              assessment_title: "Python Diagnostic",
              assessment_type: "diagnostic",
              score: "85",
              percentage: "85",
              demonstrated_level: 4,
              completed_at: new Date("2026-09-01"),
            },
            // SQL: 55% -> Level 2 -> DEVELOPING
            {
              skill_id: 20,
              skill_name: "SQL",
              category: "Database",
              attempt_id: 202,
              assessment_id: 2,
              assessment_title: "SQL Diagnostic",
              assessment_type: "diagnostic",
              score: "55",
              percentage: "55",
              demonstrated_level: 2,
              completed_at: new Date("2026-09-02"),
            },
            // CSS: 25% -> Level 1 -> NEEDS_IMPROVEMENT
            {
              skill_id: 30,
              skill_name: "CSS",
              category: "Frontend",
              attempt_id: 203,
              assessment_id: 3,
              assessment_title: "CSS Diagnostic",
              assessment_type: "diagnostic",
              score: "25",
              percentage: "25",
              demonstrated_level: 1,
              completed_at: new Date("2026-09-03"),
            },
          ],
        } as any;
      }
      if (sql.includes("FROM assessment_attempts")) {
        return { rows: [{ count: "3" }] } as any;
      }
      return { rows: [] } as any;
    });

    vi.mocked(latestRoadmap).mockResolvedValue(null as any);
    vi.mocked(getCompletedRoadmapStepNumbers).mockResolvedValue([]);
    vi.mocked(getStudentCurriculum).mockResolvedValue(null as any);

    const result = await getVerifiedSkillProfile(2);

    expect(result.verifiedSkills).toHaveLength(3);

    const python = result.verifiedSkills.find((s) => s.skillId === 10);
    expect(python?.status).toBe("VERIFIED");

    const sqlSkill = result.verifiedSkills.find((s) => s.skillId === 20);
    expect(sqlSkill?.status).toBe("DEVELOPING");

    const css = result.verifiedSkills.find((s) => s.skillId === 30);
    expect(css?.status).toBe("NEEDS_IMPROVEMENT");
  });

  it("3. tracks multi-attempt improvement trajectory correctly", async () => {
    vi.mocked(getStudentProfileDetails).mockResolvedValue({
      userId: 3,
      fullName: "Sam Wilson",
      email: "sam@example.com",
      contactNumber: "",
      collegeId: 0,
      collegeName: "",
      branchId: 0,
      branchName: "",
      currentYear: 4,
      careerGoal: "",
      targetRole: null,
      skills: [{ skillId: 50, skillName: "Node.js", category: "Backend", proficiencyLevel: 3 }],
      completeness: { completedCount: 3, totalFields: 7, percentage: 43, missingFields: [], isComplete: false },
    });

    vi.mocked(getStudentSkillGap).mockResolvedValue(null);

    vi.mocked(query).mockImplementation(async (sql: string) => {
      if (sql.includes("FROM skill_assessment_results")) {
        return {
          rows: [
            // Attempt 1: 40% (Diagnostic)
            {
              skill_id: 50,
              skill_name: "Node.js",
              category: "Backend",
              attempt_id: 301,
              assessment_id: 10,
              assessment_title: "Node.js Diagnostic Baseline",
              assessment_type: "diagnostic",
              score: "40",
              percentage: "40",
              demonstrated_level: 2,
              completed_at: new Date("2026-08-01"),
            },
            // Attempt 2: 75% (Reassessment)
            {
              skill_id: 50,
              skill_name: "Node.js",
              category: "Backend",
              attempt_id: 302,
              assessment_id: 11,
              assessment_title: "Node.js Checkpoint Assessment",
              assessment_type: "reassessment",
              score: "75",
              percentage: "75",
              demonstrated_level: 4,
              completed_at: new Date("2026-09-01"),
            },
          ],
        } as any;
      }
      if (sql.includes("FROM assessment_attempts")) {
        return { rows: [{ count: "2" }] } as any;
      }
      return { rows: [] } as any;
    });

    vi.mocked(latestRoadmap).mockResolvedValue(null as any);
    vi.mocked(getCompletedRoadmapStepNumbers).mockResolvedValue([]);
    vi.mocked(getStudentCurriculum).mockResolvedValue(null as any);

    const result = await getVerifiedSkillProfile(3);

    const nodeSkill = result.verifiedSkills[0];
    expect(nodeSkill.evidenceCount).toBe(2);
    expect(nodeSkill.diagnosticScore).toBe(40);
    expect(nodeSkill.latestDemonstratedScore).toBe(75);
    expect(nodeSkill.improvementPercentage).toBe(35); // +35% improvement
    expect(nodeSkill.evidenceHistory).toHaveLength(2);
  });
});
