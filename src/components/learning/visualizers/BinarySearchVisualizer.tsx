'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause, ChevronRight, Info } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useTheme } from '@/components/shared/ThemeProvider'
import { cn } from '@/lib/utils'

interface BinarySearchVisualizerProps {
  initialArray?: number[]
  target?: number
}

type Mode = 'classic' | 'lower_bound' | 'upper_bound'

export default function BinarySearchVisualizer({ 
  initialArray = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91],
  target: initialTarget = 23
}: BinarySearchVisualizerProps) {
  const locale = useLocale()
  const isRu = locale === 'ru'
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [mode, setMode] = useState<Mode>('classic')
  const [target, setTarget] = useState(initialTarget)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const speed = 1000

  const steps = useMemo(() => {
    const newSteps: { 
      low: number, 
      high: number, 
      mid: number, 
      found: boolean, 
      ans: number,
      explanation: string,
      codeLine: number
    }[] = []

    let low = 0
    let high = initialArray.length - 1
    let ans = -1

    if (mode === 'classic') {
      while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        newSteps.push({
          low,
          high,
          mid,
          found: false,
          ans: -1,
          codeLine: 2,
          explanation: isRu ? `Проверяем середину: индекс ${mid}` : `Checking middle element: index ${mid}`
        })
        
        if (initialArray[mid] === target) {
          newSteps.push({
            low,
            high,
            mid,
            found: true,
            ans: mid,
            codeLine: 3,
            explanation: isRu ? `Элемент ${target} найден по индексу ${mid}!` : `Element ${target} found at index ${mid}!`
          })
          break
        } else if (initialArray[mid] < target) {
          newSteps.push({
            low,
            high,
            mid,
            found: false,
            ans: -1,
            codeLine: 5,
            explanation: isRu ? `${initialArray[mid]} < ${target}, ищем в правой половине` : `${initialArray[mid]} < ${target}, searching in right half`
          })
          low = mid + 1
        } else {
          newSteps.push({
            low,
            high,
            mid,
            found: false,
            ans: -1,
            codeLine: 7,
            explanation: isRu ? `${initialArray[mid]} > ${target}, ищем в левой половине` : `${initialArray[mid]} > ${target}, searching in left half`
          })
          high = mid - 1
        }
      }
      if (ans === -1 && low > high) {
        newSteps.push({
          low,
          high,
          mid: -1,
          found: false,
          ans: -1,
          codeLine: 9,
          explanation: isRu ? 'Элемент не найден в массиве' : 'Element not found in array'
        })
      }
    } else if (mode === 'lower_bound') {
      while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        newSteps.push({
          low,
          high,
          mid,
          found: false,
          ans,
          codeLine: 2,
          explanation: isRu ? `Проверяем mid: ${initialArray[mid]}` : `Checking mid: ${initialArray[mid]}`
        })
        if (initialArray[mid] >= target) {
          ans = mid
          newSteps.push({
            low,
            high,
            mid,
            found: false,
            ans,
            codeLine: 3,
            explanation: isRu ? `${initialArray[mid]} >= ${target}, сохраняем ответ ${mid} и ищем левее` : `${initialArray[mid]} >= ${target}, store candidate ${mid} and search left`
          })
          high = mid - 1
        } else {
          newSteps.push({
            low,
            high,
            mid,
            found: false,
            ans,
            codeLine: 6,
            explanation: isRu ? `${initialArray[mid]} < ${target}, ищем правее` : `${initialArray[mid]} < ${target}, search right`
          })
          low = mid + 1
        }
      }
      newSteps.push({
        low,
        high,
        mid: -1,
        found: true,
        ans,
        codeLine: 8,
        explanation: isRu ? `Поиск завершен. Первый элемент >= ${target} на индексе ${ans}` : `Search complete. First element >= ${target} is at index ${ans}`
      })
    } else if (mode === 'upper_bound') {
      while (low <= high) {
        const mid = Math.floor((low + high) / 2)
        newSteps.push({
          low,
          high,
          mid,
          found: false,
          ans,
          codeLine: 2,
          explanation: isRu ? `Проверяем mid: ${initialArray[mid]}` : `Checking mid: ${initialArray[mid]}`
        })
        if (initialArray[mid] > target) {
          ans = mid
          newSteps.push({
            low,
            high,
            mid,
            found: false,
            ans,
            codeLine: 3,
            explanation: isRu ? `${initialArray[mid]} > ${target}, сохраняем ответ ${mid} и ищем левее` : `${initialArray[mid]} > ${target}, store candidate ${mid} and search left`
          })
          high = mid - 1
        } else {
          newSteps.push({
            low,
            high,
            mid,
            found: false,
            ans,
            codeLine: 6,
            explanation: isRu ? `${initialArray[mid]} <= ${target}, ищем правее` : `${initialArray[mid]} <= ${target}, search right`
          })
          low = mid + 1
        }
      }
      newSteps.push({
        low,
        high,
        mid: -1,
        found: true,
        ans,
        codeLine: 8,
        explanation: isRu ? `Поиск завершен. Первый элемент > ${target} на индексе ${ans}` : `Search complete. First element > ${target} is at index ${ans}`
      })
    }

    return newSteps
  }, [initialArray, target, mode, isRu])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentStep(0)
      setIsPlaying(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [steps])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      if (currentStep < steps.length - 1) {
        interval = setInterval(() => {
          setCurrentStep((s) => s + 1)
        }, speed)
      } else {
        setTimeout(() => setIsPlaying(false), 0)
      }
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, steps.length, speed])

  const step = steps[currentStep] || { low: -1, high: -1, mid: -1, found: false, ans: -1, explanation: '', codeLine: 0 }

  const codeSnippets: Record<Mode, string[]> = {
    classic: [
      "int low = 0, high = n - 1;",
      "while (low <= high) {",
      "  int mid = low + (high - low) / 2;",
      "  if (a[mid] == target) return mid;",
      "  else if (a[mid] < target)",
      "    low = mid + 1;",
      "  else",
      "    high = mid - 1;",
      "}",
      "return -1;"
    ],
    lower_bound: [
      "int low = 0, high = n - 1, ans = -1;",
      "while (low <= high) {",
      "  int mid = low + (high - low) / 2;",
      "  if (a[mid] >= target) {",
      "    ans = mid;",
      "    high = mid - 1;",
      "  } else {",
      "    low = mid + 1;",
      "  }",
      "}",
      "return ans;"
    ],
    upper_bound: [
      "int low = 0, high = n - 1, ans = -1;",
      "while (low <= high) {",
      "  int mid = low + (high - low) / 2;",
      "  if (a[mid] > target) {",
      "    ans = mid;",
      "    high = mid - 1;",
      "  } else {",
      "    low = mid + 1;",
      "  }",
      "}",
      "return ans;"
    ]
  }

  const modeTitle = mode === 'classic'
    ? (isRu ? 'Точное совпадение' : 'Exact Match')
    : mode === 'lower_bound'
    ? 'Lower Bound (≥ target)'
    : 'Upper Bound (> target)'

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Controls and Visualization */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                {isRu ? 'Бинарный поиск' : 'Binary Search'}: {modeTitle}
              </h4>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <div className="flex bg-muted rounded-lg p-1">
                  {(['classic', 'lower_bound', 'upper_bound'] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                        mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m === 'classic' ? (isRu ? 'КЛАССИКА' : 'CLASSIC') : m.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-muted-foreground">{isRu ? 'Цель:' : 'Target:'}</span>
                  <input 
                    type="number" 
                    value={target}
                    onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                    className="w-14 bg-muted border border-border rounded px-1.5 py-0.5 focus:ring-1 focus:ring-sky-500 text-sky-500 font-bold"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                title={isRu ? 'Сброс' : 'Reset'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                  isPlaying 
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" 
                    : "bg-sky-500 text-white shadow-sm hover:opacity-90"
                )}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                {isPlaying ? (isRu ? 'Пауза' : 'Pause') : (isRu ? 'Запуск' : 'Play')}
              </button>
              <button
                onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-30"
                disabled={currentStep === steps.length - 1}
                title={isRu ? 'Следующий шаг' : 'Next Step'}
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative pt-12 pb-16">
            {/* Range Line */}
            {step.low !== -1 && step.high !== -1 && (
              <motion.div 
                className="absolute top-20 h-1 bg-sky-500/20 rounded-full"
                animate={{ 
                  left: `${(step.low / initialArray.length) * 100}%`,
                  width: `${((step.high - step.low + 1) / initialArray.length) * 100}%`
                }}
              />
            )}

            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
              {initialArray.map((val, idx) => {
                const isMid = step.mid === idx
                const isOutside = idx < step.low || idx > step.high
                const isFound = step.found && isMid
                const isAns = step.ans === idx
                
                return (
                  <div key={idx} className="relative flex-1 min-w-[32px] flex flex-col items-center">
                    <motion.div
                      animate={{ 
                        scale: isMid ? 1.1 : 1,
                        opacity: isOutside && !step.found ? 0.25 : 1,
                        backgroundColor: isFound 
                          ? '#10b981'
                          : isAns
                            ? '#8b5cf6'
                            : isMid 
                              ? '#f59e0b'
                              : isDark ? 'rgba(39, 39, 42, 0.4)' : 'rgba(244, 244, 245, 0.8)',
                        borderColor: isMid ? '#f59e0b' : isAns ? '#8b5cf6' : (isDark ? '#3f3f46' : '#d4d4d8'),
                      }}
                      className={cn(
                        "w-full aspect-square max-w-[48px] flex items-center justify-center rounded-lg border text-sm font-mono font-bold transition-all duration-300 shadow-sm",
                        isOutside ? "text-muted-foreground" : "text-foreground",
                        isMid || isFound || isAns ? "text-white border-transparent" : "border-border"
                      )}
                    >
                      {val}
                    </motion.div>

                    <AnimatePresence>
                      {idx === step.low && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute -top-10 flex flex-col items-center"
                        >
                          <span className="text-[9px] text-sky-500 font-black">L</span>
                          <div className="w-0.5 h-3 bg-sky-500" />
                        </motion.div>
                      )}
                      {idx === step.high && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute -top-10 flex flex-col items-center"
                        >
                          <span className="text-[9px] text-rose-500 font-black">R</span>
                          <div className="w-0.5 h-3 bg-rose-500" />
                        </motion.div>
                      )}
                      {isMid && (
                        <motion.div 
                          layoutId="mid-indicator"
                          className="absolute -bottom-10 flex flex-col items-center"
                        >
                          <div className="w-0.5 h-6 bg-amber-500" />
                          <span className="text-[9px] text-amber-500 font-black">MID</span>
                        </motion.div>
                      )}
                      {isAns && !isMid && (
                        <motion.div 
                          layoutId="ans-indicator"
                          className="absolute -bottom-10 flex flex-col items-center"
                        >
                          <div className="w-0.5 h-6 bg-violet-500" />
                          <span className="text-[9px] text-violet-500 font-black">ANS</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {step.explanation}
                </p>
                <div className="flex gap-4 mt-2 flex-wrap text-muted-foreground">
                  <span className="text-[10px] font-mono uppercase">
                    {isRu ? `Шаг ${currentStep + 1} из ${steps.length}` : `Step ${currentStep + 1} of ${steps.length}`}
                  </span>
                  <span className="text-[10px] font-mono uppercase">Low: {step.low}</span>
                  <span className="text-[10px] font-mono uppercase">High: {step.high}</span>
                  <span className="text-[10px] font-mono uppercase">Mid: {step.mid}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Code Block */}
        <div className="w-full lg:w-72 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <ChevronRight className="w-4 h-4 text-sky-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isRu ? 'Алгоритм' : 'Algorithm'}
            </span>
          </div>
          <div className="bg-muted/40 rounded-xl p-4 font-mono text-[11px] border border-border shadow-inner flex-1">
            {codeSnippets[mode].map((line, idx) => (
              <div 
                key={idx}
                className={cn(
                  "py-0.5 px-2 rounded-sm transition-colors duration-200",
                  step.codeLine === idx ? "bg-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold border-l border-sky-500 -ml-2" : "text-muted-foreground/80"
                )}
              >
                <span className="inline-block w-4 text-muted-foreground/50 mr-2 select-none">{idx + 1}</span>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
