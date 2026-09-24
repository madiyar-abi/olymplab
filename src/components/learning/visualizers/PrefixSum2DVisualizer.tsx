'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useTheme } from '@/components/shared/ThemeProvider'
import { cn } from '@/lib/utils'

export default function PrefixSum2DVisualizer({ 
  initialGrid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ] 
}) {
  const locale = useLocale()
  const isRu = locale === 'ru'
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const steps = useMemo(() => {
    const newSteps: { 
      grid: number[][], 
      pref: (number|null)[][], 
      active: { r: number, c: number } | null,
      summing: { r: number, c: number }[],
      msg: string 
    }[] = []

    const R = initialGrid.length
    const C = initialGrid[0].length
    const pref: (number|null)[][] = Array.from({ length: R }, () => new Array(C).fill(null))

    newSteps.push({ 
      grid: initialGrid, 
      pref: pref.map(row => [...row]), 
      active: null, 
      summing: [], 
      msg: isRu 
        ? "Исходная матрица. Будем вычислять префиксные суммы." 
        : "Initial matrix. Computing 2D prefix sums." 
    })

    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const summing: { r: number, c: number }[] = []
        let val = initialGrid[r][c]
        
        if (r > 0) {
          val += (pref[r-1][c] as number)
          summing.push({ r: r - 1, c })
        }
        if (c > 0) {
          val += (pref[r][c-1] as number)
          summing.push({ r, c: c - 1 })
        }
        if (r > 0 && c > 0) {
          val -= (pref[r-1][c-1] as number)
          summing.push({ r: r - 1, c: c - 1 })
        }
        
        pref[r][c] = val
        newSteps.push({ 
          grid: initialGrid, 
          pref: pref.map(row => [...row]), 
          active: { r, c }, 
          summing,
          msg: `P[${r}][${c}] = A[${r}][${c}] ${r>0 ? '+ P['+(r-1)+']['+c+']' : ''} ${c>0 ? '+ P['+r+']['+(c-1)+']' : ''} ${r>0 && c>0 ? '- P['+(r-1)+']['+(c-1)+']' : ''} = ${val}`
        })
      }
    }

    return newSteps
  }, [initialGrid, isRu])

  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

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

  const step = steps[currentStep] || steps[0]

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            {isRu ? '2D Префиксные суммы' : '2D Prefix Sums'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Вычисление суммы прямоугольника (0,0) до (r,c)' : 'Compute rectangle sum from (0,0) to (r,c)'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <div>
          <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-3">
            {isRu ? 'Матрица A' : 'Matrix A'}
          </h5>
          <div className="inline-grid grid-cols-3 gap-1 bg-muted/20 p-2 rounded-lg border border-border/50">
            {initialGrid.flat().map((val, i) => {
              const r = Math.floor(i / 3)
              const c = i % 3
              const isActive = step.active?.r === r && step.active?.c === c
              return (
                <motion.div
                  key={i}
                  animate={{ 
                    backgroundColor: isActive ? '#0ea5e9' : (isDark ? '#18181b' : '#f4f4f5'),
                    borderColor: isActive ? '#38bdf8' : (isDark ? '#3f3f46' : '#e4e4e7'),
                    scale: isActive ? 1.05 : 1
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded border text-[10px] font-bold font-mono text-foreground"
                >
                  {val}
                </motion.div>
              )
            })}
          </div>
        </div>

        <div>
          <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-3">
            {isRu ? 'Префиксные суммы P' : 'Prefix Sums P'}
          </h5>
          <div className="inline-grid grid-cols-3 gap-1 bg-muted/20 p-2 rounded-lg border border-border/50">
            {step.pref.flat().map((val, i) => {
              const r = Math.floor(i / 3)
              const c = i % 3
              const isActive = step.active?.r === r && step.active?.c === c
              const isSumming = step.summing.some(s => s.r === r && s.c === c)
              return (
                <motion.div
                  key={i}
                  animate={{ 
                    backgroundColor: isActive ? '#0ea5e9' : isSumming ? '#f59e0b' : (isDark ? '#18181b' : '#f4f4f5'),
                    borderColor: isActive ? '#38bdf8' : isSumming ? '#fbbf24' : (isDark ? '#3f3f46' : '#e4e4e7'),
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded border text-[10px] font-bold font-mono text-foreground"
                >
                  {val !== null ? val : ''}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-xl border border-border/50 font-mono text-[10px] text-muted-foreground leading-relaxed">
        <span className="text-sky-500 font-bold mr-2 text-xs">FORMULA:</span> {step.msg}
      </div>
    </div>
  )
}
