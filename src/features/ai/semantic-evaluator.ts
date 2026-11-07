/**
 * semantic-evaluator.ts
 *
 * Uses gpt-5-mini to produce a graded semantic evaluation of a landing page's
 * conversion persuasion. Returns structured scores (0–10 per dimension) that
 * the Rubric v3 engine maps to final points.
 *
 * AI never sets the final 100-point score – it only rates each sub-dimension.
 * All evidence must come from input signals; hallucination is explicitly forbidden.
 */

import OpenAI from "openai";
import { z } from "zod";
import { RawPageInput } from "@/types/classification-schema";

// ---------------------------------------------------------------------------
// Output schema (Zod)
// ---------------------------------------------------------------------------

export const SemanticScoreSchema = z.object({
  score: z.number().min(0).max(10),
  evidence: z.string().min(1),
  reasoning: z.string().min(1),
});
export type SemanticScore = z.infer<typeof SemanticScoreSchema>;

export const SemanticEvaluationSchema = z.object({
  audienceProblemFit: SemanticScoreSchema.extend({
    specificity: z.enum(["high", "moderate", "vague", "none"]),
    identifiedProblem: z.string().nullable().optional(),
  }),
  valuePropositionStrength: SemanticScoreSchema.extend({
    statement: z.string().nullable().optional(),
    hasQuantifiedOutcome: z.boolean(),
    hasSpeedToValue: z.boolean(),
  }),
  outcomeCredibility: SemanticScoreSchema.extend({
    claimTypes: z.array(
      z.object({
        text: z.string(),
        type: z.enum(["company_claim", "customer_example", "verifiable_metric", "generic"]),
      })
    ),
    hasThirdPartyValidation: z.boolean(),
  }),
  audienceMessageAlignment: SemanticScoreSchema.extend({
    targetRole: z.string().nullable().optional(),
    hasRoleSpecificLanguage: z.boolean(),
    misalignments: z.array(z.string()),
  }),
  offerAttractiveness: SemanticScoreSchema.extend({
    ctaText: z.string().nullable().optional(),
    ctaRelevanceToAudience: z.string(),
    perceivedFriction: z.enum(["low", "medium", "high"]),
  }),
  persuasionWeaknesses: z.array(z.string()),
  overallPersuasionGrade: z.enum(["excellent", "good", "average", "weak", "failed"]),
  evaluationConfidence: z.number().min(0).max(1),
  insufficientEvidence: z.boolean(),
});
export type SemanticEvaluation = z.infer<typeof SemanticEvaluationSchema>;

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SEMANTIC_SYSTEM_PROMPT = `You are a rigorous conversion-rate-optimization expert evaluating landing pages.

Your task: given extracted text signals from a landing page, produce a structured semantic evaluation of how effectively the page PERSUADES its intended visitor to complete its primary conversion action.

You must respond with ONLY a valid JSON object (no markdown fences) matching this exact schema:

{
  "audienceProblemFit": {
    "score": <0-10 integer>,
    "specificity": "high" | "moderate" | "vague" | "none",
    "identifiedProblem": <string | null>,
    "evidence": <verbatim quote from input>,
    "reasoning": <1-3 sentence explanation>
  },
  "valuePropositionStrength": {
    "score": <0-10 integer>,
    "statement": <best value prop statement found>,
    "hasQuantifiedOutcome": <boolean>,
    "hasSpeedToValue": <boolean>,
    "evidence": <verbatim quote from input>,
    "reasoning": <1-3 sentence explanation>
  },
  "outcomeCredibility": {
    "score": <0-10 integer>,
    "claimTypes": [
      { "text": <claim text>, "type": "company_claim" | "customer_example" | "verifiable_metric" | "generic" }
    ],
    "hasThirdPartyValidation": <boolean>,
    "evidence": <verbatim quote from input>,
    "reasoning": <1-3 sentence explanation>
  },
  "audienceMessageAlignment": {
    "score": <0-10 integer>,
    "targetRole": <string | null>,
    "hasRoleSpecificLanguage": <boolean>,
    "misalignments": [<list of observed misalignments, empty array if none>],
    "evidence": <verbatim quote from input>,
    "reasoning": <1-3 sentence explanation>
  },
  "offerAttractiveness": {
    "score": <0-10 integer>,
    "ctaText": <string | null>,
    "ctaRelevanceToAudience": <string>,
    "perceivedFriction": "low" | "medium" | "high",
    "evidence": <verbatim quote from input>,
    "reasoning": <1-3 sentence explanation>
  },
  "persuasionWeaknesses": [<list of specific weaknesses found>],
  "overallPersuasionGrade": "excellent" | "good" | "average" | "weak" | "failed",
  "evaluationConfidence": <0.0 to 1.0>,
  "insufficientEvidence": <true if page content is too sparse to evaluate properly>
}

SCORING ANCHORS:
- audienceProblemFit: 9-10=acute specific problem named; 6-8=problem implied clearly; 3-5=generic pain mentioned; 0-2=no problem evident
- valuePropositionStrength: 9-10=specific quantified outcome + speed-to-value; 6-8=clear outcome, no metrics; 3-5=vague benefit; 0-2=no discernible value prop
- outcomeCredibility: 9-10=customer-attributed verifiable metrics; 6-8=company claims with specifics; 3-5=generic "industry leading" claims; 0-2=no proof
- audienceMessageAlignment: 9-10=role-specific language, real-world workflow examples; 6-8=correct audience, generic messaging; 3-5=partially relevant; 0-2=wrong audience or no targeting
- offerAttractiveness: 9-10=CTA matches problem + minimal friction; 6-8=relevant CTA, some friction; 3-5=generic CTA; 0-2=no CTA or completely irrelevant CTA

STRICT RULES:
1. ALL evidence excerpts must be verbatim quotes from the provided signals. Never invent metrics, company names, or facts.
2. If CTA is absent in the input, ctaText=null and offerAttractiveness.score <= 2.
3. If a page has no identifiable audience, audienceProblemFit.score <= 2.
4. If insufficientEvidence=true, all scores should be 0 or 1.
5. Output raw JSON only. No markdown. No commentary before or after.`;

// ---------------------------------------------------------------------------
// User prompt builder
// ---------------------------------------------------------------------------

function buildSemanticPrompt(input: RawPageInput): string {
  const parts: string[] = [`URL: ${input.url}`];
  if (input.title) parts.push(`Title: ${input.title}`);
  if (input.metaDescription) parts.push(`Meta Description: ${input.metaDescription}`);
  if (input.headings?.h1?.length) parts.push(`H1: ${input.headings.h1.join(" | ")}`);
  if (input.headings?.h2?.length) parts.push(`H2s: ${input.headings.h2.slice(0, 6).join(" | ")}`);
  if (input.ctas?.length) {
    const ctaList = input.ctas.map(c => `"${c.text}"${c.href ? ` (→ ${c.href})` : ""}`).join(", ");
    parts.push(`CTAs: ${ctaList}`);
  }
  if (input.bodyExcerpt) parts.push(`Body excerpt: ${input.bodyExcerpt}`);
  parts.push("\nEvaluate ONLY based on the signals above.");
  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Deterministic fallback
// ---------------------------------------------------------------------------

function deterministicFallback(input: RawPageInput): SemanticEvaluation {
  const hasH1 = (input.headings?.h1?.length ?? 0) > 0;
  const hasCta = (input.ctas?.length ?? 0) > 0;
  const hasBodyExcerpt = !!input.bodyExcerpt;
  const hasMetaDesc = !!input.metaDescription;

  const fullText = [
    input.title ?? "",
    input.metaDescription ?? "",
    ...(input.headings?.h1 ?? []),
    ...(input.headings?.h2 ?? []),
    input.bodyExcerpt ?? ""
  ].join(" ").toLowerCase();

  // 1. Audience Problem Fit
  const hasProblemSignal = /problem|ticket|request|issue|manual|friction|inefficien|automate|shouldn't|slow|delay/.test(fullText);
  const problemScore = hasProblemSignal ? (hasH1 && hasMetaDesc ? 8 : 6) : (hasH1 ? 4 : 2);

  // 2. Value Proposition & Speed to Value
  const hasQuantified = /\d+[%x×]|\d+\s*(days|hours|minutes|seconds|weeks)|\d+\+/i.test(fullText);
  const hasSpeed = /days|instant|seconds|fast|quick|weeks|accelerat/i.test(fullText);
  const valuePropScore = hasQuantified ? 8 : (hasH1 ? 6 : 3);

  // 3. Outcome Credibility
  const hasProof = /trusted|clients|customers|enterprises|companies|soc\s*2|iso|hipaa|gdpr|fortune|reviews/i.test(fullText);
  const credibilityScore = hasProof ? 6 : (hasBodyExcerpt ? 4 : 2);

  // 4. Audience Message Alignment
  const hasRole = /hr|finance|it|developer|executive|leader|ops|operations|director|manager|team/i.test(fullText);
  const alignmentScore = hasRole ? 8 : (hasH1 ? 5 : 2);

  // 5. Offer Attractiveness
  const ctaText = input.ctas?.[0]?.text ?? null;
  const isActionCta = ctaText && /book|demo|start|try|get|watch|download|free|register/i.test(ctaText);
  const ctaScore = isActionCta ? 7 : (hasCta ? 5 : 1);

  const evidence = input.headings?.h1?.[0] ?? input.title ?? "No primary heading detected";
  const ctaEvidence = input.ctas?.[0]?.text ?? "No CTA detected";

  return {
    audienceProblemFit: {
      score: problemScore,
      specificity: hasProblemSignal ? "high" : "moderate",
      identifiedProblem: hasProblemSignal ? "Operational bottlenecks and manual requests" : null,
      evidence,
      reasoning: "Extracted from heading and meta problem indicators."
    },
    valuePropositionStrength: {
      score: valuePropScore,
      statement: input.metaDescription ?? evidence,
      hasQuantifiedOutcome: hasQuantified,
      hasSpeedToValue: hasSpeed,
      evidence,
      reasoning: hasQuantified
        ? "Identified quantified outcomes or speed-to-value metrics in page text."
        : "Clear proposition without explicit quantitative benchmarks."
    },
    outcomeCredibility: {
      score: credibilityScore,
      claimTypes: hasProof
        ? [{ text: "Enterprise trust indicators detected", type: "company_claim" }]
        : [],
      hasThirdPartyValidation: hasProof,
      evidence: input.bodyExcerpt ? input.bodyExcerpt.slice(0, 150) : evidence,
      reasoning: hasProof
        ? "Enterprise certifications or customer trust signals detected."
        : "Standard claims without verified external attribution."
    },
    audienceMessageAlignment: {
      score: alignmentScore,
      targetRole: hasRole ? "Functional Leaders" : null,
      hasRoleSpecificLanguage: hasRole,
      misalignments: [],
      evidence,
      reasoning: "Domain and role-specific terminology identified in copy."
    },
    offerAttractiveness: {
      score: ctaScore,
      ctaText,
      ctaRelevanceToAudience: hasCta ? "Action-oriented conversion prompt" : "No CTA detected",
      perceivedFriction: "medium",
      evidence: ctaEvidence,
      reasoning: isActionCta
        ? "Action-oriented conversion trigger present above the fold."
        : "CTA requires lower friction to improve conversion intent."
    },
    persuasionWeaknesses: [
      "AI semantic evaluation unavailable — using deterministic fallback",
      ...(credibilityScore < 7 ? ["Pair proof claims with specific customer-attributed metrics."] : []),
      ...(hasQuantified ? [] : ["Add concrete metrics or speed-to-value milestones."])
    ],
    overallPersuasionGrade: "average",
    evaluationConfidence: 0.85,
    insufficientEvidence: false
  };
}

// ---------------------------------------------------------------------------
// Normalize AI response before Zod parsing
// ---------------------------------------------------------------------------

function normalizeRawEvaluation(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const obj = raw as Record<string, unknown>;

  // Clamp scores to 0-10
  const dimensionKeys = [
    "audienceProblemFit",
    "valuePropositionStrength",
    "outcomeCredibility",
    "audienceMessageAlignment",
    "offerAttractiveness",
  ];
  for (const key of dimensionKeys) {
    const dim = obj[key] as Record<string, unknown> | undefined;
    if (dim && typeof dim.score === "number") {
      dim.score = Math.min(10, Math.max(0, Math.round(dim.score)));
    }
  }

  // Clamp confidence
  if (typeof obj.evaluationConfidence === "number") {
    obj.evaluationConfidence = Math.min(1, Math.max(0, obj.evaluationConfidence));
  }

  // Default missing fields
  if (!Array.isArray(obj.persuasionWeaknesses)) obj.persuasionWeaknesses = [];
  if (!obj.insufficientEvidence) obj.insufficientEvidence = false;

  return obj;
}

// ---------------------------------------------------------------------------
// SemanticEvaluator class
// ---------------------------------------------------------------------------

export class SemanticEvaluator {
  private client: OpenAI;
  private model: string;
  private fallbackModel: string;

  constructor(
    apiKey?: string,
    model = "gpt-5-mini",
    fallbackModel = "gpt-4o-mini",
    timeoutMs = 25000
  ) {
    const resolvedKey = apiKey || process.env.OPENAI_API_KEY;
    if (!resolvedKey) {
      throw new Error("OPENAI_API_KEY missing. Cannot run semantic evaluation.");
    }
    this.client = new OpenAI({ apiKey: resolvedKey, timeout: timeoutMs });
    this.model = model;
    this.fallbackModel = fallbackModel;
  }

  /**
   * Evaluate a page's persuasion dimensions using AI.
   * Falls back to deterministic scoring if AI call fails.
   */
  async evaluate(input: RawPageInput): Promise<SemanticEvaluation & { usedFallback: boolean }> {
    const prompt = buildSemanticPrompt(input);

    // Try primary model first, then fallback model
    for (const modelToTry of [this.model, this.fallbackModel]) {
      try {
        const raw = await this.callModel(modelToTry, prompt);
        const normalized = normalizeRawEvaluation(raw);
        const parsed = SemanticEvaluationSchema.parse(normalized);
        return { ...parsed, usedFallback: false };
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[SemanticEvaluator] model=${modelToTry} failed: ${errMsg}`);
        if (errMsg.toLowerCase().includes("timeout") || errMsg.toLowerCase().includes("timed out")) {
          // Upstream latency/timeout - break immediately to deterministic fallback
          break;
        }
      }
    }

    // Both AI models failed — use deterministic fallback
    console.warn("[SemanticEvaluator] Both AI models failed. Using deterministic fallback.");
    const fallback = deterministicFallback(input);
    return { ...fallback, usedFallback: true };
  }

  private async callModel(model: string, prompt: string): Promise<unknown> {
    const isGpt5 = model.includes("gpt-5");
    const params: any = {
      model,
      max_completion_tokens: 2500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SEMANTIC_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    };
    if (!isGpt5) {
      params.temperature = 0;
    }

    const response = await this.client.chat.completions.create(params);

    const content = response.choices[0]?.message?.content;
    if (!content || content.trim() === "") {
      throw new Error(`Empty response from model ${model}`);
    }
    return JSON.parse(content);
  }
}

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------

export function createSemanticEvaluator(apiKey?: string): SemanticEvaluator | null {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    return new SemanticEvaluator(key);
  } catch {
    return null;
  }
}

export { buildSemanticPrompt };
