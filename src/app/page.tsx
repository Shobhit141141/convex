"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
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

// Website Logo / Favicon with fallback (circular, borderless)
function SiteLogo({
  url,
  size = 24,
  className = ""
}: {
  url: string;
  size?: number;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  let domain = "";
  try {
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    domain = new URL(withProto).hostname.replace(/^www\./, "");
  } catch {
    domain = url || "";
  }

  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : "";

  const fontSizeClass =
    size >= 36 ? "text-sm font-bold" : size >= 24 ? "text-[11px] font-semibold" : "text-[9px] font-bold";

  if (!domain || hasError) {
    const initial = domain ? domain.charAt(0).toUpperCase() : "W";
    return (
      <div
        className={`rounded-full bg-zinc-800 flex items-center justify-center shrink-0 ${fontSizeClass} text-zinc-200 font-mono select-none shadow-sm ${className}`}
        style={{ width: size, height: size }}
        title={domain}
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-zinc-900/60 flex items-center justify-center shrink-0 shadow-sm ${className}`}
      style={{ width: size, height: size }}
      title={domain}
    >
      <img
        src={faviconUrl}
        alt={`${domain} logo`}
        width={size}
        height={size}
        className="w-full h-full object-contain rounded-full"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
}

// Reusable plain-English tooltip popover for every item across the website
function SimpleHelpTooltip({
  title,
  plainEnglish,
  example,
  align = "left",
  badgeText
}: {
  title: string;
  plainEnglish: string;
  example?: string;
  align?: "left" | "right";
  badgeText?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-200 transition-colors focus:outline-none"
        aria-label={`Explain ${title}`}
      >
        <Info className="w-3.5 h-3.5 shrink-0" />
        {badgeText && <span className="text-[10px] font-mono underline decoration-zinc-700">{badgeText}</span>}
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } bottom-full mb-2 w-72 sm:w-80 p-3.5 rounded-xl bg-zinc-950 border border-zinc-700 shadow-2xl z-50 text-left space-y-2 pointer-events-auto`}
        >
          <div className="text-xs font-semibold text-white border-b border-zinc-800 pb-1.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{title}</span>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              In Simple Words
            </div>
            <p className="text-[11px] text-zinc-200 leading-relaxed font-normal">
              {plainEnglish}
            </p>
          </div>
          {example && (
            <div className="p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] text-emerald-300/90 leading-relaxed font-normal">
              <strong className="text-emerald-400">Example: </strong>
              {example}
            </div>
          )}
        </div>
      )}
    </span>
  );
}

// How each criterion is measured (shown in Score Breakdown)
const METHOD_META = {
  ai_semantic: {
    label: "AI copy review",
    icon: Sparkles,
    color: "text-violet-400",
    explain:
      "Reads your page text like a real buyer to check if the problem, promise, and proof are clear and specific."
  },
  browser_playwright: {
    label: "Live browser test",
    icon: Crosshair,
    color: "text-sky-400",
    explain:
      "Opens your page in a real browser, clicks the main button, and verifies that a working sign-up or demo form appears."
  },
  dom_extraction: {
    label: "Page structure check",
    icon: Layers,
    color: "text-zinc-300",
    explain:
      "Scans your page HTML to verify headings, button placement, form fields, and mobile screen settings."
  },
  pagespeed: {
    label: "Lighthouse",
    icon: Activity,
    color: "text-emerald-400",
    explain:
      "Measures how fast your page loads and whether elements jump around on mobile and desktop."
  }
} as const;

// Complete algorithm & mathematical formula lookup for every Rubric v3 criterion
function getCriterionAlgorithm(criterion: V3CriterionScore): {
  simpleMeaning: string;
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
        simpleMeaning:
          "Does the top of the page clearly call out the exact headache your visitor is trying to solve?",
        formula: "Earned = min(10, round((SemanticRating / 10) × 10, 1))",
        calculation: `Rating ${rawRating}/10 → (${rawRating} / 10) × 10 = ${earned} / 10 pts`,
        tiers: [
          "Passed (≥ 8.0 pts): Clearly names a specific buyer problem in the main headline",
          "Partial (4.0 – 7.9 pts): Mentions a broad problem without specific details",
          "Failed (< 4.0 pts): Doesn't mention what problem the product solves"
        ],
        reasoning
      };
    case "persuasion_value_prop":
      return {
        simpleMeaning:
          "Does the headline clearly state what result the buyer gets and how fast they get it (e.g., 'Cut HR tickets by 70% in 14 days')?",
        formula: "Earned = min(12, round((SemanticRating / 10) × 12, 1))",
        calculation: `Rating ${rawRating}/10 → round((${rawRating} / 10) × 12, 1) = ${earned} / 12 pts`,
        tiers: [
          "Passed (≥ 9.0 pts): Clear result + real numbers/percentage + how fast it works",
          "Partial (5.0 – 8.9 pts): Clear benefit, but missing exact numbers or timeframe",
          "Failed (< 5.0 pts): Vague slogan that doesn't explain what the product achieves"
        ],
        reasoning
      };
    case "persuasion_credibility":
      return {
        simpleMeaning:
          "Does the page prove its claims with real customer names, quotes, and numbers instead of just showing company logos?",
        formula: "Earned = min(10, round((CredibilityRating / 10) × 10, 1))",
        calculation: `Rating ${rawRating}/10 → (${rawRating} / 10) × 10 = ${earned} / 10 pts`,
        tiers: [
          "Passed (≥ 8.0 pts): Named customer stories with real results + trust badges",
          "Partial (4.0 – 7.9 pts): Only shows customer logos or unverified claims",
          "Failed (< 4.0 pts): No customer proof, reviews, or case studies shown"
        ],
        reasoning
      };
    case "persuasion_audience_alignment":
      return {
        simpleMeaning:
          "Does the page use the everyday words and examples that your target buyer (e.g., an HR Director or IT Leader) actually cares about?",
        formula: "Earned = min(10, round((AlignmentRating / 10) × 10, 1))",
        calculation: `Rating ${rawRating}/10 → (${rawRating} / 10) × 10 = ${earned} / 10 pts`,
        tiers: [
          "Passed (≥ 8.0 pts): Speaks directly to the target job role's daily workflows",
          "Partial (4.0 – 7.9 pts): Generic business language that could apply to anyone",
          "Failed (< 4.0 pts): Confusing or mismatched audience language"
        ],
        reasoning
      };
    case "persuasion_offer_attractiveness":
      return {
        simpleMeaning:
          "Is the main button offer appealing and low-stress for the visitor to click right now?",
        formula: "Earned = min(8, round((OfferRating / 10) × 8, 1))",
        calculation: `Rating ${rawRating}/10 → round((${rawRating} / 10) × 8, 1) = ${earned} / 8 pts`,
        tiers: [
          "Passed (≥ 6.0 pts): Compelling, low-friction offer that matches the visitor's goal",
          "Partial (3.0 – 5.9 pts): High-commitment ask ('Book a sales call') with no preview",
          "Failed (< 3.0 pts): Unclear or unappealing button offer"
        ],
        reasoning
      };
    case "exec_cta_effectiveness":
      return {
        simpleMeaning:
          "Can visitors see the main action button immediately without scrolling, and does it tell them what happens next?",
        formula: "Earned = AboveFold(+5) + ActionOrientedVerb(+3) + NextStepMicrocopy(+2)",
        calculation: `${criterion.checks?.map((c) => `${c.label.split(" (")[0]}: ${c.passed ? c.label.match(/\+\d+/)?.[0] || "+pts" : "+0"}`).join(" + ") || criterion.scoringRule} = ${earned} / 10 pts`,
        tiers: [
          "+5 pts: Main button is visible at the top of the page without scrolling",
          "+3 pts: Button starts with a clear action word (Book, Start, Try, Get)",
          "+2 pts: Short note near the button explains what happens after clicking"
        ],
        reasoning
      };
    case "exec_promise_destination":
      return {
        simpleMeaning:
          "When a visitor clicks the main button, does it actually give them what the button promised?",
        formula: "Earned = PageType & Intent Consistency Rule (0, 3, 4, or 7–8 pts)",
        calculation: `${criterion.scoringRule} → ${earned} / 8 pts`,
        tiers: [
          "7–8 pts (Passed): Button destination matches what the button text promised",
          "3–4 pts (Partial): Button promises 'Watch video' but forces a sales call form first",
          "0 pts (Failed): No working button found on the page"
        ],
        reasoning
      };
    case "exec_lead_capture_usability":
      return {
        simpleMeaning:
          "When someone clicks the main button, does a real, working form pop up where they can type their details?",
        formula: "Earned = InteractiveFormVerified(10) | StaticDOMForm(8) | ScriptOnly(3.5–4) | Missing(0)",
        calculation: `${criterion.scoringRule} → ${earned} / 10 pts`,
        tiers: [
          "10 pts (Passed): Live browser clicked the button and verified a working form opened",
          "8 pts (Passed): Working form fields are directly embedded on the page",
          "3.5–4 pts (Partial): External form script detected, but couldn't verify it opens",
          "0 pts (Failed): No sign-up or lead form found"
        ],
        reasoning
      };
    case "exec_friction_load":
      return {
        simpleMeaning:
          "Is the sign-up or demo form short enough that people won't give up halfway through?",
        formula: "Earned = FieldCount ≤ 4 ? 7 : FieldCount ≤ 7 ? 4.5 : 2 (0 if no CTA)",
        calculation: `${criterion.evidence} → ${earned} / 7 pts`,
        tiers: [
          "7.0 pts (Passed): Easy & fast (4 or fewer boxes to fill out)",
          "4.5 pts (Partial): Medium effort (5 to 7 boxes to fill out)",
          "2.0 pts (Partial): Too long (more than 7 boxes causes visitors to quit)"
        ],
        reasoning
      };
    case "exp_lcp_speed":
      return {
        simpleMeaning:
          "How many seconds does a visitor wait before the main headline and image show up?",
        formula: "Earned = LCP ≤ 2.5s ? 5 : LCP ≤ 4.0s ? 2.5 : 0",
        calculation: `${criterion.evidence} → ${earned} / 5 pts`,
        tiers: [
          "5.0 pts (Good): Loads in 2.5 seconds or less",
          "2.5 pts (Needs Work): Takes between 2.5 and 4.0 seconds",
          "0.0 pts (Slow): Takes longer than 4.0 seconds (visitors may leave)"
        ],
        reasoning
      };
    case "exp_cls_stability":
      return {
        simpleMeaning:
          "Do buttons or text jump around unexpectedly while the page is still loading?",
        formula: "Earned = CLS ≤ 0.10 ? 4 : CLS ≤ 0.25 ? 2 : 0",
        calculation: `${criterion.evidence} → ${earned} / 4 pts`,
        tiers: [
          "4.0 pts (Good): Page stays still while loading (CLS ≤ 0.10)",
          "2.0 pts (Needs Work): Slight shifting while images load (0.10 – 0.25)",
          "0.0 pts (Poor): Elements jump around noticeably (> 0.25)"
        ],
        reasoning
      };
    case "exp_mobile_viewport":
      return {
        simpleMeaning:
          "Is the page properly set up to resize and fit cleanly on phone screens?",
        formula: "Earned = hasViewportMeta ? 3 : 0",
        calculation: `${criterion.evidence} → ${earned} / 3 pts`,
        tiers: [
          "3.0 pts (Passed): Mobile screen scaling tag is properly configured",
          "0.0 pts (Failed): Page is not configured for mobile phones"
        ],
        reasoning
      };
    case "exp_text_readability":
    default:
      return {
        simpleMeaning:
          "Does the page have a clear main title (H1) and enough readable text to explain the product?",
        formula: "Earned = (hasClearH1 && wordCount ≥ 100) ? 3 : hasClearH1 ? 1.5 : 0",
        calculation: `${criterion.evidence} → ${earned} / ${max} pts`,
        tiers: [
          "3.0 pts (Passed): Clear main headline + at least 100 words of helpful copy",
          "1.5 pts (Partial): Has a main headline, but very little text (< 100 words)",
          "0.0 pts (Failed): Missing a main headline"
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
  const [issueFilter, setIssueFilter] = useState<"all" | "high" | "persuasion" | "execution" | "strength">("all");
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
  const [loadingHistory, setLoadingHistory] = useState(true);
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
      const res = await fetch(`/api/history?limit=40&_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
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
      if (data.report.recommendations?.length || data.report.screenshotTags?.length) {
        setSelectedTagId("audit_pin_1");
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

  const handleGrade = async (targetUrl: string = url, forceRefresh = true) => {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl) return;

    setUrl(cleanUrl);
    setLoading(true);
    setError(null);
    setSelectedTagId(null);
    setProgress(4);
    setProgressEvents([]);
    setShowHistoryModal(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

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
      if (finalReport.recommendations?.length || finalReport.screenshotTags?.length) {
        setSelectedTagId("audit_pin_1");
      }

      // Optimistically prepend newly audited item into historyItems
      if (finalReport) {
        setHistoryItems((prev) => {
          const newItem: AuditHistoryItem = {
            id: recId || Date.now(),
            url: finalReport.url,
            normalized_url: finalReport.url,
            page_type: finalReport.pageType,
            total_score: finalReport.totalScore,
            letter_grade: finalReport.letterGrade,
            persuasion_score: finalReport.dimensions.persuasion.score,
            execution_score: finalReport.dimensions.execution.score,
            experience_score: finalReport.dimensions.experience.score,
            summary: finalReport.summary,
            created_at: cachedTimestamp || finalReport.evaluatedAt || new Date().toISOString()
          };
          const rest = prev.filter(
            (p) => p.id !== newItem.id && p.url.trim().toLowerCase() !== newItem.url.trim().toLowerCase()
          );
          return [newItem, ...rest];
        });
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

  // Build a strictly 1-to-1 unified list of visual annotations (Fixes + Verified Strengths)
  // sorted top-to-bottom by yPercent so Pin #1..#N on the left screenshot ALWAYS matches Card #1..#N on the right.
  const unifiedAnnotations = React.useMemo(() => {
    if (!report) return [];
    const recs = report.recommendations || [];
    const rawTags = report.screenshotTags || [];

    const draftItems: Array<{
      rawId: string;
      kind: "fix" | "strength";
      priority: "high" | "medium" | "strength";
      dimension: "persuasion" | "execution" | "experience";
      type: "issue" | "warning" | "strength";
      label: string;
      locationLabel: string;
      title: string;
      problem: string;
      directFix: string;
      expectedImpact: string;
      xPercent: number;
      yPercent: number;
    }> = [];

    // 1. Include all Actionable CRO Fixes from report.recommendations
    recs.forEach((rec, idx) => {
      const matchedTag = rawTags.find((t) => t.recommendationId === rec.id);
      const sectionLabels: Record<string, string> = {
        hero: "Hero Value Hook",
        cta: "Conversion Trigger",
        social_proof: "Customer Proof",
        features: "Product Workflow",
        footer: "Deep Funnel CTA"
      };
      draftItems.push({
        rawId: rec.id,
        kind: "fix",
        priority: rec.priority === "high" ? "high" : "medium",
        dimension: rec.dimension,
        type: rec.priority === "high" ? "issue" : "warning",
        label: matchedTag?.label || sectionLabels[rec.section] || "CRO Fix",
        locationLabel: rec.locationLabel,
        title: rec.title,
        problem: rec.problem,
        directFix: rec.directFix,
        expectedImpact: rec.expectedImpact,
        xPercent: matchedTag?.xPercent ?? rec.coordinates?.xPercent ?? 50,
        yPercent: matchedTag?.yPercent ?? rec.coordinates?.yPercent ?? Math.min(12 + idx * 22, 88)
      });
    });

    // 2. Include unlinked Verified Strength pins from report.screenshotTags so every pin on canvas is in the right list
    rawTags
      .filter((t) => t.type === "strength" && !t.recommendationId)
      .slice(0, 2)
      .forEach((st) => {
        draftItems.push({
          rawId: st.id,
          kind: "strength",
          priority: "strength",
          dimension: st.category === "cta" ? "execution" : "persuasion",
          type: "strength",
          label: st.label || "Verified Strength",
          locationLabel: st.locationLabel || "Page Strength",
          title: st.title,
          problem: st.description || "Verified conversion strength detected on the live page.",
          directFix: st.directFix || "Keep this element prominent as visitors scroll.",
          expectedImpact: "Verified Strength • Supports buyer trust & conversion flow",
          xPercent: st.xPercent ?? 78,
          yPercent: st.yPercent ?? 4
        });
      });

    // Sort top-to-bottom by vertical position on the page so #1 is at the top and #N is at the bottom
    draftItems.sort((a, b) => a.yPercent - b.yPercent);

    // Prevent two pins from stacking on identical coordinates
    const placed: Array<{ x: number; y: number }> = [];
    return draftItems.map((item, idx) => {
      let x = item.xPercent;
      let y = item.yPercent;
      for (const p of placed) {
        if (Math.abs(p.y - y) < 4 && Math.abs(p.x - x) < 10) {
          y = Math.min(y + 5, 94);
          x = x > 55 ? Math.max(x - 16, 18) : Math.min(x + 16, 82);
        }
      }
      placed.push({ x, y });
      const pinNumber = idx + 1;
      return {
        ...item,
        id: `audit_pin_${pinNumber}`,
        pinNumber,
        xPercent: x,
        yPercent: y
      };
    });
  }, [report]);

  const filteredAnnotations = unifiedAnnotations.filter((item) => {
    if (issueFilter === "high") return item.priority === "high";
    if (issueFilter === "persuasion") return item.dimension === "persuasion";
    if (issueFilter === "execution") return item.dimension === "execution";
    if (issueFilter === "strength") return item.kind === "strength";
    return true;
  });

  const tags = filteredAnnotations;

  // Build crisp, non-technical "In a Nutshell" 10-second plain-English digest
  const plainDigest = React.useMemo(() => {
    if (!report) return null;

    const buyer =
      report.targetAudience.roles.length > 0
        ? report.targetAudience.roles.slice(0, 2).join(" & ")
        : "business buyers";
    const cta = report.signalsPreview.primaryCtaText
      ? `"${report.signalsPreview.primaryCtaText}"`
      : "a main action button";

    const workingWell: string[] = [];
    const hurtingSales: string[] = [];

    // Check key signals in simple everyday language
    const cProblem = report.criteria.find((c) => c.id === "persuasion_problem_fit");
    const cValue = report.criteria.find((c) => c.id === "persuasion_value_prop");
    const cProof = report.criteria.find((c) => c.id === "persuasion_credibility");
    const cAlign = report.criteria.find((c) => c.id === "persuasion_audience_align");
    const cCta = report.criteria.find((c) => c.id === "exec_cta_prominence");
    const cForm = report.criteria.find((c) => c.id === "exec_lead_capture");
    const cFriction = report.criteria.find((c) => c.id === "exec_funnel_friction");

    if (cProblem?.status === "passed" || cAlign?.status === "passed") {
      workingWell.push(`Speaks clearly to ${buyer} about their real day-to-day problems.`);
    } else {
      hurtingSales.push(`Headline copy feels generic instead of naming a specific problem for ${buyer}.`);
    }

    if (cValue?.status === "passed") {
      workingWell.push("Headline promises a clear, measurable result and shows how fast visitors get value.");
    } else {
      hurtingSales.push("Headline doesn't state how fast visitors get results or what exact outcome to expect.");
    }

    if (report.signalsPreview.hasAboveTheFoldCta && cCta?.status === "passed") {
      workingWell.push(`Main button (${cta}) is easy to spot right at the top of the page.`);
    } else {
      hurtingSales.push(`Main button (${cta}) is either hard to spot at the top or doesn't say what happens next.`);
    }

    if (cProof?.status === "passed") {
      workingWell.push("Backs up claims with real customer proof and measurable results.");
    } else {
      hurtingSales.push("Shows company logos without real customer quotes or before/after numbers to prove ROI.");
    }

    if (report.signalsPreview.leadCaptureEngine && cForm?.status === "passed") {
      workingWell.push("Clicking the main button opens a working sign-up form right on the page.");
    } else {
      hurtingSales.push("No quick sign-up form opens on the page when clicking the main button.");
    }

    if (cFriction && cFriction.status !== "passed") {
      hurtingSales.push("Sign-up form asks for too many details upfront, causing people to abandon it.");
    } else if (cFriction?.status === "passed") {
      workingWell.push("Sign-up step is short and easy to finish.");
    }

    if (lighthouse.lcpSeconds <= 2.5 && lighthouse.cls <= 0.1) {
      workingWell.push(`Loads quickly (${lighthouse.lcpSeconds}s) and stays steady on mobile phones.`);
    } else if (lighthouse.lcpSeconds > 2.5) {
      hurtingSales.push(`Page takes ${lighthouse.lcpSeconds}s to load main content (visitors leave after ~2.5s).`);
    }

    // Ensure at least 3 crisp items in each list
    if (workingWell.length === 0) {
      workingWell.push(`Page is live and targeted at ${buyer}.`);
    }
    if (hurtingSales.length === 0) {
      hurtingSales.push("Minor copy polish on the hero button and proof section can lift conversions further.");
    }

    // Crisp 1-line quick wins linked directly to the 1-to-1 visual pins
    const fixPins = unifiedAnnotations.filter((a) => a.kind === "fix").slice(0, 3);
    const quickWins = fixPins.map((fp) => ({
      pinNumber: fp.pinNumber,
      pinId: fp.id,
      yPercent: fp.yPercent,
      shortAction: fp.directFix,
      lift: fp.expectedImpact
    }));

    // Build a 1-2 sentence Plain-English Verdict
    const topIssue =
      hurtingSales[0]?.replace(/\.$/, "").toLowerCase() ||
      "some visitors may hesitate before clicking the main button";
    const verdict =
      report.totalScore >= 80
        ? `This page is in great shape (${report.totalScore}/100) — it speaks clearly to ${buyer}, loads fast, and makes it easy to click ${cta}. To push conversions even higher, focus on fixing the small friction points below.`
        : report.totalScore >= 65
        ? `This page has a solid foundation (${report.totalScore}/100) and clearly targets ${buyer}, but you are likely losing sign-ups because ${topIssue}. Fixing the 3 quick wins below is the fastest way to get more leads.`
        : `This page is currently losing potential buyers (${report.totalScore}/100) because ${topIssue}. Prioritize the 3 quick wins below to make the offer clearer and easier to act on.`;

    return {
      verdict,
      workingWell: workingWell.slice(0, 3),
      hurtingSales: hurtingSales.slice(0, 3),
      quickWins
    };
  }, [report, lighthouse, unifiedAnnotations]);

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
            {/* Interactive Algorithm & Pipeline Guide Route */}
            <Link
              href="/algorithm"
              className="text-xs text-emerald-300 hover:text-white flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-md bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>Algorithm &amp; Pipeline</span>
            </Link>

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
                {loadingHistory ? "..." : historyItems.length}
              </span>
            </button>

            {report && (
              <>
                <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
                  <SiteLogo url={report.url} size={18} />
                  <span className="truncate max-w-[140px]">
                    {(() => {
                      try {
                        return new URL(report.url.startsWith("http") ? report.url : `https://${report.url}`).hostname.replace(/^www\./, "");
                      } catch {
                        return report.url;
                      }
                    })()}
                  </span>
                </div>

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
                <div className="p-3 space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40 flex items-center justify-between gap-3 animate-pulse"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3.5 w-44 bg-zinc-800 rounded" />
                          <div className="h-2.5 w-56 bg-zinc-800/60 rounded" />
                        </div>
                      </div>
                      <div className="h-7 w-14 bg-zinc-800 rounded-md shrink-0" />
                    </div>
                  ))}
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
                          <SiteLogo url={item.url} size={22} />
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

              <div className="pt-2 flex justify-center">
                <Link
                  href="/algorithm"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-xs text-emerald-300 hover:text-white transition-all shadow-sm"
                >
                  <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Explore How Our Rubric v3 Algorithm &amp; 6-Stage Pipeline Works</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </form>

            {loading && (
              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 text-left space-y-4 shadow-2xl backdrop-blur-md max-w-xl mx-auto">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/80">
                  <SiteLogo url={url} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono font-semibold text-white truncate">
                      {url}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span>
                        {progressEvents.length > 0
                          ? progressEvents[progressEvents.length - 1].stageLabel
                          : "Connecting to Live Evaluation Pipeline..."}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-zinc-100 bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-md tabular-nums shrink-0">
                    {progress}%
                  </span>
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
            {!loading && (
              loadingHistory ? (
                <div className="pt-6 text-left space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                        Saved Website Audits
                        <span className="inline-block w-8 h-3.5 bg-zinc-800 rounded animate-pulse" />
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                        Loading from Supabase...
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/30 divide-y divide-zinc-800/70 overflow-hidden">
                    {[1, 2, 3, 4].map((idx) => (
                      <div
                        key={idx}
                        className="p-3 flex items-center justify-between gap-3 animate-pulse"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-full bg-zinc-800/90 shrink-0 border border-zinc-700/40" />
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3.5 bg-zinc-800 rounded"
                                style={{ width: idx % 2 === 0 ? "50%" : "38%" }}
                              />
                              <div className="h-3 w-14 bg-zinc-800/70 rounded" />
                            </div>
                            <div className="h-2.5 w-48 bg-zinc-800/40 rounded" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="h-6 w-12 bg-zinc-800/80 rounded-md" />
                          <div className="h-6 w-6 bg-zinc-800/60 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : historyItems.length > 0 ? (
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
                              <SiteLogo url={item.url} size={20} />
                              <span className="text-xs font-mono font-medium text-white truncate max-w-[220px] sm:max-w-sm">
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
              ) : null
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
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono transition-colors ${
                    loading
                      ? "bg-emerald-950/50 border-emerald-700/80 text-emerald-200 cursor-wait"
                      : "bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white"
                  }`}
                  title="Force a fresh live crawl & evaluation and save a new history snapshot"
                >
                  <RefreshCw className={`w-3 h-3 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
                  {loading ? `Re-running Live Audit (${progress}%)...` : "Re-run Live Audit"}
                </button>

                <button
                  type="button"
                  onClick={exportReportMarkdown}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-200 hover:text-white transition-colors disabled:opacity-50"
                >
                  <FileText className="w-3 h-3 text-emerald-400" />
                  Export .MD
                </button>

                <button
                  type="button"
                  onClick={exportRecommendationsCsv}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-200 hover:text-white transition-colors disabled:opacity-50"
                >
                  <Download className="w-3 h-3 text-amber-400" />
                  Export Fixes .CSV
                </button>
              </div>
            </div>

            {/* Live Re-Run Progress & Telemetry Banner (shown when re-running while a report is open) */}
            {loading && (
              <div className="p-5 rounded-2xl border border-emerald-800/60 bg-zinc-900/90 text-left space-y-3.5 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-3 pb-2.5 border-b border-zinc-800/80">
                  <SiteLogo url={report.url} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono font-semibold text-white truncate">
                      {report.url}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span>
                        {progressEvents.length > 0
                          ? `Live Audit: ${progressEvents[progressEvents.length - 1].stageLabel}`
                          : "Bypassing Cache & Starting Fresh Headless Crawl..."}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-300 bg-zinc-950 border border-emerald-800/70 px-2.5 py-1 rounded-md tabular-nums shrink-0">
                    {progress}%
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span className={progress >= 10 ? "text-zinc-300" : ""}>10% Fetch DOM</span>
                    <span className={progress >= 28 ? "text-zinc-300" : ""}>28% Signals</span>
                    <span className={progress >= 48 ? "text-zinc-300" : ""}>68% AI &amp; Browser</span>
                    <span className={progress >= 96 ? "text-zinc-300" : ""}>96% Rubric v3</span>
                    <span className={progress >= 100 ? "text-emerald-400" : ""}>100% Done</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 max-h-40 overflow-y-auto font-mono">
                  {progressEvents.length === 0 ? (
                    <div className="text-[11px] text-zinc-300 flex items-center gap-2 py-1">
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-400 shrink-0" />
                      <span>Launching fresh headless browser &amp; DOM extraction (cache bypassed)...</span>
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
              <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/30 text-rose-300 text-xs text-left flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-rose-200 mb-0.5">Re-Evaluation Error</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {/* Header: Prominent Overall Score Hero & Context Bar */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-800/80 pb-5">
                {/* Left: Page Identity & Executive Summary */}
                <div className="space-y-2.5 max-w-xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <SiteLogo url={report.url} size={28} />
                    <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700/70 font-semibold">
                      {report.pageType}
                    </span>
                    <span className="text-xs text-zinc-300 font-mono font-medium truncate max-w-xs sm:max-w-md">
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

              {/* Minimal, Monochromatic Editorial Context Strip with Plain-English Tooltips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/80 rounded-xl border border-zinc-800/80 bg-zinc-950/50 text-xs">
                {/* 1. Target Audience */}
                <div className="p-3.5 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between gap-1">
                    <span>Who This Page Is For</span>
                    <SimpleHelpTooltip
                      title="Target Audience (ICP)"
                      plainEnglish="The specific job roles and buyers this page is written for. When a page speaks directly to a specific buyer's daily problems, more visitors convert."
                      example="For an HR tool, speaking directly to 'HR Directors' instead of 'Everyone'."
                    />
                  </div>
                  <div className="text-xs font-semibold text-zinc-100 truncate">
                    {report.targetAudience.roles.length > 0
                      ? report.targetAudience.roles.slice(0, 2).join(" • ")
                      : "Enterprise B2B Buyers"}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate">
                    {report.targetAudience.segments[0] || "Business Decision Makers"}
                  </div>
                </div>

                {/* 2. Primary Conversion Action */}
                <div className="p-3.5 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between gap-1">
                    <span>Main Action Button (CTA)</span>
                    <SimpleHelpTooltip
                      title="Primary Conversion Action (CTA)"
                      plainEnglish="The #1 button on the page that you want visitors to click. It should be visible immediately at the top of the page without scrolling."
                      example="'Book a demo', 'Start free trial', or 'Get instant price'."
                    />
                  </div>
                  <div className="text-xs font-semibold text-zinc-100 font-mono truncate">
                    {report.signalsPreview.primaryCtaText
                      ? `"${report.signalsPreview.primaryCtaText}"`
                      : "No Main Button Found"}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {report.signalsPreview.hasAboveTheFoldCta
                      ? "Visible at top without scrolling"
                      : "Hidden lower down the page"}
                  </div>
                </div>

                {/* 3. Visitor Journey Intent */}
                <div className="p-3.5 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between gap-1">
                    <span>Visitor Buying Stage</span>
                    <SimpleHelpTooltip
                      title="Visitor Buying Stage (Intent)"
                      plainEnglish="Shows what mindset visitors are in when they land here—whether they are just learning ('Discovery'), comparing options ('Consideration'), or ready to buy ('High Intent')."
                      example="A 'Consideration' visitor wants to see product proof and book a walkthrough."
                    />
                  </div>
                  <div className="text-xs font-semibold text-zinc-100 capitalize">
                    {report.visitorIntent}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {report.visitorIntent.toLowerCase().includes("discovery")
                      ? "Learning what the product does"
                      : "Comparing options & ready to try"}
                  </div>
                </div>

                {/* 4. Lead Capture Funnel */}
                <div className="p-3.5 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between gap-1">
                    <span>Sign-Up / Lead Form</span>
                    <SimpleHelpTooltip
                      title="Sign-Up / Lead Form Status"
                      plainEnglish="Checks whether clicking the main button actually opens a working form on the page where visitors can type their email or book a demo."
                      example="A popup modal with 3 quick boxes (Name, Work Email, Company) right on the page."
                      align="right"
                    />
                  </div>
                  <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        report.signalsPreview.leadCaptureEngine ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    />
                    <span className="truncate">
                      {report.signalsPreview.leadCaptureEngine
                        ? "Working On-Page Form"
                        : "External Link / Unverified"}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {report.signalsPreview.leadCaptureEngine
                      ? "Visitors can sign up right on this page"
                      : "No inline form verified on page"}
                  </div>
                </div>
              </div>

              {/* Crisp Plain-English Audience Scoring Bar */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-semibold uppercase shrink-0">
                    Audience-Adaptive Rubric
                  </span>
                  <span className="text-zinc-300 text-[12px]">
                    {report.pageType === "resource" || report.visitorIntent === "education" ? (
                      <>
                        Page is for <strong className="text-white">Webinar / Blog Readers</strong> → We grade hardest on{" "}
                        <strong className="text-emerald-300">having a short, 2-box form</strong> (not enterprise security badges).
                      </>
                    ) : report.pageType === "functional" ? (
                      <>
                        Page is for <strong className="text-white">{report.targetAudience.roles[0] || "HR / IT Teams"}</strong> → We grade hardest on{" "}
                        <strong className="text-emerald-300">naming their daily tools &amp; tasks</strong> (like Workday or ticket automation).
                      </>
                    ) : (
                      <>
                        Page is for <strong className="text-white">Business Buyers</strong> → We grade hardest on{" "}
                        <strong className="text-emerald-300">real customer ROI stats &amp; setup speed</strong> (unlike blog pages, where a short form matters most).
                      </>
                    )}
                  </span>
                </div>
                <Link
                  href="/algorithm#audience-and-dataset"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 shrink-0 transition-colors"
                >
                  <span>See How Audience Changes Score</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
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

            {/* Crisp Plain-English "In a Nutshell" Summary Card (Subtle Green Glowy Gradient) */}
            {plainDigest && (
              <div className="relative rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-950/45 via-emerald-950/15 to-zinc-950/95 p-5 sm:p-6 space-y-4 shadow-[0_0_52px_-10px_rgba(16,185,129,0.28)] ring-1 ring-emerald-400/15">
                {/* Ambient radial green glow orbs + luminous top edge (isolated overflow wrapper so tooltips never clip) */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl" />
                  <div className="absolute -bottom-24 -right-20 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />
                </div>

                <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </span>
                    <h2 className="text-sm font-semibold text-white tracking-tight">
                      In a Nutshell — 10-Second Plain-English Summary
                    </h2>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
                      Quick Read
                    </span>
                    <SimpleHelpTooltip
                      title="Plain-English Summary"
                      plainEnglish="A jargon-free summary of your entire page audit: what's working, what's costing you sign-ups, and the top 3 changes to make first."
                      align="left"
                    />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-300 bg-zinc-950/90 border border-zinc-800 px-2.5 py-0.5 rounded-md">
                    Simple Takeaway • Score {report.totalScore}/100 (Grade {report.letterGrade})
                  </span>
                </div>

                {/* Plain-English Verdict */}
                <div className="relative p-3.5 rounded-xl bg-zinc-950/80 border border-emerald-500/25 text-xs sm:text-[13px] text-zinc-100 leading-relaxed shadow-inner backdrop-blur-sm">
                  <span className="font-semibold text-emerald-400 mr-1.5">Bottom Line:</span>
                  {plainDigest.verdict}
                </div>

                {/* 3 Simple Columns: Working Well | Hurting Sign-Ups | Top 3 Quick Wins */}
                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Col 1: What's Working Well */}
                  <div className="p-4 rounded-xl bg-zinc-950/75 border border-emerald-900/40 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>What&apos;s Working Well</span>
                    </div>
                    <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                      {plainDigest.workingWell.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Col 2: What's Hurting Sign-Ups */}
                  <div className="p-4 rounded-xl bg-zinc-950/75 border border-amber-900/40 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>What&apos;s Hurting Sign-Ups</span>
                    </div>
                    <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                      {plainDigest.hurtingSales.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Col 3: Top 3 Quick Wins (Do This First) */}
                  <div className="p-4 rounded-xl bg-zinc-950/75 border border-zinc-700/70 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Top 3 Quick Wins (Do First)</span>
                    </div>
                    <ol className="space-y-2 text-xs text-zinc-200 leading-relaxed">
                      {plainDigest.quickWins.map((win, i) => (
                        <li key={win.pinId} className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="w-4 h-4 rounded-full bg-emerald-950/80 border border-emerald-700/70 text-[10px] font-mono font-bold text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-[11.5px] text-zinc-200 leading-snug">{win.shortAction}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTagId(win.pinId);
                              scrollToTag(win.yPercent);
                            }}
                            className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-emerald-300 hover:text-white transition-colors"
                            title="Jump to this pin on the screenshot"
                          >
                            Pin #{win.pinNumber}
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Core Feature: Interactive Visual Audit Studio (Full-Page Canvas + Actionable Direct Issues) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/70 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-semibold text-white">
                      Full-Page Visual Audit &amp; Section Hotspot Annotations
                    </h2>
                    <SimpleHelpTooltip
                      title="Visual Page Audit & Fix Pins"
                      plainEnglish="We take a full-length screenshot of the live webpage and drop numbered pins right on the sections that can be improved."
                      example="Click any card on the right (or any pin on the screenshot) to jump straight to that exact spot and see what copy or button to change."
                      align="left"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Pins are tagged across the entire website height (hero, proof, and deep funnel). Click any card to jump directly to its location.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setIssueFilter("all")}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      issueFilter === "all" ? "bg-zinc-800 text-white border border-zinc-700" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    All Pins ({unifiedAnnotations.length})
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
                  {unifiedAnnotations.some((a) => a.kind === "strength") && (
                    <button
                      onClick={() => setIssueFilter("strength")}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                        issueFilter === "strength" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Strengths
                    </button>
                  )}
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

                {/* Right (6 cols): Strictly 1-to-1 Synchronized Pin Cards (#1..#N matching Left Canvas) */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="flex items-center justify-between px-1 text-xs">
                    <span className="font-semibold text-zinc-200">
                      Pinned Page Annotations &amp; CRO Fixes ({filteredAnnotations.length})
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      1-to-1 matched with canvas pins • Click to locate
                    </span>
                  </div>

                  <div className="space-y-3">
                    {filteredAnnotations.map((item) => {
                      const isSelected = (selectedTagId || tags[0]?.id) === item.id;
                      const isHovered = hoveredTagId === item.id;
                      const isActive = isSelected || isHovered;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedTagId(item.id);
                            scrollToTag(item.yPercent);
                          }}
                          onMouseEnter={() => setHoveredTagId(item.id)}
                          onMouseLeave={() => setHoveredTagId(null)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-3 ${
                            isActive
                              ? "border-emerald-500 bg-zinc-900/90 shadow-lg ring-1 ring-emerald-500/30"
                              : "border-zinc-800/90 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900/40"
                          }`}
                        >
                          {/* Card Header: 1-to-1 Pin Badge + Location Tag + Priority/Strength */}
                          <div className="flex items-center justify-between gap-2 border-b border-zinc-800/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  item.type === "issue"
                                    ? "bg-rose-500 text-white"
                                    : item.type === "warning"
                                    ? "bg-amber-500 text-zinc-950"
                                    : "bg-emerald-500 text-white"
                                }`}
                              >
                                {item.pinNumber}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-zinc-500" />
                                {item.locationLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                                  item.priority === "high"
                                    ? "bg-rose-950 text-rose-300 border border-rose-800"
                                    : item.priority === "strength"
                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                    : "bg-amber-950 text-amber-300 border border-amber-800"
                                }`}
                              >
                                {item.priority === "strength" ? "Verified Strength" : item.priority}
                              </span>
                            </div>
                          </div>

                          {/* Annotation Title & Explanation */}
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold text-white leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                              {item.problem}
                            </p>
                          </div>

                          {/* Concrete Direct Fix / Best Practice Callout Box */}
                          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] space-y-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                              <Wrench className="w-3.5 h-3.5 shrink-0" />
                              <span>{item.kind === "strength" ? "Why It Works / Keep:" : "Direct Fix:"}</span>
                            </div>
                            <p className="text-zinc-200 pl-5 leading-relaxed font-mono text-[10.5px]">
                              {item.directFix}
                            </p>
                          </div>

                          {/* Card Footer: Lift & Auto-Scroll Button */}
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <div className="text-emerald-400 font-medium flex items-center gap-1 text-[10.5px]">
                              <TrendingUp className="w-3 h-3 shrink-0" />
                              <span>
                                {item.kind === "strength"
                                  ? item.expectedImpact
                                  : `Expected Lift: ${item.expectedImpact}`}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTagId(item.id);
                                scrollToTag(item.yPercent);
                              }}
                              className="text-[10px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
                            >
                              <Crosshair className="w-3 h-3" /> Locate Pin #{item.pinNumber}
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

            {/* Section 2: Core Web Vitals & Lighthouse Metrics (Visual Gauges & Plain-English Tooltips) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">
                    Page Speed &amp; Mobile Experience (Core Web Vitals)
                  </h2>
                  <SimpleHelpTooltip
                    title="Page Speed & Core Web Vitals"
                    plainEnglish="Measures how fast your page loads on phones and computers, and whether buttons or text jump around while loading. Slow pages cause visitors to leave before reading your offer."
                    example="Pages that load in under 2.5 seconds keep significantly more visitors."
                  />
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
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white flex items-center justify-between gap-1">
                      <span>Overall Speed</span>
                      <SimpleHelpTooltip
                        title="Overall Speed Score (0–100)"
                        plainEnglish="A single 0–100 score from Google Lighthouse showing how fast and smoothly this page loads on a mobile phone."
                        example="80+ is fast; 50–79 is average; under 50 feels slow to visitors."
                      />
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {lighthouse.performanceScore >= 80
                        ? "Fast on mobile phones"
                        : lighthouse.performanceScore >= 50
                        ? "Average mobile speed"
                        : "Slow — visitors may leave"}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">Goal: 75 or higher</div>
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
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white flex items-center justify-between gap-1">
                      <span>Main Content Load</span>
                      <SimpleHelpTooltip
                        title="Main Content Load Time (LCP)"
                        plainEnglish="How many seconds a visitor waits before the main headline and biggest top image finish showing up on screen."
                        example="2.2s means a visitor sees your main headline and banner in 2.2 seconds."
                      />
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {lighthouse.lcpSeconds <= 2.5
                        ? "Main banner loads quickly"
                        : lighthouse.lcpSeconds <= 4.0
                        ? "Slight wait for main banner"
                        : "Main banner loads too slowly"}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">Goal: Under 2.5s</div>
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
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white flex items-center justify-between gap-1">
                      <span>Layout Stability</span>
                      <SimpleHelpTooltip
                        title="Layout Stability (CLS)"
                        plainEnglish="Checks if text or buttons suddenly jump around on screen while images or fonts finish loading."
                        example="0.00 to 0.10 means the page stays rock-solid and nothing jumps under the user's finger."
                      />
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {lighthouse.cls <= 0.1
                        ? "Page stays still while loading"
                        : lighthouse.cls <= 0.25
                        ? "Slight movement during load"
                        : "Elements jump around on load"}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">Goal: Under 0.10</div>
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
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white flex items-center justify-between gap-1">
                      <span>First Visual (FCP)</span>
                      <SimpleHelpTooltip
                        title="First Visual Response (FCP)"
                        plainEnglish="How fast the very first piece of text or color appears on screen so the visitor knows the website isn't frozen."
                        example="1.7s means the screen starts showing content in 1.7 seconds."
                        align="right"
                      />
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {lighthouse.fcpSeconds <= 1.8
                        ? "Page responds right away"
                        : lighthouse.fcpSeconds <= 3.0
                        ? "Acceptable start time"
                        : "Blank screen takes too long"}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1">Goal: Under 1.8s</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Dimension Breakdown Summary Cards (Plain-English Explanations + Interactive Tooltips) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Dimension A */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-start gap-4">
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
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-white font-semibold flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span>1. Message &amp; Copy Persuasion</span>
                    </span>
                    <SimpleHelpTooltip
                      title="Message & Copy Persuasion (50 pts)"
                      plainEnglish="Measures whether your words convince the visitor to care. It checks if you clearly name their problem, promise a specific result (with numbers/timeframes), and prove it with real customer stories."
                      example="Instead of 'AI for HR', saying 'Auto-resolve 70% of employee HR tickets in 10 seconds — trusted by 500+ enterprises.'"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-100">
                      {report.dimensions.persuasion.score}{" "}
                      <span className="text-zinc-500 font-normal">/ {report.dimensions.persuasion.maxScore} pts</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      • Does the copy convince the buyer?
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Checks if the headline names a clear problem, promises a real outcome, and backs it up with customer proof.
                  </p>
                </div>
              </div>

              {/* Dimension B */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-start gap-4">
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
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-white font-semibold flex items-center gap-1.5 truncate">
                      <Target className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>2. Button &amp; Form Execution</span>
                    </span>
                    <SimpleHelpTooltip
                      title="Button & Form Execution (35 pts)"
                      plainEnglish="Measures how easy it is for a convinced visitor to actually sign up or book a demo. Checks if the main button is easy to see at the top and opens a short, working form."
                      example="A clear 'Book a demo' button at the top that opens a working 3-field form right on the page."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-100">
                      {report.dimensions.execution.score}{" "}
                      <span className="text-zinc-500 font-normal">/ {report.dimensions.execution.maxScore} pts</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      • How easy is it to take action?
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Checks if the main action button stands out at the top and opens a working, easy-to-complete sign-up form.
                  </p>
                </div>
              </div>

              {/* Dimension C */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-start gap-4">
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
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-white font-semibold flex items-center gap-1.5 truncate">
                      <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>3. Speed &amp; Mobile Experience</span>
                    </span>
                    <SimpleHelpTooltip
                      title="Speed & Mobile Experience (15 pts)"
                      plainEnglish="Measures the technical basics that keep visitors from bouncing: fast page load speed, no jumping buttons, proper phone screen scaling, and readable text structure."
                      example="Loads in under 2.5s, fits cleanly on mobile phones, and has a clear main title."
                      align="right"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-100">
                      {report.dimensions.experience.score}{" "}
                      <span className="text-zinc-500 font-normal">/ {report.dimensions.experience.maxScore} pts</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      • Is it fast &amp; phone-friendly?
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Checks if the page loads quickly, stays visually steady, and is properly formatted for mobile phones.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Score Breakdown (Strictly Aligned Grid across Category Headers & Criterion Rows + Algorithm Tooltip Popovers) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
              <div className="p-4 border-b border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm font-semibold text-white">Score Breakdown</h2>
                      <SimpleHelpTooltip
                        title="13-Point Conversion Checklist"
                        plainEnglish="Every score is broken down into 13 individual checks across Message Persuasion (50 pts), Button & Form Execution (35 pts), and Speed & Mobile Experience (15 pts)."
                        example="Hover the (?) icon next to any check for a simple explanation, or hover 'Algo & Why' to see the exact math formula."
                        align="left"
                      />
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {report.criteria.length} checks across 3 categories. Hover any <span className="text-zinc-200 font-medium">(?)</span> icon for a simple explanation or <span className="text-zinc-200 font-mono">Algo &amp; Why</span> for the exact math formula.
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
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-400">
                  <span className="text-zinc-500">How each check is measured:</span>
                  {(Object.keys(METHOD_META) as Array<keyof typeof METHOD_META>).map((k) => {
                    const m = METHOD_META[k];
                    const Icon = m.icon;
                    return (
                      <span key={k} className="inline-flex items-center gap-1">
                        <Icon className={`w-3 h-3 ${m.color}`} />
                        <span>{m.label}</span>
                        <SimpleHelpTooltip
                          title={m.label}
                          plainEnglish={m.explain}
                          align="left"
                        />
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
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[13px] font-medium text-white truncate">
                                      {criterion.name}
                                    </span>
                                    <SimpleHelpTooltip
                                      title={criterion.name}
                                      plainEnglish={algo.simpleMeaning}
                                      example={`Scored ${criterion.earnedPoints} out of ${criterion.maxPoints} pts using ${method.label}.`}
                                      align="left"
                                    />
                                  </div>
                                  <div className="text-[11px] text-zinc-400 truncate">{summary}</div>
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

                                      {/* 0. In Plain English */}
                                      <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/50 space-y-1">
                                        <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                                          What This Means (Plain English)
                                        </div>
                                        <p className="text-[11px] text-zinc-200 leading-relaxed">
                                          {algo.simpleMeaning}
                                        </p>
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
