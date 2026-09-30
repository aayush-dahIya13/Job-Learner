import Link from "next/link";
import { formatDate } from "@/lib/date";
import type { LatestCompletedAssessment } from "@/lib/student-assessment";

type AssessmentEvidenceCardProps = {
  assessment: LatestCompletedAssessment | null;
};

export function AssessmentEvidenceCard({ assessment }: AssessmentEvidenceCardProps) {
  if (!assessment) {
    return (
      <section className="surface mt-8 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4 dark:border-stone-800">
          <div>
            <span className="eyebrow text-moss">Evidence Layer</span>
            <h2 className="mt-1 text-xl font-bold">Assessment Evidence</h2>
          </div>
          <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
            0 Completed Assessments
          </span>
        </div>

        <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/30">
          <p className="text-base font-bold text-stone-800 dark:text-stone-200">
            Take an assessment to build verified skill evidence.
          </p>
          <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto">
            Demonstrated proficiency is measured from objective test results and distinguished from self-reported ratings.
          </p>
          <Link className="btn-primary mt-4 inline-flex text-xs px-4 py-2" href="/assessments">
            Take Diagnostic Assessment →
          </Link>
        </div>
      </section>
    );
  }

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

  const formattedType = assessment.assessmentType
    ? assessment.assessmentType.charAt(0).toUpperCase() + assessment.assessmentType.slice(1)
    : "Diagnostic";

  return (
    <section className="surface mt-8 p-5 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4 dark:border-stone-800">
        <div>
          <span className="eyebrow text-moss">Evidence Layer</span>
          <h2 className="mt-1 text-xl font-bold">Assessment Evidence</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Objective test evidence from your latest completed assessment. Distinct from subjective self-reported skills.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            ✓ Verified Evidence
          </span>
          <Link
            href={`/assessments/${assessment.attemptId}`}
            className="text-xs font-semibold text-primary hover:underline"
          >
            View Full Report →
          </Link>
        </div>
      </div>

      {/* Latest Assessment Metadata Summary */}
      <div className="rounded-xl bg-stone-50 dark:bg-stone-900/40 p-4 border border-stone-200 dark:border-stone-800 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">Latest Assessment</span>
          <p className="font-bold text-stone-900 dark:text-stone-100 text-sm mt-0.5 truncate" title={assessment.title}>
            {assessment.title}
          </p>
          <span className="inline-block mt-1 text-[11px] font-semibold text-stone-600 dark:text-stone-400 bg-stone-200/70 dark:bg-stone-800 px-2 py-0.5 rounded">
            {formattedType} Assessment
          </span>
        </div>

        <div>
          <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">Completed On</span>
          <p className="font-bold text-stone-900 dark:text-stone-100 text-sm mt-0.5">
            {formatDate(assessment.completedAt)}
          </p>
          <span className="text-[11px] text-stone-500 block mt-1">
            Attempt #{assessment.attemptNumber}
          </span>
        </div>

        <div>
          <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">Overall Score</span>
          <p className="font-bold text-stone-900 dark:text-stone-100 text-xl mt-0.5 text-moss">
            {assessment.percentage}%
          </p>
          <span className="text-[11px] text-stone-500 block">
            {assessment.score} points earned
          </span>
        </div>

        <div>
          <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">Skills Assessed</span>
          <p className="font-bold text-stone-900 dark:text-stone-100 text-xl mt-0.5">
            {assessment.skillsCount}
          </p>
          <span className="text-[11px] text-stone-500 block">
            Technical {assessment.skillsCount === 1 ? "competency" : "competencies"}
          </span>
        </div>
      </div>

      {/* Distinction Banner / Note */}
      <div className="flex items-center justify-between gap-3 text-xs bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 p-3 rounded-xl text-emerald-900 dark:text-emerald-200">
        <div className="flex items-center gap-2">
          <span>🛡️</span>
          <span>
            <strong>Verified Assessment Data:</strong> The skills below reflect demonstrated test performance from objective scoring, not self-reported proficiency.
          </span>
        </div>
        <span className="shrink-0 font-medium text-[11px] text-emerald-700 dark:text-emerald-300 hidden sm:inline">
          Score-derived (Levels 1–5)
        </span>
      </div>

      {/* Compact List of Skills */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Demonstrated Skills from Latest Assessment
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assessment.skills.map((skill) => (
            <article
              key={skill.skillId}
              className="rounded-xl border border-stone-200 dark:border-stone-800 p-3.5 bg-surface transition hover:border-stone-300 dark:hover:border-stone-700 flex flex-col justify-between gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate" title={skill.skillName}>
                  {skill.skillName}
                </span>
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0">
                  {skill.percentage}%
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100 dark:border-stone-800/80">
                <span
                  className={`rounded-lg border px-2 py-0.5 text-[11px] font-bold ${levelBadgeClass(
                    skill.levelLabel
                  )}`}
                >
                  Level {skill.demonstratedLevel} · {skill.levelLabel}
                </span>
                <span className="text-[11px] text-stone-500">
                  {skill.questionsCorrect}/{skill.questionsAttempted} Qs
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
