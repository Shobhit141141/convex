import { describe, it, expect } from "vitest";
import { calculateRubricV1 } from "@/features/scoring/rubric-v1";
import { PageSignals } from "@/types/analysis";

describe("Rubric v1 Scoring Engine", () => {
  const sampleSignals: PageSignals = {
    url: "https://leena.ai/function/hr",
    title: "Universal HR Assistant",
    metaDescription: "HR automation",
    headings: {
      h1: ["Most HR requests shouldn't reach a human"],
      h2: ["Harrison closes requests in seconds"]
    },
    wordCount: 1000,
    hasViewportMeta: true,
    performance: {
      mobileLighthouseScore: 80,
      lcpSeconds: 2.1,
      cls: 0.02,
      fcpSeconds: 1.5,
      source: "pagespeed_api"
    },
    conversion: {
      hasAboveTheFoldCta: true,
      primaryCtaText: "Book a demo",
      isActionOrientedCta: true,
      leadCaptureEngine: true,
      leadCaptureType: "HubSpot Modal",
      clarityOfNextStep: true
    },
    clarity: {
      hasClearH1: true,
      hasProblemStatement: true,
      problemStatementQuote: "HR requests shouldn't reach a human",
      hasConcreteOutcome: true,
      concreteOutcomeQuote: "Closes requests in seconds",
      isLowJargon: true
    },
    trust: {
      logoCount: 6,
      detectedLogos: ["Workday", "SAP"],
      complianceCertifications: ["SOC 2", "ISO 27001"],
      hasQuantifiedCaseStudy: true,
      quantifiedCaseStudyQuote: "70% automated"
    }
  };

  it("calculates a score out of 100 with 4 equal categories", () => {
    const result = calculateRubricV1(sampleSignals);
    expect(result.rubricVersion).toBe("v1");
    expect(result.categories).toHaveLength(4);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);

    const totalCategoryMax = result.categories.reduce((acc, c) => acc + c.maxScore, 0);
    expect(totalCategoryMax).toBe(100);
  });

  it("penalizes poor performance and missing viewport", () => {
    const poorSignals: PageSignals = {
      ...sampleSignals,
      hasViewportMeta: false,
      performance: {
        mobileLighthouseScore: 20,
        lcpSeconds: 5.5,
        cls: 0.35,
        fcpSeconds: 4.2,
        source: "pagespeed_api"
      }
    };
    const result = calculateRubricV1(poorSignals);
    const perfCategory = result.categories.find(c => c.id === "performance_ux");
    expect(perfCategory?.score).toBe(2); // Only Math.round(20/100 * 10) = 2
  });
});
