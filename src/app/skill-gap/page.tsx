import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getStudentSkillGap } from "@/lib/student-skill-gap";
import { CareerGoalSelector } from "@/components/career-goal-selector";
import { StudentSkillsManager } from "@/components/student-skills-manager";
import { SkillProgressView } from "@/components/skill-progress-view";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { formatDate, formatDateShort } from "@/lib/date";

export default async function SkillGapPage() {
  const id = await requireUserId();
  const gap = await getStudentSkillGap(id);

  return (
    <DashboardShell
      title="Skill Gap Analysis"
      description="Evaluates industry target role requirements alongside objective assessment evidence and self-reported skill levels."
    >
      {!gap ? (
        <>
          <div className="status-empty mt-8">
            <b className="block text-ink">Start your skill-gap analysis</b>
            <p className="mt-2">Choose a target role and add your current skills to see a readiness score.</p>
          </div>
          <CareerGoalSelector />
          <StudentSkillsManager />
        </>
      ) : (
        <>
          {/* Top Banner for Assessment Engine */}
          <section className="dashboard-card dashboard-sage mt-6 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="eyebrow text-moss">Evidence Layer</span>
              <h2 className="text-xl font-bold">Continuous Skill Assessments</h2>
              <p className="text-sm text-stone-600 max-w-xl">
                {gap.hasTakenAssessment
                  ? "Your demonstrated skill levels update dynamically whenever you complete diagnostic or milestone tests."
                  : "Measure your actual technical knowledge with objective assessments to validate your self-reported skills."}
              </p>
              {gap.lastAssessedAt && (
                <p className="text-xs text-stone-500 dark:text-stone-400 pt-1">
                  Last Assessed: <span className="font-semibold text-stone-700 dark:text-stone-300">{formatDateShort(gap.lastAssessedAt)}</span>
                </p>
              )}
            </div>
            <Link className="btn-primary px-5 py-2.5 text-sm shrink-0" href="/assessments">
              {gap.hasTakenAssessment ? "Take Checkpoint / Diagnostic →" : "Take Diagnostic Assessment →"}
            </Link>
          </section>

          {/* Metric Badges */}
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Readiness", `${gap.readinessScore}%`],
              ["Required", gap.summary.totalRequiredSkills],
              ["Mastered", gap.summary.masteredSkills],
              ["Improving", gap.summary.needsImprovement],
              ["Missing", gap.summary.missingSkills],
            ].map(([label, value]) => (
              <article className="surface p-5" key={String(label)}>
                <p className="text-sm text-stone-600">{label}</p>
                <p className="mt-2 text-3xl font-bold text-moss">{value}</p>
              </article>
            ))}
          </section>

          {/* SECTION 1: ASSESSMENT-DRIVEN SKILL GAP */}
          <section className="surface mt-8 p-5 sm:p-6 space-y-6">
            <div className="border-b border-stone-200 pb-4 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="eyebrow text-primary">Demonstrated Weaknesses</span>
                <h2 className="mt-1 text-xl font-bold">Based on Your Latest Assessments</h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  Skills where your latest demonstrated assessment score is below the Proficient threshold (Level 1 Beginner / Level 2 Developing).
                </p>
              </div>
              <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                {gap.assessmentWeakSkills.length} Assessed Weakness{gap.assessmentWeakSkills.length === 1 ? "" : "es"}
              </span>
            </div>

            {/* Empty State: No Assessment Taken */}
            {!gap.hasTakenAssessment && (
              <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/30">
                <p className="text-base font-bold text-stone-800 dark:text-stone-200">
                  No Assessment Evidence Available Yet
                </p>
                <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto">
                  Complete your diagnostic assessment to identify skill areas that need technical improvement based on empirical test data.
                </p>
                <Link className="btn-primary mt-4 inline-block text-xs" href="/assessments">
                  Take Diagnostic Assessment →
                </Link>
              </div>
            )}

            {/* Empty State: Taken Assessment, All Proficient */}
            {gap.hasTakenAssessment && gap.assessmentWeakSkills.length === 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 dark:border-emerald-900 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="font-bold text-sm">On Track Across All Assessed Skills</h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    No assessed skill is currently below the proficiency threshold (60%). Great job maintaining your technical competence!
                  </p>
                </div>
              </div>
            )}

            {/* Weak Skills Cards */}
            {gap.assessmentWeakSkills.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {gap.assessmentWeakSkills.map((weak) => (
                  <article
                    key={weak.skillId}
                    className={`rounded-xl border p-4 space-y-3 transition-all ${
                      weak.isHighPriority
                        ? "border-rose-300 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20"
                        : "border-amber-200 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                          {weak.skillName}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Assessed on {formatDate(weak.completedAt)}
                        </p>
                      </div>

                      {weak.isHighPriority ? (
                        <span className="rounded-full bg-rose-600 text-white px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider shrink-0 shadow-xs animate-pulse">
                          🔥 HIGH PRIORITY
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider shrink-0">
                          Development Area
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-stone-200/60 dark:border-stone-800">
                      <span className="text-stone-600 dark:text-stone-400">Demonstrated Score:</span>
                      <span className="text-stone-900 dark:text-stone-100 font-bold">
                        {weak.score}% · {weak.label} (Level {weak.level}/5)
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 dark:text-stone-400">
                      {weak.isHighPriority ? (
                        <p className="text-rose-800 dark:text-rose-300 font-medium">
                          ⚠️ Required for your target job role <strong>({gap.jobRole.title})</strong> and assessed below proficient.
                        </p>
                      ) : (
                        <p className="text-stone-500">
                          ℹ️ Assessed below proficient, but not currently required for target role.
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Historical Skill Progress View */}
          {gap.progressHistory && gap.progressHistory.length > 0 && (
            <SkillProgressView history={gap.progressHistory} />
          )}

          {/* SECTION 2: INDUSTRY SKILL GAP BREAKDOWN */}
          <section className="surface mt-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Industry Skill Gap</p>
                <h2 className="mt-1 text-xl font-bold">Target Role: {gap.jobRole.title}</h2>
              </div>
              <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-[#e5eee1]">
                <div className="h-full bg-brand" style={{ width: `${gap.readinessScore}%` }} />
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {gap.skills.map((skill) => (
                <article className="rounded-xl border border-stone-200 p-4 space-y-3 dark:border-stone-800" key={skill.skillId}>
                  <div className="flex items-start justify-between gap-3">
                    <b className="text-stone-900 dark:text-stone-100">{skill.skillName}</b>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        skill.status === "mastered"
                          ? "bg-green-100 text-moss"
                          : skill.status === "missing"
                          ? "bg-rose-100 text-[#914653]"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {skill.status === "needs_improvement" ? "Improving" : skill.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-stone-600 dark:text-stone-400">
                    <div className="flex justify-between">
                      <span>Self-reported: <strong>{skill.studentLevel}/5</strong></span>
                      <span>Required: <strong>{skill.requiredLevel}/5</strong></span>
                    </div>
                    {skill.diagnosticPercentage !== null && (
                      <div className="flex justify-between text-stone-500">
                        <span>Initial Diagnostic: <strong>{skill.diagnosticPercentage}%</strong></span>
                        <span>Level: <strong>Level {skill.diagnosticLevel}</strong></span>
                      </div>
                    )}
                    {skill.demonstratedLevel !== null && (
                      <div className="flex justify-between font-medium text-primary">
                        <span>Latest Demonstrated: <strong>{skill.demonstratedPercentage}%</strong></span>
                        <span>Level: <strong>{skill.demonstratedLabel} (Level {skill.demonstratedLevel}/5)</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                    <div
                      className="h-full bg-brand"
                      style={{ width: `${Math.min(100, ((skill.demonstratedLevel ?? skill.studentLevel) / skill.requiredLevel) * 100)}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <CareerGoalSelector />
          <StudentSkillsManager />
        </>
      )}
    </DashboardShell>
  );
}
