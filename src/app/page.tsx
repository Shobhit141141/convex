"use client";

import React, { useState, useRef } from "react";
import { GraderReport, CRORecommendation, ScreenshotTag } from "@/features/pipeline/grader-pipeline";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  Activity,
  ShieldAlert,
  Target,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Compass,
  Check,
  Maximize2,
  MapPin,
  ArrowDownCircle,
  SlidersHorizontal,
  Flame,
  Wrench,
  TrendingUp,
  Crosshair
} from "lucide-react";

// Circular SVG Progress Ring (Uniform across Hero, Dimensions, Web Vitals, and Criterion Rows)
function ScoreRing({
  value,
  max = 100,
  size = 84,
  strokeWidth = 7,
  colorClass = "text-emerald-500",
  label,
  sublabel
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const labelFontClass =
    size >= 96
      ? "text-3xl font-extrabold"
      : size >= 60
      ? "text-sm font-bold"
      : size >= 36
      ? "text-[10px] font-bold font-mono"
      : "text-[9px] font-bold font-mono";

  return (
    <div className="relative flex flex-col items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-800/90"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-700 ease-out`}
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`${labelFontClass} tracking-tight text-white leading-none`}>
          {label ?? value}
        </span>
        {sublabel && size >= 56 && (
          <span className="text-[10px] text-zinc-400 font-mono mt-0.5 leading-none">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

// Mini Gauge Bar for Web Vitals
function MetricBar({
  value,
  goodThreshold,
  poorThreshold,
  unit = "s",
  isLowerBetter = true
}: {
  value: number;
  goodThreshold: number;
  poorThreshold: number;
  unit?: string;
  isLowerBetter?: boolean;
}) {
  const isGood = isLowerBetter ? value <= goodThreshold : value >= goodThreshold;
  const isPoor = isLowerBetter ? value > poorThreshold : value < poorThreshold;

  const color = isGood ? "bg-emerald-500" : isPoor ? "bg-rose-500" : "bg-amber-500";
  const statusText = isGood ? "Good" : isPoor ? "Poor" : "Needs Work";
  const statusTextColor = isGood ? "text-emerald-400" : isPoor ? "text-rose-400" : "text-amber-400";

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between items-center text-xs">
        <span className="text-zinc-300 font-medium">
          {value}
          <span className="text-zinc-500 font-normal">{unit}</span>
        </span>
        <span className={`text-[10px] font-medium uppercase tracking-wider ${statusTextColor}`}>
          {statusText}
        </span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(Math.max((value / (poorThreshold * 1.3)) * 100, 15), 100)}%` }}
        />
      </div>
    </div>
  );
}

// How each criterion is measured (shown in Score Breakdown)
const METHOD_META = {
  ai_semantic: {
    label: "AI copy review",
    icon: Sparkles,
    color: "text-violet-400",
    explain:
      "An LLM reads the page copy and rates this one aspect on a 0-10 scale against a fixed rubric prompt. Code then scales that rating to the criterion's point value. The LLM never sets the final score."
  },
  browser_playwright: {
    label: "Live browser test",
    icon: Crosshair,
    color: "text-sky-400",
    explain: "A headless browser loads the page, clicks the CTA, and checks whether a working form or modal appears."
  },
  dom_extraction: {
    label: "Page structure check",
    icon: Layers,
    color: "text-zinc-300",
    explain: "Deterministic rules applied to the page HTML (headings, buttons, forms, meta tags)."
  },
  pagespeed: {
    label: "Lighthouse",
    icon: Activity,
    color: "text-emerald-400",
    explain: "Core Web Vitals thresholds from Google Lighthouse / PageSpeed."
  }
} as const;

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<GraderReport | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "persuasion" | "execution" | "experience">("all");
  const [issueFilter, setIssueFilter] = useState<"all" | "high" | "persuasion" | "execution">("all");
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null);
  const [isScreenshotExpanded, setIsScreenshotExpanded] = useState(false);
  const [progress, setProgress] = useState(0);

  // Dynamic 0% -> 100% realistic progress tracker
  React.useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }

    setProgress(8);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 24) return prev + Math.floor(Math.random() * 4 + 3);
        if (prev < 55) return prev + Math.floor(Math.random() * 3 + 2);
        if (prev < 82) return prev + Math.floor(Math.random() * 2 + 1);
        if (prev < 95) return prev + 1;
        return 95; // Hold at 95% until response arrives
      });
    }, 240);

    return () => clearInterval(interval);
  }, [loading]);

  const screenshotContainerRef = useRef<HTMLDivElement>(null);

  const scrollToTag = (yPercent: number) => {
    if (screenshotContainerRef.current) {
      const container = screenshotContainerRef.current;
      const targetScroll = (yPercent / 100) * container.scrollHeight - container.clientHeight / 3;
      container.scrollTo({ top: Math.max(targetScroll, 0), behavior: "smooth" });
    }
  };

  const toggleCriterion = (id: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGrade = async (targetUrl: string = url) => {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl) return;

    setLoading(true);
    setError(null);
    setSelectedTagId(null);

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl, enablePlaywright: true })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to analyze page.");
      }

      // Smooth completion to 100%
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 320));

      setReport(data.report);
      if (data.report.screenshotTags && data.report.screenshotTags.length > 0) {
        setSelectedTagId(data.report.screenshotTags[0].id);
      }
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
    setSelectedTagId(null);
    setProgress(0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3 h-3" /> Passed
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <AlertCircle className="w-3 h-3" /> Partial
          </span>
        );
      case "failed":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/80 text-rose-400 border border-rose-800/80">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
    }
  };

  const lighthouse = report?.lighthouse || {
    performanceScore: 75,
    lcpSeconds: 2.2,
    cls: 0.03,
    fcpSeconds: 1.7,
    source: "pagespeed_api" as const
  };

  const tags = report?.screenshotTags || [];
  const activePin = tags.find((t) => t.id === (hoveredTagId || selectedTagId)) || tags[0];

  const filteredRecommendations = (report?.recommendations || []).filter((rec) => {
    if (issueFilter === "high") return rec.priority === "high";
    if (issueFilter === "persuasion") return rec.dimension === "persuasion";
    if (issueFilter === "execution") return rec.dimension === "execution";
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-zinc-800">
      {/* Top Editorial Navigation */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-white text-zinc-950 flex items-center justify-center font-bold text-xs tracking-tighter shadow-sm">
              C
            </div>
            <span className="font-semibold tracking-tight text-white text-sm">Convex</span>
            <span className="text-zinc-600 text-xs">/</span>
            <span className="text-xs text-zinc-400 font-normal">Conversion Engineering Grader</span>
          </div>

          {report && (
            <button
              onClick={resetAnalysis}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-md hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Analyze Another Page
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* State 1: Input URL Screen */}
        {!report && (
          <div className="max-w-xl mx-auto text-center space-y-6 pt-16 pb-20">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Landing Page Evaluator
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
                Audience-aware CRO grader. Evaluates conversion persuasion, execution friction, and Core Web Vitals with interactive full-page hotspot pins.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGrade();
              }}
              className="space-y-3"
            >
              <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 focus-within:border-zinc-500 transition-all shadow-sm overflow-hidden p-1.5">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/landing-page"
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="px-4 py-2.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse" />
                      Analyzing...
                    </span>
                  ) : (
                    <>
                      Analyze
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {/* Sample benchmark quick links */}
              <div className="text-xs text-zinc-500 flex items-center justify-center gap-3 pt-1">
                <span>Try benchmark:</span>
                <button
                  type="button"
                  onClick={() => {
                    setUrl("https://leena.ai/function/hr");
                    handleGrade("https://leena.ai/function/hr");
                  }}
                  className="text-zinc-400 hover:text-zinc-200 underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-400 transition-colors"
                >
                  leena.ai/function/hr
                </button>
                <span className="text-zinc-700">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setUrl("https://leena.ai");
                    handleGrade("https://leena.ai");
                  }}
                  className="text-zinc-400 hover:text-zinc-200 underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-400 transition-colors"
                >
                  leena.ai Homepage
                </button>
              </div>
            </form>

            {loading && (
              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 text-left space-y-4 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-semibold text-white tracking-tight">
                      Audience & Conversion Audit in Progress
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                      {progress}%
                    </span>
                  </div>
                </div>

                {/* 0% -> 100% Responsive Filling Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full transition-all duration-300 ease-out shadow-sm"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>0% Init</span>
                    <span>25% DOM</span>
                    <span>60% Render</span>
                    <span>85% Rubric</span>
                    <span>100% Studio</span>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-zinc-800/80">
                  <div className="text-xs font-medium text-zinc-200 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      {progress < 25 && "Phase 1: Extracting DOM tree, headings, and CTA paths..."}
                      {progress >= 25 && progress < 60 && "Phase 2: Launching Playwright & capturing full-page screenshot..."}
                      {progress >= 60 && progress < 85 && "Phase 3: Evaluating conversion persuasion rubric & gates..."}
                      {progress >= 85 && progress < 100 && "Phase 4: Pinpointing visual section hotspots & Core Web Vitals..."}
                      {progress >= 100 && "Complete! Assembling Visual Audit Studio..."}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed pl-5.5">
                    Assessing ICP audience alignment, inspecting interactive lead funnels, and tagging minute page zones across full page height.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/30 text-rose-300 text-xs text-left flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-rose-200 mb-0.5">Evaluation Error</div>
                  <div>{error}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* State 2: Full-Page Visual Audit Studio with Screenshot Tagging */}
        {report && (
          <div className="space-y-8">
            {/* Header: Prominent Overall Score Hero & Context Bar */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-800/80 pb-5">
                {/* Left: Page Identity & Executive Summary */}
                <div className="space-y-2.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700/70 font-semibold">
                      {report.pageType}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono truncate max-w-xs sm:max-w-md">
                      {report.url}
                    </span>
                    <a
                      href={report.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Open page in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Landing Page Quality & Conversion Report
                  </h1>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {report.summary}
                  </p>
                </div>

                {/* Right: Prominent Overall Score Circular Hero Pod */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-5 p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 shadow-inner shrink-0">
                  <ScoreRing
                    value={report.totalScore}
                    max={100}
                    size={104}
                    strokeWidth={8}
                    colorClass={
                      report.totalScore >= 80
                        ? "text-emerald-500"
                        : report.totalScore >= 60
                        ? "text-amber-500"
                        : "text-rose-500"
                    }
                    label={String(report.totalScore)}
                    sublabel="/ 100"
                  />

                  <div className="space-y-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                      Overall Conversion Score
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-lg font-bold text-base border shadow-sm ${
                          report.totalScore >= 80
                            ? "bg-emerald-950/80 border-emerald-700/80 text-emerald-300"
                            : report.totalScore >= 60
                            ? "bg-amber-950/80 border-amber-700/80 text-amber-300"
                            : "bg-rose-950/80 border-rose-700/80 text-rose-300"
                        }`}
                      >
                        Grade {report.letterGrade}
                      </span>
                      <span className="text-xs font-medium text-zinc-200">
                        {report.totalScore >= 80
                          ? "High Conversion Readiness"
                          : report.totalScore >= 65
                          ? "Solid Foundation • Needs Polish"
                          : "High Funnel Friction Detected"}
                      </span>
                    </div>

                    {/* Dimension Mini Circular Rings */}
                    <div className="flex items-center gap-4 pt-1 border-t border-zinc-800/80">
                      {(["persuasion", "execution", "experience"] as const).map((dKey) => {
                        const d = report.dimensions[dKey];
                        const shortLabel =
                          dKey === "persuasion" ? "Persuasion" : dKey === "execution" ? "Execution" : "Experience";
                        const ringColor =
                          d.percentage >= 75
                            ? "text-emerald-500"
                            : d.percentage >= 50
                            ? "text-amber-500"
                            : "text-rose-500";
                        return (
                          <div key={dKey} className="flex items-center gap-2">
                            <ScoreRing
                              value={d.score}
                              max={d.maxScore}
                              size={32}
                              strokeWidth={3.5}
                              colorClass={ringColor}
                              label={`${d.percentage}%`}
                            />
                            <div>
                              <div className="text-[10px] text-zinc-400 leading-none">{shortLabel}</div>
                              <div className="text-xs font-mono font-semibold text-white leading-tight mt-0.5">
                                {d.score}<span className="text-zinc-500 font-normal">/{d.maxScore}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audience & Conversion Context Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Target Audience */}
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                      Target Audience (ICP)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {report.targetAudience.roles.length > 0 ? (
                      report.targetAudience.roles.slice(0, 3).map((role, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 text-[11px] font-medium"
                        >
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-300 font-medium text-xs">
                        Enterprise B2B Buyers
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {report.targetAudience.segments[0] || "B2B Decision Makers"}
                  </div>
                </div>

                {/* 2. Primary Conversion Action */}
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                      Primary Conversion Action
                    </span>
                  </div>
                  <div>
                    {report.signalsPreview.primaryCtaText ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/50 border border-amber-800/60 text-amber-300 font-medium text-xs font-mono">
                        "{report.signalsPreview.primaryCtaText}"
                        <ArrowRight className="w-3 h-3 text-amber-400" />
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-xs">No CTA Detected</span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {report.signalsPreview.hasAboveTheFoldCta ? "Positioned Above-the-fold" : "Below-the-fold Placement"}
                  </div>
                </div>

                {/* 3. Visitor Journey Intent */}
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Compass className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                      Visitor Journey Intent
                    </span>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-950/50 border border-indigo-800/60 text-indigo-300 font-medium text-[11px] font-mono uppercase tracking-wide">
                      {report.visitorIntent}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {report.visitorIntent.toLowerCase().includes("discovery")
                      ? "Evaluating capability fit & proof"
                      : "Direct acquisition intent"}
                  </div>
                </div>

                {/* 4. Lead Capture Funnel */}
                <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                      Lead Funnel Engine
                    </span>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium font-mono truncate max-w-full ${
                        report.signalsPreview.leadCaptureEngine
                          ? "bg-sky-950/50 border border-sky-800/60 text-sky-300"
                          : "bg-rose-950/50 border border-rose-800/60 text-rose-300"
                      }`}
                    >
                      {report.signalsPreview.leadCaptureEngine ? "Verified Form / Modal" : "External Redirect / Script"}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {report.signalsPreview.leadCaptureEngine
                      ? "Direct On-Page Funnel Active"
                      : "Unverified On-Page Capture"}
                  </div>
                </div>
              </div>

              {/* Conversion-Readiness Gate Diagnostic Banner */}
              {report.gatesTriggered.length > 0 && (
                <div className="rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-zinc-900/90 to-amber-950/20 p-4.5 space-y-3 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-rose-900/40 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-semibold text-rose-200 tracking-tight">
                            Conversion-Readiness Gate Applied: Missing Inline Lead Capture
                          </h3>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700/60 font-semibold">
                            Rubric v3 Rule
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Architectural CRO check: High persuasive copy cannot convert visitors if the capture funnel is missing or unverified.
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-rose-900/80 border border-rose-700 text-rose-200 font-mono text-[11px] font-semibold">
                        Execution Score Capped at 30% (Max 10.5 / 35 pts)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-0.5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
                        Diagnostic Context:
                      </span>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        The primary action on this page is <strong className="text-white">"{report.signalsPreview.primaryCtaText || 'Demo'}"</strong>, but no interactive form or embedded capture modal was verified in the page DOM. When CTA clicks navigate to external schedulers or external domains without inline fallback, conversion rates drop dramatically.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold block">
                        Actionable Fix to Unblock Score (+24.5 Pts):
                      </span>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Embed an inline 2-to-3 field capture form directly into the hero or ensure your modal trigger script attaches to the DOM on page load. Once lead capture is verified, the gate lifts and the full 35 execution points become available.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Core Feature: Interactive Visual Audit Studio (Full-Page Canvas + Actionable Direct Issues) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/70 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-semibold text-white">
                      Full-Page Visual Audit & Section Hotspot Annotations
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Pins are tagged across the entire website height (hero, proof, and deep funnel). Click any card to jump directly to its location.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setIssueFilter("all")}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      issueFilter === "all" ? "bg-zinc-800 text-white border border-zinc-700" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    All ({report.recommendations.length})
                  </button>
                  <button
                    onClick={() => setIssueFilter("high")}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      issueFilter === "high" ? "bg-rose-950 text-rose-300 border border-rose-800" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    High Impact
                  </button>
                  <button
                    onClick={() => setIssueFilter("persuasion")}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      issueFilter === "persuasion" ? "bg-zinc-800 text-white border border-zinc-700" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Persuasion
                  </button>
                  <button
                    onClick={() => setIssueFilter("execution")}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      issueFilter === "execution" ? "bg-zinc-800 text-white border border-zinc-700" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Execution
                  </button>
                </div>
              </div>

              {/* Split Studio: Left = Scrollable Full-Page Canvas, Right = Direct Intuitive Fix Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left (6 cols): Scrollable Full-Page Screenshot Canvas */}
                <div className="lg:col-span-6 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col shadow-lg sticky top-20">
                  {/* Browser Chrome Toolbar */}
                  <div className="px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 truncate max-w-[200px] bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      {report.url.replace(/^https?:\/\//, "")}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                        Full Page Canvas
                      </span>
                      <button
                        onClick={() => setIsScreenshotExpanded(true)}
                        className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded"
                        title="Enlarge screenshot"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Zoom</span>
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Canvas for Full Page Capture */}
                  <div
                    ref={screenshotContainerRef}
                    className="relative w-full bg-zinc-950 max-h-[560px] overflow-y-auto scroll-smooth select-none border-b border-zinc-900"
                  >
                    {report.screenshotBase64 ? (
                      <div className="relative w-full">
                        <img
                          src={report.screenshotBase64}
                          alt={`Full page screenshot of ${report.url}`}
                          className="w-full h-auto object-cover object-top block"
                        />

                        {/* Visual Overlay Pins Across Entire Page Height */}
                        {tags.map((tag) => {
                          const isSelected = (selectedTagId || tags[0]?.id) === tag.id;
                          const isHovered = hoveredTagId === tag.id;
                          const isActive = isSelected || isHovered;

                          const pinBg =
                            tag.type === "issue"
                              ? "bg-rose-500 text-white"
                              : tag.type === "warning"
                              ? "bg-amber-500 text-zinc-950"
                              : "bg-emerald-500 text-white";

                          const pulseBg =
                            tag.type === "issue"
                              ? "bg-rose-500"
                              : tag.type === "warning"
                              ? "bg-amber-500"
                              : "bg-emerald-500";

                          // Calculate smart horizontal & vertical alignment so popover NEVER overflows or clips
                          const isNearLeft = tag.xPercent < 35;
                          const isNearRight = tag.xPercent > 65;
                          const isNearTop = tag.yPercent < 8;

                          const popoverHorizontal = isNearLeft
                            ? "left-0 -translate-x-3"
                            : isNearRight
                            ? "right-0 translate-x-3"
                            : "left-1/2 -translate-x-1/2";

                          const popoverVertical = isNearTop
                            ? "top-full mt-2.5 translate-y-0"
                            : "-top-2 -translate-y-full";

                          const arrowHorizontal = isNearLeft
                            ? "left-6"
                            : isNearRight
                            ? "right-6"
                            : "left-1/2 -translate-x-1/2";

                          const arrowVertical = isNearTop
                            ? "-top-1 border-l border-t border-r-0 border-b-0"
                            : "-bottom-1 border-r border-b border-l-0 border-t-0";

                          return (
                            <div
                              key={tag.id}
                              style={{
                                left: `${tag.xPercent}%`,
                                top: `${tag.yPercent}%`
                              }}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                              onClick={() => {
                                setSelectedTagId(tag.id);
                                scrollToTag(tag.yPercent);
                              }}
                              onMouseEnter={() => setHoveredTagId(tag.id)}
                              onMouseLeave={() => setHoveredTagId(null)}
                            >
                              {/* Pulsing Ping Indicator */}
                              <span
                                className={`absolute inset-0 rounded-full ${pulseBg} opacity-75 animate-ping duration-1000 ${
                                  isActive ? "block" : "opacity-30"
                                }`}
                              />

                              {/* Numbered Hotspot Pin */}
                              <div
                                className={`relative w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xl transition-all duration-300 border-2 ${
                                  isActive
                                    ? `${pinBg} border-white scale-115 shadow-2xl ring-4 ring-white/30`
                                    : `${pinBg} border-zinc-900 hover:scale-110 opacity-90`
                                }`}
                              >
                                {tag.pinNumber}
                              </div>

                              {/* Floating Popover Tooltip (Edge-aware, Never Hidden or Clipped) */}
                              {isActive && (
                                <div
                                  className={`absolute ${popoverHorizontal} ${popoverVertical} z-40 pointer-events-none w-64 max-w-[280px] p-3 rounded-xl bg-zinc-900/98 border border-zinc-700 shadow-2xl text-left backdrop-blur-md`}
                                >
                                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 shrink-0">
                                      #{tag.pinNumber} • {tag.label}
                                    </span>
                                    <span
                                      className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded truncate ${
                                        tag.type === "issue"
                                          ? "text-rose-400 bg-rose-950/60"
                                          : tag.type === "warning"
                                          ? "text-amber-400 bg-amber-950/60"
                                          : "text-emerald-400 bg-emerald-950/60"
                                      }`}
                                    >
                                      {tag.locationLabel}
                                    </span>
                                  </div>
                                  <div className="text-xs font-semibold text-white leading-snug break-words">
                                    {tag.title}
                                  </div>
                                  {tag.directFix && (
                                    <div className="text-[10px] text-emerald-400 mt-1.5 font-mono leading-relaxed border-t border-zinc-800/80 pt-1.5">
                                      <strong className="text-emerald-300">Fix: </strong>
                                      {tag.directFix}
                                    </div>
                                  )}
                                  <div
                                    className={`absolute ${arrowHorizontal} ${arrowVertical} w-2.5 h-2.5 bg-zinc-900 rotate-45 border-zinc-700`}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-12 text-center text-zinc-500 space-y-2">
                        <ImageIcon className="w-8 h-8 mx-auto text-zinc-700" />
                        <div className="text-xs text-zinc-400">Website Capture Processing</div>
                      </div>
                    )}
                  </div>

                  {/* Canvas Footer Bar */}
                  <div className="p-2 bg-zinc-900/90 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 px-3">
                    <span className="flex items-center gap-1.5">
                      <ArrowDownCircle className="w-3.5 h-3.5 text-zinc-400" />
                      Scroll canvas to view lower-page annotations
                    </span>
                    <span className="font-mono text-zinc-500 text-[10px]">
                      {tags.length} Active Pins Tagged
                    </span>
                  </div>
                </div>

                {/* Right (6 cols): Direct, Intuitive Issues & Concrete Fix Cards */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="flex items-center justify-between px-1 text-xs">
                    <span className="font-semibold text-zinc-200">
                      Actionable CRO Fixes ({filteredRecommendations.length})
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      Click any card to auto-locate
                    </span>
                  </div>

                  <div className="space-y-3">
                    {filteredRecommendations.map((rec, index) => {
                      const linkedTag = tags.find((t) => t.recommendationId === rec.id) || tags[index];
                      const isSelected = selectedTagId === linkedTag?.id;
                      const isHovered = hoveredTagId === linkedTag?.id;
                      const isActive = isSelected || isHovered;

                      return (
                        <div
                          key={rec.id}
                          onClick={() => {
                            if (linkedTag) {
                              setSelectedTagId(linkedTag.id);
                              scrollToTag(linkedTag.yPercent);
                            }
                          }}
                          onMouseEnter={() => linkedTag && setHoveredTagId(linkedTag.id)}
                          onMouseLeave={() => setHoveredTagId(null)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-3 ${
                            isActive
                              ? "border-emerald-500 bg-zinc-900/90 shadow-lg ring-1 ring-emerald-500/30"
                              : "border-zinc-800/90 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900/40"
                          }`}
                        >
                          {/* Card Header: Location Tag + Priority */}
                          <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 pb-2">
                            <div className="flex items-center gap-2">
                              {linkedTag && (
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                    linkedTag.type === "issue"
                                      ? "bg-rose-500 text-white"
                                      : linkedTag.type === "warning"
                                      ? "bg-amber-500 text-zinc-950"
                                      : "bg-emerald-500 text-white"
                                  }`}
                                >
                                  {linkedTag.pinNumber}
                                </span>
                              )}
                              <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-zinc-500" />
                                {rec.locationLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                                  rec.priority === "high"
                                    ? "bg-rose-950 text-rose-300 border border-rose-800"
                                    : "bg-amber-950 text-amber-300 border border-amber-800"
                                }`}
                              >
                                {rec.priority}
                              </span>
                            </div>
                          </div>

                          {/* Issue Title & Problem */}
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-white leading-snug">
                              {rec.title}
                            </h3>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                              {rec.problem}
                            </p>
                          </div>

                          {/* Concrete Direct Fix Callout Box */}
                          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] space-y-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                              <Wrench className="w-3.5 h-3.5 shrink-0" />
                              <span>Direct Fix:</span>
                            </div>
                            <p className="text-zinc-200 pl-5 leading-relaxed font-mono text-[10.5px]">
                              {rec.directFix}
                            </p>
                          </div>

                          {/* Card Footer: Lift & Auto-Scroll Button */}
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <div className="text-emerald-400 font-medium flex items-center gap-1 text-[10.5px]">
                              <TrendingUp className="w-3 h-3 shrink-0" />
                              <span>Expected Lift: {rec.expectedImpact}</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (linkedTag) {
                                  setSelectedTagId(linkedTag.id);
                                  scrollToTag(linkedTag.yPercent);
                                }
                              }}
                              className="text-[10px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
                            >
                              <Crosshair className="w-3 h-3" /> Locate Pin
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal for Zoomed Screenshot */}
            {isScreenshotExpanded && report.screenshotBase64 && (
              <div
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
                onClick={() => setIsScreenshotExpanded(false)}
              >
                <div
                  className="max-w-5xl max-h-[92vh] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-700 shadow-2xl flex flex-col cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
                    <span className="font-mono text-zinc-400">{report.url} — Full Page High-Res Capture</span>
                    <button
                      onClick={() => setIsScreenshotExpanded(false)}
                      className="text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      Close ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto p-3 bg-zinc-950 max-h-[85vh]">
                    <img
                      src={report.screenshotBase64}
                      alt="Full website screenshot"
                      className="w-full h-auto rounded border border-zinc-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Core Web Vitals & Lighthouse Metrics (Visual Gauges & Bars) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">
                    Lighthouse & Core Web Vitals Performance
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                  Source: {lighthouse.source.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Lighthouse Mobile Score */}
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950/60 flex items-center gap-3">
                  <ScoreRing
                    value={lighthouse.performanceScore}
                    size={64}
                    strokeWidth={6}
                    colorClass={
                      lighthouse.performanceScore >= 80
                        ? "text-emerald-500"
                        : lighthouse.performanceScore >= 50
                        ? "text-amber-500"
                        : "text-rose-500"
                    }
                    label={String(lighthouse.performanceScore)}
                    sublabel="/ 100"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Performance Score</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {lighthouse.performanceScore >= 80
                        ? "Mobile optimized"
                        : lighthouse.performanceScore >= 50
                        ? "Average mobile speed"
                        : "High bounce risk"}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">Target ≥ 75</div>
                  </div>
                </div>

                {/* Metric 2: LCP */}
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950/60 flex items-center gap-3">
                  <ScoreRing
                    value={Math.max(100 - Math.round((lighthouse.lcpSeconds / 4.5) * 100), 15)}
                    max={100}
                    size={64}
                    strokeWidth={6}
                    colorClass={
                      lighthouse.lcpSeconds <= 2.5
                        ? "text-emerald-500"
                        : lighthouse.lcpSeconds <= 4.0
                        ? "text-amber-500"
                        : "text-rose-500"
                    }
                    label={`${lighthouse.lcpSeconds}s`}
                    sublabel="LCP"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">LCP (Load Speed)</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {lighthouse.lcpSeconds <= 2.5
                        ? "Fast hero render"
                        : lighthouse.lcpSeconds <= 4.0
                        ? "Moderate load time"
                        : "Slow largest paint"}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">Target &lt; 2.5s</div>
                  </div>
                </div>

                {/* Metric 3: CLS */}
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950/60 flex items-center gap-3">
                  <ScoreRing
                    value={Math.max(100 - Math.round((lighthouse.cls / 0.3) * 100), 15)}
                    max={100}
                    size={64}
                    strokeWidth={6}
                    colorClass={
                      lighthouse.cls <= 0.1
                        ? "text-emerald-500"
                        : lighthouse.cls <= 0.25
                        ? "text-amber-500"
                        : "text-rose-500"
                    }
                    label={String(lighthouse.cls)}
                    sublabel="CLS"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">CLS (Visual Shift)</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {lighthouse.cls <= 0.1
                        ? "Stable page layout"
                        : lighthouse.cls <= 0.25
                        ? "Minor layout shift"
                        : "Unstable layout"}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">Target &lt; 0.10</div>
                  </div>
                </div>

                {/* Metric 4: FCP */}
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950/60 flex items-center gap-3">
                  <ScoreRing
                    value={Math.max(100 - Math.round((lighthouse.fcpSeconds / 3.5) * 100), 15)}
                    max={100}
                    size={64}
                    strokeWidth={6}
                    colorClass={
                      lighthouse.fcpSeconds <= 1.8
                        ? "text-emerald-500"
                        : lighthouse.fcpSeconds <= 3.0
                        ? "text-amber-500"
                        : "text-rose-500"
                    }
                    label={`${lighthouse.fcpSeconds}s`}
                    sublabel="FCP"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">FCP (First Paint)</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {lighthouse.fcpSeconds <= 1.8
                        ? "Instant visual feedback"
                        : lighthouse.fcpSeconds <= 3.0
                        ? "Acceptable first paint"
                        : "Delayed first paint"}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">Target &lt; 1.8s</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Dimension Breakdown Summary Cards (Uniform Circular Gauges) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Dimension A */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center gap-4">
                <ScoreRing
                  value={report.dimensions.persuasion.score}
                  max={report.dimensions.persuasion.maxScore}
                  size={68}
                  strokeWidth={6}
                  colorClass={
                    report.dimensions.persuasion.percentage >= 75
                      ? "text-emerald-500"
                      : report.dimensions.persuasion.percentage >= 50
                      ? "text-amber-500"
                      : "text-rose-500"
                  }
                  label={`${report.dimensions.persuasion.percentage}%`}
                  sublabel={`${report.dimensions.persuasion.score}/${report.dimensions.persuasion.maxScore}`}
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-white font-semibold flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" /> Conversion Persuasion
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-zinc-200">
                    {report.dimensions.persuasion.score} <span className="text-zinc-500 font-normal">/ {report.dimensions.persuasion.maxScore} pts</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-snug">
                    Audience-problem resonance, quantified value proposition, customer proof.
                  </div>
                </div>
              </div>

              {/* Dimension B */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center gap-4">
                <ScoreRing
                  value={report.dimensions.execution.score}
                  max={report.dimensions.execution.maxScore}
                  size={68}
                  strokeWidth={6}
                  colorClass={
                    report.dimensions.execution.percentage >= 75
                      ? "text-emerald-500"
                      : report.dimensions.execution.percentage >= 50
                      ? "text-amber-500"
                      : "text-rose-500"
                  }
                  label={`${report.dimensions.execution.percentage}%`}
                  sublabel={`${report.dimensions.execution.score}/${report.dimensions.execution.maxScore}`}
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-white font-semibold flex items-center gap-1.5 truncate">
                      <Target className="w-3.5 h-3.5 text-sky-400 shrink-0" /> Conversion Execution
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-zinc-200">
                    {report.dimensions.execution.score} <span className="text-zinc-500 font-normal">/ {report.dimensions.execution.maxScore} pts</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-snug">
                    Above-the-fold CTA prominence, low modal friction, lead capture usability.
                  </div>
                </div>
              </div>

              {/* Dimension C */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center gap-4">
                <ScoreRing
                  value={report.dimensions.experience.score}
                  max={report.dimensions.experience.maxScore}
                  size={68}
                  strokeWidth={6}
                  colorClass={
                    report.dimensions.experience.percentage >= 75
                      ? "text-emerald-500"
                      : report.dimensions.experience.percentage >= 50
                      ? "text-amber-500"
                      : "text-rose-500"
                  }
                  label={`${report.dimensions.experience.percentage}%`}
                  sublabel={`${report.dimensions.experience.score}/${report.dimensions.experience.maxScore}`}
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-white font-semibold flex items-center gap-1.5 truncate">
                      <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Supporting Experience
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-zinc-200">
                    {report.dimensions.experience.score} <span className="text-zinc-500 font-normal">/ {report.dimensions.experience.maxScore} pts</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-snug">
                    Mobile viewport configuration, LCP rendering speed, and layout stability.
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Score Breakdown (grouped by dimension, aligned grid rows with Circular Progress) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
              <div className="p-4 border-b border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Score Breakdown</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {report.criteria.length} checks across 3 dimensions. Click a row for evidence and scoring math.
                    </p>
                  </div>
                  <div className="flex gap-1 text-xs">
                    {(["all", "persuasion", "execution", "experience"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                          activeTab === tab
                            ? "bg-zinc-800 text-white font-medium border border-zinc-700"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Method legend */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-500">
                  <span className="text-zinc-600">How each check is measured:</span>
                  {(Object.keys(METHOD_META) as Array<keyof typeof METHOD_META>).map((k) => {
                    const m = METHOD_META[k];
                    const Icon = m.icon;
                    return (
                      <span key={k} className="inline-flex items-center gap-1" title={m.explain}>
                        <Icon className={`w-3 h-3 ${m.color}`} />
                        {m.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {(["persuasion", "execution", "experience"] as const)
                .filter((dim) => activeTab === "all" || activeTab === dim)
                .map((dim) => {
                  const dimSummary = report.dimensions[dim];
                  const rows = report.criteria.filter((c) => c.dimension === dim);
                  const pct = dimSummary.percentage;
                  return (
                    <div key={dim}>
                      {/* Dimension group header */}
                      <div className="px-4 py-2.5 bg-zinc-950/60 border-b border-zinc-800/70 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                            {dimSummary.name || dim}
                          </span>
                          {dimSummary.gateApplied && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800/60">
                              Capped by gate
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <ScoreRing
                            value={dimSummary.score}
                            max={dimSummary.maxScore}
                            size={30}
                            strokeWidth={3.5}
                            colorClass={pct >= 75 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-rose-500"}
                            label={`${pct}%`}
                          />
                          <span className="text-xs font-mono text-white tabular-nums w-14 text-right">
                            {dimSummary.score}
                            <span className="text-zinc-500"> / {dimSummary.maxScore}</span>
                          </span>
                        </div>
                      </div>

                      <div className="divide-y divide-zinc-800/60">
                        {rows.map((criterion) => {
                          const isExpanded = !!expandedCriteria[criterion.id];
                          const method = METHOD_META[criterion.source as keyof typeof METHOD_META] ?? METHOD_META.dom_extraction;
                          const MethodIcon = method.icon;
                          const ratio = criterion.maxPoints > 0 ? criterion.earnedPoints / criterion.maxPoints : 0;
                          const ringColor =
                            criterion.status === "passed"
                              ? "text-emerald-500"
                              : criterion.status === "partial"
                              ? "text-amber-500"
                              : "text-rose-500";
                          const StatusIcon = criterion.status === "passed" ? CheckCircle2 : criterion.status === "partial" ? AlertCircle : XCircle;
                          const statusColor = criterion.status === "passed" ? "text-emerald-400" : criterion.status === "partial" ? "text-amber-400" : "text-rose-400";
                          const rawSummary = criterion.notes || criterion.scoringRule;
                          const summary = rawSummary.replace(
                            /^AI scored \d+(\.\d+)?\/10\.?\s*(\([^)]*\)\.?\s*)?(Specificity:\s*\w+\.?\s*)?(Friction:\s*\w+\.?\s*)?/i,
                            ""
                          );

                          return (
                            <div key={criterion.id}>
                              <button
                                type="button"
                                onClick={() => toggleCriterion(criterion.id)}
                                className="w-full text-left px-4 py-3 hover:bg-zinc-900/50 transition-colors grid grid-cols-[18px_1fr_auto_16px] sm:grid-cols-[18px_1fr_150px_110px_16px] items-center gap-3"
                              >
                                <StatusIcon className={`w-4 h-4 ${statusColor}`} />

                                <div className="min-w-0">
                                  <div className="text-[13px] font-medium text-white truncate">{criterion.name}</div>
                                  <div className="text-[11px] text-zinc-500 truncate">{summary}</div>
                                </div>

                                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
                                  <MethodIcon className={`w-3.5 h-3.5 ${method.color}`} />
                                  {method.label}
                                </span>

                                <div className="flex items-center gap-2 justify-end">
                                  <ScoreRing
                                    value={criterion.earnedPoints}
                                    max={criterion.maxPoints}
                                    size={28}
                                    strokeWidth={3}
                                    colorClass={ringColor}
                                    label={`${Math.round(ratio * 100)}%`}
                                  />
                                  <span className="text-xs font-mono tabular-nums text-white w-14 text-right">
                                    {criterion.earnedPoints}
                                    <span className="text-zinc-500">/{criterion.maxPoints}</span>
                                  </span>
                                </div>

                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                                )}
                              </button>

                              {isExpanded && (
                                <div className="px-4 pb-4 pl-[46px] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                  <div className="space-y-1.5">
                                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Found on page</div>
                                    <blockquote className="p-2.5 rounded-lg bg-zinc-950 border-l-2 border-zinc-700 text-zinc-300 text-[11px] leading-relaxed break-words">
                                      {criterion.evidence || "No direct evidence extracted."}
                                    </blockquote>
                                  </div>

                                  <div className="space-y-1.5">
                                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Assessment</div>
                                    {criterion.checks && criterion.checks.length > 0 && (
                                      <ul className="space-y-1">
                                        {criterion.checks.map((chk, i) => (
                                          <li key={i} className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                                            {chk.passed ? (
                                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                            ) : (
                                              <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                                            )}
                                            {chk.label}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    {criterion.notes && (
                                      <p className="text-[11px] text-zinc-400 leading-relaxed">{criterion.notes}</p>
                                    )}
                                    {!criterion.notes && (!criterion.checks || criterion.checks.length === 0) && (
                                      <p className="text-[11px] text-zinc-400 leading-relaxed">{criterion.scoringRule}</p>
                                    )}
                                  </div>

                                  <div className="space-y-1.5">
                                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">How it is scored</div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                                      <MethodIcon className={`w-3.5 h-3.5 ${method.color}`} />
                                      {method.label}
                                    </div>
                                    <p className="text-[11px] text-zinc-500 leading-relaxed">{method.explain}</p>
                                    <div className="text-[11px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 rounded px-2 py-1">
                                      {criterion.scoringRule} → {criterion.earnedPoints} / {criterion.maxPoints} pts
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
