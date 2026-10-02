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
