"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Activity,
  Calculator,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Eye,
  FileSearch,
  Gauge,
  HelpCircle,
  Layers,
  Lock,
  MapPin,
  MousePointerClick,
  Play,
  ShieldAlert,
  Sparkles,
  Target,
  Zap
} from "lucide-react";

interface PipelineStage {
  step: number;
  percent: number;
  id: string;
  title: string;
  shortTitle: string;
  plainEnglish: string;
  technicalHow: string;
  modulePath: string;
  inputs: string[];
  outputs: string[];
  sampleTelemetry: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    step: 1,
    percent: 10,
    id: "cache_and_fetch",
    title: "Supabase URL Cache Lookup & Safe HTML Fetch",
    shortTitle: "1. Cache & Fetch",
    plainEnglish:
      "First, we check if this exact website URL was already graded in Supabase. If it's cached, we load it in milliseconds. Otherwise, we securely fetch the live webpage HTML while blocking unsafe internal network addresses.",
    technicalHow:
      "Normalizes the URL (lowercases host, strips trailing slashes) and queries public.landing_page_audits. On cache miss or Re-run Live Audit (forceRefresh: true), performs an SSRF-guarded HTTP GET with redirect validation.",
    modulePath: "src/features/storage/audit-history.ts • src/features/crawler/web-extractor.ts",
    inputs: ["Raw Target URL (e.g. https://leena.ai/function/hr)", "forceRefresh boolean flag"],
    outputs: ["Cached GraderReport (instant hit) OR Raw HTML document + HTTP status + response time"],
    sampleTelemetry: "Fetched 142.8 KB HTML in 310ms (HTTP 200) • Cache bypassed for fresh scan"
  },
  {
    step: 2,
    percent: 28,
    id: "dom_signals",
    title: "Deterministic DOM & Conversion Signal Extraction",
    shortTitle: "2. DOM Signals",
    plainEnglish:
      "We scan the webpage structure to count every headline, action button, sign-up form box, customer logo, security badge (like SOC2/GDPR), and measurable stat (like '70% faster' or '4-10x ROI').",
    technicalHow:
      "Parses HTML into a Cheerio AST. Extracts H1–H3 hierarchy, identifies above-the-fold vs. below-the-fold CTAs, counts visible form inputs, detects third-party form scripts (HubSpot, Marketo, Typeform), and runs regex extractors for quantified outcomes.",
    modulePath: "src/features/crawler/web-extractor.ts",
    inputs: ["Raw HTML AST", "Resolved Base URL"],
    outputs: [
      "Headings (H1–H3) & Word Count",
      "Primary CTA Text & Above-the-Fold Position",
      "Form Input Count & Embedded Capture Scripts",
      "Quantified Metrics (%, $, x) & Customer Logo Count"
    ],
    sampleTelemetry: 'Extracted 1,240 words, H1: "HR shouldn\'t reach a human...", Primary CTA: "Book a demo"'
  },
  {
    step: 3,
    percent: 48,
    id: "audience_classifier",
    title: "Audience (ICP), Page Type & Buying Stage Classification",
    shortTitle: "3. ICP Classifier",
    plainEnglish:
      "Before judging the copy, we figure out WHO the page is written for (e.g., HR Directors vs. Software Engineers), what type of page it is, and whether visitors are just browsing or ready to buy.",
    technicalHow:
      "Combines OpenAI structured JSON classification (with Zod schema validation) and a deterministic role/domain taxonomy fallback. Classifies pageType, targetAudience.roles, and visitorIntent.",
    modulePath: "src/features/ai/classifier.ts",
    inputs: ["Title, Meta Description, H1–H3 Headings", "URL Path Segments", "CTA & Body Copy Excerpts"],
    outputs: [
      "Page Type (homepage | product | functional | campaign | resource | case_study)",
      "Target Audience Roles (e.g. HR Manager, CHRO)",
      "Visitor Buying Stage (discovery | consideration | high_intent)"
    ],
    sampleTelemetry: "Classified as FUNCTIONAL page targeting HR Manager, HR Director (Intent: Consideration)"
  },
  {
    step: 4,
    percent: 68,
    id: "semantic_persuasion",
    title: "AI Semantic Persuasion & Copy Specificity Evaluation",
    shortTitle: "4. AI Copy Review",
    plainEnglish:
      "Our AI copy reviewer reads the headlines and proof sections like a skeptical buyer: Does it name a specific problem? Does it promise a measurable result? Are the customer claims backed by real numbers?",
    technicalHow:
      "Evaluates the 5 Conversion Persuasion criteria on a 0–10 evidence scale with strict anti-inflation rules (e.g., logo walls without metrics cannot score above 6.5/10). Includes a deterministic heuristic fallback if no API key is present.",
    modulePath: "src/features/ai/semantic-evaluator.ts",
    inputs: ["Extracted Page Signals", "Classified Target Audience (ICP)", "Hero & Social Proof Copy"],
    outputs: [
      "0–10 Ratings + Verbatim Evidence for all 5 Persuasion Criteria",
      "Specificity Level (vague | moderate | concrete)",
      "Perceived CTA Friction Level (low | medium | high)"
    ],
    sampleTelemetry: "Evaluated 5 persuasion checks • Specificity: concrete • Credibility: 6.0/10"
  },
  {
    step: 5,
    percent: 86,
    id: "playwright_vitals",
    title: "Live Headless Playwright Browser & Core Web Vitals",
    shortTitle: "5. Live Browser",
    plainEnglish:
      "We launch a real headless Chrome browser to take a full-length screenshot, measure exact section coordinates from top to bottom, click the main action button to verify a sign-up form opens, and test mobile load speed.",
    technicalHow:
      "Runs Playwright Chromium (1440×900 viewport) + Google PageSpeed Insights API in parallel. Captures full-page JPEG screenshot, measures DOM bounding boxes (xPercent, yPercent), clicks the primary CTA to detect modal/form rendering, and records LCP, CLS, and FCP.",
    modulePath: "src/features/browser/browser-inspector.ts • src/features/performance/pagespeed-client.ts",
    inputs: ["Live URL", "Primary CTA Selector"],
    outputs: [
      "Full-Page Base64 Screenshot",
      "Actual DOM Section Coordinates (0%–100% Y)",
      "Live CTA Click Verification (Form/Modal Verified boolean)",
      "Core Web Vitals (LCP, CLS, FCP, Performance Score)"
    ],
    sampleTelemetry: "Playwright captured full-page screenshot • Verified interactive modal on CTA click • LCP 2.2s"
  },
  {
    step: 6,
    percent: 100,
    id: "rubric_v3_scoring",
    title: "Rubric v3 Mathematical Scoring, Gates & 1-to-1 Pin Mapping",
    shortTitle: "6. Rubric v3 & Pins",
    plainEnglish:
      "Finally, deterministic math formulas calculate the 0–100 score, apply Conversion-Readiness Gates if a form or button is missing, build the 10-Second Plain-English Summary, and drop 1-to-1 numbered pins on the screenshot.",
    technicalHow:
      "Scales all 13 criteria into Persuasion (50), Execution (35), and Experience (15). Enforces hard caps on Execution if primary CTA or lead capture is missing. Sorts visual annotations top-to-bottom by yPercent and persists the report to Supabase.",
    modulePath: "src/features/scoring/rubric-v3-scorer.ts • src/features/pipeline/grader-pipeline.ts",
    inputs: ["DOM Signals", "AI Semantic Ratings", "Playwright Verification", "Core Web Vitals"],
    outputs: [
      "Final Score (0–100) & Letter Grade (A–F)",
      "10-Second Plain-English Summary Card",
      "1-to-1 Synchronized Screenshot Pins (#1..#N) & CRO Fix Cards",
      "Saved Supabase Audit Record"
    ],
    sampleTelemetry: "Computed 79/100 (Grade B) • Mapped 5 1-to-1 visual pins • Saved to Supabase (#14)"
  }
];

interface CriterionSpec {
  id: string;
  number: number;
  dimension: "persuasion" | "execution" | "experience";
  name: string;
  maxPoints: number;
  sourceLabel: string;
  sourceColor: string;
  plainEnglish: string;
  formula: string;
  tiers: string[];
  examplePass: string;
}

const CRITERIA_SPECS: CriterionSpec[] = [
  {
    id: "persuasion_problem_fit",
    number: 1,
    dimension: "persuasion",
    name: "Audience-Problem Fit & Specificity",
    maxPoints: 10,
    sourceLabel: "AI copy review",
    sourceColor: "text-violet-400 border-violet-800/60 bg-violet-950/40",
    plainEnglish:
      "Does the top of the page clearly name the specific day-to-day problem your target buyer is trying to solve?",
    formula: "Earned = round((AI_ProblemFit_Rating / 10) × 10, 1)",
    tiers: [
      "8.0–10.0 pts: Names a concrete pain point and operational bottleneck in the hero.",
      "5.0–7.9 pts: Mentions the problem domain, but uses broad or generic phrasing.",
      "0.0–4.9 pts: Vague buzzwords ('Transform your business') with no clear problem."
    ],
    examplePass: '"Stop losing 14 hours a week answering repetitive HR policy tickets manually."'
  },
  {
    id: "persuasion_value_prop",
    number: 2,
    dimension: "persuasion",
    name: "Value Proposition Strength & Speed-to-Value",
    maxPoints: 12,
    sourceLabel: "AI copy review",
    sourceColor: "text-violet-400 border-violet-800/60 bg-violet-950/40",
    plainEnglish:
      "Does the main headline promise a clear, measurable result and tell visitors how fast they will see value?",
    formula: "Earned = round((AI_ValueProp_Rating / 10) × 12, 1)",
    tiers: [
      "9.6–12.0 pts: Clear H1 outcome + quantified impact (%, $, x) + explicit deployment timeframe.",
      "6.0–9.5 pts: Clear benefit statement, but missing either exact numbers or time-to-value.",
      "0.0–5.9 pts: Generic slogan that doesn't explain what the product actually delivers."
    ],
    examplePass: '"Automate 70% of employee IT & HR requests — go live in 14 days."'
  },
  {
    id: "persuasion_credibility",
    number: 3,
    dimension: "persuasion",
    name: "Outcome Credibility & Verifiable Proof",
    maxPoints: 10,
    sourceLabel: "AI copy review",
    sourceColor: "text-violet-400 border-violet-800/60 bg-violet-950/40",
    plainEnglish:
      "Are your claims backed up by real customer stories, before/after ROI numbers, and security badges instead of just logos?",
    formula: "Earned = round((AI_Credibility_Rating / 10) × 10, 1)",
    tiers: [
      "8.0–10.0 pts: Named customer quotes paired with verifiable ROI metrics + trust certifications.",
      "5.0–7.9 pts: Passive customer logo wall or compliance badges without quantified customer stories.",
      "0.0–4.9 pts: Unverified claims with zero third-party social proof."
    ],
    examplePass: '"How CHRISTUS Health resolved 72% of HR tickets automatically across 5,000+ employees."'
  },
  {
    id: "persuasion_audience_align",
    number: 4,
    dimension: "persuasion",
    name: "Audience-Message Alignment",
    maxPoints: 10,
    sourceLabel: "AI copy review",
    sourceColor: "text-violet-400 border-violet-800/60 bg-violet-950/40",
    plainEnglish:
      "Is the page written in the everyday language of your target buyer rather than generic one-size-fits-all marketing speak?",
    formula: "Earned = round((AI_Alignment_Rating / 10) × 10, 1)",
    tiers: [
      "8.0–10.0 pts: Directly addresses target ICP roles, workflows, and KPIs throughout the page.",
      "5.0–7.9 pts: Partially tailored to the industry, but could apply to almost any buyer role.",
      "0.0–4.9 pts: Disconnected from the target buyer's actual responsibilities."
    ],
    examplePass: "Uses HR-specific workflows ('onboarding, payroll queries, Workday/SAP sync') for HR Directors."
  },
  {
    id: "persuasion_offer_match",
    number: 5,
    dimension: "persuasion",
    name: "Offer Attractiveness & Problem Match",
    maxPoints: 8,
    sourceLabel: "AI copy review",
    sourceColor: "text-violet-400 border-violet-800/60 bg-violet-950/40",
    plainEnglish:
      "Does the main button offer something genuinely helpful (like a free trial or interactive walkthrough) that feels worth clicking?",
    formula: "Earned = round((AI_OfferMatch_Rating / 10) × 8, 1)",
    tiers: [
      "6.4–8.0 pts: High-value, low-friction offer that matches buyer stage (e.g. 'Try interactive demo').",
      "4.0–6.3 pts: Standard 'Book a demo' button without setting expectations on time or value.",
      "0.0–3.9 pts: High-friction or vague button ('Submit', 'Contact Us') with no clear payoff."
    ],
    examplePass: '"Start 14-day free trial • No credit card required" or "Book a 15-min custom ROI walkthrough".'
  },
  {
    id: "exec_cta_prominence",
    number: 6,
    dimension: "execution",
    name: "CTA Prominence & Clarity of Next Step",
    maxPoints: 10,
    sourceLabel: "Page structure check",
    sourceColor: "text-amber-400 border-amber-800/60 bg-amber-950/40",
    plainEnglish:
      "Is your main action button visible immediately at the top without scrolling, written with an action verb, and clear about what happens next?",
    formula: "Earned = (AboveFold ? 5 : 0) + (ActionVerb ? 3 : 0) + (ExplainsNextStep ? 2 : 0)",
    tiers: [
      "10.0 pts: Visible above the fold (+5), starts with an action verb (+3), and sets next-step expectations (+2).",
      "5.0–8.0 pts: Visible at the top with action text, but doesn't explain what happens after clicking.",
      "0.0–4.0 pts: Hidden below the fold or missing a clear primary button."
    ],
    examplePass: 'Above-the-fold button "Book a demo" with subtext "2-min setup • Live product walkthrough".'
  },
  {
    id: "exec_promise_consistency",
    number: 7,
    dimension: "execution",
    name: "Promise-Destination Consistency",
    maxPoints: 8,
    sourceLabel: "Live browser test",
    sourceColor: "text-sky-400 border-sky-800/60 bg-sky-950/40",
    plainEnglish:
      "When a visitor clicks the main button, does the form or destination actually deliver what the button promised?",
    formula: "Earned = MatchesPromise ? (LeadCaptureVerified ? 8 : 7) : GateTriggered ? 3 : 4",
    tiers: [
      "7.0–8.0 pts: Clicking the button opens a matching sign-up form, demo scheduler, or product flow.",
      "3.0–4.0 pts: Button promises a demo/trial, but drops the visitor on a generic page or unverified link.",
      "0.0 pts: No primary conversion action detected on the page."
    ],
    examplePass: 'Clicking "Book a demo" immediately opens an inline demo booking modal on the same page.'
  },
  {
    id: "exec_lead_capture",
    number: 8,
    dimension: "execution",
    name: "Lead Capture Usability & Verification",
    maxPoints: 10,
    sourceLabel: "Live browser test",
    sourceColor: "text-sky-400 border-sky-800/60 bg-sky-950/40",
    plainEnglish:
      "Can visitors actually enter their email or book a demo right on the page, verified by our live browser clicking the button?",
    formula: "Earned = PlaywrightVerified ? 10 : StaticForm ? 8 : ExternalScript ? 4 : 0",
    tiers: [
      "10.0 pts: Live Playwright click verified an interactive form or modal with working inputs.",
      "8.0 pts: Static HTML <form> with visible input boxes present in the page DOM.",
      "3.5–4.0 pts: Third-party scheduler script detected, but no interactive form verified.",
      "0.0 pts: No lead capture form or modal found (triggers the 30% Execution Gate)."
    ],
    examplePass: "Playwright clicked the hero CTA and confirmed a 3-field modal rendered and accepted input."
  },
  {
    id: "exec_funnel_friction",
    number: 9,
    dimension: "execution",
    name: "Conversion Friction & Funnel Simplicity",
    maxPoints: 7,
    sourceLabel: "Page structure check",
    sourceColor: "text-amber-400 border-amber-800/60 bg-amber-950/40",
    plainEnglish:
      "How many input boxes does the visitor have to fill out? Shorter forms (1–4 boxes) convert dramatically better than long forms.",
    formula: "Earned = (Fields ≤ 4) ? 7 : (Fields ≤ 7) ? 4.5 : 2",
    tiers: [
      "7.0 pts (Low Friction): 1 to 4 input fields (e.g. Work Email, Name, Company).",
      "4.5 pts (Medium Friction): 5 to 7 input fields.",
      "2.0 pts (High Friction): More than 7 fields or missing capture form."
    ],
    examplePass: "Single 'Enter your work email' hero input + 2 follow-up fields in the modal (3 fields total)."
  },
  {
    id: "exp_lcp_speed",
    number: 10,
    dimension: "experience",
    name: "Largest Contentful Paint (LCP)",
    maxPoints: 5,
    sourceLabel: "Lighthouse",
    sourceColor: "text-emerald-400 border-emerald-800/60 bg-emerald-950/40",
    plainEnglish:
      "How many seconds does it take for the main headline and hero image to appear on a mobile phone?",
    formula: "Earned = (LCP ≤ 2.5s) ? 5 : (LCP ≤ 4.0s) ? 2.5 : 0",
    tiers: [
      "5.0 pts (Fast): Loads in 2.5 seconds or less (Google's 'Good' standard).",
      "2.5 pts (Moderate): Loads between 2.6 and 4.0 seconds.",
      "0.0 pts (Slow): Takes longer than 4.0 seconds (high mobile bounce risk)."
    ],
    examplePass: "LCP measured at 2.1s on mobile viewport."
  },
  {
    id: "exp_cls_stability",
    number: 11,
    dimension: "experience",
    name: "Cumulative Layout Shift (CLS)",
    maxPoints: 4,
    sourceLabel: "Lighthouse",
    sourceColor: "text-emerald-400 border-emerald-800/60 bg-emerald-950/40",
    plainEnglish:
      "Do buttons, images, or text jump around unexpectedly while the page is loading?",
    formula: "Earned = (CLS ≤ 0.10) ? 4 : (CLS ≤ 0.25) ? 2 : 0",
    tiers: [
      "4.0 pts (Stable): CLS score of 0.10 or less — page stays visually locked in place.",
      "2.0 pts (Minor Shift): CLS between 0.11 and 0.25.",
      "0.0 pts (Unstable): CLS above 0.25 — elements shift around while visitors try to click."
    ],
    examplePass: "CLS measured at 0.02 (near-zero layout movement)."
  },
  {
    id: "exp_mobile_viewport",
    number: 12,
    dimension: "experience",
    name: "Mobile Viewport Configuration",
    maxPoints: 3,
    sourceLabel: "Page structure check",
    sourceColor: "text-amber-400 border-amber-800/60 bg-amber-950/40",
    plainEnglish:
      "Is the webpage properly configured to scale cleanly on smartphone screens without sideways scrolling?",
    formula: "Earned = hasResponsiveViewportMeta ? 3 : 0",
    tiers: [
      "3.0 pts (Passed): Responsive meta[name='viewport'] tag with width=device-width present.",
      "0.0 pts (Failed): Missing mobile viewport tag."
    ],
    examplePass: '<meta name="viewport" content="width=device-width, initial-scale=1">'
  },
  {
    id: "exp_text_readability",
    number: 13,
    dimension: "experience",
    name: "Text Readability & Structure",
    maxPoints: 3,
    sourceLabel: "Page structure check",
    sourceColor: "text-amber-400 border-amber-800/60 bg-amber-950/40",
    plainEnglish:
      "Does the page have a clear main title (H1) and enough readable copy to explain the product clearly?",
    formula: "Earned = (hasClearH1 && wordCount ≥ 100) ? 3 : hasClearH1 ? 1.5 : 0",
    tiers: [
      "3.0 pts (Passed): Clear H1 heading + at least 100 words of structured body copy.",
      "1.5 pts (Partial): Has an H1 heading, but fewer than 100 words of copy.",
      "0.0 pts (Failed): Missing a main H1 headline."
    ],
    examplePass: "1 clear H1 headline + 850 words organized across 6 H2 subheadings."
  }
];

export default function AlgorithmAndPipelinePage() {
  const [activeStageIdx, setActiveStageIdx] = useState<number>(0);
  const [dimFilter, setDimFilter] = useState<"all" | "persuasion" | "execution" | "experience">("all");

  // Interactive Sandbox State
  const [simPersuasion, setSimPersuasion] = useState<number>(38);
  const [simExecutionRaw, setSimExecutionRaw] = useState<number>(28);
  const [simExperience, setSimExperience] = useState<number>(14);
  const [simHasCta, setSimHasCta] = useState<boolean>(true);
  const [simHasForm, setSimHasForm] = useState<boolean>(true);

  // Calculate Sandbox Output using exact Rubric v3 rules
  const gateCap = !simHasCta ? 7.0 : !simHasForm ? 10.5 : 35.0;
  const gateApplied = !simHasCta || !simHasForm;
  const gateLabel = !simHasCta
    ? "Missing Primary CTA Gate (Caps Execution at 20% = 7.0 / 35 pts)"
    : !simHasForm
    ? "Missing Working Sign-Up Form Gate (Caps Execution at 30% = 10.5 / 35 pts)"
    : "No Gate Triggered (Full 35 Execution pts unlocked)";

  const simExecutionFinal = Math.round(Math.min(simExecutionRaw, gateCap) * 10) / 10;
  const simTotalScore = Math.round(simPersuasion + simExecutionFinal + simExperience);
  const simLetterGrade =
    simTotalScore >= 85
      ? "A"
      : simTotalScore >= 70
      ? "B"
      : simTotalScore >= 55
      ? "C"
      : simTotalScore >= 40
      ? "D"
      : "F";

  const activeStage = PIPELINE_STAGES[activeStageIdx];
  const filteredCriteria = CRITERIA_SPECS.filter(
    (c) => dimFilter === "all" || c.dimension === dimFilter
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-zinc-800">
      {/* Top Editorial Navigation */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-left hover:opacity-90 transition-opacity"
            >
              <div className="w-6 h-6 rounded bg-white text-zinc-950 flex items-center justify-center font-bold text-xs tracking-tighter shadow-sm">
                C
              </div>
              <span className="font-semibold tracking-tight text-white text-sm">Convex</span>
            </Link>
            <span className="text-zinc-600 text-xs">/</span>
            <span className="text-xs text-emerald-400 font-mono">
              Algorithm &amp; 6-Stage Pipeline
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs bg-white text-zinc-950 hover:bg-zinc-200 font-semibold flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-md shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Evaluator</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* Hero Header */}
        <section className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/35 via-zinc-900/80 to-zinc-950 p-6 sm:p-8 shadow-[0_0_50px_-12px_rgba(16,185,129,0.22)]">
          <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/70 text-emerald-300 text-[11px] font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Architecture &amp; Scoring Guide</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              How Convex Grades a Landing Page
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Convex never guesses a random score. Every URL runs through a{" "}
              <strong className="text-white">6-Stage Real-Time Pipeline</strong> (DOM parsing, ICP
              classification, AI copy review, and live Playwright browser verification) and is
              scored by our deterministic <strong className="text-white">Rubric v3 Algorithm</strong>{" "}
              across 13 evidence-backed checks.
            </p>
          </div>
        </section>

        {/* SECTION 1: Interactive 6-Stage Analysis Pipeline Explorer */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Part 1 • Real-Time Execution Flow
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Interactive 6-Stage Analysis Pipeline
              </h2>
              <p className="text-xs text-zinc-400">
                Click any stage below to inspect what happens under the hood as the progress bar streams from 10% to 100%.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveStageIdx((prev) => Math.max(prev - 1, 0))}
                disabled={activeStageIdx === 0}
                className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 disabled:opacity-40"
              >
                ← Prev Stage
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveStageIdx((prev) => Math.min(prev + 1, PIPELINE_STAGES.length - 1))
                }
                disabled={activeStageIdx === PIPELINE_STAGES.length - 1}
                className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-700/70 text-xs text-emerald-200 disabled:opacity-40"
              >
                Next Stage →
              </button>
            </div>
          </div>

          {/* Interactive Stepper Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {PIPELINE_STAGES.map((st, idx) => {
              const isSelected = idx === activeStageIdx;
              const isCompleted = idx < activeStageIdx;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setActiveStageIdx(idx)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-950/30 shadow-lg ring-1 ring-emerald-500/30"
                      : isCompleted
                      ? "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                      : "border-zinc-800/80 bg-zinc-950 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-emerald-500 text-zinc-950"
                          : isCompleted
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                          : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                      }`}
                    >
                      Stage {st.step}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">{st.percent}%</span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate">{st.shortTitle}</div>
                </button>
              );
            })}
          </div>

          {/* Simulated Progress Bar matching the active stage */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-emerald-400 font-semibold">
                Live Stream Milestone: {activeStage.percent}% — {activeStage.title}
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                application/x-ndjson stream
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${activeStage.percent}%` }}
              />
            </div>
          </div>

          {/* Active Stage Deep-Dive Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-semibold">
                    Stage {activeStage.step} of 6 ({activeStage.percent}%)
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 truncate">
                    {activeStage.modulePath}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white pt-1">
                  {activeStage.title}
                </h3>
              </div>

              {/* Plain English Box */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/50 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  In Simple Words (Plain English)
                </div>
                <p className="text-xs sm:text-[13px] text-zinc-100 leading-relaxed">
                  {activeStage.plainEnglish}
                </p>
              </div>

              {/* Technical Execution Box */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  Under the Hood (Engineering Mechanics)
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {activeStage.technicalHow}
                </p>
              </div>

              {/* Sample NDJSON Telemetry Event */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{activeStage.sampleTelemetry}</span>
                </div>
                <span className="text-[10px] text-zinc-500 shrink-0">Live Event</span>
              </div>
            </div>

            {/* Right: Stage Inputs & Outputs */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-2.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  Stage Inputs
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {activeStage.inputs.map((inp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-zinc-500 font-mono">→</span>
                      <span>{inp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/90 border border-emerald-900/50 space-y-2.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  Stage Outputs Produced
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-200">
                  {activeStage.outputs.map((out, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Interactive Rubric v3 Score & Gate Sandbox */}
        <section className="space-y-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Part 2 • Interactive Formula Playground
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Rubric v3 Master Equation &amp; Conversion-Readiness Gate Simulator
            </h2>
            <p className="text-xs text-zinc-400">
              Drag the dimension sliders or toggle the Conversion-Readiness Gates below to see how our mathematical formula computes the final 0–100 score.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left (7 cols): Interactive Sliders & Gate Toggles */}
            <div className="lg:col-span-7 space-y-5">
              {/* Master Equation Box */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <div className="text-[10px] font-mono uppercase text-zinc-500">
                  Master Mathematical Formula (Deterministic TypeScript)
                </div>
                <div className="font-mono text-xs sm:text-sm text-emerald-300">
                  Total Score = round( Persuasion [0–50] + min(Execution [0–35], GateCap) + Experience [0–15] )
                </div>
              </div>

              {/* 3 Dimension Sliders */}
              <div className="space-y-4">
                {/* Slider A: Persuasion */}
                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      1. Message &amp; Copy Persuasion (Max 50 pts)
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {simPersuasion} / 50 pts
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={0.5}
                    value={simPersuasion}
                    onChange={(e) => setSimPersuasion( parseFloat(e.target.value) )}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="text-[11px] text-zinc-400">
                    Sum of checks #1–#5 (Problem Fit, Value Prop, Credibility Proof, Audience Alignment, Offer Match).
                  </div>
                </div>

                {/* Slider B: Execution */}
                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      2. Button &amp; Form Execution (Max 35 pts)
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      Raw: {simExecutionRaw} / 35 pts →{" "}
                      <span className={gateApplied ? "text-rose-400" : "text-emerald-400"}>
                        Effective: {simExecutionFinal} / 35 pts
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={35}
                    step={0.5}
                    value={simExecutionRaw}
                    onChange={(e) => setSimExecutionRaw( parseFloat(e.target.value) )}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="text-[11px] text-zinc-400">
                    Sum of checks #6–#9 (CTA Prominence, Promise Match, Live Form Verification, Form Field Count).
                  </div>
                </div>

                {/* Slider C: Experience */}
                <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      3. Speed &amp; Mobile Experience (Max 15 pts)
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {simExperience} / 15 pts
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    step={0.5}
                    value={simExperience}
                    onChange={(e) => setSimExperience( parseFloat(e.target.value) )}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="text-[11px] text-zinc-400">
                    Sum of checks #10–#13 (LCP Load Speed, CLS Visual Stability, Mobile Viewport, H1 &amp; Copy Readability).
                  </div>
                </div>
              </div>

              {/* Conversion-Readiness Gate Toggles */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Test Conversion-Readiness Gates (Why Great Copy Still Fails Without a Funnel)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={simHasCta}
                      onChange={(e) => setSimHasCta(e.target.checked)}
                      className="accent-emerald-400 w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-white">Page Has Primary CTA Button</div>
                      <div className="text-[10px] text-zinc-400">
                        If unchecked → Caps Execution at 7.0 / 35
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={simHasForm}
                      onChange={(e) => setSimHasForm(e.target.checked)}
                      className="accent-emerald-400 w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-white">Working On-Page Form / Modal</div>
                      <div className="text-[10px] text-zinc-400">
                        If unchecked → Caps Execution at 10.5 / 35
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right (5 cols): Live Computed Score Output Pod */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Simulated Live Result
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                    simTotalScore >= 80
                      ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                      : simTotalScore >= 60
                      ? "bg-amber-950 text-amber-300 border-amber-700"
                      : "bg-rose-950 text-rose-300 border-rose-700"
                  }`}
                >
                  Grade {simLetterGrade}
                </span>
              </div>

              <div className="text-center py-3 space-y-1">
                <div className="text-5xl font-bold font-mono text-white tabular-nums">
                  {simTotalScore}
                  <span className="text-xl text-zinc-500 font-normal"> / 100</span>
                </div>
                <div className="text-xs text-zinc-400">{gateLabel}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 font-mono text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-400">A. Persuasion:</span>
                  <span className="text-white">{simPersuasion} / 50 pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">B. Execution:</span>
                  <span className={gateApplied ? "text-rose-400 font-semibold" : "text-white"}>
                    min({simExecutionRaw}, {gateCap}) = {simExecutionFinal} / 35 pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">C. Experience:</span>
                  <span className="text-white">{simExperience} / 15 pts</span>
                </div>
                <div className="border-t border-zinc-800 pt-1.5 flex justify-between font-bold text-emerald-400">
                  <span>Final Total Score:</span>
                  <span>
                    round({simPersuasion} + {simExecutionFinal} + {simExperience}) = {simTotalScore}
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-zinc-500 text-center">
                Grade Scale: A (≥85) • B (70–84) • C (55–69) • D (40–54) • F (&lt;40)
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Complete 13-Check Rubric Explorer (Plain English + Exact Math) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Part 3 • Complete 13-Check Reference
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                All 13 Rubric Checks — Plain English &amp; Exact Formulas
              </h2>
              <p className="text-xs text-zinc-400">
                Every check combines a simple buyer-focused question with a strict, reproducible mathematical scoring rule.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              {(
                [
                  { key: "all", label: "All 13 Checks (100 pts)" },
                  { key: "persuasion", label: "1. Persuasion (50 pts)" },
                  { key: "execution", label: "2. Execution (35 pts)" },
                  { key: "experience", label: "3. Experience (15 pts)" }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDimFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    dimFilter === tab.key
                      ? "bg-zinc-800 text-white border border-zinc-700"
                      : "bg-zinc-900/50 text-zinc-400 hover:text-white border border-zinc-800/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCriteria.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/35 p-5 space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200">
                          Check #{c.number}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${c.sourceColor}`}
                        >
                          {c.sourceLabel}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1.5">{c.name}</h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-md shrink-0">
                      {c.maxPoints} pts max
                    </span>
                  </div>

                  {/* Plain English */}
                  <div className="p-3 rounded-lg bg-emerald-950/15 border border-emerald-900/40 space-y-1">
                    <div className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">
                      In Plain English
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">{c.plainEnglish}</p>
                  </div>

                  {/* Exact Formula */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase text-zinc-500">
                      Exact Scoring Formula
                    </div>
                    <div className="p-2 rounded bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-emerald-300 break-words">
                      {c.formula}
                    </div>
                  </div>

                  {/* Tiers */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase text-zinc-500">
                      Point Tiers
                    </div>
                    <ul className="space-y-1 text-[11px] text-zinc-400 font-mono">
                      {c.tiers.map((t, i) => (
                        <li key={i}>• {t}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
                  <strong className="text-zinc-200">Winning Example: </strong>
                  {c.examplePass}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA to return to Evaluator */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              Ready to test a live landing page against this pipeline?
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Run a real-time evaluation or inspect any cached audit from Supabase.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
          >
            <span>Launch Landing Page Evaluator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </main>
    </div>
  );
}
