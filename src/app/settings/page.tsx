import { requireUserId } from "@/lib/auth";
import { getStudentProfileDetails } from "@/lib/student-profile";
import { StudentProfileSummary } from "@/components/student-profile-summary";
import { CareerGoalSelector } from "@/components/career-goal-selector";
import { StudentSkillsManager } from "@/components/student-skills-manager";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LogoutButton } from "@/components/logout-button";

export default async function SettingsPage() {
  const id = await requireUserId();
  const profile = await getStudentProfileDetails(id);

  return (
    <DashboardShell
      title="Student Profile & Settings"
      description="Manage your identity, academic context, career direction, and technical skills profile."
    >
      <div className="space-y-8 mt-6">
        {/* Profile Completeness, Career Vision, and Academic Info */}
        <StudentProfileSummary profile={profile} />

        {/* Target Job Role Selection for Skill Gap */}
        <CareerGoalSelector />

        {/* Skills & Demonstrated Evidence Manager */}
        <StudentSkillsManager />

        {/* Account Security & Logout Section */}
        <section className="surface p-6 border-l-4 border-rose-500 rounded-2xl">
          <p className="eyebrow text-rose-600">Account Security</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Log out of JOB-LEARNER</h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                End your authenticated session safely on this device.
              </p>
            </div>
            <LogoutButton />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
