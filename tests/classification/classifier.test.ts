import { describe, it, expect } from "vitest";
import { classifyPage, deterministicClassify, AIClassifierClient } from "@/features/ai/classifier";
import {
  homepageFixture,
  hrFunctionalFixture,
  christusWebinarFixture,
  ambiguousPageFixture,
  conflictingUrlPageFixture,
  missingCtaPageFixture,
  multipleCtasPageFixture,
  missingAudienceFixture
} from "../fixtures/classification-fixtures";
import { PageClassificationSchema } from "@/types/classification-schema";

describe("Page Classification System", () => {
  describe("Benchmark Leena AI Pages", () => {
    it("correctly classifies the Leena AI Homepage", async () => {
      const result = await classifyPage(homepageFixture);

      expect(result.pageType).toBe("homepage");
      expect(result.visitorIntent).toBe("discovery");
      expect(result.conversionObjectives.primary).toBe("Enterprise platform discovery and demo booking");
      expect(result.primaryCTA?.text).toBe("Book a demo");
      expect(result.targetAudience.segments).toContain("Enterprise");
      expect(result.targetAudience.roles).toEqual(expect.arrayContaining(["IT Leadership", "HR Leadership", "Finance Leadership"]));
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.evidence.length).toBeGreaterThan(0);

      // Verify schema compliance
      expect(PageClassificationSchema.safeParse(result).success).toBe(true);
    });

    it("correctly classifies the Leena AI HR Functional Page", async () => {
      const result = await classifyPage(hrFunctionalFixture);

      expect(result.pageType).toBe("functional");
      expect(result.visitorIntent).toBe("consideration");
      expect(result.conversionObjectives.primary).toBe("Functional solution evaluation and demo booking");
      expect(result.primaryCTA?.text).toBe("Book a demo");
      expect(result.targetAudience.roles).toContain("HR Leadership");
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.evidence.some(e => e.excerpt.includes("Most HR requests shouldn't reach a human"))).toBe(true);

      expect(PageClassificationSchema.safeParse(result).success).toBe(true);
    });

    it("correctly classifies the Christus Health Webinar Page", async () => {
      const result = await classifyPage(christusWebinarFixture);

      expect(result.pageType).toBe("resource");
      expect(result.visitorIntent).toBe("education");
      expect(result.conversionObjectives.primary).toBe("Educational content consumption and webinar access");
      expect(result.primaryCTA?.text).toBe("Watch now");
      expect(result.targetAudience.industries).toContain("Healthcare");
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.evidence.some(e => e.excerpt.includes("Primary CTA: \"Watch now\""))).toBe(true);

      expect(PageClassificationSchema.safeParse(result).success).toBe(true);
    });
  });

  describe("Edge Cases & Robustness", () => {
    it("returns 'unknown' classification when page evidence is missing or ambiguous", async () => {
      const result = await classifyPage(ambiguousPageFixture);

      expect(result.pageType).toBe("unknown");
      expect(result.visitorIntent).toBe("unknown");
      expect(result.confidence).toBeLessThanOrEqual(0.3);
      expect(result.evidence.some(e => e.excerpt.includes("Insufficient evidence"))).toBe(true);
      expect(PageClassificationSchema.safeParse(result).success).toBe(true);
    });

    it("prioritizes content over URL path when signals conflict, penalizing confidence", async () => {
      const result = await classifyPage(conflictingUrlPageFixture);

      // URL path has /resources/webinar, but H1 and body are pricing plans
      expect(result.pageType).toBe("product");
      expect(result.visitorIntent).toBe("high_intent");
      expect(result.confidence).toBeLessThan(0.8); // Confidence penalized for signal conflict
      expect(result.evidence.some(e => e.excerpt.includes("Conflicting signals"))).toBe(true);
      expect(PageClassificationSchema.safeParse(result).success).toBe(true);
    });

    it("handles pages with missing CTAs without breaking", async () => {
      const result = await classifyPage(missingCtaPageFixture);

      expect(result.primaryCTA).toBeUndefined();
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(PageClassificationSchema.safeParse(result).success).toBe(true);
    });

    it("extracts highest-intent primary CTA when multiple buttons are present", async () => {
      const result = await classifyPage(multipleCtasPageFixture);

      // Multiple CTAs: Book a demo, Watch product tour, Talk to sales
      expect(result.primaryCTA?.text).toBe("Book a demo");
      expect(result.primaryCTA?.action).toBe("Book a sales demo");
      expect(PageClassificationSchema.safeParse(result).success).toBe(true);
    });

    it("handles missing audience gracefully without inventing roles", async () => {
      const result = await classifyPage(missingAudienceFixture);

      expect(result.targetAudience.roles).toHaveLength(0);
      expect(result.targetAudience.industries).toHaveLength(0);
      expect(PageClassificationSchema.safeParse(result).success).toBe(true);
    });

    it("falls back to deterministic classification if AI client returns invalid schema", async () => {
      const invalidAiClient: AIClassifierClient = {
        classify: async () => ({
          pageType: "completely_invalid_type",
          confidence: "not_a_number"
        })
      };

      const result = await classifyPage(homepageFixture, invalidAiClient);

      // Gracefully falls back to deterministic result and passes Zod schema
      expect(result.pageType).toBe("homepage");
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(PageClassificationSchema.safeParse(result).success).toBe(true);
    });

    it("falls back to deterministic classification if AI client throws an error", async () => {
      const failingAiClient: AIClassifierClient = {
        classify: async () => {
          throw new Error("AI provider rate limited or network failure");
        }
      };

      const result = await classifyPage(hrFunctionalFixture, failingAiClient);

      expect(result.pageType).toBe("functional");
      expect(result.conversionObjectives.primary).toContain("Functional solution evaluation");
      expect(PageClassificationSchema.safeParse(result).success).toBe(true);
    });
  });
});
