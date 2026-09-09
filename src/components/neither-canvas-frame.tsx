"use client";

import { useRef } from "react";

export function NeitherCanvasFrame({ storageKey }: { storageKey:string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  function syncTheme() { const child = frame.current?.contentDocument; if (!child) return; const theme = getComputedStyle(document.documentElement); const root = child.documentElement.style; root.setProperty("--bg", theme.getPropertyValue("--jl-canvas").trim()); root.setProperty("--sidebar-bg", theme.getPropertyValue("--jl-ivory").trim()); root.setProperty("--sidebar-border", theme.getPropertyValue("--jl-border").trim()); root.setProperty("--surface", theme.getPropertyValue("--jl-surface").trim()); root.setProperty("--surface2", theme.getPropertyValue("--jl-canvas-soft").trim()); root.setProperty("--bubble-bg", theme.getPropertyValue("--jl-surface").trim()); root.setProperty("--bubble-border", theme.getPropertyValue("--jl-border").trim()); root.setProperty("--accent", theme.getPropertyValue("--jl-accent").trim()); root.setProperty("--accent2", theme.getPropertyValue("--jl-primary-hover").trim()); root.setProperty("--accent3", theme.getPropertyValue("--jl-primary").trim()); root.setProperty("--text", theme.getPropertyValue("--jl-text").trim()); root.setProperty("--text-dim", theme.getPropertyValue("--jl-text-muted").trim()); root.setProperty("--text-muted", theme.getPropertyValue("--jl-text-muted").trim()); }
  return <iframe ref={frame} onLoad={syncTheme} title="Neither Canvas visual workspace" src={`/neither-canvas/index.html?storageKey=${encodeURIComponent(storageKey)}`} className="mt-6 h-[calc(100vh-11rem)] min-h-[620px] w-full overflow-hidden rounded-2xl border bg-[color:var(--jl-surface)] shadow-[var(--jl-shadow)]" />;
}
