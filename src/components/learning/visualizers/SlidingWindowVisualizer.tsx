'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SlidingWindowVisualizer() {
  const array = useMemo(() => [4, 2, 1, 7, 8, 1, 2, 8, 1, 0], [])
  const targetSum = 8
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const speed = 1000

  const steps = useMemo(() => {
    const newSteps: { left: number, right: number, sum: number, minLen: number, explanation: string }[] = []
    let left = 0
    let sum = 0
    let minLen = Infinity

    for (let right = 0; right < array.length; right++) {
      sum += array[right]
      newSteps.push({ 
        left, 
        right, 
        sum, 
        minLen: minLen === Infinity ? 0 : minLen, 
        explanation: `Расширяем окно вправо: добавляем ${array[right]}. Текущая сумма: ${sum}` 
      })

      while (sum >= targetSum) {
        minLen = Math.min(minLen, right - left + 1)
        newSteps.push({ 
          left, 
          right, 
          sum, 
          minLen, 
          explanation: `Сумма ${sum} >= ${targetSum}. Обновляем минимальную длину: ${minLen}` 
        })
        
        sum -= array[left]
        left++
        newSteps.push({ 
          left, 
          right, 
          sum, 
          minLen, 
          explanation: `Сжимаем окно слева: вычитаем ${array[left-1]}. Новая сумма: ${sum}` 
        })
      }
    }
    return newSteps
  }, [array, targetSum])

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

  const step = steps[currentStep] || { left: 0, right: -1, sum: 0, minLen: 0, explanation: '' }

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Визуализация: Скользящее окно
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Задача: Найти минимальную длину подмассива с суммой ≥ <span className="text-sky-500 font-bold">{targetSum}</span>
          </p>
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
              isPlaying ? "bg-amber-500/10 text-amber-500" : "bg-sky-500 text-white"
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

      <div className="flex items-end justify-center gap-2 mb-12 h-32">
        {array.map((val, idx) => {
          const inWindow = idx >= step.left && idx <= step.right
          const isLeft = idx === step.left
          const isRight = idx === step.right
          
          return (
            <div key={idx} className="relative flex flex-col items-center flex-1 max-w-[40px]">
              <motion.div
                animate={{ 
                  height: `${(val + 1) * 10}px`,
                  backgroundColor: inWindow ? '#0ea5e9' : '#18181b',
                  borderColor: inWindow ? '#38bdf8' : '#3f3f46',
                  opacity: inWindow ? 1 : 0.3
                }}
                className="w-full rounded-t-lg border-t border-x flex items-center justify-center text-[10px] font-mono font-bold text-white overflow-hidden pt-1"
              >
                {val}
              </motion.div>
              <div className="w-full h-8 bg-muted/50 border border-border flex items-center justify-center text-[10px] font-mono">
                {idx}
              </div>

              <AnimatePresence>
                {isLeft && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -bottom-6 text-[9px] font-black text-sky-500"
                  >
                    L
                  </motion.div>
                )}
                {isRight && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -bottom-10 text-[9px] font-black text-rose-500"
                  >
                    R
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-muted/30 border border-border md:col-span-2">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-sky-500 mt-1" />
            <p className="text-sm text-foreground leading-relaxed">{step.explanation}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sum:</span>
            <span className={step.sum >= targetSum ? "text-emerald-500 font-bold" : "text-white"}>{step.sum}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Min Len:</span>
            <span className="text-sky-400 font-bold">{step.minLen || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
