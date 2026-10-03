import { findMatchingRoadmapSteps } from "@/lib/roadmap-matching";

export type ReassessmentStatus =
  | "REASSESSMENT_READY"
  | "LEARNING_IN_PROGRESS"
  | "NO_MATCHING_ASSESSMENT"
  | "NOT_APPLICABLE";

export type ReassessmentInfo = {
  isEligible: boolean;
  status: ReassessmentStatus;
  skillName?: string;
  stepNumber?: number;
  assessmentId?: number;
  actionUrl: string;
  badgeLabel: string;
  helperText: string;
};

/**
 * Checks if a weak skill (or a skill mapped to a completed roadmap step) is eligible for reassessment.
 */
export function checkSkillReassessmentEligibility(params: {
  skillName: string;
  completedStepNumbers: number[];
  phases?: Array<{ phase?: number; steps?: Array<{ stepNumber: number; title: string; skills?: string[] }> }> | null;
  assessmentId?: number | null;
  hasAssessmentAvailable?: boolean;
}): ReassessmentInfo {
  const {
    skillName,
    completedStepNumbers,
    phases,
    assessmentId,
    hasAssessmentAvailable = true,
  } = params;

  const completedSet = new Set(completedStepNumbers || []);
  const matchingSteps = findMatchingRoadmapSteps(skillName, phases);

  if (matchingSteps.length === 0) {
    return {
      isEligible: false,
      status: "NOT_APPLICABLE",
      skillName,
      actionUrl: "/assessments",
      badgeLabel: "No Mapped Step",
      helperText: "No roadmap step maps to this skill yet.",
    };
  }

  const completedMatchingStep = matchingSteps.find((s) => completedSet.has(s.stepNumber));

  if (!completedMatchingStep) {
    return {
      isEligible: false,
      status: "LEARNING_IN_PROGRESS",
      skillName,
      stepNumber: matchingSteps[0].stepNumber,
      actionUrl: `/roadmap#step-${matchingSteps[0].stepNumber}`,
      badgeLabel: "Learning In Progress",
      helperText: `Complete Roadmap Step ${matchingSteps[0].stepNumber} to unlock reassessment.`,
    };
  }

  if (!hasAssessmentAvailable) {
    return {
      isEligible: false,
      status: "NO_MATCHING_ASSESSMENT",
      skillName,
      stepNumber: completedMatchingStep.stepNumber,
      actionUrl: "/assessments",
      badgeLabel: "No Assessment",
      helperText: "No matching assessment available for this skill.",
    };
  }

  const url = assessmentId ? `/assessments?assessmentId=${assessmentId}` : "/assessments";

  return {
    isEligible: true,
    status: "REASSESSMENT_READY",
    skillName,
    stepNumber: completedMatchingStep.stepNumber,
    assessmentId: assessmentId ?? undefined,
    actionUrl: url,
    badgeLabel: "Reassessment Available",
    helperText: `Learning step completed! Take an assessment checkpoint to re-verify your ${skillName} skill level.`,
  };
}

/**
 * Checks reassessment status for a specific completed or in-progress roadmap step.
 */
export function checkStepReassessmentEligibility(params: {
  stepNumber: number;
  stepSkills?: string[];
  isCompleted: boolean;
  weakSkillNames?: string[];
  assessmentId?: number | null;
  hasAssessmentAvailable?: boolean;
}): ReassessmentInfo {
  const {
    stepNumber,
    stepSkills = [],
    isCompleted,
    weakSkillNames = [],
    assessmentId,
    hasAssessmentAvailable = true,
  } = params;

  if (!isCompleted) {
    return {
      isEligible: false,
      status: "LEARNING_IN_PROGRESS",
      stepNumber,
      actionUrl: `#step-${stepNumber}`,
      badgeLabel: "In Progress",
      helperText: "Complete this learning step first.",
    };
  }

  if (stepSkills.length === 0) {
    return {
      isEligible: false,
      status: "NO_MATCHING_ASSESSMENT",
      stepNumber,
      actionUrl: "/assessments",
      badgeLabel: "No Skill Mapping",
      helperText: "No matching assessment available for this step.",
    };
  }

  if (!hasAssessmentAvailable) {
    return {
      isEligible: false,
      status: "NO_MATCHING_ASSESSMENT",
      stepNumber,
      actionUrl: "/assessments",
      badgeLabel: "No Linked Assessment",
      helperText: "No matching assessment available for this step.",
    };
  }

  const normalizedWeakSet = new Set((weakSkillNames || []).map((s) => s.trim().toLowerCase()));
  const matchingWeakSkill = stepSkills.find((s) => normalizedWeakSet.has(s.trim().toLowerCase()));
  const targetSkill = matchingWeakSkill || stepSkills[0];
  const url = assessmentId ? `/assessments?assessmentId=${assessmentId}` : "/assessments";

  return {
    isEligible: true,
    status: "REASSESSMENT_READY",
    skillName: targetSkill,
    stepNumber,
    assessmentId: assessmentId ?? undefined,
    actionUrl: url,
    badgeLabel: "Reassess Skill",
    helperText: `Check your progress on ${targetSkill} after completing this step.`,
  };
}
