import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { query } from "@/lib/db";
import {
  getActiveAssessmentForRole,
  getActiveStudentAttempt,
  getAssessmentQuestions,
  startAssessmentAttempt,
} from "@/lib/student-assessment";
import { AssessmentRunner } from "@/components/assessment-runner";

export default async function AssessmentsPage() {
  const userId = await requireUserId();

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
      <DashboardShell title="Diagnostic Skill Assessment" description="Objective evaluation of your technical skills for your target career direction.">
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

  const assessment = await getActiveAssessmentForRole(goal.job_role_id);
  const activeAttempt = await getActiveStudentAttempt(userId, assessment?.id);

  // If an active attempt exists, fetch questions and render runner directly
  if (activeAttempt && assessment) {
    const questions = await getAssessmentQuestions(assessment.id);
    return (
      <DashboardShell hidePageIntro title="Diagnostic Skill Assessment" description="Active test session">
        <AssessmentRunner
          attemptId={activeAttempt.id}
          assessmentTitle={assessment.title}
          durationMinutes={assessment.durationMinutes}
          questions={questions}
        />
      </DashboardShell>
    );
  }

  // Fetch past completed attempts
  const pastAttemptsRes = await query<{
    id: number;
    title: string;
    completed_at: Date;
    score: string;
    percentage: string;
    attempt_number: number;
  }>(
    `SELECT aa.id::integer AS id, a.title, aa.completed_at, aa.score::text, aa.percentage::text, aa.attempt_number
     FROM assessment_attempts aa
     JOIN assessments a ON a.id = aa.assessment_id
     WHERE aa.user_id = $1 AND aa.status = 'completed'
     ORDER BY aa.completed_at DESC`,
    [userId]
  );

  return (
    <DashboardShell
      title="Diagnostic Skill Assessment"
      description="Measure your objective technical proficiency against industry requirements for your target career."
    >
      <div className="space-y-8">
        {/* Main Card */}
        <section className="dashboard-card p-6 sm:p-8 grid gap-6 lg:grid-cols-[1fr_260px] items-center">
          <div className="space-y-4">
            <span className="eyebrow">Target Role: {goal.title}</span>
            <h2 className="text-2xl font-bold sm:text-3xl">
              {assessment?.title || `${goal.title} Diagnostic`}
            </h2>
            <p className="text-sm leading-relaxed text-stone-600 max-w-2xl">
              {assessment?.description ||
                "This assessment evaluates your demonstrated technical knowledge across key full-stack development competencies. The results establish an objective baseline for your skill gap and learning roadmap."}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-500 pt-2">
              <span className="flex items-center gap-1.5 rounded-lg bg-surface-muted px-3 py-1.5">
                ⏱ {assessment?.durationMinutes || 45} Minutes
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-surface-muted px-3 py-1.5">
                📋 {assessment?.totalQuestions || 23} Questions
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-surface-muted px-3 py-1.5">
                🎯 Scored Server-Side
              </span>
            </div>

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
          </div>

          <div className="rounded-2xl border border-stone-200 bg-surface-muted p-6 text-center space-y-3 dark:border-stone-800">
            <span className="text-3xl">💡</span>
            <h3 className="font-bold text-base">Why Take This?</h3>
            <p className="text-xs text-stone-600 leading-normal">
              Your self-reported skills are useful, but diagnostic evidence gives AI guidance and roadmap generation exact precision.
            </p>
          </div>
        </section>

        {/* Past Attempts History */}
        {pastAttemptsRes.rows.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xl font-bold">Past Assessment Attempts</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastAttemptsRes.rows.map((att) => (
                <div key={att.id} className="surface p-5 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
                      <span>Attempt #{att.attempt_number}</span>
                      <span>{new Date(att.completed_at).toLocaleDateString()}</span>
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
