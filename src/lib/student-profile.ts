import { query } from "@/lib/db";
import { getLatestDemonstratedSkills } from "@/lib/student-assessment";
import type { DemonstratedLevelLabel } from "@/lib/proficiency";

export type StudentProfileSkill = {
  skillId: number;
  skillName: string;
  category?: string;
  proficiencyLevel: number;
  demonstratedLevel?: number | null;
  demonstratedLabel?: DemonstratedLevelLabel | null;
  demonstratedPercentage?: number | null;
};

export type ProfileCompleteness = {
  completedCount: number;
  totalFields: number;
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
};

export type StudentProfileDetails = {
  userId: number;
  fullName: string;
  email: string;
  contactNumber: string;
  collegeId: number;
  collegeName: string;
  branchId: number;
  branchName: string;
  currentYear: number;
  careerGoal: string; // Vision text
  targetRole: { id: number; title: string } | null;
  skills: StudentProfileSkill[];
  completeness: ProfileCompleteness;
};

export function calculateProfileCompleteness(params: {
  fullName?: string | null;
  contactNumber?: string | null;
  collegeName?: string | null;
  branchName?: string | null;
  currentYear?: number | null;
  careerGoal?: string | null;
  hasTargetRole?: boolean | null;
  skillsCount?: number | null;
}): ProfileCompleteness {
  const fields = [
    { name: "Full Name", isComplete: Boolean(params.fullName?.trim()) },
    { name: "Contact Number", isComplete: Boolean(params.contactNumber?.trim()) },
    { name: "College / Institute", isComplete: Boolean(params.collegeName?.trim()) },
    { name: "Branch / Specialization", isComplete: Boolean(params.branchName?.trim()) },
    { name: "Academic Year", isComplete: Boolean(params.currentYear && params.currentYear >= 1) },
    { name: "Career Vision Goal", isComplete: Boolean(params.careerGoal?.trim()) },
    { name: "Added Skills", isComplete: Boolean(params.skillsCount && params.skillsCount > 0) },
  ];

  const completedCount = fields.filter((f) => f.isComplete).length;
  const totalFields = fields.length;
  const percentage = Math.round((completedCount / totalFields) * 100);
  const missingFields = fields.filter((f) => !f.isComplete).map((f) => f.name);

  return {
    completedCount,
    totalFields,
    percentage,
    missingFields,
    isComplete: completedCount === totalFields,
  };
}

export async function getStudentProfileDetails(userId: number): Promise<StudentProfileDetails> {
  const userRes = await query<{
    id: number;
    full_name: string;
    email: string;
    contact_number: string | null;
    college_id: number | null;
    college_name: string | null;
    branch_id: number | null;
    branch_name: string | null;
    current_year: number | null;
    career_goal: string | null;
  }>(
    `SELECT u.id::integer AS id, u.full_name, u.email,
            sp.contact_number, sp.college_id::integer AS college_id, c.name AS college_name,
            sp.branch_id::integer AS branch_id, b.name AS branch_name,
            sp.current_year, sp.career_goal
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN colleges c ON c.id = sp.college_id
     LEFT JOIN branches b ON b.id = sp.branch_id
     WHERE u.id = $1`,
    [userId]
  );

  const u = userRes.rows[0];

  const goalRes = await query<{ id: number; title: string }>(
    `SELECT jr.id::integer AS id, jr.title
     FROM student_career_goals scg
     JOIN job_roles jr ON jr.id = scg.job_role_id
     WHERE scg.user_id = $1`,
    [userId]
  );
  const targetRole = goalRes.rows[0] ? { id: goalRes.rows[0].id, title: goalRes.rows[0].title } : null;

  const skillsRes = await query<{ skill_id: number; skill_name: string; proficiency_level: number }>(
    `SELECT ss.skill_id::integer AS skill_id, s.name AS skill_name, ss.proficiency_level
     FROM student_skills ss
     JOIN skills s ON s.id = ss.skill_id
     WHERE ss.user_id = $1
     ORDER BY s.name ASC`,
    [userId]
  );

  const demoSkills = await getLatestDemonstratedSkills(userId);
  const demoMap = new Map(demoSkills.map((ds) => [ds.skillId, ds]));

  const skills: StudentProfileSkill[] = skillsRes.rows.map((sr) => {
    const demo = demoMap.get(sr.skill_id);
    return {
      skillId: sr.skill_id,
      skillName: sr.skill_name,
      proficiencyLevel: sr.proficiency_level,
      demonstratedLevel: demo ? demo.demonstratedLevel : null,
      demonstratedLabel: demo ? (demo.levelLabel as DemonstratedLevelLabel) : null,
      demonstratedPercentage: demo ? demo.percentage : null,
    };
  });

  const completeness = calculateProfileCompleteness({
    fullName: u?.full_name,
    contactNumber: u?.contact_number,
    collegeName: u?.college_name,
    branchName: u?.branch_name,
    currentYear: u?.current_year,
    careerGoal: u?.career_goal,
    hasTargetRole: Boolean(targetRole),
    skillsCount: skills.length,
  });

  return {
    userId,
    fullName: u?.full_name ?? "",
    email: u?.email ?? "",
    contactNumber: u?.contact_number ?? "",
    collegeId: u?.college_id ?? 0,
    collegeName: u?.college_name ?? "Not specified",
    branchId: u?.branch_id ?? 0,
    branchName: u?.branch_name ?? "Not specified",
    currentYear: u?.current_year ?? 1,
    careerGoal: u?.career_goal ?? "",
    targetRole,
    skills,
    completeness,
  };
}
