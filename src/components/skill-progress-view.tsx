"use client";

import type { SkillProgressHistory } from "@/lib/student-assessment";

import { formatDate } from "@/lib/date";

type SkillProgressViewProps = {
  history: SkillProgressHistory[];
};

export function SkillProgressView({ history }: SkillProgressViewProps) {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <section className="surface mt-6 p-5 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4 dark:border-stone-800">
        <div>
          <span className="eyebrow text-primary">Demonstrated Growth</span>
          <h2 className="mt-1 text-xl font-bold">Skill Progress History</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Historical progression measured across initial diagnostic baselines and milestone checkpoint assessments.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {history.map((item) => {
          const hasImprovement = item.improvementPercentage !== null && item.improvementPercentage !== 0;
          const isPositive = (item.improvementPercentage ?? 0) > 0;

          return (
            <article
              key={item.skillId}
              className="rounded-2xl border border-stone-200 p-5 space-y-4 bg-surface dark:border-stone-800"
            >
              {/* Top Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    {item.skillName}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    {item.selfReportedLevel && (
                      <span className="rounded bg-surface-muted px-2 py-0.5 font-medium">
                        Self-reported: {item.selfReportedLevel}/5
                      </span>
                    )}
                    {item.latestLevelLabel && (
                      <span className="rounded bg-primary/10 px-2 py-0.5 font-bold text-primary">
                        Level {item.latestDemonstratedLevel} ({item.latestLevelLabel})
                      </span>
                    )}
                  </div>
                </div>

                {hasImprovement && (
                  <div
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold ${
                      isPositive
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                    }`}
                  >
                    {isPositive ? `+${item.improvementPercentage}%` : `${item.improvementPercentage}%`}
                  </div>
                )}
              </div>

              {/* Score Trend Timeline */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Assessment Attempts Timeline
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {item.attempts.map((att, idx) => (
                    <div
                      key={att.attemptId}
                      className="flex items-center gap-2 rounded-xl border border-stone-200 bg-surface-muted px-3 py-2 text-xs dark:border-stone-800"
                    >
                      <div className="min-w-0">
                        <span className="block font-bold text-stone-900 dark:text-stone-100 truncate max-w-[140px]" title={att.assessmentTitle}>
                          {att.assessmentType === "diagnostic" ? "Diagnostic" : `Checkpoint ${idx}`}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {formatDate(att.completedAt)}
                        </span>
                      </div>
                      <span className="font-extrabold text-primary text-sm pl-1">
                        {att.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Bar comparing Diagnostic vs Latest */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400 font-medium">
                  <span>Diagnostic Baseline: {item.diagnosticPercentage ?? 0}%</span>
                  <span>Latest Score: {item.latestPercentage ?? 0}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800 relative">
                  {/* Diagnostic marker */}
                  {item.diagnosticPercentage !== null && (
                    <div
                      className="h-full bg-stone-300 dark:bg-stone-600 absolute left-0 top-0 rounded-full"
                      style={{ width: `${item.diagnosticPercentage}%` }}
                    />
                  )}
                  {/* Latest score marker */}
                  <div
                    className="h-full bg-primary relative rounded-full transition-all duration-500 opacity-90"
                    style={{ width: `${item.latestPercentage ?? 0}%` }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
