import { getStudentSkillGap, getCompletedRoadmapStepNumbers, type AssessmentWeakSkill } from "@/lib/student-skill-gap";
import { getLatestCompletedAssessment, getSkillProgressHistory, type LatestCompletedAssessment } from "@/lib/student-assessment";
import { latestRoadmap } from "@/lib/ai/store";
import { buildSkillJourneySummary, type SkillJourneyItem } from "@/lib/skill-improvement-journey";
import { resolveAdaptiveLearningRecommendation, type AdaptiveRecommendationResult } from "@/lib/roadmap-matching";

export type ImprovingSkillItem = {
  skillId: number;
  skillName: string;
  previousPercentage: number;
  latestPercentage: number;
  scoreChange: number;
  previousLevelLabel: string;
  latestLevelLabel: string;
  latestDemonstratedLevel: number;
};

export type StudentLearningStatus = {
  hasTargetRole: boolean;
  jobRoleTitle: string | null;
  readinessScore: number | null;
  hasTakenAssessment: boolean;
  improvingSkills: ImprovingSkillItem[];
  attentionSkills: AssessmentWeakSkill[];
  recommendation: AdaptiveRecommendationResult;
  latestAssessment: LatestCompletedAssessment | null;
};

export async function getStudentLearningStatus(userId: number): Promise<StudentLearningStatus> {
  const [gap, latestAssessment, progressHistory, roadmap] = await Promise.all([
    getStudentSkillGap(userId),
    getLatestCompletedAssessment(userId),
    getSkillProgressHistory(userId),
    latestRoadmap(userId),
  ]);

  const completedStepNumbers = roadmap
    ? await getCompletedRoadmapStepNumbers(userId, roadmap.id)
    : [];

  // 1. Improving Skills (Requires 2+ assessments and positive score change)
  const journeySummary = buildSkillJourneySummary({
    history: progressHistory ?? [],
    phases: roadmap?.phases,
    completedStepNumbers,
  });

  const improvingList: ImprovingSkillItem[] = journeySummary
    .filter((item) => !item.isSingleAssessment && item.isPositiveChange && item.scoreChange !== null && item.previousPercentage !== null && item.latestPercentage !== null)
    .sort((a, b) => (b.scoreChange ?? 0) - (a.scoreChange ?? 0))
    .slice(0, 3)
    .map((item) => {
      const prevAttempt = item.attempts[item.attempts.length - 2];
      const latestAttempt = item.attempts[item.attempts.length - 1];
      return {
        skillId: item.skillId,
        skillName: item.skillName,
        previousPercentage: item.previousPercentage!,
        latestPercentage: item.latestPercentage!,
        scoreChange: item.scoreChange!,
        previousLevelLabel: prevAttempt ? prevAttempt.levelLabel : "Baseline",
        latestLevelLabel: latestAttempt ? latestAttempt.levelLabel : (item.latestLevelLabel ?? "Proficient"),
        latestDemonstratedLevel: item.latestDemonstratedLevel ?? 3,
      };
    });

  // 2. Needs Attention Skills (Up to 3 weak/high-priority skills from Skill Gap)
  const attentionList = gap ? gap.assessmentWeakSkills.slice(0, 3) : [];

  // 3. Adaptive Recommendation
  const recommendation = resolveAdaptiveLearningRecommendation({
    weakSkills: gap?.assessmentWeakSkills ?? [],
    phases: roadmap?.phases,
    completedStepNumbers,
  });

  return {
    hasTargetRole: Boolean(gap?.jobRole?.title),
    jobRoleTitle: gap?.jobRole?.title ?? null,
    readinessScore: gap ? gap.readinessScore : null,
    hasTakenAssessment: Boolean(gap?.hasTakenAssessment || latestAssessment !== null),
    improvingSkills: improvingList,
    attentionSkills: attentionList,
    recommendation,
    latestAssessment,
  };
}
