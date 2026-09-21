import { query } from "@/lib/db";
import {
  percentageToDemonstratedLevel,
  getDemonstratedLevelLabel,
  type DemonstratedLevelLabel,
} from "@/lib/student-assessment";

export type VerifiedSkillEvidence = {
  attemptId: number;
  assessmentId: number;
  assessmentTitle: string;
  assessmentType: "diagnostic" | "milestone" | "topic" | "reassessment" | "company_screening" | string;
  score: number;
  percentage: number;
  demonstratedLevel: number;
  levelLabel: DemonstratedLevelLabel;
  completedAt: Date | string;
};

export type VerificationStatus = "UNVERIFIED" | "BELOW_REQUIREMENT" | "MEETS_REQUIREMENT";

export type VerifiedSkillItem = {
  skillId: number;
  skillName: string;
  category: string | null;
  selfReportedLevel: number | null;
  diagnosticScore: number | null;
  diagnosticLevel: number | null;
  diagnosticLabel: DemonstratedLevelLabel | null;
  latestDemonstratedScore: number | null;
  demonstratedLevel: number | null;
  demonstratedLabel: DemonstratedLevelLabel | null;
  requiredLevel: number | null;
  importance: number | null;
  improvementPercentage: number | null;
  status: VerificationStatus;
  evidenceCount: number;
  evidenceHistory: VerifiedSkillEvidence[];
  lastAssessedAt: Date | string | null;
};

export type VerifiedSkillProfile = {
  studentId: number;
  targetJobRole: { id: number; title: string } | null;
  overallAlignmentScore: number;
  totalSkills: number;
  verifiedSkillsCount: number;
  unverifiedSkillsCount: number;
  meetsRequirementCount: number;
  belowRequirementCount: number;
  skills: VerifiedSkillItem[];
};

export async function getVerifiedSkillProfile(userId: number): Promise<VerifiedSkillProfile> {
  // 1. Fetch student's target career role
  const goalRes = await query<{ id: number; title: string }>(
    `SELECT jr.id::integer AS id, jr.title 
     FROM student_career_goals scg 
     JOIN job_roles jr ON jr.id = scg.job_role_id 
     WHERE scg.user_id = $1`,
    [userId]
  );
  const targetJobRole = goalRes.rows[0] ? { id: goalRes.rows[0].id, title: goalRes.rows[0].title } : null;

  // 2. Parallel queries for: Required skills (if job role set), Self-reported skills, and Assessment attempt results
  const [requiredRes, selfReportedRes, historyRes] = await Promise.all([
    targetJobRole
      ? query<{ skill_id: number; skill_name: string; category: string | null; required_level: number; importance: number }>(
          `SELECT jrs.skill_id::integer AS skill_id, s.name AS skill_name, s.category, jrs.required_level, jrs.importance
           FROM job_role_skills jrs
           JOIN skills s ON s.id = jrs.skill_id
           WHERE jrs.job_role_id = $1
           ORDER BY jrs.importance DESC, s.name`,
          [targetJobRole.id]
        )
      : Promise.resolve({ rows: [] }),

    query<{ skill_id: number; skill_name: string; category: string | null; proficiency_level: number }>(
      `SELECT ss.skill_id::integer AS skill_id, s.name AS skill_name, s.category, ss.proficiency_level
       FROM student_skills ss
       JOIN skills s ON s.id = ss.skill_id
       WHERE ss.user_id = $1
       ORDER BY s.name`,
      [userId]
    ),

    query<{
      skill_id: number;
      skill_name: string;
      category: string | null;
      attempt_id: number;
      assessment_id: number;
      assessment_title: string;
      assessment_type: string;
      score: string;
      percentage: string;
      demonstrated_level: number;
      completed_at: Date;
    }>(
      `SELECT sar.skill_id::integer AS skill_id, s.name AS skill_name, s.category,
              sar.attempt_id::integer AS attempt_id, aa.assessment_id::integer AS assessment_id,
              a.title AS assessment_title, a.assessment_type,
              sar.score::text, sar.percentage::text, sar.demonstrated_level,
              aa.completed_at
       FROM skill_assessment_results sar
       JOIN skills s ON s.id = sar.skill_id
       JOIN assessment_attempts aa ON aa.id = sar.attempt_id
       JOIN assessments a ON a.id = aa.assessment_id
       WHERE sar.user_id = $1 AND aa.status = 'completed'
       ORDER BY sar.skill_id, aa.completed_at ASC`,
      [userId]
    ),
  ]);

  // Map to hold aggregated skill info by skill_id
  type SkillMeta = {
    skillId: number;
    skillName: string;
    category: string | null;
    selfReportedLevel: number | null;
    requiredLevel: number | null;
    importance: number | null;
  };

  const skillMap = new Map<number, SkillMeta>();

  // Helper to ensure skill entry exists
  function ensureSkill(id: number, name: string, category: string | null): SkillMeta {
    let entry = skillMap.get(id);
    if (!entry) {
      entry = {
        skillId: id,
        skillName: name,
        category,
        selfReportedLevel: null,
        requiredLevel: null,
        importance: null,
      };
      skillMap.set(id, entry);
    }
    return entry;
  }

  // Populate required skills
  for (const row of requiredRes.rows) {
    const item = ensureSkill(row.skill_id, row.skill_name, row.category);
    item.requiredLevel = row.required_level;
    item.importance = row.importance;
  }

  // Populate self-reported skills
  for (const row of selfReportedRes.rows) {
    const item = ensureSkill(row.skill_id, row.skill_name, row.category);
    item.selfReportedLevel = row.proficiency_level;
  }

  // Group attempts by skill_id
  const attemptsMap = new Map<number, VerifiedSkillEvidence[]>();
  for (const row of historyRes.rows) {
    ensureSkill(row.skill_id, row.skill_name, row.category);
    const list = attemptsMap.get(row.skill_id) ?? [];
    const pct = Number(row.percentage);
    list.push({
      attemptId: row.attempt_id,
      assessmentId: row.assessment_id,
      assessmentTitle: row.assessment_title,
      assessmentType: row.assessment_type,
      score: Number(row.score),
      percentage: pct,
      demonstratedLevel: row.demonstrated_level,
      levelLabel: getDemonstratedLevelLabel(pct),
      completedAt: row.completed_at,
    });
    attemptsMap.set(row.skill_id, list);
  }

  const skillItems: VerifiedSkillItem[] = [];
  let verifiedSkillsCount = 0;
  let unverifiedSkillsCount = 0;
  let meetsRequirementCount = 0;
  let belowRequirementCount = 0;

  let weightedAchievement = 0;
  let totalImportance = 0;

  for (const [skillId, meta] of skillMap.entries()) {
    const attempts = attemptsMap.get(skillId) ?? [];
    const evidenceCount = attempts.length;

    // Diagnostic assessment: pick first attempt of type 'diagnostic' or first attempt overall if none tagged diagnostic
    const diagAttempt = attempts.find((a) => a.assessmentType === "diagnostic") ?? (attempts.length > 0 ? attempts[0] : null);
    const latestAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;

    const diagnosticScore = diagAttempt ? diagAttempt.percentage : null;
    const diagnosticLevel = diagAttempt ? diagAttempt.demonstratedLevel : null;
    const diagnosticLabel = diagAttempt ? diagAttempt.levelLabel : null;

    const latestDemonstratedScore = latestAttempt ? latestAttempt.percentage : null;
    const demonstratedLevel = latestAttempt ? latestAttempt.demonstratedLevel : null;
    const demonstratedLabel = latestAttempt ? latestAttempt.levelLabel : null;

    const improvementPercentage =
      latestDemonstratedScore !== null && diagnosticScore !== null
        ? latestDemonstratedScore - diagnosticScore
        : null;

    // Status Determination strictly adheres to 3 values: UNVERIFIED, BELOW_REQUIREMENT, MEETS_REQUIREMENT
    let status: VerificationStatus;
    if (evidenceCount === 0 || demonstratedLevel === null) {
      status = "UNVERIFIED";
      unverifiedSkillsCount++;
    } else if (meta.requiredLevel !== null) {
      if (demonstratedLevel >= meta.requiredLevel) {
        status = "MEETS_REQUIREMENT";
        meetsRequirementCount++;
        verifiedSkillsCount++;
      } else {
        status = "BELOW_REQUIREMENT";
        belowRequirementCount++;
        verifiedSkillsCount++;
      }
    } else {
      // Assessed skill with no specific career requirement
      status = "MEETS_REQUIREMENT";
      meetsRequirementCount++;
      verifiedSkillsCount++;
    }

    // Alignment calculation for skills required by career goal
    if (meta.requiredLevel !== null && meta.importance !== null) {
      totalImportance += meta.importance;
      if (demonstratedLevel !== null) {
        weightedAchievement += Math.min(demonstratedLevel / meta.requiredLevel, 1) * meta.importance;
      }
    }

    skillItems.push({
      skillId: meta.skillId,
      skillName: meta.skillName,
      category: meta.category,
      selfReportedLevel: meta.selfReportedLevel,
      diagnosticScore,
      diagnosticLevel,
      diagnosticLabel,
      latestDemonstratedScore,
      demonstratedLevel,
      demonstratedLabel,
      requiredLevel: meta.requiredLevel,
      importance: meta.importance,
      improvementPercentage,
      status,
      evidenceCount,
      evidenceHistory: attempts,
      lastAssessedAt: latestAttempt ? latestAttempt.completedAt : null,
    });
  }

  // Sort skills: required skills first (by importance desc), then by name
  skillItems.sort((a, b) => {
    if (a.importance !== null && b.importance !== null) {
      if (b.importance !== a.importance) return b.importance - a.importance;
    } else if (a.importance !== null) return -1;
    else if (b.importance !== null) return 1;
    return a.skillName.localeCompare(b.skillName);
  });

  const overallAlignmentScore = totalImportance > 0 ? Math.round((weightedAchievement / totalImportance) * 100) : 0;

  return {
    studentId: userId,
    targetJobRole,
    overallAlignmentScore,
    totalSkills: skillItems.length,
    verifiedSkillsCount,
    unverifiedSkillsCount,
    meetsRequirementCount,
    belowRequirementCount,
    skills: skillItems,
  };
}
