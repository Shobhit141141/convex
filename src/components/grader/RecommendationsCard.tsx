"use client";

import React from "react";
import { CRORecommendation } from "@/features/pipeline/grader-pipeline";
import { Lightbulb, ArrowUpRight, ShieldAlert, Sparkles } from "lucide-react";

interface RecommendationsCardProps {
  recommendations: CRORecommendation[];
}

export function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  if (recommendations.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center space-y-2">
        <Sparkles className="w-8 h-8 text-emerald-400 mx-auto" />
        <h3 className="text-base font-bold text-white">No Critical Fixes Required</h3>
        <p className="text-xs text-zinc-400">
          This page satisfies key conversion persuasion, execution, and experience standards.
        </p>
      </div>
    );
  }

  const getPriorityBadge = (priority: CRORecommendation["priority"]) => {
    switch (priority) {
      case "high":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">HIGH PRIORITY</span>;
      case "medium":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">MEDIUM</span>;
      case "low":
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">OPTIMIZATION</span>;
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg p-6 space-y-4 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Prioritized CRO Recommendations
          </h3>
          <p className="text-xs text-zinc-400">
            Actionable, evidence-backed improvements to increase primary conversion rate.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2.5 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{rec.title}</span>
                {getPriorityBadge(rec.priority)}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                  {rec.dimension}
                </span>
              </div>
            </div>

            <div className="text-xs text-zinc-300 space-y-1.5">
              <p><strong className="text-zinc-400">Problem:</strong> {rec.problem}</p>
              <p><strong className="text-amber-400">Recommended Action:</strong> {rec.action}</p>
              <p className="text-[11px] text-emerald-400 font-medium">
                <strong>Expected Impact:</strong> {rec.expectedImpact}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
