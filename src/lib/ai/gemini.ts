import "server-only";
import { GoogleGenAI } from "@google/genai";
import { careerAnalysisSchema, roadmapSchema, type CareerAnalysis, type Roadmap } from "@/lib/ai/schemas";
import { safeAiInput, type AiStudentContext } from "@/lib/ai/student-context";
import { findCuratedResources } from "@/lib/ai/roadmap-resources";

const advisorRules = `You are a careful career-learning advisor. Use only the supplied student, career, deterministic skill-gap, and curriculum data. The deterministic readiness score is factual input; do not recalculate or contradict it. Focus on the selected role, emphasize missing and high-importance skills, and avoid mastered skills except when they are prerequisites. Give practical, realistic ordered learning advice. Recommendations are suggestions, not guarantees. Never claim employment outcomes, salaries, job statistics, companies, courses, certifications, or facts not supplied. Return only JSON matching the requested schema.`;

export class AiServiceError extends Error { constructor(public code: string, message: string) { super(message); } }

function isTransientError(error: unknown): boolean {
  if (!error) return false;
  const msg = (error instanceof Error ? error.message : String(error)).toUpperCase();
  return msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
}

async function callWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3, delays = [1000, 2000]): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1 && isTransientError(err)) {
        await new Promise((resolve) => setTimeout(resolve, delays[attempt] ?? 2000));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

async function generate(context: AiStudentContext, kind: "analysis" | "roadmap") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiServiceError("AI_NOT_CONFIGURED", "AI guidance is not configured yet. Please ask an administrator to add the Gemini API key.");
  const schema = kind === "analysis" ? careerAnalysisSchema : roadmapSchema;
  const task = kind === "analysis"
    ? "Produce careerSummary, strengths, prioritySkills, curriculumRelevance, recommendations, and estimatedLearningPath."
    : "Produce a structured multi-phase learning roadmap with 5 sequential phases and 4 to 5 sequential steps per phase tailored to the student target role and deterministic skill gaps (e.g., Phase 1 Foundation, Phase 2 Frontend, Phase 3 Backend, Phase 4 Full Stack, Phase 5 Production). For each phase provide phase (1 to 5), title, objective, difficulty (foundation, intermediate, or advanced), and steps. For each step provide stepNumber (1 to 25), title, description, skills (array of relevant skills), level (foundation, intermediate, or advanced), whyThisStep (explaining why this step matters based on the student background and missing skills), prerequisites (array of prerequisite concepts or earlier steps), and practiceIdea (concrete coding task or mini-project to build).";
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await callWithRetry(() =>
      Promise.race([
        ai.models.generateContent({ model: "gemini-3.6-flash", contents: `${task}\n\nStudent data:\n${JSON.stringify(safeAiInput(context))}`, config: { systemInstruction: advisorRules, responseMimeType: "application/json", responseJsonSchema: zodToJsonSchema(kind) } }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new AiServiceError("AI_TIMEOUT", "The AI service took too long to respond. Please try again.")), 75000)),
      ])
    );
    const raw = response.text;
    if (!raw) throw new AiServiceError("AI_INVALID_RESPONSE", "The AI service returned no usable guidance. Please try again.");
    let parsedData = JSON.parse(raw);
    if (kind === "roadmap" && parsedData && Array.isArray(parsedData.phases)) {
      const usedVideoUrls = new Set<string>();
      const usedExtraUrls = new Set<string>();

      parsedData = {
        phases: parsedData.phases.map((p: any) => ({
          ...p,
          steps: (p.steps || []).map((s: any) => {
            const resources = findCuratedResources(
              {
                title: s.title || "",
                description: s.description || "",
                skills: Array.isArray(s.skills) ? s.skills : [],
              },
              usedVideoUrls,
              usedExtraUrls
            );

            resources.videos.forEach((v) => usedVideoUrls.add(v.url));
            resources.extraResources.forEach((e) => usedExtraUrls.add(e.url));

            return {
              ...s,
              level: s.level === "beginner" ? "foundation" : (s.level || "foundation"),
              prerequisites: Array.isArray(s.prerequisites) ? s.prerequisites : [],
              videos: resources.videos,
              extraResources: resources.extraResources,
            };
          }),
        })),
      };
    }
    const parsed = schema.safeParse(parsedData);
    if (!parsed.success) {
      console.error("[GEMINI_ZOD_VALIDATION_ERROR]", JSON.stringify(parsed.error.format(), null, 2));
      throw new AiServiceError("AI_INVALID_RESPONSE", "The AI service returned an invalid response. Please try again.");
    }
    return parsed.data;
  } catch (error) {
    console.error("[GEMINI_GENERATE_ERROR]", error);
    if (error instanceof AiServiceError) throw error;
    throw new AiServiceError("AI_UNAVAILABLE", "AI guidance is temporarily unavailable. Please try again shortly.");
  }
}
// The Gemini SDK accepts JSON Schema; keeping this explicit makes the external contract auditable.
function zodToJsonSchema(kind: "analysis" | "roadmap") {
  return kind === "analysis"
    ? {
        type: "object",
        required: ["careerSummary", "strengths", "prioritySkills", "curriculumRelevance", "recommendations", "estimatedLearningPath"],
        properties: {
          careerSummary: { type: "string" },
          strengths: { type: "array", items: { type: "string" } },
          prioritySkills: { type: "array", items: { type: "object", required: ["skill", "reason", "priority"], properties: { skill: { type: "string" }, reason: { type: "string" }, priority: { type: "string", enum: ["high", "medium", "low"] } } } },
          curriculumRelevance: { type: "array", items: { type: "object", required: ["subject", "relevance", "explanation"], properties: { subject: { type: "string" }, relevance: { type: "string", enum: ["high", "medium", "low"] }, explanation: { type: "string" } } } },
          recommendations: { type: "array", items: { type: "string" } },
          estimatedLearningPath: { type: "array", items: { type: "object", required: ["phase", "title", "skills", "reason"], properties: { phase: { type: "integer" }, title: { type: "string" }, skills: { type: "array", items: { type: "string" } }, reason: { type: "string" } } } },
        },
      }
    : {
        type: "object",
        required: ["phases"],
        properties: {
          phases: {
            type: "array",
            items: {
              type: "object",
              required: ["phase", "title", "objective", "difficulty", "steps"],
              properties: {
                phase: { type: "integer" },
                title: { type: "string" },
                objective: { type: "string" },
                difficulty: { type: "string", enum: ["foundation", "intermediate", "advanced"] },
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["stepNumber", "title", "description", "skills", "level", "whyThisStep", "prerequisites", "practiceIdea"],
                    properties: {
                      stepNumber: { type: "integer" },
                      title: { type: "string" },
                      description: { type: "string" },
                      skills: { type: "array", items: { type: "string" } },
                      level: { type: "string", enum: ["foundation", "intermediate", "advanced", "beginner"] },
                      whyThisStep: { type: "string" },
                      prerequisites: { type: "array", items: { type: "string" } },
                      practiceIdea: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      };
}
export const generateCareerAnalysis = (context: AiStudentContext): Promise<CareerAnalysis> => generate(context, "analysis") as Promise<CareerAnalysis>;
export const generateRoadmap = (context: AiStudentContext): Promise<Roadmap> => generate(context, "roadmap") as Promise<Roadmap>;
