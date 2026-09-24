'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause } from 'lucide-react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

export default function EuclidVisualizer({ initialA = 105, initialB = 35 }) {
  const locale = useLocale()
  const isRu = locale === 'ru'

  const steps = useMemo(() => {
    const newSteps: { a: number, b: number, msg: string, active: 'a' | 'b' | null }[] = []
    let a = initialA
    let b = initialB
    
    newSteps.push({ 
      a, 
      b, 
      active: null, 
      msg: isRu ? `Находим НОД(${a}, ${b}).` : `Finding GCD(${a}, ${b}).` 
    })

    while (b !== 0) {
      const remainder = a % b
      newSteps.push({ 
        a, 
        b, 
        active: 'a', 
        msg: isRu 
          ? `${a} % ${b} = ${remainder}.` 
          : `${a} mod ${b} = ${remainder}.` 
      })
      a = b
      b = remainder
      newSteps.push({ 
        a, 
        b, 
        active: 'b', 
        msg: isRu 
          ? `Заменяем: теперь a=${a}, b=${b}.` 
          : `Updating values: now a=${a}, b=${b}.` 
      })
    }

    newSteps.push({ 
      a, 
      b, 
      active: null, 
      msg: isRu ? `Готово! НОД = ${a}.` : `Done! GCD = ${a}.` 
    })
    return newSteps
  }, [initialA, initialB, isRu])

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

  const step = steps[currentStep] || { a: initialA, b: initialB, active: null, msg: "" }
  const maxVal = Math.max(initialA, initialB)

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            {isRu ? 'Алгоритм Евклида' : 'Euclidean Algorithm'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Поиск наибольшего общего делителя (НОД)' : 'Greatest Common Divisor (GCD) Calculation'}
          </p>
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
              isPlaying ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" : "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
            )}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />} 
            {isPlaying ? (isRu ? 'Пауза' : 'Pause') : (isRu ? 'Запуск' : 'Play')}
          </button>
          <button 
            onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} 
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors" 
            disabled={currentStep === steps.length - 1}
            title={isRu ? 'Шаг вперед' : 'Step forward'}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 mb-8">
        {/* Bar A */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>{isRu ? 'Число A' : 'Number A'}</span>
            <span className="text-sky-400">{step.a}</span>
          </div>
          <div className="h-8 w-full bg-muted/30 rounded-lg overflow-hidden border border-border relative">
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
            <span>{isRu ? 'Число B' : 'Number B'}</span>
            <span className="text-purple-400">{step.b}</span>
          </div>
          <div className="h-8 w-full bg-muted/30 rounded-lg overflow-hidden border border-border relative">
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

      <div className="bg-muted/30 p-4 rounded-xl border border-border font-mono text-xs text-muted-foreground">
        <span className="text-sky-500 font-bold mr-2">LOG:</span>{step.msg}
      </div>
    </div>
  )
}
