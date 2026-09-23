'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'

const INITIAL_ARRAY = [3, 8, 14, 21, 29, 36, 45, 57, 72, 88, 95]

export function InteractiveVisualizerTeaser() {
  const [array] = useState<number[]>(INITIAL_ARRAY)
  const [target, setTarget] = useState<number>(57)
  const [left, setLeft] = useState<number>(0)
  const [right, setRight] = useState<number>(INITIAL_ARRAY.length - 1)
  const [mid, setMid] = useState<number | null>(null)
  const [foundIndex, setFoundIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [stepExplanation, setStepExplanation] = useState<string>(
    'Binary search divides the search space in half at every step: O(log N).'
  )

  const reset = () => {
    setIsPlaying(false)
    setLeft(0)
    setRight(array.length - 1)
    setMid(null)
    setFoundIndex(null)
    setStepExplanation('Select a target or click Step to watch the search space halve.')
  }

  const step = useCallback(() => {
    if (foundIndex !== null) return

    if (left > right) {
      setStepExplanation(`Target ${target} was not found in the array.`)
      setIsPlaying(false)
      return
    }

    const currentMid = Math.floor((left + right) / 2)
    setMid(currentMid)

    if (array[currentMid] === target) {
      setFoundIndex(currentMid)
      setStepExplanation(`Found ${target} at index ${currentMid}! Operations taken: O(log N).`)
      setIsPlaying(false)
    } else if (array[currentMid] < target) {
      setStepExplanation(
        `array[${currentMid}] = ${array[currentMid]} < ${target}. Discarding left half [${left}..${currentMid}].`
      )
      setLeft(currentMid + 1)
    } else {
      setStepExplanation(
        `array[${currentMid}] = ${array[currentMid]} > ${target}. Discarding right half [${currentMid}..${right}].`
      )
      setRight(currentMid - 1)
    }
  }, [array, foundIndex, left, right, target])

  useEffect(() => {
    if (!isPlaying || foundIndex !== null || left > right) return
    const timer = setTimeout(step, 800)
    return () => clearTimeout(timer)
  }, [isPlaying, left, right, foundIndex, step])

  const selectTarget = (val: number) => {
    setTarget(val)
    setLeft(0)
    setRight(array.length - 1)
    setMid(null)
    setFoundIndex(null)
    setStepExplanation(`Target set to ${val}. Click Step or Play to begin searching.`)
  }

  return (
    <div className="rounded-3xl border border-white/15 bg-[#0a0a0e] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/10 border border-amber-400/20 text-amber-300">
              <Sparkles className="w-3 h-3" /> Interactive Teaser
            </span>
            <span className="text-xs font-mono text-white/40">O(log N) Search</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Binary Search Visualizer</h3>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={foundIndex !== null || left > right}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition-all disabled:opacity-40"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
          </button>
          <button
            onClick={step}
            disabled={isPlaying || foundIndex !== null || left > right}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-medium hover:bg-white/10 transition-all disabled:opacity-40"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step</span>
          </button>
          <button
            onClick={reset}
            className="p-1.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Array visualization */}
      <div className="py-8">
        <div className="text-xs font-mono text-white/40 mb-3 flex items-center justify-between">
          <span>Click any number to target it:</span>
          <span className="text-amber-300 font-bold">Target = {target}</span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
          {array.map((val, idx) => {
            const isEliminated = idx < left || idx > right
            const isMid = idx === mid
            const isFound = idx === foundIndex
            const isLeft = idx === left
            const isRight = idx === right

            return (
              <button
                key={val}
                onClick={() => selectTarget(val)}
                className={cn(
                  'group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 font-mono',
                  isFound
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.4)] scale-105'
                    : isMid
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-105'
                    : isEliminated
                    ? 'bg-white/[0.01] border-white/5 text-white/20'
                    : 'bg-white/[0.04] border-white/15 text-white hover:border-amber-400/40 hover:bg-white/10'
                )}
              >
                <span className="text-xs text-white/30 mb-1">#{idx}</span>
                <span className="text-base font-bold">{val}</span>

                {/* Pointer tags */}
                <div className="absolute -bottom-5 flex gap-1 text-[9px] font-bold">
                  {isLeft && <span className="text-blue-400">L</span>}
                  {isMid && <span className="text-amber-400">M</span>}
                  {isRight && <span className="text-purple-400">R</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 shrink-0">
            {foundIndex !== null ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>
          <p className="text-xs sm:text-sm text-white/80 font-mono leading-relaxed">
            {stepExplanation}
          </p>
        </div>

        <Link
          href="/dashboard/learning"
          className="shrink-0 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 group"
        >
          <span>All 22 Visualizers</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
