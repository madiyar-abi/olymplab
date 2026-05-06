"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock, 
  Cpu,
  AlertCircle
} from 'lucide-react'
import { useSubmissionRealtime } from '@/hooks/useSubmissionRealtime'
import { mapRawVerdict, Verdict, VERDICT_METADATA } from '@/types/verdict'
import { VerdictBadge } from '@/components/ui/VerdictBadge'

interface SubmissionStatusProps {
  submissionId: string | null
}

export const SubmissionStatus: React.FC<SubmissionStatusProps> = ({ submissionId }) => {
  const { submission, error } = useSubmissionRealtime(submissionId)

  if (!submissionId) return null

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-500">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Real-time connection lost</span>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        <span className="text-sm text-muted-foreground animate-pulse">Initializing judge stream...</span>
      </div>
    )
  }

  const verdict = mapRawVerdict(submission.verdict)
  const statusUpper = submission.status.toUpperCase()
  
  const isFinished = statusUpper === 'FINISHED' || statusUpper === 'COMPLETED' || statusUpper === 'ERROR'
  const isRunning = statusUpper === 'RUNNING' || statusUpper === 'TESTING'
  const isPending = statusUpper === 'PENDING' || (!isFinished && !isRunning)

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full"
    >
      <div className={`relative overflow-hidden flex items-center justify-between p-5 rounded-2xl border transition-all duration-500 ${
        isFinished 
          ? verdict === Verdict.AC 
            ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.1)]' 
            : 'bg-red-500/5 border-red-500/20 shadow-[0_0_20px_-5px_rgba(239,68,68,0.1)]'
          : isRunning
            ? 'bg-amber-500/5 border-amber-500/20 shadow-[0_0_20px_-5px_rgba(245,158,11,0.1)]'
            : 'bg-secondary/30 border-border'
      }`}>
        {/* Progress Background Glow */}
        {!isFinished && (
          <motion.div 
            className={`absolute inset-0 opacity-10 pointer-events-none ${
              isRunning ? 'bg-amber-500' : 'bg-zinc-500'
            }`}
            animate={{ 
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <div className="flex items-center gap-5 relative z-10">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-black/20 border border-white/5">
            <AnimatePresence mode="wait">
              {isPending && (
                <motion.div
                  key="pending"
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 180, opacity: 0 }}
                >
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                </motion.div>
              )}
              {isRunning && (
                <motion.div
                  key="running"
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 180, opacity: 0 }}
                >
                  <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                </motion.div>
              )}
              {isFinished && (
                <motion.div
                  key="finished"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  {verdict === Verdict.AC ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className={`text-xs font-black uppercase tracking-widest ${
                isFinished 
                  ? verdict === Verdict.AC ? 'text-emerald-400' : 'text-red-400'
                  : isRunning ? 'text-amber-400' : 'text-zinc-400'
              }`}>
                {isFinished ? 'Execution Finished' : isRunning ? 'Executing Code' : 'Queueing'}
              </h3>
              {isFinished && (
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                >
                  <VerdictBadge verdict={submission.verdict} size="sm" />
                </motion.div>
              )}
            </div>
            
            <div className="flex items-center gap-2 h-5">
              <AnimatePresence mode="wait">
                {isRunning && (
                  <motion.div 
                    key="running-info"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-1.5 text-xs font-mono text-amber-500/70"
                  >
                    <span>Running on test</span>
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={submission.current_test}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        className="font-bold text-amber-500 px-1.5 py-0.5 bg-amber-500/10 rounded"
                      >
                        {submission.current_test || 1}
                      </motion.span>
                    </AnimatePresence>
                  </motion.div>
                )}
                {isFinished && (
                  <motion.span 
                    key="finished-info"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {verdict === Verdict.AC 
                      ? "Passed all test cases successfully." 
                      : `Failed on test case ${submission.current_test || '?'}.`}
                  </motion.span>
                )}
                {isPending && (
                  <motion.span 
                    key="pending-info"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-zinc-500"
                  >
                    Waiting for an available judge node...
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {isFinished && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-black/20 rounded-lg border border-white/5">
                <Clock className="w-3.5 h-3.5 text-amber-500/70" />
                <span className="text-xs font-mono font-bold text-zinc-300">{submission.time_ms || 0} ms</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-black/20 rounded-lg border border-white/5">
                <Cpu className="w-3.5 h-3.5 text-blue-500/70" />
                <span className="text-xs font-mono font-bold text-zinc-300">
                  {submission.memory_kb ? (submission.memory_kb < 1024 ? `${submission.memory_kb} KB` : `${(submission.memory_kb / 1024).toFixed(1)} MB`) : '0 KB'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
