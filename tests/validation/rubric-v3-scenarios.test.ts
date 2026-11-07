import { describe, it, expect } from "vitest";
import { calculateRubricV3 } from "@/features/scoring/rubric-v3";
import { PageSignals } from "@/types/analysis";
import { PageClassification } from "@/types/classification-schema";
import { SemanticEvaluation } from "@/features/ai/semantic-evaluator";
import { ConversionVerificationResult } from "@/features/browser/interaction-verifier";

function createMockSignals(overrides: Partial<PageSignals> = {}): PageSignals {
  return {
    url: "https://example.com/test",
    title: "Test Platform",
    metaDescription: "Test Meta Description",
    headings: { h1: ["Test Heading"], h2: ["Subheading 1"] },
    wordCount: 350,
    hasViewportMeta: true,
    performance: {
      mobileLighthouseScore: 85,
      lcpSeconds: 2.1,
      cls: 0.05,
      fcpSeconds: 1.2,
      source: "pagespeed_api"
    },
    conversion: {
      hasAboveTheFoldCta: true,
      primaryCtaText: "Book a demo",
      isActionOrientedCta: true,
      leadCaptureEngine: true,
      leadCaptureType: "hubspot_script",
      formFieldCount: 4,
      clarityOfNextStep: true
    },
    clarity: {
      hasClearH1: true,
      hasProblemStatement: true,
      problemStatementQuote: "Projects die without automation.",
      hasConcreteOutcome: true,
      concreteOutcomeQuote: "70% tickets auto-resolved",
      isLowJargon: true
    },
    trust: {
      logoCount: 5,
      detectedLogos: ["Google", "Nike", "Sony"],
      complianceCertifications: ["SOC2"],
      hasQuantifiedCaseStudy: true,
      quantifiedCaseStudyQuote: "Saved 400 hours"
    },
    ...overrides
  };
}

function createMockClassification(overrides: Partial<PageClassification> = {}): PageClassification {
  return {
    pageType: "functional",
    targetAudience: {
      segments: ["Enterprise"],
      roles: ["CHRO", "VP HR"],
      industries: ["Technology"]
    },
    conversionObjectives: {
      primary: "Book a demo",
      secondary: ["Contact sales"]
    },
    primaryCTA: {
      text: "Book a demo",
      action: "Opens demo booking form"
    },
    visitorIntent: "consideration",
    confidence: 0.9,
    evidence: [{ source: "dom", excerpt: "Automate HR operations" }],
    ...overrides
  };
}

describe("Rubric v3: 16-Scenario Validation Suite", () => {
  // Scenario 1: Excellent visual design, terrible value proposition
  it("Scenario 1: Penalizes terrible value proposition even with good design", () => {
    const signals = createMockSignals();
    const classification = createMockClassification();
    const semanticEval: SemanticEvaluation = {
      audienceProblemFit: { score: 2, specificity: "none", evidence: "Welcome", reasoning: "No problem identified" },
      valuePropositionStrength: { score: 1, statement: "We are the best", hasQuantifiedOutcome: false, hasSpeedToValue: false, evidence: "Best in class", reasoning: "Pure buzzwords" },
      outcomeCredibility: { score: 1, claimTypes: [], hasThirdPartyValidation: false, evidence: "None", reasoning: "No proof" },
      audienceMessageAlignment: { score: 3, targetRole: null, hasRoleSpecificLanguage: false, misalignments: ["Generic"], evidence: "Welcome", reasoning: "Vague" },
      offerAttractiveness: { score: 3, ctaText: "Learn more", ctaRelevanceToAudience: "low", perceivedFriction: "high", evidence: "Learn more", reasoning: "Weak offer" },
      persuasionWeaknesses: ["No value proposition", "Buzzwords only"],
      overallPersuasionGrade: "failed",
      evaluationConfidence: 0.9,
      insufficientEvidence: false
    };

    const result = calculateRubricV3({ signals, classification, semanticEval });
    expect(result.dimensions.persuasion.score).toBeLessThanOrEqual(15); // Out of 50
    expect(result.totalScore).toBeLessThan(60);
  });

  // Scenario 2: Excellent value proposition, no CTA
  it("Scenario 2: Triggers Missing Primary CTA Gate (capped at 20% of Dimension B)", () => {
    const signals = createMockSignals({
      conversion: {
        hasAboveTheFoldCta: false,
        primaryCtaText: "",
        isActionOrientedCta: false,
        leadCaptureEngine: false,
        leadCaptureType: "none",
        clarityOfNextStep: false
      }
    });
    const classification = createMockClassification();
    const result = calculateRubricV3({ signals, classification });

    expect(result.dimensions.execution.gateApplied).toBe(true);
    expect(result.dimensions.execution.score).toBeLessThanOrEqual(7); // 35 * 0.2 = 7 max
    expect(result.gatesTriggered.some(g => g.includes("Missing Primary CTA Gate"))).toBe(true);
  });

  // Scenario 3: Strong proposition, broken lead capture form
  it("Scenario 3: Triggers Broken/Missing Lead Capture Gate (capped at 30% of Dimension B)", () => {
    const signals = createMockSignals({
      conversion: {
        hasAboveTheFoldCta: true,
        primaryCtaText: "Book a demo",
        isActionOrientedCta: true,
        leadCaptureEngine: false, // Broken / missing lead capture
        leadCaptureType: "none",
        clarityOfNextStep: false
      }
    });
    const classification = createMockClassification({
      conversionObjectives: { primary: "Book a demo" }
    });
    const verification: ConversionVerificationResult = {
      ctaFound: true,
      ctaVisible: true,
      ctaClickable: true,
      modalOrNavigation: "error",
      formRendered: false,
      formFieldCount: 0,
      hubspotDetected: false,
      verificationStatus: "failed",
      evidenceNotes: ["Form failed to render on click"]
    };

    const result = calculateRubricV3({ signals, classification, verification });
    expect(result.dimensions.execution.gateApplied).toBe(true);
    expect(result.dimensions.execution.score).toBeLessThanOrEqual(10.5); // 35 * 0.3 = 10.5
    expect(result.gatesTriggered.some(g => g.includes("Lead Capture Gate"))).toBe(true);
  });

  // Scenario 4: Excellent CTA, misleading destination
  it("Scenario 4: Penalizes promise-destination mismatch", () => {
    const signals = createMockSignals({
      conversion: {
        hasAboveTheFoldCta: true,
        primaryCtaText: "Watch now",
        isActionOrientedCta: true,
        leadCaptureEngine: true,
        leadCaptureType: "modal",
        clarityOfNextStep: true
      }
    });
    const classification = createMockClassification({
      pageType: "resource",
      visitorIntent: "education",
      conversionObjectives: { primary: "Watch educational webinar" }
    });
    const verification: ConversionVerificationResult = {
      ctaFound: true,
      ctaVisible: true,
      ctaClickable: true,
      modalOrNavigation: "modal", // Gated sales modal instead of immediate video
      formRendered: true,
      formFieldCount: 5,
      hubspotDetected: true,
      verificationStatus: "partial",
      evidenceNotes: ["Gated behind lead modal"]
    };

    const result = calculateRubricV3({ signals, classification, verification });
    const promiseCriterion = result.dimensions.execution.criteria.find(c => c.id === "exec_promise_destination");
    expect(promiseCriterion?.status).toBe("partial");
    expect(promiseCriterion?.earnedPoints).toBeLessThan(6);
  });

  // Scenario 5: Strong trust logos, but completely unsupported metric claims
  it("Scenario 5: Penalizes unsupported metric claims in outcome credibility", () => {
    const signals = createMockSignals();
    const classification = createMockClassification();
    const semanticEval: SemanticEvaluation = {
      audienceProblemFit: { score: 7, specificity: "moderate", evidence: "Problem", reasoning: "Clear" },
      valuePropositionStrength: { score: 6, statement: "Value", hasQuantifiedOutcome: false, hasSpeedToValue: false, evidence: "Value", reasoning: "OK" },
      outcomeCredibility: { score: 2, claimTypes: [{ text: "10x faster", type: "generic" }], hasThirdPartyValidation: false, evidence: "10x claim without case study", reasoning: "No customer attribution" },
      audienceMessageAlignment: { score: 7, targetRole: "CHRO", hasRoleSpecificLanguage: true, misalignments: [], evidence: "Role", reasoning: "Aligned" },
      offerAttractiveness: { score: 7, ctaText: "Book demo", ctaRelevanceToAudience: "high", perceivedFriction: "low", evidence: "CTA", reasoning: "Good" },
      persuasionWeaknesses: ["Unsupported claims"],
      overallPersuasionGrade: "average",
      evaluationConfidence: 0.85,
      insufficientEvidence: false
    };

    const result = calculateRubricV3({ signals, classification, semanticEval });
    const cred = result.dimensions.persuasion.criteria.find(c => c.id === "persuasion_credibility");
    expect(cred?.earnedPoints).toBeLessThanOrEqual(3);
    expect(cred?.status).toBe("failed");
  });

  // Scenario 6: Generic messaging, highly functional lead capture
  it("Scenario 6: Shows clean dimension separation: low persuasion, high execution", () => {
    const signals = createMockSignals();
    const classification = createMockClassification();
    const semanticEval: SemanticEvaluation = {
      audienceProblemFit: { score: 3, specificity: "vague", evidence: "Work better", reasoning: "Generic" },
      valuePropositionStrength: { score: 3, statement: "Do work", hasQuantifiedOutcome: false, hasSpeedToValue: false, evidence: "Do work", reasoning: "Generic" },
      outcomeCredibility: { score: 3, claimTypes: [], hasThirdPartyValidation: false, evidence: "None", reasoning: "Weak" },
      audienceMessageAlignment: { score: 3, targetRole: null, hasRoleSpecificLanguage: false, misalignments: ["Generic"], evidence: "Work", reasoning: "Generic" },
      offerAttractiveness: { score: 5, ctaText: "Demo", ctaRelevanceToAudience: "moderate", perceivedFriction: "low", evidence: "Demo", reasoning: "Standard" },
      persuasionWeaknesses: ["Generic messaging"],
      overallPersuasionGrade: "weak",
      evaluationConfidence: 0.9,
      insufficientEvidence: false
    };
    const verification: ConversionVerificationResult = {
      ctaFound: true,
      ctaVisible: true,
      ctaClickable: true,
      modalOrNavigation: "modal",
      formRendered: true,
      formFieldCount: 3,
      hubspotDetected: true,
      verificationStatus: "passed",
      evidenceNotes: ["Working 3-field form"]
    };

    const result = calculateRubricV3({ signals, classification, semanticEval, verification });
    expect(result.dimensions.persuasion.percentage).toBeLessThanOrEqual(40);
    expect(result.dimensions.execution.percentage).toBeGreaterThanOrEqual(80);
  });

  // Scenario 7: Strong audience-specific messaging, weak proof
  it("Scenario 7: Awards high audience fit but penalizes low credibility", () => {
    const signals = createMockSignals({
      trust: { logoCount: 0, detectedLogos: [], complianceCertifications: [], hasQuantifiedCaseStudy: false }
    });
    const classification = createMockClassification();
    const semanticEval: SemanticEvaluation = {
      audienceProblemFit: { score: 9, specificity: "high", evidence: "HR tier-1 overload", reasoning: "Acute problem" },
      valuePropositionStrength: { score: 7, statement: "Harrison resolves leave tickets", hasQuantifiedOutcome: false, hasSpeedToValue: true, evidence: "In seconds", reasoning: "Clear" },
      outcomeCredibility: { score: 2, claimTypes: [], hasThirdPartyValidation: false, evidence: "Zero evidence", reasoning: "No customer proof" },
      audienceMessageAlignment: { score: 9, targetRole: "HR Director", hasRoleSpecificLanguage: true, misalignments: [], evidence: "People Ops terminology", reasoning: "Strong fit" },
      offerAttractiveness: { score: 8, ctaText: "Book demo", ctaRelevanceToAudience: "high", perceivedFriction: "low", evidence: "Book demo", reasoning: "Good match" },
      persuasionWeaknesses: ["Lack of case studies"],
      overallPersuasionGrade: "good",
      evaluationConfidence: 0.9,
      insufficientEvidence: false
    };

    const result = calculateRubricV3({ signals, classification, semanticEval });
    const fit = result.dimensions.persuasion.criteria.find(c => c.id === "persuasion_problem_fit");
    const cred = result.dimensions.persuasion.criteria.find(c => c.id === "persuasion_credibility");
    expect(fit?.earnedPoints).toBeGreaterThanOrEqual(8);
    expect(cred?.earnedPoints).toBeLessThanOrEqual(3);
  });

  // Scenario 8: Webinar with immediate content access
  it("Scenario 8: Awards high execution for seamless educational resource", () => {
    const signals = createMockSignals({
      conversion: {
        hasAboveTheFoldCta: true,
        primaryCtaText: "Watch Webinar Recording",
        isActionOrientedCta: true,
        leadCaptureEngine: true,
        leadCaptureType: "embedded_form_tag",
        formFieldCount: 2,
        clarityOfNextStep: true
      }
    });
    const classification = createMockClassification({
      pageType: "resource",
      visitorIntent: "education",
      conversionObjectives: { primary: "Watch webinar recording" }
    });
    const result = calculateRubricV3({ signals, classification });
    expect(result.dimensions.execution.score).toBeGreaterThanOrEqual(25);
  });

  // Scenario 9: Webinar with unexpected sales gate
  it("Scenario 9: Flags friction and mismatch when webinar pushes enterprise demo", () => {
    const signals = createMockSignals({
      conversion: {
        hasAboveTheFoldCta: true,
        primaryCtaText: "Book an enterprise demo",
        isActionOrientedCta: true,
        leadCaptureEngine: true,
        leadCaptureType: "hubspot_script",
        clarityOfNextStep: false
      }
    });
    const classification = createMockClassification({
      pageType: "resource",
      visitorIntent: "education",
      conversionObjectives: { primary: "Consume recorded webinar content" }
    });
    const result = calculateRubricV3({ signals, classification });
    const promiseCriterion = result.dimensions.execution.criteria.find(c => c.id === "exec_promise_destination");
    expect(promiseCriterion?.earnedPoints).toBeLessThanOrEqual(4);
  });

  // Scenario 10: Product page with working trial
  it("Scenario 10: Rewards frictionless working self-serve trial", () => {
    const signals = createMockSignals({
      conversion: {
        hasAboveTheFoldCta: true,
        primaryCtaText: "Start free trial",
        isActionOrientedCta: true,
        leadCaptureEngine: true,
        leadCaptureType: "embedded_form_tag",
        formFieldCount: 2,
        clarityOfNextStep: true
      }
    });
    const classification = createMockClassification({
      pageType: "product",
      visitorIntent: "high_intent",
      conversionObjectives: { primary: "Start free trial" }
    });
    const verification: ConversionVerificationResult = {
      ctaFound: true,
      ctaVisible: true,
      ctaClickable: true,
      modalOrNavigation: "navigation",
      formRendered: true,
      formFieldCount: 2,
      hubspotDetected: false,
      verificationStatus: "passed",
      evidenceNotes: ["Direct signup flow with 2 fields"]
    };

    const result = calculateRubricV3({ signals, classification, verification });
    expect(result.dimensions.execution.score).toBeGreaterThanOrEqual(30);
  });

  // Scenario 11: Homepage competing CTAs
  it("Scenario 11: Deducts when competing CTAs create friction", () => {
    const signals = createMockSignals({
      conversion: {
        hasAboveTheFoldCta: true,
        primaryCtaText: "Learn more",
        isActionOrientedCta: false,
        leadCaptureEngine: true,
        leadCaptureType: "script",
        formFieldCount: 8, // High friction form
        clarityOfNextStep: false
      }
    });
    const classification = createMockClassification({ pageType: "homepage" });
    const result = calculateRubricV3({ signals, classification });
    const friction = result.dimensions.execution.criteria.find(c => c.id === "exec_friction_load");
    expect(friction?.earnedPoints).toBeLessThanOrEqual(3);
  });

  // Scenario 12: No meaningful audience evidence
  it("Scenario 12: Scores audience fit at 0-1 when audience is absent", () => {
    const signals = createMockSignals({
      metaDescription: "",
      headings: { h1: ["Welcome to our website"], h2: [] },
      clarity: {
        hasClearH1: true,
        hasProblemStatement: false,
        hasConcreteOutcome: false,
        isLowJargon: true
      }
    });
    const classification = createMockClassification({
      targetAudience: { segments: [], roles: [], industries: [] }
    });
    const result = calculateRubricV3({ signals, classification });
    const fit = result.dimensions.persuasion.criteria.find(c => c.id === "persuasion_problem_fit");
    expect(fit?.earnedPoints).toBeLessThanOrEqual(1.5);
  });

  // Scenario 13: Incomplete extraction (sparse text)
  it("Scenario 13: Handles sparse extraction safely without crashing", () => {
    const signals = createMockSignals({
      title: "Unknown",
      metaDescription: "",
      wordCount: 30,
      headings: { h1: [], h2: [] },
      clarity: {
        hasClearH1: false,
        hasProblemStatement: false,
        hasConcreteOutcome: false,
        isLowJargon: true
      },
      conversion: {
        hasAboveTheFoldCta: false,
        primaryCtaText: "",
        isActionOrientedCta: false,
        leadCaptureEngine: false,
        leadCaptureType: "none",
        clarityOfNextStep: false
      },
      trust: {
        logoCount: 0,
        detectedLogos: [],
        complianceCertifications: [],
        hasQuantifiedCaseStudy: false
      }
    });
    const classification = createMockClassification({
      pageType: "unknown",
      targetAudience: { segments: [], roles: [], industries: [] },
      conversionObjectives: { primary: "unknown" }
    });
    const result = calculateRubricV3({ signals, classification });
    expect(result.totalScore).toBeDefined();
    expect(result.totalScore).toBeLessThan(35);
  });

  // Scenario 14: Non-applicable criteria does not inflate score
  it("Scenario 14: Score does not artificially inflate when criteria are not applicable", () => {
    const signals = createMockSignals();
    const classification = createMockClassification({ pageType: "resource" });
    const result = calculateRubricV3({ signals, classification });
    // In Rubric v2, this would score 93+ through double normalization
    expect(result.totalScore).toBeLessThanOrEqual(85);
  });

  // Scenario 15: Excellent messaging, poor technical performance
  it("Scenario 15: Confines technical performance penalties to Dimension C", () => {
    const signals = createMockSignals({
      performance: {
        mobileLighthouseScore: 20,
        lcpSeconds: 6.5, // very slow
        cls: 0.45,       // high shift
        fcpSeconds: 4.0,
        source: "pagespeed_api"
      }
    });
    const classification = createMockClassification();
    const semanticEval: SemanticEvaluation = {
      audienceProblemFit: { score: 9, specificity: "high", evidence: "Problem", reasoning: "Strong" },
      valuePropositionStrength: { score: 9, statement: "Great value", hasQuantifiedOutcome: true, hasSpeedToValue: true, evidence: "Metrics", reasoning: "Strong" },
      outcomeCredibility: { score: 9, claimTypes: [{ text: "ROI 4x", type: "verifiable_metric" }], hasThirdPartyValidation: true, evidence: "Customer data", reasoning: "Verified" },
      audienceMessageAlignment: { score: 9, targetRole: "CHRO", hasRoleSpecificLanguage: true, misalignments: [], evidence: "Role", reasoning: "Aligned" },
      offerAttractiveness: { score: 8, ctaText: "Book demo", ctaRelevanceToAudience: "high", perceivedFriction: "low", evidence: "CTA", reasoning: "Strong" },
      persuasionWeaknesses: [],
      overallPersuasionGrade: "excellent",
      evaluationConfidence: 0.95,
      insufficientEvidence: false
    };

    const result = calculateRubricV3({ signals, classification, semanticEval });
    // Dimension A is preserved
    expect(result.dimensions.persuasion.percentage).toBeGreaterThanOrEqual(85);
    // Dimension C takes the hit
    expect(result.dimensions.experience.score).toBeLessThanOrEqual(6); // out of 15
  });

  // Scenario 16: Strong execution, weak persuasion
  it("Scenario 16: Clearly distinguishes strong execution from weak persuasion", () => {
    const signals = createMockSignals();
    const classification = createMockClassification();
    const semanticEval: SemanticEvaluation = {
      audienceProblemFit: { score: 2, specificity: "none", evidence: "None", reasoning: "No problem identified" },
      valuePropositionStrength: { score: 2, statement: "Vague software", hasQuantifiedOutcome: false, hasSpeedToValue: false, evidence: "Vague", reasoning: "Weak" },
      outcomeCredibility: { score: 2, claimTypes: [], hasThirdPartyValidation: false, evidence: "None", reasoning: "No proof" },
      audienceMessageAlignment: { score: 3, targetRole: null, hasRoleSpecificLanguage: false, misalignments: ["No focus"], evidence: "Vague", reasoning: "Unfocused" },
      offerAttractiveness: { score: 4, ctaText: "Sign up", ctaRelevanceToAudience: "moderate", perceivedFriction: "low", evidence: "Sign up", reasoning: "OK button" },
      persuasionWeaknesses: ["Lacks problem definition", "Lacks quantified proof"],
      overallPersuasionGrade: "weak",
      evaluationConfidence: 0.9,
      insufficientEvidence: false
    };
    const verification: ConversionVerificationResult = {
      ctaFound: true,
      ctaVisible: true,
      ctaClickable: true,
      modalOrNavigation: "modal",
      formRendered: true,
      formFieldCount: 2,
      hubspotDetected: true,
      verificationStatus: "passed",
      evidenceNotes: ["Verified 2-field form"]
    };

    const result = calculateRubricV3({ signals, classification, semanticEval, verification });
    expect(result.dimensions.persuasion.percentage).toBeLessThanOrEqual(30);
    expect(result.dimensions.execution.percentage).toBeGreaterThanOrEqual(80);
    expect(result.totalScore).toBeLessThan(65);
  });
});
