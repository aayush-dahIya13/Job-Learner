import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getStudentSkillGap } from "@/lib/student-skill-gap";
import { CareerGoalSelector } from "@/components/career-goal-selector";
import { StudentSkillsManager } from "@/components/student-skills-manager";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function SkillGapPage() {
  const id = await requireUserId();
  const gap = await getStudentSkillGap(id);

  return (
    <DashboardShell
      title="Skill Gap"
      description="Your readiness is calculated deterministically from role requirements, self-reported skills, and diagnostic assessment performance."
    >
      {!gap ? (
        <>
          <div className="status-empty mt-8">
            <b className="block text-ink">Start your skill-gap analysis</b>
            <p className="mt-2">Choose a target role and add your current skills to see a readiness score.</p>
          </div>
          <CareerGoalSelector />
          <StudentSkillsManager />
        </>
      ) : (
        <>
          {/* Top Banner for Assessment Engine */}
          <section className="dashboard-card dashboard-sage mt-6 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="eyebrow text-moss">Evidence Layer</span>
              <h2 className="text-xl font-bold">Diagnostic Skill Assessment</h2>
              <p className="text-sm text-stone-600 max-w-xl">
                {gap.hasTakenAssessment
                  ? "You have completed a diagnostic assessment. Review your objective demonstrated skills below."
                  : "Measure your actual technical knowledge with an objective diagnostic assessment to validate your self-reported skills."}
              </p>
            </div>
            <Link className="btn-primary px-5 py-2.5 text-sm" href="/assessments">
              {gap.hasTakenAssessment ? "Retake / View Assessment →" : "Take Diagnostic Assessment →"}
            </Link>
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Readiness", `${gap.readinessScore}%`],
              ["Required", gap.summary.totalRequiredSkills],
              ["Mastered", gap.summary.masteredSkills],
              ["Improving", gap.summary.needsImprovement],
              ["Missing", gap.summary.missingSkills],
            ].map(([label, value]) => (
              <article className="surface p-5" key={String(label)}>
                <p className="text-sm text-stone-600">{label}</p>
                <p className="mt-2 text-3xl font-bold text-moss">{value}</p>
              </article>
            ))}
          </section>

          <section className="surface mt-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Target role</p>
                <h2 className="mt-1 text-xl font-bold">{gap.jobRole.title}</h2>
              </div>
              <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-[#e5eee1]">
                <div className="h-full bg-brand" style={{ width: `${gap.readinessScore}%` }} />
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {gap.skills.map((skill) => (
                <article className="rounded-xl border border-stone-200 p-4 space-y-3" key={skill.skillId}>
                  <div className="flex items-start justify-between gap-3">
                    <b>{skill.skillName}</b>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        skill.status === "mastered"
                          ? "bg-green-100 text-moss"
                          : skill.status === "missing"
                          ? "bg-rose-100 text-[#914653]"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {skill.status === "needs_improvement" ? "Improving" : skill.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-stone-600">
                    <div className="flex justify-between">
                      <span>Self-reported: <strong>{skill.studentLevel}/5</strong></span>
                      <span>Required: <strong>{skill.requiredLevel}/5</strong></span>
                    </div>
                    {skill.demonstratedLevel !== null && (
                      <div className="flex justify-between font-medium text-primary">
                        <span>Demonstrated Score: <strong>{skill.demonstratedPercentage}%</strong></span>
                        <span>Level: <strong>{skill.demonstratedLabel} ({skill.demonstratedLevel}/5)</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full bg-brand"
                      style={{ width: `${Math.min(100, (skill.studentLevel / skill.requiredLevel) * 100)}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <CareerGoalSelector />
          <StudentSkillsManager />
        </>
      )}
    </DashboardShell>
  );
}
