import "server-only";
import { GoogleGenAI } from "@google/genai";
import { careerAnalysisSchema, roadmapSchema, type CareerAnalysis, type Roadmap } from "@/lib/ai/schemas";
import { safeAiInput, type AiStudentContext } from "@/lib/ai/student-context";

const advisorRules = `You are a careful career-learning advisor. Use only the supplied student, career, deterministic skill-gap, and curriculum data. The deterministic readiness score is factual input; do not recalculate or contradict it. Focus on the selected role, emphasize missing and high-importance skills, and avoid mastered skills except when they are prerequisites. Give practical, realistic ordered learning advice. Recommendations are suggestions, not guarantees. Never claim employment outcomes, salaries, job statistics, companies, courses, certifications, or facts not supplied. Return only JSON matching the requested schema.`;

export class AiServiceError extends Error { constructor(public code: string, message: string) { super(message); } }

async function generate(context: AiStudentContext, kind: "analysis" | "roadmap") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiServiceError("AI_NOT_CONFIGURED", "AI guidance is not configured yet. Please ask an administrator to add the Gemini API key.");
  const schema = kind === "analysis" ? careerAnalysisSchema : roadmapSchema;
  const task = kind === "analysis"
    ? "Produce careerSummary, strengths, prioritySkills, curriculumRelevance, recommendations, and estimatedLearningPath."
    : "Produce a roadmap with sequential phases. Every phase needs a title, objective, skills, reason, projectIdea, and foundation/intermediate/advanced difficulty. Consider academic year without inventing timelines.";
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await Promise.race([
      ai.models.generateContent({ model: "gemini-2.5-flash", contents: `${task}\n\nStudent data:\n${JSON.stringify(safeAiInput(context))}`, config: { systemInstruction: advisorRules, responseMimeType: "application/json", responseJsonSchema: zodToJsonSchema(kind) } }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new AiServiceError("AI_TIMEOUT", "The AI service took too long to respond. Please try again.")), 20000)),
    ]);
    const raw = response.text;
    if (!raw) throw new AiServiceError("AI_INVALID_RESPONSE", "The AI service returned no usable guidance. Please try again.");
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new AiServiceError("AI_INVALID_RESPONSE", "The AI service returned an invalid response. Please try again.");
    return parsed.data;
  } catch (error) {
    if (error instanceof AiServiceError) throw error;
    throw new AiServiceError("AI_UNAVAILABLE", "AI guidance is temporarily unavailable. Please try again shortly.");
  }
}
// The Gemini SDK accepts JSON Schema; keeping this explicit makes the external contract auditable.
function zodToJsonSchema(kind: "analysis" | "roadmap") {
  return kind === "analysis" ? { type: "object", required: ["careerSummary", "strengths", "prioritySkills", "curriculumRelevance", "recommendations", "estimatedLearningPath"], properties: { careerSummary: { type: "string" }, strengths: { type: "array", items: { type: "string" } }, prioritySkills: { type: "array", items: { type: "object", required: ["skill", "reason", "priority"], properties: { skill: { type: "string" }, reason: { type: "string" }, priority: { type: "string", enum: ["high", "medium", "low"] } } } }, curriculumRelevance: { type: "array", items: { type: "object", required: ["subject", "relevance", "explanation"], properties: { subject: { type: "string" }, relevance: { type: "string", enum: ["high", "medium", "low"] }, explanation: { type: "string" } } } }, recommendations: { type: "array", items: { type: "string" } }, estimatedLearningPath: { type: "array", items: { type: "object", required: ["phase", "title", "skills", "reason"], properties: { phase: { type: "integer" }, title: { type: "string" }, skills: { type: "array", items: { type: "string" } }, reason: { type: "string" } } } } } } : { type: "object", required: ["phases"], properties: { phases: { type: "array", items: { type: "object", required: ["phase", "title", "objective", "skills", "reason", "projectIdea", "difficulty"], properties: { phase: { type: "integer" }, title: { type: "string" }, objective: { type: "string" }, skills: { type: "array", items: { type: "string" } }, reason: { type: "string" }, projectIdea: { type: "string" }, difficulty: { type: "string", enum: ["foundation", "intermediate", "advanced"] } } } } } };
}
export const generateCareerAnalysis = (context: AiStudentContext): Promise<CareerAnalysis> => generate(context, "analysis") as Promise<CareerAnalysis>;
export const generateRoadmap = (context: AiStudentContext): Promise<Roadmap> => generate(context, "roadmap") as Promise<Roadmap>;
