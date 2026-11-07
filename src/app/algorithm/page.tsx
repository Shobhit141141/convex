"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";

const PIPELINE_STEPS = [
  {
    step: 1,
    percent: "10%",
    title: "URL Cache",
    oneLiner: "Checks Supabase first — if this URL was already graded, it loads instantly.",
    outputs: ["Instant Cached Report", "SSRF Safety Check", "Raw HTML"]
  },
  {
    step: 2,
    percent: "28%",
    title: "Page Structure",
    oneLiner: "Scans headings, buttons, form fields, customer logos, and ROI numbers.",
    outputs: ["H1–H3 Headings", "Main CTA Button", "Form Field Count"]
  },
  {
    step: 3,
    percent: "48%",
    title: "Buyer & Intent",
    oneLiner: "Identifies who the page is built for (e.g. HR Leaders) and their buying stage.",
    outputs: ["Page Type", "Target Buyer Role", "Buying Stage"]
  },
  {
    step: 4,
    percent: "68%",
    title: "AI Copy Review",
    oneLiner: "Rates whether the headline names a real problem, promises a result, and proves it.",
    outputs: ["Problem Specificity", "Value Prop Score", "Proof Credibility"]
  },
  {
    step: 5,
    percent: "86%",
    title: "Live Browser",
    oneLiner: "Opens Chrome to take a full screenshot, click the main button, and test load speed.",
    outputs: ["Full Screenshot", "Form Click Verified", "Speed (LCP & CLS)"]
  },
  {
    step: 6,
    percent: "100%",
    title: "Score & Pins",
    oneLiner: "Calculates the 0–100 score, applies safety gates, and drops 1-to-1 fix pins.",
    outputs: ["Final 0–100 Score", "10s Summary Card", "1-to-1 Visual Pins"]
  }
];

const CHECKS = [
  // Persuasion (50 pts)
  {
    num: 1,
    dim: "persuasion",
    name: "Problem Fit",
    simple: "Names a specific buyer problem in the hero.",
    formula: "(Rating / 10) × 10",
    pts: 10
  },
  {
    num: 2,
    dim: "persuasion",
    name: "Value & Speed",
    simple: "Promises a clear result and how fast it works.",
    formula: "(Rating / 10) × 12",
    pts: 12
  },
  {
    num: 3,
    dim: "persuasion",
    name: "Customer Proof",
    simple: "Backs claims with customer quotes and ROI stats.",
    formula: "(Rating / 10) × 10",
    pts: 10
  },
  {
    num: 4,
    dim: "persuasion",
    name: "Buyer Language",
    simple: "Uses words tailored to the target buyer's job.",
    formula: "(Rating / 10) × 10",
    pts: 10
  },
  {
    num: 5,
    dim: "persuasion",
    name: "Offer Appeal",
    simple: "Main button offers a low-friction next step.",
    formula: "(Rating / 10) × 8",
    pts: 8
  },
  // Execution (35 pts)
  {
    num: 6,
    dim: "execution",
    name: "Button Visibility",
    simple: "Main button is at the top with clear action text.",
    formula: "Top(+5) + Verb(+3) + Info(+2)",
    pts: 10
  },
  {
    num: 7,
    dim: "execution",
    name: "Promise Match",
    simple: "Clicking the button delivers what it promised.",
    formula: "Verified ? 8 : 3",
    pts: 8
  },
  {
    num: 8,
    dim: "execution",
    name: "Working Form",
    simple: "Live browser confirms a sign-up form opens.",
    formula: "LiveForm ? 10 : Static ? 8 : 0",
    pts: 10
  },
  {
    num: 9,
    dim: "execution",
    name: "Short Form",
    simple: "Fewer form boxes (≤ 4 fields scores full points).",
    formula: "≤4 boxes ? 7 : ≤7 ? 4.5 : 2",
    pts: 7
  },
  // Experience (15 pts)
  {
    num: 10,
    dim: "experience",
    name: "Load Speed (LCP)",
    simple: "Main content loads in under 2.5 seconds.",
    formula: "≤2.5s ? 5 : ≤4s ? 2.5 : 0",
    pts: 5
  },
  {
    num: 11,
    dim: "experience",
    name: "Visual Stability (CLS)",
    simple: "Buttons and layout don't jump while loading.",
    formula: "≤0.10 ? 4 : ≤0.25 ? 2 : 0",
    pts: 4
  },
  {
    num: 12,
    dim: "experience",
    name: "Mobile Screen Fit",
    simple: "Scales properly on mobile phones.",
    formula: "HasViewport ? 3 : 0",
    pts: 3
  },
  {
    num: 13,
    dim: "experience",
    name: "Clear Title & Copy",
    simple: "Has one clear H1 title and 100+ words.",
    formula: "H1 + ≥100w ? 3 : 1.5",
    pts: 3
  }
] as const;

export default function AlgorithmPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [tab, setTab] = useState<"all" | "persuasion" | "execution" | "experience">("all");

  // Interactive Calculator State
  const [persuasion, setPersuasion] = useState(38);
  const [executionRaw, setExecutionRaw] = useState(28);
  const [experience, setExperience] = useState(14);
  const [hasCta, setHasCta] = useState(true);
  const [hasForm, setHasForm] = useState(true);

  const gateCap = !hasCta ? 7.0 : !hasForm ? 10.5 : 35.0;
  const executionFinal = Math.min(executionRaw, gateCap);
  const totalScore = Math.round(persuasion + executionFinal + experience);
  const grade =
    totalScore >= 85 ? "A" : totalScore >= 70 ? "B" : totalScore >= 55 ? "C" : totalScore >= 40 ? "D" : "F";

  const step = PIPELINE_STEPS[activeStep];
  const visibleChecks = CHECKS.filter((c) => tab === "all" || c.dim === tab);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Minimal Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90">
              <div className="w-6 h-6 rounded bg-white text-zinc-950 flex items-center justify-center font-bold text-xs">
                C
              </div>
              <span className="font-semibold text-white text-sm">Convex</span>
            </Link>
            <span className="text-zinc-600 text-xs">/</span>
            <span className="text-xs text-zinc-400">How It Works</span>
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

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Title */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            How Our Pipeline &amp; Scoring Works
          </h1>
          <p className="text-xs text-zinc-400">
            6 live analysis steps + 13 math-backed checks totaling 100 points.
          </p>
        </div>

        {/* 1. Interactive 6-Step Pipeline */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/35 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">1. 6-Step Analysis Pipeline</h2>
            <span className="text-[11px] font-mono text-zinc-500">Click any step</span>
          </div>

          {/* 6 Step Pills */}
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
                      ? "border-emerald-500/70 bg-emerald-950/30 text-white"
                      : "border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className={active ? "text-emerald-400 font-bold" : "text-zinc-500"}>
                      0{s.step}
                    </span>
                    <span>{s.percent}</span>
                  </div>
                  <div className="text-xs font-semibold truncate">{s.title}</div>
                </button>
              );
            })}
          </div>

          {/* Selected Step Card (Minimal: 1 sentence + 3 output pills) */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-emerald-400">
                Step {step.step}: {step.title} ({step.percent})
              </div>
              <p className="text-xs text-zinc-200">{step.oneLiner}</p>
            </div>

            <div className="flex flex-wrap gap-1.5 shrink-0">
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
        </section>

        {/* 2. Interactive Score Calculator */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/35 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">2. Interactive Score Calculator</h2>
            <code className="text-[11px] font-mono text-emerald-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
              Total = Persuasion (50) + min(Execution (35), Gate) + Experience (15)
            </code>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left: 3 Sliders + 2 Gate Checkboxes */}
            <div className="md:col-span-7 space-y-3">
              {/* Persuasion */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-medium">1. Message &amp; Copy Persuasion</span>
                  <span className="font-mono text-emerald-400 font-semibold">{persuasion} / 50</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={persuasion}
                  onChange={(e) => setPersuasion(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Execution */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
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
                  value={executionRaw}
                  onChange={(e) => setExecutionRaw(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Experience */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-200 font-medium">3. Speed &amp; Mobile Experience</span>
                  <span className="font-mono text-emerald-400 font-semibold">{experience} / 15</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={15}
                  value={experience}
                  onChange={(e) => setExperience(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Gates */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
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

            {/* Right: Big Clean Score Output */}
            <div className="md:col-span-5 p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300">
                Grade {grade}
              </div>
              <div className="text-5xl font-bold font-mono text-white tabular-nums">
                {totalScore}
                <span className="text-lg text-zinc-500 font-normal"> / 100</span>
              </div>
              <div className="text-xs font-mono text-emerald-400">
                {persuasion} + {executionFinal} + {experience} = {totalScore} pts
              </div>
              {(!hasCta || !hasForm) && (
                <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-[11px] text-rose-300 flex items-center justify-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Execution capped at {gateCap} pts ({!hasCta ? "No CTA" : "No Form"})
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Compact 13-Check Table */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/35 overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">3. All 13 Checks (100 Points)</h2>
            <div className="flex gap-1 text-xs">
              {(["all", "persuasion", "execution", "experience"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
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

          <div className="divide-y divide-zinc-800/60 text-xs">
            {visibleChecks.map((c) => (
              <div
                key={c.num}
                className="px-4 py-3 grid grid-cols-1 sm:grid-cols-12 items-center gap-2 hover:bg-zinc-900/40"
              >
                <div className="sm:col-span-3 font-medium text-white flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-500 w-5">#{c.num}</span>
                  <span>{c.name}</span>
                </div>
                <div className="sm:col-span-5 text-zinc-400">{c.simple}</div>
                <div className="sm:col-span-3 font-mono text-[11px] text-emerald-400/90">
                  {c.formula}
                </div>
                <div className="sm:col-span-1 sm:text-right font-mono font-bold text-white">
                  {c.pts} pts
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
