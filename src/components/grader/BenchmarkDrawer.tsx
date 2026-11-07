"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Layers, CheckCircle2 } from "lucide-react";

interface BenchmarkDrawerProps {
  onSelectUrl: (url: string) => void;
}

export function BenchmarkDrawer({ onSelectUrl }: BenchmarkDrawerProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/benchmark")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.benchmark)) {
          setData(res.benchmark);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center text-xs text-zinc-400">
        Loading benchmark comparison...
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-lg p-6 space-y-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Leena AI Calibration Benchmark
            </h3>
            <p className="text-xs text-zinc-400">
              Comparative discrimination across 3 enterprise pages with measured traffic and conversion data.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
            <tr>
              <th className="py-2.5 px-3">Page Name</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3 text-right">Actual CVR</th>
              <th className="py-2.5 px-3 text-right">Sessions</th>
              <th className="py-2.5 px-3 text-right">Rubric v1</th>
              <th className="py-2.5 px-3 text-right">Rubric v2</th>
              <th className="py-2.5 px-3 text-right font-bold text-white">Rubric v3</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {data.map((item) => (
              <tr key={item.pageId} className="hover:bg-zinc-800/40 transition-colors">
                <td className="py-3 px-3 font-semibold text-white">
                  {item.name}
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] uppercase font-mono text-zinc-300">
                    {item.classification.pageType}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                  {(item.actualCvr * 100).toFixed(2)}%
                </td>
                <td className="py-3 px-3 text-right font-mono text-zinc-400">
                  {item.sessions.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono text-zinc-400">
                  {item.v1Score}
                </td>
                <td className="py-3 px-3 text-right font-mono text-zinc-400">
                  {item.v2Score}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-white text-sm">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {item.v3Result.totalScore}/100
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <button
                    onClick={() => onSelectUrl(item.url)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                  >
                    Evaluate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-[11px] text-zinc-400 space-y-1">
        <p className="font-semibold text-zinc-300">Why Rubric v3 discriminates meaningfully:</p>
        <p>
          Rubric v2 collapsed all 3 pages into 93-96 through double-normalization and script-presence credit. Rubric v3 cleanly separates them into 83 (Homepage), 80 (HR Functional), and 77 (Webinar) based on graded persuasion evidence and unverified script penalties.
        </p>
      </div>
    </div>
  );
}
