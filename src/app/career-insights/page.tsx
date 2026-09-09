import { requireUserId } from "@/lib/auth";
import { AiCareerInsights } from "@/components/ai-career-insights";
import { DashboardShell } from "@/components/layout/dashboard-shell";
export default async function CareerInsightsPage() { await requireUserId(); return <DashboardShell title="Career Insights" description="AI-generated suggestions informed by your saved profile, curriculum and deterministic skill-gap results."><AiCareerInsights/></DashboardShell>; }
