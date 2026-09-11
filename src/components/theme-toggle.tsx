"use client";

import { useEffect, useState } from "react";

const storageKey = "job-learner:theme";
type Theme = "light" | "dark";

function applyTheme(theme: Theme) { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; window.dispatchEvent(new Event("job-learner:theme-change")); }

export function ThemeToggle({ compact = false, responsiveCompact = false }: { compact?:boolean; responsiveCompact?:boolean }) {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => { const saved = localStorage.getItem(storageKey); const next: Theme = saved === "dark" ? "dark" : "light"; setTheme(next); applyTheme(next); }, []);
  function toggle() { const next: Theme = theme === "dark" ? "light" : "dark"; setTheme(next); localStorage.setItem(storageKey, next); applyTheme(next); }
  const dark = theme === "dark";
  const label = dark ? "Dark Mode" : "Light Mode";
  return <button type="button" onClick={toggle} aria-label={`Switch to ${dark ? "light" : "dark"} mode`} title={`Switch to ${dark ? "light" : "dark"} mode`} className={`theme-toggle ${compact ? "theme-toggle-compact" : ""} ${responsiveCompact ? "theme-toggle-responsive" : ""}`}><span aria-hidden className="theme-toggle-icon">{dark ? "☾" : "☀"}</span><span className="theme-toggle-label">{label}</span></button>;
}
