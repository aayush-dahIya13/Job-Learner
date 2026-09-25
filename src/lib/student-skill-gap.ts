import { query } from "@/lib/db";
import { calculateSkillGap } from "@/lib/skill-gap";
import { getLatestDemonstratedSkills, getSkillProgressHistory } from "@/lib/student-assessment";
import { resolveEffectiveSkillState, type DemonstratedLevelLabel } from "@/lib/proficiency";

export type AssessmentWeakSkill = {
  skillId: number;
  skillName: string;
  score: number;
  level: number;
  label: DemonstratedLevelLabel;
  isIndustryRequired: boolean;
  isHighPriority: boolean;
  completedAt: Date | string;
};

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

  const requiredSkillIds = new Set(required.rows.map((r) => r.skill_id));
  const demonstratedMap = new Map(demonstrated.map((d) => [d.skillId, d]));
  const diagMap = new Map(diagRes.rows.map((d) => [d.skill_id, { percentage: Number(d.percentage), level: d.demonstrated_level }]));
  const historyMap = new Map(progressHistory.map((h) => [h.skillId, h]));

  const enrichedSkills = baseGap.skills.map((skill) => {
    const demo = demonstratedMap.get(skill.skillId);
    const diag = diagMap.get(skill.skillId);
    const history = historyMap.get(skill.skillId);

    const effectiveState = resolveEffectiveSkillState({
      skillId: skill.skillId,
      skillName: skill.skillName,
      latestDemonstrated: demo ? {
        attemptId: demo.attemptId,
        assessmentId: 0,
        assessmentTitle: "",
        assessmentType: "",
        score: demo.percentage,
        percentage: demo.percentage,
        demonstratedLevel: demo.demonstratedLevel,
        levelLabel: demo.levelLabel,
        completedAt: demo.completedAt,
      } : null,
      selfReportedLevel: skill.studentLevel,
      requiredLevel: skill.requiredLevel,
    });

    const status: "mastered" | "needs_improvement" | "missing" =
      effectiveState.effectiveLevel >= skill.requiredLevel
        ? "mastered"
        : effectiveState.effectiveLevel > 0
        ? "needs_improvement"
        : "missing";

    return {
      ...skill,
      effectiveLevel: effectiveState.effectiveLevel,
      effectiveLabel: effectiveState.effectiveLabel,
      gap: effectiveState.gap,
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

  // Assessment-Driven Skill Gap Analysis
  const assessmentWeakSkills: AssessmentWeakSkill[] = [];
  const highPrioritySkills: AssessmentWeakSkill[] = [];
  const onTrackAssessedSkills: Array<{ skillId: number; skillName: string; percentage: number; level: number; label: DemonstratedLevelLabel }> = [];
  const nonCareerWeakSkills: AssessmentWeakSkill[] = [];

  for (const demo of demonstrated) {
    const isRequired = requiredSkillIds.has(demo.skillId);
    const isWeak = demo.demonstratedLevel < 3; // Demonstrated Level 1 (Beginner) or Level 2 (Developing) < 60%

    const item: AssessmentWeakSkill = {
      skillId: demo.skillId,
      skillName: demo.skillName,
      score: demo.percentage,
      level: demo.demonstratedLevel,
      label: demo.levelLabel,
      isIndustryRequired: isRequired,
      isHighPriority: isRequired && isWeak,
      completedAt: demo.completedAt,
    };

    if (isWeak) {
      assessmentWeakSkills.push(item);
      if (isRequired) {
        highPrioritySkills.push(item);
      } else {
        nonCareerWeakSkills.push(item);
      }
    } else {
      onTrackAssessedSkills.push({
        skillId: demo.skillId,
        skillName: demo.skillName,
        percentage: demo.percentage,
        level: demo.demonstratedLevel,
        label: demo.levelLabel,
      });
    }
  }

  // Identify required skills that have no assessment evidence yet
  const unassessedRequiredSkills = enrichedSkills.filter((s) => s.demonstratedLevel === null);

  // Derive the most recent assessment completion timestamp from the already-
  // fetched demonstrated skills — no additional database query required.
  const lastAssessedAt: Date | string | null =
    demonstrated.length > 0
      ? demonstrated.reduce<Date | string>((latest, d) => {
          const t = typeof d.completedAt === "string" ? new Date(d.completedAt) : d.completedAt;
          const l = typeof latest === "string" ? new Date(latest) : latest;
          return t > l ? d.completedAt : latest;
        }, demonstrated[0].completedAt)
      : null;

  return {
    ...baseGap,
    hasTakenAssessment: demonstrated.length > 0,
    hasTakenDiagnostic: diagRes.rows.length > 0,
    lastAssessedAt,
    progressHistory,
    skills: enrichedSkills,
    // Assessment-Driven Skill Gap breakdown
    assessmentWeakSkills,
    highPrioritySkills,
    onTrackAssessedSkills,
    nonCareerWeakSkills,
    unassessedRequiredSkills,
  };
}
