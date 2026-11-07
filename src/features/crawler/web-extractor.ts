/**
 * web-extractor.ts
 *
 * Safe live website extractor with SSRF protection, Cheerio DOM analysis,
 * and signal normalization for the Convex Landing Page Grader.
 */

import * as cheerio from "cheerio";
import { PageSignals } from "@/types/analysis";
import { RawPageInput } from "@/types/classification-schema";

export interface ExtractionResult {
  url: string;
  signals: PageSignals;
  rawInput: RawPageInput;
  fetchedAt: string;
  statusCode: number;
}

// ---------------------------------------------------------------------------
// SSRF & Security Validation
// ---------------------------------------------------------------------------

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./, // AWS/Cloud metadata
  /^0\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/
];

export function validateSafeUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    // If the input already contains a protocol scheme (e.g. file://, ftp://, javascript:), parse it directly
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(rawUrl);
    const toParse = hasScheme ? rawUrl : `https://${rawUrl}`;
    parsed = new URL(toParse);
  } catch {
    throw new Error(`Invalid URL format: "${rawUrl}"`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Blocked unsupported protocol: "${parsed.protocol}". Only HTTP/HTTPS allowed.`);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname === "metadata.google.internal"
  ) {
    throw new Error(`SSRF Protection: Access to local/internal host "${hostname}" is forbidden.`);
  }

  for (const regex of PRIVATE_IP_RANGES) {
    if (regex.test(hostname)) {
      throw new Error(`SSRF Protection: Access to private network address "${hostname}" is forbidden.`);
    }
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// Live Extractor
// ---------------------------------------------------------------------------

export async function extractLivePage(
  targetUrl: string,
  timeoutMs = 12000
): Promise<ExtractionResult> {
  const safeUrl = validateSafeUrl(targetUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(safeUrl.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 ConvexPageGrader/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      },
      redirect: "follow"
    });
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms while fetching ${safeUrl.toString()}`);
    }
    throw new Error(`Failed to fetch ${safeUrl.toString()}: ${err.message || "Network error"}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`Target returned HTTP status ${response.status} (${response.statusText})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Clean scripts/styles for text extraction
  const clean$ = cheerio.load(html);
  clean$("script, style, noscript, svg, nav, footer, header").remove();
  const bodyText = clean$("body").text().replace(/\s+/g, " ").trim();
  const words = bodyText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Metadata
  const title = $("title").text().trim() || $("meta[property='og:title']").attr("content") || "";
  const metaDescription =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";
  const hasViewportMeta = $('meta[name="viewport"]').length > 0;

  // Headings
  const h1s: string[] = [];
  $("h1").each((_, el) => {
    const txt = $(el).text().trim();
    if (txt) h1s.push(txt);
  });

  const h2s: string[] = [];
  $("h2").each((_, el) => {
    const txt = $(el).text().trim();
    if (txt) h2s.push(txt);
  });

  const h3s: string[] = [];
  $("h3").each((_, el) => {
    const txt = $(el).text().trim();
    if (txt) h3s.push(txt);
  });

  // CTAs
  const ctas: { text: string; href?: string; tag?: string }[] = [];
  $("button, a.button, a.btn, a[class*='cta'], a[class*='btn'], a[role='button']").each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr("href");
    const tag = el.tagName.toLowerCase();
    if (text && text.length >= 2 && text.length <= 40 && !ctas.some(c => c.text === text)) {
      ctas.push({ text, href, tag });
    }
  });

  // Fallback to action links if few CTAs found
  if (ctas.length === 0) {
    $("a").each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href");
      if (
        text &&
        text.length <= 30 &&
        /demo|start|try|contact|schedule|watch|get|join|sign up|book/i.test(text)
      ) {
        if (!ctas.some(c => c.text === text)) {
          ctas.push({ text, href, tag: "a" });
        }
      }
    });
  }

  const primaryCta = ctas[0];
  const primaryCtaText = primaryCta?.text || "";
  const isActionOrientedCta =
    primaryCtaText.length > 0 &&
    /book|start|try|get|watch|schedule|request|claim|join|sign|see/i.test(primaryCtaText);

  // Lead capture detection
  const scripts = $("script")
    .map((_, el) => $(el).attr("src") || "")
    .get()
    .join(" ");

  const hasHsScript = scripts.includes("hs-scripts.com") || scripts.includes("hsforms");
  const hasMarketo = scripts.includes("marketo") || scripts.includes("munchkin");
  const formElements = $("form");
  const visibleInputs = $("input:not([type='hidden']), select, textarea");
  const hasInlineForm = formElements.length > 0 || visibleInputs.length > 0;

  let leadCaptureEngine = false;
  let leadCaptureType = "none";

  if (hasInlineForm && visibleInputs.length > 0) {
    leadCaptureEngine = true;
    leadCaptureType = `inline_form (${visibleInputs.length} fields)`;
  } else if (hasHsScript) {
    leadCaptureEngine = true;
    leadCaptureType = "HubSpot Modal Lead Capture (script)";
  } else if (hasMarketo) {
    leadCaptureEngine = true;
    leadCaptureType = "Marketo Lead Form (script)";
  } else if (formElements.length > 0) {
    leadCaptureEngine = true;
    leadCaptureType = "HTML form tag";
  }

  // Clarity signals
  const allHeadingsText = [...h1s, ...h2s].join(" ");
  const problemRegex = /die|fail|slow|hard|problem|overwhelm|queue|manual|stuck|friction|waste|cost/i;
  const hasProblemStatement = problemRegex.test(allHeadingsText) || problemRegex.test(metaDescription);
  const problemStatementQuote = h1s.find(h => problemRegex.test(h)) ||
    h2s.find(h => problemRegex.test(h)) ||
    (problemRegex.test(metaDescription) ? metaDescription : undefined);

  const outcomeRegex = /\d+([%x×+]|\s*(days|hours|minutes|seconds|auto-resolved|roi|saved))/i;
  const hasConcreteOutcome = outcomeRegex.test(allHeadingsText) || outcomeRegex.test(metaDescription);
  const concreteOutcomeQuote = h1s.find(h => outcomeRegex.test(h)) ||
    h2s.find(h => outcomeRegex.test(h)) ||
    (outcomeRegex.test(metaDescription) ? metaDescription : undefined);

  // Trust signals
  const detectedLogos: string[] = [];
  $("img, svg").each((_, el) => {
    const alt = $(el).attr("alt") || "";
    const aria = $(el).attr("aria-label") || "";
    const titleAttr = $(el).attr("title") || "";
    const candidate = alt || aria || titleAttr;
    if (
      candidate &&
      candidate.length >= 2 &&
      candidate.length <= 30 &&
      !/icon|logo|arrow|chevron|spinner|star|image/i.test(candidate) &&
      !detectedLogos.includes(candidate)
    ) {
      detectedLogos.push(candidate);
    }
  });

  const fullHtml = $.html();
  const complianceCertifications: string[] = [];
  if (/soc\s*2/i.test(fullHtml)) complianceCertifications.push("SOC 2");
  if (/iso\s*27001/i.test(fullHtml)) complianceCertifications.push("ISO 27001");
  if (/gdpr/i.test(fullHtml)) complianceCertifications.push("GDPR");
  if (/hipaa/i.test(fullHtml)) complianceCertifications.push("HIPAA");

  const caseStudyRegex = /(saved|achieved|reduced|increased)\s+\d+[%x×+]?|(case study|customer story|leaders on the record)/i;
  const hasQuantifiedCaseStudy = caseStudyRegex.test(fullHtml);
  const quantifiedCaseStudyQuote = h2s.find(h => caseStudyRegex.test(h)) ||
    h3s.find(h => caseStudyRegex.test(h));

  const signals: PageSignals = {
    url: safeUrl.toString(),
    title,
    metaDescription,
    headings: {
      h1: h1s,
      h2: h2s
    },
    wordCount,
    hasViewportMeta,
    performance: {
      mobileLighthouseScore: 75, // Default fallback if PageSpeed API omitted
      lcpSeconds: 2.3,
      cls: 0.04,
      fcpSeconds: 1.7,
      source: "estimated"
    },
    conversion: {
      hasAboveTheFoldCta: ctas.length > 0,
      primaryCtaText,
      isActionOrientedCta,
      leadCaptureEngine,
      leadCaptureType,
      formFieldCount: visibleInputs.length || 4,
      clarityOfNextStep: isActionOrientedCta && (primaryCta?.href !== "#" || leadCaptureEngine)
    },
    clarity: {
      hasClearH1: h1s.length > 0 && h1s[0].length >= 10 && h1s[0].length <= 120,
      hasProblemStatement,
      problemStatementQuote,
      hasConcreteOutcome,
      concreteOutcomeQuote,
      isLowJargon: true
    },
    trust: {
      logoCount: Math.min(12, detectedLogos.length),
      detectedLogos: detectedLogos.slice(0, 8),
      complianceCertifications,
      hasQuantifiedCaseStudy,
      quantifiedCaseStudyQuote
    }
  };

  const rawInput: RawPageInput = {
    url: safeUrl.toString(),
    title,
    metaDescription,
    headings: {
      h1: h1s,
      h2: h2s
    },
    ctas: ctas.slice(0, 6),
    bodyExcerpt: words.slice(0, 150).join(" ")
  };

  return {
    url: safeUrl.toString(),
    signals,
    rawInput,
    fetchedAt: new Date().toISOString(),
    statusCode: response.status
  };
}
