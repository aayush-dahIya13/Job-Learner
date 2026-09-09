import { query } from "@/lib/db";
import { calculateSkillGap } from "@/lib/skill-gap";

export async function getStudentSkillGap(userId: number) {
  const goal = await query<{ id: number; title: string }>("SELECT jr.id::integer AS id, jr.title FROM student_career_goals scg JOIN job_roles jr ON jr.id = scg.job_role_id WHERE scg.user_id = $1", [userId]);
  const jobRole = goal.rows[0];
  if (!jobRole) return null;
  const [required, current] = await Promise.all([
    query<{ skill_id: number; skill_name: string; required_level: number; importance: number }>("SELECT jrs.skill_id::integer AS skill_id, s.name AS skill_name, jrs.required_level, jrs.importance FROM job_role_skills jrs JOIN skills s ON s.id = jrs.skill_id WHERE jrs.job_role_id = $1 ORDER BY jrs.importance DESC, s.name", [jobRole.id]),
    query<{ skill_id: number; proficiency_level: number }>("SELECT skill_id::integer AS skill_id, proficiency_level FROM student_skills WHERE user_id = $1", [userId]),
  ]);
  return calculateSkillGap(jobRole, required.rows.map((row) => ({ skillId: row.skill_id, skillName: row.skill_name, requiredLevel: row.required_level, importance: row.importance })), current.rows.map((row) => ({ skillId: row.skill_id, proficiencyLevel: row.proficiency_level })));
}
