"use client";

import React, { useState } from "react";
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
  HelpCircle,
  Info
} from "lucide-react";

// Circular SVG Progress Ring
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

  return (
    <div className="relative flex flex-col items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-800"
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
        <span className="text-xl font-bold tracking-tight text-white leading-none">
          {label ?? value}
        </span>
        {sublabel && (
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

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<GraderReport | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "persuasion" | "execution" | "experience">("all");
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null);
  const [isScreenshotExpanded, setIsScreenshotExpanded] = useState(false);

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

      setReport(data.report);
      // Auto-select first tag if available
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
                Audience-aware CRO grader. Evaluates conversion persuasion, lead capture execution, and Core Web Vitals with visual hotspot annotations.
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
              <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 text-center space-y-3">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-300 mx-auto" />
                <div className="space-y-1">
                  <div className="text-xs font-medium text-zinc-200">
                    Running Multi-Phase Evaluation Pipeline...
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Extracting DOM signals, capturing live browser render, evaluating persuasion rubric, and checking Core Web Vitals.
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

        {/* State 2: Visual Evaluation Report with Screenshot Tagging */}
        {report && (
          <div className="space-y-8">
            {/* Header: Score Summary Bar */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
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
                  <h1 className="text-lg font-semibold tracking-tight text-white">
                    Landing Page Quality & Conversion Report
                  </h1>
                </div>

                {/* Score Pill */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[11px] text-zinc-400 font-mono uppercase">Overall Score</div>
                    <div className="text-2xl font-bold text-white tracking-tight">
                      {report.totalScore} <span className="text-xs font-normal text-zinc-500">/ 100</span>
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center font-bold text-lg text-white shadow-inner">
                    {report.letterGrade}
                  </div>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                  <span className="text-zinc-500 text-[11px] block mb-0.5">Target Audience:</span>
                  <span className="text-zinc-200 font-medium">
                    {report.targetAudience.roles.join(", ") || "Enterprise Decision Makers"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                  <span className="text-zinc-500 text-[11px] block mb-0.5">Primary Conversion Action:</span>
                  <span className="text-zinc-200 font-medium truncate block">
                    {report.signalsPreview.primaryCtaText ? `"${report.signalsPreview.primaryCtaText}"` : "None detected"}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
                  <span className="text-zinc-500 text-[11px] block mb-0.5">Visitor Intent:</span>
                  <span className="text-zinc-200 font-medium uppercase font-mono text-[11px]">
                    {report.visitorIntent}
                  </span>
                </div>
              </div>

              {/* Critical Gates Alert if any */}
              {report.gatesTriggered.length > 0 && (
                <div className="p-3 rounded-lg border border-rose-900/80 bg-rose-950/40 text-xs text-rose-300 space-y-1">
                  <div className="font-semibold text-rose-200 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Critical Conversion Gate Triggered
                  </div>
                  {report.gatesTriggered.map((gate, i) => (
                    <div key={i} className="text-[11px] text-rose-300/90 pl-5">• {gate}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Core Feature: Interactive Visual Audit Studio (Screenshot + Tagged Hotspots) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/70 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-semibold text-white">
                      Visual Landing Page Audit & Hotspot Annotations
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Interactive pins tag conversion issues and verified strengths directly on the rendered page.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Issue
                  </span>
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Warning
                  </span>
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Strength
                  </span>
                </div>
              </div>

              {/* Split Studio: Left = Annotated Screenshot, Right = Linked Recommendations List */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left (7 cols): Visual Annotated Screenshot Frame */}
                <div className="lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col shadow-lg">
                  {/* Browser Chrome Toolbar */}
                  <div className="px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 truncate max-w-[240px] bg-zinc-950 px-2.5 py-0.5 rounded border border-zinc-800">
                      {report.url.replace(/^https?:\/\//, "")}
                    </div>
                    <button
                      onClick={() => setIsScreenshotExpanded(true)}
                      className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                      title="Enlarge screenshot"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Zoom</span>
                    </button>
                  </div>

                  {/* Screenshot Canvas with Interactive Tag Pins */}
                  <div className="relative w-full bg-zinc-950 min-h-[360px] overflow-hidden select-none">
                    {report.screenshotBase64 ? (
                      <div className="relative w-full">
                        <img
                          src={report.screenshotBase64}
                          alt={`Screenshot of ${report.url}`}
                          className="w-full h-auto object-cover object-top block"
                        />

                        {/* Visual Overlay Pins */}
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

                          return (
                            <div
                              key={tag.id}
                              style={{
                                left: `${tag.xPercent}%`,
                                top: `${tag.yPercent}%`
                              }}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                              onClick={() => setSelectedTagId(tag.id)}
                              onMouseEnter={() => setHoveredTagId(tag.id)}
                              onMouseLeave={() => setHoveredTagId(null)}
                            >
                              {/* Pulsing Ring Effect */}
                              <span
                                className={`absolute inset-0 rounded-full ${pulseBg} opacity-75 animate-ping duration-1000 ${
                                  isActive ? "block" : "opacity-40"
                                }`}
                              />

                              {/* Numbered Pin Badge */}
                              <div
                                className={`relative w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-xl transition-all duration-300 border-2 ${
                                  isActive
                                    ? `${pinBg} border-white scale-110 shadow-2xl ring-4 ring-white/30`
                                    : `${pinBg} border-zinc-900 hover:scale-105 opacity-90`
                                }`}
                              >
                                {tag.pinNumber}
                              </div>

                              {/* Floating Tooltip Callout (visible when active) */}
                              {isActive && (
                                <div
                                  className="absolute left-1/2 -top-2 transform -translate-x-1/2 -translate-y-full z-30 pointer-events-none w-56 p-2 rounded-lg bg-zinc-900/95 border border-zinc-700 shadow-2xl text-left backdrop-blur-sm"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                      #{tag.pinNumber} • {tag.label}
                                    </span>
                                    <span
                                      className={`text-[9px] font-mono uppercase font-bold px-1 rounded ${
                                        tag.type === "issue"
                                          ? "text-rose-400"
                                          : tag.type === "warning"
                                          ? "text-amber-400"
                                          : "text-emerald-400"
                                      }`}
                                    >
                                      {tag.type}
                                    </span>
                                  </div>
                                  <div className="text-xs font-semibold text-white leading-tight">
                                    {tag.title}
                                  </div>
                                  <div className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
                                    {tag.description}
                                  </div>
                                  {/* Triangle arrow */}
                                  <div className="absolute left-1/2 -bottom-1 transform -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45 border-r border-b border-zinc-700" />
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
                        <p className="text-[11px] text-zinc-600 max-w-xs mx-auto">
                          DOM and interaction verification ran directly on the page structure.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right (5 cols): Synchronized Issues & Recommendations Cards */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="text-xs font-semibold text-zinc-300 flex items-center justify-between px-1">
                    <span>Identified Issues & Opportunities</span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Click card to locate on canvas
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {/* Synchronized Recommendation Cards linked to Pins */}
                    {report.recommendations.map((rec, index) => {
                      const linkedTag = tags.find((t) => t.recommendationId === rec.id) || tags[index];
                      const isSelected = selectedTagId === linkedTag?.id;
                      const isHovered = hoveredTagId === linkedTag?.id;
                      const isActive = isSelected || isHovered;

                      return (
                        <div
                          key={rec.id}
                          onClick={() => linkedTag && setSelectedTagId(linkedTag.id)}
                          onMouseEnter={() => linkedTag && setHoveredTagId(linkedTag.id)}
                          onMouseLeave={() => setHoveredTagId(null)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs space-y-2 ${
                            isActive
                              ? "border-emerald-500/80 bg-zinc-900/90 shadow-md ring-1 ring-emerald-500/30"
                              : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {linkedTag && (
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
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
                              <span className="font-semibold text-white leading-snug">
                                {rec.title}
                              </span>
                            </div>

                            <span
                              className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                                rec.priority === "high"
                                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                                  : "bg-amber-950 text-amber-400 border border-amber-800"
                              }`}
                            >
                              {rec.priority}
                            </span>
                          </div>

                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            <span className="text-zinc-500 font-medium">Problem: </span>
                            {rec.problem}
                          </p>

                          <div className="pt-2 border-t border-zinc-800/60 text-[11px] space-y-1">
                            <div className="text-zinc-300">
                              <span className="text-zinc-500 font-medium">Prescribed Action: </span>
                              {rec.action}
                            </div>
                            <div className="text-emerald-400 text-[10px] font-medium flex items-center gap-1 pt-0.5">
                              <Check className="w-3 h-3 shrink-0" />
                              <span>{rec.expectedImpact}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Extra Verified Strength Cards */}
                    {tags
                      .filter((t) => t.type === "strength")
                      .map((strTag) => {
                        const isSelected = selectedTagId === strTag.id;
                        const isHovered = hoveredTagId === strTag.id;
                        const isActive = isSelected || isHovered;

                        return (
                          <div
                            key={strTag.id}
                            onClick={() => setSelectedTagId(strTag.id)}
                            onMouseEnter={() => setHoveredTagId(strTag.id)}
                            onMouseLeave={() => setHoveredTagId(null)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                              isActive
                                ? "border-emerald-500/80 bg-zinc-900/90 shadow-md ring-1 ring-emerald-500/30"
                                : "border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/30"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                                  {strTag.pinNumber}
                                </span>
                                <span className="font-semibold text-white">{strTag.title}</span>
                              </div>
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                Verified
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 pl-7">{strTag.description}</p>
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
                className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
                onClick={() => setIsScreenshotExpanded(false)}
              >
                <div
                  className="max-w-5xl max-h-[92vh] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-700 shadow-2xl flex flex-col cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
                    <span className="font-mono text-zinc-400">{report.url} — High Resolution Capture</span>
                    <button
                      onClick={() => setIsScreenshotExpanded(false)}
                      className="text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      Close ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto p-3 bg-zinc-950">
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
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950/60 flex flex-col justify-between space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-white">LCP (Load Speed)</span>
                    <span className="text-[10px] font-mono text-zinc-500">Target &lt; 2.5s</span>
                  </div>
                  <MetricBar
                    value={lighthouse.lcpSeconds}
                    goodThreshold={2.5}
                    poorThreshold={4.0}
                    unit="s"
                    isLowerBetter={true}
                  />
                  <div className="text-[10px] text-zinc-500">Largest Contentful Paint banner hero</div>
                </div>

                {/* Metric 3: CLS */}
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950/60 flex flex-col justify-between space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-white">CLS (Visual Shift)</span>
                    <span className="text-[10px] font-mono text-zinc-500">Target &lt; 0.1</span>
                  </div>
                  <MetricBar
                    value={lighthouse.cls}
                    goodThreshold={0.1}
                    poorThreshold={0.25}
                    unit=""
                    isLowerBetter={true}
                  />
                  <div className="text-[10px] text-zinc-500">Cumulative Layout Shift during render</div>
                </div>

                {/* Metric 4: FCP */}
                <div className="p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-950/60 flex flex-col justify-between space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-white">FCP (First Paint)</span>
                    <span className="text-[10px] font-mono text-zinc-500">Target &lt; 1.8s</span>
                  </div>
                  <MetricBar
                    value={lighthouse.fcpSeconds}
                    goodThreshold={1.8}
                    poorThreshold={3.0}
                    unit="s"
                    isLowerBetter={true}
                  />
                  <div className="text-[10px] text-zinc-500">First Contentful Paint DOM start</div>
                </div>
              </div>
            </div>

            {/* Section 3: Dimension Breakdown Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Dimension A */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Conversion Persuasion
                  </span>
                  <span className="font-mono font-bold text-white">
                    {report.dimensions.persuasion.score} <span className="text-zinc-500 font-normal">/ {report.dimensions.persuasion.maxScore}</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-200 rounded-full transition-all duration-500"
                    style={{ width: `${report.dimensions.persuasion.percentage}%` }}
                  />
                </div>
                <div className="text-[11px] text-zinc-400 leading-tight">
                  Audience-problem resonance, quantified value proposition, customer proof credibility.
                </div>
              </div>

              {/* Dimension B */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-zinc-400" /> Conversion Execution
                  </span>
                  <span className="font-mono font-bold text-white">
                    {report.dimensions.execution.score} <span className="text-zinc-500 font-normal">/ {report.dimensions.execution.maxScore}</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-200 rounded-full transition-all duration-500"
                    style={{ width: `${report.dimensions.execution.percentage}%` }}
                  />
                </div>
                <div className="text-[11px] text-zinc-400 leading-tight">
                  Above-the-fold CTA prominence, low modal friction, lead capture usability.
                </div>
              </div>

              {/* Dimension C */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-zinc-400" /> Supporting Experience
                  </span>
                  <span className="font-mono font-bold text-white">
                    {report.dimensions.experience.score} <span className="text-zinc-500 font-normal">/ {report.dimensions.experience.maxScore}</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-200 rounded-full transition-all duration-500"
                    style={{ width: `${report.dimensions.experience.percentage}%` }}
                  />
                </div>
                <div className="text-[11px] text-zinc-400 leading-tight">
                  Mobile viewport configuration, LCP rendering speed, and layout stability.
                </div>
              </div>
            </div>

            {/* Section 4: Streamlined Evaluation Breakdown (Tidy Tabs & Accordions) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-white">Evaluation Breakdown by Criterion</h2>
                  <p className="text-xs text-zinc-500">Evidence and scoring mechanics mapped to Rubric v3.</p>
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

              <div className="divide-y divide-zinc-800/70">
                {report.criteria
                  .filter((c) => activeTab === "all" || c.dimension === activeTab)
                  .map((criterion) => {
                    const isExpanded = !!expandedCriteria[criterion.id];
                    return (
                      <div key={criterion.id} className="p-3.5 hover:bg-zinc-900/40 transition-colors">
                        <div
                          className="flex items-center justify-between gap-4 cursor-pointer"
                          onClick={() => toggleCriterion(criterion.id)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {getStatusBadge(criterion.status)}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-white truncate">
                                  {criterion.name}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                                  [{criterion.source}]
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate max-w-lg hidden sm:block">
                                {criterion.scoringRule}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right text-xs">
                              <span className="font-semibold text-white">{criterion.earnedPoints}</span>
                              <span className="text-zinc-500"> / {criterion.maxPoints} pts</span>
                            </div>
                            <button
                              className="text-zinc-500 hover:text-zinc-300 p-1"
                              aria-label="Toggle details"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Evidence Detail */}
                        {isExpanded && (
                          <div className="mt-2.5 pt-2.5 border-t border-zinc-800/50 text-xs space-y-2">
                            <div className="text-zinc-400 text-[11px]">
                              <strong className="text-zinc-300">Scoring Logic: </strong>
                              {criterion.scoringRule}
                            </div>
                            {criterion.evidence && (
                              <div className="space-y-1">
                                <span className="text-zinc-500 font-mono text-[10px] block uppercase">
                                  Extracted Evidence:
                                </span>
                                <blockquote className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80 text-zinc-300 font-mono text-[11px] break-words whitespace-pre-wrap">
                                  {criterion.evidence}
                                </blockquote>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
