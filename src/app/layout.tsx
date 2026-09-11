import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "JOB-LEARNER | Career & Learning Guidance", description: "AI-powered career and learning guidance for students." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const themeScript = "try { var theme = localStorage.getItem('job-learner:theme'); if (theme === 'dark') { document.documentElement.dataset.theme = 'dark'; document.documentElement.style.colorScheme = 'dark'; } } catch (e) {}";
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>{children}</body></html>;
}
