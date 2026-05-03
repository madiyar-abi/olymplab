'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GreedyVisualizer() {
  const initialIntervals = useMemo(() => [
    { id: 1, start: 1, end: 4 },
    { id: 2, start: 3, end: 5 },
    { id: 3, start: 0, end: 6 },
    { id: 4, start: 5, end: 7 },
    { id: 5, start: 3, end: 8 },
    { id: 6, start: 5, end: 9 },
    { id: 7, start: 6, end: 10 },
    { id: 8, start: 8, end: 11 },
  ], [])

  const maxTime = 12

  const steps = useMemo(() => {
    const newSteps: { intervals: { id: number, start: number, end: number }[], sorted: boolean, active: number | null, selected: number[], msg: string }[] = []
    
    newSteps.push({ 
      intervals: [...initialIntervals], 
      sorted: false, 
      active: null, 
      selected: [], 
      msg: "Изначальный набор отрезков." 
    })

    const sorted = [...initialIntervals].sort((a, b) => a.end - b.end)
    
    newSteps.push({ 
      intervals: [...sorted], 
      sorted: true, 
      active: null, 
      selected: [], 
      msg: "Шаг 1: Сортируем отрезки по времени окончания." 
    })

    let lastEnd = -1
    const selected: number[] = []

    for (let i = 0; i < sorted.length; i++) {
      const inv = sorted[i]
      if (inv.start >= lastEnd) {
        selected.push(inv.id)
        lastEnd = inv.end
        newSteps.push({ 
          intervals: [...sorted], 
          sorted: true, 
          active: inv.id, 
          selected: [...selected], 
          msg: `Отрезок [${inv.start}, ${inv.end}] начинается позже ${lastEnd === inv.end ? '-1' : lastEnd}. Берем!` 
        })
      } else {
        newSteps.push({ 
          intervals: [...sorted], 
          sorted: true, 
          active: inv.id, 
          selected: [...selected], 
          msg: `Отрезок [${inv.start}, ${inv.end}] пересекается с выбранными (начало < ${lastEnd}). Пропускаем.` 
        })
      }
    }

    newSteps.push({ 
      intervals: [...sorted], 
      sorted: true, 
      active: null, 
      selected: [...selected], 
      msg: "Алгоритм завершен. Найдено максимальное расписание." 
    })

    return newSteps
  }, [initialIntervals])

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
        interval = setInterval(() => setCurrentStep(s => s + 1), 1200)
      } else {
        setTimeout(() => setIsPlaying(false), 0)
      }
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, steps.length])

  const step = steps[currentStep] || { intervals: [], sorted: false, active: null, selected: [], msg: "" }

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Жадный алгоритм</h4>
          <p className="text-xs text-muted-foreground mt-1">Выбор заявок (Interval Scheduling)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setCurrentStep(0); setIsPlaying(false); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all", isPlaying ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" : "bg-primary text-primary-foreground shadow-sm hover:opacity-90")}>
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />} {isPlaying ? 'Пауза' : 'Запуск'}
          </button>
          <button onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors" disabled={currentStep === steps.length - 1}><SkipForward className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="relative pt-6 pb-6 w-full overflow-x-auto">
        <div className="min-w-[500px] border-l-2 border-r-2 border-border/50 relative" style={{ height: `${step.intervals.length * 40 + 40}px` }}>
          {/* Time axis */}
          <div className="absolute top-0 left-0 w-full flex justify-between px-2 text-[10px] font-mono text-muted-foreground">
            {Array.from({ length: maxTime + 1 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center" style={{ width: `${100/maxTime}%` }}>
                <span>{i}</span>
                <div className="w-px h-full bg-border/30 absolute top-5" />
              </div>
            ))}
          </div>

          <div className="pt-8">
            <AnimatePresence>
              {step.intervals.map((inv, idx) => {
                const isActive = step.active === inv.id
                const isSelected = step.selected.includes(inv.id)
                const isRejected = !isSelected && step.active !== inv.id && step.active !== null && step.intervals.findIndex(x => x.id === step.active) > idx

                return (
                  <motion.div
                    key={inv.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isRejected ? 0.3 : 1 }}
                    className="h-8 absolute flex items-center"
                    style={{ 
                      left: `${(inv.start / maxTime) * 100}%`, 
                      width: `${((inv.end - inv.start) / maxTime) * 100}%`,
                      top: `${idx * 40 + 30}px`
                    }}
                  >
                    <div className={cn(
                      "w-full h-6 rounded-md border-2 text-[10px] font-bold flex items-center justify-center font-mono shadow-sm transition-colors",
                      isSelected ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" :
                      isActive ? "bg-amber-500/20 border-amber-500 text-amber-500" :
                      "bg-secondary border-border text-muted-foreground"
                    )}>
                      {inv.start}-{inv.end}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-muted/30 p-4 rounded-xl border border-border/50 font-mono text-xs text-muted-foreground">
        <span className="text-sky-500 font-bold mr-2">LOG:</span>{step.msg}
      </div>
    </div>
  )
}
