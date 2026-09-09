import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "JOB-LEARNER | Career & Learning Guidance", description: "AI-powered career and learning guidance for students." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
