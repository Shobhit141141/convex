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
  Crosshair,
  Info,
  Calculator,
  Download,
  History,
  Database,
  RefreshCw,
  FileText,
  FileCode,
  Clock
} from "lucide-react";
import { V3CriterionScore } from "@/types/rubric-v3-schema";
import type { AuditHistoryItem } from "@/features/storage/audit-history";

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

// Complete algorithm & mathematical formula lookup for every Rubric v3 criterion
function getCriterionAlgorithm(criterion: V3CriterionScore): {
  formula: string;
  calculation: string;
  tiers: string[];
  reasoning: string;
} {
  const earned = criterion.earnedPoints;
  const max = criterion.maxPoints;
  const rawRating = max > 0 ? Math.round((earned / max) * 10 * 10) / 10 : 0;
  const reasoning = criterion.notes || criterion.scoringRule;

  switch (criterion.id) {
    case "persuasion_problem_fit":
      return {
        formula: "Earned = min(10, round((SemanticRating / 10) × 10, 1))",
        calculation: `Rating ${rawRating}/10 → (${rawRating} / 10) × 10 = ${earned} / 10 pts`,
        tiers: [
          "Passed (≥ 8.0 pts): High pain-point specificity + explicit problem quote in hero/headings",
          "Partial (4.0 – 7.9 pts): Generic problem mentioned without concrete operational pain",
          "Failed (< 4.0 pts): No identifiable buyer pain point articulated"
        ],
        reasoning
      };
    case "persuasion_value_prop":
      return {
        formula: "Earned = min(12, round((SemanticRating / 10) × 12, 1))",
        calculation: `Rating ${rawRating}/10 → round((${rawRating} / 10) × 12, 1) = ${earned} / 12 pts`,
        tiers: [
          "Passed (≥ 9.0 pts): Clear H1 outcome + quantified impact (%) + speed-to-value stated",
          "Partial (5.0 – 8.9 pts): Clear value statement but missing quantified metric or timeframe",
          "Failed (< 5.0 pts): Vague slogan without measurable outcome"
        ],
        reasoning
      };
    case "persuasion_credibility":
      return {
        formula: "Earned = min(10, round((CredibilityRating / 10) × 10, 1))",
        calculation: `Rating ${rawRating}/10 → (${rawRating} / 10) × 10 = ${earned} / 10 pts`,
        tiers: [
          "Passed (≥ 8.0 pts): Customer-attributed metrics + named case studies + 3rd-party trust badges",
          "Partial (4.0 – 7.9 pts): Logo wall (≥ 3 logos) or unattributed company claims only",
          "Failed (< 4.0 pts): No verifiable social proof or customer evidence"
        ],
        reasoning
      };
    case "persuasion_audience_alignment":
      return {
        formula: "Earned = min(10, round((AlignmentRating / 10) × 10, 1))",
        calculation: `Rating ${rawRating}/10 → (${rawRating} / 10) × 10 = ${earned} / 10 pts`,
        tiers: [
          "Passed (≥ 8.0 pts): Role-specific domain vocabulary + zero audience misalignment",
          "Partial (4.0 – 7.9 pts): Broad enterprise terminology applicable to multiple personas",
          "Failed (< 4.0 pts): Copy contradicts or ignores target buyer persona"
        ],
        reasoning
      };
    case "persuasion_offer_attractiveness":
      return {
        formula: "Earned = min(8, round((OfferRating / 10) × 8, 1))",
        calculation: `Rating ${rawRating}/10 → round((${rawRating} / 10) × 8, 1) = ${earned} / 8 pts`,
        tiers: [
          "Passed (≥ 6.0 pts): High CTA-to-problem relevance + low perceived commitment friction",
          "Partial (3.0 – 5.9 pts): Standard high-commitment CTA ('Book Demo') without friction reducer",
          "Failed (< 3.0 pts): Generic or mismatched conversion offer"
        ],
        reasoning
      };
    case "exec_cta_effectiveness":
      return {
        formula: "Earned = AboveFold(+5) + ActionOrientedVerb(+3) + NextStepMicrocopy(+2)",
        calculation: `${criterion.checks?.map((c) => `${c.label.split(" (")[0]}: ${c.passed ? c.label.match(/\+\d+/)?.[0] || "+pts" : "+0"}`).join(" + ") || criterion.scoringRule} = ${earned} / 10 pts`,
        tiers: [
          "+5 pts: Primary CTA positioned in above-the-fold hero viewport",
          "+3 pts: Starts with strong action verb (Book, Start, Get, Try, Request, Launch)",
          "+2 pts: Supporting microcopy clarifies what happens after clicking"
        ],
        reasoning
      };
    case "exec_promise_destination":
      return {
        formula: "Earned = PageType & Intent Consistency Rule (0, 3, 4, or 7–8 pts)",
        calculation: `${criterion.scoringRule} → ${earned} / 8 pts`,
        tiers: [
          "7–8 pts (Passed): CTA destination directly fulfills the headline promise & visitor intent",
          "3–4 pts (Partial): Content/webinar promise gated behind a mismatched sales modal",
          "0 pts (Failed): Missing primary CTA cannot fulfill page promise"
        ],
        reasoning
      };
    case "exec_lead_capture_usability":
      return {
        formula: "Earned = InteractiveFormVerified(10) | StaticDOMForm(8) | ScriptOnly(3.5–4) | Missing(0)",
        calculation: `${criterion.scoringRule} → ${earned} / 10 pts`,
        tiers: [
          "10 pts (Passed): Live browser click verified interactive form/modal renders & accepts input",
          "8 pts (Passed): Explicit <form> & <input> fields verified in static DOM",
          "3.5–4 pts (Partial): External form script (e.g., HubSpot) detected but live render unverified",
          "0 pts (Failed): No lead capture form or script detected"
        ],
        reasoning
      };
    case "exec_friction_load":
      return {
        formula: "Earned = FieldCount ≤ 4 ? 7 : FieldCount ≤ 7 ? 4.5 : 2 (0 if no CTA)",
        calculation: `${criterion.evidence} → ${earned} / 7 pts`,
        tiers: [
          "7.0 pts (Passed): Low friction (≤ 4 form fields or streamlined work-email flow)",
          "4.5 pts (Partial): Moderate friction (5–7 form fields)",
          "2.0 pts (Partial): High drop-off risk (> 7 form fields)"
        ],
        reasoning
      };
    case "exp_lcp_speed":
      return {
        formula: "Earned = LCP ≤ 2.5s ? 5 : LCP ≤ 4.0s ? 2.5 : 0",
        calculation: `${criterion.evidence} → ${earned} / 5 pts`,
        tiers: [
          "5.0 pts (Good): LCP ≤ 2.5 seconds",
          "2.5 pts (Needs Improvement): 2.5s < LCP ≤ 4.0 seconds",
          "0.0 pts (Poor): LCP > 4.0 seconds"
        ],
        reasoning
      };
    case "exp_cls_stability":
      return {
        formula: "Earned = CLS ≤ 0.10 ? 4 : CLS ≤ 0.25 ? 2 : 0",
        calculation: `${criterion.evidence} → ${earned} / 4 pts`,
        tiers: [
          "4.0 pts (Good): CLS ≤ 0.100 (visually stable layout)",
          "2.0 pts (Needs Improvement): 0.100 < CLS ≤ 0.250",
          "0.0 pts (Poor): CLS > 0.250 (severe layout shift)"
        ],
        reasoning
      };
    case "exp_mobile_viewport":
      return {
        formula: "Earned = hasViewportMeta ? 3 : 0",
        calculation: `${criterion.evidence} → ${earned} / 3 pts`,
        tiers: [
          "3.0 pts (Passed): Responsive meta[name='viewport'] tag present",
          "0.0 pts (Failed): Missing mobile viewport configuration"
        ],
        reasoning
      };
    case "exp_text_readability":
    default:
      return {
        formula: "Earned = (hasClearH1 && wordCount ≥ 100) ? 3 : hasClearH1 ? 1.5 : 0",
        calculation: `${criterion.evidence} → ${earned} / ${max} pts`,
        tiers: [
          "3.0 pts (Passed): Clear single H1 heading + substantive copy (≥ 100 words)",
          "1.5 pts (Partial): Clear H1 present but thin body copy (< 100 words)",
          "0.0 pts (Failed): Missing H1 heading structure"
        ],
        reasoning
      };
  }
}

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
  const [progressEvents, setProgressEvents] = useState<
    Array<{ step: string; percent: number; stageLabel: string; detail: string; elapsedMs: number }>
  >([]);
  const [openAlgoId, setOpenAlgoId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<AuditHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [cacheMeta, setCacheMeta] = useState<{
    cached: boolean;
    recordId?: number;
    cachedAt?: string;
  } | null>(null);

  const screenshotContainerRef = useRef<HTMLDivElement>(null);

  const fetchHistory = React.useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/history?limit=40");
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setHistoryItems(data.history);
      }
    } catch {
      // Ignore background history fetch errors
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const loadAuditRecordById = async (id: number) => {
    setLoading(true);
    setError(null);
    setShowHistoryModal(false);
    setProgress(50);
    setProgressEvents([
      {
        step: "fetch_dom",
        percent: 50,
        stageLabel: "Loading Saved Audit from Supabase",
        detail: `Fetching stored evaluation record #${id}...`,
        elapsedMs: 12
      }
    ]);

    try {
      const res = await fetch(`/api/history?id=${id}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.report) {
        throw new Error(data.error || "Failed to load saved audit record.");
      }
      setProgress(100);
      setUrl(data.report.url);
      setReport(data.report);
      setCacheMeta({
        cached: true,
        recordId: data.recordId,
        cachedAt: data.createdAt
      });
      if (data.report.screenshotTags && data.report.screenshotTags.length > 0) {
        setSelectedTagId(data.report.screenshotTags[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load saved audit record.");
    } finally {
      setLoading(false);
    }
  };

  const getSafeFilenameSlug = (targetUrl: string) => {
    try {
      const u = new URL(targetUrl);
      const host = u.hostname.replace(/^www\./, "").replace(/[^a-z0-9.-]/gi, "-");
      const path = u.pathname.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9-_]/gi, "-");
      return path ? `${host}-${path}` : host;
    } catch {
      return "landing-page";
    }
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  const exportReportMarkdown = () => {
    if (!report) return;
    const slug = getSafeFilenameSlug(report.url);
    const dateStr = new Date(report.evaluatedAt).toISOString().split("T")[0];

    const lines: string[] = [
      `# Landing Page Quality & Conversion Report`,
      ``,
      `- **Audited URL:** ${report.url}`,
      `- **Overall Score:** **${report.totalScore} / 100** (Grade **${report.letterGrade}**)`,
      `- **Page Type:** \`${report.pageType.toUpperCase()}\``,
      `- **Target Audience (ICP):** ${report.targetAudience.roles.join(", ") || "Enterprise B2B Buyers"} (${report.targetAudience.segments.join(", ") || "Decision Makers"})`,
      `- **Primary Conversion Action:** ${report.signalsPreview.primaryCtaText ? `"${report.signalsPreview.primaryCtaText}"` : "None detected"} (${report.signalsPreview.hasAboveTheFoldCta ? "Above the fold" : "Below the fold"})`,
      `- **Visitor Journey Intent:** \`${report.visitorIntent.toUpperCase()}\``,
      `- **Lead Funnel Engine:** ${report.signalsPreview.leadCaptureEngine ? `Verified (${report.signalsPreview.leadCaptureType})` : "Unverified / External Script"}`,
      `- **Evaluated At:** ${new Date(report.evaluatedAt).toLocaleString()}`,
      ``,
      `## Executive Summary`,
      `${report.summary}`,
      ``,
      `## Dimension Sub-Scores (Rubric v3)`,
      `| Dimension | Score | Max Points | Percentage | Gate Status |`,
      `| :--- | :---: | :---: | :---: | :--- |`,
      `| **A. Conversion Persuasion** | ${report.dimensions.persuasion.score} | ${report.dimensions.persuasion.maxScore} | ${report.dimensions.persuasion.percentage}% | None |`,
      `| **B. Conversion Execution** | ${report.dimensions.execution.score} | ${report.dimensions.execution.maxScore} | ${report.dimensions.execution.percentage}% | ${report.dimensions.execution.gateApplied ? `Capped (${report.dimensions.execution.gateReason})` : "Passed"} |`,
      `| **C. Supporting Experience** | ${report.dimensions.experience.score} | ${report.dimensions.experience.maxScore} | ${report.dimensions.experience.percentage}% | None |`,
      ``,
      `## Prioritized Actionable CRO Recommendations (${report.recommendations.length})`,
      ``
    ];

    report.recommendations.forEach((rec, i) => {
      lines.push(
        `### ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`,
        `- **Page Zone:** ${rec.locationLabel} (\`~${rec.coordinates.yPercent}% Y\`)`,
        `- **Dimension:** ${rec.dimension.toUpperCase()} (${rec.section})`,
        `- **Expected Conversion Lift:** ${rec.expectedImpact}`,
        `- **Identified Friction / Problem:** ${rec.problem}`,
        `- **Direct Engineering / Copy Fix:** ${rec.directFix}`,
        `- **Implementation Action:** ${rec.action}`,
        ``
      );
    });

    lines.push(`## Complete 13-Check Score Breakdown & Algorithms`, ``);
    report.criteria.forEach((c) => {
      const algo = getCriterionAlgorithm(c);
      lines.push(
        `### ${c.name} — ${c.earnedPoints} / ${c.maxPoints} pts (${c.status.toUpperCase()})`,
        `- **Dimension:** ${c.dimension.toUpperCase()} | **Source:** \`${c.source}\``,
        `- **Formula:** \`${algo.formula}\``,
        `- **Calculation:** \`${algo.calculation}\``,
        `- **Reasoning:** ${algo.reasoning}`,
        `- **Extracted Evidence:** > ${c.evidence || "N/A"}`,
        ``
      );
    });

    triggerDownload(lines.join("\n"), `convex-audit-${slug}-${dateStr}.md`, "text/markdown;charset=utf-8");
    setShowExportMenu(false);
  };

  const exportReportJson = () => {
    if (!report) return;
    const slug = getSafeFilenameSlug(report.url);
    const dateStr = new Date(report.evaluatedAt).toISOString().split("T")[0];
    const exportPayload = {
      ...report,
      screenshotBase64: report.screenshotBase64 ? "[OMITTED_BASE64_IMAGE_FOR_COMPACT_JSON]" : undefined
    };
    triggerDownload(
      JSON.stringify(exportPayload, null, 2),
      `convex-audit-${slug}-${dateStr}.json`,
      "application/json;charset=utf-8"
    );
    setShowExportMenu(false);
  };

  const exportRecommendationsCsv = () => {
    if (!report) return;
    const slug = getSafeFilenameSlug(report.url);
    const dateStr = new Date(report.evaluatedAt).toISOString().split("T")[0];
    const esc = (val: string | number) => `"${String(val ?? "").replace(/"/g, '""')}"`;

    const headers = [
      "Priority",
      "Dimension",
      "Section",
      "Page Zone",
      "Canvas Y%",
      "Title",
      "Problem",
      "Direct Fix",
      "Expected Impact",
      "Action"
    ];
    const rows = report.recommendations.map((r) =>
      [
        r.priority.toUpperCase(),
        r.dimension,
        r.section,
        r.locationLabel,
        `${r.coordinates.yPercent}%`,
        r.title,
        r.problem,
        r.directFix,
        r.expectedImpact,
        r.action
      ]
        .map(esc)
        .join(",")
    );

    triggerDownload(
      [headers.map(esc).join(","), ...rows].join("\n"),
      `convex-recommendations-${slug}-${dateStr}.csv`,
      "text/csv;charset=utf-8"
    );
    setShowExportMenu(false);
  };

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

  const handleGrade = async (targetUrl: string = url, forceRefresh = false) => {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl) return;

    setLoading(true);
    setError(null);
    setSelectedTagId(null);
    setProgress(4);
    setProgressEvents([]);
    setShowHistoryModal(false);

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl, enablePlaywright: true, stream: true, forceRefresh })
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed with status ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalReport: GraderReport | null = null;
      let isCached = false;
      let recId: number | undefined;
      let cachedTimestamp: string | undefined;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;
          const msg = JSON.parse(line);
          if (msg.type === "progress" && msg.event) {
            setProgress(msg.event.percent);
            setProgressEvents((prev) => [...prev, msg.event]);
          } else if (msg.type === "result" && msg.success && msg.report) {
            finalReport = msg.report;
            isCached = !!msg.cached;
            recId = msg.recordId;
            cachedTimestamp = msg.cachedAt;
            setProgress(100);
          } else if (msg.type === "error") {
            throw new Error(msg.error || "Failed to analyze page.");
          }
        }
      }

      if (!finalReport) {
        throw new Error("Evaluation stream ended without returning a report.");
      }

      await new Promise((resolve) => setTimeout(resolve, 180));
      setReport(finalReport);
      setCacheMeta({
        cached: isCached,
        recordId: recId,
        cachedAt: cachedTimestamp || finalReport.evaluatedAt
      });
      if (finalReport.screenshotTags && finalReport.screenshotTags.length > 0) {
        setSelectedTagId(finalReport.screenshotTags[0].id);
      }
      fetchHistory();
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
    setProgressEvents([]);
    setOpenAlgoId(null);
    setCacheMeta(null);
    setShowExportMenu(false);
    fetchHistory();
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
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={resetAnalysis}
              className="flex items-center gap-2.5 text-left hover:opacity-90 transition-opacity"
            >
              <div className="w-6 h-6 rounded bg-white text-zinc-950 flex items-center justify-center font-bold text-xs tracking-tighter shadow-sm">
                C
              </div>
              <span className="font-semibold tracking-tight text-white text-sm">Convex</span>
            </button>
            <span className="text-zinc-600 text-xs">/</span>
            <span className="text-xs text-zinc-400 font-normal hidden sm:inline">
              Conversion Engineering Grader
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Supabase Saved History Button */}
            <button
              type="button"
              onClick={() => {
                fetchHistory();
                setShowHistoryModal(true);
              }}
              className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-md bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800"
            >
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span>History</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                {historyItems.length}
              </span>
            </button>

            {report && (
              <>
                {/* Export Report & Recommendations Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowExportMenu((prev) => !prev)}
                    className="text-xs bg-white text-zinc-950 hover:bg-zinc-200 font-semibold flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-md shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Report</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-zinc-950 border border-zinc-700 shadow-2xl z-50 p-1.5 space-y-1 text-xs">
                      <button
                        type="button"
                        onClick={exportReportMarkdown}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 flex items-start gap-2.5 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-white">Full Analysis &amp; Fixes (.md)</div>
                          <div className="text-[10px] text-zinc-400">
                            Scores, formulas, evidence &amp; CRO roadmap
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={exportRecommendationsCsv}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 flex items-start gap-2.5 transition-colors"
                      >
                        <Download className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-white">Recommendations CSV (.csv)</div>
                          <div className="text-[10px] text-zinc-400">
                            Prioritized issues &amp; direct fixes for trackers
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={exportReportJson}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 flex items-start gap-2.5 transition-colors"
                      >
                        <FileCode className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-white">Structured JSON (.json)</div>
                          <div className="text-[10px] text-zinc-400">
                            Complete Rubric v3 machine-readable data
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={resetAnalysis}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-md hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New URL</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Supabase History Modal Drawer */}
      {showHistoryModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[82vh] rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Saved Website Audit History (Supabase)
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Click any stored record to view its cached report immediately without re-fetching.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800"
              >
                Close ✕
              </button>
            </div>

            <div className="overflow-y-auto divide-y divide-zinc-800/70 p-2">
              {loadingHistory ? (
                <div className="p-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading audit records from Supabase...
                </div>
              ) : historyItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  No website audits saved yet. Run your first URL evaluation to store it in Supabase.
                </div>
              ) : (
                historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 hover:bg-zinc-900/60 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ScoreRing
                        value={item.total_score}
                        max={100}
                        size={42}
                        strokeWidth={4}
                        colorClass={
                          item.total_score >= 80
                            ? "text-emerald-500"
                            : item.total_score >= 60
                            ? "text-amber-500"
                            : "text-rose-500"
                        }
                        label={String(item.total_score)}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-white truncate max-w-xs sm:max-w-md">
                            {item.url}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 uppercase">
                            Grade {item.letter_grade}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 uppercase">
                            {item.page_type}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono flex flex-wrap items-center gap-3 mt-0.5">
                          <span>Persuasion: {item.persuasion_score}/50</span>
                          <span>•</span>
                          <span>Execution: {item.execution_score}/35</span>
                          <span>•</span>
                          <span>Experience: {item.experience_score}/15</span>
                          <span>•</span>
                          <span>{new Date(item.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => loadAuditRecordById(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-colors"
                      >
                        Open Saved
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUrl(item.url);
                          handleGrade(item.url, true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
                        title="Force fresh real-time scan"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Re-run
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* State 1: Input URL Screen */}
        {!report && (
          <div className="max-w-2xl mx-auto text-center space-y-6 pt-12 pb-20">
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
                handleGrade(url, false);
              }}
              className="space-y-3 max-w-xl mx-auto"
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
                    handleGrade("https://leena.ai/function/hr", false);
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
                    handleGrade("https://leena.ai", false);
                  }}
                  className="text-zinc-400 hover:text-zinc-200 underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-400 transition-colors"
                >
                  leena.ai Homepage
                </button>
              </div>
            </form>

            {loading && (
              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 text-left space-y-4 shadow-2xl backdrop-blur-md max-w-xl mx-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-semibold text-white tracking-tight">
                      {progressEvents.length > 0
                        ? progressEvents[progressEvents.length - 1].stageLabel
                        : "Connecting to Live Evaluation Pipeline..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-zinc-100 bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 rounded-md tabular-nums">
                      {progress}%
                    </span>
                  </div>
                </div>

                {/* Real-Time Server Milestone Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span className={progress >= 10 ? "text-zinc-300" : ""}>10% Fetch DOM</span>
                    <span className={progress >= 28 ? "text-zinc-300" : ""}>28% Signals</span>
                    <span className={progress >= 48 ? "text-zinc-300" : ""}>68% AI & Browser</span>
                    <span className={progress >= 96 ? "text-zinc-300" : ""}>96% Rubric v3</span>
                    <span className={progress >= 100 ? "text-emerald-400" : ""}>100% Done</span>
                  </div>
                </div>

                {/* Live Server Telemetry Feed */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 max-h-48 overflow-y-auto font-mono">
                  {progressEvents.length === 0 ? (
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2 py-1">
                      <Loader2 className="w-3 h-3 animate-spin text-zinc-400 shrink-0" />
                      <span>Checking Supabase URL cache & initializing pipeline...</span>
                    </div>
                  ) : (
                    progressEvents.map((ev, idx) => {
                      const isLatest = idx === progressEvents.length - 1;
                      return (
                        <div
                          key={`${ev.step}-${idx}`}
                          className={`flex items-start justify-between gap-3 text-[11px] py-1 px-2 rounded ${
                            isLatest ? "bg-zinc-950/90 text-zinc-100 border border-zinc-800/80" : "text-zinc-400"
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <CheckCircle2
                              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                isLatest ? "text-emerald-400" : "text-zinc-600"
                              }`}
                            />
                            <div className="min-w-0">
                              <span className="font-semibold text-zinc-200">{ev.stageLabel}: </span>
                              <span className="text-zinc-400 break-words">{ev.detail}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-zinc-500 shrink-0 tabular-nums">
                            {(ev.elapsedMs / 1000).toFixed(1)}s
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/30 text-rose-300 text-xs text-left flex items-start gap-2.5 max-w-xl mx-auto">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-rose-200 mb-0.5">Evaluation Error</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {/* Saved Website Audit History on Homepage */}
            {!loading && historyItems.length > 0 && (
              <div className="pt-6 text-left space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-zinc-200">
                      Saved Website Audits ({historyItems.length})
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Instant load from Supabase — no re-fetch required
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/30 divide-y divide-zinc-800/70 overflow-hidden">
                  {historyItems.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadAuditRecordById(item.id)}
                      className="p-3 hover:bg-zinc-900/70 transition-colors cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ScoreRing
                          value={item.total_score}
                          max={100}
                          size={36}
                          strokeWidth={3.5}
                          colorClass={
                            item.total_score >= 80
                              ? "text-emerald-500"
                              : item.total_score >= 60
                              ? "text-amber-500"
                              : "text-rose-500"
                          }
                          label={String(item.total_score)}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-medium text-white truncate max-w-[240px] sm:max-w-sm">
                              {item.url}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                              Grade {item.letter_grade}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2 mt-0.5">
                            <span className="uppercase">{item.page_type}</span>
                            <span>•</span>
                            <span>
                              P:{item.persuasion_score} E:{item.execution_score} X:{item.experience_score}
                            </span>
                            <span>•</span>
                            <span>{new Date(item.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => loadAuditRecordById(item.id)}
                          className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-[11px] font-medium transition-colors"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUrl(item.url);
                            handleGrade(item.url, true);
                          }}
                          className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title="Re-run fresh real-time evaluation"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* State 2: Full-Page Visual Audit Studio with Screenshot Tagging */}
        {report && (
          <div className="space-y-8">
            {/* Supabase Record Status, URL History & Export Bar */}
            <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-200">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  {cacheMeta?.cached
                    ? `Loaded from Supabase Cache${cacheMeta.recordId ? ` (#${cacheMeta.recordId})` : ""}`
                    : `Saved to Supabase History${cacheMeta?.recordId ? ` (#${cacheMeta.recordId})` : ""}`}
                </span>
                {cacheMeta?.cachedAt && (
                  <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    Recorded {new Date(cacheMeta.cachedAt).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGrade(report.url, true)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white transition-colors"
                  title="Force a fresh live crawl & evaluation and save a new history snapshot"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-400" />
                  Re-run Live Audit
                </button>

                <button
                  type="button"
                  onClick={exportReportMarkdown}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-200 hover:text-white transition-colors"
                >
                  <FileText className="w-3 h-3 text-emerald-400" />
                  Export .MD
                </button>

                <button
                  type="button"
                  onClick={exportRecommendationsCsv}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-200 hover:text-white transition-colors"
                >
                  <Download className="w-3 h-3 text-amber-400" />
                  Export Fixes .CSV
                </button>
              </div>
            </div>

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

                {/* Right: Prominent Overall Score Circular Hero Pod + Algorithm Tooltip Popover */}
                <div className="relative flex flex-wrap sm:flex-nowrap items-center gap-5 p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 shadow-inner shrink-0">
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
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                        Overall Conversion Score
                      </span>

                      {/* Overall Algorithm & Formula Tooltip Popover Trigger */}
                      <div
                        className="relative"
                        onMouseEnter={() => setOpenAlgoId("overall_hero")}
                        onMouseLeave={() => setOpenAlgoId((prev) => (prev === "overall_hero" ? null : prev))}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenAlgoId((prev) => (prev === "overall_hero" ? null : "overall_hero"))
                          }
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-[10px] font-mono text-zinc-300 hover:text-white transition-colors"
                        >
                          <Calculator className="w-3 h-3 text-zinc-400" />
                          Algo & Formula
                        </button>

                        {openAlgoId === "overall_hero" && (
                          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 p-4 rounded-xl bg-zinc-950 border border-zinc-700 shadow-2xl z-50 text-left space-y-3">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                                Rubric v3 Master Scoring Algorithm
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400">100 Pts Max</span>
                            </div>

                            <div className="space-y-1">
                              <div className="text-[10px] font-mono uppercase text-zinc-500">Exact Mathematical Formula</div>
                              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-emerald-300 leading-relaxed">
                                Total = round(Persuasion + min(Execution, GateCap) + Experience)
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-[10px] font-mono uppercase text-zinc-500">Live Score Substitution</div>
                              <div className="p-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80 font-mono text-[11px] text-zinc-200 space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-zinc-400">A. Conversion Persuasion:</span>
                                  <span>{report.dimensions.persuasion.score} / 50 pts</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-400">B. Conversion Execution:</span>
                                  <span>
                                    {report.dimensions.execution.score} / 35 pts
                                    {report.dimensions.execution.gateApplied ? " (Gated)" : ""}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-400">C. Supporting Experience:</span>
                                  <span>{report.dimensions.experience.score} / 15 pts</span>
                                </div>
                                <div className="border-t border-zinc-800 pt-1 flex justify-between font-bold text-white">
                                  <span>Final Computed Score:</span>
                                  <span>
                                    round({report.dimensions.persuasion.score} + {report.dimensions.execution.score} +{" "}
                                    {report.dimensions.experience.score}) = {report.totalScore} / 100
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1 text-[11px] text-zinc-400 leading-relaxed">
                              <div className="text-[10px] font-mono uppercase text-zinc-500">Conversion-Readiness Gates & Grades</div>
                              <p>
                                • <strong className="text-zinc-200">Missing CTA Gate:</strong> Caps Execution at 20% (7.0/35 pts).
                              </p>
                              <p>
                                • <strong className="text-zinc-200">Missing Lead Capture Gate:</strong> Caps Execution at 30% (10.5/35 pts).
                              </p>
                              <p className="text-[10px] font-mono text-zinc-500 pt-1">
                                Grades: A (≥85) • B (70–84) • C (55–69) • D (40–54) • F (&lt;40)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
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

              {/* Minimal, Monochromatic Editorial Context Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/80 rounded-xl border border-zinc-800/80 bg-zinc-950/50 text-xs">
                {/* 1. Target Audience */}
                <div className="p-3.5 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Target Audience (ICP)
                  </div>
                  <div className="text-xs font-semibold text-zinc-100 truncate">
                    {report.targetAudience.roles.length > 0
                      ? report.targetAudience.roles.slice(0, 2).join(" • ")
                      : "Enterprise B2B Buyers"}
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate">
                    {report.targetAudience.segments[0] || "B2B Decision Makers"}
                  </div>
                </div>

                {/* 2. Primary Conversion Action */}
                <div className="p-3.5 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Primary Conversion Action
                  </div>
                  <div className="text-xs font-semibold text-zinc-100 font-mono truncate">
                    {report.signalsPreview.primaryCtaText
                      ? `"${report.signalsPreview.primaryCtaText}"`
                      : "No Primary CTA"}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {report.signalsPreview.hasAboveTheFoldCta
                      ? "Positioned above the fold"
                      : "Below-the-fold placement"}
                  </div>
                </div>

                {/* 3. Visitor Journey Intent */}
                <div className="p-3.5 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Visitor Journey Intent
                  </div>
                  <div className="text-xs font-semibold text-zinc-100 capitalize">
                    {report.visitorIntent}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {report.visitorIntent.toLowerCase().includes("discovery")
                      ? "Evaluating capability fit & proof"
                      : "Direct acquisition intent"}
                  </div>
                </div>

                {/* 4. Lead Capture Funnel */}
                <div className="p-3.5 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Lead Funnel Engine
                  </div>
                  <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        report.signalsPreview.leadCaptureEngine ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    />
                    <span className="truncate">
                      {report.signalsPreview.leadCaptureEngine
                        ? "Verified Form / Modal"
                        : "External Redirect / Script"}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {report.signalsPreview.leadCaptureEngine
                      ? "Direct on-page capture active"
                      : "Unverified inline form"}
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

            {/* Section 4: Score Breakdown (Strictly Aligned Grid across Category Headers & Criterion Rows + Algorithm Tooltip Popovers) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
              <div className="p-4 border-b border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Score Breakdown</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {report.criteria.length} checks across 3 dimensions. Hover or click <span className="text-zinc-300 font-mono">Algo &amp; Why</span> for the complete mathematical formula and reasoning.
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
                  const dimAlgoKey = `dim_${dim}`;
                  const rawSum = Math.round(rows.reduce((acc, c) => acc + c.earnedPoints, 0) * 10) / 10;
                  const barColor =
                    pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
                  const ringColorDim =
                    pct >= 75 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-rose-500";

                  return (
                    <div key={dim}>
                      {/* Dimension Category Header — Uses EXACT same 7-col grid as Criterion Rows for pixel-perfect vertical alignment */}
                      <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800/80 grid grid-cols-[20px_minmax(0,1fr)_auto] sm:grid-cols-[20px_minmax(0,1fr)_145px_100px_48px_140px_20px] items-center gap-3">
                        {/* Col 1: Category Indicator */}
                        <div className="flex items-center justify-center">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              pct >= 75 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-rose-400"
                            }`}
                          />
                        </div>

                        {/* Col 2: Category Title & Gate Status */}
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-100 truncate">
                            {dimSummary.name || dim}
                          </span>
                          {dimSummary.gateApplied && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800/60 font-mono">
                              Capped by gate
                            </span>
                          )}
                        </div>

                        {/* Col 3: Category Weight & Check Count */}
                        <span className="hidden sm:inline-flex items-center text-[11px] font-mono text-zinc-500">
                          {dimSummary.maxScore} pts • {rows.length} checks
                        </span>

                        {/* Col 4: Category Algorithm Tooltip Popover */}
                        <div
                          className="hidden sm:flex justify-end relative"
                          onMouseEnter={() => setOpenAlgoId(dimAlgoKey)}
                          onMouseLeave={() => setOpenAlgoId((prev) => (prev === dimAlgoKey ? null : prev))}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenAlgoId((prev) => (prev === dimAlgoKey ? null : dimAlgoKey))
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] font-mono text-zinc-300 hover:text-white transition-colors"
                          >
                            <Calculator className="w-3 h-3 text-zinc-400" />
                            Category Algo
                          </button>

                          {openAlgoId === dimAlgoKey && (
                            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 p-4 rounded-xl bg-zinc-950 border border-zinc-700 shadow-2xl z-50 text-left space-y-2.5">
                              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                <span className="text-xs font-semibold text-white">
                                  {dimSummary.name} Algorithm
                                </span>
                                <span className="text-[10px] font-mono text-emerald-400">
                                  {dimSummary.score} / {dimSummary.maxScore} pts ({pct}%)
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] font-mono uppercase text-zinc-500">Category Formula</div>
                                <div className="p-2 rounded bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-200">
                                  {dim === "execution"
                                    ? "Score = min(Σ CriterionPoints, GateCap)"
                                    : "Score = round(Σ CriterionPoints, 1)"}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] font-mono uppercase text-zinc-500">Step-by-Step Sum</div>
                                <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 space-y-1">
                                  {rows.map((r) => (
                                    <div key={r.id} className="flex justify-between gap-2">
                                      <span className="text-zinc-400 truncate">{r.name}:</span>
                                      <span className="shrink-0">
                                        {r.earnedPoints} / {r.maxPoints}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="border-t border-zinc-800 pt-1 flex justify-between font-bold text-white">
                                    <span>Category Total:</span>
                                    <span>
                                      {rows.map((r) => r.earnedPoints).join(" + ")} = {rawSum}
                                      {dimSummary.gateApplied ? ` → Capped at ${dimSummary.score}` : ""}{" "}
                                      / {dimSummary.maxScore} pts
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Col 5: Category Circular ScoreRing (Aligned with Row ScoreRings) */}
                        <div className="hidden sm:flex items-center justify-center">
                          <ScoreRing
                            value={dimSummary.score}
                            max={dimSummary.maxScore}
                            size={38}
                            strokeWidth={4}
                            colorClass={ringColorDim}
                            label={`${pct}%`}
                          />
                        </div>

                        {/* Col 6: Larger & Wider Category Overall Score + Full-Width Length Bar */}
                        <div className="flex flex-col items-end justify-center gap-1 min-w-[125px] sm:w-[140px]">
                          <div className="text-sm sm:text-base font-bold font-mono text-white tabular-nums whitespace-nowrap leading-none">
                            {dimSummary.score}
                            <span className="text-xs font-normal text-zinc-400"> / {dimSummary.maxScore} pts</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor} rounded-full transition-all duration-500`}
                              style={{ width: `${Math.min(Math.max(pct, 4), 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Col 7: Spacer matching Row Chevron column */}
                        <span className="hidden sm:block w-4 h-4" />
                      </div>

                      <div className="divide-y divide-zinc-800/60">
                        {rows.map((criterion) => {
                          const isExpanded = !!expandedCriteria[criterion.id];
                          const method =
                            METHOD_META[criterion.source as keyof typeof METHOD_META] ?? METHOD_META.dom_extraction;
                          const MethodIcon = method.icon;
                          const ratio =
                            criterion.maxPoints > 0 ? criterion.earnedPoints / criterion.maxPoints : 0;
                          const ringColor =
                            criterion.status === "passed"
                              ? "text-emerald-500"
                              : criterion.status === "partial"
                              ? "text-amber-500"
                              : "text-rose-500";
                          const StatusIcon =
                            criterion.status === "passed"
                              ? CheckCircle2
                              : criterion.status === "partial"
                              ? AlertCircle
                              : XCircle;
                          const statusColor =
                            criterion.status === "passed"
                              ? "text-emerald-400"
                              : criterion.status === "partial"
                              ? "text-amber-400"
                              : "text-rose-400";
                          const rawSummary = criterion.notes || criterion.scoringRule;
                          const summary = rawSummary.replace(
                            /^AI scored \d+(\.\d+)?\/10\.?\s*(\([^)]*\)\.?\s*)?(Specificity:\s*\w+\.?\s*)?(Friction:\s*\w+\.?\s*)?/i,
                            ""
                          );
                          const algo = getCriterionAlgorithm(criterion);
                          const isAlgoOpen = openAlgoId === criterion.id;

                          return (
                            <div key={criterion.id} className="relative">
                              {/* Criterion Row — Uses EXACT same 7-col grid as Category Header */}
                              <div
                                onClick={() => toggleCriterion(criterion.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    toggleCriterion(criterion.id);
                                  }
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-zinc-900/50 transition-colors cursor-pointer grid grid-cols-[20px_minmax(0,1fr)_auto] sm:grid-cols-[20px_minmax(0,1fr)_145px_100px_48px_140px_20px] items-center gap-3"
                              >
                                {/* Col 1: Status Icon */}
                                <div className="flex items-center justify-center">
                                  <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                                </div>

                                {/* Col 2: Criterion Name & Summary */}
                                <div className="min-w-0">
                                  <div className="text-[13px] font-medium text-white truncate">
                                    {criterion.name}
                                  </div>
                                  <div className="text-[11px] text-zinc-500 truncate">{summary}</div>
                                </div>

                                {/* Col 3: Measurement Source */}
                                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-zinc-400 truncate">
                                  <MethodIcon className={`w-3.5 h-3.5 shrink-0 ${method.color}`} />
                                  <span className="truncate">{method.label}</span>
                                </span>

                                {/* Col 4: Interactive Reasoning & Complete Algorithm Tooltip Popover */}
                                <div
                                  className="hidden sm:flex justify-end relative"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseEnter={() => setOpenAlgoId(criterion.id)}
                                  onMouseLeave={() =>
                                    setOpenAlgoId((prev) => (prev === criterion.id ? null : prev))
                                  }
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenAlgoId((prev) =>
                                        prev === criterion.id ? null : criterion.id
                                      );
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-[10px] font-mono text-zinc-300 hover:text-white transition-colors"
                                  >
                                    <Info className="w-3 h-3 text-zinc-400" />
                                    Algo &amp; Why
                                  </button>

                                  {isAlgoOpen && (
                                    <div className="absolute right-0 bottom-full mb-2 w-80 sm:w-[400px] p-4 rounded-xl bg-zinc-950 border border-zinc-700 shadow-2xl z-50 text-left space-y-3 cursor-default">
                                      <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2">
                                        <div>
                                          <div className="text-xs font-semibold text-white">
                                            {criterion.name}
                                          </div>
                                          <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5 mt-0.5">
                                            <MethodIcon className={`w-3 h-3 ${method.color}`} />
                                            {method.label}
                                          </div>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-white bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded whitespace-nowrap">
                                          {criterion.earnedPoints} / {criterion.maxPoints} pts
                                        </span>
                                      </div>

                                      {/* 1. Complete Scoring Algorithm Formula */}
                                      <div className="space-y-1">
                                        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                                          1. Scoring Algorithm &amp; Formula
                                        </div>
                                        <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-emerald-300 break-words">
                                          {algo.formula}
                                        </div>
                                        <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 font-mono text-[11px] text-zinc-200 break-words">
                                          {algo.calculation}
                                        </div>
                                      </div>

                                      {/* 2. Reasoning Behind Score */}
                                      <div className="space-y-1">
                                        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                                          2. Reasoning Behind Score
                                        </div>
                                        <p className="text-[11px] text-zinc-300 leading-relaxed bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/60">
                                          {algo.reasoning}
                                        </p>
                                      </div>

                                      {/* 3. Sub-Check Inputs (if any) */}
                                      {criterion.checks && criterion.checks.length > 0 && (
                                        <div className="space-y-1">
                                          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                                            3. Evaluated Signals
                                          </div>
                                          <ul className="space-y-1 bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/60">
                                            {criterion.checks.map((chk, i) => (
                                              <li
                                                key={i}
                                                className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-mono"
                                              >
                                                {chk.passed ? (
                                                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                                ) : (
                                                  <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                                                )}
                                                <span>{chk.label}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* 4. Rubric Threshold Tiers */}
                                      <div className="space-y-1">
                                        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                                          Rubric Point Tiers
                                        </div>
                                        <ul className="space-y-1 text-[10px] text-zinc-400 font-mono">
                                          {algo.tiers.map((t, idx) => (
                                            <li key={idx} className="leading-snug">
                                              • {t}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Col 5: Circular ScoreRing (Aligned with Category Header ScoreRing) */}
                                <div className="hidden sm:flex items-center justify-center">
                                  <ScoreRing
                                    value={criterion.earnedPoints}
                                    max={criterion.maxPoints}
                                    size={30}
                                    strokeWidth={3}
                                    colorClass={ringColor}
                                    label={`${Math.round(ratio * 100)}%`}
                                  />
                                </div>

                                {/* Col 6: Criterion Score (Aligned with Category Header Score) */}
                                <div className="flex items-center justify-end sm:w-[140px]">
                                  <span className="text-xs font-mono font-semibold tabular-nums text-white whitespace-nowrap text-right">
                                    {criterion.earnedPoints}
                                    <span className="text-zinc-500 font-normal"> / {criterion.maxPoints} pts</span>
                                  </span>
                                </div>

                                {/* Col 7: Expand Chevron */}
                                <div className="hidden sm:flex items-center justify-end">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-zinc-500" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-zinc-500" />
                                  )}
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="px-4 pb-4 pl-[52px] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-zinc-950/30 border-t border-zinc-800/40 pt-3">
                                  <div className="space-y-1.5">
                                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                                      Found on page
                                    </div>
                                    <blockquote className="p-2.5 rounded-lg bg-zinc-950 border-l-2 border-zinc-700 text-zinc-300 text-[11px] leading-relaxed break-words">
                                      {criterion.evidence || "No direct evidence extracted."}
                                    </blockquote>
                                  </div>

                                  <div className="space-y-1.5">
                                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                                      Reasoning &amp; Signal Checks
                                    </div>
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
                                    <p className="text-[11px] text-zinc-400 leading-relaxed">{algo.reasoning}</p>
                                  </div>

                                  <div className="space-y-1.5">
                                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                                      Complete Scoring Algorithm
                                    </div>
                                    <div className="text-[11px] font-mono text-emerald-300 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 break-words">
                                      {algo.formula}
                                    </div>
                                    <div className="text-[11px] font-mono text-zinc-300 bg-zinc-950/70 border border-zinc-800/80 rounded px-2.5 py-1.5 break-words">
                                      {algo.calculation}
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
