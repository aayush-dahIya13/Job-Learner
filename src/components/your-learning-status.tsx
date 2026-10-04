import Link from "next/link";
import type { StudentLearningStatus } from "@/lib/student-dashboard-status";
import { formatDateShort } from "@/lib/date";

type YourLearningStatusProps = {
  status: StudentLearningStatus;
};

export function YourLearningStatus({ status }: YourLearningStatusProps) {
  const {
    hasTargetRole,
    jobRoleTitle,
    readinessScore,
    hasTakenAssessment,
    improvingSkills,
    attentionSkills,
    recommendation,
    latestAssessment,
  } = status;

  return (
    <section className="space-y-6" aria-labelledby="learning-status-heading">
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200/80 pb-4 dark:border-stone-800">
        <div>
          <span className="eyebrow text-moss">Adaptive Learning Command Center</span>
          <h2 id="learning-status-heading" className="mt-1 text-2xl font-bold tracking-tight">
            Your Learning Status
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            See where you stand, what is improving, and what to focus on next.
          </p>
        </div>

        {hasTargetRole && jobRoleTitle && (
          <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-3.5 py-1 text-xs font-bold text-stone-700 dark:text-stone-300">
            Target Role: {jobRoleTitle}
          </span>
        )}
      </div>

      {/* Grid Layout: Top Row (Readiness & Recommended Next), Middle Row (Needs Attention & Improving), Bottom Row (Latest Assessment) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* 1. OVERALL LEARNING STATUS (Readiness Score) */}
        <article className="lg:col-span-4 dashboard-card dashboard-pink p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="eyebrow text-moss">Current Readiness</span>
            <h3 className="mt-1 text-xl font-bold text-stone-900 dark:text-stone-100">
              {jobRoleTitle ? jobRoleTitle : "Career Readiness"}
            </h3>
            <p className="mt-2 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              Based on your latest demonstrated skills and objective assessment results.
            </p>
          </div>

          {readinessScore !== null ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-4xl font-extrabold text-moss">{readinessScore}%</span>
                <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                  Readiness Score
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/80 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700">
                <div
                  className="h-full rounded-full bg-moss transition-all duration-500"
                  style={{ width: `${readinessScore}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700 p-4 text-center">
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Select a target career role to calculate your career readiness score.
              </p>
            </div>
          )}

          <Link
            href="/skill-gap"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline pt-1"
          >
            <span>View Full Skill Gap Analysis</span>
            <span>→</span>
          </Link>
        </article>

        {/* 2. RECOMMENDED NEXT (High Visual Priority) */}
        <article className="lg:col-span-8 dashboard-card dashboard-sage p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="eyebrow text-moss">Adaptive Recommendation</span>
              <span className="rounded-full bg-moss text-white px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider">
                🎯 Recommended Next
              </span>
            </div>
          </div>

          {recommendation.status === "RECOMMENDED" && recommendation.weakSkill && recommendation.recommendedStep ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                  {recommendation.weakSkill.skillName}
                </h4>
                <span className="rounded-lg border px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                  {recommendation.weakSkill.score}% · Level {recommendation.weakSkill.level} ({recommendation.weakSkill.label})
                </span>
              </div>

              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                ⚠️ {recommendation.weakSkill.reason}
              </p>

              <div className="rounded-xl bg-white/80 dark:bg-stone-900/60 p-3.5 border border-stone-200 dark:border-stone-800 space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary block">
                  Focus Roadmap Step {recommendation.recommendedStep.stepNumber}
                </span>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {recommendation.recommendedStep.title}
                </p>
              </div>
            </div>
          ) : recommendation.status === "ALL_COMPLETED" && recommendation.weakSkill ? (
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {recommendation.weakSkill.skillName}
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                ✅ All mapped learning steps completed for this weak skill. Take a reassessment checkpoint to re-verify your demonstrated score!
              </p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
                No recommendation yet
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Complete an assessment or generate your roadmap to receive a personalized learning recommendation tailored to your skill gap.
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {recommendation.status === "RECOMMENDED" && recommendation.recommendedStep ? (
              <Link
                href={`/roadmap#step-${recommendation.recommendedStep.stepNumber}`}
                className="btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>Continue Learning (Step {recommendation.recommendedStep.stepNumber})</span>
                <span>→</span>
              </Link>
            ) : recommendation.status === "ALL_COMPLETED" ? (
              <Link
                href="/assessments"
                className="btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>Reassess Skill →</span>
              </Link>
            ) : (
              <Link
                href="/assessments"
                className="btn-primary px-4 py-2 text-xs font-bold"
              >
                Take Assessment →
              </Link>
            )}
          </div>
        </article>

        {/* 3. NEEDS ATTENTION (Current Weak Skills) */}
        <article className="lg:col-span-6 dashboard-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3 dark:border-stone-800">
            <div>
              <span className="eyebrow text-amber-700 dark:text-amber-400">Skill Gap Priority</span>
              <h3 className="text-lg font-bold">Needs Attention</h3>
            </div>
            <Link href="/skill-gap" className="text-xs font-bold text-primary hover:underline">
              View All ({attentionSkills.length}) →
            </Link>
          </div>

          {attentionSkills.length > 0 ? (
            <div className="space-y-2.5">
              {attentionSkills.map((skill) => (
                <div
                  key={skill.skillId}
                  className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${
                    skill.isHighPriority
                      ? "border-rose-200 bg-rose-50/60 dark:border-rose-950/60 dark:bg-rose-950/20"
                      : "border-amber-200/80 bg-amber-50/40 dark:border-amber-950/60 dark:bg-amber-950/20"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                        {skill.skillName}
                      </span>
                      {skill.isHighPriority && (
                        <span className="rounded bg-rose-600 text-white px-1.5 py-0.5 text-[10px] font-extrabold uppercase shrink-0">
                          High Priority
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-stone-600 dark:text-stone-400 block">
                      Assessed: {skill.score}% · Level {skill.level} ({skill.label})
                    </span>
                  </div>

                  <Link
                    href="/skill-gap"
                    className="btn-secondary px-2.5 py-1 text-xs shrink-0 font-semibold"
                  >
                    Details →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200 space-y-1">
              <p className="font-bold text-sm flex items-center gap-1.5">
                <span>🎉</span> You're currently on track.
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                No assessed skills currently require attention below the proficiency threshold!
              </p>
            </div>
          )}
        </article>

        {/* 4. SKILLS IMPROVING (Authentic Assessment Trends) */}
        <article className="lg:col-span-6 dashboard-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3 dark:border-stone-800">
            <div>
              <span className="eyebrow text-moss">Demonstrated Growth</span>
              <h3 className="text-lg font-bold">Skills Improving</h3>
            </div>
            <Link href="/skill-gap" className="text-xs font-bold text-moss hover:underline">
              Journey Details →
            </Link>
          </div>

          {improvingSkills.length > 0 ? (
            <div className="space-y-2.5">
              {improvingSkills.map((skill) => (
                <div
                  key={skill.skillId}
                  className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-950/60 dark:bg-emerald-950/20 p-3 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {skill.skillName}
                    </span>
                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {skill.previousPercentage}% → <strong className="text-moss">{skill.latestPercentage}%</strong> ({skill.previousLevelLabel} → {skill.latestLevelLabel})
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 text-xs font-black shrink-0">
                    +{skill.scoreChange}%
                  </span>
                </div>
              ))}
            </div>
          ) : hasTakenAssessment ? (
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-900/30 p-4 space-y-1">
              <p className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                Your first assessment is recorded.
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Complete a later assessment checkpoint after completing roadmap learning steps to track skill improvement trends.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700 p-4 text-center">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                No improvement trends yet. Take your first assessment to establish a baseline.
              </p>
            </div>
          )}
        </article>

        {/* 5. LATEST ASSESSMENT SUMMARY */}
        <article className="lg:col-span-12 dashboard-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3 dark:border-stone-800">
            <div>
              <span className="eyebrow text-primary">Evidence Summary</span>
              <h3 className="text-lg font-bold">Latest Assessment</h3>
            </div>
            {latestAssessment && (
              <Link
                href={`/assessments/${latestAssessment.attemptId}`}
                className="btn-secondary px-3 py-1.5 text-xs font-bold shrink-0"
              >
                View Result Report →
              </Link>
            )}
          </div>

          {latestAssessment ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-center">
              <div className="space-y-1">
                <span className="text-xs text-stone-500 block">Assessment Title</span>
                <p className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {latestAssessment.title}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-stone-500 block">Overall Score</span>
                <p className="text-2xl font-black text-primary">
                  {latestAssessment.percentage}%
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-stone-500 block">Completed Date</span>
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  {formatDateShort(latestAssessment.completedAt)}
                </p>
              </div>

              <div className="space-y-1 text-right sm:text-left">
                <span className="text-xs text-stone-500 block">Skills Assessed</span>
                <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                  {latestAssessment.skillsCount} Technical Competencies
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700 p-6 text-center space-y-3">
              <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                No assessment completed yet.
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto">
                Take your first diagnostic assessment to establish your demonstrated skill baseline.
              </p>
              <Link
                href="/assessments"
                className="btn-primary inline-block px-4 py-2 text-xs font-bold"
              >
                Take First Assessment →
              </Link>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
