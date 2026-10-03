import { getDemonstratedLevelLabel, type DemonstratedLevelLabel } from "@/lib/proficiency";

export type MatchedRoadmapStep = {
  stepNumber: number;
  title: string;
  phaseNumber?: number;
};

export function findMatchingRoadmapSteps(
  skillName: string,
  phases?: Array<{ phase?: number; steps?: Array<{ stepNumber: number; title: string; skills?: string[] }> }> | null
): MatchedRoadmapStep[] {
  if (!phases || !skillName) return [];
  const normalizedTarget = skillName.trim().toLowerCase();
  if (!normalizedTarget) return [];

  const matched: MatchedRoadmapStep[] = [];
  const seenStepNumbers = new Set<number>();

  for (const phase of phases) {
    for (const step of phase.steps || []) {
      if (seenStepNumbers.has(step.stepNumber)) continue;

      const hasMatch = step.skills?.some((s) => {
        const normalizedSkill = s.trim().toLowerCase();
        if (!normalizedSkill) return false;
        if (normalizedSkill === normalizedTarget) return true;
        if (normalizedTarget.length >= 3 && normalizedSkill.includes(normalizedTarget)) return true;
        if (normalizedSkill.length >= 3 && normalizedTarget.includes(normalizedSkill)) return true;
        return false;
      });

      if (hasMatch) {
        matched.push({
          stepNumber: step.stepNumber,
          title: step.title,
          phaseNumber: phase.phase,
        });
        seenStepNumbers.add(step.stepNumber);
      }
    }
  }

  return matched;
}

export type WeakSkillInput = {
  skillId: number;
  skillName: string;
  score: number;
  level: number;
  label?: DemonstratedLevelLabel;
  isHighPriority?: boolean;
  completedAt?: Date | string;
};

export type AdaptiveRecommendationStatus =
  | "RECOMMENDED"
  | "ALL_COMPLETED"
  | "NO_MAPPED_STEP"
  | "NO_WEAK_SKILL";

export type AdaptiveRecommendationResult = {
  status: AdaptiveRecommendationStatus;
  weakSkill: {
    skillId: number;
    skillName: string;
    score: number;
    level: number;
    label: DemonstratedLevelLabel;
    isHighPriority: boolean;
    reason: string;
  } | null;
  recommendedStep: {
    stepNumber: number;
    title: string;
    isCompleted: boolean;
  } | null;
  allMatchingSteps?: Array<{ stepNumber: number; title: string; isCompleted: boolean }>;
};

export function resolveAdaptiveLearningRecommendation(params: {
  weakSkills: WeakSkillInput[];
  phases?: Array<{ phase?: number; steps?: Array<{ stepNumber: number; title: string; skills?: string[] }> }> | null;
  completedStepNumbers?: number[] | Set<number> | null;
}): AdaptiveRecommendationResult {
  const { weakSkills, phases, completedStepNumbers } = params;
  const completedSet = completedStepNumbers instanceof Set
    ? completedStepNumbers
    : new Set(completedStepNumbers || []);

  if (!weakSkills || weakSkills.length === 0) {
    return {
      status: "NO_WEAK_SKILL",
      weakSkill: null,
      recommendedStep: null,
    };
  }

  // Sort weak skills: high-priority skills first, then lowest score first
  const sortedWeak = [...weakSkills].sort((a, b) => {
    const pA = a.isHighPriority ? 1 : 0;
    const pB = b.isHighPriority ? 1 : 0;
    if (pB !== pA) return pB - pA;
    return a.score - b.score;
  });

  const selectedSkill = sortedWeak[0];
  const levelLabel = selectedSkill.label ?? getDemonstratedLevelLabel(selectedSkill.score);
  const isHighPriority = Boolean(selectedSkill.isHighPriority);
  const reason = isHighPriority
    ? "This high-priority skill required for your target career role is currently assessed below proficient."
    : "This skill is currently assessed below the proficient threshold.";

  const weakSkillMeta = {
    skillId: selectedSkill.skillId,
    skillName: selectedSkill.skillName,
    score: selectedSkill.score,
    level: selectedSkill.level,
    label: levelLabel,
    isHighPriority,
    reason,
  };

  const matchingSteps = findMatchingRoadmapSteps(selectedSkill.skillName, phases);
  if (matchingSteps.length === 0) {
    return {
      status: "NO_MAPPED_STEP",
      weakSkill: weakSkillMeta,
      recommendedStep: null,
    };
  }

  const stepsWithCompletion = matchingSteps.map((s) => ({
    stepNumber: s.stepNumber,
    title: s.title,
    isCompleted: completedSet.has(s.stepNumber),
  }));

  // Requirement 4: Prefer an incomplete roadmap step.
  const incompleteStep = stepsWithCompletion.find((s) => !s.isCompleted);
  if (incompleteStep) {
    return {
      status: "RECOMMENDED",
      weakSkill: weakSkillMeta,
      recommendedStep: incompleteStep,
      allMatchingSteps: stepsWithCompletion,
    };
  }

  // Requirement 6: If all matching steps are completed, show neutral "All mapped learning completed" state.
  return {
    status: "ALL_COMPLETED",
    weakSkill: weakSkillMeta,
    recommendedStep: stepsWithCompletion[0],
    allMatchingSteps: stepsWithCompletion,
  };
}

