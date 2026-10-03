import Link from "next/link";
import type { AdaptiveRecommendationResult } from "@/lib/roadmap-matching";

type AdaptiveRecommendationCardProps = {
  recommendation: AdaptiveRecommendationResult;
};

export function AdaptiveRecommendationCard({ recommendation }: AdaptiveRecommendationCardProps) {
  const { status, weakSkill, recommendedStep } = recommendation;

  if (status === "NO_WEAK_SKILL" || !weakSkill) {
    return null;
  }

  return (
    <section className="dashboard-card dashboard-pink mt-6 p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="eyebrow text-accent">Recommended Next</span>
          <span className="rounded-full bg-rose-600 text-white px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
            🎯 Adaptive Learning Action
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] items-center">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {weakSkill.skillName}
            </h3>
            <span className="rounded-lg border px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
              {weakSkill.score}% · Level {weakSkill.level} ({weakSkill.label})
            </span>
          </div>

          <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
            ⚠️ {weakSkill.reason}
          </p>

          {status === "RECOMMENDED" && recommendedStep && (
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-900 dark:text-stone-100">
              <span>📖 Focus Roadmap Step {recommendedStep.stepNumber}:</span>
              <span className="font-bold text-primary">{recommendedStep.title}</span>
            </div>
          )}

          {status === "ALL_COMPLETED" && (
            <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 pt-1">
              ✅ All mapped learning completed
            </p>
          )}

          {status === "NO_MAPPED_STEP" && (
            <p className="text-xs italic text-stone-500 dark:text-stone-400 pt-1">
              No mapped learning step yet.
            </p>
          )}
        </div>

        {status === "RECOMMENDED" && recommendedStep && (
          <Link
            href={`/roadmap#step-${recommendedStep.stepNumber}`}
            className="btn-primary px-5 py-2.5 text-sm shrink-0 inline-flex items-center gap-1.5 font-bold"
          >
            <span>Continue Learning (Step {recommendedStep.stepNumber})</span>
            <span>→</span>
          </Link>
        )}

        {status === "ALL_COMPLETED" && recommendedStep && (
          <Link
            href={`/roadmap#step-${recommendedStep.stepNumber}`}
            className="btn-secondary px-4 py-2 text-xs shrink-0 inline-flex items-center gap-1"
          >
            <span>Review Step {recommendedStep.stepNumber}</span>
            <span>→</span>
          </Link>
        )}
      </div>
    </section>
  );
}
