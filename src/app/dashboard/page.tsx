import { requireUserId } from "@/lib/auth";
import { DashboardOverview } from "@/components/dashboard-overview";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { query } from "@/lib/db";
import { getStudentSkillGap } from "@/lib/student-skill-gap";

type Student = { full_name: string; college: string; branch: string; college_id: number; branch_id: number; current_year: number; career_goal: string };
type Curriculum = { curriculum_name: string; regulation_version: string; semesters: number; subjects: number };

export default async function DashboardPage() {
  const id = await requireUserId();
  const studentResult = await query<Student>("SELECT u.full_name, c.name AS college, b.name AS branch, sp.college_id::integer, sp.branch_id::integer, sp.current_year, sp.career_goal FROM users u JOIN student_profiles sp ON sp.user_id=u.id JOIN colleges c ON c.id=sp.college_id JOIN branches b ON b.id=sp.branch_id WHERE u.id=$1", [id]);
  const student = studentResult.rows[0];
  if (!student) throw Error("Student profile was not found.");
  const [skillGap, curriculumResult] = await Promise.all([
    getStudentSkillGap(id),
    query<Curriculum>("SELECT cu.curriculum_name, cu.regulation_version, COUNT(DISTINCT se.id)::integer AS semesters, COUNT(su.id)::integer AS subjects FROM curricula cu LEFT JOIN semesters se ON se.curriculum_id=cu.id LEFT JOIN subjects su ON su.semester_id=se.id WHERE cu.college_id=$1 AND cu.branch_id=$2 GROUP BY cu.id, cu.curriculum_name, cu.regulation_version ORDER BY cu.id DESC LIMIT 1", [student.college_id, student.branch_id]),
  ]);
  const curriculum = curriculumResult.rows[0];
  return <DashboardShell hidePageIntro><DashboardOverview student={{ fullName: student.full_name, college: student.college, branch: student.branch, currentYear: student.current_year, careerGoal: student.career_goal }} skillGap={skillGap} curriculum={curriculum ? { name: curriculum.curriculum_name, version: curriculum.regulation_version, semesters: curriculum.semesters, subjects: curriculum.subjects } : null}/></DashboardShell>;
}
