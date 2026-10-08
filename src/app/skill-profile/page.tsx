import { requireUserId } from "@/lib/auth";
import { getVerifiedSkillProfile } from "@/lib/verified-skill-profile";
import { VerifiedSkillProfileView } from "@/components/verified-skill-profile-view";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CareerGoalSelector } from "@/components/career-goal-selector";
import { StudentSkillsManager } from "@/components/student-skills-manager";

export default async function SkillProfilePage() {
  const userId = await requireUserId();
  const profile = await getVerifiedSkillProfile(userId);

  return (
    <DashboardShell
      title="Verified Skill Profile / Skill Passport"
      description="Evidence-backed student skill capabilities aggregated from diagnostic baselines and milestone checkpoint assessments."
    >
      <div className="space-y-8">
        <VerifiedSkillProfileView profile={profile} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-stone-200 dark:border-stone-800">
          <CareerGoalSelector />
          <StudentSkillsManager />
        </div>
      </div>
    </DashboardShell>
  );
}
