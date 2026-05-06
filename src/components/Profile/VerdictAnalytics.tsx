'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';
import { Verdict, VERDICT_METADATA } from '@/types/verdict';
import { VerdictStat, generateVerdictInsights } from '@/lib/verdictInsights';
import { cn } from '@/lib/utils';

interface VerdictAnalyticsProps {
  stats: VerdictStat[];
}

export default function VerdictAnalytics({ stats }: VerdictAnalyticsProps) {
  const insights = generateVerdictInsights(stats);
  const totalSubmissions = stats.reduce((acc, curr) => acc + curr.count, 0);

  // Filter to show only common CP verdicts in the main bar
  const mainVerdicts = [Verdict.AC, Verdict.WA, Verdict.TLE, Verdict.MLE, Verdict.RE];
  const displayStats = stats
    .filter((s) => mainVerdicts.includes(s.verdict))
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="space-y-8 bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Verdict Analytics</h2>
          <p className="text-zinc-400">Deep dive into your submission patterns</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center sm:items-end">
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Total Submissions</span>
          <div className="text-xl font-mono text-white leading-none mt-1">{totalSubmissions}</div>
        </div>
      </div>

      {/* Visual Breakdown */}
      <div className="space-y-6">
        <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden flex shadow-inner">
          {displayStats.map((stat, index) => {
            const barColors: Record<string, string> = {
              [Verdict.AC]: 'bg-emerald-500',
              [Verdict.WA]: 'bg-red-500',
              [Verdict.TLE]: 'bg-amber-500',
              [Verdict.MLE]: 'bg-orange-500',
              [Verdict.RE]: 'bg-purple-500',
            };

            return (
              <motion.div
                key={stat.verdict}
                initial={{ width: 0 }}
                animate={{ width: `${stat.percentage}%` }}
                transition={{ duration: 1, delay: index * 0.1, ease: "circOut" }}
                className={cn("h-full", barColors[stat.verdict] || "bg-zinc-700")}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {mainVerdicts.map((v) => {
            const stat = stats.find((s) => s.verdict === v) || { verdict: v, count: 0, percentage: 0 };
            const meta = VERDICT_METADATA[v];
            
            return (
              <div key={v} className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/30 hover:border-zinc-700/50 transition-all group">
                <div className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", meta.color)}>{meta.label}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-mono font-bold text-zinc-100 group-hover:text-white transition-colors">{stat.count}</span>
                  <span className="text-xs text-zinc-500">{stat.percentage.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Insights */}
      <div className="space-y-4 pt-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-amber-400 fill-amber-400/20" />
          <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-zinc-300">Smart Insights</h3>
        </div>

        <div className="grid gap-3">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className={cn(
                "p-4 rounded-xl border flex gap-4 items-start transition-colors",
                insight.type === 'success' && "bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10",
                insight.type === 'warning' && "bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10",
                insight.type === 'info' && "bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10"
              )}
            >
              <div className="mt-0.5 p-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 shadow-sm">
                {insight.type === 'success' && <CheckCircle className="text-emerald-500" size={16} />}
                {insight.type === 'warning' && <AlertTriangle className="text-amber-500" size={16} />}
                {insight.type === 'info' && <Info className="text-blue-500" size={16} />}
              </div>
              <div>
                <h4 className={cn(
                  "font-bold text-sm mb-0.5 tracking-tight",
                  insight.type === 'success' && "text-emerald-400",
                  insight.type === 'warning' && "text-amber-400",
                  insight.type === 'info' && "text-blue-400"
                )}>
                  {insight.title}
                </h4>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-2xl">
                  {insight.message}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
