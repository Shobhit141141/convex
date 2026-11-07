import { describe, it, expect, vi } from "vitest";
import { classifyPage, deterministicClassify, AIClassifierClient } from "@/features/ai/classifier";
import { OpenAIClassifier } from "@/features/ai/openai-classifier";
import {
  homepageFixture,
  hrFunctionalFixture,
  christusWebinarFixture,
  ambiguousPageFixture,
  missingAudienceFixture
} from "../fixtures/classification-fixtures";
import { PageClassificationSchema } from "@/types/classification-schema";

describe("OpenAI Provider & Fallback Reliability", () => {
  it("successfully parses and validates valid AI response adhering to PageClassificationSchema", async () => {
    const mockClient: AIClassifierClient = {
      classify: async () => ({
        pageType: "functional",
        targetAudience: {
          segments: ["Enterprise"],
          roles: ["HR Leadership", "People Ops"],
          industries: ["Human Resources"]
        },
        conversionObjectives: {
          primary: "Functional solution evaluation and demo booking",
          secondary: ["Examine tier-1 ticket deflection"]
        },
        primaryCTA: {
          text: "Book a demo",
          action: "Schedule a sales demonstration"
        },
        visitorIntent: "consideration",
        confidence: 0.92,
        evidence: [
          {
            source: "ai",
            excerpt: "Harrison closes Tier-1 HR requests in seconds, not days."
          }
        ],
        businessProblem: {
          identified: true,
          statement: "Most HR requests shouldn't reach a human.",
          specificity: "high",
          evidenceExcerpt: "Most HR requests shouldn't reach a human. Now they don't."
        },
        valueProposition: {
          statement: "Automates 70%+ of HR tickets live in 45 days",
          speedToValueMetric: "45 days",
          quantifiableRoi: "4-10x ROI",
          evidenceExcerpt: "Live in 45 days. 70%+ tickets auto-resolved."
        },
        messagingQuality: {
          clarityScore: 9,
          isLowJargon: true,
          summary: "Highly operational copy focused on HR deflection."
        },
        ctaAnalysis: {
          primaryText: "Book a demo",
          action: "Book a demo",
          relevanceToAudience: "High relevance for enterprise evaluation",
          frictionLevel: "medium"
        }
      })
    };

    const result = await classifyPage(hrFunctionalFixture, mockClient);
    expect(result.pageType).toBe("functional");
    expect(result.confidence).toBe(0.92);
    expect(result.businessProblem?.identified).toBe(true);
    expect(result.valueProposition?.speedToValueMetric).toBe("45 days");
    expect(PageClassificationSchema.safeParse(result).success).toBe(true);
  });

  it("gracefully falls back to deterministic classification when OpenAI returns invalid JSON schema", async () => {
    const invalidMockClient: AIClassifierClient = {
      classify: async () => ({
        pageType: "INVALID_PAGE_TYPE_THAT_DOES_NOT_EXIST",
        confidence: "NOT_A_NUMBER",
        targetAudience: "Not an object"
      })
    };

    const result = await classifyPage(homepageFixture, invalidMockClient);
    expect(result.pageType).toBe("homepage"); // Deterministic fallback
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    expect(PageClassificationSchema.safeParse(result).success).toBe(true);
  });

  it("gracefully falls back to deterministic classification when OpenAI throws a network error or timeout", async () => {
    const errorMockClient: AIClassifierClient = {
      classify: async () => {
        throw new Error("504 Gateway Timeout: OpenAI upstream failed");
      }
    };

    const result = await classifyPage(christusWebinarFixture, errorMockClient);
    expect(result.pageType).toBe("resource");
    expect(result.visitorIntent).toBe("education");
    expect(PageClassificationSchema.safeParse(result).success).toBe(true);
  });

  it("gracefully falls back when OpenAI hits rate limit (429 Too Many Requests)", async () => {
    const rateLimitMockClient: AIClassifierClient = {
      classify: async () => {
        const error = new Error("429 Rate limit exceeded. Please try again later.");
        (error as unknown as { status: number }).status = 429;
        throw error;
      }
    };

    const result = await classifyPage(hrFunctionalFixture, rateLimitMockClient);
    expect(result.pageType).toBe("functional");
    expect(result.conversionObjectives.primary).toContain("Functional solution evaluation");
    expect(PageClassificationSchema.safeParse(result).success).toBe(true);
  });

  it("returns 'unknown' classification when page has insufficient content even with deterministic fallback", async () => {
    const failingAiClient: AIClassifierClient = {
      classify: async () => {
        throw new Error("AI call skipped for empty content");
      }
    };

    const result = await classifyPage(ambiguousPageFixture, failingAiClient);
    expect(result.pageType).toBe("unknown");
    expect(result.confidence).toBeLessThanOrEqual(0.3);
    expect(PageClassificationSchema.safeParse(result).success).toBe(true);
  });

  it("ensures OpenAIClassifier constructor throws clear error when OPENAI_API_KEY is missing", () => {
    const oldKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    expect(() => new OpenAIClassifier("")).toThrow("OpenAI API key missing");

    if (oldKey) process.env.OPENAI_API_KEY = oldKey;
  });
});
