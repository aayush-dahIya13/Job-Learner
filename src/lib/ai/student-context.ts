import { query } from "@/lib/db";
import { getStudentSkillGap } from "@/lib/student-skill-gap";

export type AiStudentContext = {
  student: { branch: string; academicYear: number; careerVision: string; skills: { name: string; proficiency: number }[] };
  career: { id: number; title: string; description: string | null; requiredSkills: { name: string; requiredLevel: number; importance: number }[] };
  skillGap: NonNullable<Awaited<ReturnType<typeof getStudentSkillGap>>>;
  curriculum: { subject: string; description: string | null; credits: number; semester: number }[];
};

export class AiContextError extends Error { constructor(public code: string, message: string) { super(message); } }

export async function loadAiStudentContext(userId: number): Promise<AiStudentContext> {
  const gap = await getStudentSkillGap(userId);
  if (!gap) throw new AiContextError("NO_CAREER_GOAL", "Choose a target job role before requesting AI guidance.");
  if (!gap.skills.length) throw new AiContextError("NO_SKILL_GAP_DATA", "This target role has no required skills yet.");
  const [profileResult, skillResult] = await Promise.all([
    query<{ branch: string; academic_year: number; career_vision: string; college_id: number; branch_id: number }>(
      "SELECT b.name AS branch, sp.current_year AS academic_year, sp.career_goal AS career_vision, sp.college_id::integer AS college_id, sp.branch_id::integer AS branch_id FROM student_profiles sp JOIN branches b ON b.id = sp.branch_id WHERE sp.user_id = $1", [userId]),
    query<{ name: string; proficiency: number }>("SELECT s.name, ss.proficiency_level AS proficiency FROM student_skills ss JOIN skills s ON s.id = ss.skill_id WHERE ss.user_id = $1 ORDER BY s.name", [userId]),
  ]);
  const profile = profileResult.rows[0];
  if (!profile) throw new AiContextError("NO_PROFILE", "Your student profile could not be found.");
  if (!skillResult.rows.length) throw new AiContextError("NO_STUDENT_SKILLS", "Add at least one current skill before requesting AI guidance.");
  const subjectResult = await query<{ subject: string; description: string | null; credits: string; semester: number }>(
    "SELECT s.subject_name AS subject, s.description, s.credits::text AS credits, sem.semester_number AS semester FROM curricula c JOIN semesters sem ON sem.curriculum_id = c.id JOIN subjects s ON s.semester_id = sem.id WHERE c.college_id = $1 AND c.branch_id = $2 ORDER BY sem.semester_number, s.subject_name LIMIT 30", [profile.college_id, profile.branch_id]);
  if (!subjectResult.rows.length) throw new AiContextError("NO_CURRICULUM", "No curriculum subjects are available for your college and branch yet.");
  return {
    student: { branch: profile.branch, academicYear: profile.academic_year, careerVision: profile.career_vision, skills: skillResult.rows },
    career: { id: gap.jobRole.id, title: gap.jobRole.title, description: (await query<{ description: string | null }>("SELECT description FROM job_roles WHERE id = $1", [gap.jobRole.id])).rows[0]?.description ?? null, requiredSkills: gap.skills.map((x) => ({ name: x.skillName, requiredLevel: x.requiredLevel, importance: x.importance })) },
    skillGap: gap,
    curriculum: subjectResult.rows.map((x) => ({ ...x, credits: Number(x.credits) })),
  };
}

export function safeAiInput(context: AiStudentContext) {
  return {
    student: context.student,
    career: context.career,
    deterministicSkillGap: {
      readinessScore: context.skillGap.readinessScore,
      hasTakenDiagnosticAssessment: context.skillGap.hasTakenAssessment,
      missingSkills: context.skillGap.skills.filter((x) => x.status === "missing").map((x) => x.skillName),
      needsImprovement: context.skillGap.skills.filter((x) => x.status === "needs_improvement").map((x) => x.skillName),
      masteredSkills: context.skillGap.skills.filter((x) => x.status === "mastered").map((x) => x.skillName),
      details: context.skillGap.skills.map(({ skillName, requiredLevel, studentLevel, demonstratedLevel, demonstratedPercentage, demonstratedLabel, importance, status }) => ({
        skillName,
        requiredLevel,
        selfReportedLevel: studentLevel,
        demonstratedLevel: demonstratedLevel ?? "Not assessed",
        demonstratedPercentage: demonstratedPercentage !== null ? `${demonstratedPercentage}%` : "Not assessed",
        demonstratedLabel: demonstratedLabel ?? "Not assessed",
        importance,
        status,
      })),
    },
    curriculum: context.curriculum,
  };
}
