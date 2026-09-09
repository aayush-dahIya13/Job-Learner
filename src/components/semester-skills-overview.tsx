"use client";

type Subject = { id:number; code:string; name:string; credits:number; description:string };

const skillRules: Array<[RegExp, string]> = [
  [/program|coding|software|java|python|web/i, "Programming"],
  [/data structure|algorithm/i, "Data Structures & Algorithms"],
  [/database|sql|data base/i, "Databases"],
  [/math|calculus|statistics|probability|linear algebra/i, "Mathematics & Analysis"],
  [/network/i, "Computer Networks"],
  [/operating system|system software/i, "Operating Systems"],
  [/software engineering|project|testing/i, "Software Engineering"],
  [/artificial intelligence|machine learning|data science/i, "AI & Data Science"],
  [/security|cyber/i, "Cybersecurity"],
  [/communication|english|presentation/i, "Communication"],
];

function skillsFor(subjects: Subject[]) {
  const found = new Set<string>();
  subjects.forEach((subject) => skillRules.forEach(([rule, skill]) => {
    if (rule.test(`${subject.name} ${subject.description} ${subject.code}`)) found.add(skill);
  }));
  return [...found];
}

export function SemesterSkillsOverview({ semesterNumber, subjects }: { semesterNumber:number; subjects:Subject[] }) {
  const skills = skillsFor(subjects);
  return <section className="mt-8 border-t pt-8" aria-labelledby="semester-skills-heading">
    <div className="max-w-3xl"><p className="eyebrow">Curriculum to career</p><h2 id="semester-skills-heading" className="mt-2 text-2xl font-bold">Semester Skills Overview</h2><p className="mt-2 text-sm leading-6 text-stone-600">A curriculum-based view of the knowledge areas represented by the subjects in Semester {semesterNumber}. It is not an assessment of your personal ability.</p></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <article className="dashboard-card p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg" style={{background:"var(--jl-sage)",color:"var(--jl-primary)"}}>✓</span><div><h3 className="font-bold">Skills You Should Have Learned</h3><p className="mt-1 text-sm text-stone-600">Expected knowledge areas by the end of this selected curriculum semester.</p></div></div>{skills.length ? <><div className="mt-5 flex flex-wrap gap-2">{skills.map(skill=><span key={skill} className="rounded-full px-3 py-1.5 text-xs font-bold" style={{background:"var(--jl-surface-muted)",color:"var(--jl-primary)"}}>{skill}</span>)}</div><p className="mt-5 rounded-xl border p-3 text-xs leading-5 text-stone-600" style={{borderColor:"var(--jl-border)"}}>Derived from the titles and descriptions of the {subjects.length} subject{subjects.length===1?"":"s"} shown above. Review your course material to understand the exact learning outcomes.</p></> : <div className="status-empty mt-5 p-5 text-sm">There are no subject descriptions available to identify skill areas for this semester yet.</div>}</article>
      <article className="dashboard-card p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg" style={{background:"var(--jl-accent-soft)",color:"var(--jl-accent)"}}>↗</span><div><h3 className="font-bold">Skills To Focus On This Semester</h3><p className="mt-1 text-sm text-stone-600">Your future personalized learning focus will appear here.</p></div></div><div className="status-empty mt-5 p-5 text-left"><p className="font-semibold text-[color:var(--jl-text)]">Progress data is not available yet</p><p className="mt-2 text-sm leading-6">JOB-LEARNER does not currently record course-level completion or skill evidence, so it cannot accurately mark skills as remaining or show a percentage. When that data is available, this card is ready to compare expected skills with your current progress.</p></div><div className="mt-4 flex items-center gap-3 text-xs font-semibold text-stone-500"><span className="h-2 flex-1 rounded-full bg-[color:var(--jl-canvas-soft)]"/><span>Expected · Current · Remaining</span></div></article>
    </div>
  </section>;
}
