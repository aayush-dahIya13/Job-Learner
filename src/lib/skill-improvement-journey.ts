import { getDemonstratedLevelLabel, type DemonstratedLevelLabel } from "@/lib/proficiency";
import { findMatchingRoadmapSteps, type MatchedRoadmapStep } from "@/lib/roadmap-matching";
import type { SkillProgressHistory, SkillProgressHistoryAttempt } from "@/lib/student-assessment";

export type SkillJourneyFilter = "all" | "needs_improvement" | "improving" | "proficient";

export type SkillJourneyItem = {
  skillId: number;
  skillName: string;
  selfReportedLevel: number | null;
  diagnosticPercentage: number | null;
  diagnosticLevel: number | null;
  latestPercentage: number | null;
  latestDemonstratedLevel: number | null;
  latestLevelLabel: DemonstratedLevelLabel | null;
  previousPercentage: number | null;
  scoreChange: number | null;
  isPositiveChange: boolean;
  isNegativeChange: boolean;
  isSingleAssessment: boolean;
  attempts: SkillProgressHistoryAttempt[];
  completedLearningSteps: MatchedRoadmapStep[];
  allMatchingRoadmapSteps: MatchedRoadmapStep[];
  timelineEvents: Array<{
    type: "assessment" | "learning_completed";
    date?: Date | string;
    attempt?: SkillProgressHistoryAttempt;
    step?: MatchedRoadmapStep;
    note?: string;
  }>;
};

export function buildSkillJourneySummary(params: {
  history: SkillProgressHistory[];
  phases?: Array<{ phase?: number; steps?: Array<{ stepNumber: number; title: string; skills?: string[] }> }> | null;
  completedStepNumbers?: number[] | Set<number> | null;
}): SkillJourneyItem[] {
  const { history, phases, completedStepNumbers } = params;
  const completedSet = completedStepNumbers instanceof Set
    ? completedStepNumbers
    : new Set(completedStepNumbers || []);

  return history.map((item) => {
    // Ensure chronological ASC ordering
    const attempts = [...item.attempts].sort((a, b) => {
      const timeA = new Date(a.completedAt).getTime();
      const timeB = new Date(b.completedAt).getTime();
      return timeA - timeB;
    });

    const isSingleAssessment = attempts.length <= 1;
    const latestAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;
    const previousAttempt = attempts.length > 1 ? attempts[attempts.length - 2] : null;

    const latestPercentage = latestAttempt ? latestAttempt.percentage : null;
    const previousPercentage = previousAttempt ? previousAttempt.percentage : null;

    const scoreChange =
      latestPercentage !== null && previousPercentage !== null
        ? latestPercentage - previousPercentage
        : attempts.length > 1 && item.improvementPercentage !== null
        ? item.improvementPercentage
        : null;

    const isPositiveChange = Boolean(scoreChange && scoreChange > 0);
    const isNegativeChange = Boolean(scoreChange && scoreChange < 0);

    // Roadmap step matching
    const matchingSteps = findMatchingRoadmapSteps(item.skillName, phases);
    const completedLearningSteps = matchingSteps.filter((s) => completedSet.has(s.stepNumber));

    // Timeline building connecting assessment history and completed learning steps
    const timelineEvents: SkillJourneyItem["timelineEvents"] = [];

    attempts.forEach((att, idx) => {
      timelineEvents.push({
        type: "assessment",
        date: att.completedAt,
        attempt: att,
        note: idx === 0 ? "Initial Assessment Baseline" : `Reassessment Attempt #${idx + 1}`,
      });

      // If learning steps were completed, show learning context before subsequent reassessments
      if (idx < attempts.length - 1 && completedLearningSteps.length > 0) {
        completedLearningSteps.forEach((step) => {
          // Avoid duplicate insertion of same learning step
          if (!timelineEvents.some((e) => e.type === "learning_completed" && e.step?.stepNumber === step.stepNumber)) {
            timelineEvents.push({
              type: "learning_completed",
              step,
              note: "Learning completed before reassessment.",
            });
          }
        });
      }
    });

    // If single assessment but student completed learning steps for this skill
    if (isSingleAssessment && completedLearningSteps.length > 0) {
      completedLearningSteps.forEach((step) => {
        if (!timelineEvents.some((e) => e.type === "learning_completed" && e.step?.stepNumber === step.stepNumber)) {
          timelineEvents.push({
            type: "learning_completed",
            step,
            note: "Learning completed. Ready for reassessment checkpoint.",
          });
        }
      });
    }

    return {
      skillId: item.skillId,
      skillName: item.skillName,
      selfReportedLevel: item.selfReportedLevel,
      diagnosticPercentage: item.diagnosticPercentage,
      diagnosticLevel: item.diagnosticLevel,
      latestPercentage,
      latestDemonstratedLevel: item.latestDemonstratedLevel,
      latestLevelLabel: latestAttempt ? getDemonstratedLevelLabel(latestAttempt.percentage) : item.latestLevelLabel,
      previousPercentage,
      scoreChange,
      isPositiveChange,
      isNegativeChange,
      isSingleAssessment,
      attempts,
      completedLearningSteps,
      allMatchingRoadmapSteps: matchingSteps,
      timelineEvents,
    };
  });
}
