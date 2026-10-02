"use client";

import Link from "next/link";
import type { SkillProgressHistory } from "@/lib/student-assessment";
import { formatDate } from "@/lib/date";

type SkillProgressViewProps = {
  history: SkillProgressHistory[];
};

export function SkillProgressView({ history }: SkillProgressViewProps) {
  if (!history || history.length === 0) {
    return (
      <section className="surface mt-8 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4 dark:border-stone-800">
          <div>
            <span className="eyebrow text-moss">Demonstrated Growth</span>
            <h2 className="mt-1 text-xl font-bold">Skill Progress History</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Historical progression measured across initial diagnostic baselines and milestone checkpoint assessments.
            </p>
          </div>
          <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
            0 Assessed Skills
          </span>
        </div>

        <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/30">
          <p className="text-base font-bold text-stone-800 dark:text-stone-200">
            No assessment history recorded yet.
          </p>
          <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto">
            Complete diagnostic assessments or milestone checkpoints to track how your demonstrated proficiency evolves over time.
          </p>
          <Link className="btn-primary mt-4 inline-flex text-xs px-4 py-2" href="/assessments">
            Take Diagnostic Assessment →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="surface mt-8 p-5 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4 dark:border-stone-800">
        <div>
          <span className="eyebrow text-moss">Demonstrated Growth</span>
          <h2 className="mt-1 text-xl font-bold">Skill Progress History</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Historical progression measured across initial diagnostic baselines and milestone checkpoint assessments.
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          {history.length} Skill{history.length === 1 ? "" : "s"} Tracked
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {history.map((item) => {
          const isSingle = item.attempts.length <= 1;
          const improvement = item.improvementPercentage ?? 0;
          const isPositive = improvement > 0;
          const isNegative = improvement < 0;

          // Compute SVG sparkline trajectory coordinates for multiple attempts
          const attemptsCount = item.attempts.length;
          const sparkPoints = item.attempts.map((att, index) => {
            const x = attemptsCount === 1 ? 150 : 20 + (index / (attemptsCount - 1)) * 260;
            const y = 55 - (Math.max(0, Math.min(100, att.percentage)) / 100) * 45;
            return { x, y, att };
          });
          const svgPolyline = sparkPoints.map((p) => `${p.x},${p.y}`).join(" ");

          return (
            <article
              key={item.skillId}
              className="rounded-2xl border border-stone-200 p-5 space-y-5 bg-surface dark:border-stone-800 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                      {item.skillName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                      {item.selfReportedLevel && (
                        <span className="rounded bg-stone-100 dark:bg-stone-800 px-2 py-0.5 font-medium text-stone-600 dark:text-stone-400">
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

                  {/* Status Badge */}
                  {isSingle ? (
                    <span className="shrink-0 rounded-xl bg-stone-100 dark:bg-stone-800 px-3 py-1 text-xs font-bold text-stone-600 dark:text-stone-300">
                      First assessment
                    </span>
                  ) : isPositive ? (
                    <span className="shrink-0 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-3 py-1 text-xs font-bold flex items-center gap-1">
                      <span>📈</span> +{improvement}% Improvement
                    </span>
                  ) : isNegative ? (
                    <span className="shrink-0 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 px-3 py-1 text-xs font-bold flex items-center gap-1">
                      <span>📉</span> {improvement}% Decline
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-xl bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 px-3 py-1 text-xs font-bold">
                      0% Score Change
                    </span>
                  )}
                </div>

                {/* Score Summary Metrics */}
                <div className="flex items-center justify-between text-xs bg-stone-50 dark:bg-stone-900/40 p-3 rounded-xl border border-stone-100 dark:border-stone-800/80">
                  <div>
                    <span className="text-stone-500 block text-[11px]">First Score</span>
                    <strong className="text-stone-900 dark:text-stone-100 font-bold text-sm">
                      {item.diagnosticPercentage ?? item.attempts[0]?.percentage ?? 0}%
                    </strong>
                  </div>

                  <div className="text-center border-x border-stone-200 dark:border-stone-800 px-4">
                    <span className="text-stone-500 block text-[11px]">Total Attempts</span>
                    <strong className="text-stone-900 dark:text-stone-100 font-bold text-sm">
                      {item.attempts.length}
                    </strong>
                  </div>

                  <div className="text-right">
                    <span className="text-stone-500 block text-[11px]">Latest Score</span>
                    <strong className="text-moss font-extrabold text-sm">
                      {item.latestPercentage ?? 0}%
                    </strong>
                  </div>
                </div>

                {/* Line-Style Trajectory Chart */}
                {!isSingle && sparkPoints.length > 1 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                      Score Trajectory Line
                    </span>
                    <div className="relative rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/20 p-2">
                      <svg viewBox="0 0 300 65" className="w-full h-16 overflow-visible">
                        {/* Baseline Grid lines */}
                        <line x1="15" y1="10" x2="285" y2="10" stroke="currentColor" strokeDasharray="3 3" className="text-stone-200 dark:text-stone-800" />
                        <line x1="15" y1="32.5" x2="285" y2="32.5" stroke="currentColor" strokeDasharray="3 3" className="text-stone-200 dark:text-stone-800" />
                        <line x1="15" y1="55" x2="285" y2="55" stroke="currentColor" strokeDasharray="3 3" className="text-stone-200 dark:text-stone-800" />

                        {/* Trajectory Polyline */}
                        <polyline
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={svgPolyline}
                          className={isPositive ? "text-emerald-500" : isNegative ? "text-rose-500" : "text-primary"}
                        />

                        {/* Trajectory Data Point Nodes */}
                        {sparkPoints.map((pt, i) => (
                          <g key={pt.att.attemptId}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="4.5"
                              className={isPositive ? "fill-emerald-600" : isNegative ? "fill-rose-600" : "fill-primary"}
                            />
                            <text
                              x={pt.x}
                              y={pt.y < 20 ? pt.y + 14 : pt.y - 8}
                              textAnchor="middle"
                              className="text-[10px] font-bold fill-stone-700 dark:fill-stone-300"
                            >
                              {pt.att.percentage}%
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>
                )}

                {/* Chronological Attempts Timeline */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                    Assessment History Timeline (Chronological)
                  </span>
                  <div className="space-y-2">
                    {item.attempts.map((att, idx) => (
                      <div
                        key={att.attemptId}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 dark:border-stone-800 p-2.5 bg-stone-50/50 dark:bg-stone-900/30 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-bold flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="block font-bold text-stone-900 dark:text-stone-100 truncate" title={att.assessmentTitle}>
                              {att.assessmentTitle}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {formatDate(att.completedAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded-lg border px-2 py-0.5 text-[11px] font-bold border-stone-200 dark:border-stone-700 bg-surface">
                            Level {att.demonstratedLevel} · {att.levelLabel}
                          </span>
                          <span className="font-extrabold text-primary text-sm">
                            {att.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {isSingle && (
                <p className="text-[11px] italic text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
                  ℹ️ Baseline score established. Complete further checkpoint assessments to track demonstrated progress over time.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

