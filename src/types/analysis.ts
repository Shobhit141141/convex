export interface PageSignals {
  url: string;
  title: string;
  metaDescription: string;
  headings: {
    h1: string[];
    h2: string[];
  };
  wordCount: number;
  hasViewportMeta: boolean;
  performance: {
    mobileLighthouseScore: number; // 0-100
    lcpSeconds: number;
    cls: number;
    fcpSeconds: number;
    source: "pagespeed_api" | "estimated";
  };
  conversion: {
    hasAboveTheFoldCta: boolean;
    primaryCtaText: string;
    isActionOrientedCta: boolean;
    leadCaptureEngine: boolean; // form, hubspot, marketo, modal
    leadCaptureType: string;
    formFieldCount?: number;
    clarityOfNextStep: boolean;
  };
  clarity: {
    hasClearH1: boolean;
    hasProblemStatement: boolean;
    problemStatementQuote?: string;
    hasConcreteOutcome: boolean;
    concreteOutcomeQuote?: string;
    isLowJargon: boolean;
  };
  trust: {
    logoCount: number;
    detectedLogos: string[];
    complianceCertifications: string[]; // SOC2, ISO27001, GDPR, HIPAA
    hasQuantifiedCaseStudy: boolean;
    quantifiedCaseStudyQuote?: string;
  };
}

export interface ScoreItem {
  id: string;
  name: string;
  earned: number;
  maxPoints: number;
  passed: boolean;
  evidence: string;
  rationale: string;
}

export interface CategoryScore {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  weight: number;
  items: ScoreItem[];
}

export interface EvaluationResult {
  url: string;
  totalScore: number; // 0 - 100
  rubricVersion: "v1" | "v2";
  detectedAudience?: string;
  categories: CategoryScore[];
  evaluatedAt: string;
}
