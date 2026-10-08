import { query } from "@/lib/db";
import {
  percentageToDemonstratedLevel,
  getDemonstratedLevelLabel,
  resolveCurrentDemonstratedSkill,
  type DemonstratedLevelLabel,
} from "@/lib/proficiency";
import { getStudentSkillGap, getCompletedRoadmapStepNumbers, type AssessmentWeakSkill } from "@/lib/student-skill-gap";
import { getStudentProfileDetails } from "@/lib/student-profile";
import { getStudentCurriculum } from "@/lib/student-curriculum";
import { latestRoadmap } from "@/lib/ai/store";
import { findMatchingRoadmapSteps, type MatchedRoadmapStep } from "@/lib/roadmap-matching";
import { checkSkillReassessmentEligibility, type ReassessmentInfo } from "@/lib/reassessment";

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

export type VerificationStatus = "VERIFIED" | "DEVELOPING" | "NEEDS_IMPROVEMENT" | "UNVERIFIED";

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
  reassessment: ReassessmentInfo;
  isCurriculumSupported: boolean;
};

export type StudentDeclaredSkill = {
  skillId: number;
  skillName: string;
  category: string | null;
  proficiencyLevel: number; // Self-reported 1-5
};

export type WeakSkillWithRoadmapStep = AssessmentWeakSkill & {
  matchingSteps: MatchedRoadmapStep[];
};

export type VerifiedSkillProfile = {
  student: {
    userId: number;
    fullName: string;
    email: string;
    contactNumber: string;
    collegeName: string;
    branchName: string;
    currentYear: number;
    careerGoalVision: string;
  };
  targetJobRole: { id: number; title: string } | null;
  readinessScore: number | null;
  totalAssessmentsCount: number;
  totalSkillsCount: number;
  verifiedSkillsCount: number;
  unverifiedDeclaredSkillsCount: number;
  verificationCoveragePercentage: number;
  verifiedSkills: VerifiedSkillItem[];
  declaredSkills: StudentDeclaredSkill[];
  skillsToStrengthen: WeakSkillWithRoadmapStep[];
  curriculumContext?: {
    curriculumName: string;
    regulationVersion: string;
  } | null;
};

export async function getVerifiedSkillProfile(userId: number): Promise<VerifiedSkillProfile> {
  const [profileDetails, gap, historyRes, roadmap, curriculumRes] = await Promise.all([
    getStudentProfileDetails(userId),
    getStudentSkillGap(userId),
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
    latestRoadmap(userId),
    getStudentCurriculum(userId).catch(() => null),
  ]);

  const completedStepNumbers = roadmap
    ? await getCompletedRoadmapStepNumbers(userId, roadmap.id)
    : [];

  const totalAssessmentsRes = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM assessment_attempts WHERE user_id = $1 AND status = 'completed'`,
    [userId]
  );
  const totalAssessmentsCount = Number(totalAssessmentsRes.rows[0]?.count ?? "0");

  // Group assessment attempts by skill_id
  const attemptsMap = new Map<number, VerifiedSkillEvidence[]>();
  for (const row of historyRes.rows) {
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

  // Required skills map from job role
  const requiredSkillsMap = new Map<number, { requiredLevel: number; importance: number }>();
  if (gap && gap.jobRole) {
    const jrsRes = await query<{ skill_id: number; required_level: number; importance: number }>(
      `SELECT skill_id::integer AS skill_id, required_level, importance FROM job_role_skills WHERE job_role_id = $1`,
      [gap.jobRole.id]
    );
    for (const r of jrsRes.rows) {
      requiredSkillsMap.set(r.skill_id, { requiredLevel: r.required_level, importance: r.importance });
    }
  }

  // Build list of verified skills vs declared skills
  const verifiedSkills: VerifiedSkillItem[] = [];
  const declaredSkills: StudentDeclaredSkill[] = [];

  for (const studentSkill of profileDetails.skills) {
    const attempts = attemptsMap.get(studentSkill.skillId) ?? [];
    const evidenceCount = attempts.length;

    if (evidenceCount === 0) {
      // Declared skill with no assessment evidence
      declaredSkills.push({
        skillId: studentSkill.skillId,
        skillName: studentSkill.skillName,
        category: studentSkill.category ?? null,
        proficiencyLevel: studentSkill.proficiencyLevel,
      });
      continue;
    }

    const diagAttempt = attempts.find((a) => a.assessmentType === "diagnostic") ?? attempts[0];
    const latestAttempt = resolveCurrentDemonstratedSkill(attempts)!;

    const diagnosticScore = diagAttempt ? diagAttempt.percentage : null;
    const diagnosticLevel = diagAttempt ? diagAttempt.demonstratedLevel : null;
    const diagnosticLabel = diagAttempt ? diagAttempt.levelLabel : null;

    const latestDemonstratedScore = latestAttempt.percentage;
    const demonstratedLevel = latestAttempt.demonstratedLevel;
    const demonstratedLabel = latestAttempt.levelLabel;

    const improvementPercentage =
      latestDemonstratedScore !== null && diagnosticScore !== null && attempts.length > 1
        ? latestDemonstratedScore - diagnosticScore
        : null;

    const reqMeta = requiredSkillsMap.get(studentSkill.skillId);

    // Status based strictly on centralized proficiency
    let status: VerificationStatus;
    if (demonstratedLevel >= 3) {
      status = "VERIFIED";
    } else if (demonstratedLevel === 2) {
      status = "DEVELOPING";
    } else {
      status = "NEEDS_IMPROVEMENT";
    }

    const reassessment = checkSkillReassessmentEligibility({
      skillName: studentSkill.skillName,
      completedStepNumbers,
      phases: roadmap?.phases,
    });

    verifiedSkills.push({
      skillId: studentSkill.skillId,
      skillName: studentSkill.skillName,
      category: studentSkill.category ?? null,
      selfReportedLevel: studentSkill.proficiencyLevel,
      diagnosticScore,
      diagnosticLevel,
      diagnosticLabel,
      latestDemonstratedScore,
      demonstratedLevel,
      demonstratedLabel,
      requiredLevel: reqMeta?.requiredLevel ?? null,
      importance: reqMeta?.importance ?? null,
      improvementPercentage,
      status,
      evidenceCount,
      evidenceHistory: attempts,
      lastAssessedAt: latestAttempt.completedAt,
      reassessment,
      isCurriculumSupported: Boolean(curriculumRes && curriculumRes.curriculum),
    });
  }

  // Also include assessed skills that student hasn't explicitly added to student_skills
  for (const [skillId, attempts] of attemptsMap.entries()) {
    if (profileDetails.skills.some((s) => s.skillId === skillId)) continue;
    if (attempts.length === 0) continue;

    const latestAttempt = resolveCurrentDemonstratedSkill(attempts)!;
    const diagAttempt = attempts.find((a) => a.assessmentType === "diagnostic") ?? attempts[0];
    const reqMeta = requiredSkillsMap.get(skillId);

    const reassessment = checkSkillReassessmentEligibility({
      skillName: latestAttempt.assessmentTitle,
      completedStepNumbers,
      phases: roadmap?.phases,
    });

    const demonstratedLevel = latestAttempt.demonstratedLevel;
    let status: VerificationStatus;
    if (demonstratedLevel >= 3) status = "VERIFIED";
    else if (demonstratedLevel === 2) status = "DEVELOPING";
    else status = "NEEDS_IMPROVEMENT";

    verifiedSkills.push({
      skillId,
      skillName: attempts[0].assessmentTitle.replace(" Diagnostic", "").replace(" Checkpoint", ""),
      category: null,
      selfReportedLevel: null,
      diagnosticScore: diagAttempt ? diagAttempt.percentage : null,
      diagnosticLevel: diagAttempt ? diagAttempt.demonstratedLevel : null,
      diagnosticLabel: diagAttempt ? diagAttempt.levelLabel : null,
      latestDemonstratedScore: latestAttempt.percentage,
      demonstratedLevel,
      demonstratedLabel: latestAttempt.levelLabel,
      requiredLevel: reqMeta?.requiredLevel ?? null,
      importance: reqMeta?.importance ?? null,
      improvementPercentage: attempts.length > 1 ? latestAttempt.percentage - diagAttempt.percentage : null,
      status,
      evidenceCount: attempts.length,
      evidenceHistory: attempts,
      lastAssessedAt: latestAttempt.completedAt,
      reassessment,
      isCurriculumSupported: Boolean(curriculumRes && curriculumRes.curriculum),
    });
  }

  // Skills to strengthen (Weak Skills from Skill Gap)
  const skillsToStrengthen: WeakSkillWithRoadmapStep[] = (gap?.assessmentWeakSkills ?? []).map((weak) => ({
    ...weak,
    matchingSteps: findMatchingRoadmapSteps(weak.skillName, roadmap?.phases),
  }));

  const totalSkillsCount = verifiedSkills.length + declaredSkills.length;
  const verifiedSkillsCount = verifiedSkills.length;
  const unverifiedDeclaredSkillsCount = declaredSkills.length;
  const verificationCoveragePercentage =
    totalSkillsCount > 0 ? Math.round((verifiedSkillsCount / totalSkillsCount) * 100) : 0;

  return {
    student: {
      userId,
      fullName: profileDetails.fullName,
      email: profileDetails.email,
      contactNumber: profileDetails.contactNumber,
      collegeName: profileDetails.collegeName,
      branchName: profileDetails.branchName,
      currentYear: profileDetails.currentYear,
      careerGoalVision: profileDetails.careerGoal,
    },
    targetJobRole: profileDetails.targetRole,
    readinessScore: gap?.readinessScore ?? null,
    totalAssessmentsCount,
    totalSkillsCount,
    verifiedSkillsCount,
    unverifiedDeclaredSkillsCount,
    verificationCoveragePercentage,
    verifiedSkills,
    declaredSkills,
    skillsToStrengthen,
    curriculumContext: curriculumRes && curriculumRes.curriculum
      ? {
          curriculumName: curriculumRes.curriculum.name,
          regulationVersion: curriculumRes.curriculum.regulationVersion,
        }
      : null,
  };
}
