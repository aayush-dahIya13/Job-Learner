"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  VerifiedSkillProfile,
  VerifiedSkillItem,
  StudentDeclaredSkill,
  WeakSkillWithRoadmapStep,
  VerificationStatus,
} from "@/lib/verified-skill-profile";
import { formatDate } from "@/lib/date";

type FilterTab = "ALL" | "VERIFIED" | "DEVELOPING" | "NEEDS_IMPROVEMENT";

export function VerifiedSkillProfileView({ profile }: { profile: VerifiedSkillProfile }) {
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [expandedSkillIds, setExpandedSkillIds] = useState<Record<number, boolean>>({});

  const toggleEvidence = (skillId: number) => {
    setExpandedSkillIds((prev) => ({
      ...prev,
      [skillId]: !prev[skillId],
    }));
  };

  const verifiedList = profile.verifiedSkills || [];
  const declaredList = profile.declaredSkills || [];
  const strengthenList = profile.skillsToStrengthen || [];

  const filteredVerifiedSkills = verifiedList.filter((skill) => {
    if (filter === "VERIFIED") return skill.status === "VERIFIED";
    if (filter === "DEVELOPING") return skill.status === "DEVELOPING";
    if (filter === "NEEDS_IMPROVEMENT") return skill.status === "NEEDS_IMPROVEMENT";
    return true;
  });

  const verifiedCount = verifiedList.filter((s) => s.status === "VERIFIED").length;
  const developingCount = verifiedList.filter((s) => s.status === "DEVELOPING").length;
  const needsImprovementCount = verifiedList.filter((s) => s.status === "NEEDS_IMPROVEMENT").length;

  return (
    <div className="space-y-8">
      {/* 1. Header & Student Skill Passport Banner */}
      <section className="surface p-6 sm:p-8 rounded-2xl space-y-6 border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-stone-200 dark:border-stone-800 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="eyebrow text-primary">Skill Passport</span>
              {profile.curriculumContext && (
                <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-3 py-0.5 text-xs font-semibold text-stone-600 dark:text-stone-300">
                  {profile.curriculumContext.curriculumName} ({profile.curriculumContext.regulationVersion})
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
              Verified Skill Profile
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl">
              Evidence-backed skill capabilities based on empirical diagnostic baseline and checkpoint assessment results.
            </p>
          </div>

          {/* Target Job Role & Readiness Badge */}
          {profile.targetJobRole ? (
            <div className="shrink-0 flex items-center gap-5 bg-stone-50 dark:bg-stone-900/70 p-4 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="text-center">
                <span className="block text-2xl sm:text-3xl font-black text-primary">
                  {profile.readinessScore !== null ? `${profile.readinessScore}%` : "—"}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Role Readiness
                </span>
              </div>
              <div className="h-10 w-px bg-stone-200 dark:bg-stone-800" />
              <div>
                <span className="text-xs text-stone-500 block">Target Role</span>
                <span className="text-sm font-bold text-stone-900 dark:text-stone-100 block">
                  {profile.targetJobRole.title}
                </span>
                <Link href="/skill-gap" className="text-xs font-semibold text-primary hover:underline">
                  View Gap Analysis →
                </Link>
              </div>
            </div>
          ) : (
            <div className="shrink-0 bg-stone-50 dark:bg-stone-900/60 p-4 rounded-xl border border-stone-200 dark:border-stone-800 text-sm">
              <p className="font-semibold text-stone-700 dark:text-stone-300">No Target Role Selected</p>
              <Link href="/career-insights" className="text-xs font-bold text-primary hover:underline">
                Select Goal Role →
              </Link>
            </div>
          )}
        </div>

        {/* Student Profile Card Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-stone-500 uppercase font-semibold text-[10px] tracking-wider block">Student</span>
            <span className="font-bold text-stone-900 dark:text-stone-100 text-sm block mt-0.5">
              {profile.student.fullName || "Student User"}
            </span>
            <span className="text-stone-500 block">{profile.student.email}</span>
          </div>

          <div>
            <span className="text-stone-500 uppercase font-semibold text-[10px] tracking-wider block">Academic Institute</span>
            <span className="font-bold text-stone-900 dark:text-stone-100 text-sm block mt-0.5">
              {profile.student.collegeName || "Not specified"}
            </span>
            <span className="text-stone-500 block">
              {profile.student.branchName ? `${profile.student.branchName}` : ""}
              {profile.student.currentYear ? ` · Year ${profile.student.currentYear}` : ""}
            </span>
          </div>

          <div>
            <span className="text-stone-500 uppercase font-semibold text-[10px] tracking-wider block">Verification Coverage</span>
            <span className="font-bold text-primary text-sm block mt-0.5">
              {profile.verificationCoveragePercentage}% Coverage
            </span>
            <div className="h-2 w-full bg-stone-200 dark:bg-stone-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${profile.verificationCoveragePercentage}%` }}
              />
            </div>
          </div>

          <div>
            <span className="text-stone-500 uppercase font-semibold text-[10px] tracking-wider block">Assessments Completed</span>
            <span className="font-bold text-stone-900 dark:text-stone-100 text-sm block mt-0.5">
              {profile.totalAssessmentsCount} Attempt{profile.totalAssessmentsCount === 1 ? "" : "s"}
            </span>
            <span className="text-stone-500 block">
              {profile.verifiedSkillsCount} verified / {profile.totalSkillsCount} total skills
            </span>
          </div>
        </div>

        {/* 2. Core Architectural Principle Callout Banner */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-amber-900 dark:text-amber-300 block text-xs">
              Declared Skills vs. Demonstrated Evidence
            </span>
            <p className="text-stone-700 dark:text-stone-300">
              <strong className="text-stone-900 dark:text-stone-100">Declared skills</strong> describe what you state you know.{" "}
              <strong className="text-stone-900 dark:text-stone-100">Assessed skills</strong> reflect empirical evidence from JOB-LEARNER assessments.
            </p>
          </div>
          <Link
            href="/assessments"
            className="shrink-0 btn-primary px-3.5 py-1.5 text-xs font-semibold"
          >
            Take Assessment →
          </Link>
        </div>
      </section>

      {/* 3. Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="surface p-4 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {verifiedCount}
          </span>
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">Verified Skills (L3+)</span>
        </div>

        <div className="surface p-4 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="block text-2xl font-black text-blue-600 dark:text-blue-400">
            {developingCount}
          </span>
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">Developing Skills (L2)</span>
        </div>

        <div className="surface p-4 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="block text-2xl font-black text-amber-600 dark:text-amber-400">
            {needsImprovementCount}
          </span>
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">Needs Improvement (L1)</span>
        </div>

        <div className="surface p-4 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="block text-2xl font-black text-stone-500">
            {profile.unverifiedDeclaredSkillsCount}
          </span>
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">Unverified Declared</span>
        </div>
      </div>

      {/* 4. Verified Assessed Skills Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              Assessed Skills ({verifiedList.length})
            </h2>
            <p className="text-xs text-stone-500">
              Skills with empirical evaluation history and demonstrated proficiency scores.
            </p>
          </div>

          {/* Filter Tabs */}
          {verifiedList.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 dark:bg-stone-900 p-1 rounded-xl">
              {(
                [
                  ["ALL", `All (${verifiedList.length})`],
                  ["VERIFIED", `Verified (${verifiedCount})`],
                  ["DEVELOPING", `Developing (${developingCount})`],
                  ["NEEDS_IMPROVEMENT", `Improve (${needsImprovementCount})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    filter === key
                      ? "bg-white text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-100"
                      : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {verifiedList.length === 0 ? (
          <div className="surface p-8 text-center rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 font-bold text-lg">
              ?
            </div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100">No Assessed Skills Yet</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Complete your initial diagnostic baseline or checkpoint assessment to verify your technical capabilities.
            </p>
            <Link href="/assessments" className="inline-block btn-primary px-4 py-2 text-xs font-bold">
              Start Assessment →
            </Link>
          </div>
        ) : filteredVerifiedSkills.length === 0 ? (
          <div className="surface p-6 text-center rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
            No assessed skills match the selected filter tab ({filter}).
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVerifiedSkills.map((skill) => (
              <VerifiedSkillCard
                key={skill.skillId}
                skill={skill}
                isExpanded={Boolean(expandedSkillIds[skill.skillId])}
                onToggleEvidence={() => toggleEvidence(skill.skillId)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. Declared Skills Section (Unverified) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>Declared Skills</span>
            <span className="text-xs font-bold uppercase tracking-wider rounded-full bg-stone-100 text-stone-600 px-2.5 py-0.5 dark:bg-stone-800 dark:text-stone-400">
              Unverified ({declaredList.length})
            </span>
          </h2>
          <p className="text-xs text-stone-500">
            Self-reported skills added to your student profile that do not yet have completed assessment evidence.
          </p>
        </div>

        {declaredList.length === 0 ? (
          <div className="surface p-6 text-center rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
            All your declared skills have assessment evidence!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {declaredList.map((item) => (
              <DeclaredSkillCard key={item.skillId} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Skills to Strengthen Section (From Skill Gap) */}
      {strengthenList.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              Skills to Strengthen ({strengthenList.length})
            </h2>
            <p className="text-xs text-stone-500">
              Weak skills identified by your Skill Gap analysis that require targeted learning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {strengthenList.map((weak) => (
              <WeakSkillCard key={weak.skillId} weak={weak} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  if (status === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/50">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Verified (Level 3+)
      </span>
    );
  }
  if (status === "DEVELOPING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300/50">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Developing (Level 2)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/50">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Needs Improvement (Level 1)
    </span>
  );
}

function VerifiedSkillCard({
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
    <article className="surface p-5 rounded-2xl space-y-4 border border-stone-200 dark:border-stone-800 shadow-sm">
      {/* Header Row */}
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
            <p className="mt-0.5 text-xs text-stone-500">
              Last verified: {formatDate(skill.lastAssessedAt)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasImprovement && (
            <span
              className={`rounded-xl px-2.5 py-0.5 text-xs font-bold ${
                isPositiveImprovement
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
              }`}
            >
              {isPositiveImprovement ? `+${skill.improvementPercentage}%` : `${skill.improvementPercentage}%`}
            </span>
          )}
          <VerificationStatusBadge status={skill.status} />
        </div>
      </div>

      {/* Grid of Comparative Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50/70 dark:bg-stone-900/50 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800/80 text-xs">
        {/* Self Reported */}
        <div>
          <span className="block font-semibold uppercase tracking-wider text-stone-500 text-[10px]">
            Self-Reported
          </span>
          <span className="block font-bold text-stone-900 dark:text-stone-100 mt-0.5">
            {skill.selfReportedLevel ? `Level ${skill.selfReportedLevel} / 5` : "Not set"}
          </span>
          <span className="text-[10px] text-stone-400">Student estimate</span>
        </div>

        {/* Diagnostic Baseline */}
        <div>
          <span className="block font-semibold uppercase tracking-wider text-stone-500 text-[10px]">
            Diagnostic Baseline
          </span>
          <span className="block font-bold text-stone-900 dark:text-stone-100 mt-0.5">
            {skill.diagnosticScore !== null ? `${skill.diagnosticScore}%` : "None"}
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
          <span className="block font-extrabold text-primary text-sm mt-0.5">
            {skill.latestDemonstratedScore !== null ? `${skill.latestDemonstratedScore}%` : "—"}
          </span>
          <span className="text-[10px] text-stone-500 font-medium">
            {skill.demonstratedLevel
              ? `Level ${skill.demonstratedLevel} (${skill.demonstratedLabel})`
              : "Unverified"}
          </span>
        </div>

        {/* Target Required Level */}
        <div>
          <span className="block font-semibold uppercase tracking-wider text-stone-500 text-[10px]">
            Target Requirement
          </span>
          <span className="block font-bold text-stone-900 dark:text-stone-100 mt-0.5">
            {skill.requiredLevel ? `Level ${skill.requiredLevel} / 5` : "N/A"}
          </span>
          <span className="text-[10px] text-stone-400">
            {skill.requiredLevel ? "Job role benchmark" : "General skill"}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {skill.latestDemonstratedScore !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400 font-medium">
            <span>Demonstrated: {skill.latestDemonstratedScore}%</span>
            {skill.requiredLevel && <span>Target: Level {skill.requiredLevel} / 5</span>}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800 relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                skill.status === "VERIFIED"
                  ? "bg-emerald-500"
                  : skill.status === "DEVELOPING"
                  ? "bg-blue-500"
                  : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(5, skill.latestDemonstratedScore))}%` }}
            />
          </div>
        </div>
      )}

      {/* Reassessment Checkpoint Banner */}
      {skill.reassessment.isEligible && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-emerald-900 dark:text-emerald-300 block">
              Reassessment Checkpoint Ready!
            </span>
            <p className="text-emerald-800 dark:text-emerald-400 text-[11px]">
              {skill.reassessment.helperText || "You completed learning for this skill. Verify your progress now!"}
            </p>
          </div>
          <Link
            href={skill.reassessment.actionUrl || "/assessments"}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition"
          >
            Reassess Skill →
          </Link>
        </div>
      )}

      {/* Evidence History Expandable */}
      {skill.evidenceCount > 0 && (
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={onToggleEvidence}
            className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
          >
            <span>{isExpanded ? "Hide Evidence History" : `View Evidence History (${skill.evidenceCount})`}</span>
            <span className="text-stone-400">{isExpanded ? "▲" : "▼"}</span>
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Assessment Attempts ({skill.evidenceCount})
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
                      <span className="text-xs text-stone-600 dark:text-stone-400 font-medium">
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

function DeclaredSkillCard({ item }: { item: StudentDeclaredSkill }) {
  return (
    <div className="surface p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">{item.skillName}</h4>
          <span className="text-[10px] font-bold uppercase tracking-wider rounded bg-stone-100 text-stone-500 px-2 py-0.5 dark:bg-stone-800 dark:text-stone-400">
            Unverified
          </span>
        </div>
        {item.category && (
          <span className="text-[11px] text-stone-500 block">{item.category}</span>
        )}
      </div>

      <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
        <span className="text-stone-500">Self-reported: Level {item.proficiencyLevel}/5</span>
        <Link
          href="/assessments"
          className="text-xs font-bold text-primary hover:underline"
        >
          Verify Skill →
        </Link>
      </div>
    </div>
  );
}

function WeakSkillCard({ weak }: { weak: WeakSkillWithRoadmapStep }) {
  const hasSteps = weak.matchingSteps && weak.matchingSteps.length > 0;

  return (
    <div className="surface p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">{weak.skillName}</h4>
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            Score: {weak.score}% (Demonstrated Level {weak.level} - {weak.label})
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider rounded bg-amber-100 text-amber-800 px-2 py-0.5 dark:bg-amber-950/80 dark:text-amber-300">
          Weak Skill
        </span>
      </div>

      <div className="pt-2 border-t border-amber-200/40 dark:border-amber-900/30 text-xs">
        {hasSteps ? (
          <div className="space-y-1.5">
            <span className="font-semibold text-stone-700 dark:text-stone-300 text-[11px] block">
              Mapped Roadmap Step:
            </span>
            {weak.matchingSteps.map((step) => (
              <div key={step.stepNumber} className="flex items-center justify-between gap-2 bg-white/80 dark:bg-stone-900/80 p-2 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                <span className="font-medium text-stone-900 dark:text-stone-100 truncate">
                  Step {step.stepNumber}: {step.title}
                </span>
                <Link
                  href="/roadmap"
                  className="shrink-0 text-[11px] font-bold text-primary hover:underline"
                >
                  Start Learning →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-stone-500 text-[11px]">
            No roadmap step mapped to this skill yet.
          </p>
        )}
      </div>
    </div>
  );
}
