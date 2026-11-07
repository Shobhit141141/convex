"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Eye,
  Calculator,
  Users,
  BarChart3,
  ExternalLink,
  MapPin
} from "lucide-react";

const PIPELINE_STEPS = [
  {
    step: 1,
    percent: "10%",
    title: "URL Cache & Fetch",
    oneLiner:
      "Checks Supabase for a saved audit of leena.ai/function/hr, or fetches the live HTML safely.",
    image: "/leena-examples/leena-hr-hero.jpg",
    pinX: 50,
    pinY: 12,
    pinLabel: "GET https://leena.ai/function/hr (200 OK • 310ms)",
    leenaExample: 'Target URL normalized → "https://leena.ai/function/hr"',
    outputs: ["Instant Cache Lookup", "SSRF Guard Passed", "142 KB Live HTML"]
  },
  {
    step: 2,
    percent: "28%",
    title: "Page Structure",
    oneLiner:
      "Extracts the H1 headline, 'Book a demo' button, and the 4 quantified proof counters from the DOM.",
    image: "/leena-examples/leena-hr-hero.jpg",
    pinX: 38,
    pinY: 36,
    pinLabel: 'H1: "Most HR requests shouldn\'t reach a human. Now they don\'t."',
    leenaExample:
      'Found H1 + Primary CTA ("Book a demo") + 4 metrics (45 days, 70%+, 4–10x, 500+)',
    outputs: ["1 Distinct H1", 'CTA: "Book a demo"', "4 Quantified Stats"]
  },
  {
    step: 3,
    percent: "48%",
    title: "Buyer & Intent",
    oneLiner:
      "Detects that this page is a Functional Solution page built for HR Leadership in the Consideration stage.",
    image: "/leena-examples/leena-hr-hero.jpg",
    pinX: 46,
    pinY: 44,
    pinLabel: 'Audience: "Built for HR leadership and People Ops"',
    leenaExample:
      "Classified as FUNCTIONAL page • Buyer: HR Leadership & People Ops • Stage: Consideration",
    outputs: ["Type: Functional", "ICP: HR Directors", "Intent: Consideration"]
  },
  {
    step: 4,
    percent: "68%",
    title: "AI Copy Review",
    oneLiner:
      "Scores how specific the HR pain point is (8/10) and checks if the 70%+ ticket stat has customer quotes (6/10).",
    image: "/leena-examples/leena-hr-proof.jpg",
    pinX: 48,
    pinY: 34,
    pinLabel: "45 days to go-live • 70%+ tickets auto-resolved • 4–10x ROI",
    leenaExample:
      "Strong quantified metrics (45 days, 70%+), but logo carousel lacks inline customer quotes.",
    outputs: ["Problem Fit: 8/10", "Value Prop: 9.6/12", "Proof: 6/10"]
  },
  {
    step: 5,
    percent: "86%",
    title: "Live Browser",
    oneLiner:
      "Opens headless Chrome on leena.ai/function/hr, clicks 'Book a demo', and checks mobile speed (2.2s).",
    image: "/leena-examples/leena-hr-cta-form.jpg",
    pinX: 78,
    pinY: 16,
    pinLabel: 'Live Playwright Click on "Book a demo" → Verifies Form Modal',
    leenaExample:
      "Playwright clicked 'Book a demo', captured full-page screenshot, and measured LCP (2.2s).",
    outputs: ["Full Screenshot", "Modal Click Tested", "LCP: 2.2s • CLS: 0.03"]
  },
  {
    step: 6,
    percent: "100%",
    title: "Score & 1-to-1 Pins",
    oneLiner:
      "Computes 80/100 (Grade B) via Rubric v3 and drops numbered pins right on the leena.ai screenshot.",
    image: "/leena-examples/leena-hr-workflow.jpg",
    pinX: 52,
    pinY: 48,
    pinLabel: "Pin #3 • Product Workflow Zone (~46% Y) → 80/100 (Grade B)",
    leenaExample:
      "Total = 39 (Persuasion) + 26 (Execution) + 15 (Experience) = 80 / 100 (Grade B)",
    outputs: ["Score: 80 / 100 (B)", "10s Plain Summary", "5 Synchronized Pins"]
  }
];

interface InteractiveCheck {
  num: number;
  dim: "persuasion" | "execution" | "experience";
  name: string;
  simple: string;
  formula: string;
  pts: number;
  leenaEarned: number;
  leenaStatus: "passed" | "partial";
  leenaImage: string;
  pinX: number;
  pinY: number;
  leenaQuote: string;
  leenaCalc: string;
  leenaWhy: string;
}

const CHECKS: InteractiveCheck[] = [
  {
    num: 1,
    dim: "persuasion",
    name: "Problem Fit & Specificity",
    simple: "Names a specific buyer problem right in the hero.",
    formula: "round((Rating / 10) × 10, 1)",
    pts: 10,
    leenaEarned: 8,
    leenaStatus: "passed",
    leenaImage: "/leena-examples/leena-hr-hero.jpg",
    pinX: 38,
    pinY: 34,
    leenaQuote:
      '"Most HR requests shouldn\'t reach a human. Now they don\'t. Harrison closes Tier-1 HR requests — leave, letters, benefits, payroll — in seconds, not days."',
    leenaCalc: "round((8.0 / 10) × 10, 1) = 8.0 / 10 pts",
    leenaWhy:
      "Directly names the exact operational bottleneck HR leaders face (repetitive Tier-1 leave, payroll, and policy tickets)."
  },
  {
    num: 2,
    dim: "persuasion",
    name: "Value Prop & Speed-to-Value",
    simple: "Promises a measurable result and how fast it goes live.",
    formula: "round((Rating / 10) × 12, 1)",
    pts: 12,
    leenaEarned: 9.6,
    leenaStatus: "passed",
    leenaImage: "/leena-examples/leena-hr-proof.jpg",
    pinX: 25,
    pinY: 32,
    leenaQuote: '"45 days TO GO-LIVE • 70%+ TICKETS AUTO-RESOLVED • 4–10x MEASURED ROI"',
    leenaCalc: "round((8.0 / 10) × 12, 1) = 9.6 / 12 pts",
    leenaWhy:
      "Combines a concrete deployment timeframe (45 days) with quantified ticket deflection (70%+) right below the hero."
  },
  {
    num: 3,
    dim: "persuasion",
    name: "Customer Proof & Credibility",
    simple: "Backs claims with named customer quotes and ROI numbers.",
    formula: "round((Rating / 10) × 10, 1)",
    pts: 10,
    leenaEarned: 6,
    leenaStatus: "partial",
    leenaImage: "/leena-examples/leena-hr-proof.jpg",
    pinX: 52,
    pinY: 62,
    leenaQuote:
      'Top banner mentions "How CHRISTUS Health drove AI adoption across 5,000 employees", but mid-page proof relies on static logos.',
    leenaCalc: "round((6.0 / 10) × 10, 1) = 6.0 / 10 pts",
    leenaWhy:
      "Has strong vendor stats (500+ enterprises), but pairing the logo strip with 1–2 inline attributed customer ROI quotes would lift this to 10/10."
  },
  {
    num: 4,
    dim: "persuasion",
    name: "Buyer Language Alignment",
    simple: "Uses terminology tailored to the target buyer's job.",
    formula: "round((Rating / 10) × 10, 1)",
    pts: 10,
    leenaEarned: 8,
    leenaStatus: "passed",
    leenaImage: "/leena-examples/leena-hr-workflow.jpg",
    pinX: 48,
    pinY: 45,
    leenaQuote:
      '"Built for HR leadership and People Ops • Pre-integrated with Workday, ServiceNow, SAP SuccessFactors"',
    leenaCalc: "round((8.0 / 10) × 10, 1) = 8.0 / 10 pts",
    leenaWhy:
      "Speaks directly in CHRO / People Ops vocabulary (Tier-1 HR service desk, Workday/SAP integrations, employee onboarding)."
  },
  {
    num: 5,
    dim: "persuasion",
    name: "Offer Appeal & Low Friction",
    simple: "Main button offers a valuable, low-hesitation next step.",
    formula: "round((Rating / 10) × 8, 1)",
    pts: 8,
    leenaEarned: 6.4,
    leenaStatus: "passed",
    leenaImage: "/leena-examples/leena-hr-hero.jpg",
    pinX: 27,
    pinY: 51,
    leenaQuote: 'Hero CTA: "Meet Harrison live →" + Navbar CTA: "Book a demo"',
    leenaCalc: "round((8.0 / 10) × 8, 1) = 6.4 / 8 pts",
    leenaWhy:
      '"Meet Harrison live" feels interactive and specific, though adding "2-min walkthrough • No commitment" microcopy would reduce hesitation further.'
  },
  {
    num: 6,
    dim: "execution",
    name: "CTA Visibility & Next Step",
    simple: "Main button is visible at the top with clear action text.",
    formula: "Top(+5) + ActionVerb(+3) + NextStepInfo(+2)",
    pts: 10,
    leenaEarned: 8,
    leenaStatus: "passed",
    leenaImage: "/leena-examples/leena-hr-hero.jpg",
    pinX: 83,
    pinY: 9,
    leenaQuote: 'Above-the-fold CTA "Book a demo" (Top +5, Action Verb +3, Microcopy +0)',
    leenaCalc: "5 + 3 + 0 = 8.0 / 10 pts",
    leenaWhy:
      "Immediately visible in both the sticky header and hero (+8 pts), missing only a short expectation line underneath (+2 pts)."
  },
  {
    num: 7,
    dim: "execution",
    name: "Promise–Destination Match",
    simple: "Clicking the button opens what the button promised.",
    formula: "MatchesPromise ? (Verified ? 8 : 7) : 3",
    pts: 8,
    leenaEarned: 7,
    leenaStatus: "passed",
    leenaImage: "/leena-examples/leena-hr-cta-form.jpg",
    pinX: 50,
    pinY: 42,
    leenaQuote: 'Clicking "Book a demo" opens the demo booking experience directly.',
    leenaCalc: "MatchesPromise (true) → 7.0 / 8 pts",
    leenaWhy:
      "The destination matches the 'Book a demo' promise without redirecting to an unrelated page."
  },
  {
    num: 8,
    dim: "execution",
    name: "Working Sign-Up Form",
    simple: "Live browser confirms a working form opens on click.",
    formula: "PlaywrightVerified ? 10 : StaticForm ? 8 : 0",
    pts: 10,
    leenaEarned: 10,
    leenaStatus: "passed",
    leenaImage: "/leena-examples/leena-hr-cta-form.jpg",
    pinX: 54,
    pinY: 52,
    leenaQuote: "Playwright live click verified interactive lead capture form on page.",
    leenaCalc: "PlaywrightVerified = true → 10.0 / 10 pts",
    leenaWhy:
      "Unlike Rubric v2 (which gave 100% credit just for a HubSpot <script> tag), Rubric v3 clicks the button in headless Chrome to verify the form renders."
  },
  {
    num: 9,
    dim: "execution",
    name: "Short Form (Low Friction)",
    simple: "Fewer input boxes mean fewer visitors abandon the form.",
    formula: "≤4 fields ? 7 : ≤7 fields ? 4.5 : 2",
    pts: 7,
    leenaEarned: 2,
    leenaStatus: "partial",
    leenaImage: "/leena-examples/leena-hr-cta-form.jpg",
    pinX: 50,
    pinY: 64,
    leenaQuote: "Detected >7 total input fields across page/modal capture containers.",
    leenaCalc: "Fields > 7 → 2.0 / 7 pts",
    leenaWhy:
      "Enterprise forms with many required fields create drop-off risk; trimming to 3 fields (Work Email, Name, Company) unlocks +5 pts."
  },
  {
    num: 10,
    dim: "experience",
    name: "Load Speed (LCP)",
    simple: "Main hero content appears in under 2.5 seconds on mobile.",
    formula: "LCP ≤ 2.5s ? 5 : LCP ≤ 4.0s ? 2.5 : 0",
    pts: 5,
    leenaEarned: 5,
    leenaStatus: "passed",
    leenaImage: "/leena-examples/leena-hr-hero.jpg",
    pinX: 50,
    pinY: 25,
    leenaQuote: "Measured LCP = 2.2s (Target ≤ 2.5s)",
    leenaCalc: "2.2s ≤ 2.5s → 5.0 / 5 pts",
    leenaWhy:
      "Hero headline and interactive chat preview render in 2.2 seconds, keeping mobile bounce rates low."
  },
  {
    num: 11,
    dim: "experience",
    name: "Visual Stability (CLS)",
    simple: "Buttons and text stay still while the page loads.",
    formula: "CLS ≤ 0.10 ? 4 : CLS ≤ 0.25 ? 2 : 0",
    pts: 4,
    leenaEarned: 4,
    leenaStatus: "passed",
    leenaImage: "/leena-examples/leena-hr-hero.jpg",
    pinX: 50,
    pinY: 60,
    leenaQuote: "Measured CLS = 0.03 (Target ≤ 0.10)",
    leenaCalc: "0.03 ≤ 0.10 → 4.0 / 4 pts",
    leenaWhy:
      "Explicit image dimensions prevent layout shifts as the hero graphic and stat counters load."
  },
  {
    num: 12,
    dim: "experience",
    name: "Mobile Screen Fit",
    simple: "Configured to scale cleanly on smartphone screens.",
    formula: "HasViewportMeta ? 3 : 0",
    pts: 3,
    leenaEarned: 3,
    leenaStatus: "passed",
    leenaImage: "/leena-examples/leena-hr-hero.jpg",
    pinX: 18,
    pinY: 14,
    leenaQuote: '<meta name="viewport" content="width=device-width, initial-scale=1">',
    leenaCalc: "Viewport present → 3.0 / 3 pts",
    leenaWhy: "Properly scales typography and CTA buttons on mobile viewports."
  },
  {
    num: 13,
    dim: "experience",
    name: "Clear Title & Copy Depth",
    simple: "Has one clear H1 title and enough text to explain the offer.",
    formula: "(HasH1 && Words ≥ 100) ? 3 : 1.5",
    pts: 3,
    leenaEarned: 3,
    leenaStatus: "passed",
    leenaImage: "/leena-examples/leena-hr-workflow.jpg",
    pinX: 35,
    pinY: 28,
    leenaQuote: "1 clear H1 heading + 1,240 words of structured HR workflow copy.",
    leenaCalc: "H1 present + 1,240 words ≥ 100 → 3.0 / 3 pts",
    leenaWhy: "Clean heading hierarchy makes the page easy to scan for busy HR executives."
  }
];

const LEENA_PRESETS = [
  {
    name: "leena.ai Homepage",
    url: "https://leena.ai",
    image: "/leena-examples/leena-home-hero.jpg",
    persuasion: 42.5,
    execution: 25.5,
    experience: 15,
    hasCta: true,
    hasForm: true,
    cvr: "0.56% Actual CVR (18,343 sessions)",
    note: "Broad C-suite appeal, 8 enterprise logos, 4–10x ROI metrics."
  },
  {
    name: "leena.ai/function/hr",
    url: "https://leena.ai/function/hr",
    image: "/leena-examples/leena-hr-hero.jpg",
    persuasion: 39,
    execution: 26,
    experience: 15,
    hasCta: true,
    hasForm: true,
    cvr: "0.58% Actual CVR (1,907 sessions)",
    note: "Sharp HR problem hook ('45 days to go-live'), needs customer-attributed quotes."
  },
  {
    name: "CHRISTUS Webinar Page",
    url: "https://leena.ai/christus-health-webinar",
    image: "/leena-examples/leena-hr-proof.jpg",
    persuasion: 36,
    execution: 25.5,
    experience: 15,
    hasCta: true,
    hasForm: true,
    cvr: "0.11% Actual CVR (12,402 sessions • 79% Cold Paid Social)",
    note: "Single-customer story; high form friction for cold social traffic."
  },
  {
    name: "Simulated Broken Form Gate",
    url: "https://leena.ai/function/hr (No Form)",
    image: "/leena-examples/leena-hr-cta-form.jpg",
    persuasion: 39,
    execution: 26,
    experience: 15,
    hasCta: true,
    hasForm: false,
    cvr: "Gate Triggered → Execution Capped at 10.5 / 35",
    note: "Shows how Rubric v3 blocks score inflation when lead capture fails."
  }
];

const AUDIENCE_PROFILES = [
  {
    id: "enterprise",
    label: "Enterprise Buyer (CIO / CHRO)",
    examplePage: "leena.ai Homepage",
    whatChanges:
      "Security badges (SOC2/ISO), named enterprise case studies, and ROI metrics carry maximum weight in Check #3 (Outcome Credibility). A 'Book a demo' modal is expected and not penalized as high-friction.",
    weightedSignal: "Outcome Credibility & Security Proof (10 pts) + Enterprise Demo CTA",
    why: "Enterprise buyers require risk reduction (compliance + peer logos) before booking a vendor call."
  },
  {
    id: "practitioner",
    label: "Functional Leader (HR / IT Director)",
    examplePage: "leena.ai/function/hr",
    whatChanges:
      "Workflow specificity (Workday/ServiceNow integrations, ticket auto-resolution %) and Speed-to-Value ('Live in 45 days') drive Checks #1, #2, and #4.",
    weightedSignal: "Problem Specificity (10 pts) & Speed-to-Value (12 pts)",
    why: "Functional heads care most about whether the tool plugs into their existing stack and solves daily ticket backlog fast."
  },
  {
    id: "reader",
    label: "Educational / Webinar Visitor",
    examplePage: "leena.ai/christus-health-webinar",
    whatChanges:
      "Compliance badges are not required, but Check #7 (Promise–Destination Match) & Check #9 (Form Friction) penalize pages that say 'Watch Webinar' yet force a heavy 7-field enterprise sales form.",
    weightedSignal: "Promise–Destination Match (8 pts) & Form Simplicity (7 pts)",
    why: "Cold educational visitors bounce immediately if a content offer traps them in a high-commitment sales form."
  }
];

export default function AlgorithmPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [tab, setTab] = useState<"all" | "persuasion" | "execution" | "experience">("all");
  const [selectedCheckNum, setSelectedCheckNum] = useState<number>(1);
  const [activeAudience, setActiveAudience] = useState<string>("practitioner");

  // Interactive Calculator State (defaults to leena.ai/function/hr)
  const [activePresetName, setActivePresetName] = useState("leena.ai/function/hr");
  const [presetImage, setPresetImage] = useState("/leena-examples/leena-hr-hero.jpg");
  const [presetNote, setPresetNote] = useState(LEENA_PRESETS[1].note);
  const [presetCvr, setPresetCvr] = useState(LEENA_PRESETS[1].cvr);
  const [persuasion, setPersuasion] = useState(39);
  const [executionRaw, setExecutionRaw] = useState(26);
  const [experience, setExperience] = useState(15);
  const [hasCta, setHasCta] = useState(true);
  const [hasForm, setHasForm] = useState(true);

  const applyPreset = (p: (typeof LEENA_PRESETS)[number]) => {
    setActivePresetName(p.name);
    setPresetImage(p.image);
    setPresetNote(p.note);
    setPresetCvr(p.cvr);
    setPersuasion(p.persuasion);
    setExecutionRaw(p.execution);
    setExperience(p.experience);
    setHasCta(p.hasCta);
    setHasForm(p.hasForm);
  };

  const gateCap = !hasCta ? 7.0 : !hasForm ? 10.5 : 35.0;
  const executionFinal = Math.min(executionRaw, gateCap);
  const totalScore = Math.round(persuasion + executionFinal + experience);
  const grade =
    totalScore >= 85 ? "A" : totalScore >= 70 ? "B" : totalScore >= 55 ? "C" : totalScore >= 40 ? "D" : "F";

  const step = PIPELINE_STEPS[activeStep];
  const visibleChecks = CHECKS.filter((c) => tab === "all" || c.dim === tab);
  const activeCheck =
    visibleChecks.find((c) => c.num === selectedCheckNum) || visibleChecks[0] || CHECKS[0];
  const currentAudience =
    AUDIENCE_PROFILES.find((a) => a.id === activeAudience) || AUDIENCE_PROFILES[1];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90">
              <div className="w-6 h-6 rounded bg-white text-zinc-950 flex items-center justify-center font-bold text-xs">
                C
              </div>
              <span className="font-semibold text-white text-sm">Convex</span>
            </Link>
            <span className="text-zinc-600 text-xs">/</span>
            <span className="text-xs text-emerald-400 font-mono">
              Interactive Walkthrough (leena.ai)
            </span>
          </div>

          <Link
            href="/"
            className="text-xs bg-white text-zinc-950 hover:bg-zinc-200 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Grader</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* Compact Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-800/80 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Example Walkthrough • Using Real leena.ai Pages</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              How Convex Grades a Landing Page
            </h1>
          </div>
          <a
            href="https://leena.ai/function/hr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors"
          >
            <span>Example Page: leena.ai/function/hr</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* 1. Interactive 6-Step Pipeline with Live Leena.ai Visual Preview */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/35 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                1. 6-Step Analysis Pipeline (Walkthrough on leena.ai/function/hr)
              </h2>
              <p className="text-xs text-zinc-400">
                Click any step to see what we extract from the live Leena AI page.
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setActiveStep((s) => Math.max(s - 1, 0))}
                disabled={activeStep === 0}
                className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => setActiveStep((s) => Math.min(s + 1, PIPELINE_STEPS.length - 1))}
                disabled={activeStep === PIPELINE_STEPS.length - 1}
                className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-700/70 text-xs text-emerald-200 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>

          {/* 6 Clickable Step Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {PIPELINE_STEPS.map((s, idx) => {
              const active = idx === activeStep;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? "border-emerald-500 bg-emerald-950/35 text-white shadow-md"
                      : "border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className={active ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                      STEP 0{s.step}
                    </span>
                    <span>{s.percent}</span>
                  </div>
                  <div className="text-xs font-semibold truncate">{s.title}</div>
                </button>
              );
            })}
          </div>

          {/* Split View: Left = Step Explanation & Leena Output, Right = Leena.ai Screenshot with Pin */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center pt-1">
            <div className="lg:col-span-6 p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  Step {step.step}: {step.title} ({step.percent})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  leena.ai/function/hr
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-100 leading-relaxed">{step.oneLiner}</p>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/50 space-y-1">
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">
                  Real Output on leena.ai/function/hr
                </div>
                <div className="text-xs font-mono text-zinc-200">{step.leenaExample}</div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {step.outputs.map((out) => (
                  <span
                    key={out}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {out}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Real Leena.ai Visual Frame with Annotated Hotspot Pin */}
            <div className="lg:col-span-6 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
              <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>leena.ai/function/hr</span>
                <span className="text-emerald-400">Stage {step.step} Visual Capture</span>
              </div>
              <div className="relative w-full h-56 sm:h-64 overflow-hidden bg-zinc-950">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover object-top"
                />
                {/* Interactive Pulsing Callout Pin on the Leena Screenshot */}
                <div
                  style={{ left: `${step.pinX}%`, top: `${step.pinY}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
                >
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative w-7 h-7 rounded-full bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center justify-center border-2 border-white shadow-xl">
                      {step.step}
                    </span>
                  </div>
                  <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/95 border border-emerald-500/60 text-[10px] font-mono text-emerald-300 shadow-2xl whitespace-nowrap max-w-[260px] truncate">
                    {step.pinLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Interactive Score Calculator with Real Leena.ai Page Presets */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/35 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">
                2. Interactive Score Simulator (Click Any Real Leena.ai Page Preset)
              </h2>
              <p className="text-xs text-zinc-400">
                Load a real Leena AI page below or drag the sliders to test the formula &amp; gates.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LEENA_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                    activePresetName === p.name
                      ? "bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Left: Sliders & Gates */}
            <div className="lg:col-span-7 space-y-3">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-medium">1. Message &amp; Copy Persuasion</span>
                  <span className="font-mono text-emerald-400 font-semibold">{persuasion} / 50</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={0.5}
                  value={persuasion}
                  onChange={(e) => setPersuasion(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-medium">2. Button &amp; Form Execution</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {executionFinal} / 35
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={35}
                  step={0.5}
                  value={executionRaw}
                  onChange={(e) => setExecutionRaw(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-medium">3. Speed &amp; Mobile Experience</span>
                  <span className="font-mono text-emerald-400 font-semibold">{experience} / 15</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15}
                  step={0.5}
                  value={experience}
                  onChange={(e) => setExperience(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasCta}
                    onChange={(e) => setHasCta(e.target.checked)}
                    className="accent-emerald-400"
                  />
                  <span className="text-zinc-300">Has Main Button (CTA)</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasForm}
                    onChange={(e) => setHasForm(e.target.checked)}
                    className="accent-emerald-400"
                  />
                  <span className="text-zinc-300">Has Working Form</span>
                </label>
              </div>
            </div>

            {/* Right: Live Visual Card with Leena Thumbnail + Computed Score */}
            <div className="lg:col-span-5 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden">
              <div className="relative h-28 w-full overflow-hidden border-b border-zinc-800">
                <img
                  src={presetImage}
                  alt={activePresetName}
                  className="w-full h-full object-cover object-top opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{activePresetName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-700 text-emerald-300">
                    {presetCvr}
                  </span>
                </div>
              </div>

              <div className="p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-bold font-mono text-white tabular-nums">
                    {totalScore}
                    <span className="text-base text-zinc-500 font-normal"> / 100</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-xs font-bold text-emerald-300">
                    Grade {grade}
                  </span>
                </div>
                <div className="text-xs font-mono text-emerald-400">
                  round({persuasion} + {executionFinal} + {experience}) = {totalScore} pts
                </div>
                <p className="text-[11px] text-zinc-400">{presetNote}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Interactive 13-Check Visual Inspector (Click Any Check to See Real Leena.ai Example) */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/35 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white">
                3. All 13 Checks — Interactive Visual Inspector on leena.ai/function/hr
              </h2>
              <p className="text-xs text-zinc-400">
                Click or hover any check on the left to see the exact section &amp; quote graded on leena.ai/function/hr.
              </p>
            </div>
            <div className="flex gap-1 text-xs">
              {(["all", "persuasion", "execution", "experience"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setTab(k);
                    const first = CHECKS.find((c) => k === "all" || c.dim === k);
                    if (first) setSelectedCheckNum(first.num);
                  }}
                  className={`px-2.5 py-1 rounded capitalize transition-colors ${
                    tab === k
                      ? "bg-zinc-800 text-white border border-zinc-700"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left (6 cols): Clickable List of Checks */}
            <div className="lg:col-span-6 divide-y divide-zinc-800/70 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              {visibleChecks.map((c) => {
                const isSelected = activeCheck.num === c.num;
                return (
                  <button
                    key={c.num}
                    type="button"
                    onClick={() => setSelectedCheckNum(c.num)}
                    onMouseEnter={() => setSelectedCheckNum(c.num)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-950/35 border-l-2 border-l-emerald-400"
                        : "hover:bg-zinc-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-emerald-500 text-zinc-950"
                            : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                        }`}
                      >
                        {c.num}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{c.name}</div>
                        <div className="text-[11px] text-zinc-400 truncate">{c.simple}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-mono font-bold ${
                          c.leenaStatus === "passed" ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {c.leenaEarned}
                        <span className="text-zinc-500 font-normal">/{c.pts}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right (6 cols): Sticky Live Visual Example Card on leena.ai/function/hr */}
            <div className="lg:col-span-6 lg:sticky lg:top-20 rounded-xl border border-emerald-500/35 bg-zinc-950 overflow-hidden shadow-2xl space-y-0">
              {/* Screenshot with Hotspot Pin */}
              <div className="px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-400 font-semibold">
                  Check #{activeCheck.num}: {activeCheck.name}
                </span>
                <span className="font-mono text-white font-bold">
                  leena.ai Score: {activeCheck.leenaEarned} / {activeCheck.pts} pts
                </span>
              </div>

              <div className="relative h-52 w-full bg-zinc-950 overflow-hidden border-b border-zinc-800">
                <img
                  src={activeCheck.leenaImage}
                  alt={activeCheck.name}
                  className="w-full h-full object-cover object-top"
                />
                <div
                  style={{ left: `${activeCheck.pinX}%`, top: `${activeCheck.pinY}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5"
                >
                  <span className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative w-7 h-7 rounded-full bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center justify-center border-2 border-white shadow-xl">
                      #{activeCheck.num}
                    </span>
                  </span>
                </div>
              </div>

              {/* Extracted Leena Evidence & Formula */}
              <div className="p-4 space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">
                    What We Found on leena.ai/function/hr
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border-l-2 border-emerald-400 text-zinc-200 font-mono text-[11px] leading-relaxed">
                    {activeCheck.leenaQuote}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-0.5">
                    <div className="text-[10px] font-mono uppercase text-zinc-500">Formula</div>
                    <div className="font-mono text-[11px] text-emerald-300">
                      {activeCheck.formula}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-0.5">
                    <div className="text-[10px] font-mono uppercase text-zinc-500">
                      leena.ai Calculation
                    </div>
                    <div className="font-mono text-[11px] text-white font-semibold">
                      {activeCheck.leenaCalc}
                    </div>
                  </div>
                </div>

                <p className="text-[11.5px] text-zinc-300 leading-relaxed">{activeCheck.leenaWhy}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Audience Weighting & "Biggest Disagreement" (Grader vs. Real Leena.ai Data) */}
        <section id="audience-and-dataset" className="grid grid-cols-1 lg:grid-cols-12 gap-5 scroll-mt-20">
          {/* Left (6 cols): Interactive Audience Switcher */}
          <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-900/35 p-5 space-y-3.5">
            <div>
              <h2 className="text-sm font-semibold text-white">
                4. How Grading Changes by Audience
              </h2>
              <p className="text-xs text-zinc-400">
                Click an audience below to see how what &quot;good&quot; means changes across Leena AI pages.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {AUDIENCE_PROFILES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setActiveAudience(a.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    activeAudience === a.id
                      ? "bg-emerald-950/70 border-emerald-500 text-emerald-200"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{currentAudience.label}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  Example: {currentAudience.examplePage}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/50 text-emerald-300 font-mono text-[11px]">
                Key Weighted Signal: {currentAudience.weightedSignal}
              </div>
              <p className="text-zinc-300 leading-relaxed">{currentAudience.whatChanges}</p>
              <p className="text-[11px] text-zinc-400 border-t border-zinc-800 pt-2">
                <strong className="text-zinc-200">Why: </strong>
                {currentAudience.why}
              </p>
            </div>

            {/* Side-by-Side Signal Weight Comparison Across Audiences */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden text-[11px]">
              <div className="grid grid-cols-12 px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 font-mono text-[10px] text-zinc-400 uppercase">
                <span className="col-span-5">What We Check</span>
                <span className="col-span-2 text-center">Executive</span>
                <span className="col-span-3 text-center">HR / IT Lead</span>
                <span className="col-span-2 text-center">Webinar</span>
              </div>
              <div className="divide-y divide-zinc-800/70 font-mono">
                <div className="grid grid-cols-12 px-3 py-1.5 items-center">
                  <span className="col-span-5 font-sans text-zinc-200">ROI Numbers &amp; Security Badges</span>
                  <span className="col-span-2 text-center text-emerald-400 font-bold">High (1.5×)</span>
                  <span className="col-span-3 text-center text-zinc-300">Normal</span>
                  <span className="col-span-2 text-center text-zinc-500">Low (0.5×)</span>
                </div>
                <div className="grid grid-cols-12 px-3 py-1.5 items-center">
                  <span className="col-span-5 font-sans text-zinc-200">Naming Daily Tools (Workday)</span>
                  <span className="col-span-2 text-center text-zinc-300">Normal</span>
                  <span className="col-span-3 text-center text-emerald-400 font-bold">High (1.5×)</span>
                  <span className="col-span-2 text-center text-zinc-500">Low (0.7×)</span>
                </div>
                <div className="grid grid-cols-12 px-3 py-1.5 items-center">
                  <span className="col-span-5 font-sans text-zinc-200">Short Sign-Up Form (&le; 3 Boxes)</span>
                  <span className="col-span-2 text-center text-zinc-400">Flexible</span>
                  <span className="col-span-3 text-center text-zinc-300">Normal</span>
                  <span className="col-span-2 text-center text-emerald-400 font-bold">Strict (1.6×)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right (6 cols): Real Dataset Comparison & "Biggest Disagreement" */}
          <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-900/35 p-5 space-y-3.5">
            <div>
              <h2 className="text-sm font-semibold text-white">
                5. Checked Against Real Leena.ai Data &amp; Biggest Disagreement
              </h2>
              <p className="text-xs text-zinc-400">
                How our scores compare against real Leena AI conversion rates.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden text-xs">
              <div className="grid grid-cols-12 px-3 py-2 bg-zinc-900 border-b border-zinc-800 font-mono text-[10px] text-zinc-400 uppercase">
                <span className="col-span-5">Leena.ai Page</span>
                <span className="col-span-2 text-right">Real CVR</span>
                <span className="col-span-2 text-right">Old v1</span>
                <span className="col-span-3 text-right text-emerald-400">Final v3</span>
              </div>
              <div className="divide-y divide-zinc-800/70 font-mono text-[11px]">
                <div className="grid grid-cols-12 px-3 py-2 items-center">
                  <span className="col-span-5 text-white font-sans font-medium">
                    leena.ai Homepage
                  </span>
                  <span className="col-span-2 text-right text-zinc-300">0.56%</span>
                  <span className="col-span-2 text-right text-zinc-500">94</span>
                  <span className="col-span-3 text-right text-emerald-400 font-bold">83 / 100</span>
                </div>
                <div className="grid grid-cols-12 px-3 py-2 items-center">
                  <span className="col-span-5 text-white font-sans font-medium">
                    leena.ai/function/hr
                  </span>
                  <span className="col-span-2 text-right text-zinc-300">0.58%</span>
                  <span className="col-span-2 text-right text-zinc-500">94</span>
                  <span className="col-span-3 text-right text-emerald-400 font-bold">80 / 100</span>
                </div>
                <div className="grid grid-cols-12 px-3 py-2 items-center">
                  <span className="col-span-5 text-white font-sans font-medium">
                    CHRISTUS Webinar
                  </span>
                  <span className="col-span-2 text-right text-rose-400">0.11%</span>
                  <span className="col-span-2 text-right text-zinc-500">67 (v2: 93)</span>
                  <span className="col-span-3 text-right text-amber-400 font-bold">77 / 100</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-amber-500/30 space-y-1.5 text-xs">
              <div className="font-semibold text-amber-300">
                Biggest Disagreement: Homepage (83 pts) vs. HR Page (80 pts) — Who is wrong?
              </div>
              <p className="text-zinc-300 leading-relaxed text-[11.5px]">
                <strong className="text-white">The raw CVR (0.58% vs 0.56%) is misleading because of ad traffic:</strong>{" "}
                The HR page got <strong>58% high-intent Google Ads</strong> traffic, while the Homepage got{" "}
                <strong>72% casual browsing</strong> traffic. Once you account for traffic source, the Homepage actually converts better (<strong>0.57× vs 0.50×</strong>)—matching our grader&apos;s 83 vs. 80 score.
              </p>
            </div>
          </div>
        </section>

        {/* 6. One-Page Scoring Note Summary (Simple 3-Box Summary) */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/35 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white">
              6. Quick Scoring Note — What Changed &amp; What We Left Out on Purpose
            </h2>
            <p className="text-xs text-zinc-400">
              Three quick takeaways on how we tuned the scoring against real data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
              <div className="font-mono text-[10px] uppercase text-amber-400 font-semibold">
                1. Why Rubric v1 Failed
              </div>
              <div className="font-semibold text-white">Gave Points Just for Having a Button</div>
              <p className="text-zinc-300 leading-relaxed text-[11.5px]">
                Our first version only checked if a page <em>had</em> a title, a button, and logos—giving both the Homepage and HR page the exact same <strong>94/100</strong> score.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
              <div className="font-mono text-[10px] uppercase text-emerald-400 font-semibold">
                2. What We Changed in Final v3
              </div>
              <div className="font-semibold text-white">Added Live Form Checks &amp; Score Caps</div>
              <p className="text-zinc-300 leading-relaxed text-[11.5px]">
                We now click the button in a live browser to verify a working sign-up form opens, and cap the Execution score if a page lacks a working form—separating the pages cleanly (<code>83 &gt; 80 &gt; 77</code>).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
              <div className="font-mono text-[10px] uppercase text-sky-400 font-semibold">
                3. What We Left Out on Purpose
              </div>
              <div className="font-semibold text-white">Design Taste, Word Count &amp; Ad Spend</div>
              <p className="text-zinc-300 leading-relaxed text-[11.5px]">
                We ignored <strong>subjective colors/fonts</strong>, <strong>long word counts</strong> (shorter pages often convert better), and <strong>ad-channel traffic mix</strong> (because the score should measure the page itself, not ad budget).
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
