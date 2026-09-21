import { z } from "zod";

const text = z.string().trim().min(1).max(700);
const longText = z.string().trim().min(1).max(3000);
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

export const videoResourceSchema = z.object({
  title: z.string().trim().min(1).max(300),
  channel: z.string().trim().min(1).max(150),
  url: z.string().url().max(500),
});

export const extraResourceSchema = z.object({
  title: z.string().trim().min(1).max(300),
  url: z.string().url().max(500),
  type: z.string().trim().min(1).max(100).optional(),
});

export const roadmapStepSchema = z.object({
  stepNumber: z.number().int().min(1).max(100),
  title: text,
  description: longText,
  skills: z.array(text).min(1).max(10),
  level: z.enum(["foundation", "intermediate", "advanced", "beginner"]).default("foundation"),
  whyThisStep: longText,
  prerequisites: z.array(text).max(10),
  practiceIdea: longText,
  videos: z.array(videoResourceSchema).max(10).default([]),
  extraResources: z.array(extraResourceSchema).max(10).default([]),
});

export const roadmapPhaseSchema = z.object({
  phase: z.number().int().min(1).max(10),
  title: text,
  objective: longText,
  difficulty: z.enum(["foundation", "intermediate", "advanced"]),
  steps: z.array(roadmapStepSchema).min(1).max(10),
});

export const roadmapSchema = z.object({
  phases: z.array(roadmapPhaseSchema).min(1).max(10),
}).superRefine((value, context) => {
  const phases = value.phases.map((item) => item.phase);
  if (new Set(phases).size !== phases.length || phases.some((phase, index) => index > 0 && phase <= phases[index - 1])) context.addIssue({ code: z.ZodIssueCode.custom, message: "Roadmap phases must be unique and ordered." });
});

export type CareerAnalysis = z.infer<typeof careerAnalysisSchema>;
export type VideoResource = z.infer<typeof videoResourceSchema>;
export type ExtraResource = z.infer<typeof extraResourceSchema>;
export type RoadmapStep = z.infer<typeof roadmapStepSchema>;
export type RoadmapPhase = z.infer<typeof roadmapPhaseSchema>;
export type Roadmap = z.infer<typeof roadmapSchema>;
