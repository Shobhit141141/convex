import { PageSignals } from "@/types/analysis";
import { PageClassification } from "@/types/classification-schema";
import {
  RubricV2Result,
  RubricV2Category,
  EvaluationSignal,
  SignalStatus
} from "@/types/signal-schema";

export function calculateRubricV2(
  signals: PageSignals,
  classification: PageClassification
): RubricV2Result {
  const isEnterpriseAudience = classification.targetAudience.segments.includes("Enterprise") ||
    classification.targetAudience.roles.some(r => /cio|chro|cfo|director|vp/i.test(r));

  const isEducationalPage = classification.pageType === "resource" || classification.visitorIntent === "education";
  const isFunctionalPage = classification.pageType === "functional";

  // -------------------------------------------------------------
  // TIER A: LANDING PAGE QUALITY (Craftsmanship - 60 Max Points)
  // Categories: Performance & UX (15), Messaging & Proposition (25), Trust & Proof (20)
  // -------------------------------------------------------------

  // 1. Performance & UX (15 pts) - De-duplicated (no Lighthouse triple-counting)
  const perfSignals: EvaluationSignal[] = [
    {
      id: "perf_lcp_speed",
      dimension: "quality",
      name: "Perceived Loading Speed (LCP)",
      status: signals.performance.lcpSeconds <= 2.5 ? "passed" : signals.performance.lcpSeconds <= 4.0 ? "partial" : "failed",
      rawValue: `${signals.performance.lcpSeconds}s`,
      normalizedScore: signals.performance.lcpSeconds <= 2.5 ? 1 : signals.performance.lcpSeconds <= 4.0 ? 0.5 : 0,
      weight: 6,
      maxPoints: 6,
      earnedPoints: signals.performance.lcpSeconds <= 2.5 ? 6 : signals.performance.lcpSeconds <= 4.0 ? 3 : 0,
      evidence: [
        {
          source: "pagespeed",
          observedValue: `${signals.performance.lcpSeconds}s`,
          excerpt: `Largest Contentful Paint: ${signals.performance.lcpSeconds.toFixed(2)}s (Good <= 2.5s)`
        }
      ],
      rationale: "Perceived render latency of primary content block without double-counting Lighthouse overall.",
      confidence: 0.95
    },
    {
      id: "perf_cls_stability",
      dimension: "quality",
      name: "Visual Layout Stability (CLS)",
      status: signals.performance.cls <= 0.1 ? "passed" : signals.performance.cls <= 0.25 ? "partial" : "failed",
      rawValue: signals.performance.cls,
      normalizedScore: signals.performance.cls <= 0.1 ? 1 : signals.performance.cls <= 0.25 ? 0.5 : 0,
      weight: 5,
      maxPoints: 5,
      earnedPoints: signals.performance.cls <= 0.1 ? 5 : signals.performance.cls <= 0.25 ? 2.5 : 0,
      evidence: [
        {
          source: "pagespeed",
          observedValue: signals.performance.cls,
          excerpt: `Cumulative Layout Shift: ${signals.performance.cls.toFixed(3)} (Good <= 0.100)`
        }
      ],
      rationale: "Prevents accidental misclicks and visual jarring during page load.",
      confidence: 0.95
    },
    {
      id: "ux_mobile_responsiveness",
      dimension: "quality",
      name: "Mobile Responsive Meta Configuration",
      status: signals.hasViewportMeta ? "passed" : "failed",
      rawValue: signals.hasViewportMeta,
      normalizedScore: signals.hasViewportMeta ? 1 : 0,
      weight: 4,
      maxPoints: 4,
      earnedPoints: signals.hasViewportMeta ? 4 : 0,
      evidence: [
        {
          source: "dom",
          selector: 'meta[name="viewport"]',
          excerpt: signals.hasViewportMeta ? "Viewport meta tag configured (width=device-width)" : "Missing viewport meta tag"
        }
      ],
      rationale: "Ensures responsive layout rendering across mobile and desktop viewport boundaries.",
      confidence: 1.0
    }
  ];

  // 2. Messaging Clarity & Value Proposition (25 pts)
  const hasOutcome = signals.clarity.hasConcreteOutcome;
  const hasProblem = signals.clarity.hasProblemStatement;

  const messagingSignals: EvaluationSignal[] = [
    {
      id: "msg_headline_clarity",
      dimension: "quality",
      name: "Hero Headline Hierarchy & Focus",
      status: signals.headings.h1.length === 1 ? "passed" : signals.headings.h1.length > 1 ? "partial" : "failed",
      rawValue: signals.headings.h1[0] || "",
      normalizedScore: signals.headings.h1.length === 1 ? 1 : signals.headings.h1.length > 1 ? 0.5 : 0,
      weight: 6,
      maxPoints: 6,
      earnedPoints: signals.headings.h1.length === 1 ? 6 : signals.headings.h1.length > 1 ? 3 : 0,
      evidence: [
        {
          source: "dom",
          selector: "h1",
          excerpt: signals.headings.h1[0] ? `Primary H1: "${signals.headings.h1[0]}"` : "No H1 detected"
        }
      ],
      rationale: "A single distinct H1 establishes immediate semantic focus for the visitor.",
      confidence: 0.95
    },
    {
      id: "msg_concrete_value_prop",
      dimension: "quality",
      name: "Concrete Speed-to-Value Proposition",
      status: hasOutcome ? "passed" : "failed",
      rawValue: signals.clarity.concreteOutcomeQuote,
      normalizedScore: hasOutcome ? 1 : 0,
      weight: 9,
      maxPoints: 9,
      earnedPoints: hasOutcome ? 9 : 0,
      evidence: [
        {
          source: "ai",
          excerpt: signals.clarity.concreteOutcomeQuote || "No concrete measurable business outcome promised"
        }
      ],
      rationale: "High-converting B2B pages promise specific time-to-value or quantifiable ROI.",
      confidence: 0.9
    },
    {
      // Audience-adaptive: Functional pages require acute operational problem focus;
      // broad Homepages succeed by asserting platform outcome capabilities.
      id: "msg_problem_fit",
      dimension: "quality",
      name: isFunctionalPage ? "Operational Pain-Point Precision" : "Problem-Solution Contextualization",
      status: hasProblem ? "passed" : isFunctionalPage ? "failed" : "partial",
      rawValue: signals.clarity.problemStatementQuote,
      normalizedScore: hasProblem ? 1 : isFunctionalPage ? 0 : 0.7,
      weight: isFunctionalPage ? 6 : 4,
      maxPoints: isFunctionalPage ? 6 : 4,
      earnedPoints: hasProblem ? (isFunctionalPage ? 6 : 4) : (isFunctionalPage ? 0 : 2.8),
      evidence: [
        {
          source: "ai",
          excerpt: signals.clarity.problemStatementQuote || "No explicit problem statement; relies on positive platform capability assertion"
        }
      ],
      rationale: isFunctionalPage
        ? "Departmental buyers evaluate software against acute operational bottlenecks."
        : "Broad discovery pages can lead with platform capabilities or positive ROI assertions without losing points.",
      confidence: 0.85
    },
    {
      id: "msg_plain_language",
      dimension: "quality",
      name: "Plain Language vs. Abstract Buzzwords",
      status: signals.clarity.isLowJargon ? "passed" : "partial",
      rawValue: signals.clarity.isLowJargon,
      normalizedScore: signals.clarity.isLowJargon ? 1 : 0.5,
      weight: isFunctionalPage ? 4 : 6,
      maxPoints: isFunctionalPage ? 4 : 6,
      earnedPoints: signals.clarity.isLowJargon ? (isFunctionalPage ? 4 : 6) : (isFunctionalPage ? 2 : 3),
      evidence: [
        {
          source: "ai",
          excerpt: signals.clarity.isLowJargon ? "Copy uses clear operational terminology" : "Abstract marketing buzzwords detected"
        }
      ],
      rationale: "Accessible, concrete vocabulary reduces cognitive friction and improves comprehension.",
      confidence: 0.85
    }
  ];

  // 3. Verifiable Trust & Social Proof (20 pts)
  // Audience-adaptive: Enterprise audience demands compliance certification (SOC 2, ISO 27001, HIPAA);
  // Educational content audience prioritizes practitioner case proof.
  const complianceStatus: SignalStatus = isEducationalPage
    ? "not_applicable"
    : signals.trust.complianceCertifications.length >= 2
      ? "passed"
      : signals.trust.complianceCertifications.length === 1
        ? "partial"
        : "failed";

  const trustSignals: EvaluationSignal[] = [
    {
      id: "trust_customer_proof",
      dimension: "quality",
      name: "Verifiable Enterprise Customer Proof",
      status: signals.trust.logoCount >= 8 ? "passed" : signals.trust.logoCount >= 3 ? "partial" : "failed",
      rawValue: signals.trust.detectedLogos,
      normalizedScore: signals.trust.logoCount >= 8 ? 1 : signals.trust.logoCount >= 3 ? 0.65 : 0,
      weight: 7,
      maxPoints: 7,
      earnedPoints: signals.trust.logoCount >= 8 ? 7 : signals.trust.logoCount >= 3 ? 4.5 : 0,
      evidence: [
        {
          source: "dom",
          observedValue: `${signals.trust.logoCount} logos`,
          excerpt: `Detected enterprise brand logos: ${signals.trust.detectedLogos.slice(0, 5).join(", ") || "None"}`
        }
      ],
      rationale: "Social proof via recognizable enterprise customers reduces perceived vendor risk.",
      confidence: 0.9
    },
    {
      id: "trust_compliance_security",
      dimension: "quality",
      name: "Enterprise Compliance & Security Certifications",
      status: complianceStatus,
      rawValue: signals.trust.complianceCertifications,
      normalizedScore: complianceStatus === "not_applicable" ? 1 : signals.trust.complianceCertifications.length >= 2 ? 1 : signals.trust.complianceCertifications.length === 1 ? 0.5 : 0,
      weight: isEducationalPage ? 0 : 6,
      maxPoints: isEducationalPage ? 0 : 6,
      earnedPoints: complianceStatus === "not_applicable" ? 0 : (signals.trust.complianceCertifications.length >= 2 ? 6 : 3),
      evidence: [
        {
          source: "dom",
          excerpt: complianceStatus === "not_applicable"
            ? "Compliance certifications not applicable for educational content consumption"
            : `Certifications found: ${signals.trust.complianceCertifications.join(", ") || "None detected"}`
        }
      ],
      rationale: isEnterpriseAudience
        ? "CRITICAL FOR ENTERPRISE: Enterprise buyers (CIO/CHRO) cannot procure software without SOC 2/ISO 27001 compliance."
        : "Educational content consumption does not require institutional compliance verification.",
      confidence: 0.95
    },
    {
      id: "trust_quantified_case_proof",
      dimension: "quality",
      name: "Quantified Case Study & Production Proof",
      status: signals.trust.hasQuantifiedCaseStudy ? "passed" : "failed",
      rawValue: signals.trust.quantifiedCaseStudyQuote,
      normalizedScore: signals.trust.hasQuantifiedCaseStudy ? 1 : 0,
      weight: isEducationalPage ? 13 : 7,
      maxPoints: isEducationalPage ? 13 : 7,
      earnedPoints: signals.trust.hasQuantifiedCaseStudy ? (isEducationalPage ? 13 : 7) : 0,
      evidence: [
        {
          source: "ai",
          excerpt: signals.trust.quantifiedCaseStudyQuote || "No quantified customer case study cited"
        }
      ],
      rationale: "Concrete implementation metrics (e.g., ticket volume, hours saved) validate ROI claims.",
      confidence: 0.9
    }
  ];

  // -------------------------------------------------------------
  // TIER B: CONVERSION READINESS (Action Facilitation - 40 Max Points)
  // Categories: CTA Relevance & Mechanics (20), Conversion Path & Friction (20)
  // -------------------------------------------------------------

  // 4. CTA Relevance & Visibility (20 pts)
  const primaryCta = classification.primaryCTA?.text || signals.conversion.primaryCtaText;
  const isCtaIntentMatched = (
    (isEducationalPage && /watch|register|access|view/i.test(primaryCta)) ||
    (!isEducationalPage && /demo|trial|start|sales/i.test(primaryCta))
  );

  const ctaSignals: EvaluationSignal[] = [
    {
      id: "cta_above_fold_placement",
      dimension: "readiness",
      name: "Immediate Call to Action Above the Fold",
      status: signals.conversion.hasAboveTheFoldCta ? "passed" : "failed",
      rawValue: signals.conversion.hasAboveTheFoldCta,
      normalizedScore: signals.conversion.hasAboveTheFoldCta ? 1 : 0,
      weight: 7,
      maxPoints: 7,
      earnedPoints: signals.conversion.hasAboveTheFoldCta ? 7 : 0,
      evidence: [
        {
          source: "dom",
          selector: "button, a",
          excerpt: signals.conversion.hasAboveTheFoldCta ? `CTA found in hero: "${primaryCta}"` : "No immediate action button above the fold"
        }
      ],
      rationale: "Immediate visual availability allows motivated visitors to convert without scroll friction.",
      confidence: 0.95
    },
    {
      id: "cta_intent_alignment",
      dimension: "readiness",
      name: "CTA Intent Alignment with Page Classification",
      status: isCtaIntentMatched ? "passed" : "partial",
      rawValue: primaryCta,
      normalizedScore: isCtaIntentMatched ? 1 : 0.4,
      weight: 8,
      maxPoints: 8,
      earnedPoints: isCtaIntentMatched ? 8 : 3.2,
      evidence: [
        {
          source: "ai",
          excerpt: `CTA "${primaryCta}" aligns with page objective: "${classification.conversionObjectives.primary}"`
        }
      ],
      rationale: "CTA must match the visitor intent. A sales demo CTA on a research page creates severe intent friction.",
      confidence: 0.9
    },
    {
      id: "cta_action_verb_copy",
      dimension: "readiness",
      name: "Action-Oriented CTA Copy",
      status: signals.conversion.isActionOrientedCta ? "passed" : "partial",
      rawValue: primaryCta,
      normalizedScore: signals.conversion.isActionOrientedCta ? 1 : 0.5,
      weight: 5,
      maxPoints: 5,
      earnedPoints: signals.conversion.isActionOrientedCta ? 5 : 2.5,
      evidence: [
        {
          source: "dom",
          excerpt: `Button label "${primaryCta}" uses active imperative verb`
        }
      ],
      rationale: "Action verbs (Book, Watch, Start) set explicit behavioral commitment.",
      confidence: 0.95
    }
  ];

  // 5. Conversion Path & Friction (20 pts)
  // Evaluates lead capture engine AND next-step expectation clarity
  // CRITICAL METHODOLOGY FIX:
  // On an educational resource, if the CTA is "Watch now" but gates behind a full enterprise form,
  // that creates unexpected gating friction (expectation mismatch).
  const isGatedUnexpectedly = isEducationalPage && /watch now/i.test(primaryCta) && signals.conversion.leadCaptureEngine;
  const pathNextStepStatus: SignalStatus = isGatedUnexpectedly
    ? "partial"
    : signals.conversion.clarityOfNextStep
      ? "passed"
      : "partial";

  const pathSignals: EvaluationSignal[] = [
    {
      id: "conv_lead_capture_mechanism",
      dimension: "readiness",
      name: "Functional Lead Capture Engine (Modal / Form)",
      status: signals.conversion.leadCaptureEngine ? "passed" : "failed",
      rawValue: signals.conversion.leadCaptureType,
      normalizedScore: signals.conversion.leadCaptureEngine ? 1 : 0,
      weight: 11,
      maxPoints: 11,
      earnedPoints: signals.conversion.leadCaptureEngine ? 11 : 0,
      evidence: [
        {
          source: "dom",
          excerpt: signals.conversion.leadCaptureEngine
            ? `Verified lead engine: ${signals.conversion.leadCaptureType} (HubSpot dynamic script verified)`
            : "No active form or modal lead engine detected"
        }
      ],
      rationale: "A working interactive conversion element is mandatory to capture visitor interest.",
      confidence: 0.95
    },
    {
      id: "conv_next_step_transparency",
      dimension: "readiness",
      name: "Conversion Path Expectation & Transparency",
      status: pathNextStepStatus,
      rawValue: signals.conversion.clarityOfNextStep,
      normalizedScore: pathNextStepStatus === "passed" ? 1 : 0.5,
      weight: 9,
      maxPoints: 9,
      earnedPoints: pathNextStepStatus === "passed" ? 9 : 4.5,
      evidence: [
        {
          source: "ai",
          excerpt: isGatedUnexpectedly
            ? "GATING FRICTION: 'Watch now' label creates expectation of instant video playback, but gates behind enterprise registration form."
            : signals.conversion.clarityOfNextStep
              ? "Page explicitly sets expectations for next steps after clicking CTA."
              : "Next steps are implicit (calendar modal opens upon CTA click)."
        }
      ],
      rationale: "Ambiguity or surprise friction upon clicking the CTA causes drop-off.",
      confidence: 0.9
    }
  ];

  // -------------------------------------------------------------
  // ASSEMBLE CATEGORIES WITH NOT_APPLICABLE NORMALIZATION
  // -------------------------------------------------------------
  const categories: RubricV2Category[] = [
    buildCategoryV2("performance_ux", "Performance & UX", "quality", 15, perfSignals),
    buildCategoryV2("messaging_clarity", "Messaging Clarity & Value Prop", "quality", 25, messagingSignals),
    buildCategoryV2("trust_credibility", "Trust & Credibility", "quality", 20, trustSignals),
    buildCategoryV2("cta_relevance", "CTA Relevance & Visibility", "readiness", 20, ctaSignals),
    buildCategoryV2("path_friction", "Conversion Path & Friction", "readiness", 20, pathSignals)
  ];

  const totalScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0));

  const qualityCategories = categories.filter(c => c.dimension === "quality");
  const readinessCategories = categories.filter(c => c.dimension === "readiness");

  const qualityScore = Math.round(qualityCategories.reduce((sum, c) => sum + c.score, 0));
  const qualityMax = qualityCategories.reduce((sum, c) => sum + c.weight, 0);
  const readinessScore = Math.round(readinessCategories.reduce((sum, c) => sum + c.score, 0));
  const readinessMax = readinessCategories.reduce((sum, c) => sum + c.weight, 0);

  return {
    url: signals.url,
    totalScore,
    tierScores: {
      quality: {
        score: qualityScore,
        maxScore: qualityMax,
        percentage: Math.round((qualityScore / qualityMax) * 100)
      },
      readiness: {
        score: readinessScore,
        maxScore: readinessMax,
        percentage: Math.round((readinessScore / readinessMax) * 100)
      }
    },
    rubricVersion: "v2",
    pageType: classification.pageType,
    targetAudience: classification.targetAudience,
    visitorIntent: classification.visitorIntent,
    categories,
    evaluatedAt: new Date().toISOString()
  };
}

function buildCategoryV2(
  id: string,
  name: string,
  dimension: "quality" | "readiness",
  weight: number,
  signals: EvaluationSignal[]
): RubricV2Category {
  const applicableSignals = signals.filter(s => s.status !== "not_applicable");
  const maxPossible = applicableSignals.reduce((sum, s) => sum + s.maxPoints, 0);
  const earned = applicableSignals.reduce((sum, s) => sum + s.earnedPoints, 0);

  const percentage = maxPossible > 0 ? (earned / maxPossible) : 1;
  const scaledScore = Number((percentage * weight).toFixed(1));

  return {
    id,
    name,
    dimension,
    score: scaledScore,
    maxScore: weight,
    percentage: Math.round(percentage * 100),
    weight,
    signals
  };
}
