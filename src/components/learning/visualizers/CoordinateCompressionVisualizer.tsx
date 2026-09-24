'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause, ArrowRight } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useTheme } from '@/components/shared/ThemeProvider'
import { cn } from '@/lib/utils'

export default function CoordinateCompressionVisualizer({ 
  initialArray = [100, 500, 100, 1000, 500, 250] 
}) {
  const locale = useLocale()
  const isRu = locale === 'ru'
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const steps = useMemo(() => {
    const newSteps: { 
      array: number[], 
      sortedUnique: number[], 
      mapping: Record<number, number>, 
      compressed: number[],
      activeIndices: number[],
      activeUnique: number | null,
      msg: string,
      phase: 'original' | 'sort' | 'unique' | 'map' | 'final'
    }[] = []

    const original = [...initialArray]
    newSteps.push({ 
      array: original, sortedUnique: [], mapping: {}, compressed: [], 
      activeIndices: [], activeUnique: null,
      msg: isRu 
        ? "Оригинальный массив с большими или разреженными значениями." 
        : "Original array containing large or sparse values.",
      phase: 'original'
    })

    const sorted = [...original].sort((a, b) => a - b)
    newSteps.push({ 
      array: original, sortedUnique: sorted, mapping: {}, compressed: [], 
      activeIndices: [], activeUnique: null,
      msg: isRu 
        ? "Шаг 1: Сортируем все элементы массива." 
        : "Step 1: Sort all elements of the array in ascending order.",
      phase: 'sort'
    })

    const unique = Array.from(new Set(sorted))
    newSteps.push({ 
      array: original, sortedUnique: unique, mapping: {}, compressed: [], 
      activeIndices: [], activeUnique: null,
      msg: isRu 
        ? "Шаг 2: Удаляем дубликаты. Получаем уникальные значения в порядке возрастания." 
        : "Step 2: Remove duplicates to obtain unique values in ascending order.",
      phase: 'unique'
    })

    const mapping: Record<number, number> = {}
    unique.forEach((val, idx) => {
      mapping[val] = idx
      newSteps.push({ 
        array: original, sortedUnique: unique, mapping: { ...mapping }, compressed: [], 
        activeIndices: [], activeUnique: val,
        msg: isRu 
          ? `Шаг 3: Сопоставляем значение ${val} с индексом ${idx}.` 
          : `Step 3: Map value ${val} to coordinate index ${idx}.`,
        phase: 'map'
      })
    })

    const compressed: number[] = []
    original.forEach((val, idx) => {
      compressed.push(mapping[val])
      newSteps.push({ 
        array: original, sortedUnique: unique, mapping, compressed: [...compressed], 
        activeIndices: [idx], activeUnique: val,
        msg: isRu 
          ? `Шаг 4: Заменяем ${val} на его сжатый индекс ${mapping[val]}.` 
          : `Step 4: Replace ${val} with its compressed index ${mapping[val]}.`,
        phase: 'final'
      })
    })

    return newSteps
  }, [initialArray, isRu])

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
        interval = setInterval(() => setCurrentStep(s => s + 1), 1000)
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
            {isRu ? 'Сжатие координат' : 'Coordinate Compression'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu 
              ? 'Отображение больших значений в малый диапазон [0, N-1]' 
              : 'Map large values into a compact range [0, N-1]'}
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

      <div className="space-y-8">
        {/* Original / Compressed Array */}
        <div>
          <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-3">
            {isRu ? 'Массив' : 'Array'}
          </h5>
          <div className="flex gap-2 flex-wrap min-h-[120px] items-start">
            {step.array.map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{ 
                    backgroundColor: step.activeIndices.includes(idx) ? '#0ea5e9' : (isDark ? '#18181b' : '#f4f4f5'),
                    borderColor: step.activeIndices.includes(idx) ? '#38bdf8' : (isDark ? '#3f3f46' : '#e4e4e7'),
                    color: step.activeIndices.includes(idx) ? '#ffffff' : 'inherit',
                    scale: step.activeIndices.includes(idx) ? 1.1 : 1
                  }}
                  className="w-14 h-14 rounded-lg border flex items-center justify-center text-[11px] font-bold font-mono text-foreground shadow-inner"
                >
                  {val}
                </motion.div>
                {step.compressed[idx] !== undefined && (
                  <>
                    <ArrowRight className="w-3 h-3 text-muted-foreground rotate-90" />
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center text-[10px] font-bold font-mono text-white shadow-lg"
                    >
                      {step.compressed[idx]}
                    </motion.div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sorted Unique */}
        <div className="min-h-[80px]">
          <AnimatePresence mode="wait">
            {step.sortedUnique.length > 0 && (
              <motion.div 
                key="unique-vals"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 10 }}
              >
                <h5 className="text-[10px] font-bold text-amber-500/80 uppercase mb-3">
                  {isRu ? 'Уникальные значения (Sorted)' : 'Unique Values (Sorted)'}
                </h5>
                <div className="flex gap-2 flex-wrap">
                  {step.sortedUnique.map((val, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <motion.div
                        animate={{ 
                          backgroundColor: step.activeUnique === val ? '#f59e0b' : (isDark ? '#27272a' : '#f4f4f5'),
                          borderColor: step.activeUnique === val ? '#fbbf24' : (isDark ? '#3f3f46' : '#e4e4e7'),
                          color: step.activeUnique === val ? '#000000' : 'inherit'
                        }}
                        className="px-3 py-1.5 rounded border text-[10px] font-bold font-mono text-foreground"
                      >
                        {val}
                      </motion.div>
                      <span className="text-[9px] text-muted-foreground font-mono">idx: {idx}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-muted/30 p-4 rounded-xl border border-border font-mono text-xs text-muted-foreground min-h-[60px] flex items-center">
          <span className="text-sky-500 font-bold mr-2">LOG:</span>{step.msg}
        </div>
      </div>
    </div>
  )
}
