'use client'

import { History } from 'lucide-react'
import { VerdictBadge } from '@/components/ui/VerdictBadge'
import type { Submission } from '@/app/[locale]/dashboard/problems/[id]/IDEClient'

interface HistoryTabProps {
  isLoadingHistory: boolean
  submissionHistory: Submission[]
  onViewSubmission: (sub: Submission) => void
}

export function HistoryTab({ isLoadingHistory, submissionHistory, onViewSubmission }: HistoryTabProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <span className="w-6 h-6 border-2 border-muted-foreground/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : submissionHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground italic text-xs gap-2">
            <History className="w-8 h-8 opacity-20" />
            <span>You haven&apos;t submitted this problem yet.</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="py-2 px-2">Verdict</th>
                <th className="py-2 px-2">Lang</th>
                <th className="py-2 px-2">Time</th>
                <th className="py-2 px-2">Mem</th>
                <th className="py-2 px-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {submissionHistory.map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => onViewSubmission(sub)}
                  className="group hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-2">
                    <div className="flex flex-col gap-0.5">
                      <VerdictBadge verdict={sub.verdict} size="sm" />
                      {sub.test_case != null && (
                        <span className="text-[9px] text-muted-foreground font-mono">
                          test {sub.test_case}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs font-mono text-muted-foreground uppercase">
                    {sub.language}
                  </td>
                  <td className="py-3 px-2 text-xs font-mono text-muted-foreground">
                    {sub.time_ms != null ? `${sub.time_ms}ms` : '—'}
                  </td>
                  <td className="py-3 px-2 text-xs font-mono text-muted-foreground">
                    {sub.memory_kb != null
                      ? sub.memory_kb < 1024
                        ? `${sub.memory_kb}KB`
                        : `${(sub.memory_kb / 1024).toFixed(1)}MB`
                      : '—'}
                  </td>
                  <td className="py-3 px-2 text-[10px] font-mono text-muted-foreground text-right">
                    <div className="flex flex-col items-end">
                      <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                      <span className="opacity-60">
                        {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
