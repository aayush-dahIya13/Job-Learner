import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function RegisterPage() { return <main className="auth-page py-10"><section className="auth-card mx-auto w-full max-w-2xl rounded-3xl p-6 sm:p-10"><Link href="/" className="font-bold text-ink">← JOB-LEARNER</Link><h1 className="mt-7 text-3xl font-bold text-ink">Create your student profile</h1><p className="mt-2 text-slate-600">Start with the details that shape your learning journey.</p><div className="mt-7"><AuthForm mode="register" /></div></section></main>; }
