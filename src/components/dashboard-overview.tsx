import Link from "next/link";

type SkillGap = {
  jobRole: { title: string };
  readinessScore: number;
  skills: { skillName: string; status: string }[];
} | null;

type Curriculum = {
  name: string;
  version: string;
  semesters: number;
  subjects: number;
} | null;

type DashboardOverviewProps = {
  student: {
    fullName: string;
    college: string;
    branch: string;
    currentYear: number;
    careerGoal: string;
  };
  skillGap: SkillGap;
  curriculum: Curriculum;
};

const journey = [
  ["01", "College Curriculum", "See the subjects that shape your foundation.", "/curriculum"],
  ["02", "Current Skills", "Keep your self-assessment up to date.", "/settings"],
  ["03", "Industry Requirements", "Choose a role and understand what it needs.", "/skill-gap"],
  ["04", "Skill Assessment", "Measure demonstrated technical proficiency.", "/assessments"],
  ["05", "Career Guidance", "Connect your context to career insight.", "/career-insights"],
  ["06", "Learning Roadmap", "Turn insight into practical next steps.", "/roadmap"],
] as const;

const quickActions = [
  ["Take Assessment", "Measure demonstrated skills", "/assessments", "✓"],
  ["Verified Skills", "Assessment evidence profile", "/verified-skills", "🛡"],
  ["View curriculum", "Your academic foundation", "/curriculum", "▤"],
  ["Review skill gap", "Skills and role requirements", "/skill-gap", "◔"],
  ["Career insights", "Guidance from your context", "/career-insights", "✦"],
  ["Learning roadmap", "Plan your next steps", "/roadmap", "↗"],
] as const;

export function DashboardOverview({ student, skillGap, curriculum }: DashboardOverviewProps) {
  const firstName = student.fullName.split(" ")[0];
  const gaps = skillGap?.skills.filter((skill) => skill.status !== "mastered").slice(0, 3) ?? [];

  return <div className="space-y-6 sm:space-y-8">
    <section className="dashboard-hero px-6 py-8 text-white sm:px-8 sm:py-10">
      <div className="relative z-10 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-white/70">Your career workspace</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {firstName}.</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-white/85 sm:text-lg">Build the skills your target career actually needs—using your curriculum, current strengths, and a clearer next step.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-moss transition hover:-translate-y-0.5 hover:bg-[#fff7ef] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/skill-gap">Explore my skill gap</Link>
          <Link className="rounded-xl border border-white/35 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" href="/settings">Update profile</Link>
        </div>
      </div>
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <article className="dashboard-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Student profile</p>
            <h2 className="mt-2 text-xl font-bold">Your learning context</h2>
          </div>
          <Link className="btn-secondary px-3 py-2 text-sm" href="/settings">Edit profile</Link>
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Student</dt><dd className="mt-1 font-semibold">{student.fullName}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Current year</dt><dd className="mt-1 font-semibold">Year {student.currentYear}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wide text-stone-500">College</dt><dd className="mt-1 font-semibold">{student.college}</dd></div>
          <div><dt className="text-xs font-bold uppercase tracking-wide text-stone-500">Branch</dt><dd className="mt-1 font-semibold">{student.branch}</dd></div>
        </dl>
        {student.careerGoal && <div className="dashboard-sage mt-5 rounded-xl p-4"><p className="text-xs font-bold uppercase tracking-wide text-moss">Career direction</p><p className="mt-1 text-sm leading-6 text-stone-700">{student.careerGoal}</p></div>}
      </article>

      <article className="dashboard-card dashboard-pink p-5 sm:p-6">
        <p className="eyebrow">Career readiness</p>
        <h2 className="mt-2 text-xl font-bold">{skillGap?.jobRole.title ?? "Choose a target role"}</h2>
        {skillGap ? <><div className="mt-5 flex items-end justify-between gap-4"><p className="max-w-[14rem] text-sm leading-6 text-stone-700">Your saved skills compared with the requirements for this role.</p><strong className="text-5xl leading-none text-moss">{skillGap.readinessScore}%</strong></div><div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/80"><div className="h-full rounded-full bg-moss" style={{ width: `${skillGap.readinessScore}%` }}/></div></> : <p className="mt-4 text-sm leading-6 text-stone-700">Your skill gap analysis will appear here once your profile and career requirements are ready.</p>}
        <Link className="mt-6 inline-block text-sm font-bold text-brand hover:underline" href="/skill-gap">{skillGap ? "View skill-gap details →" : "Set a target role →"}</Link>
      </article>
    </section>

    <section aria-labelledby="journey-title">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">A connected path</p><h2 id="journey-title" className="mt-2 text-2xl font-bold">Your Career Journey</h2></div><p className="max-w-md text-sm leading-6 text-stone-600">Every step uses the information you choose to save, so your next action stays grounded in your actual context.</p></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {journey.map(([index, title, description, href]) => <Link className="journey-step block p-4" href={href} key={title}><span className="journey-index text-xs font-bold tracking-[.16em]">{index}</span><h3 className="mt-4 font-bold leading-5">{title}</h3><p className="mt-2 text-sm leading-5 text-stone-600">{description}</p><span className="mt-4 block text-sm font-bold text-brand">Open →</span></Link>)}
      </div>
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <article className="dashboard-card dashboard-sage p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Academic foundation</p><h2 className="mt-2 text-xl font-bold">Your College Curriculum</h2></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-lg text-moss">▤</span></div>
        <p className="mt-4 text-sm text-stone-700"><b>{student.college}</b> · {student.branch}</p>
        {curriculum ? <div className="mt-4 rounded-xl bg-white/75 p-4"><p className="font-semibold">{curriculum.name}</p><p className="mt-1 text-sm text-stone-600">{curriculum.version} · {curriculum.semesters} {curriculum.semesters === 1 ? "semester" : "semesters"} · {curriculum.subjects} {curriculum.subjects === 1 ? "subject" : "subjects"}</p></div> : <p className="mt-4 rounded-xl border border-dashed border-stone-300 bg-white/55 p-4 text-sm leading-6 text-stone-600">No curriculum is published for your college and branch yet. It will appear here when available.</p>}
        <Link className="btn-secondary mt-5 px-4 py-2 text-sm" href="/curriculum">View curriculum</Link>
      </article>

      <article className="dashboard-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Career intelligence</p><h2 className="mt-2 text-xl font-bold">Career Insights</h2></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-lg text-lotus">✦</span></div>
        <p className="mt-4 text-sm leading-6 text-stone-700">Bring together your curriculum, current skills, and career direction for guidance shaped around your saved information.</p>
        <Link className="btn-primary mt-5 px-4 py-2 text-sm" href="/career-insights">View career insights</Link>
      </article>
    </section>

    <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <article className="dashboard-card p-5 sm:p-6">
        <p className="eyebrow">Turn insight into action</p><h2 className="mt-2 text-xl font-bold">Learning Roadmap</h2>
        <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs font-bold sm:text-sm"><span className="dashboard-sage rounded-xl px-2 py-3 text-moss">Learn</span><span className="rounded-xl bg-[#f6eddd] px-2 py-3 text-stone-700">Practice</span><span className="dashboard-pink rounded-xl px-2 py-3 text-stone-700">Build</span><span className="dashboard-sage rounded-xl px-2 py-3 text-moss">Prepare</span></div>
        <p className="mt-5 text-sm leading-6 text-stone-600">Create or revisit your saved roadmap when you are ready. JOB-LEARNER keeps it connected to your career context without inventing a fixed outcome.</p>
        <Link className="btn-secondary mt-5 px-4 py-2 text-sm" href="/roadmap">Open learning roadmap</Link>
      </article>
      <article className="dashboard-card dashboard-pink p-5 sm:p-6"><p className="eyebrow">Focus next</p><h2 className="mt-2 text-xl font-bold">Skill Gap</h2>{gaps.length ? <ul className="mt-4 space-y-2 text-sm text-stone-700">{gaps.map((skill) => <li className="rounded-lg bg-white/70 px-3 py-2" key={skill.skillName}>{skill.skillName}</li>)}</ul> : <p className="mt-4 text-sm leading-6 text-stone-700">Choose a target role and add your current skills to reveal the areas that deserve attention.</p>}<Link className="mt-5 inline-block text-sm font-bold text-brand hover:underline" href="/skill-gap">Review skill gap →</Link></article>
    </section>

    <section aria-labelledby="quick-actions-title"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Keep moving</p><h2 id="quick-actions-title" className="mt-2 text-2xl font-bold">Quick Actions</h2></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{quickActions.map(([title, description, href, icon]) => <Link className="dashboard-card dashboard-card-interactive flex items-center gap-3 p-4" href={href} key={title}><span className="dashboard-sage grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg text-moss">{icon}</span><span><span className="block text-sm font-bold">{title}</span><span className="mt-1 block text-xs leading-5 text-stone-600">{description}</span></span></Link>)}</div></section>
  </div>;
}
