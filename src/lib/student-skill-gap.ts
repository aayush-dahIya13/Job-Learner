import { query } from "@/lib/db";
import { calculateSkillGap } from "@/lib/skill-gap";
import { getLatestDemonstratedSkills, getSkillProgressHistory } from "@/lib/student-assessment";

export async function getStudentSkillGap(userId: number) {
  const goal = await query<{ id: number; title: string }>(
    "SELECT jr.id::integer AS id, jr.title FROM student_career_goals scg JOIN job_roles jr ON jr.id = scg.job_role_id WHERE scg.user_id = $1",
    [userId]
  );
  const jobRole = goal.rows[0];
  if (!jobRole) return null;

  const [required, current, demonstrated, progressHistory, diagRes] = await Promise.all([
    query<{ skill_id: number; skill_name: string; required_level: number; importance: number }>(
      "SELECT jrs.skill_id::integer AS skill_id, s.name AS skill_name, jrs.required_level, jrs.importance FROM job_role_skills jrs JOIN skills s ON s.id = jrs.skill_id WHERE jrs.job_role_id = $1 ORDER BY jrs.importance DESC, s.name",
      [jobRole.id]
    ),
    query<{ skill_id: number; proficiency_level: number }>(
      "SELECT skill_id::integer AS skill_id, proficiency_level FROM student_skills WHERE user_id = $1",
      [userId]
    ),
    getLatestDemonstratedSkills(userId),
    getSkillProgressHistory(userId),
    query<{ skill_id: number; percentage: string; demonstrated_level: number }>(
      `SELECT DISTINCT ON (sar.skill_id) sar.skill_id::integer AS skill_id, sar.percentage::text, sar.demonstrated_level
       FROM skill_assessment_results sar
       JOIN assessment_attempts aa ON aa.id = sar.attempt_id
       JOIN assessments a ON a.id = aa.assessment_id
       WHERE sar.user_id = $1 AND a.assessment_type = 'diagnostic' AND aa.status = 'completed'
       ORDER BY sar.skill_id, aa.completed_at ASC`,
      [userId]
    ),
  ]);

  const baseGap = calculateSkillGap(
    jobRole,
    required.rows.map((row) => ({ skillId: row.skill_id, skillName: row.skill_name, requiredLevel: row.required_level, importance: row.importance })),
    current.rows.map((row) => ({ skillId: row.skill_id, proficiencyLevel: row.proficiency_level }))
  );

  const demonstratedMap = new Map(demonstrated.map((d) => [d.skillId, d]));
  const diagMap = new Map(diagRes.rows.map((d) => [d.skill_id, { percentage: Number(d.percentage), level: d.demonstrated_level }]));
  const historyMap = new Map(progressHistory.map((h) => [h.skillId, h]));

  const enrichedSkills = baseGap.skills.map((skill) => {
    const demo = demonstratedMap.get(skill.skillId);
    const diag = diagMap.get(skill.skillId);
    const history = historyMap.get(skill.skillId);

    // Compute effective level for gap calculation: prefer demonstrated level if available, otherwise self-reported
    const effectiveLevel = demo ? demo.demonstratedLevel : skill.studentLevel;
    const gap = Math.max(skill.requiredLevel - effectiveLevel, 0);
    const status = effectiveLevel >= skill.requiredLevel ? ("mastered" as const) : effectiveLevel > 0 ? ("needs_improvement" as const) : ("missing" as const);

    return {
      ...skill,
      effectiveLevel,
      gap,
      status,
      diagnosticPercentage: diag ? diag.percentage : null,
      diagnosticLevel: diag ? diag.level : null,
      demonstratedLevel: demo ? demo.demonstratedLevel : null,
      demonstratedPercentage: demo ? demo.percentage : null,
      demonstratedLabel: demo ? demo.levelLabel : null,
      history: history ? history.attempts : [],
      improvementPercentage: history ? history.improvementPercentage : null,
    };
  });

  return {
    ...baseGap,
    hasTakenAssessment: demonstrated.length > 0,
    hasTakenDiagnostic: diagRes.rows.length > 0,
    progressHistory,
    skills: enrichedSkills,
  };
}
