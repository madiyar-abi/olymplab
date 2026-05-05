'use client'

import { AlertCircle, CheckCircle2, XCircle, Timer as TimerIcon, Cpu } from 'lucide-react'
import { VerdictBadge } from '@/components/ui/VerdictBadge'
import type { Submission } from '@/app/dashboard/problems/[id]/IDEClient'

interface SubmissionsTabProps {
  currentSubmission: Partial<Submission> | null
}

export function SubmissionsTab({ currentSubmission }: SubmissionsTabProps) {
  return (
    <div className="h-full flex flex-col font-mono text-sm text-foreground/80 overflow-y-auto">
      {!currentSubmission ? (
        <div className="text-muted-foreground italic flex flex-col items-center justify-center h-full gap-2">
          <AlertCircle className="w-8 h-8 opacity-20" />
          <span>No active submission.</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Status</span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {currentSubmission.status === 'PENDING' && (
                    <span className="text-amber-500 flex items-center gap-2 font-bold">
                      <span className="w-3 h-3 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
                      In Queue
                    </span>
                  )}
                  {currentSubmission.status === 'TESTING' && (
                    <span className="text-cyan-600 flex items-center gap-2 font-bold">
                      <span className="w-3 h-3 border-2 border-cyan-600/30 border-t-cyan-600 rounded-full animate-spin" />
                      Testing
                    </span>
                  )}
                  {currentSubmission.status === 'COMPLETED' && (
                    <span className="text-emerald-500 flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Finished
                    </span>
                  )}
                  {currentSubmission.status === 'ERROR' && (
                    <span className="text-red-500 flex items-center gap-2 font-bold">
                      <XCircle className="w-4 h-4" /> Error
                    </span>
                  )}
                </div>
                {(currentSubmission.status === 'TESTING' || currentSubmission.status === 'COMPLETED') &&
                  currentSubmission.test_case != null && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      on test {currentSubmission.test_case}
                    </span>
                  )}
              </div>
            </div>

            {currentSubmission.status === 'COMPLETED' && currentSubmission.verdict && (
              <div className="text-right flex flex-col items-end gap-2">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Verdict</span>
                  <VerdictBadge verdict={currentSubmission.verdict} size="lg" />
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded border border-border">
                  {currentSubmission.time_ms != null && (
                    <div className="flex items-center gap-1">
                      <TimerIcon className="w-3 h-3 text-amber-500/70" />
                      {currentSubmission.time_ms} ms
                    </div>
                  )}
                  {currentSubmission.memory_kb != null && (
                    <div className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-blue-500/70" />
                      {currentSubmission.memory_kb < 1024
                        ? `${currentSubmission.memory_kb} KB`
                        : `${(currentSubmission.memory_kb / 1024).toFixed(1)} MB`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {currentSubmission.status === 'ERROR' && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500">
              {currentSubmission.verdict || 'Internal submission error.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
