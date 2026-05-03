'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Point {
  x: number
  y: number
  id: number
}

export default function ConvexHullVisualizer() {
  const initialPoints: Point[] = useMemo(() => [
    { x: 50, y: 50, id: 1 }, { x: 150, y: 30, id: 2 }, { x: 240, y: 60, id: 3 },
    { x: 260, y: 150, id: 4 }, { x: 200, y: 220, id: 5 }, { x: 80, y: 240, id: 6 },
    { x: 30, y: 160, id: 7 }, { x: 120, y: 130, id: 8 }, { x: 180, y: 100, id: 9 },
    { x: 160, y: 180, id: 10 }, { x: 100, y: 70, id: 11 }
  ], [])

  const steps = useMemo(() => {
    const newSteps: { hull: Point[], active: Point | null, msg: string }[] = []
    
    // Sort points by X (Monotone Chain)
    const sorted = [...initialPoints].sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y)
    
    newSteps.push({ hull: [], active: null, msg: "Сортируем точки по координате X." })

    const crossProduct = (a: Point, b: Point, c: Point) => {
      return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
    }

    const upper: Point[] = []
    for (const p of sorted) {
      while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        const removed = upper.pop()!
        newSteps.push({ hull: [...upper], active: p, msg: `Удаляем точку ${removed.id}: поворот не в ту сторону.` })
      }
      upper.push(p)
      newSteps.push({ hull: [...upper], active: p, msg: `Добавляем точку ${p.id} в верхнюю оболочку.` })
    }

    const lower: Point[] = []
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i]
      while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        const removed = lower.pop()!
        newSteps.push({ hull: [...upper, ...lower], active: p, msg: `Удаляем точку ${removed.id}: поворот не в ту сторону.` })
      }
      lower.push(p)
      newSteps.push({ hull: [...upper, ...lower], active: p, msg: `Добавляем точку ${p.id} в нижнюю оболочку.` })
    }

    // Combine
    upper.pop()
    lower.pop()
    const fullHull = [...upper, ...lower]
    newSteps.push({ hull: fullHull, active: null, msg: "Построение выпуклой оболочки завершено!" })

    return newSteps
  }, [initialPoints])

  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentStep(0)
     
    setIsPlaying(false)
  }, [steps])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      if (currentStep < steps.length - 1) {
        interval = setInterval(() => setCurrentStep(s => s + 1), 1000)
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsPlaying(false)
      }
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, steps.length])

  const step = steps[currentStep] || { hull: [], active: null, msg: "" }

  const pathD = useMemo(() => {
    if (step.hull.length === 0) return ""
    let d = `M ${step.hull[0].x} ${step.hull[0].y}`
    for (let i = 1; i < step.hull.length; i++) {
      d += ` L ${step.hull[i].x} ${step.hull[i].y}`
    }
    
    // Add active point if it exists
    if (step.active) {
      d += ` L ${step.active.x} ${step.active.y}`
    } else if (currentStep === steps.length - 1 && step.hull.length > 2) {
      // Close the hull at the final step
      d += ` Z`
    }
    return d
  }, [step, currentStep, steps.length])

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Выпуклая оболочка</h4>
          <p className="text-xs text-muted-foreground mt-1">Алгоритм Эндрю (Monotone Chain)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setCurrentStep(0); setIsPlaying(false); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all", isPlaying ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" : "bg-primary text-primary-foreground shadow-sm hover:opacity-90")}>
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />} {isPlaying ? 'Пауза' : 'Запуск'}
          </button>
          <button onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors" disabled={currentStep === steps.length - 1}><SkipForward className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="relative h-[300px] w-full bg-muted/20 rounded-xl mb-6 flex justify-center items-center border border-border/50">
        <svg width="300" height="280" viewBox="0 0 300 280" className="overflow-visible">
          {/* Points */}
          {initialPoints.map(p => (
            <motion.circle
              key={p.id}
              cx={p.x} cy={p.y} r="5"
              animate={{
                fill: step.active?.id === p.id ? '#f59e0b' : step.hull.find(h => h.id === p.id) ? '#10b981' : '#3f3f46',
                scale: step.active?.id === p.id ? 1.5 : 1
              }}
            />
          ))}
          {/* Labels */}
          {initialPoints.map(p => (
            <text key={`l-${p.id}`} x={p.x} y={p.y - 10} textAnchor="middle" className="fill-muted-foreground text-[8px] font-mono">{p.id}</text>
          ))}
          {/* Hull lines */}
          {pathD && (
            <motion.path
              d={pathD}
              fill={currentStep === steps.length - 1 ? "rgba(16, 185, 129, 0.1)" : "none"}
              stroke="#10b981"
              strokeWidth="2"
              strokeLinejoin="round"
              initial={false}
              animate={{ d: pathD }}
              transition={{ duration: 0.3 }}
            />
          )}
          {/* Active connection */}
          {step.active && step.hull.length >= 1 && (
            <line
              x1={step.hull[step.hull.length-1].x} y1={step.hull[step.hull.length-1].y}
              x2={step.active.x} y2={step.active.y}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          )}
        </svg>
      </div>

      <div className="bg-muted/30 p-4 rounded-xl border border-border/50 font-mono text-xs text-muted-foreground">
        <span className="text-sky-500 font-bold mr-2">LOG:</span>{step.msg}
      </div>
    </div>
  )
}
