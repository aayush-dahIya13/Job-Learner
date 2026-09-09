export type RequiredSkill = { skillId: number; skillName: string; requiredLevel: number; importance: number };
export type StudentSkillLevel = { skillId: number; proficiencyLevel: number };

export function calculateSkillGap(jobRole: { id: number; title: string }, requiredSkills: RequiredSkill[], studentSkills: StudentSkillLevel[]) {
  const levels = new Map(studentSkills.map((skill) => [skill.skillId, skill.proficiencyLevel]));
  let masteredSkills = 0, needsImprovement = 0, missingSkills = 0, weightedAchievement = 0, totalImportance = 0;
  const skills = requiredSkills.map((skill) => {
    const studentLevel = levels.get(skill.skillId) ?? 0;
    const gap = Math.max(skill.requiredLevel - studentLevel, 0);
    const status = studentLevel >= skill.requiredLevel ? "mastered" as const : studentLevel > 0 ? "needs_improvement" as const : "missing" as const;
    if (status === "mastered") masteredSkills++; else if (status === "needs_improvement") needsImprovement++; else missingSkills++;
    weightedAchievement += Math.min(studentLevel / skill.requiredLevel, 1) * skill.importance;
    totalImportance += skill.importance;
    return { ...skill, studentLevel, gap, status };
  });
  return { jobRole, readinessScore: totalImportance ? Math.round((weightedAchievement / totalImportance) * 100) : 0, summary: { totalRequiredSkills: skills.length, masteredSkills, needsImprovement, missingSkills }, skills };
}
