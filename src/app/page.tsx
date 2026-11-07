"use client";

import React, { useState } from "react";
import { GraderReport, CRORecommendation } from "@/features/pipeline/grader-pipeline";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<GraderReport | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "persuasion" | "execution" | "experience">("all");
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});

  const toggleCriterion = (id: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGrade = async (targetUrl: string = url) => {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to analyze page.");
      }

      setReport(data.report);
    } catch (err: any) {
      setError(err.message || "Failed to analyze page.");
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setReport(null);
    setError(null);
    setUrl("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Passed
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-950 text-amber-400 border border-amber-800">
            <AlertCircle className="w-3 h-3" /> Partial
          </span>
        );
      case "failed":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-950 text-rose-400 border border-rose-800">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Top Navigation */}
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-white">Convex</span>
            <span className="text-zinc-600 text-xs">/</span>
            <span className="text-xs text-zinc-400">Landing Page Evaluator</span>
          </div>

          {report && (
            <button
              onClick={resetAnalysis}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Evaluation
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* State 1: Input Form (Centered if no report, top if report exists) */}
        {!report && (
          <div className="max-w-xl mx-auto text-center space-y-6 pt-12">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Analyze a Landing Page
              </h1>
              <p className="text-sm text-zinc-400">
                Enter any landing page URL to evaluate conversion persuasion, execution, and performance.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGrade();
              }}
              className="space-y-3"
            >
              <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 focus-within:border-zinc-600 transition-colors overflow-hidden p-1">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/landing-page"
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="px-4 py-2 rounded-md bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Discreet sample link */}
              <div className="text-xs text-zinc-500 flex items-center justify-center gap-2">
                <span>Sample:</span>
                <button
                  type="button"
                  onClick={() => {
                    setUrl("https://leena.ai/function/hr");
                    handleGrade("https://leena.ai/function/hr");
                  }}
                  className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
                >
                  leena.ai/function/hr
                </button>
              </div>
            </form>

            {loading && (
              <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50 text-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400 mx-auto" />
                <div className="text-xs font-medium text-zinc-300">
                  Running Rubric v3 Evaluation...
                </div>
                <p className="text-[11px] text-zinc-500">
                  Extracting DOM, assessing audience fit, testing CTAs, and scoring persuasion.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-lg border border-rose-900/50 bg-rose-950/30 text-rose-300 text-xs text-left">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        )}

        {/* State 2: Detailed Report View */}
        {report && (
          <div className="space-y-8">
            {/* Header / Overview */}
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {report.pageType}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono truncate max-w-md">
                      {report.url}
                    </span>
                    <a
                      href={report.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <h1 className="text-lg font-semibold text-white">
                    Landing Page Evaluation Report
                  </h1>
                </div>

                {/* Score Pill */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-zinc-400">Overall Score</div>
                    <div className="text-2xl font-bold text-white tracking-tight">
                      {report.totalScore} <span className="text-sm font-normal text-zinc-500">/ 100</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center font-bold text-lg text-white">
                    {report.letterGrade}
                  </div>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
                <div>
                  <span className="text-zinc-500 block">Target Audience:</span>
                  <span className="text-zinc-200 font-medium">
                    {report.targetAudience.roles.join(", ") || "General enterprise"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Primary Conversion Action:</span>
                  <span className="text-zinc-200 font-medium">
                    {report.signalsPreview.primaryCtaText ? `"${report.signalsPreview.primaryCtaText}"` : "None detected"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Lead Capture:</span>
                  <span className="text-zinc-200 font-medium">
                    {report.signalsPreview.leadCaptureType}
                  </span>
                </div>
              </div>

              {/* Gates Alert if any */}
              {report.gatesTriggered.length > 0 && (
                <div className="p-3 rounded-lg border border-rose-900 bg-rose-950/40 text-xs text-rose-300 space-y-1">
                  <div className="font-semibold text-rose-200">Critical Gate Triggered:</div>
                  {report.gatesTriggered.map((gate, i) => (
                    <div key={i}>• {gate}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Dimension Score Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">Conversion Persuasion</span>
                  <span className="font-semibold text-white">
                    {report.dimensions.persuasion.score} / {report.dimensions.persuasion.maxScore}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-300 rounded-full"
                    style={{ width: `${report.dimensions.persuasion.percentage}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-zinc-500">
                  Audience-problem fit, value proposition, proof credibility.
                </div>
              </div>

              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">Conversion Execution</span>
                  <span className="font-semibold text-white">
                    {report.dimensions.execution.score} / {report.dimensions.execution.maxScore}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-300 rounded-full"
                    style={{ width: `${report.dimensions.execution.percentage}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-zinc-500">
                  CTA prominence, destination consistency, lead form usability.
                </div>
              </div>

              <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-zinc-400 font-medium">Supporting Experience</span>
                  <span className="font-semibold text-white">
                    {report.dimensions.experience.score} / {report.dimensions.experience.maxScore}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-300 rounded-full"
                    style={{ width: `${report.dimensions.experience.percentage}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-zinc-500">
                  LCP ({report.signalsPreview.lcpSeconds}s), CLS ({report.signalsPreview.cls}), viewport.
                </div>
              </div>
            </div>

            {/* Criteria Breakdown Table */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Evaluation Breakdown</h2>
                <div className="flex gap-1 text-xs">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-2.5 py-1 rounded text-xs ${
                      activeTab === "all" ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    All ({report.criteria.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("persuasion")}
                    className={`px-2.5 py-1 rounded text-xs ${
                      activeTab === "persuasion" ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Persuasion
                  </button>
                  <button
                    onClick={() => setActiveTab("execution")}
                    className={`px-2.5 py-1 rounded text-xs ${
                      activeTab === "execution" ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Execution
                  </button>
                  <button
                    onClick={() => setActiveTab("experience")}
                    className={`px-2.5 py-1 rounded text-xs ${
                      activeTab === "experience" ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Experience
                  </button>
                </div>
              </div>

              <div className="divide-y divide-zinc-800/80">
                {report.criteria
                  .filter((c) => activeTab === "all" || c.dimension === activeTab)
                  .map((criterion) => {
                    const isExpanded = !!expandedCriteria[criterion.id];
                    return (
                      <div key={criterion.id} className="p-4 hover:bg-zinc-900/30 transition-colors">
                        <div
                          className="flex items-start justify-between gap-4 cursor-pointer"
                          onClick={() => toggleCriterion(criterion.id)}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{criterion.name}</span>
                              {getStatusBadge(criterion.status)}
                              <span className="text-[10px] font-mono uppercase text-zinc-500">
                                {criterion.source}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400">{criterion.scoringRule}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right whitespace-nowrap text-xs">
                              <span className="font-semibold text-white">{criterion.earnedPoints}</span>
                              <span className="text-zinc-500"> / {criterion.maxPoints} pts</span>
                            </div>
                            <button className="text-zinc-500 hover:text-zinc-300">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Evidence Accordion */}
                        {isExpanded && criterion.evidence && (
                          <div className="mt-3 pt-3 border-t border-zinc-800/60 text-xs space-y-1">
                            <span className="text-zinc-500 font-mono text-[11px] block">Extracted Evidence:</span>
                            <blockquote className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-[11px] break-words">
                              {criterion.evidence}
                            </blockquote>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Recommendations Section */}
            {report.recommendations.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-5 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-white">Recommended Improvements</h2>
                  <p className="text-xs text-zinc-400">
                    Prioritized changes based on identified weaknesses in persuasion and execution.
                  </p>
                </div>

                <div className="space-y-3">
                  {report.recommendations.map((rec, index) => (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950/60 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">
                          {index + 1}. {rec.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            rec.priority === "high"
                              ? "bg-rose-950 text-rose-400 border border-rose-800"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-zinc-400">
                        <strong className="text-zinc-300">Problem:</strong> {rec.problem}
                      </p>
                      <p className="text-zinc-300">
                        <strong className="text-white">Action:</strong> {rec.action}
                      </p>
                      <p className="text-zinc-400">
                        <strong className="text-emerald-400">Impact:</strong> {rec.expectedImpact}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
