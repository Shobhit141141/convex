import { describe, it, expect } from "vitest";
import { calculateRubricV2 } from "@/features/scoring/rubric-v2";
import { deterministicClassify } from "@/features/ai/classifier";
import {
  homepageFixture,
  hrFunctionalFixture,
  christusWebinarFixture
} from "../fixtures/classification-fixtures";
import { PageSignals } from "@/types/analysis";

describe("Rubric v2 Scoring Engine", () => {
  const sampleSignals: PageSignals = {
    url: "https://leena.ai/function/hr",
    title: "Universal HR Assistant",
    metaDescription: "HR automation in 45 days",
    headings: {
      h1: ["Automate HR Requests"],
      h2: ["Integrations", "Outcomes"]
    },
    wordCount: 800,
    hasViewportMeta: true,
    performance: {
      mobileLighthouseScore: 80,
      lcpSeconds: 2.1,
      cls: 0.04,
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
      hasConcreteOutcome: true,
      concreteOutcomeQuote: "70% tickets resolved",
      isLowJargon: true
    },
    trust: {
      logoCount: 8,
      detectedLogos: ["Workday", "SAP", "ServiceNow"],
      complianceCertifications: ["SOC 2", "ISO 27001", "HIPAA"],
      hasQuantifiedCaseStudy: true,
      quantifiedCaseStudyQuote: "Saved 10,000 hours"
    }
  };

  it("calculates deterministic score separated into Tier A (Quality) and Tier B (Readiness)", () => {
    const classification = deterministicClassify(hrFunctionalFixture);
    const result = calculateRubricV2(sampleSignals, classification);

    expect(result.rubricVersion).toBe("v2");
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);

    expect(result.tierScores.quality.maxScore).toBe(60);
    expect(result.tierScores.readiness.maxScore).toBe(40);
    expect(result.tierScores.quality.score + result.tierScores.readiness.score).toBe(result.totalScore);
  });

  it("weights compliance certifications heavily for Enterprise audiences and marks them not_applicable for educational resources", () => {
    const enterpriseClassification = deterministicClassify(homepageFixture);
    const enterpriseResult = calculateRubricV2(sampleSignals, enterpriseClassification);

    const trustCatEnterprise = enterpriseResult.categories.find(c => c.id === "trust_credibility");
    const complianceEnterprise = trustCatEnterprise?.signals.find(s => s.id === "trust_compliance_security");
    expect(complianceEnterprise?.status).toBe("passed");
    expect(complianceEnterprise?.weight).toBeGreaterThan(0);

    // Webinar / educational resource
    const webinarClassification = deterministicClassify(christusWebinarFixture);
    const webinarResult = calculateRubricV2(sampleSignals, webinarClassification);

    const trustCatWebinar = webinarResult.categories.find(c => c.id === "trust_credibility");
    const complianceWebinar = trustCatWebinar?.signals.find(s => s.id === "trust_compliance_security");
    expect(complianceWebinar?.status).toBe("not_applicable");
    expect(complianceWebinar?.weight).toBe(0);
  });

  it("de-duplicates performance metrics and prevents triple-counting", () => {
    const classification = deterministicClassify(homepageFixture);
    const result = calculateRubricV2(sampleSignals, classification);

    const perfCat = result.categories.find(c => c.id === "performance_ux");
    expect(perfCat?.weight).toBe(15);

    // Has LCP (6) + CLS (5) + Viewport (4) = 15. No overlapping Lighthouse overall score!
    const signalIds = perfCat?.signals.map(s => s.id);
    expect(signalIds).toEqual(["perf_lcp_speed", "perf_cls_stability", "ux_mobile_responsiveness"]);
  });

  it("correctly scores all three Leena AI benchmark pages within realistic bounds", () => {
    const homeClass = deterministicClassify(homepageFixture);
    const hrClass = deterministicClassify(hrFunctionalFixture);
    const webinarClass = deterministicClassify(christusWebinarFixture);

    const homeScore = calculateRubricV2(sampleSignals, homeClass);
    const hrScore = calculateRubricV2(sampleSignals, hrClass);
    const webinarScore = calculateRubricV2(sampleSignals, webinarClass);

    expect(homeScore.totalScore).toBeGreaterThan(80);
    expect(hrScore.totalScore).toBeGreaterThan(80);
    expect(webinarScore.totalScore).toBeGreaterThan(80);
  });
});
