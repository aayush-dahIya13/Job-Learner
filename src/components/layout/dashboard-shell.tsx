"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand-logo";

const items = [
  ["Dashboard", "/dashboard", "⌂"], ["Curriculum", "/curriculum", "▤"], ["Skill Gap", "/skill-gap", "▥"],
  ["Career Insights", "/career-insights", "♧"], ["Roadmap", "/roadmap", "⌑"], ["Notes", "/notes", "✎"], ["Settings", "/settings", "⚙"],
] as const;
const sidebarStorageKey = "job-learner:sidebar-collapsed";

function NavLinks({ path, collapsed = false, onNavigate }: { path:string; collapsed?:boolean; onNavigate?:()=>void }) {
  return <nav className="mt-7 space-y-1" aria-label="Student navigation">{items.map(([label, href, icon]) => <Link key={href} href={href} onClick={onNavigate} title={collapsed ? label : undefined} aria-current={path === href ? "page" : undefined} className="dashboard-nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-lotus"><span className="sidebar-icon" aria-hidden>{icon}</span><span className="sidebar-label">{label}</span></Link>)}</nav>;
}

function Brand({ compact = false }: { compact?: boolean }) { return <BrandLogo href="/dashboard" compact={compact} className="sidebar-brand" />; }

export function DashboardShell({ title, description, children, hidePageIntro = false }: { title?:string; description?:string; children:ReactNode; hidePageIntro?:boolean }) {
  const path = usePathname(); const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { setCollapsed(localStorage.getItem(sidebarStorageKey) === "true"); }, []);
  useEffect(() => { setMobileOpen(false); }, [path]);
  function toggleSidebar() { setCollapsed(current => { const next = !current; localStorage.setItem(sidebarStorageKey, String(next)); return next; }); }
  return <main className="dashboard-canvas"><div className="dashboard-layout">
    <aside className="dashboard-sidebar hidden shrink-0 border-r p-5 lg:block" data-collapsed={collapsed}>
      <div className="sidebar-collapse-row"><button type="button" className="sidebar-control" onClick={toggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}><span aria-hidden>{collapsed ? "›" : "‹"}</span></button></div>
      <Brand compact={collapsed}/>
      <div className="sidebar-theme-row"><ThemeToggle compact={collapsed}/></div>
      <div className="sidebar-divider" />
      <NavLinks path={path} collapsed={collapsed}/>
    </aside>
    {mobileOpen && <button type="button" className="mobile-drawer-backdrop" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)}/>} 
    <aside className="mobile-drawer lg:hidden" data-open={mobileOpen} aria-label="Mobile navigation"><div className="flex items-center justify-between gap-3"><Brand/><button type="button" className="sidebar-control" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)}>×</button></div><div className="mt-5"><ThemeToggle/></div><div className="sidebar-divider" /><NavLinks path={path} onNavigate={() => setMobileOpen(false)}/></aside>
    <section className="min-w-0 flex-1"><header className="sticky top-0 z-30 border-b border-stone-200 bg-cream/90 px-4 py-3 backdrop-blur lg:hidden"><div className="flex items-center justify-between gap-2"><button type="button" className="sidebar-control" aria-label="Open navigation menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>☰</button><BrandLogo href="/dashboard" showTagline={false} className="mobile-header-brand"/><ThemeToggle compact/></div></header><div className="container-page py-6 sm:py-10">{!hidePageIntro && <><p className="eyebrow">Student workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>{description && <p className="mt-3 max-w-2xl text-stone-600">{description}</p>}</>}{children}</div></section>
  </div></main>;
}
