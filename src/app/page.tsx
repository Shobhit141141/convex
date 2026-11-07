"use client";

import React, { useState } from "react";
import { GraderReport } from "@/features/pipeline/grader-pipeline";
import { ScoreGauge } from "@/components/grader/ScoreGauge";
import { DimensionCard } from "@/components/grader/DimensionCard";
import { RecommendationsCard } from "@/components/grader/RecommendationsCard";
import { BenchmarkDrawer } from "@/components/grader/BenchmarkDrawer";
import {
  Search,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Zap,
  RefreshCw,
  Target,
  FileText
} from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("https://leena.ai/function/hr");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<GraderReport | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>("");

  const handleGrade = async (targetUrl: string = url) => {
    if (!targetUrl || targetUrl.trim().length === 0) return;
    setLoading(true);
    setError(null);

    const steps = [
      "Fetching DOM and validating URL security...",
      "Classifying page audience and visitor intent...",
      "Evaluating conversion persuasion via AI semantic analysis...",
      "Inspecting conversion path, CTAs, and friction...",
      "Calculating Rubric v3 score and CRO recommendations..."
    ];

    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setLoadingStep(steps[stepIndex]);
    }, 1800);

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to grade the landing page.");
      }

      setReport(data.report);
    } catch (err: any) {
      setError(err.message || "Failed to evaluate landing page.");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handlePresetSelect = (presetUrl: string) => {
    setUrl(presetUrl);
    handleGrade(presetUrl);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white">CONVEX</span>
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                RUBRIC V3
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Evidence-Based CRO Evaluator
            </span>
            <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-300">
              Leena AI Candidate Submission
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero & URL Input */}
        <div className="space-y-4 max-w-3xl mx-auto text-center pt-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Landing Page Conversion Grader
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Evaluates how effectively your page persuades intended visitors to complete its primary conversion action. Powered by continuous AI semantic evaluation and Rubric v3.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGrade();
            }}
            className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl focus-within:border-indigo-500/80 transition-all"
          >
            <div className="pl-3 text-zinc-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter any landing page URL (e.g. https://leena.ai/function/hr)"
              className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Grading...
                </>
              ) : (
                <>
                  Grade Page
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="text-zinc-500">Benchmark Presets:</span>
            <button
              onClick={() => handlePresetSelect("https://leena.ai")}
              className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            >
              Homepage (0.56% CVR)
            </button>
            <button
              onClick={() => handlePresetSelect("https://leena.ai/function/hr")}
              className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            >
              HR Functional (0.58% CVR)
            </button>
            <button
              onClick={() => handlePresetSelect("https://leena.ai/resources/webinars/christus-health-hr-ai-rollout-webinar")}
              className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            >
              CHRISTUS Webinar (0.11% CVR)
            </button>
          </div>
        </div>

        {/* Loading State Animation */}
        {loading && (
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-3 animate-pulse">
            <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin mx-auto" />
            <div className="text-sm font-semibold text-white">Analyzing Landing Page</div>
            <div className="text-xs text-zinc-400 font-mono">{loadingStep}</div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="max-w-2xl mx-auto p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <div>
              <strong className="font-bold">Evaluation Failed:</strong> {error}
            </div>
          </div>
        )}

        {/* Evaluation Report Results */}
        {report && !loading && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top Score Banner */}
            <ScoreGauge
              score={report.totalScore}
              letterGrade={report.letterGrade}
              pageType={report.pageType}
              visitorIntent={report.visitorIntent}
              gatesTriggered={report.gatesTriggered}
            />

            {/* Audience & Conversion Meta Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <Target className="w-4 h-4 text-indigo-400" /> Target Audience
                </div>
                <div className="text-sm font-semibold text-white">
                  {report.targetAudience.roles.join(", ") || "General Enterprise"}
                </div>
                <div className="text-xs text-zinc-400">
                  Segments: {report.targetAudience.segments.join(", ") || "Enterprise"}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-blue-400" /> Primary Conversion Action
                </div>
                <div className="text-sm font-semibold text-white">
                  {report.signalsPreview.primaryCtaText ? `"${report.signalsPreview.primaryCtaText}"` : "None Detected"}
                </div>
                <div className="text-xs text-zinc-400">
                  Lead Capture: {report.signalsPreview.leadCaptureType}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-emerald-400" /> Technical Foundation
                </div>
                <div className="text-sm font-semibold text-white">
                  LCP: {report.signalsPreview.lcpSeconds}s | CLS: {report.signalsPreview.cls}
                </div>
                <div className="text-xs text-zinc-400">
                  Word count: {report.signalsPreview.wordCount.toLocaleString()} words
                </div>
              </div>
            </div>

            {/* 3 Dimension Breakdowns */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Scoring Breakdown by Dimension
              </h2>

              <DimensionCard
                summary={report.dimensions.persuasion}
                title="Dimension A: Conversion Persuasion"
                description="Evaluates whether the page gives the intended visitor a convincing reason to act (Audience Fit, Value Prop, Credibility, Alignment, Offer)."
              />

              <DimensionCard
                summary={report.dimensions.execution}
                title="Dimension B: Conversion Execution"
                description="Evaluates whether a convinced visitor can complete the action without friction (CTA Prominence, Promise-Destination, Form Usability)."
              />

              <DimensionCard
                summary={report.dimensions.experience}
                title="Dimension C: Supporting Experience"
                description="Technical delivery: Core Web Vitals (LCP, CLS), mobile viewport responsiveness, and text readability."
              />
            </div>

            {/* Prioritized Recommendations */}
            <RecommendationsCard recommendations={report.recommendations} />
          </div>
        )}

        {/* Leena Benchmark Drawer */}
        <BenchmarkDrawer onSelectUrl={handlePresetSelect} />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/60 py-6 text-center text-xs text-zinc-500">
        <p>Convex Landing Page Evaluation Engine — Built for Leena AI Assessment</p>
      </footer>
    </div>
  );
}
