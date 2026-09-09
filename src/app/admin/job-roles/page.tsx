import { requireAdmin } from "@/lib/auth";
import { AdminJobRoleManager } from "@/components/admin-job-role-manager";
export default async function AdminJobRolesPage() { await requireAdmin(); return <main className="min-h-screen bg-slate-100"><div className="container-page py-10"><a className="text-sm font-semibold text-blue-600" href="/admin">← Admin</a><h1 className="mt-4 text-3xl font-bold text-ink">Job roles</h1><p className="mt-2 text-slate-600">Manage target roles and their required skills.</p><div className="mt-7"><AdminJobRoleManager/></div></div></main>; }
