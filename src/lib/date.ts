/**
 * Deterministic Date Formatting Utilities for JOB-LEARNER.
 * 
 * Prevents React SSR/Hydration mismatches by enforcing explicit locale ('en-GB' / 'en-IN')
 * and explicit formatting options across both server and client execution environments.
 */

export function formatDate(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
