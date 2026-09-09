"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export function LogoutButton() { const router = useRouter(); const [loading, setLoading] = useState(false); async function logout() { setLoading(true); try { const response = await fetch("/api/auth/logout", { method: "POST" }); if (!response.ok) throw new Error("Logout failed"); router.push("/"); router.refresh(); } finally { setLoading(false); } } return <button onClick={logout} disabled={loading} className="inline-flex items-center justify-center rounded-xl border px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 disabled:opacity-60" style={{borderColor:"var(--jl-danger)",background:"var(--jl-danger-soft)",color:"var(--jl-danger)"}}>{loading ? "Logging out…" : "Log Out"}</button>; }
