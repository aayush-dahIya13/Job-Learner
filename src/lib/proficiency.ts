/**
 * UNIFIED PROFICIENCY MODEL (Single Source of Truth)
 * 
 * Centralized service for:
 * 1. Score-to-Level conversions (0-100% raw score -> 1-5 level scale)
 * 2. Score-to-Label mapping ("Beginner", "Developing", "Proficient", "Advanced", "Expert")
 * 3. Latest valid assessment evidence strategy (preserves attempt history; resolves current state)
 * 4. Unified skill state resolution (demonstrated assessment vs. self-reported fallback)
 */

export type DemonstratedLevelLabel = "Beginner" | "Developing" | "Proficient" | "Advanced" | "Expert";

export type ProficiencyBand = {
  minScore: number;
  maxScore: number;
  level: number;
  label: DemonstratedLevelLabel;
  description: string;
};

export const PROFICIENCY_BANDS: ReadonlyArray<ProficiencyBand> = [
  { minScore: 90, maxScore: 100, level: 5, label: "Expert", description: "Deep mastery, capable of building complex systems and debugging advanced problems." },
  { minScore: 75, maxScore: 89, level: 4, label: "Advanced", description: "Strong practical competence, capable of independent implementation." },
  { minScore: 60, maxScore: 74, level: 3, label: "Proficient", description: "Solid foundational knowledge, meets standard industry job requirements." },
  { minScore: 40, maxScore: 59, level: 2, label: "Developing", description: "Basic working knowledge, requires guided practice or improvement." },
  { minScore: 0, maxScore: 39, level: 1, label: "Beginner", description: "Introductory exposure or core conceptual gaps." },
];

/**
 * Converts a raw score percentage (0-100) to a numeric level (1-5).
 */
export function percentageToDemonstratedLevel(percentage: number): number {
  const normalized = Math.max(0, Math.min(100, Math.round(percentage)));
  if (normalized >= 90) return 5;
  if (normalized >= 75) return 4;
  if (normalized >= 60) return 3;
  if (normalized >= 40) return 2;
  return 1;
}

/**
 * Converts a raw score percentage (0-100) to a human-readable proficiency label.
 */
export function getDemonstratedLevelLabel(percentage: number): DemonstratedLevelLabel {
  const level = percentageToDemonstratedLevel(percentage);
  switch (level) {
    case 5: return "Expert";
    case 4: return "Advanced";
    case 3: return "Proficient";
    case 2: return "Developing";
    case 1: default: return "Beginner";
  }
}

/**
 * Converts a 1-5 numeric level to its corresponding label representation.
 */
export function levelToDemonstratedLevelLabel(level: number): DemonstratedLevelLabel {
  switch (Math.max(1, Math.min(5, level))) {
    case 5: return "Expert";
    case 4: return "Advanced";
    case 3: return "Proficient";
    case 2: return "Developing";
    case 1: default: return "Beginner";
  }
}

/**
 * Returns full details for a raw percentage score.
 */
export function getProficiencyDetails(percentage: number): {
  score: number;
  level: number;
  label: DemonstratedLevelLabel;
  band: ProficiencyBand;
} {
  const normalized = Math.max(0, Math.min(100, percentage));
  const level = percentageToDemonstratedLevel(normalized);
  const label = getDemonstratedLevelLabel(normalized);
  const band = PROFICIENCY_BANDS.find((b) => b.level === level) ?? PROFICIENCY_BANDS[4];

  return {
    score: normalized,
    level,
    label,
    band,
  };
}

/**
 * Historical assessment attempt evidence for a skill.
 */
export type DemonstratedSkillAttempt = {
  attemptId: number;
  assessmentId: number;
  assessmentTitle: string;
  assessmentType: string;
  score: number;
  percentage: number;
  demonstratedLevel: number;
  levelLabel: DemonstratedLevelLabel;
  completedAt: Date | string;
};

/**
 * Centralized evidence strategy rule to resolve current demonstrated skill state.
 * 
 * Strategy: Uses the LATEST valid completed assessment attempt (ordered by completedAt DESC).
 * Does NOT use the highest score to prevent artificial retake inflation.
 * Preserves complete attempt history.
 */
export function resolveCurrentDemonstratedSkill(
  attempts: DemonstratedSkillAttempt[]
): DemonstratedSkillAttempt | null {
  if (!attempts || attempts.length === 0) return null;

  // Sort by completedAt descending (latest attempt first)
  const sorted = [...attempts].sort((a, b) => {
    const dateA = new Date(a.completedAt).getTime();
    const dateB = new Date(b.completedAt).getTime();
    return dateB - dateA;
  });

  return sorted[0];
}

/**
 * Effective Skill State Resolution
 * Combines demonstrated assessment evidence with self-reported level fallback.
 */
export type EffectiveSkillState = {
  skillId: number;
  skillName: string;
  effectiveLevel: number;
  effectiveLabel: DemonstratedLevelLabel;
  source: "DEMONSTRATED" | "SELF_REPORTED" | "UNASSESSED";
  demonstratedScore: number | null;
  demonstratedLevel: number | null;
  demonstratedLabel: DemonstratedLevelLabel | null;
  selfReportedLevel: number | null;
  requiredLevel: number | null;
  gap: number;
  status: "MEETS_REQUIREMENT" | "BELOW_REQUIREMENT" | "UNVERIFIED" | "mastered" | "needs_improvement" | "missing";
};

export function resolveEffectiveSkillState(params: {
  skillId: number;
  skillName: string;
  latestDemonstrated?: DemonstratedSkillAttempt | null;
  selfReportedLevel?: number | null;
  requiredLevel?: number | null;
}): EffectiveSkillState {
  const { skillId, skillName, latestDemonstrated, selfReportedLevel, requiredLevel } = params;

  let effectiveLevel = 0;
  let source: "DEMONSTRATED" | "SELF_REPORTED" | "UNASSESSED" = "UNASSESSED";

  if (latestDemonstrated) {
    effectiveLevel = latestDemonstrated.demonstratedLevel;
    source = "DEMONSTRATED";
  } else if (selfReportedLevel !== undefined && selfReportedLevel !== null && selfReportedLevel > 0) {
    effectiveLevel = selfReportedLevel;
    source = "SELF_REPORTED";
  }

  const effectiveLabel = levelToDemonstratedLevelLabel(effectiveLevel);
  const targetLevel = requiredLevel ?? 0;
  const gap = targetLevel > 0 ? Math.max(0, targetLevel - effectiveLevel) : 0;

  let status: EffectiveSkillState["status"] = "UNVERIFIED";
  if (source === "DEMONSTRATED") {
    if (targetLevel === 0 || effectiveLevel >= targetLevel) {
      status = "MEETS_REQUIREMENT";
    } else {
      status = "BELOW_REQUIREMENT";
    }
  } else if (targetLevel > 0) {
    status = effectiveLevel >= targetLevel ? "mastered" : effectiveLevel > 0 ? "needs_improvement" : "missing";
  }

  return {
    skillId,
    skillName,
    effectiveLevel,
    effectiveLabel,
    source,
    demonstratedScore: latestDemonstrated ? latestDemonstrated.percentage : null,
    demonstratedLevel: latestDemonstrated ? latestDemonstrated.demonstratedLevel : null,
    demonstratedLabel: latestDemonstrated ? latestDemonstrated.levelLabel : null,
    selfReportedLevel: selfReportedLevel ?? null,
    requiredLevel: requiredLevel ?? null,
    gap,
    status,
  };
}
