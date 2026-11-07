/**
 * rubric-v3.ts
 *
 * Rubric v3: Purpose-built Landing Page Evaluation Engine.
 * Evaluates: Given an intended visitor with relevant intent, how effectively
 * does this page persuade them to complete its primary conversion action?
 *
 * Dimensions:
 * - Dimension A: Conversion Persuasion (50 pts) - AI semantic evaluation
 * - Dimension B: Conversion Execution (35 pts) - Interactivity, CTA, lead capture
 * - Dimension C: Supporting Experience (15 pts) - Core web vitals & readability
 *
 * Total Max Score: 100 points
 */

import { PageSignals } from "@/types/analysis";
import { PageClassification } from "@/types/classification-schema";
import { SemanticEvaluation } from "@/features/ai/semantic-evaluator";
import { ConversionVerificationResult } from "@/features/browser/interaction-verifier";
import {
  RubricV3Result,
  V3CriterionScore,
  V3DimensionSummary
} from "@/types/rubric-v3-schema";

export interface RubricV3Input {
  signals: PageSignals;
  classification: PageClassification;
  semanticEval?: SemanticEvaluation;
  verification?: ConversionVerificationResult;
}

export function calculateRubricV3(input: RubricV3Input): RubricV3Result {
  const { signals, classification, semanticEval, verification } = input;

  const gatesTriggered: string[] = [];
  const persuasionWeaknesses: string[] = semanticEval?.persuasionWeaknesses || [];
  const conversionBlockers: string[] = [];

  // =========================================================================
  // DIMENSION A: CONVERSION PERSUASION (50 Points Max)
  // Graded evaluation powered by AI semantic analysis or deterministic fallback
  // =========================================================================
  const persuasionCriteria: V3CriterionScore[] = [];

  // A1: Audience-Problem Fit (10 pts)
  {
    const max = 10;
    let earned = 0;
    let status: V3CriterionScore["status"] = "failed";
    let rule = "Evaluated via semantic problem identification and specificity.";
    let notes: string | undefined;
    let checks: { label: string; passed: boolean }[] | undefined;
    let evidence = "No problem statement detected.";

    if (semanticEval) {
      const { score, specificity, identifiedProblem, evidence: ev, reasoning } = semanticEval.audienceProblemFit;
      evidence = ev || identifiedProblem || "No explicit problem quote.";
      rule = `Model rating ${score}/10, scaled to ${max} pts`;
      notes = reasoning;
      checks = [{ label: `Specificity: ${specificity}`, passed: specificity === "high" }, { label: "Problem identified", passed: !!identifiedProblem }];
      earned = Math.min(max, Math.round((score / 10) * max * 10) / 10);
      status = earned >= 8 ? "passed" : earned >= 4 ? "partial" : "failed";
    } else {
      // Deterministic fallback
      if (signals.clarity.hasProblemStatement) {
        earned = 6;
        status = "partial";
        evidence = signals.clarity.problemStatementQuote || "Problem statement detected in text";
        rule = "Deterministic: Problem statement detected without semantic specificity rating.";
      } else {
        earned = 1;
        status = "failed";
        evidence = signals.metaDescription || "No explicit problem statement";
        rule = "Deterministic: No problem statement found in headings or meta.";
      }
    }

    persuasionCriteria.push({
      id: "persuasion_problem_fit",
      name: "Audience-Problem Fit & Specificity",
      dimension: "persuasion",
      status,
      maxPoints: max,
      earnedPoints: earned,
      evidence,
      scoringRule: rule,
      notes,
      checks,
      confidence: semanticEval ? semanticEval.evaluationConfidence : 0.6,
      source: semanticEval ? "ai_semantic" : "dom_extraction"
    });
  }

  // A2: Value Proposition Strength (12 pts)
  {
    const max = 12;
    let earned = 0;
    let status: V3CriterionScore["status"] = "failed";
    let rule = "Value prop clarity, speed-to-value, and quantified outcome.";
    let notes: string | undefined;
    let checks: { label: string; passed: boolean }[] | undefined;
    let evidence = signals.title;

    if (semanticEval) {
      const { score, statement, hasQuantifiedOutcome, hasSpeedToValue, evidence: ev, reasoning } = semanticEval.valuePropositionStrength;
      evidence = ev || statement || signals.title;
      rule = `Model rating ${score}/10, scaled to ${max} pts`;
      notes = reasoning;
      checks = [{ label: "Quantified outcome", passed: !!hasQuantifiedOutcome }, { label: "Speed-to-value stated", passed: !!hasSpeedToValue }];
      earned = Math.min(max, Math.round((score / 10) * max * 10) / 10);
      status = earned >= 9 ? "passed" : earned >= 5 ? "partial" : "failed";
    } else {
      let pts = 0;
      if (signals.clarity.hasConcreteOutcome) pts += 6;
      if (signals.clarity.hasClearH1) pts += 3;
      earned = pts;
      status = pts >= 8 ? "passed" : pts >= 4 ? "partial" : "failed";
      evidence = signals.clarity.concreteOutcomeQuote || signals.headings.h1[0] || signals.title;
      rule = "Deterministic: Evaluated based on concrete outcome quote and clear H1 presence.";
    }

    persuasionCriteria.push({
      id: "persuasion_value_prop",
      name: "Value Proposition Strength & Speed-to-Value",
      dimension: "persuasion",
      status,
      maxPoints: max,
      earnedPoints: earned,
      evidence,
      scoringRule: rule,
      notes,
      checks,
      confidence: semanticEval ? semanticEval.evaluationConfidence : 0.65,
      source: semanticEval ? "ai_semantic" : "dom_extraction"
    });
  }

  // A3: Outcome Credibility & Verifiable Proof (10 pts)
  {
    const max = 10;
    let earned = 0;
    let status: V3CriterionScore["status"] = "failed";
    let rule = "Customer-attributed metrics vs generic company claims.";
    let notes: string | undefined;
    let checks: { label: string; passed: boolean }[] | undefined;
    let evidence = "No customer evidence found.";

    if (semanticEval) {
      const { score, claimTypes, hasThirdPartyValidation, evidence: ev, reasoning } = semanticEval.outcomeCredibility;
      evidence = ev || (claimTypes[0]?.text ?? "No verified claims.");
      rule = `Model rating ${score}/10, scaled to ${max} pts`;
      notes = reasoning;
      checks = [{ label: "Third-party validation", passed: !!hasThirdPartyValidation }, { label: "Customer examples or verifiable metrics", passed: claimTypes.some((c: any) => c.type === "customer_example" || c.type === "verifiable_metric") }];
      earned = Math.min(max, Math.round((score / 10) * max * 10) / 10);
      status = earned >= 8 ? "passed" : earned >= 4 ? "partial" : "failed";
    } else {
      if (signals.trust.hasQuantifiedCaseStudy) {
        earned = 7;
        status = "partial";
        evidence = signals.trust.quantifiedCaseStudyQuote || "Quantified case study detected";
        rule = "Deterministic: Quantified customer story present.";
      } else if (signals.trust.logoCount >= 3) {
        earned = 4;
        status = "partial";
        evidence = `${signals.trust.logoCount} logos detected: ${signals.trust.detectedLogos.join(", ")}`;
        rule = "Deterministic: Logo wall detected but lacking customer-attributed metric.";
      } else {
        earned = 1;
        status = "failed";
        evidence = "No case study or customer logos detected";
        rule = "Deterministic: Missing verifiable customer proof.";
      }
    }

    persuasionCriteria.push({
      id: "persuasion_credibility",
      name: "Outcome Credibility & Verifiable Proof",
      dimension: "persuasion",
      status,
      maxPoints: max,
      earnedPoints: earned,
      evidence,
      scoringRule: rule,
      notes,
      checks,
      confidence: semanticEval ? semanticEval.evaluationConfidence : 0.6,
      source: semanticEval ? "ai_semantic" : "dom_extraction"
    });
  }

  // A4: Audience-Message Alignment (10 pts)
  {
    const max = 10;
    let earned = 0;
    let status: V3CriterionScore["status"] = "failed";
    let rule = "Role-specific workflow language and audience alignment.";
    let notes: string | undefined;
    let checks: { label: string; passed: boolean }[] | undefined;
    let evidence = classification.targetAudience.roles.join(", ") || "General enterprise";

    if (semanticEval) {
      const { score, targetRole, hasRoleSpecificLanguage, misalignments, evidence: ev, reasoning } = semanticEval.audienceMessageAlignment;
      evidence = ev || `Role: ${targetRole || "general"}. Misalignments: ${misalignments.join("; ") || "none"}`;
      rule = `Model rating ${score}/10, scaled to ${max} pts`;
      notes = reasoning;
      checks = [{ label: "Role-specific language", passed: !!hasRoleSpecificLanguage }, { label: "No audience misalignment", passed: misalignments.length === 0 }];
      earned = Math.min(max, Math.round((score / 10) * max * 10) / 10);
      status = earned >= 8 ? "passed" : earned >= 4 ? "partial" : "failed";
    } else {
      const hasRoles = classification.targetAudience.roles.length > 0;
      earned = hasRoles ? 7 : 4;
      status = hasRoles ? "passed" : "partial";
      evidence = hasRoles
        ? `Roles identified: ${classification.targetAudience.roles.join(", ")}`
        : "Generic enterprise audience";
      rule = hasRoles
        ? "Deterministic: Distinct target roles found in classification."
        : "Deterministic: General enterprise audience without role personalization.";
    }

    persuasionCriteria.push({
      id: "persuasion_audience_alignment",
      name: "Audience-Message Alignment",
      dimension: "persuasion",
      status,
      maxPoints: max,
      earnedPoints: earned,
      evidence,
      scoringRule: rule,
      notes,
      checks,
      confidence: semanticEval ? semanticEval.evaluationConfidence : 0.65,
      source: semanticEval ? "ai_semantic" : "dom_extraction"
    });
  }

  // A5: Offer Attractiveness & CTA Problem Match (8 pts)
  {
    const max = 8;
    let earned = 0;
    let status: V3CriterionScore["status"] = "failed";
    let rule = "CTA relevance to problem solved and perceived friction.";
    let notes: string | undefined;
    let checks: { label: string; passed: boolean }[] | undefined;
    let evidence = signals.conversion.primaryCtaText || "No CTA";

    if (semanticEval) {
      const { score, ctaText, ctaRelevanceToAudience, perceivedFriction, evidence: ev, reasoning } = semanticEval.offerAttractiveness;
      evidence = ev || `CTA: "${ctaText}". Relevance: ${ctaRelevanceToAudience} (friction: ${perceivedFriction})`;
      rule = `Model rating ${score}/10, scaled to ${max} pts`;
      notes = reasoning;
      checks = [{ label: `Perceived friction: ${perceivedFriction}`, passed: perceivedFriction === "low" }, { label: `CTA relevance: ${ctaRelevanceToAudience}`, passed: ctaRelevanceToAudience === "high" }];
      earned = Math.min(max, Math.round((score / 10) * max * 10) / 10);
      status = earned >= 6 ? "passed" : earned >= 3 ? "partial" : "failed";
    } else {
      if (signals.conversion.hasAboveTheFoldCta && signals.conversion.isActionOrientedCta) {
        earned = 6;
        status = "passed";
        evidence = `Action-oriented CTA: "${signals.conversion.primaryCtaText}"`;
        rule = "Deterministic: Action-oriented primary CTA above fold.";
      } else if (signals.conversion.hasAboveTheFoldCta) {
        earned = 3;
        status = "partial";
        evidence = `Generic CTA: "${signals.conversion.primaryCtaText}"`;
        rule = "Deterministic: CTA present but not strongly action-oriented.";
      } else {
        earned = 0;
        status = "failed";
        evidence = "No CTA detected";
        rule = "Deterministic: Missing primary CTA.";
      }
    }

    persuasionCriteria.push({
      id: "persuasion_offer_attractiveness",
      name: "Offer Attractiveness & Problem Match",
      dimension: "persuasion",
      status,
      maxPoints: max,
      earnedPoints: earned,
      evidence,
      scoringRule: rule,
      notes,
      checks,
      confidence: semanticEval ? semanticEval.evaluationConfidence : 0.7,
      source: semanticEval ? "ai_semantic" : "dom_extraction"
    });
  }

  const persuasionEarned = Math.round(persuasionCriteria.reduce((acc, c) => acc + c.earnedPoints, 0) * 10) / 10;
  const persuasionMax = 50;
  const persuasionSummary: V3DimensionSummary = {
    dimension: "persuasion",
    name: "Conversion Persuasion",
    score: persuasionEarned,
    maxScore: persuasionMax,
    percentage: Math.round((persuasionEarned / persuasionMax) * 100),
    gateApplied: false,
    criteria: persuasionCriteria
  };

  // =========================================================================
  // DIMENSION B: CONVERSION EXECUTION (35 Points Max)
  // Deterministic checks + Playwright dynamic interaction verification
  // =========================================================================
  const executionCriteria: V3CriterionScore[] = [];

  const hasPrimaryCta = signals.conversion.hasAboveTheFoldCta || signals.conversion.primaryCtaText.length > 0;
  const leadCaptureRequired = classification.conversionObjectives.primary.toLowerCase().includes("demo") ||
    classification.conversionObjectives.primary.toLowerCase().includes("register") ||
    classification.conversionObjectives.primary.toLowerCase().includes("trial") ||
    classification.conversionObjectives.primary.toLowerCase().includes("contact");

  // B1: CTA Effectiveness & Prominence (10 pts)
  {
    const max = 10;
    let earned = 0;
    let status: V3CriterionScore["status"] = "failed";
    let evidence = signals.conversion.primaryCtaText || "No CTA detected";
    let rule = "";
    let notes: string | undefined;
    let checks: { label: string; passed: boolean }[] | undefined;

    if (!hasPrimaryCta) {
      earned = 0;
      status = "failed";
      rule = "No primary CTA detected above fold or on page.";
      conversionBlockers.push("Critical: No call-to-action found on page.");
    } else {
      let pts = 0;
      if (signals.conversion.hasAboveTheFoldCta) pts += 5;
      if (signals.conversion.isActionOrientedCta) pts += 3;
      if (signals.conversion.clarityOfNextStep) pts += 2;
      earned = pts;
      status = pts >= 8 ? "passed" : pts >= 5 ? "partial" : "failed";
      rule = "Above the fold +5, action-oriented copy +3, next step explained +2";
      checks = [{ label: "Above the fold (+5)", passed: signals.conversion.hasAboveTheFoldCta }, { label: "Action-oriented copy (+3)", passed: signals.conversion.isActionOrientedCta }, { label: "Next step explained (+2)", passed: signals.conversion.clarityOfNextStep }];
    }

    executionCriteria.push({
      id: "exec_cta_effectiveness",
      name: "CTA Prominence & Clarity of Next Step",
      dimension: "execution",
      status,
      maxPoints: max,
      earnedPoints: earned,
      evidence,
      scoringRule: rule,
      notes,
      checks,
      confidence: 0.95,
      source: "dom_extraction"
    });
  }

  // B2: Promise-Destination Consistency (8 pts)
  {
    const max = 8;
    let earned = 0;
    let status: V3CriterionScore["status"] = "failed";
    let rule = "";
    let notes: string | undefined;
    let checks: { label: string; passed: boolean }[] | undefined;
    let evidence = `CTA: "${signals.conversion.primaryCtaText}" -> Intent: ${classification.visitorIntent}`;

    const isWebinar = classification.pageType === "resource" || classification.visitorIntent === "education";
    const ctaTextLower = signals.conversion.primaryCtaText.toLowerCase();

    if (isWebinar) {
      // If webinar CTA says "Watch now" but opens sales demo gate
      if (ctaTextLower.includes("watch") && verification?.modalOrNavigation === "modal") {
        earned = 4;
        status = "partial";
        rule = "Partial: 'Watch now' promise gates behind a lead capture modal before content.";
        evidence = `CTA '${signals.conversion.primaryCtaText}' gates access behind a modal form.`;
      } else if (ctaTextLower.includes("demo")) {
        earned = 3;
        status = "partial";
        rule = "Low alignment: Educational webinar page pushes a high-friction enterprise demo CTA.";
        evidence = "Webinar page CTA defaults to 'Book a demo' rather than content consumption.";
      } else {
        earned = 7;
        status = "passed";
        rule = "Consistent: Resource page provides direct content access or registration.";
      }
    } else {
      // General homepage or functional page
      if (hasPrimaryCta) {
        earned = 7;
        status = "passed";
        rule = "CTA matches page conversion objective.";
      } else {
        earned = 0;
        status = "failed";
        rule = "Missing CTA cannot fulfill promise.";
      }
    }

    executionCriteria.push({
      id: "exec_promise_destination",
      name: "Promise-Destination Consistency",
      dimension: "execution",
      status,
      maxPoints: max,
      earnedPoints: earned,
      evidence,
      scoringRule: rule,
      notes,
      checks,
      confidence: 0.85,
      source: verification?.verificationStatus !== "not_tested" ? "browser_playwright" : "dom_extraction"
    });
  }

  // B3: Lead Capture Usability & Verification (10 pts)
  // KEY FIX: Script presence (hs-scripts) is NOT full points!
  {
    const max = 10;
    let earned = 0;
    let status: V3CriterionScore["status"] = "failed";
    let rule = "";
    let notes: string | undefined;
    let checks: { label: string; passed: boolean }[] | undefined;
    let evidence = "";
    let source: V3CriterionScore["source"] = "dom_extraction";

    if (verification && verification.verificationStatus !== "not_tested") {
      source = "browser_playwright";
      if (verification.formRendered && verification.ctaClickable) {
        earned = 10;
        status = "passed";
        evidence = `Playwright verified: CTA is clickable and successfully rendered ${verification.formFieldCount} form inputs.`;
        rule = "Playwright live interaction verified: Form renders and accepts input upon CTA click.";
      } else if (verification.ctaVisible && verification.hubspotDetected) {
        earned = 4;
        status = "partial";
        evidence = "Playwright test: CTA visible and HubSpot script loaded, but form failed to render interactively.";
        rule = "Unverified lead capture: Script is present but interactive form rendering was not confirmed.";
        conversionBlockers.push("Warning: Lead capture script detected but form rendering could not be interactively verified.");
      } else {
        earned = 0;
        status = "failed";
        evidence = verification.evidenceNotes.join("; ");
        rule = "Lead capture failed interactive verification test.";
        conversionBlockers.push("Critical: Lead capture interaction failed verification.");
      }
    } else {
      // Static DOM inspection fallback
      // Strict rule: Script presence gives at most 4 pts, never 10 pts!
      if (signals.conversion.leadCaptureEngine) {
        const isEmbedForm = signals.conversion.leadCaptureType.includes("form_tag") ||
          signals.conversion.leadCaptureType.includes("input");
        if (isEmbedForm) {
          earned = 8;
          status = "passed";
          evidence = `Embedded form inputs detected: ${signals.conversion.leadCaptureType}`;
          rule = "DOM: Explicit form inputs rendered in DOM.";
        } else {
          // Script only (e.g. hs-scripts.com)
          earned = 3.5;
          status = "partial";
          evidence = `Script tag present: ${signals.conversion.leadCaptureType}. Not verified interactive.`;
          rule = "Script presence only: Awarded conservative partial credit (3.5/10). Live form rendering unverified.";
          conversionBlockers.push("Notice: Lead capture relies on external script without verified inline form.");
        }
      } else {
        earned = 0;
        status = "failed";
        evidence = "No lead capture engine or form detected in DOM";
        rule = "No lead capture mechanism detected.";
        if (leadCaptureRequired) {
          conversionBlockers.push("Critical: Lead capture form missing on page requiring lead generation.");
        }
      }
    }

    executionCriteria.push({
      id: "exec_lead_capture_usability",
      name: "Lead Capture Usability & Verification",
      dimension: "execution",
      status,
      maxPoints: max,
      earnedPoints: earned,
      evidence,
      scoringRule: rule,
      notes,
      checks,
      confidence: verification?.verificationStatus !== "not_tested" ? 0.95 : 0.7,
      source
    });
  }

  // B4: Conversion Friction & Cognitive Load (7 pts)
  {
    const max = 7;
    let earned = 0;
    let status: V3CriterionScore["status"] = "failed";
    let rule = "";
    let notes: string | undefined;
    let checks: { label: string; passed: boolean }[] | undefined;
    let evidence = "";

    const fieldCount = verification?.formFieldCount ?? signals.conversion.formFieldCount ?? 4;

    if (!hasPrimaryCta) {
      earned = 0;
      status = "failed";
      evidence = "No CTA or form to evaluate friction.";
      rule = "Friction cannot be scored when CTA is missing.";
    } else if (fieldCount <= 4) {
      earned = 7;
      status = "passed";
      evidence = `Friction is low: estimated ${fieldCount} fields or standard modal lead flow.`;
      rule = "Low friction: <=4 fields, clear forward path.";
    } else if (fieldCount <= 7) {
      earned = 4.5;
      status = "partial";
      evidence = `Moderate friction: estimated ${fieldCount} fields.`;
      rule = "Moderate friction: 5-7 fields in capture funnel.";
    } else {
      earned = 2;
      status = "partial";
      evidence = `High friction: ${fieldCount} fields in capture funnel.`;
      rule = "High friction: >7 fields create drop-off risk.";
    }

    executionCriteria.push({
      id: "exec_friction_load",
      name: "Conversion Friction & Funnel Simplicity",
      dimension: "execution",
      status,
      maxPoints: max,
      earnedPoints: earned,
      evidence,
      scoringRule: rule,
      notes,
      checks,
      confidence: 0.8,
      source: "dom_extraction"
    });
  }

  // Compute raw Execution score
  let rawExecutionEarned = Math.round(executionCriteria.reduce((acc, c) => acc + c.earnedPoints, 0) * 10) / 10;
  const executionMax = 35;
  let executionGateApplied = false;
  let executionGateReason: string | undefined = undefined;

  // =========================================================================
  // CONVERSION-READINESS GATES (Applied strictly to Dimension B)
  // Gating ensures broken execution cannot be masked by high persuasion
  // =========================================================================
  if (!hasPrimaryCta) {
    executionGateApplied = true;
    executionGateReason = "Missing Primary CTA Gate: No CTA on page. Execution score capped at 20% of max.";
    gatesTriggered.push(executionGateReason);
    rawExecutionEarned = Math.min(rawExecutionEarned, executionMax * 0.2); // max 7 pts
  } else if (leadCaptureRequired && !signals.conversion.leadCaptureEngine && (!verification || !verification.formRendered)) {
    executionGateApplied = true;
    executionGateReason = "Broken/Missing Lead Capture Gate: Required lead generation funnel absent. Execution capped at 30% of max.";
    gatesTriggered.push(executionGateReason);
    rawExecutionEarned = Math.min(rawExecutionEarned, executionMax * 0.3); // max 10.5 pts
  }

  const finalExecutionEarned = Math.round(rawExecutionEarned * 10) / 10;
  const executionSummary: V3DimensionSummary = {
    dimension: "execution",
    name: "Conversion Execution",
    score: finalExecutionEarned,
    maxScore: executionMax,
    percentage: Math.round((finalExecutionEarned / executionMax) * 100),
    gateApplied: executionGateApplied,
    gateReason: executionGateReason,
    criteria: executionCriteria
  };

  // =========================================================================
  // DIMENSION C: SUPPORTING EXPERIENCE (15 Points Max)
  // Technical foundation: Core Web Vitals, Viewport, Readability
  // =========================================================================
  const experienceCriteria: V3CriterionScore[] = [
    {
      id: "exp_lcp_speed",
      name: "Largest Contentful Paint (LCP)",
      dimension: "experience",
      status: signals.performance.lcpSeconds <= 2.5 ? "passed" : signals.performance.lcpSeconds <= 4.0 ? "partial" : "failed",
      maxPoints: 5,
      earnedPoints: signals.performance.lcpSeconds <= 2.5 ? 5 : signals.performance.lcpSeconds <= 4.0 ? 2.5 : 0,
      evidence: `LCP: ${signals.performance.lcpSeconds.toFixed(2)}s (Good <= 2.5s)`,
      scoringRule: "<=2.5s -> 5 pts, <=4.0s -> 2.5 pts, >4.0s -> 0 pts",
      confidence: 0.95,
      source: "pagespeed"
    },
    {
      id: "exp_cls_stability",
      name: "Cumulative Layout Shift (CLS)",
      dimension: "experience",
      status: signals.performance.cls <= 0.1 ? "passed" : signals.performance.cls <= 0.25 ? "partial" : "failed",
      maxPoints: 4,
      earnedPoints: signals.performance.cls <= 0.1 ? 4 : signals.performance.cls <= 0.25 ? 2 : 0,
      evidence: `CLS: ${signals.performance.cls.toFixed(3)} (Good <= 0.100)`,
      scoringRule: "<=0.10 -> 4 pts, <=0.25 -> 2 pts, >0.25 -> 0 pts",
      confidence: 0.95,
      source: "pagespeed"
    },
    {
      id: "exp_mobile_viewport",
      name: "Mobile Viewport Meta Configuration",
      dimension: "experience",
      status: signals.hasViewportMeta ? "passed" : "failed",
      maxPoints: 3,
      earnedPoints: signals.hasViewportMeta ? 3 : 0,
      evidence: signals.hasViewportMeta ? "meta[name='viewport'] configured" : "Missing viewport meta tag",
      scoringRule: "Present -> 3 pts, Absent -> 0 pts",
      confidence: 1.0,
      source: "dom_extraction"
    },
    {
      id: "exp_text_readability",
      name: "Text Readability & Content Structure",
      dimension: "experience",
      status: signals.clarity.hasClearH1 && signals.wordCount >= 100 ? "passed" : "partial",
      maxPoints: 3,
      earnedPoints: signals.clarity.hasClearH1 && signals.wordCount >= 100 ? 3 : signals.clarity.hasClearH1 ? 1.5 : 0,
      evidence: `H1 present: ${signals.clarity.hasClearH1}. Word count: ${signals.wordCount}`,
      scoringRule: "Clear H1 + reasonable word count (>=100 words) -> 3 pts, H1 only -> 1.5 pts",
      confidence: 0.9,
      source: "dom_extraction"
    }
  ];

  const experienceEarned = Math.round(experienceCriteria.reduce((acc, c) => acc + c.earnedPoints, 0) * 10) / 10;
  const experienceMax = 15;
  const experienceSummary: V3DimensionSummary = {
    dimension: "experience",
    name: "Supporting Experience",
    score: experienceEarned,
    maxScore: experienceMax,
    percentage: Math.round((experienceEarned / experienceMax) * 100),
    gateApplied: false,
    criteria: experienceCriteria
  };

  // =========================================================================
  // FINAL SCORE CALCULATION
  // Sum of Dimension A (50) + Dimension B (35) + Dimension C (15) = 100 max
  // =========================================================================
  const totalScore = Math.min(100, Math.max(0, Math.round(
    persuasionEarned + finalExecutionEarned + experienceEarned
  )));

  return {
    url: signals.url,
    totalScore,
    dimensions: {
      persuasion: persuasionSummary,
      execution: executionSummary,
      experience: experienceSummary
    },
    rubricVersion: "v3",
    pageType: classification.pageType,
    targetAudience: classification.targetAudience,
    visitorIntent: classification.visitorIntent,
    evaluatedAt: new Date().toISOString(),
    gatesTriggered,
    persuasionWeaknesses,
    conversionBlockers,
    playwrightVerified: verification?.verificationStatus === "passed" || verification?.verificationStatus === "partial"
  };
}
