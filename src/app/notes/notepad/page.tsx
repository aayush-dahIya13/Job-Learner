import { requireUserId } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NotesNotebook } from "@/components/notes-notebook";

export default async function NotepadPage() { const userId = await requireUserId(); return <DashboardShell title="Notepad" description="A lightweight space for subjects, topics, revision notes, and ideas."><NotesNotebook storageKey={`job-learner:notes:${userId}`}/></DashboardShell>; }
