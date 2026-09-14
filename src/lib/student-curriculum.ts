import { query } from "@/lib/db";

type ProfileRow = { college_id: number | null; branch_id: number | null; college_name: string | null; branch_name: string | null; branch_code: string | null; branch_is_available: boolean | null };
type CurriculumRow = { id: number; curriculum_name: string; regulation_version: string; academic_year: string | null; description: string | null; source_name: string | null; source_url: string | null; last_verified_at: Date | null; verification_status: "verified" | "demo" | "unverified" };
type SubjectRow = { semester_number: number; subject_id: number | null; subject_code: string | null; subject_name: string | null; credits: string | null; subject_description: string | null };

export type StudentCurriculumResponse = {
  college: { id: number; name: string } | null;
  branch: { id: number; name: string; code: string | null } | null;
  curriculum: { id: number; name: string; regulationVersion: string; academicYear: string | null; description: string | null; sourceName: string | null; sourceUrl: string | null; lastVerifiedAt: string | null; verificationStatus: "verified" | "demo" | "unverified" } | null;
  semesters: Array<{ semesterNumber: number; subjects: Array<{ id: number; code: string; name: string; credits: number; description: string | null }> }>;
  availability: "available" | "missing_profile" | "missing_college" | "missing_branch" | "branch_unavailable" | "no_curriculum";
};

export async function getStudentCurriculum(userId: number): Promise<StudentCurriculumResponse> {
  const profileResult = await query<ProfileRow>(`SELECT sp.college_id::integer, sp.branch_id::integer, c.name AS college_name, b.name AS branch_name, b.code AS branch_code, (cb.college_id IS NOT NULL) AS branch_is_available FROM student_profiles sp LEFT JOIN colleges c ON c.id = sp.college_id LEFT JOIN branches b ON b.id = sp.branch_id LEFT JOIN college_branches cb ON cb.college_id = sp.college_id AND cb.branch_id = sp.branch_id WHERE sp.user_id = $1`, [userId]);
  const profile = profileResult.rows[0];
  if (!profile) return { college: null, branch: null, curriculum: null, semesters: [], availability: "missing_profile" };
  const college = profile.college_id && profile.college_name ? { id: profile.college_id, name: profile.college_name } : null;
  const branch = profile.branch_id && profile.branch_name ? { id: profile.branch_id, name: profile.branch_name, code: profile.branch_code } : null;
  if (!college) return { college: null, branch, curriculum: null, semesters: [], availability: "missing_college" };
  if (!branch) return { college, branch: null, curriculum: null, semesters: [], availability: "missing_branch" };
  if (!profile.branch_is_available) return { college, branch, curriculum: null, semesters: [], availability: "branch_unavailable" };

  const curriculumResult = await query<CurriculumRow>(`SELECT id::integer, curriculum_name, regulation_version, academic_year, description, source_name, source_url, last_verified_at, verification_status FROM curricula WHERE college_id = $1 AND branch_id = $2 ORDER BY id DESC LIMIT 1`, [college.id, branch.id]);
  const curriculum = curriculumResult.rows[0];
  if (!curriculum) return { college, branch, curriculum: null, semesters: [], availability: "no_curriculum" };
  const subjectResult = await query<SubjectRow>(`SELECT sem.semester_number, sub.id::integer AS subject_id, sub.subject_code, sub.subject_name, sub.credits::text AS credits, sub.description AS subject_description FROM semesters sem LEFT JOIN subjects sub ON sub.semester_id = sem.id WHERE sem.curriculum_id = $1 ORDER BY sem.semester_number ASC, sub.subject_code ASC, sub.id ASC`, [curriculum.id]);
  const semesters = new Map<number, StudentCurriculumResponse["semesters"][number]>();
  for (const row of subjectResult.rows) {
    const semester = semesters.get(row.semester_number) ?? { semesterNumber: row.semester_number, subjects: [] };
    if (row.subject_id && row.subject_code && row.subject_name && row.credits) semester.subjects.push({ id: row.subject_id, code: row.subject_code, name: row.subject_name, credits: Number(row.credits), description: row.subject_description });
    semesters.set(row.semester_number, semester);
  }
  return { college, branch, curriculum: { id: curriculum.id, name: curriculum.curriculum_name, regulationVersion: curriculum.regulation_version, academicYear: curriculum.academic_year, description: curriculum.description, sourceName: curriculum.source_name, sourceUrl: curriculum.source_url, lastVerifiedAt: curriculum.last_verified_at?.toISOString() ?? null, verificationStatus: curriculum.verification_status }, semesters: [...semesters.values()], availability: "available" };
}
