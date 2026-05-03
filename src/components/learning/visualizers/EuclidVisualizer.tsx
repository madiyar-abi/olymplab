'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function EuclidVisualizer({ initialA = 105, initialB = 35 }) {
  const steps = useMemo(() => {
    const newSteps: { a: number, b: number, msg: string, active: 'a' | 'b' | null }[] = []
    let a = initialA
    let b = initialB
    
    newSteps.push({ a, b, active: null, msg: `Находим НОД(${a}, ${b}).` })

    while (b !== 0) {
      const remainder = a % b
      newSteps.push({ a, b, active: 'a', msg: `${a} % ${b} = ${remainder}.` })
      a = b
      b = remainder
      newSteps.push({ a, b, active: 'b', msg: `Заменяем: теперь a=${a}, b=${b}.` })
    }

    newSteps.push({ a, b, active: null, msg: `Готово! НОД = ${a}.` })
    return newSteps
  }, [initialA, initialB])

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
        interval = setInterval(() => setCurrentStep(s => s + 1), 1200)
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsPlaying(false)
      }
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, steps.length])

  const step = steps[currentStep] || { a: initialA, b: initialB, active: null, msg: "" }

  const maxVal = Math.max(initialA, initialB)

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Алгоритм Евклида</h4>
          <p className="text-xs text-muted-foreground mt-1">Поиск наибольшего общего делителя (НОД)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setCurrentStep(0); setIsPlaying(false); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all", isPlaying ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" : "bg-primary text-primary-foreground shadow-sm hover:opacity-90")}>
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />} {isPlaying ? 'Пауза' : 'Запуск'}
          </button>
          <button onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors" disabled={currentStep === steps.length - 1}><SkipForward className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex flex-col gap-6 mb-8">
        {/* Bar A */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>Число A</span>
            <span className="text-sky-400">{step.a}</span>
          </div>
          <div className="h-8 w-full bg-muted/30 rounded-lg overflow-hidden border border-border/50 relative">
            <motion.div
              initial={false}
              animate={{ 
                width: `${(step.a / maxVal) * 100}%`,
                backgroundColor: step.active === 'a' ? '#0ea5e9' : '#38bdf8' 
              }}
              className="h-full shadow-lg"
            />
          </div>
        </div>

        {/* Bar B */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>Число B</span>
            <span className="text-purple-400">{step.b}</span>
          </div>
          <div className="h-8 w-full bg-muted/30 rounded-lg overflow-hidden border border-border/50 relative">
            <motion.div
              initial={false}
              animate={{ 
                width: `${(step.b / maxVal) * 100}%`,
                backgroundColor: step.active === 'b' ? '#a855f7' : '#c084fc' 
              }}
              className="h-full shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-xl border border-border/50 font-mono text-xs text-muted-foreground flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
        <div><span className="text-sky-500 font-bold mr-2">STEP:</span>{step.msg}</div>
      </div>
    </div>
  )
}
