"use client";

import { useEffect, useState } from "react";

type Data = {
  college: { id: number; name: string } | null;
  branch: { id: number; name: string; code: string | null } | null;
  curriculum: null | { name: string; regulationVersion: string; academicYear: string | null; description: string | null; sourceName: string | null; sourceUrl: string | null; verificationStatus: "verified" | "demo" | "unverified" };
  semesters: { semesterNumber: number; subjects: { id: number; code: string; name: string; credits: number; description: string | null }[] }[];
  availability: "available" | "missing_profile" | "missing_college" | "missing_branch" | "branch_unavailable" | "no_curriculum";
};

const emptyMessages: Record<Exclude<Data["availability"], "available">, { title: string; body: string }> = {
  missing_profile: { title: "Student profile unavailable", body: "Your academic profile is not available yet. Please update your profile and try again." },
  missing_college: { title: "College not selected", body: "Add your college in Settings to view your curriculum." },
  missing_branch: { title: "Branch not selected", body: "Add your branch in Settings to view your curriculum." },
  branch_unavailable: { title: "College and branch need attention", body: "Your selected branch is not currently associated with your college. Please update your profile." },
  no_curriculum: { title: "No curriculum published yet", body: "No curriculum is currently available for your college and branch." },
};

export function CurriculumViewer() {
  const [data, setData] = useState<Data | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [error, setError] = useState("");
  const load = () => {
    setError("");
    fetch("/api/curriculum").then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not load curriculum.");
      setData(payload); setActive(payload.semesters?.[0]?.semesterNumber ?? null);
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load curriculum."));
  };
  useEffect(load, []);

  if (error) return <div className="status-error mt-4" role="alert"><b>Curriculum unavailable</b><p className="mt-1">{error}</p><button className="mt-3 font-semibold underline" onClick={load}>Try again</button></div>;
  if (!data) return <div className="mt-4 animate-pulse rounded-xl p-5 text-sm" style={{ background: "var(--jl-canvas-soft)", color: "var(--jl-text-muted)" }}>Loading your curriculum…</div>;
  if (data.availability !== "available" || !data.curriculum) {
    const message = emptyMessages[data.availability === "available" ? "no_curriculum" : data.availability];
    return <div className="status-empty mt-4"><b className="block" style={{ color: "var(--jl-text)" }}>{message.title}</b><p className="mt-2 text-sm">{message.body}</p></div>;
  }

  const semester = data.semesters.find((item) => item.semesterNumber === active);
  const curriculum = data.curriculum, isDemo = curriculum.verificationStatus === "demo";
  return <div className="mt-2">
    <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4"><Meta label="College" value={data.college?.name} /><Meta label="Branch" value={[data.branch?.name, data.branch?.code].filter(Boolean).join(" · ")} /><Meta label="Curriculum" value={curriculum.name} /><Meta label="Version" value={[curriculum.regulationVersion, curriculum.academicYear].filter(Boolean).join(" · ")} /></div>
    {curriculum.description && <p className="mt-4 text-sm leading-6" style={{ color: "var(--jl-text-muted)" }}>{curriculum.description}</p>}
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full px-3 py-1 font-bold" style={{ background: isDemo ? "var(--jl-accent-soft)" : "var(--jl-surface-muted)", color: isDemo ? "var(--jl-danger)" : "var(--jl-primary)" }}>{isDemo ? "Demo / test curriculum" : curriculum.verificationStatus}</span>{curriculum.sourceName && <span style={{ color: "var(--jl-text-muted)" }}>Source: {curriculum.sourceName}</span>}{curriculum.sourceUrl && <a className="font-semibold underline" style={{ color: "var(--jl-primary)" }} href={curriculum.sourceUrl} target="_blank" rel="noreferrer">View source</a>}</div>
    {isDemo && <p className="mt-2 text-xs" style={{ color: "var(--jl-text-muted)" }}>This curriculum is prototype demo data and is not presented as official college information.</p>}
    {data.semesters.length === 0 ? <p className="status-empty mt-5 text-sm">This curriculum has no semesters published yet.</p> : <><div className="mt-5 flex gap-2 overflow-x-auto pb-2">{data.semesters.map((item) => <button key={item.semesterNumber} onClick={() => setActive(item.semesterNumber)} className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:ring-2" style={active === item.semesterNumber ? { background: "var(--jl-active)", color: "var(--jl-on-primary)" } : { background: "var(--jl-canvas-soft)", color: "var(--jl-text-muted)" }}>Semester {item.semesterNumber}</button>)}</div><div className="mt-4 rounded-xl border p-4 sm:p-5" style={{ borderColor: "var(--jl-border)", background: "var(--jl-surface)" }}><h3 className="text-lg font-bold">Semester {active}</h3>{semester?.subjects.length ? <ul className="mt-4 divide-y rounded-xl border" style={{ borderColor: "var(--jl-border)", background: "var(--jl-surface-elevated)" }}>{semester.subjects.map((subject) => <li key={subject.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold">{subject.name}</p>{subject.description && <p className="mt-1 text-sm leading-6" style={{ color: "var(--jl-text-muted)" }}>{subject.description}</p>}</div><span className="w-fit shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold" style={{ background: "var(--jl-surface-muted)", color: "var(--jl-primary)" }}>{subject.code} · {subject.credits} cr</span></li>)}</ul> : <p className="mt-3 text-sm" style={{ color: "var(--jl-text-muted)" }}>No subjects added for this semester.</p>}</div></>}
  </div>;
}

function Meta({ label, value }: { label: string; value?: string }) {
  return <div className="rounded-xl border p-3" style={{ borderColor: "var(--jl-border)", background: "var(--jl-canvas-soft)" }}><p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--jl-text-muted)" }}>{label}</p><p className="mt-1 break-words font-semibold">{value || "Not available"}</p></div>;
}
