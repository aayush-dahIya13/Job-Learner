import { query, withTransaction } from "@/lib/db";
import type { CareerAnalysis, Roadmap } from "@/lib/ai/schemas";

export async function latestAnalysis(userId: number) {
  const result = await query<{ analysis: CareerAnalysis; generated_at: string; readiness_score: number }>("SELECT analysis, generated_at, readiness_score FROM career_analyses WHERE user_id = $1 ORDER BY generated_at DESC LIMIT 1", [userId]);
  return result.rows[0] ?? null;
}
export async function saveAnalysis(userId: number, roleId: number, readiness: number, analysis: CareerAnalysis) {
  await query("INSERT INTO career_analyses (user_id, job_role_id, readiness_score, analysis) VALUES ($1, $2, $3, $4::jsonb)", [userId, roleId, readiness, JSON.stringify(analysis)]);
}
export async function latestRoadmap(userId: number): Promise<{ id: number; readiness_score: number; generated_at: string; phases: Roadmap["phases"] } | null> {
  const result = await query<{ id: number; readiness_score: number; generated_at: string; roadmap: Roadmap | null }>("SELECT id::integer AS id, readiness_score, generated_at, roadmap FROM roadmaps WHERE user_id = $1 ORDER BY generated_at DESC LIMIT 1", [userId]);
  const roadmap = result.rows[0];
  if (!roadmap) return null;
  if (roadmap.roadmap && Array.isArray(roadmap.roadmap.phases)) {
    return { id: roadmap.id, readiness_score: roadmap.readiness_score, generated_at: roadmap.generated_at, phases: roadmap.roadmap.phases };
  }
  const items = await query<{ id: number; phase: number; title: string; objective: string; reason: string; difficulty: string; projectIdea: string; skills: string[] }>("SELECT ri.id::integer AS id, ri.phase_number AS phase, ri.title, COALESCE(ri.objective, '') AS objective, COALESCE(ri.reason, '') AS reason, COALESCE(ri.difficulty, '') AS difficulty, COALESCE(ri.project_idea, '') AS \"projectIdea\", COALESCE(array_agg(ris.skill_name ORDER BY ris.skill_name) FILTER (WHERE ris.skill_name IS NOT NULL), '{}') AS skills FROM roadmap_items ri LEFT JOIN roadmap_item_skills ris ON ris.roadmap_item_id = ri.id WHERE ri.roadmap_id = $1 GROUP BY ri.id ORDER BY ri.phase_number", [roadmap.id]);
  return {
    id: roadmap.id,
    readiness_score: roadmap.readiness_score,
    generated_at: roadmap.generated_at,
    phases: items.rows.map((item) => ({
      phase: item.phase,
      title: item.title,
      objective: item.objective,
      difficulty: (item.difficulty as "foundation" | "intermediate" | "advanced") || "foundation",
      steps: [{
        stepNumber: item.phase,
        title: item.title,
        description: item.objective,
        skills: item.skills.length ? item.skills : ["General"],
        level: "foundation" as const,
        whyThisStep: item.reason,
        prerequisites: [],
        practiceIdea: item.projectIdea,
        videos: [],
        extraResources: [],
      }],
    })),
  };
}
export async function saveRoadmap(userId: number, roleId: number, readiness: number, roadmap: Roadmap) {
  return withTransaction(async (client) => {
    const created = await client.query<{ id: number }>("INSERT INTO roadmaps (user_id, job_role_id, readiness_score, roadmap) VALUES ($1, $2, $3, $4::jsonb) RETURNING id::integer AS id", [userId, roleId, readiness, JSON.stringify(roadmap)]);
    const roadmapId = created.rows[0].id;
    for (const phase of roadmap.phases) {
      const allSkills = Array.from(new Set(phase.steps.flatMap((s) => s.skills)));
      const item = await client.query<{ id: number }>("INSERT INTO roadmap_items (roadmap_id, phase_number, title, objective, reason, difficulty, project_idea) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id::integer AS id", [roadmapId, phase.phase, phase.title, phase.objective, phase.steps[0]?.whyThisStep ?? "", phase.difficulty, phase.steps[phase.steps.length - 1]?.practiceIdea ?? ""]);
      for (const skill of allSkills) await client.query("INSERT INTO roadmap_item_skills (roadmap_item_id, skill_name) VALUES ($1, $2) ON CONFLICT DO NOTHING", [item.rows[0].id, skill]);
    }
    return roadmapId;
  });
}
