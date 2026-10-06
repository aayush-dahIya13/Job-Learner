import Link from "next/link";
import type { StudentProfileDetails } from "@/lib/student-profile";
import { ProfileEditor } from "@/components/profile-editor";

type StudentProfileSummaryProps = {
  profile: StudentProfileDetails;
};

export function StudentProfileSummary({ profile }: StudentProfileSummaryProps) {
  const {
    fullName,
    email,
    contactNumber,
    collegeId,
    collegeName,
    branchId,
    branchName,
    currentYear,
    careerGoal,
    targetRole,
    completeness,
  } = profile;

  return (
    <div className="space-y-6">
      {/* Profile Completeness Banner Card */}
      <section className="dashboard-card p-5 sm:p-6 space-y-4" aria-labelledby="completeness-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-3 dark:border-stone-800">
          <div>
            <span className="eyebrow text-moss">Profile Strength</span>
            <h2 id="completeness-heading" className="text-xl font-bold mt-0.5">
              Profile Completeness
            </h2>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {completeness.completedCount} of {completeness.totalFields} complete ({completeness.percentage}%)
          </span>
        </div>

        <div className="space-y-2">
          <div
            className="h-3 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            role="progressbar"
            aria-valuenow={completeness.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Profile completeness: ${completeness.percentage}% (${completeness.completedCount} of ${completeness.totalFields} fields)`}
          >
            <div
              className="h-full rounded-full bg-moss transition-all duration-500"
              style={{ width: `${completeness.percentage}%` }}
            />
          </div>

          {!completeness.isComplete ? (
            <div className="text-xs text-stone-600 dark:text-stone-400 pt-1 flex flex-wrap items-center gap-1.5 font-medium">
              <span className="text-amber-800 dark:text-amber-300 font-bold">⚠️ Incomplete:</span>
              <span>Missing information for:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {completeness.missingFields.join(", ")}
              </span>
            </div>
          ) : (
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 pt-1 flex items-center gap-1">
              <span>🎉</span> Your student profile is 100% complete and fully optimized for career guidance!
            </p>
          )}
        </div>
      </section>

      {/* Prominent Career Goal & Vision Section */}
      <section className="grid gap-5 md:grid-cols-2">
        <article className="dashboard-card dashboard-sage p-5 sm:p-6 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="eyebrow text-moss">Industry Direction</span>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Target Career Role
            </h3>

            {targetRole ? (
              <div className="pt-1 space-y-1">
                <p className="text-xl font-black text-moss flex items-center gap-2">
                  <span>🎯</span> {targetRole.title}
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Target job role selected for deterministic skill-gap and learning roadmap analysis.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700 p-4 space-y-1">
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  No target role selected yet
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Choose a target career role to calculate your skill gap and generate your roadmap.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800">
            <Link
              href="/skill-gap"
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>{targetRole ? "Review Role Skill Gap" : "Select Target Role"}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>

        <article className="dashboard-card dashboard-pink p-5 sm:p-6 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="eyebrow text-moss">Student Vision</span>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Personal Career Vision
            </h3>

            {careerGoal && careerGoal.trim() ? (
              <p className="text-sm leading-relaxed text-stone-800 dark:text-stone-200 font-medium italic bg-white/70 dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200/80 dark:border-stone-800">
                "{careerGoal}"
              </p>
            ) : (
              <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700 p-4 space-y-1">
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  No career vision stated yet
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Add your career vision statement in your profile settings.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800">
            <span className="text-xs text-stone-500">
              Used to contextualize your personalized career guidance.
            </span>
          </div>
        </article>
      </section>

      {/* Main Personal & Academic Profile Overview */}
      <section className="surface p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4 dark:border-stone-800">
          <div>
            <span className="eyebrow">Personal & Academic Profile</span>
            <h2 className="mt-1 text-xl font-bold">Student Information</h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Your identity, contact info, and academic institution details.
            </p>
          </div>

          <ProfileEditor
            profile={{
              fullName,
              contactNumber,
              collegeId,
              branchId,
              currentYear,
              careerGoal,
            }}
          />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div className="surface p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800">
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Full Name</dt>
            <dd className="mt-1 font-bold text-stone-900 dark:text-stone-100">{fullName || "Not specified"}</dd>
          </div>

          <div className="surface p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800">
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Email Address</dt>
            <dd className="mt-1 font-semibold text-stone-800 dark:text-stone-200">{email || "Not specified"}</dd>
          </div>

          <div className="surface p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800">
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Contact Number</dt>
            <dd className="mt-1 font-semibold text-stone-800 dark:text-stone-200">{contactNumber || "Not specified"}</dd>
          </div>

          <div className="surface p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800">
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">College / Institute</dt>
            <dd className="mt-1 font-bold text-stone-900 dark:text-stone-100">{collegeName}</dd>
          </div>

          <div className="surface p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800">
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Branch / Specialization</dt>
            <dd className="mt-1 font-bold text-stone-900 dark:text-stone-100">{branchName}</dd>
          </div>

          <div className="surface p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800">
            <dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Academic Year</dt>
            <dd className="mt-1 font-bold text-stone-900 dark:text-stone-100">Year {currentYear}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
