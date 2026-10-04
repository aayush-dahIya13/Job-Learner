"use client";

import { useState } from "react";
import Link from "next/link";
import type { SkillProgressHistory } from "@/lib/student-assessment";
import {
  buildSkillJourneySummary,
  type SkillJourneyFilter,
  type SkillJourneyItem,
} from "@/lib/skill-improvement-journey";
import { formatDate } from "@/lib/date";

type SkillProgressViewProps = {
  history: SkillProgressHistory[];
  roadmapPhases?: Array<{ phase?: number; steps?: Array<{ stepNumber: number; title: string; skills?: string[] }> }> | null;
  completedStepNumbers?: number[];
};

export function SkillProgressView({
  history,
  roadmapPhases,
  completedStepNumbers = [],
}: SkillProgressViewProps) {
  const summary = buildSkillJourneySummary({
    history,
    phases: roadmapPhases,
    completedStepNumbers,
  });

  const hasNeedsImprovement = summary.some(
    (item) => item.latestDemonstratedLevel !== null && item.latestDemonstratedLevel < 3
  );

  const [filter, setFilter] = useState<SkillJourneyFilter>(
    hasNeedsImprovement ? "needs_improvement" : "all"
  );

  if (!history || history.length === 0) {
    return (
      <section className="surface mt-8 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4 dark:border-stone-800">
          <div>
            <span className="eyebrow text-moss">Demonstrated Growth</span>
            <h2 className="mt-1 text-xl font-bold">Skill Improvement Journey</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Track how your demonstrated proficiency changes across assessments and learning milestones.
            </p>
          </div>
          <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
            0 Assessed Skills
          </span>
        </div>

        <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/30">
          <p className="text-base font-bold text-stone-800 dark:text-stone-200">
            Take an assessment to build verified skill evidence.
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

  // Filter skills based on user selection
  const filteredSkills = summary.filter((item) => {
    if (filter === "needs_improvement") {
      return item.latestDemonstratedLevel !== null && item.latestDemonstratedLevel < 3;
    }
    if (filter === "improving") {
      return item.isPositiveChange;
    }
    if (filter === "proficient") {
      return item.latestDemonstratedLevel !== null && item.latestDemonstratedLevel >= 3;
    }
    return true;
  });

  const displayList = filteredSkills.length > 0 ? filteredSkills : summary;

  return (
    <section className="surface mt-8 p-5 sm:p-6 space-y-6">
      {/* Header & Supporting Text */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4 dark:border-stone-800">
        <div>
          <span className="eyebrow text-moss">Demonstrated Growth</span>
          <h2 className="mt-1 text-xl font-bold">Skill Improvement Journey</h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Track how your demonstrated proficiency changes across assessments and learning milestones.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 dark:bg-stone-900 p-1 rounded-xl border border-stone-200 dark:border-stone-800">
          {[
            { id: "all", label: `All (${summary.length})` },
            {
              id: "needs_improvement",
              label: `Needs Improvement (${summary.filter((s) => (s.latestDemonstratedLevel ?? 0) < 3).length})`,
            },
            {
              id: "improving",
              label: `Improving (${summary.filter((s) => s.isPositiveChange).length})`,
            },
            {
              id: "proficient",
              label: `Proficient+ (${summary.filter((s) => (s.latestDemonstratedLevel ?? 0) >= 3).length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as SkillJourneyFilter)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                filter === tab.id
                  ? "bg-surface text-primary shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Skill Improvement Journey Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {displayList.map((item) => renderSkillJourneyCard(item))}
      </div>
    </section>
  );
}

function renderSkillJourneyCard(item: SkillJourneyItem) {
  const isSingle = item.isSingleAssessment;
  const change = item.scoreChange ?? 0;
  const isPositive = item.isPositiveChange;
  const isNegative = item.isNegativeChange;

  // Compute SVG sparkline trajectory coordinates
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
      className="rounded-2xl border border-stone-200 p-5 space-y-5 bg-surface dark:border-stone-800 flex flex-col justify-between shadow-xs"
    >
      <div className="space-y-4">
        {/* Header Title & Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
              {item.skillName}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              {item.selfReportedLevel && (
                <span className="rounded bg-stone-100 dark:bg-stone-800 px-2 py-0.5 font-medium text-stone-600 dark:text-stone-400">
                  Self-reported: {item.selfReportedLevel}/5
                </span>
              )}
              {item.latestLevelLabel && (
                <span className="rounded bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
                  {item.latestPercentage}% · Level {item.latestDemonstratedLevel} ({item.latestLevelLabel})
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
              <span>📈</span> +{change}% Improvement
            </span>
          ) : isNegative ? (
            <span className="shrink-0 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 px-3 py-1 text-xs font-bold flex items-center gap-1" title="Score decreased since previous assessment">
              <span>📉</span> {change}% Change
            </span>
          ) : (
            <span className="shrink-0 rounded-xl bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 px-3 py-1 text-xs font-bold">
              0% Score Change
            </span>
          )}
        </div>

        {/* Current Skill State Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-stone-50 dark:bg-stone-900/40 p-3 rounded-xl border border-stone-100 dark:border-stone-800/80">
          <div>
            <span className="text-stone-500 block text-[11px]">Latest Score</span>
            <strong className="text-moss font-extrabold text-sm">
              {item.latestPercentage ?? 0}%
            </strong>
          </div>

          <div>
            <span className="text-stone-500 block text-[11px]">Previous Score</span>
            <strong className="text-stone-800 dark:text-stone-200 font-bold text-sm">
              {item.previousPercentage !== null ? `${item.previousPercentage}%` : "Baseline"}
            </strong>
          </div>

          <div>
            <span className="text-stone-500 block text-[11px]">Change</span>
            <strong
              className={`font-bold text-sm ${
                isPositive ? "text-emerald-600" : isNegative ? "text-amber-700 dark:text-amber-300" : "text-stone-700"
              }`}
            >
              {isSingle ? "First assessment" : change > 0 ? `+${change}%` : `${change}%`}
            </strong>
          </div>

          <div>
            <span className="text-stone-500 block text-[11px]">Assessments</span>
            <strong className="text-stone-900 dark:text-stone-100 font-bold text-sm">
              {item.attempts.length}
            </strong>
          </div>
        </div>

        {/* Negative score change helper notice */}
        {isNegative && (
          <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-900/60 font-medium">
            ℹ️ Score decreased since previous assessment. Take a refresher learning step before retaking.
          </p>
        )}

        {/* Learning Completed summary badge */}
        {item.completedLearningSteps.length > 0 && (
          <div className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 pt-0.5">
            <span>📖 Learning completed:</span>
            <span className="font-bold text-primary">
              {item.completedLearningSteps.length} step{item.completedLearningSteps.length === 1 ? "" : "s"}
            </span>
          </div>
        )}

        {/* Line Chart Sparkline for 2+ assessments */}
        {!isSingle && sparkPoints.length > 1 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
              Demonstrated Score Trajectory
            </span>
            <div className="relative rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/20 p-2">
              <svg viewBox="0 0 300 65" className="w-full h-16 overflow-visible">
                <line x1="15" y1="10" x2="285" y2="10" stroke="currentColor" strokeDasharray="3 3" className="text-stone-200 dark:text-stone-800" />
                <line x1="15" y1="32.5" x2="285" y2="32.5" stroke="currentColor" strokeDasharray="3 3" className="text-stone-200 dark:text-stone-800" />
                <line x1="15" y1="55" x2="285" y2="55" stroke="currentColor" strokeDasharray="3 3" className="text-stone-200 dark:text-stone-800" />

                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={svgPolyline}
                  className={isPositive ? "text-emerald-500" : isNegative ? "text-amber-500" : "text-primary"}
                />

                {sparkPoints.map((pt) => (
                  <g key={pt.att.attemptId}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      className={isPositive ? "fill-emerald-600" : isNegative ? "fill-amber-600" : "fill-primary"}
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

        {/* Timeline Walkthrough: Assessment History + Learning Context */}
        <div className="space-y-2 pt-1 border-t border-stone-200/60 dark:border-stone-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
            Journey Timeline & Learning Context
          </span>
          <div className="space-y-2">
            {item.timelineEvents.map((event, idx) => {
              if (event.type === "learning_completed" && event.step) {
                return (
                  <div
                    key={`learning-${event.step.stepNumber}-${idx}`}
                    className="rounded-xl border border-moss/30 bg-moss/5 p-2.5 text-xs text-moss flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📖</span>
                      <div>
                        <span className="font-bold block">
                          Completed Step {event.step.stepNumber}: {event.step.title}
                        </span>
                        <span className="text-[11px] opacity-90">{event.note}</span>
                      </div>
                    </div>
                    <Link
                      href={`/roadmap#step-${event.step.stepNumber}`}
                      className="text-[11px] font-bold underline shrink-0 hover:opacity-80"
                    >
                      View Step →
                    </Link>
                  </div>
                );
              }

              if (event.type === "assessment" && event.attempt) {
                const att = event.attempt;
                return (
                  <div
                    key={`attempt-${att.attemptId}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 dark:border-stone-800 p-2.5 bg-stone-50/50 dark:bg-stone-900/30 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-bold flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0">
                        📋
                      </span>
                      <div className="min-w-0">
                        <span className="block font-bold text-stone-900 dark:text-stone-100 truncate" title={att.assessmentTitle}>
                          {att.assessmentTitle}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {formatDate(att.completedAt)} · {event.note}
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
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>

      {isSingle && (
        <p className="text-[11px] italic text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
          ℹ️ First assessment baseline established. Complete learning steps and checkpoint assessments to build your trajectory.
        </p>
      )}
    </article>
  );
}
