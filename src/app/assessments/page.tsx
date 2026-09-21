import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { query } from "@/lib/db";
import {
  getActiveAssessmentForRole,
  getActiveStudentAttempt,
  getAssessmentQuestions,
  getMilestoneAssessmentsForUser,
  startAssessmentAttempt,
} from "@/lib/student-assessment";
import { AssessmentRunner } from "@/components/assessment-runner";

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ assessmentId?: string }>;
}) {
  const userId = await requireUserId();
  const { assessmentId: rawAssessmentId } = await searchParams;
  const requestedAssessmentId = rawAssessmentId ? Number(rawAssessmentId) : null;

  // Get active career goal
  const goalRes = await query<{ job_role_id: number; title: string }>(
    `SELECT scg.job_role_id::integer AS job_role_id, jr.title 
     FROM student_career_goals scg 
     JOIN job_roles jr ON jr.id = scg.job_role_id 
     WHERE scg.user_id = $1`,
    [userId]
  );

  const goal = goalRes.rows[0];
  if (!goal) {
    return (
      <DashboardShell title="Technical Skill Assessments" description="Objective evaluation of your technical skills for your target career direction.">
        <div className="surface p-8 text-center space-y-4 max-w-xl mx-auto my-10">
          <span className="text-4xl">🎯</span>
          <h2 className="text-2xl font-bold">Select a Target Career Goal</h2>
          <p className="text-sm text-stone-600">
            Please choose a target career direction in your settings before starting a diagnostic assessment.
          </p>
          <Link className="btn-primary inline-block px-5 py-2.5 text-sm" href="/settings">
            Set Target Career Goal →
          </Link>
        </div>
      </DashboardShell>
    );
  }

  // If a specific assessment was requested (e.g. Milestone or Diagnostic)
  let targetAssessment = null;
  if (requestedAssessmentId) {
    const targetRes = await query<{
      id: number;
      job_role_id: number | null;
      title: string;
      description: string | null;
      duration_minutes: number;
      total_questions: number;
      passing_score: number;
      version: number;
    }>(
      `SELECT id::integer AS id, job_role_id::integer AS job_role_id, title, description,
              duration_minutes, total_questions, passing_score, version
       FROM assessments WHERE id = $1 AND status = 'active'`,
      [requestedAssessmentId]
    );
    if (targetRes.rows[0]) {
      const row = targetRes.rows[0];
      targetAssessment = {
        id: row.id,
        jobRoleId: row.job_role_id,
        title: row.title,
        description: row.description,
        durationMinutes: row.duration_minutes,
        totalQuestions: row.total_questions,
        passingScore: row.passing_score,
        version: row.version,
      };
    }
  }

  // Fallback to active diagnostic assessment if no specific assessment requested
  const diagnosticAssessment = await getActiveAssessmentForRole(goal.job_role_id);
  const activeAssessment = targetAssessment || diagnosticAssessment;

  // Fetch active attempt for requested assessment or any in-progress attempt
  const activeAttempt = await getActiveStudentAttempt(userId, activeAssessment?.id);

  // If an active in-progress attempt exists, render runner directly
  if (activeAttempt && activeAssessment) {
    const questions = await getAssessmentQuestions(activeAssessment.id);
    return (
      <DashboardShell hidePageIntro title="Technical Skill Assessment" description="Active test session">
        <AssessmentRunner
          attemptId={activeAttempt.id}
          assessmentTitle={activeAssessment.title}
          durationMinutes={activeAssessment.durationMinutes}
          questions={questions}
        />
      </DashboardShell>
    );
  }

  // Fetch milestone assessments available for student's role
  const milestones = await getMilestoneAssessmentsForUser(userId, goal.job_role_id);

  // Fetch past completed attempts
  const pastAttemptsRes = await query<{
    id: number;
    title: string;
    completed_at: Date;
    score: string;
    percentage: string;
    attempt_number: number;
    assessment_type: string;
  }>(
    `SELECT aa.id::integer AS id, a.title, aa.completed_at, aa.score::text, aa.percentage::text, aa.attempt_number, a.assessment_type
     FROM assessment_attempts aa
     JOIN assessments a ON a.id = aa.assessment_id
     WHERE aa.user_id = $1 AND aa.status = 'completed'
     ORDER BY aa.completed_at DESC`,
    [userId]
  );

  return (
    <DashboardShell
      title="Skill Assessments & Checkpoints"
      description="Measure your objective technical proficiency through diagnostic baselines and roadmap milestone checkpoints."
    >
      <div className="space-y-8">
        {/* Main Diagnostic Card */}
        <section className="dashboard-card p-6 sm:p-8 grid gap-6 lg:grid-cols-[1fr_260px] items-center">
          <div className="space-y-4">
            <span className="eyebrow">Target Role: {goal.title}</span>
            <h2 className="text-2xl font-bold sm:text-3xl">
              {diagnosticAssessment?.title || `${goal.title} Diagnostic`}
            </h2>
            <p className="text-sm leading-relaxed text-stone-600 max-w-2xl">
              {diagnosticAssessment?.description ||
                "This assessment evaluates your demonstrated technical knowledge across key full-stack development competencies. The results establish an objective baseline for your skill gap and learning roadmap."}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-500 pt-2">
              <span className="flex items-center gap-1.5 rounded-lg bg-surface-muted px-3 py-1.5">
                ⏱ {diagnosticAssessment?.durationMinutes || 45} Minutes
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-surface-muted px-3 py-1.5">
                📋 {diagnosticAssessment?.totalQuestions || 23} Questions
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-surface-muted px-3 py-1.5">
                🎯 Scored Server-Side
              </span>
            </div>

            {diagnosticAssessment && (
              <form
                action={async () => {
                  "use server";
                  const uId = await requireUserId();
                  const goalQuery = await query<{ job_role_id: number }>(
                    "SELECT job_role_id::integer FROM student_career_goals WHERE user_id = $1",
                    [uId]
                  );
                  if (!goalQuery.rows[0]) return;
                  const activeAss = await getActiveAssessmentForRole(goalQuery.rows[0].job_role_id);
                  if (!activeAss) return;

                  await startAssessmentAttempt(uId, activeAss.id);
                  redirect(`/assessments`);
                }}
                className="pt-4"
              >
                <button type="submit" className="btn-primary px-6 py-3 text-base">
                  Start Diagnostic Assessment →
                </button>
              </form>
            )}
          </div>

          <div className="rounded-2xl border border-stone-200 bg-surface-muted p-6 text-center space-y-3 dark:border-stone-800">
            <span className="text-3xl">💡</span>
            <h3 className="font-bold text-base">Continuous Checkpoints</h3>
            <p className="text-xs text-stone-600 leading-normal">
              Take diagnostic baselines initially, then validate your skill growth as you complete each phase in your roadmap.
            </p>
          </div>
        </section>

        {/* Milestone Checkpoint Assessments Section */}
        {milestones.length > 0 && (
          <section className="space-y-4">
            <div>
              <span className="eyebrow">Learning Journey Checkpoints</span>
              <h3 className="text-xl font-bold mt-1">Roadmap Milestone Checkpoints</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {milestones.map((m) => (
                <div key={m.id} className="surface p-5 space-y-4 flex flex-col justify-between border rounded-2xl">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase text-primary">Milestone Assessment</span>
                      {m.status === "completed" ? (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          ✓ Completed ({m.latestPercentage}%)
                        </span>
                      ) : m.status === "in_progress" ? (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          In Progress
                        </span>
                      ) : (
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                          Ready
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-base">{m.title}</h4>
                    <p className="text-xs text-stone-600 line-clamp-2">{m.description}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {m.skillsTested.map((skill) => (
                        <span key={skill} className="rounded bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-stone-700 dark:text-stone-300">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <form
                    action={async () => {
                      "use server";
                      const uId = await requireUserId();
                      await startAssessmentAttempt(uId, m.id);
                      redirect(`/assessments?assessmentId=${m.id}`);
                    }}
                  >
                    <button type="submit" className="btn-secondary w-full text-center px-4 py-2.5 text-xs font-bold">
                      {m.status === "completed"
                        ? "Retake Checkpoint Assessment →"
                        : m.status === "in_progress"
                        ? "Resume Assessment →"
                        : "Take Checkpoint Assessment →"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Past Attempts History */}
        {pastAttemptsRes.rows.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xl font-bold">Past Assessment Attempts</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastAttemptsRes.rows.map((att) => (
                <div key={att.id} className="surface p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
                      <span className="capitalize">{att.assessment_type} · Attempt #{att.attempt_number}</span>
                      <span>{formatDate(att.completed_at)}</span>
                    </div>
                    <h4 className="mt-2 font-bold text-base">{att.title}</h4>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-primary">{att.percentage}%</span>
                      <span className="text-xs text-stone-500">Score</span>
                    </div>
                  </div>
                  <Link
                    href={`/assessments/${att.id}`}
                    className="btn-secondary text-center w-full px-3 py-2 text-xs"
                  >
                    View Report →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
