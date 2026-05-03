'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

type SieveNum = { val: number, state: 'idle' | 'prime' | 'composite' | 'active' }

export default function SieveVisualizer({ limit = 40 }) {
  const steps = useMemo(() => {
    const newSteps: { nums: SieveNum[], p: number | null, msg: string }[] = []
    let currentNums: SieveNum[] = Array.from({ length: limit - 1 }, (_, i) => ({ val: i + 2, state: 'idle' }))
    
    newSteps.push({ nums: [...currentNums], p: null, msg: "Начинаем с первого числа (2)" })

    for (let p = 2; p <= Math.sqrt(limit); p++) {
      const pIdx = currentNums.findIndex(n => n.val === p)
      if (currentNums[pIdx].state === 'idle') {
        // Mark as prime
        currentNums[pIdx] = { ...currentNums[pIdx], state: 'prime' }
        newSteps.push({ nums: [...currentNums], p, msg: `Число ${p} — простое. Вычеркиваем кратные.` })

        for (let i = p * p; i <= limit; i += p) {
          const mIdx = currentNums.findIndex(n => n.val === i)
          if (currentNums[mIdx].state !== 'composite') {
            currentNums[mIdx] = { ...currentNums[mIdx], state: 'active' }
            newSteps.push({ nums: [...currentNums], p, msg: `Вычеркиваем ${i} (кратно ${p})` })
            currentNums[mIdx] = { ...currentNums[mIdx], state: 'composite' }
          }
        }
      }
    }

    // Final state
    currentNums = currentNums.map(n => n.state === 'idle' ? { ...n, state: 'prime' } : n)
    newSteps.push({ nums: [...currentNums], p: null, msg: "Все оставшиеся числа — простые!" })

    return newSteps
  }, [limit])

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
        interval = setInterval(() => {
          setCurrentStep((s) => s + 1)
        }, 600)
      } else {
        setTimeout(() => setIsPlaying(false), 0)
      }
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, steps.length])

  const step = steps[currentStep] || { nums: [], p: null, msg: "" }

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Визуализация: Решето Эратосфена
          </h4>
          <p className="text-xs text-muted-foreground mt-1">Поиск простых чисел до {limit}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
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
            {isPlaying ? 'Пауза' : 'Запуск'}
          </button>
          <button
            onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            disabled={currentStep === steps.length - 1}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-8 sm:grid-cols-10 gap-2 mb-8">
        {step.nums.map((n) => (
          <motion.div
            key={n.val}
            animate={{
              backgroundColor: n.state === 'prime' ? '#10b981' : n.state === 'composite' ? '#3f3f46' : n.state === 'active' ? '#f59e0b' : '#18181b',
              opacity: n.state === 'composite' ? 0.4 : 1,
              scale: n.state === 'active' ? 1.1 : 1,
            }}
            className="h-10 flex items-center justify-center rounded-lg border border-border text-xs font-mono font-bold text-foreground"
          >
            {n.val}
          </motion.div>
        ))}
      </div>

      <div className="bg-muted/30 p-4 rounded-xl border border-border/50 font-mono text-xs text-muted-foreground">
        <span className="text-sky-500 font-bold mr-2">LOG:</span>
        {step.msg}
      </div>
    </div>
  )
}
