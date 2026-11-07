import {
  PageClassification,
  PageClassificationSchema,
  RawPageInput,
  PageType,
  VisitorIntent,
  ClassificationEvidence
} from "@/types/classification-schema";
import { buildUserPrompt } from "./openai-classifier";

export interface AIClassificationResult {
  pageType: PageType;
  targetAudience: {
    segments: string[];
    roles: string[];
    industries: string[];
  };
  conversionObjectives: {
    primary: string;
    secondary?: string[];
  };
  primaryCTA?: {
    text: string;
    action: string;
  };
  visitorIntent: VisitorIntent;
  confidence: number;
  evidence: ClassificationEvidence[];
}

export interface AIClassifierClient {
  classify(prompt: string): Promise<unknown>;
}

export async function classifyPage(
  input: RawPageInput,
  aiClient?: AIClassifierClient
): Promise<PageClassification> {
  if (aiClient) {
    try {
      const prompt = buildUserPrompt(input);
      const rawAiResponse = await aiClient.classify(prompt);

      // Pre-parse normalization for common LLM structural quirks:
      if (rawAiResponse && typeof rawAiResponse === "object") {
        const obj = rawAiResponse as Record<string, unknown>;
        if (Array.isArray(obj.evidence)) {
          obj.evidence = obj.evidence.map((e: unknown) => {
            if (e && typeof e === "object") {
              const src = (e as Record<string, unknown>).source;
              const normalizedSrc = ["dom", "ai", "metadata"].includes(String(src).toLowerCase())
                ? String(src).toLowerCase()
                : "ai";
              return { ...e, source: normalizedSrc };
            }
            return e;
          });
        }
        if (obj.primaryCTA === null) {
          delete obj.primaryCTA;
        }
      }

      const parsed = PageClassificationSchema.safeParse(rawAiResponse);
      if (parsed.success) {
        return parsed.data;
      } else {
        console.warn("[classifyPage] AI response failed schema validation. Falling back to deterministic:", parsed.error.issues);
      }
    } catch (err) {
      console.warn("[classifyPage] AI client call failed. Falling back to deterministic:", err);
    }
  }

  return deterministicClassify(input);
}

export function deterministicClassify(input: RawPageInput): PageClassification {
  const evidence: ClassificationEvidence[] = [];
  const urlObj = parseUrl(input.url);
  const path = urlObj.pathname.toLowerCase().replace(/\/+$/, "");

  const title = (input.title || "").trim();
  const metaDesc = (input.metaDescription || "").trim();
  const h1 = (input.headings?.h1?.[0] || "").trim();
  const h2s = (input.headings?.h2 || []).map(h => h.trim());
  const ctas = input.ctas || [];
  const bodyText = (input.bodyExcerpt || "").toLowerCase();
  const combinedText = `${title} ${metaDesc} ${h1} ${h2s.join(" ")} ${bodyText}`.toLowerCase();

  // 1. Gather Metadata Evidence
  if (title) {
    evidence.push({ source: "metadata", excerpt: `Title: "${title}"` });
  }
  if (metaDesc) {
    evidence.push({ source: "metadata", excerpt: `Meta Description: "${metaDesc}"` });
  }
  if (h1) {
    evidence.push({ source: "dom", excerpt: `H1: "${h1}"`, selector: "h1" });
  }

  // 2. Identify Primary CTA
  const primaryCTA = extractPrimaryCTA(ctas);
  if (primaryCTA) {
    evidence.push({
      source: "dom",
      excerpt: `Primary CTA: "${primaryCTA.text}" (Action: ${primaryCTA.action})`,
      selector: "button, a"
    });
  }

  // 3. Insufficient / Ambiguous Data Check
  if (!h1 && !title && ctas.length === 0) {
    return PageClassificationSchema.parse({
      pageType: "unknown",
      targetAudience: { segments: [], roles: [], industries: [] },
      conversionObjectives: { primary: "Unidentifiable due to missing page content" },
      visitorIntent: "unknown",
      confidence: 0.1,
      evidence: [
        {
          source: "dom",
          excerpt: "Insufficient evidence: missing H1, page title, and calls to action."
        }
      ]
    });
  }

  // 4. Multi-Signal Scoring for Page Type
  let detectedType: PageType = "unknown";
  let intent: VisitorIntent = "unknown";
  let confidence = 0.5;

  const isRootPath = path === "" || path === "/";
  const pathSuggestsResource = /resources|webinars|events|whitepapers/i.test(path);
  const pathSuggestsFunction = /function|solutions|department/i.test(path);
  const contentIsPricing = /pricing|plans|per user|billing/i.test(h1 + " " + bodyText);

  // Check for Conflicting Signals (URL suggests resource but content is pricing/product)
  if (pathSuggestsResource && contentIsPricing) {
    detectedType = "product";
    intent = "high_intent";
    confidence = 0.65;
    evidence.push({
      source: "dom",
      excerpt: "Conflicting signals: URL suggests resource, but page content and H1 indicate pricing/product evaluation."
    });
  } else if (isRootPath) {
    // Root path is primarily the homepage / brand platform overview
    detectedType = "homepage";
    intent = "discovery";
    confidence = 0.94;
    evidence.push({
      source: "metadata",
      excerpt: "URL path is root domain, presenting overall company platform and cross-functional offering."
    });
  } else if (
    pathSuggestsResource ||
    /webinar|virtual event|on-demand|watch now/i.test(h1) ||
    /watch now|register now|save my seat/i.test(primaryCTA?.text || "")
  ) {
    detectedType = "resource";
    intent = "education";
    confidence = 0.90;
    evidence.push({
      source: "dom",
      excerpt: "Page emphasizes educational event/content consumption rather than direct software trial."
    });
  } else if (
    pathSuggestsFunction ||
    /hr ops|human resources|tier-1 hr|it service desk|finance ops/i.test(h1 + " " + metaDesc)
  ) {
    detectedType = "functional";
    intent = "consideration";
    confidence = 0.88;
    evidence.push({
      source: "dom",
      excerpt: "Page focuses specifically on departmental operational workflows and role-tailored automation."
    });
  } else if (/case-study|customer-story|customers\//i.test(path) || /case study|how .* achieved/i.test(h1)) {
    detectedType = "case_study";
    intent = "consideration";
    confidence = 0.85;
  } else if (/pricing|product\//i.test(path) || contentIsPricing) {
    detectedType = "product";
    intent = "high_intent";
    confidence = 0.85;
  }

  // 5. Audience Extraction
  const targetAudience = extractAudience(combinedText);

  // 6. Conversion Objective Derivation
  const conversionObjectives = deriveObjectives(detectedType, primaryCTA?.text);

  return PageClassificationSchema.parse({
    pageType: detectedType,
    targetAudience,
    conversionObjectives,
    primaryCTA: primaryCTA || undefined,
    visitorIntent: intent,
    confidence: Number(confidence.toFixed(2)),
    evidence
  });
}

function parseUrl(rawUrl: string): URL {
  try {
    return new URL(rawUrl);
  } catch {
    return new URL("https://example.com" + (rawUrl.startsWith("/") ? rawUrl : "/" + rawUrl));
  }
}

function extractPrimaryCTA(ctas: NonNullable<RawPageInput["ctas"]>): { text: string; action: string } | null {
  if (ctas.length === 0) return null;

  for (const cta of ctas) {
    const text = cta.text.trim();
    if (/book a demo|request a demo|schedule demo/i.test(text)) {
      return { text, action: "Book a sales demo" };
    }
    if (/watch now|watch webinar|watch recording/i.test(text)) {
      return { text, action: "Watch on-demand content" };
    }
    if (/start free trial|start free|try now/i.test(text)) {
      return { text, action: "Start a product trial" };
    }
    if (/contact sales|talk to sales|contact us/i.test(text)) {
      return { text, action: "Contact sales team" };
    }
  }

  const first = ctas.find(c => c.text.trim().length > 0);
  if (first) {
    return { text: first.text.trim(), action: "Navigate or submit" };
  }
  return null;
}

function extractAudience(combined: string) {
  const roles: string[] = [];
  const segments: string[] = [];
  const industries: string[] = [];

  // Roles
  if (/chro|hr leader|hr ops|people ops|head of hr/i.test(combined)) roles.push("HR Leadership");
  if (/cio|cto|it director|it leader|vp of it/i.test(combined)) roles.push("IT Leadership");
  if (/cfo|finance leader/i.test(combined)) roles.push("Finance Leadership");

  // Segments
  if (/enterprise|500\+ enterprises|global organizations|large enterprise/i.test(combined)) {
    segments.push("Enterprise");
  } else if (/mid-market|small business|teams/i.test(combined)) {
    segments.push("Mid-Market");
  }

  // Industries
  if (/healthcare|hospital|health system|christus/i.test(combined)) industries.push("Healthcare");
  if (/banking|financial services|fintech/i.test(combined)) industries.push("Financial Services");
  if (/retail|ecommerce/i.test(combined)) industries.push("Retail");

  return { segments, roles, industries };
}

function deriveObjectives(pageType: PageType, ctaText?: string): { primary: string; secondary?: string[] } {
  switch (pageType) {
    case "homepage":
      return {
        primary: "Enterprise platform discovery and demo booking",
        secondary: ["Explore product capabilities", "Validate enterprise trust and compliance"]
      };
    case "functional":
      return {
        primary: "Functional solution evaluation and demo booking",
        secondary: ["Examine department workflow automation", "Review pre-built integrations"]
      };
    case "resource":
      return {
        primary: "Educational content consumption and webinar access",
        secondary: ["Nurture prospect into product interest"]
      };
    case "case_study":
      return {
        primary: "Customer success validation and ROI review",
        secondary: ["Request a peer case study demo"]
      };
    case "product":
      return {
        primary: "Product evaluation and trial signup",
        secondary: ["Review pricing plans and feature comparisons"]
      };
    default:
      return {
        primary: ctaText ? `Engage with primary action: ${ctaText}` : "Page discovery"
      };
  }
}
