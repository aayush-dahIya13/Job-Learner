"use client";

import Link from "next/link";
import type { SkillAssessmentResult } from "@/lib/student-assessment";

type AssessmentResultProps = {
  details: {
    attemptId: number;
    title: string;
    completedAt: Date | string | null;
    score: number | null;
    percentage: number | null;
    attemptNumber: number;
    skillResults: (SkillAssessmentResult & { selfReportedLevel: number | null })[];
  };
};

export function AssessmentResult({ details }: AssessmentResultProps) {
  const percentage = details.percentage ?? 0;

  const levelBadgeClass = (label: string) => {
    switch (label) {
      case "Strong":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      case "Proficient":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800";
      case "Developing":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
      default:
        return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <section className="dashboard-hero px-6 py-8 text-white sm:px-8 sm:py-10">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-white/70">
              Diagnostic Assessment Report
            </span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{details.title}</h1>
            <p className="mt-2 text-sm text-white/85">
              Attempt #{details.attemptNumber} · Completed on{" "}
              {details.completedAt ? new Date(details.completedAt).toLocaleDateString() : "Just now"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur">
            <span className="block text-xs font-bold uppercase tracking-wider text-white/80">
              Demonstrated Score
            </span>
            <strong className="mt-1 block text-5xl font-black text-white">{percentage}%</strong>
          </div>
        </div>
      </section>

      {/* Main Breakdown Section */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Skill Breakdown Table */}
        <article className="dashboard-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className="eyebrow">Objective Measurement</p>
              <h2 className="mt-1 text-xl font-bold">Skill Breakdown</h2>
            </div>
          </div>

          <div className="space-y-4">
            {details.skillResults.map((skill) => (
              <div
                key={skill.skillId}
                className="rounded-xl border border-stone-200 p-4 transition hover:border-stone-300 dark:border-stone-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base">{skill.skillName}</span>
                    <span
                      className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold ${levelBadgeClass(
                        skill.levelLabel
                      )}`}
                    >
                      {skill.levelLabel}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg">{skill.percentage}%</span>
                    <span className="block text-xs text-stone-500">
                      {skill.questionsCorrect}/{skill.questionsAttempted} Correct
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      skill.percentage >= 85
                        ? "bg-emerald-500"
                        : skill.percentage >= 70
                        ? "bg-blue-500"
                        : skill.percentage >= 40
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${skill.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Self-Reported vs Demonstrated Comparison */}
        <article className="dashboard-card p-6 space-y-5">
          <div>
            <p className="eyebrow">Comparison Analysis</p>
            <h2 className="mt-1 text-xl font-bold">Self-Reported vs. Demonstrated</h2>
            <p className="mt-2 text-sm text-stone-600">
              Comparing your saved self-ratings with your measured diagnostic assessment performance.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {details.skillResults.map((skill) => {
              const selfRating = skill.selfReportedLevel ? `${skill.selfReportedLevel}/5` : "Unrated";
              const demoRating = `Level ${skill.demonstratedLevel} (${skill.levelLabel})`;
              const isDiff = skill.selfReportedLevel && skill.selfReportedLevel > skill.demonstratedLevel + 1;

              return (
                <div
                  key={skill.skillId}
                  className={`rounded-xl border p-3.5 text-xs space-y-1.5 ${
                    isDiff
                      ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900"
                      : "border-stone-200 dark:border-stone-800"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span>{skill.skillName}</span>
                    {isDiff && <span className="text-amber-700 dark:text-amber-400">💡 Focus Area</span>}
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Self-reported: <strong className="text-stone-800 dark:text-stone-200">{selfRating}</strong></span>
                    <span>Demonstrated: <strong className="text-primary">{demoRating}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
            <Link className="btn-primary w-full text-center px-4 py-2.5 text-sm" href="/career-insights">
              View Updated AI Career Guidance →
            </Link>
            <Link className="btn-secondary w-full text-center px-4 py-2.5 text-sm" href="/skill-gap">
              Review Skill Gap Dashboard
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
