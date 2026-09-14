"use client";

import { useEffect, useState } from "react";
import type { RoadmapPhase, RoadmapStep, VideoResource, ExtraResource } from "@/lib/ai/schemas";

type StoredRoadmap = {
  id?: number;
  readiness_score: number;
  generated_at: string;
  phases: RoadmapPhase[];
};

export function AiRoadmap() {
  const [data, setData] = useState<StoredRoadmap | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    // Load local step completion state if available
    try {
      const saved = localStorage.getItem("job_learner_completed_steps");
      if (saved) {
        setCompletedSteps(JSON.parse(saved));
      }
    } catch {
      // Ignore local storage parse errors
    }

    fetch("/api/ai/roadmap")
      .then(async (r) => {
        const x = await r.json();
        if (!r.ok) throw new Error(x.error);
        setData(x.roadmap);
      })
      .catch((e) => setMessage(e.message || "Unable to load roadmap."))
      .finally(() => setLoading(false));
  }, []);

  const toggleStepCompletion = (stepNumber: number) => {
    setCompletedSteps((prev) => {
      const next = prev.includes(stepNumber) ? prev.filter((id) => id !== stepNumber) : [...prev, stepNumber];
      try {
        localStorage.setItem("job_learner_completed_steps", JSON.stringify(next));
      } catch {
        // Ignore local storage errors
      }
      return next;
    });
  };

  async function generate() {
    setGenerating(true);
    setMessage("");
    try {
      const r = await fetch("/api/ai/roadmap", { method: "POST" });
      const x = await r.json();
      if (!r.ok) throw new Error(x.error);
      setData(x.roadmap);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to generate roadmap.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--jl-border)] bg-[var(--jl-surface)] p-8 text-center shadow-card">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--jl-primary)] border-t-transparent" />
        <p className="mt-3 text-sm text-[var(--jl-text-muted)]">Loading saved learning roadmap…</p>
      </div>
    );
  }

  const allSteps = data?.phases ? data.phases.flatMap((p) => p.steps || []) : [];
  const totalStepsCount = allSteps.length;
  const completedCount = allSteps.filter((s) => completedSteps.includes(s.stepNumber)).length;
  const progressPercent = totalStepsCount > 0 ? Math.round((completedCount / totalStepsCount) * 100) : 0;

  return (
    <section className="mt-6 space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--jl-text)]">Actionable Learning Roadmap</h2>
          <p className="mt-0.5 text-sm text-[var(--jl-text-muted)]">
            AI-sequenced path grounded in your deterministic skill gaps, curriculum, and target role.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary shrink-0 text-sm"
          onClick={generate}
          disabled={generating}
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating roadmap…
            </span>
          ) : data ? (
            "Regenerate roadmap"
          ) : (
            "Generate roadmap"
          )}
        </button>
      </div>

      {message && (
        <div className="status-error flex items-start gap-3 rounded-xl p-4 text-sm" role="alert">
          <span className="text-lg leading-none">⚠️</span>
          <p>{message}</p>
        </div>
      )}

      {/* Empty State */}
      {!data && !message && (
        <div className="status-empty rounded-2xl border border-dashed border-[var(--jl-border)] bg-[var(--jl-surface)] p-10 text-center shadow-card">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--jl-surface-muted)] text-2xl text-[var(--jl-primary)]">
            🗺️
          </div>
          <h3 className="text-lg font-bold text-[var(--jl-text)]">No Roadmap Generated Yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--jl-text-muted)]">
            Click &ldquo;Generate roadmap&rdquo; to build your step-by-step learning journey complete with curated videos, official documentation, and hands-on practice projects.
          </p>
          <button
            type="button"
            className="btn-primary mt-6 text-sm"
            onClick={generate}
            disabled={generating}
          >
            {generating ? "Generating…" : "Generate my learning roadmap"}
          </button>
        </div>
      )}

      {/* Roadmap Content */}
      {data && (
        <div className="space-y-8">
          {/* Progress Tracker Card */}
          <article className="rounded-2xl border border-[var(--jl-border)] bg-[var(--jl-surface)] p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--jl-surface-muted)] text-xl text-[var(--jl-primary)]">
                  🎯
                </span>
                <div>
                  <p className="eyebrow">Overall Roadmap Progress</p>
                  <p className="text-base font-bold text-[var(--jl-text)]">
                    {completedCount} of {totalStepsCount} steps completed ({progressPercent}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full border border-[var(--jl-border)] bg-[var(--jl-canvas-soft)] px-3 py-1 text-xs font-semibold text-[var(--jl-text-muted)]">
                  {data.phases.length} Phases
                </span>
                <span className="rounded-full border border-[var(--jl-border)] bg-[var(--jl-canvas-soft)] px-3 py-1 text-xs font-semibold text-[var(--jl-text-muted)]">
                  {totalStepsCount} Guided Steps
                </span>
                <span className="rounded-full bg-[var(--jl-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--jl-primary)]">
                  Readiness: {data.readiness_score}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[var(--jl-canvas-soft)]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: "var(--jl-primary)",
                }}
              />
            </div>
          </article>

          {/* Phases & Steps */}
          <div className="space-y-12">
            {data.phases.map((phase, phaseIndex) => (
              <section key={phase.phase} className="space-y-4">
                {/* Phase Header Banner */}
                <div className="rounded-2xl border border-[var(--jl-border)] bg-gradient-to-r from-[var(--jl-surface-muted)] to-[var(--jl-surface)] p-5 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-lg bg-[var(--jl-primary)] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[var(--jl-on-primary)]">
                      Phase {phase.phase} · {phase.difficulty}
                    </span>
                    <span className="text-xs font-semibold text-[var(--jl-text-muted)]">
                      {phase.steps?.length || 0} Steps in this phase
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-extrabold text-[var(--jl-text)] sm:text-2xl">
                    {phase.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--jl-text-muted)]">
                    <strong className="font-semibold text-[var(--jl-text)]">Phase Objective:</strong> {phase.objective}
                  </p>
                </div>

                {/* Steps List */}
                <div className="grid gap-5">
                  {(phase.steps || []).map((step) => {
                    const isCompleted = completedSteps.includes(step.stepNumber);
                    return (
                      <StepCard
                        key={step.stepNumber}
                        step={step}
                        isCompleted={isCompleted}
                        onToggleCompletion={() => toggleStepCompletion(step.stepNumber)}
                      />
                    );
                  })}
                </div>

                {/* Flow Connector Arrow */}
                {phaseIndex < data.phases.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="grid h-10 w-10 place-items-center rounded-full border border-[var(--jl-border)] bg-[var(--jl-surface)] text-lg text-[var(--jl-primary)] shadow-sm">
                      ↓
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function StepCard({
  step,
  isCompleted,
  onToggleCompletion,
}: {
  step: RoadmapStep;
  isCompleted: boolean;
  onToggleCompletion: () => void;
}) {
  const stepLabel = `STEP ${String(step.stepNumber).padStart(2, "0")}`;

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case "foundation":
      case "beginner":
        return "bg-[var(--jl-surface-muted)] text-[var(--jl-primary)] border-[var(--jl-border)]";
      case "intermediate":
        return "bg-[var(--jl-accent-soft)] text-[var(--jl-accent)] border-[var(--jl-border)]";
      case "advanced":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800";
      default:
        return "bg-[var(--jl-surface-muted)] text-[var(--jl-text-muted)] border-[var(--jl-border)]";
    }
  };

  return (
    <article
      className={`rounded-2xl border transition-all duration-200 shadow-card ${
        isCompleted
          ? "border-[var(--jl-primary)] bg-[var(--jl-surface)] opacity-95"
          : "border-[var(--jl-border)] bg-[var(--jl-surface)]"
      } p-5 sm:p-6`}
    >
      {/* Top Header: Step Number, Title, Level, Completion Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest text-[var(--jl-primary)]">
              {stepLabel}
            </span>
            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${getLevelBadgeClass(step.level)}`}>
              {step.level}
            </span>
            {isCompleted && (
              <span className="rounded-md bg-[var(--jl-surface-muted)] px-2 py-0.5 text-[11px] font-bold text-[var(--jl-success)]">
                ✓ Completed
              </span>
            )}
          </div>
          <h4 className="mt-1 text-lg font-bold text-[var(--jl-text)] sm:text-xl">
            {step.title}
          </h4>
        </div>

        <button
          type="button"
          onClick={onToggleCompletion}
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
            isCompleted
              ? "border-[var(--jl-primary)] bg-[var(--jl-primary)] text-[var(--jl-on-primary)] hover:opacity-90"
              : "border-[var(--jl-border)] bg-[var(--jl-canvas-soft)] text-[var(--jl-text)] hover:border-[var(--jl-primary)] hover:bg-[var(--jl-surface-muted)]"
          }`}
        >
          {isCompleted ? "✓ Completed" : "Mark as completed"}
        </button>
      </div>

      {/* Description & Skill Tags */}
      <div className="mt-3">
        <p className="text-sm leading-relaxed text-[var(--jl-text)]">{step.description}</p>
        {step.skills && step.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--jl-text-muted)]">Skills:</span>
            {step.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-[var(--jl-border)] bg-[var(--jl-canvas-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--jl-text)]"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Why This Step Callout */}
      <div className="mt-4 rounded-xl border border-[var(--jl-border)] bg-[var(--jl-canvas-soft)] p-3.5 sm:p-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--jl-primary)]">
          💡 Why This Step
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--jl-text-muted)] sm:text-sm">
          {step.whyThisStep}
        </p>
      </div>

      {/* Resource Sections Grid */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* Video Resources */}
        <div className="rounded-xl border border-[var(--jl-border)] bg-[var(--jl-surface-muted)] p-4">
          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--jl-text)]">
            <span>🎥</span>
            <span>Video Resources</span>
          </div>

          <div className="mt-3 space-y-2.5">
            {step.videos && step.videos.length > 0 ? (
              step.videos.map((video, vIdx) => (
                <VideoCard key={vIdx} video={video} />
              ))
            ) : (
              <p className="text-xs text-[var(--jl-text-muted)]">No video resources linked.</p>
            )}
          </div>
        </div>

        {/* Extra Documentation & Resources */}
        <div className="rounded-xl border border-[var(--jl-border)] bg-[var(--jl-surface-muted)] p-4">
          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--jl-text)]">
            <span>📚</span>
            <span>Extra Resources & Docs</span>
          </div>

          <div className="mt-3 space-y-2.5">
            {step.extraResources && step.extraResources.length > 0 ? (
              step.extraResources.map((res, eIdx) => (
                <ExtraResourceCard key={eIdx} resource={res} />
              ))
            ) : (
              <p className="text-xs text-[var(--jl-text-muted)]">No extra resources linked.</p>
            )}
          </div>
        </div>
      </div>

      {/* Practice / Project Section */}
      <div className="mt-4 rounded-xl border border-[var(--jl-border)] bg-[var(--jl-surface)] p-4">
        <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--jl-text)]">
          <span>🛠️</span>
          <span>Hands-On Practice</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--jl-text)] sm:text-sm">
          {step.practiceIdea}
        </p>

        {/* Prerequisites Footer */}
        <div className="mt-3 border-t border-[var(--jl-border)] pt-2.5 text-xs text-[var(--jl-text-muted)]">
          <strong className="font-semibold text-[var(--jl-text)]">Prerequisites:</strong>{" "}
          {step.prerequisites && step.prerequisites.length > 0
            ? step.prerequisites.join(" • ")
            : "None (Beginner ready)"}
        </div>
      </div>
    </article>
  );
}

function VideoCard({ video }: { video: VideoResource }) {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-lg border border-[var(--jl-border)] bg-[var(--jl-surface)] p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-[var(--jl-text)]" title={video.title}>
          {video.title}
        </p>
        <p className="text-[11px] text-[var(--jl-text-muted)]">{video.channel}</p>
      </div>
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-[var(--jl-border)] bg-[var(--jl-canvas-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--jl-text)] transition hover:border-[var(--jl-primary)] hover:bg-[var(--jl-surface-muted)]"
      >
        <span>Watch on YouTube</span>
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}

function ExtraResourceCard({ resource }: { resource: ExtraResource }) {
  return (
    <div className="flex flex-col justify-between gap-2 rounded-lg border border-[var(--jl-border)] bg-[var(--jl-surface)] p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-bold text-[var(--jl-text)]" title={resource.title}>
            {resource.title}
          </p>
          {resource.type && (
            <span className="rounded border border-[var(--jl-border)] bg-[var(--jl-canvas-soft)] px-1.5 py-0.2 text-[10px] uppercase text-[var(--jl-text-muted)]">
              {resource.type}
            </span>
          )}
        </div>
      </div>
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-[var(--jl-border)] bg-[var(--jl-canvas-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--jl-text)] transition hover:border-[var(--jl-primary)] hover:bg-[var(--jl-surface-muted)]"
      >
        <span>Open Doc</span>
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
