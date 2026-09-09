import { z } from "zod";

const text = z.string().trim().min(1).max(700);
export const careerAnalysisSchema = z.object({
  careerSummary: text,
  strengths: z.array(text).max(10),
  prioritySkills: z.array(z.object({ skill: text, reason: text, priority: z.enum(["high", "medium", "low"]) })).max(10),
  curriculumRelevance: z.array(z.object({ subject: text, relevance: z.enum(["high", "medium", "low"]), explanation: text })).max(12),
  recommendations: z.array(text).min(1).max(10),
  estimatedLearningPath: z.array(z.object({ phase: z.number().int().min(1).max(10), title: text, skills: z.array(text).max(10), reason: text })).min(1).max(6),
}).superRefine((value, context) => {
  const phases = value.estimatedLearningPath.map((item) => item.phase);
  if (new Set(phases).size !== phases.length || phases.some((phase, index) => index > 0 && phase <= phases[index - 1])) context.addIssue({ code: z.ZodIssueCode.custom, message: "Learning-path phases must be unique and ordered." });
});

export const roadmapSchema = z.object({
  phases: z.array(z.object({
    phase: z.number().int().min(1).max(10), title: text, objective: text, skills: z.array(text).min(1).max(10),
    reason: text, projectIdea: text, difficulty: z.enum(["foundation", "intermediate", "advanced"]),
  })).min(1).max(6),
}).superRefine((value, context) => {
  const phases = value.phases.map((item) => item.phase);
  if (new Set(phases).size !== phases.length || phases.some((phase, index) => index > 0 && phase <= phases[index - 1])) context.addIssue({ code: z.ZodIssueCode.custom, message: "Roadmap phases must be unique and ordered." });
});
export type CareerAnalysis = z.infer<typeof careerAnalysisSchema>;
export type Roadmap = z.infer<typeof roadmapSchema>;
