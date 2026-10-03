import { describe, it, expect } from "vitest";
import { resolveAdaptiveLearningRecommendation } from "@/lib/roadmap-matching";
import type { AssessmentWeakSkill } from "@/lib/student-skill-gap";

describe("resolveAdaptiveLearningRecommendation", () => {
  const samplePhases = [
    {
      phase: 1,
      title: "Foundations",
      steps: [
        {
          stepNumber: 1,
          title: "TypeScript Deep Dive",
          description: "Learn advanced TS concepts",
          skills: ["TypeScript", "Generics"],
          resources: [],
        },
        {
          stepNumber: 2,
          title: "Node.js Microservices",
          description: "Build Node services",
          skills: ["Node.js", "Express"],
          resources: [],
        },
      ],
    },
    {
      phase: 2,
      title: "Advanced Topics",
      steps: [
        {
          stepNumber: 3,
          title: "SQL & Relational Databases",
          description: "Master PostgreSQL and indexing",
          skills: ["PostgreSQL", "SQL"],
          resources: [],
        },
      ],
    },
  ];

  it("returns NO_WEAK_SKILL when there are no assessment weak skills", () => {
    const result = resolveAdaptiveLearningRecommendation({
      weakSkills: [],
      phases: samplePhases,
      completedStepNumbers: [],
    });

    expect(result.status).toBe("NO_WEAK_SKILL");
    expect(result.weakSkill).toBeNull();
    expect(result.recommendedStep).toBeNull();
  });

  it("selects the high-priority weak skill over lower score normal skill", () => {
    const weakSkills: AssessmentWeakSkill[] = [
      {
        skillId: 1,
        skillName: "Node.js",
        score: 30, // lower score, but not high priority
        level: 1,
        label: "Beginner",
        isIndustryRequired: true,
        isHighPriority: false,
        completedAt: new Date().toISOString(),
      },
      {
        skillId: 2,
        skillName: "TypeScript",
        score: 45, // higher score, but HIGH priority
        level: 2,
        label: "Developing",
        isIndustryRequired: true,
        isHighPriority: true,
        completedAt: new Date().toISOString(),
      },
    ];

    const result = resolveAdaptiveLearningRecommendation({
      weakSkills,
      phases: samplePhases,
      completedStepNumbers: [],
    });

    expect(result.status).toBe("RECOMMENDED");
    expect(result.weakSkill?.skillName).toBe("TypeScript");
    expect(result.recommendedStep?.stepNumber).toBe(1);
    expect(result.recommendedStep?.title).toBe("TypeScript Deep Dive");
  });

  it("prefers an incomplete roadmap step over a completed step for the weak skill", () => {
    const phasesWithMultipleStepsForSkill = [
      {
        phase: 1,
        title: "Basics & Beyond",
        steps: [
          {
            stepNumber: 1,
            title: "TypeScript Intro",
            description: "Intro to TS",
            skills: ["TypeScript"],
            resources: [],
          },
          {
            stepNumber: 2,
            title: "Advanced TypeScript",
            description: "Advanced TS",
            skills: ["TypeScript"],
            resources: [],
          },
        ],
      },
    ];

    const weakSkills: AssessmentWeakSkill[] = [
      {
        skillId: 1,
        skillName: "TypeScript",
        score: 35,
        level: 1,
        label: "Beginner",
        isIndustryRequired: true,
        isHighPriority: true,
        completedAt: new Date().toISOString(),
      },
    ];

    // Step 1 is completed
    const result = resolveAdaptiveLearningRecommendation({
      weakSkills,
      phases: phasesWithMultipleStepsForSkill,
      completedStepNumbers: [1],
    });

    expect(result.status).toBe("RECOMMENDED");
    expect(result.recommendedStep?.stepNumber).toBe(2);
    expect(result.recommendedStep?.title).toBe("Advanced TypeScript");
    expect(result.recommendedStep?.isCompleted).toBe(false);
  });

  it("returns ALL_COMPLETED state when all matching steps for the weak skill are completed", () => {
    const weakSkills: AssessmentWeakSkill[] = [
      {
        skillId: 1,
        skillName: "TypeScript",
        score: 35,
        level: 1,
        label: "Beginner",
        isIndustryRequired: true,
        isHighPriority: true,
        completedAt: new Date().toISOString(),
      },
    ];

    // Step 1 is completed and it's the only matching step
    const result = resolveAdaptiveLearningRecommendation({
      weakSkills,
      phases: samplePhases,
      completedStepNumbers: [1],
    });

    expect(result.status).toBe("ALL_COMPLETED");
    expect(result.weakSkill?.skillName).toBe("TypeScript");
    expect(result.recommendedStep?.stepNumber).toBe(1);
    expect(result.recommendedStep?.isCompleted).toBe(true);
  });

  it("returns NO_MAPPED_STEP state when no roadmap step maps to the weak skill", () => {
    const weakSkills: AssessmentWeakSkill[] = [
      {
        skillId: 99,
        skillName: "GraphQL",
        score: 25,
        level: 1,
        label: "Beginner",
        isIndustryRequired: true,
        isHighPriority: true,
        completedAt: new Date().toISOString(),
      },
    ];

    const result = resolveAdaptiveLearningRecommendation({
      weakSkills,
      phases: samplePhases,
      completedStepNumbers: [],
    });

    expect(result.status).toBe("NO_MAPPED_STEP");
    expect(result.weakSkill?.skillName).toBe("GraphQL");
    expect(result.recommendedStep).toBeNull();
  });
});
