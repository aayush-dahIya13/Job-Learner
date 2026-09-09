import { requireAdmin } from "@/lib/auth";
import { AdminSkillManager } from "@/components/admin-skill-manager";
export default async function AdminSkillsPage() { await requireAdmin(); return <main className="min-h-screen bg-slate-100"><div className="container-page py-10"><a className="text-sm font-semibold text-blue-600" href="/admin">← Admin</a><h1 className="mt-4 text-3xl font-bold text-ink">Skills</h1><p className="mt-2 text-slate-600">Manage the skills students can assess.</p><div className="mt-7"><AdminSkillManager/></div></div></main>; }
