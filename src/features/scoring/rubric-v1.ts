import { PageSignals, EvaluationResult, CategoryScore, ScoreItem } from "@/types/analysis";

export function calculateRubricV1(signals: PageSignals): EvaluationResult {
  const performanceItems: ScoreItem[] = [
    {
      id: "perf_lighthouse_mobile",
      name: "Mobile Lighthouse Index",
      maxPoints: 10,
      earned: Math.round((Math.max(0, Math.min(100, signals.performance.mobileLighthouseScore)) / 100) * 10),
      passed: signals.performance.mobileLighthouseScore >= 70,
      evidence: `Mobile Lighthouse score: ${signals.performance.mobileLighthouseScore}/100`,
      rationale: "Overall mobile performance index from Google PageSpeed Insights."
    },
    {
      id: "perf_lcp",
      name: "Largest Contentful Paint (LCP)",
      maxPoints: 7,
      earned: signals.performance.lcpSeconds <= 2.5 ? 7 : signals.performance.lcpSeconds <= 4.0 ? 3 : 0,
      passed: signals.performance.lcpSeconds <= 2.5,
      evidence: `LCP: ${signals.performance.lcpSeconds.toFixed(2)}s (Good <= 2.5s)`,
      rationale: "Perceived load speed of the largest visual block."
    },
    {
      id: "perf_cls",
      name: "Cumulative Layout Shift (CLS)",
      maxPoints: 5,
      earned: signals.performance.cls <= 0.1 ? 5 : signals.performance.cls <= 0.25 ? 2 : 0,
      passed: signals.performance.cls <= 0.1,
      evidence: `CLS: ${signals.performance.cls.toFixed(3)} (Good <= 0.100)`,
      rationale: "Visual stability during page render."
    },
    {
      id: "ux_viewport",
      name: "Mobile Viewport Meta",
      maxPoints: 3,
      earned: signals.hasViewportMeta ? 3 : 0,
      passed: signals.hasViewportMeta,
      evidence: signals.hasViewportMeta ? "Viewport meta tag configured" : "Missing viewport meta tag",
      rationale: "Ensures responsive rendering across mobile devices."
    }
  ];

  const clarityItems: ScoreItem[] = [
    {
      id: "clarity_h1",
      name: "Clear Hero Headline Structure",
      maxPoints: 6,
      earned: signals.clarity.hasClearH1 ? 6 : signals.headings.h1.length > 0 ? 3 : 0,
      passed: signals.clarity.hasClearH1,
      evidence: signals.headings.h1[0] ? `H1: "${signals.headings.h1[0]}"` : "No H1 detected",
      rationale: "Single clear H1 in the hero section."
    },
    {
      id: "clarity_problem",
      name: "Clear Problem Statement",
      maxPoints: 7,
      earned: signals.clarity.hasProblemStatement ? 7 : 0,
      passed: signals.clarity.hasProblemStatement,
      evidence: signals.clarity.problemStatementQuote || "No explicit problem statement identified",
      rationale: "Explicit identification of visitor pain point."
    },
    {
      id: "clarity_outcome",
      name: "Concrete Measurable Outcome",
      maxPoints: 8,
      earned: signals.clarity.hasConcreteOutcome ? 8 : 0,
      passed: signals.clarity.hasConcreteOutcome,
      evidence: signals.clarity.concreteOutcomeQuote || "No quantified outcome cited",
      rationale: "Specific quantifiable business improvement promised."
    },
    {
      id: "clarity_jargon",
      name: "Plain Language vs. Jargon",
      maxPoints: 4,
      earned: signals.clarity.isLowJargon ? 4 : 1,
      passed: signals.clarity.isLowJargon,
      evidence: signals.clarity.isLowJargon ? "Copy uses clear, concrete terminology" : "Heavy abstract buzzwords detected",
      rationale: "Penalizes ungrounded corporate buzzwords."
    }
  ];

  const conversionItems: ScoreItem[] = [
    {
      id: "cta_above_fold",
      name: "Primary CTA in Hero",
      maxPoints: 8,
      earned: signals.conversion.hasAboveTheFoldCta ? 8 : 0,
      passed: signals.conversion.hasAboveTheFoldCta,
      evidence: signals.conversion.hasAboveTheFoldCta ? `CTA found: "${signals.conversion.primaryCtaText}"` : "No above-the-fold CTA",
      rationale: "Immediate action available without scrolling."
    },
    {
      id: "cta_action_verb",
      name: "Action-Oriented CTA Copy",
      maxPoints: 6,
      earned: signals.conversion.isActionOrientedCta ? 6 : 2,
      passed: signals.conversion.isActionOrientedCta,
      evidence: `Button label: "${signals.conversion.primaryCtaText || "None"}"`,
      rationale: "Action verbs (Book, Watch, Start) convert better than generic labels."
    },
    {
      id: "cta_lead_capture",
      name: "Lead Capture Engine Integration",
      maxPoints: 7,
      earned: signals.conversion.leadCaptureEngine ? 7 : 0,
      passed: signals.conversion.leadCaptureEngine,
      evidence: signals.conversion.leadCaptureEngine ? `Lead engine detected: ${signals.conversion.leadCaptureType}` : "No lead engine found",
      rationale: "Verified form, modal dialog, or embedded scheduler."
    },
    {
      id: "cta_next_step",
      name: "Clarity of Next Step",
      maxPoints: 4,
      earned: signals.conversion.clarityOfNextStep ? 4 : 0,
      passed: signals.conversion.clarityOfNextStep,
      evidence: signals.conversion.clarityOfNextStep ? "Next step explicitly described" : "Unclear what occurs after clicking CTA",
      rationale: "Sets user expectation before submitting contact details."
    }
  ];

  const trustItems: ScoreItem[] = [
    {
      id: "trust_logos",
      name: "Enterprise Customer Logos",
      maxPoints: 8,
      earned: signals.trust.logoCount >= 5 ? 8 : signals.trust.logoCount >= 2 ? 5 : signals.trust.logoCount > 0 ? 2 : 0,
      passed: signals.trust.logoCount >= 2,
      evidence: `${signals.trust.logoCount} brand logos detected (${signals.trust.detectedLogos.slice(0, 4).join(", ") || "None"})`,
      rationale: "Social proof via recognizable enterprise customers."
    },
    {
      id: "trust_compliance",
      name: "Security & Compliance Certifications",
      maxPoints: 8,
      earned: signals.trust.complianceCertifications.length >= 2 ? 8 : signals.trust.complianceCertifications.length === 1 ? 4 : 0,
      passed: signals.trust.complianceCertifications.length >= 1,
      evidence: `Certifications found: ${signals.trust.complianceCertifications.join(", ") || "None"}`,
      rationale: "Mandatory qualification requirement for enterprise software."
    },
    {
      id: "trust_case_metrics",
      name: "Quantified Case Study Evidence",
      maxPoints: 9,
      earned: signals.trust.hasQuantifiedCaseStudy ? 9 : 0,
      passed: signals.trust.hasQuantifiedCaseStudy,
      evidence: signals.trust.quantifiedCaseStudyQuote || "No quantified customer metric cited",
      rationale: "Hard customer outcome metrics (e.g. % resolution, hours saved)."
    }
  ];

  const categories: CategoryScore[] = [
    buildCategory("performance_ux", "Performance & UX", 25, performanceItems),
    buildCategory("value_prop_clarity", "Value Proposition & Clarity", 25, clarityItems),
    buildCategory("conversion_path", "Conversion Path & Friction", 25, conversionItems),
    buildCategory("trust_social_proof", "Trust & Social Proof", 25, trustItems)
  ];

  const totalScore = categories.reduce((sum, c) => sum + c.score, 0);

  return {
    url: signals.url,
    totalScore,
    rubricVersion: "v1",
    categories,
    evaluatedAt: new Date().toISOString()
  };
}

function buildCategory(id: string, name: string, weight: number, items: ScoreItem[]): CategoryScore {
  const score = items.reduce((sum, i) => sum + i.earned, 0);
  const maxScore = items.reduce((sum, i) => sum + i.maxPoints, 0);
  const percentage = Math.round((score / maxScore) * 100);

  return {
    id,
    name,
    score,
    maxScore,
    percentage,
    weight,
    items
  };
}
