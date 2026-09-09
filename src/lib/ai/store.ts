import { query, withTransaction } from "@/lib/db";
import type { CareerAnalysis, Roadmap } from "@/lib/ai/schemas";

export async function latestAnalysis(userId: number) {
  const result = await query<{ analysis: CareerAnalysis; generated_at: string; readiness_score: number }>("SELECT analysis, generated_at, readiness_score FROM career_analyses WHERE user_id = $1 ORDER BY generated_at DESC LIMIT 1", [userId]);
  return result.rows[0] ?? null;
}
export async function saveAnalysis(userId: number, roleId: number, readiness: number, analysis: CareerAnalysis) {
  await query("INSERT INTO career_analyses (user_id, job_role_id, readiness_score, analysis) VALUES ($1, $2, $3, $4::jsonb)", [userId, roleId, readiness, JSON.stringify(analysis)]);
}
export async function latestRoadmap(userId: number) {
  const result = await query<{ id: number; readiness_score: number; generated_at: string }>("SELECT id::integer AS id, readiness_score, generated_at FROM roadmaps WHERE user_id = $1 ORDER BY generated_at DESC LIMIT 1", [userId]);
  const roadmap = result.rows[0];
  if (!roadmap) return null;
  const items = await query<{ id: number; phase: number; title: string; objective: string; reason: string; difficulty: string; projectIdea: string; skills: string[] }>("SELECT ri.id::integer AS id, ri.phase_number AS phase, ri.title, COALESCE(ri.objective, '') AS objective, COALESCE(ri.reason, '') AS reason, COALESCE(ri.difficulty, '') AS difficulty, COALESCE(ri.project_idea, '') AS \"projectIdea\", COALESCE(array_agg(ris.skill_name ORDER BY ris.skill_name) FILTER (WHERE ris.skill_name IS NOT NULL), '{}') AS skills FROM roadmap_items ri LEFT JOIN roadmap_item_skills ris ON ris.roadmap_item_id = ri.id WHERE ri.roadmap_id = $1 GROUP BY ri.id ORDER BY ri.phase_number", [roadmap.id]);
  return { ...roadmap, phases: items.rows.map(({ id: _id, ...item }) => item) };
}
export async function saveRoadmap(userId: number, roleId: number, readiness: number, roadmap: Roadmap) {
  return withTransaction(async (client) => {
    const created = await client.query<{ id: number }>("INSERT INTO roadmaps (user_id, job_role_id, readiness_score) VALUES ($1, $2, $3) RETURNING id::integer AS id", [userId, roleId, readiness]);
    const roadmapId = created.rows[0].id;
    for (const phase of roadmap.phases) {
      const item = await client.query<{ id: number }>("INSERT INTO roadmap_items (roadmap_id, phase_number, title, objective, reason, difficulty, project_idea) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id::integer AS id", [roadmapId, phase.phase, phase.title, phase.objective, phase.reason, phase.difficulty, phase.projectIdea]);
      for (const skill of phase.skills) await client.query("INSERT INTO roadmap_item_skills (roadmap_item_id, skill_name) VALUES ($1, $2) ON CONFLICT DO NOTHING", [item.rows[0].id, skill]);
    }
    return roadmapId;
  });
}
