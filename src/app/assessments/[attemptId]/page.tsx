import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAttemptDetails } from "@/lib/student-assessment";
import { latestRoadmap } from "@/lib/ai/store";
import { AssessmentResult } from "@/components/assessment-result";

export default async function AssessmentResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const userId = await requireUserId();
  const { attemptId: rawId } = await params;
  const attemptId = Number(rawId);

  if (!attemptId) notFound();

  const [details, roadmap] = await Promise.all([
    getAttemptDetails(userId, attemptId),
    latestRoadmap(userId),
  ]);

  if (!details) notFound();

  return (
    <DashboardShell title="Diagnostic Assessment Results" description="Detailed breakdown of demonstrated technical performance.">
      <AssessmentResult details={details} roadmap={roadmap} />
    </DashboardShell>
  );
}

