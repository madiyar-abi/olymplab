'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'

const INITIAL_ARRAY = [3, 8, 14, 21, 29, 36, 45, 57, 72, 88, 95]

export function InteractiveVisualizerTeaser() {
  const locale = useLocale()
  const isRu = locale === 'ru'

  const [array] = useState<number[]>(INITIAL_ARRAY)
  const [target, setTarget] = useState<number>(57)
  const [left, setLeft] = useState<number>(0)
  const [right, setRight] = useState<number>(INITIAL_ARRAY.length - 1)
  const [mid, setMid] = useState<number | null>(null)
  const [foundIndex, setFoundIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [stepExplanation, setStepExplanation] = useState<string>(
    isRu 
      ? 'Бинарный поиск делит область поиска пополам на каждом шаге: O(log N).' 
      : 'Binary search divides the search space in half at every step: O(log N).'
  )

  const reset = () => {
    setIsPlaying(false)
    setLeft(0)
    setRight(array.length - 1)
    setMid(null)
    setFoundIndex(null)
    setStepExplanation(
      isRu 
        ? 'Выберите число или нажмите «Шаг», чтобы увидеть деление пополам.' 
        : 'Select a target or click Step to watch the search space halve.'
    )
  }

  const step = useCallback(() => {
    if (foundIndex !== null) return

    if (left > right) {
      setStepExplanation(
        isRu 
          ? `Число ${target} не найдено в массиве.` 
          : `Target ${target} was not found in the array.`
      )
      setIsPlaying(false)
      return
    }

    const currentMid = Math.floor((left + right) / 2)
    setMid(currentMid)

    if (array[currentMid] === target) {
      setFoundIndex(currentMid)
      setStepExplanation(
        isRu 
          ? `Найдено число ${target} на позиции ${currentMid}! Сложность: O(log N).` 
          : `Found ${target} at index ${currentMid}! Operations taken: O(log N).`
      )
      setIsPlaying(false)
    } else if (array[currentMid] < target) {
      setStepExplanation(
        isRu 
          ? `array[${currentMid}] = ${array[currentMid]} < ${target}. Отсекаем левую часть [${left}..${currentMid}].` 
          : `array[${currentMid}] = ${array[currentMid]} < ${target}. Discarding left half [${left}..${currentMid}].`
      )
      setLeft(currentMid + 1)
    } else {
      setStepExplanation(
        isRu 
          ? `array[${currentMid}] = ${array[currentMid]} > ${target}. Отсекаем правую часть [${currentMid}..${right}].` 
          : `array[${currentMid}] = ${array[currentMid]} > ${target}. Discarding right half [${currentMid}..${right}].`
      )
      setRight(currentMid - 1)
    }
  }, [array, foundIndex, left, right, target, isRu])

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
    setStepExplanation(
      isRu 
        ? `Ищем число ${val}. Нажмите «Шаг» или «Авто» для запуска.` 
        : `Target set to ${val}. Click Step or Play to begin searching.`
    )
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/10 border border-amber-400/20 text-amber-500 dark:text-amber-300">
              <Sparkles className="w-3 h-3" /> {isRu ? 'Интерактивное превью' : 'Interactive Teaser'}
            </span>
            <span className="text-xs font-mono text-muted-foreground">{isRu ? 'Поиск за O(log N)' : 'O(log N) Search'}</span>
          </div>
          <h3 className="text-xl font-bold text-foreground tracking-tight">
            {isRu ? 'Визуализатор бинарного поиска' : 'Binary Search Visualizer'}
          </h3>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={foundIndex !== null || left > right}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition-all disabled:opacity-40 shadow-sm"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? (isRu ? 'Пауза' : 'Pause') : (isRu ? 'Авто' : 'Auto Play')}</span>
          </button>
          <button
            onClick={step}
            disabled={isPlaying || foundIndex !== null || left > right}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary text-foreground text-xs font-medium hover:bg-muted transition-all disabled:opacity-40"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>{isRu ? 'Шаг' : 'Step'}</span>
          </button>
          <button
            onClick={reset}
            className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={isRu ? 'Сброс' : 'Reset'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Array visualization */}
      <div className="py-8">
        <div className="text-xs font-mono text-muted-foreground mb-3 flex items-center justify-between">
          <span>{isRu ? 'Нажмите на любое число для поиска:' : 'Click any number to target it:'}</span>
          <span className="text-amber-500 dark:text-amber-300 font-bold font-mono">Target = {target}</span>
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
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-600 dark:text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.3)] scale-105'
                    : isMid
                    ? 'bg-amber-400/20 border-amber-400 text-amber-600 dark:text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-105'
                    : isEliminated
                    ? 'bg-muted/30 border-border/40 text-muted-foreground/30'
                    : 'bg-secondary/70 border-border text-foreground hover:border-amber-400/40 hover:bg-muted'
                )}
              >
                <span className="text-[10px] text-muted-foreground/50 mb-1">#{idx}</span>
                <span className="text-base font-bold">{val}</span>

                {/* Pointer tags */}
                <div className="absolute -bottom-5 flex gap-1 text-[9px] font-bold">
                  {isLeft && <span className="text-blue-500">L</span>}
                  {isMid && <span className="text-amber-500">M</span>}
                  {isRight && <span className="text-purple-500">R</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="mt-4 p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-500 dark:text-amber-300 shrink-0">
            {foundIndex !== null ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>
          <p className="text-xs sm:text-sm text-foreground/80 font-mono leading-relaxed">
            {stepExplanation}
          </p>
        </div>

        <Link
          href="/dashboard/learning"
          className="shrink-0 text-xs font-bold text-amber-500 hover:text-amber-400 dark:text-amber-400 dark:hover:text-amber-300 transition-colors flex items-center gap-1 group"
        >
          <span>{isRu ? 'Все 22 визуализатора' : 'All 22 Visualizers'}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
