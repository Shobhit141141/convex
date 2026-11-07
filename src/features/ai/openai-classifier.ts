import OpenAI from "openai";
import { AIClassifierClient } from "./classifier";

const CLASSIFICATION_SYSTEM_PROMPT = `You are a landing page classifier. Given page signals (URL, title, meta description, headings, CTAs, body excerpt), classify the page.

Respond with ONLY a valid JSON object matching this exact schema:

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
  ]
}

Page type definitions (use these precisely):
- "homepage": The root/main page of a company website. Introduces the company, its overall platform, and multiple products or capabilities. URL is typically "/" or the bare domain. Addresses multiple audiences (e.g. CIO, CHRO, CFO). Intent is discovery.
- "product": A page for a specific product, pricing, or feature comparison. Focuses on one product's details, not the whole company.
- "functional": A page addressing a specific business function or department (e.g. HR, IT, Finance). Shows how the product solves problems for that function.
- "campaign": A focused landing page for a specific marketing campaign with a single conversion goal.
- "resource": A webinar, whitepaper, report, or educational content page. Primary goal is content consumption.
- "case_study": A customer story showing implementation and outcomes.
- "unknown": Use when evidence is insufficient to classify.

Critical distinction: A company's root page that presents its overall platform across multiple departments is a "homepage", NOT a "product" page, even if it describes product capabilities.

Rules:
- pageType must be one of the 7 enum values exactly.
- visitorIntent must be one of the 5 enum values exactly.
- confidence must be a number between 0 and 1.
- evidence must have at least one entry with source "ai".
- Do not invent target audiences or conversion objectives — derive them from the provided signals.
- If evidence is insufficient, set pageType to "unknown" and confidence below 0.3.
- primaryCTA should be null if no CTA is provided, not fabricated.
- Return raw JSON only, no markdown fences, no explanation.`;

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

export class OpenAIClassifierClient implements AIClassifierClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async classify(prompt: string): Promise<unknown> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    return JSON.parse(content);
  }
}

export function createOpenAIClassifier(apiKey?: string, model?: string): OpenAIClassifierClient | undefined {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) return undefined;
  return new OpenAIClassifierClient(key, model);
}

export { buildUserPrompt };
