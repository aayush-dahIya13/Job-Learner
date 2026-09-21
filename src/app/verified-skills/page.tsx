import { requireUserId } from "@/lib/auth";
import { getVerifiedSkillProfile } from "@/lib/verified-skill-profile";
import { VerifiedSkillProfileView } from "@/components/verified-skill-profile-view";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CareerGoalSelector } from "@/components/career-goal-selector";
import { StudentSkillsManager } from "@/components/student-skills-manager";

export default async function VerifiedSkillsPage() {
  const userId = await requireUserId();
  const profile = await getVerifiedSkillProfile(userId);

  return (
    <DashboardShell
      title="Verified Skill Profile"
      description="Objective evidence of your technical capabilities aggregated from diagnostic baselines and milestone checkpoint assessments."
    >
      {!profile.targetJobRole ? (
        <div className="space-y-6">
          <div className="surface p-6 rounded-2xl text-center space-y-3">
            <h2 className="text-xl font-bold">Select a Target Job Role</h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm max-w-lg mx-auto">
              Choose your career goal to evaluate your demonstrated technical skills against real industry role requirements.
            </p>
          </div>
          <CareerGoalSelector />
          <StudentSkillsManager />
          <VerifiedSkillProfileView profile={profile} />
        </div>
      ) : (
        <div className="space-y-6">
          <VerifiedSkillProfileView profile={profile} />
          <CareerGoalSelector />
          <StudentSkillsManager />
        </div>
      )}
    </DashboardShell>
  );
}
