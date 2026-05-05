'use client'

import { useState, useEffect, useMemo } from 'react'
import { Play, RotateCcw, SkipForward, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function StringMatchVisualizer({ text = "ABABDABACDABABCABAB", pattern = "ABABCABAB" }) {
  const steps = useMemo(() => {
    const newSteps: { i: number, j: number, match: boolean[], msg: string }[] = []
    
    newSteps.push({ i: 0, j: 0, match: [], msg: "Начинаем поиск (наивный алгоритм)." })

    for (let i = 0; i <= text.length - pattern.length; i++) {
      let j = 0
      const currentMatch: boolean[] = []
      
      while (j < pattern.length) {
        if (text[i + j] === pattern[j]) {
          currentMatch.push(true)
          newSteps.push({ i, j, match: [...currentMatch], msg: `Совпадение символов: ${pattern[j]} == ${text[i+j]}` })
          j++
        } else {
          currentMatch.push(false)
          newSteps.push({ i, j, match: [...currentMatch], msg: `Несовпадение! ${pattern[j]} != ${text[i+j]}. Сдвигаем шаблон.` })
          break
        }
      }

      if (j === pattern.length) {
        newSteps.push({ i, j, match: [...currentMatch], msg: `Шаблон полностью найден на индексе ${i}!` })
        break // Stop at first match for visualization
      }
    }

    if (newSteps[newSteps.length-1].j !== pattern.length) {
      newSteps.push({ i: text.length - pattern.length, j: 0, match: [], msg: "Шаблон не найден." })
    }

    return newSteps
  }, [text, pattern])

  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

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
        interval = setInterval(() => setCurrentStep(s => s + 1), 800)
      } else {
        setTimeout(() => setIsPlaying(false), 0)
      }
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, steps.length])

  const step = steps[currentStep] || { i: 0, j: 0, match: [], msg: "" }

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Поиск подстроки</h4>
          <p className="text-xs text-muted-foreground mt-1">Наивный алгоритм (Brute-force)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setCurrentStep(0); setIsPlaying(false); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all", isPlaying ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" : "bg-primary text-primary-foreground shadow-sm hover:opacity-90")}>
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />} {isPlaying ? 'Пауза' : 'Запуск'}
          </button>
          <button onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors" disabled={currentStep === steps.length - 1}><SkipForward className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="relative pb-12 overflow-x-auto min-h-[120px]">
        {/* Text */}
        <div className="flex gap-1 mb-2">
          {text.split('').map((char, idx) => {
            const isMatchArea = idx >= step.i && idx < step.i + pattern.length
            const isComparing = idx === step.i + step.j
            
            return (
              <div key={`t-${idx}`} className={cn(
                "w-8 h-10 flex-shrink-0 flex items-center justify-center rounded border font-mono font-bold text-sm transition-all",
                isComparing ? "border-amber-500 bg-amber-500/20 text-amber-500 scale-110 z-10" :
                isMatchArea ? "border-sky-500/20 bg-sky-500/5 text-sky-500/50" :
                "border-border bg-background text-foreground"
              )}>
                {char}
                <span className="absolute -top-5 text-[8px] text-muted-foreground/30 font-normal">{idx}</span>
              </div>
            )
          })}
        </div>

        {/* Pattern */}
        <div className="relative flex gap-1">
          {/* Spacer to align pattern with index i */}
          <div style={{ width: `${step.i * 36}px` }} className="flex-shrink-0 transition-all duration-500" />
          
          <div className="flex gap-1">
            {pattern.split('').map((char, idx) => {
              const isCompared = idx <= step.j && step.match.length > idx
              const isMatch = step.match[idx]
              const isCurrent = idx === step.j
              
              return (
                <div key={`p-${idx}`} className={cn(
                  "w-8 h-10 flex-shrink-0 flex items-center justify-center rounded border font-mono font-bold text-sm transition-all",
                  isCompared 
                    ? (isMatch ? "border-emerald-500 bg-emerald-500/20 text-emerald-500" : "border-rose-500 bg-rose-500/20 text-rose-500") 
                    : "border-primary/30 bg-primary/5 text-primary",
                  isCurrent && "ring-2 ring-amber-500 ring-offset-2 ring-offset-background"
                )}>
                  {char}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-muted/30 p-4 rounded-xl border border-border font-mono text-xs text-muted-foreground">
        <span className="text-sky-500 font-bold mr-2">LOG:</span>{step.msg}
      </div>
    </div>
  )
}
