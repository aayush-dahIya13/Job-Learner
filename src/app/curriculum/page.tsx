import { requireUserId } from "@/lib/auth";
import { CurriculumViewer } from "@/components/curriculum-viewer";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function CurriculumPage() {
  await requireUserId();
  return <DashboardShell title="My Curriculum" description="Your college, branch, and registered course structure."><section className="surface mt-8 p-5 sm:p-6"><CurriculumViewer /></section></DashboardShell>;
}
