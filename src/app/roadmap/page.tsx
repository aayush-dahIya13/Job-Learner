import { requireUserId } from "@/lib/auth";
import { AiRoadmap } from "@/components/ai-roadmap";
import { DashboardShell } from "@/components/layout/dashboard-shell";
export default async function RoadmapPage() { await requireUserId(); return <DashboardShell title="Learning Roadmap" description="A saved, AI-generated sequence of learning suggestions — not a guaranteed timeline or outcome."><AiRoadmap/></DashboardShell>; }
