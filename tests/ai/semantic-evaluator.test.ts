import { describe, it, expect, vi } from "vitest";
import {
  SemanticEvaluator,
  SemanticEvaluationSchema,
  buildSemanticPrompt
} from "@/features/ai/semantic-evaluator";
import { RawPageInput } from "@/types/classification-schema";

describe("SemanticEvaluator Unit Tests", () => {
  const sampleInput: RawPageInput = {
    url: "https://leena.ai/function/hr",
    title: "Universal HR Assistant: Agentic AI for HR Ops | Leena AI",
    metaDescription: "Automates 70%+ of HR tickets - benefits, letters, policy. Live in 45 days.",
    headings: {
      h1: ["Most HR requests shouldn't reach a human. Now they don't."],
      h2: ["Multiple jobs. One AI Colleague. Zero queue."]
    },
    ctas: [{ text: "Book a demo", href: "#", tag: "button" }],
    bodyExcerpt: "Harrison closes Tier-1 HR requests in seconds. Pre-integrated with Workday, SAP."
  };

  it("builds a clean semantic prompt containing key elements", () => {
    const prompt = buildSemanticPrompt(sampleInput);
    expect(prompt).toContain("https://leena.ai/function/hr");
    expect(prompt).toContain("Universal HR Assistant");
    expect(prompt).toContain("Most HR requests shouldn't reach a human");
    expect(prompt).toContain('"Book a demo"');
  });

  it("validates a compliant semantic evaluation JSON response against Zod schema", () => {
    const mockResponse = {
      audienceProblemFit: {
        score: 9,
        specificity: "high",
        identifiedProblem: "HR teams overwhelmed by repetitive tier-1 tickets",
        evidence: "Most HR requests shouldn't reach a human. Now they don't.",
        reasoning: "Explicitly identifies the volume of low-value requests hitting human agents."
      },
      valuePropositionStrength: {
        score: 8,
        statement: "Automates 70%+ of HR tickets; live in 45 days",
        hasQuantifiedOutcome: true,
        hasSpeedToValue: true,
        evidence: "Automates 70%+ of HR tickets - benefits, letters, policy. Live in 45 days.",
        reasoning: "Contains clear quantified outcome and go-live timeframe."
      },
      outcomeCredibility: {
        score: 7,
        claimTypes: [
          { text: "70%+ tickets auto-resolved", type: "company_claim" },
          { text: "Live in 45 days", type: "company_claim" }
        ],
        hasThirdPartyValidation: false,
        evidence: "Automates 70%+ of HR tickets",
        reasoning: "Concrete metrics but mostly company claims rather than customer case studies."
      },
      audienceMessageAlignment: {
        score: 9,
        targetRole: "CHRO / People Ops",
        hasRoleSpecificLanguage: true,
        misalignments: [],
        evidence: "Harrison closes Tier-1 HR requests - leave, letters, benefits, payroll",
        reasoning: "Speaks directly to HR operations vocabulary."
      },
      offerAttractiveness: {
        score: 7,
        ctaText: "Book a demo",
        ctaRelevanceToAudience: "High relevance for enterprise B2B buyer",
        perceivedFriction: "low",
        evidence: "Book a demo",
        reasoning: "Standard enterprise demo offer matching consideration intent."
      },
      persuasionWeaknesses: ["Lacks named customer case study quote on the excerpt"],
      overallPersuasionGrade: "good",
      evaluationConfidence: 0.9,
      insufficientEvidence: false
    };

    const parsed = SemanticEvaluationSchema.safeParse(mockResponse);
    expect(parsed.success).toBe(true);
  });

  it("gracefully falls back to deterministic evaluation when OpenAI API key is missing or call fails", async () => {
    // Instantiate with mock key and mock client that throws
    const evaluator = new SemanticEvaluator("mock-api-key");
    vi.spyOn(evaluator as any, "callModel").mockRejectedValue(new Error("API quota exceeded"));

    const result = await evaluator.evaluate(sampleInput);

    expect(result.usedFallback).toBe(true);
    expect(result.overallPersuasionGrade).toBe("average");
    expect(result.audienceProblemFit.score).toBeGreaterThanOrEqual(1);
    expect(result.persuasionWeaknesses.some(w => w.includes("deterministic fallback"))).toBe(true);
  });
});
