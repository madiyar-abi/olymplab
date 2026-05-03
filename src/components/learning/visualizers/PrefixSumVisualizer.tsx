'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Plus, Search, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PrefixSumVisualizer({ initialArray = [3, 1, 4, 1, 5, 9, 2] }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [range, setRange] = useState<{ l: number, r: number } | null>(null)
  
  const prefixSum = useMemo(() => {
    const sums = [0]
    let current = 0
    for (const val of initialArray) {
      current += val
      sums.push(current)
    }
    return sums
  }, [initialArray])

  const handleRangeQuery = () => {
    if (range) {
      setRange(null)
    } else {
      setRange({ l: 2, r: 5 })
    }
  }

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Визуализация: Префиксные суммы
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Построение массива <span className="font-mono font-bold text-sky-500">P[i] = P[i-1] + A[i-1]</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCurrentStep(0); setRange(null); }}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            title="Сброс"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {currentStep === initialArray.length && (
            <button
              onClick={handleRangeQuery}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                range ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" : "bg-sky-500 text-white"
              )}
            >
              <Search className="w-4 h-4" />
              {range ? "Скрыть запрос" : "Запрос на отрезке"}
            </button>
          )}
          <button
            onClick={() => setCurrentStep(s => Math.min(initialArray.length, s + 1))}
            disabled={currentStep === initialArray.length}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Добавить элемент
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {/* Original Array */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-3 block">Исходный массив A</label>
          <div className="flex gap-2">
            {initialArray.map((val, idx) => {
              const inRange = range && idx >= range.l && idx <= range.r
              return (
                <div
                  key={idx}
                  className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-lg border-2 font-mono font-bold transition-all relative",
                    inRange ? "border-amber-500 bg-amber-500/20 text-amber-500 scale-105 z-10" :
                    idx === currentStep ? "border-amber-500 bg-amber-500/10 text-amber-500 scale-110" : 
                    idx < currentStep ? "border-emerald-500/50 text-emerald-500/70" : "border-border text-muted-foreground"
                  )}
                >
                  {val}
                  <span className="absolute -top-5 text-[8px] text-muted-foreground/50">{idx}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Prefix Sum Array */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase mb-3 block">Массив префиксов P</label>
          <div className="flex gap-2">
            {prefixSum.map((val, idx) => {
              const isR = range && idx === range.r + 1
              const isLminus1 = range && idx === range.l
              
              return (
                <motion.div
                  key={idx}
                  initial={false}
                  animate={{ 
                    opacity: idx <= currentStep ? 1 : 0.2,
                    scale: idx === currentStep || isR || isLminus1 ? 1.1 : 1,
                    backgroundColor: isR ? '#f59e0b' : isLminus1 ? '#ef4444' : idx === currentStep ? '#0ea5e9' : 'transparent',
                    borderColor: isR ? '#f59e0b' : isLminus1 ? '#ef4444' : idx === currentStep ? '#0ea5e9' : '#3f3f46',
                    color: idx === currentStep || isR || isLminus1 ? '#ffffff' : 'inherit'
                  }}
                  className={cn(
                    "w-12 h-12 flex flex-col items-center justify-center rounded-lg border-2 font-mono font-bold transition-all relative"
                  )}
                >
                  <span className="text-[8px] opacity-50 absolute -top-5">{idx}</span>
                  {val}
                  {idx === currentStep && currentStep > 0 && !range && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-8 whitespace-nowrap text-[10px] text-sky-500 font-bold"
                    >
                      {prefixSum[idx-1]} + {initialArray[idx-1]} = {val}
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {range && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-12 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-500 mt-1" />
              <div>
                <p className="text-sm font-medium text-foreground">Запрос: Сумма на отрезке [{range.l}, {range.r}]</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  Sum(A[{range.l}..{range.r}]) = P[{range.r + 1}] - P[{range.l}] = {prefixSum[range.r + 1]} - {prefixSum[range.l]} = <span className="text-emerald-500 font-bold">{prefixSum[range.r + 1] - prefixSum[range.l]}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

