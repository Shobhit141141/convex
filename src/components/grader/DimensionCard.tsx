"use client";

import React, { useState } from "react";
import { V3DimensionSummary, V3CriterionScore } from "@/types/rubric-v3-schema";
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface DimensionCardProps {
  summary: V3DimensionSummary;
  title: string;
  description: string;
}

export function DimensionCard({ summary, title, description }: DimensionCardProps) {
  const [expanded, setExpanded] = useState(true);

  const getStatusBadge = (status: V3CriterionScore["status"]) => {
    switch (status) {
      case "passed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Passed
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" /> Partial
          </span>
        );
      case "failed":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
    }
  };

  const getDimensionColor = (dim: string) => {
    if (dim === "persuasion") return "from-purple-500 to-indigo-500";
    if (dim === "execution") return "from-blue-500 to-cyan-500";
    return "from-emerald-500 to-teal-500";
  };

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-zinc-800/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold">
              {summary.score} / {summary.maxScore} pts ({summary.percentage}%)
            </span>
            {summary.gateApplied && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                GATE CAPPED
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">{description}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress bar */}
          <div className="hidden sm:block w-32 h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getDimensionColor(summary.dimension)} transition-all duration-700`}
              style={{ width: `${Math.min(100, summary.percentage)}%` }}
            />
          </div>
          <button className="text-zinc-400 hover:text-white transition-colors">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Criteria Breakdown */}
      {expanded && (
        <div className="p-5 pt-0 border-t border-zinc-800/60 divide-y divide-zinc-800/40">
          {summary.criteria.map((criterion) => (
            <div key={criterion.id} className="py-3.5 first:pt-4 last:pb-1 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-200">{criterion.name}</span>
                    {getStatusBadge(criterion.status)}
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-400 uppercase tracking-wider font-mono">
                      {criterion.source}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{criterion.scoringRule}</p>
                </div>

                <div className="text-right whitespace-nowrap">
                  <span className="text-sm font-bold text-white">{criterion.earnedPoints}</span>
                  <span className="text-xs text-zinc-400"> / {criterion.maxPoints} pts</span>
                </div>
              </div>

              {/* Evidence box */}
              {criterion.evidence && (
                <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50 text-xs text-zinc-300 font-mono flex items-start gap-2">
                  <span className="text-zinc-400 select-none font-bold">Evidence:</span>
                  <span className="break-words line-clamp-2">{criterion.evidence}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
