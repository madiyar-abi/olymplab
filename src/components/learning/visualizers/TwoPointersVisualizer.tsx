'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useTheme } from '@/components/shared/ThemeProvider'
import { cn } from '@/lib/utils'

export default function TwoPointersVisualizer({ initialArray = [1, 3, 2, 5, 1, 1, 2, 3], targetSum = 8 }) {
  const locale = useLocale()
  const isRu = locale === 'ru'
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const steps = useMemo(() => {
    const newSteps: { l: number, r: number, currentSum: number, found: boolean, msg: string }[] = []
    let l = 0
    let r = 0
    let currentSum = 0

    newSteps.push({ 
      l: 0, 
      r: 0, 
      currentSum: 0, 
      found: false, 
      msg: isRu 
        ? `Ищем сумму ${targetSum}. Начинаем с L=0, R=0.` 
        : `Searching for sum ${targetSum}. Starting at L=0, R=0.` 
    })

    while (r < initialArray.length || currentSum >= targetSum) {
      if (currentSum === targetSum) {
        newSteps.push({ 
          l, 
          r, 
          currentSum, 
          found: true, 
          msg: isRu 
            ? `Нашли сумму ${targetSum} на отрезке [${l}, ${r-1}]!` 
            : `Found sum ${targetSum} on segment [${l}, ${r-1}]!` 
        })
        break
      }

      if (currentSum < targetSum && r < initialArray.length) {
        currentSum += initialArray[r]
        newSteps.push({ 
          l, 
          r: r + 1, 
          currentSum, 
          found: false, 
          msg: isRu 
            ? `Сумма ${currentSum - initialArray[r]} < ${targetSum}. Сдвигаем R вправо (+${initialArray[r]}). Текущая сумма: ${currentSum}` 
            : `Sum ${currentSum - initialArray[r]} < ${targetSum}. Shift R right (+${initialArray[r]}). Current sum: ${currentSum}` 
        })
        r++
      } else {
        currentSum -= initialArray[l]
        newSteps.push({ 
          l: l + 1, 
          r, 
          currentSum, 
          found: false, 
          msg: isRu 
            ? `Сумма ${currentSum + initialArray[l]} > ${targetSum}. Сдвигаем L вправо (-${initialArray[l]}). Текущая сумма: ${currentSum}` 
            : `Sum ${currentSum + initialArray[l]} > ${targetSum}. Shift L right (-${initialArray[l]}). Current sum: ${currentSum}` 
        })
        l++
      }
    }

    if (currentSum !== targetSum && !newSteps[newSteps.length - 1].found) {
      newSteps.push({ 
        l, 
        r, 
        currentSum, 
        found: false, 
        msg: isRu ? "Сумма не найдена." : "Sum not found." 
      })
    }

    return newSteps
  }, [initialArray, targetSum, isRu])

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

  const step = steps[currentStep] || { l: 0, r: 0, currentSum: 0, found: false, msg: "" }

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            {isRu ? 'Два указателя' : 'Two Pointers'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            {isRu ? 'Поиск подмассива с суммой' : 'Find subarray with sum'}{' '}
            <span className="px-2 py-0.5 rounded bg-secondary font-mono font-bold text-sky-500">{targetSum}</span>
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

      <div className="relative pt-12 pb-16 flex justify-center flex-wrap gap-2 overflow-x-auto">
        {initialArray.map((val, idx) => {
          const inWindow = idx >= step.l && idx < step.r
          const isL = idx === step.l
          const isR = idx === step.r

          return (
            <div key={idx} className="relative">
              {isL && (
                <motion.div layoutId="ptr-L" className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="text-[10px] text-emerald-500 font-bold">L</span>
                  <div className="w-0.5 h-4 bg-emerald-500" />
                </motion.div>
              )}
              {isR && (
                <motion.div layoutId="ptr-R" className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-sky-500" />
                  <span className="text-[10px] text-sky-500 font-bold">R</span>
                </motion.div>
              )}
              <motion.div
                animate={{
                  backgroundColor: step.found && inWindow ? '#10b981' : inWindow ? (isDark ? '#0ea5e925' : '#e0f2fe') : (isDark ? '#18181b' : '#f4f4f5'),
                  borderColor: step.found && inWindow ? '#10b981' : inWindow ? '#0ea5e9' : (isDark ? '#3f3f46' : '#e4e4e7'),
                  color: step.found && inWindow ? '#ffffff' : (inWindow ? (isDark ? '#38bdf8' : '#0284c7') : 'inherit')
                }}
                className="w-12 h-12 flex items-center justify-center rounded-lg border text-sm font-mono font-bold transition-colors"
              >
                {val}
              </motion.div>
            </div>
          )
        })}
        {/* Render R pointer if it's past the end */}
        {step.r === initialArray.length && (
           <div className="relative w-12 h-12 flex items-center justify-center">
             <motion.div layoutId="ptr-R" className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-0.5 h-4 bg-sky-500" />
                <span className="text-[10px] text-sky-500 font-bold">R</span>
              </motion.div>
           </div>
        )}
      </div>

      <div className="bg-muted/30 p-4 rounded-xl border border-border/50 font-mono text-xs space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{isRu ? 'Текущая сумма:' : 'Current sum:'}</span>
          <span className={cn("font-bold", step.currentSum === targetSum ? "text-emerald-500" : step.currentSum > targetSum ? "text-red-500" : "text-sky-500")}>
            {step.currentSum}
          </span>
        </div>
        <div className="flex justify-between border-t border-border/50 pt-2">
          <span className="text-muted-foreground">{isRu ? 'Действие:' : 'Action:'}</span>
          <span className="text-foreground">{step.msg}</span>
        </div>
      </div>
    </div>
  )
}
