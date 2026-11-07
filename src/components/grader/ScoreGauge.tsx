"use client";

import React from "react";

interface ScoreGaugeProps {
  score: number;
  letterGrade: "A+" | "A" | "B" | "C" | "D" | "F";
  pageType: string;
  visitorIntent: string;
  gatesTriggered: string[];
}

export function ScoreGauge({
  score,
  letterGrade,
  pageType,
  visitorIntent,
  gatesTriggered
}: ScoreGaugeProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    if (s >= 70) return "text-blue-500 border-blue-500/30 bg-blue-500/10";
    if (s >= 60) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    return "text-rose-500 border-rose-500/30 bg-rose-500/10";
  };

  const getRingColor = (s: number) => {
    if (s >= 80) return "#10b981";
    if (s >= 70) return "#3b82f6";
    if (s >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const strokeDashoffset = 440 - (440 * score) / 100;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-6">
        {/* Circular Gauge */}
        <div className="relative flex items-center justify-center w-36 h-36">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r="70"
              className="text-zinc-800"
              strokeWidth="12"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={getRingColor(score)}
              strokeWidth="12"
              strokeDasharray="440"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold tracking-tight text-white">{score}</span>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">/ 100</span>
          </div>
        </div>

        {/* Grade and Classification */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-sm font-bold rounded-lg border ${getScoreColor(score)}`}>
              Grade {letterGrade}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-zinc-800 text-zinc-300 uppercase tracking-wider">
              {pageType}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-zinc-800 text-zinc-300">
              Intent: {visitorIntent}
            </span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            Conversion Readiness Score
          </h2>
          <p className="text-xs text-zinc-400 max-w-sm">
            Rubric v3 evaluation across Persuasion (50), Execution (35), and Supporting Experience (15).
          </p>
        </div>
      </div>

      {/* Gates or Status Badge */}
      <div className="flex flex-col items-end gap-2 text-right">
        {gatesTriggered.length > 0 ? (
          <div className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            <div className="font-semibold text-rose-300">Conversion Gate Triggered</div>
            <div>{gatesTriggered[0].split(":")[0]}</div>
          </div>
        ) : (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <div className="font-semibold text-emerald-300">No Critical Gate Triggered</div>
            <div>Funnel path active</div>
          </div>
        )}
      </div>
    </div>
  );
}
