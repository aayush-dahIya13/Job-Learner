import { requireUserId } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NeitherCanvasFrame } from "@/components/neither-canvas-frame";

export default async function CanvasPage() { const userId = await requireUserId(); return <DashboardShell title="Free Canvas" description="Neither Canvas, integrated for visual thinking, diagrams, and brainstorming."><NeitherCanvasFrame storageKey={`job-learner:canvas:${userId}`}/></DashboardShell>; }
