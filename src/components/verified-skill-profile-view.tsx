"use client";

import { useState } from "react";
import Link from "next/link";
import type { VerifiedSkillProfile, VerifiedSkillItem } from "@/lib/verified-skill-profile";
import { formatDate } from "@/lib/date";

type FilterTab = "ALL" | "VERIFIED" | "UNVERIFIED" | "MEETS_REQUIREMENT" | "BELOW_REQUIREMENT";

export function VerifiedSkillProfileView({ profile }: { profile: VerifiedSkillProfile }) {
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [expandedSkillId, setExpandedSkillId] = useState<number | null>(null);

  const filteredSkills = profile.skills.filter((skill) => {
    if (filter === "VERIFIED") return skill.status !== "UNVERIFIED";
    if (filter === "UNVERIFIED") return skill.status === "UNVERIFIED";
    if (filter === "MEETS_REQUIREMENT") return skill.status === "MEETS_REQUIREMENT";
    if (filter === "BELOW_REQUIREMENT") return skill.status === "BELOW_REQUIREMENT";
    return true;
  });

  const toggleEvidence = (skillId: number) => {
    setExpandedSkillId((current) => (current === skillId ? null : skillId));
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <section className="surface p-6 sm:p-8 rounded-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-200 pb-6 dark:border-stone-800">
          <div>
            <span className="eyebrow text-primary">Verified Skill Profile</span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {profile.targetJobRole ? profile.targetJobRole.title : "Career Skill Profile"}
            </h2>
            <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400 max-w-2xl">
              Demonstrated skill capabilities verified through empirical assessment evidence. Self-reported ratings are tracked separately and not treated as verified proficiency.
            </p>
          </div>

          {profile.targetJobRole && (
            <div className="shrink-0 flex items-center gap-4 bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="text-center">
                <span className="block text-2xl font-black text-primary">
                  {profile.overallAlignmentScore}%
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Goal Alignment
                </span>
              </div>
              <div className="h-9 w-px bg-stone-200 dark:bg-stone-800" />
              <div className="text-center">
                <span className="block text-2xl font-black text-stone-900 dark:text-stone-100">
                  {profile.verifiedSkillsCount} / {profile.totalSkills}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Skills Verified
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stat Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl border border-stone-200 p-3 bg-stone-50/50 dark:bg-stone-900/40 dark:border-stone-800">
            <span className="block text-xl font-bold text-stone-900 dark:text-stone-100">{profile.totalSkills}</span>
            <span className="text-xs text-stone-500">Total Skills</span>
          </div>
          <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3 dark:bg-emerald-950/20 dark:border-emerald-900/40">
            <span className="block text-xl font-bold text-emerald-700 dark:text-emerald-400">{profile.meetsRequirementCount}</span>
            <span className="text-xs text-emerald-800 dark:text-emerald-300">Meets Requirement</span>
          </div>
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 dark:bg-amber-950/20 dark:border-amber-900/40">
            <span className="block text-xl font-bold text-amber-700 dark:text-amber-400">{profile.belowRequirementCount}</span>
            <span className="text-xs text-amber-800 dark:text-amber-300">Below Requirement</span>
          </div>
          <div className="rounded-xl border border-stone-200 p-3 bg-stone-100/50 dark:bg-stone-800/40 dark:border-stone-700">
            <span className="block text-xl font-bold text-stone-600 dark:text-stone-400">{profile.unverifiedSkillsCount}</span>
            <span className="text-xs text-stone-500">Unverified</span>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
          <span className="text-xs font-semibold text-stone-500 mr-1">Filter:</span>
          {(
            [
              ["ALL", `All (${profile.totalSkills})`],
              ["VERIFIED", `Verified (${profile.verifiedSkillsCount})`],
              ["MEETS_REQUIREMENT", `Meets (${profile.meetsRequirementCount})`],
              ["BELOW_REQUIREMENT", `Below (${profile.belowRequirementCount})`],
              ["UNVERIFIED", `Unverified (${profile.unverifiedSkillsCount})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filter === key
                  ? "bg-primary text-white shadow-sm"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Skill Profile Cards */}
      <div className="space-y-4">
        {filteredSkills.length === 0 ? (
          <div className="surface p-8 text-center rounded-2xl space-y-3">
            <p className="text-stone-600 dark:text-stone-400 font-medium">
              No skills match the selected filter criteria.
            </p>
          </div>
        ) : (
          filteredSkills.map((skill) => (
            <SkillCard
              key={skill.skillId}
              skill={skill}
              isExpanded={expandedSkillId === skill.skillId}
              onToggleEvidence={() => toggleEvidence(skill.skillId)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: VerifiedSkillItem["status"] }) {
  if (status === "MEETS_REQUIREMENT") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/50">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Meets Requirement
      </span>
    );
  }
  if (status === "BELOW_REQUIREMENT") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/50">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Below Requirement
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-300/50 dark:border-stone-700">
      <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
      Unverified
    </span>
  );
}

function SkillCard({
  skill,
  isExpanded,
  onToggleEvidence,
}: {
  skill: VerifiedSkillItem;
  isExpanded: boolean;
  onToggleEvidence: () => void;
}) {
  const isPositiveImprovement = (skill.improvementPercentage ?? 0) > 0;
  const hasImprovement = skill.improvementPercentage !== null && skill.improvementPercentage !== 0;

  return (
    <article className="surface p-5 sm:p-6 rounded-2xl space-y-5 border border-stone-200 dark:border-stone-800">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">{skill.skillName}</h3>
            {skill.category && (
              <span className="rounded bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                {skill.category}
              </span>
            )}
          </div>
          {skill.lastAssessedAt && (
            <p className="mt-1 text-xs text-stone-500">
              Last verified: {formatDate(skill.lastAssessedAt)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasImprovement && (
            <span
              className={`rounded-xl px-2.5 py-1 text-xs font-bold ${
                isPositiveImprovement
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
              }`}
            >
              {isPositiveImprovement ? `+${skill.improvementPercentage}%` : `${skill.improvementPercentage}%`}
            </span>
          )}
          <StatusBadge status={skill.status} />
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50/60 p-4 rounded-xl dark:bg-stone-900/40 border border-stone-100 dark:border-stone-800/60 text-xs">
        {/* Self-Reported */}
        <div>
          <span className="block font-semibold uppercase tracking-wider text-stone-500 text-[10px]">
            Self-Reported
          </span>
          <span className="block font-bold text-stone-900 dark:text-stone-100 mt-1">
            {skill.selfReportedLevel ? `${skill.selfReportedLevel} / 5` : "Not set"}
          </span>
          <span className="text-[10px] text-stone-400">Self-estimate</span>
        </div>

        {/* Diagnostic Score */}
        <div>
          <span className="block font-semibold uppercase tracking-wider text-stone-500 text-[10px]">
            Diagnostic Baseline
          </span>
          <span className="block font-bold text-stone-900 dark:text-stone-100 mt-1">
            {skill.diagnosticScore !== null ? `${skill.diagnosticScore}%` : "Not taken"}
          </span>
          <span className="text-[10px] text-stone-400">
            {skill.diagnosticLevel ? `Level ${skill.diagnosticLevel} (${skill.diagnosticLabel})` : "No baseline"}
          </span>
        </div>

        {/* Latest Demonstrated */}
        <div>
          <span className="block font-semibold uppercase tracking-wider text-stone-500 text-[10px]">
            Demonstrated Score
          </span>
          <span className="block font-bold text-primary mt-1 text-sm">
            {skill.latestDemonstratedScore !== null ? `${skill.latestDemonstratedScore}%` : "Unverified"}
          </span>
          <span className="text-[10px] text-stone-500">
            {skill.demonstratedLevel
              ? `Level ${skill.demonstratedLevel} (${skill.demonstratedLabel})`
              : "No assessment"}
          </span>
        </div>

        {/* Required Level */}
        <div>
          <span className="block font-semibold uppercase tracking-wider text-stone-500 text-[10px]">
            Required Target Level
          </span>
          <span className="block font-bold text-stone-900 dark:text-stone-100 mt-1">
            {skill.requiredLevel ? `Level ${skill.requiredLevel} / 5` : "N/A"}
          </span>
          <span className="text-[10px] text-stone-400">
            {skill.requiredLevel ? `Target for role` : "Not in job role"}
          </span>
        </div>
      </div>

      {/* Visual Level & Score Progress Bar */}
      {skill.latestDemonstratedScore !== null ? (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400 font-medium">
            <span>Demonstrated: {skill.latestDemonstratedScore}%</span>
            {skill.requiredLevel && (
              <span>Required: Level {skill.requiredLevel} / 5</span>
            )}
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800 relative">
            {/* Diagnostic baseline bar segment */}
            {skill.diagnosticScore !== null && (
              <div
                className="h-full bg-stone-300 dark:bg-stone-600 absolute left-0 top-0 rounded-full"
                style={{ width: `${skill.diagnosticScore}%` }}
              />
            )}
            {/* Latest demonstrated bar segment */}
            <div
              className={`h-full relative rounded-full transition-all duration-500 ${
                skill.status === "MEETS_REQUIREMENT" ? "bg-emerald-600" : "bg-primary"
              }`}
              style={{ width: `${skill.latestDemonstratedScore}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 bg-amber-50/60 p-3 rounded-xl dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
            This skill has no verified assessment evidence yet. Self-reported score ({skill.selfReportedLevel ?? 0}/5) is unverified.
          </p>
          <Link
            href="/assessments"
            className="shrink-0 btn-primary px-3 py-1.5 text-xs font-semibold"
          >
            Take Assessment
          </Link>
        </div>
      )}

      {/* Evidence History Expandable Button & Drawer */}
      {skill.evidenceCount > 0 && (
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80">
          <button
            type="button"
            onClick={onToggleEvidence}
            className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
          >
            <span>{isExpanded ? "Hide Assessment Evidence" : `View Evidence History (${skill.evidenceCount})`}</span>
            <span className="text-stone-400">{isExpanded ? "▲" : "▼"}</span>
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Historical Assessment Records ({skill.evidenceCount})
              </span>
              <div className="space-y-2">
                {skill.evidenceHistory.map((evidence, idx) => (
                  <div
                    key={`${evidence.attemptId}-${idx}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs dark:border-stone-800 dark:bg-stone-900/60"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          {evidence.assessmentTitle}
                        </span>
                        <span className="rounded bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-300 capitalize">
                          {evidence.assessmentType}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-500 mt-0.5 block">
                        Completed on {formatDate(evidence.completedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-600 dark:text-stone-400">
                        Level {evidence.demonstratedLevel} ({evidence.levelLabel})
                      </span>
                      <span className="font-extrabold text-primary text-sm bg-primary/10 px-2.5 py-1 rounded-lg">
                        {evidence.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
