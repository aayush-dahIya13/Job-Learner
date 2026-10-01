"use client";

import Link from "next/link";
import { formatDate } from "@/lib/date";
import type { SkillAssessmentResult } from "@/lib/student-assessment";
import { findMatchingRoadmapSteps } from "@/lib/student-skill-gap";
import type { RoadmapPhase } from "@/lib/ai/schemas";

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
  roadmap?: {
    phases: RoadmapPhase[];
  } | null;
};

export function AssessmentResult({ details, roadmap }: AssessmentResultProps) {
  const percentage = details.percentage ?? 0;
  const weakSkills = details.skillResults.filter((s) => s.percentage < 70);

  // Identify the 2–3 weakest assessed skills using existing assessment results
  const sortedSkills = [...details.skillResults].sort(
    (a, b) => a.percentage - b.percentage || a.demonstratedLevel - b.demonstratedLevel
  );
  const topWeakest = sortedSkills.slice(0, 3);

  const levelBadgeClass = (label: string) => {
    switch (label) {
      case "Expert":
      case "Strong":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
      case "Advanced":
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
              Assessment Results Report
            </span>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{details.title}</h1>
            <p className="mt-2 text-sm text-white/85">
              Attempt #{details.attemptNumber} · Completed on{" "}
              {details.completedAt ? formatDate(details.completedAt) : "Just now"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur">
            <span className="block text-xs font-bold uppercase tracking-wider text-white/80">
              Overall Score
            </span>
            <strong className="mt-1 block text-5xl font-black text-white">{percentage}%</strong>
          </div>
        </div>
      </section>

      {/* WHAT TO WORK ON NEXT SECTION */}
      {topWeakest.length > 0 && (
        <section className="dashboard-card p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4 dark:border-stone-800">
            <div>
              <span className="eyebrow text-primary">Targeted Action Plan</span>
              <h2 className="mt-1 text-xl font-bold">What to Work on Next</h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Recommended learning actions based on your lowest demonstrated assessment scores.
              </p>
            </div>
            <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
              {topWeakest.length} Priority Area{topWeakest.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topWeakest.map((skill) => {
              const matchingSteps = findMatchingRoadmapSteps(skill.skillName, roadmap?.phases);
              return (
                <article
                  key={skill.skillId}
                  className="rounded-xl border border-stone-200 dark:border-stone-800 p-4 bg-surface space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 truncate" title={skill.skillName}>
                        {skill.skillName}
                      </h3>
                      <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-0.5 text-[11px] font-bold shrink-0">
                        Needs Improvement
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 pt-1">
                      <span>Demonstrated Score:</span>
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {skill.percentage}% · Level {skill.demonstratedLevel}/5 ({skill.levelLabel})
                      </span>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          skill.percentage >= 60 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${skill.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-stone-200/60 dark:border-stone-800 space-y-2">
                    {matchingSteps.length > 0 ? (
                      <>
                        <Link
                          href={`/roadmap#step-${matchingSteps[0].stepNumber}`}
                          className="btn-primary w-full text-center text-xs py-2 inline-flex items-center justify-center gap-1 font-bold"
                        >
                          <span>Start Learning (Step {matchingSteps[0].stepNumber})</span>
                          <span>→</span>
                        </Link>
                        {matchingSteps.length > 1 && (
                          <div className="flex flex-wrap gap-1 text-[11px] pt-0.5">
                            {matchingSteps.map((step) => (
                              <Link
                                key={step.stepNumber}
                                href={`/roadmap#step-${step.stepNumber}`}
                                className="rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-2 py-0.5 text-stone-700 dark:text-stone-300 hover:border-primary hover:text-primary transition"
                              >
                                Step {step.stepNumber}: {step.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs italic text-stone-500 dark:text-stone-400 text-center py-1">
                        No mapped learning step yet
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}


      {/* Main Breakdown Section */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Skill Breakdown Table */}
        <article className="dashboard-card p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
                      Level {skill.demonstratedLevel} · {skill.levelLabel}
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
                      skill.percentage >= 90
                        ? "bg-emerald-500"
                        : skill.percentage >= 75
                        ? "bg-blue-500"
                        : skill.percentage >= 60
                        ? "bg-teal-500"
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

          {/* Targeted Recommendations Callout */}
          {weakSkills.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-900 dark:text-amber-200">
                <span>💡</span>
                <span>Recommended Revision Topics</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Performance indicates room for improvement in the following areas:
              </p>
              <ul className="list-disc list-inside text-xs text-amber-800 dark:text-amber-300 font-medium space-y-1 pt-1">
                {weakSkills.map((s) => (
                  <li key={s.skillId}>
                    <strong>{s.skillName}</strong> ({s.percentage}% score) — revisit related concepts and practice exercises.
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 dark:text-emerald-200">
                <span>🎉</span>
                <span>Strong Mastery Demonstrated</span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Excellent work! You achieved passing proficiency across all tested skills for this assessment.
              </p>
            </div>
          )}
        </article>

        {/* Self-Reported vs Demonstrated Comparison & Next Steps */}
        <article className="dashboard-card p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <p className="eyebrow">Comparison Analysis</p>
              <h2 className="mt-1 text-xl font-bold">Self-Reported vs. Demonstrated</h2>
              <p className="mt-2 text-sm text-stone-600">
                Comparing your saved self-ratings with your measured assessment performance.
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
          </div>

          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
            <Link className="btn-primary w-full text-center px-4 py-2.5 text-sm" href="/roadmap">
              Continue Learning Roadmap →
            </Link>
            {weakSkills.length > 0 && (
              <Link className="btn-secondary w-full text-center px-4 py-2.5 text-sm" href="/roadmap">
                Review Recommended Topics
              </Link>
            )}
            <Link className="btn-secondary w-full text-center px-4 py-2.5 text-sm" href="/skill-gap">
              Review Skill Gap Dashboard
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
