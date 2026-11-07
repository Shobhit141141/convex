import OpenAI from "openai";
import { AIClassifierClient } from "./classifier";

const CLASSIFICATION_SYSTEM_PROMPT = `You are an expert landing page analyst and conversion rate optimization (CRO) evaluator.
Given extracted webpage signals (URL, title, meta description, headings, CTAs, body excerpt), your job is to produce a rigorous, evidence-backed semantic interpretation and classification of the page.

You must respond with ONLY a valid JSON object matching this exact schema:

{
  "pageType": "homepage" | "product" | "functional" | "campaign" | "resource" | "case_study" | "unknown",
  "targetAudience": {
    "segments": string[],
    "roles": string[],
    "industries": string[]
  },
  "conversionObjectives": {
    "primary": string,
    "secondary": string[]
  },
  "primaryCTA": {
    "text": string,
    "action": string
  } | null,
  "visitorIntent": "discovery" | "consideration" | "high_intent" | "education" | "unknown",
  "confidence": number (0.0 to 1.0),
  "evidence": [
    {
      "source": "dom" | "ai" | "metadata",
      "excerpt": string
    }
  ],
  "businessProblem": {
    "identified": boolean,
    "statement": string (optional),
    "specificity": "high" | "moderate" | "vague" | "none",
    "evidenceExcerpt": string (optional)
  },
  "valueProposition": {
    "statement": string,
    "speedToValueMetric": string (optional),
    "quantifiableRoi": string (optional),
    "evidenceExcerpt": string (optional)
  },
  "messagingQuality": {
    "clarityScore": number (0 to 10),
    "isLowJargon": boolean,
    "summary": string
  },
  "ctaAnalysis": {
    "primaryText": string (optional),
    "action": string (optional),
    "relevanceToAudience": string (optional),
    "frictionLevel": "low" | "medium" | "high"
  }
}

Page Type Taxonomy:
- "homepage": Company's root page (path "/" or root domain). Introduces the overall company platform and cross-departmental capabilities. Addresses multiple executive roles (e.g. CIO, CHRO, CFO). Intent: discovery.
- "product": Focuses on a single specific software product, platform tier, or pricing plan. Intent: high_intent.
- "functional": Focuses on a single operational department or business function (e.g., HR, IT Service Desk, Finance). Shows role-tailored automation and workflows. Intent: consideration.
- "campaign": Dedicated, highly focused paid advertising landing page with a single conversion funnel.
- "resource": Educational webinar, whitepaper, guide, or case recording. Primary goal is content consumption. Intent: education.
- "case_study": Customer proof story highlighting implementation outcomes and ROI metrics. Intent: consideration.
- "unknown": Evidence is insufficient to reliably classify.

Strict Rules:
1. Every excerpt and citation MUST come directly from the provided text signals. DO NOT invent, hallucinate, or extrapolate facts, metrics, or logos that do not exist in the prompt.
2. If the page does not explicitly identify an acute business problem, set businessProblem.identified = false and specificity = "none".
3. If no CTA exists in the input, set primaryCTA to null, do not invent one.
4. "homepage" vs "product": If the URL is root ("/") and introduces the company broadly, it is ALWAYS "homepage", even if it mentions product capabilities.
5. Provide at least 2 distinct evidence items with verbatim excerpts.
6. Output raw JSON only. No markdown fences (\`\`\`json), no preamble, no postscript.`;

function buildUserPrompt(input: {
  url: string;
  title?: string;
  metaDescription?: string;
  headings?: { h1?: string[]; h2?: string[] };
  ctas?: { text: string; href?: string; tag?: string }[];
  bodyExcerpt?: string;
}): string {
  const parts: string[] = [`URL: ${input.url}`];

  if (input.title) parts.push(`Title: ${input.title}`);
  if (input.metaDescription) parts.push(`Meta Description: ${input.metaDescription}`);
  if (input.headings?.h1?.length) parts.push(`H1: ${input.headings.h1.join(" | ")}`);
  if (input.headings?.h2?.length) parts.push(`H2s: ${input.headings.h2.join(" | ")}`);
  if (input.ctas?.length) {
    const ctaList = input.ctas.map(c => `"${c.text}"${c.href ? ` (→ ${c.href})` : ""}`).join(", ");
    parts.push(`CTAs: ${ctaList}`);
  }
  if (input.bodyExcerpt) parts.push(`Body excerpt: ${input.bodyExcerpt}`);

  return parts.join("\n");
}

export class OpenAIClassifier implements AIClassifierClient {
  private client: OpenAI;
  private model: string;
  private timeoutMs: number;

  constructor(apiKey?: string, model = "gpt-4o-mini", timeoutMs = 15000) {
    const resolvedKey = apiKey || process.env.OPENAI_API_KEY;
    if (!resolvedKey) {
      throw new Error("OpenAI API key missing. Set OPENAI_API_KEY environment variable.");
    }
    this.client = new OpenAI({ apiKey: resolvedKey, timeout: timeoutMs });
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async classify(prompt: string): Promise<unknown> {
    const isGpt5 = this.model.includes("gpt-5");
    const params: any = {
      model: this.model,
      max_completion_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    };
    if (!isGpt5) {
      params.temperature = 0;
    }

    const response = await this.client.chat.completions.create(params);

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    return JSON.parse(content);
  }
}

// Backwards compatibility alias
export const OpenAIClassifierClient = OpenAIClassifier;

export function createOpenAIClassifier(apiKey?: string, model?: string): OpenAIClassifier | undefined {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) return undefined;
  try {
    return new OpenAIClassifier(key, model);
  } catch {
    return undefined;
  }
}

export { buildUserPrompt, CLASSIFICATION_SYSTEM_PROMPT };
