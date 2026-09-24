'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause } from 'lucide-react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

interface SortingVisualizerProps {
  initialArray?: number[]
  algorithm?: 'bubble' | 'selection' | 'insertion' | 'quick' | 'merge'
}

export default function SortingVisualizer({ 
  initialArray = [45, 20, 60, 10, 35, 5, 50],
  algorithm = 'bubble' 
}: SortingVisualizerProps) {
  const locale = useLocale()
  const isRu = locale === 'ru'

  const steps = useMemo(() => {
    const newSteps: { array: number[], active: number[], comparing: number[], sorted: number[], pivot?: number }[] = []
    const arr = [...initialArray]
    
    if (algorithm === 'bubble') {
      const n = arr.length
      const tempArr = [...arr]
      newSteps.push({ array: [...tempArr], active: [], comparing: [], sorted: [] })
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          newSteps.push({ array: [...tempArr], active: [j, j + 1], comparing: [j, j + 1], sorted: Array.from({ length: i }, (_, k) => n - 1 - k) })
          if (tempArr[j] > tempArr[j + 1]) {
            [tempArr[j], tempArr[j + 1]] = [tempArr[j + 1], tempArr[j]]
            newSteps.push({ array: [...tempArr], active: [j, j + 1], comparing: [j, j + 1], sorted: Array.from({ length: i }, (_, k) => n - 1 - k) })
          }
        }
      }
      newSteps.push({ array: [...tempArr], active: [], comparing: [], sorted: Array.from({ length: n }, (_, k) => k) })
    } else if (algorithm === 'selection') {
      const n = arr.length
      const tempArr = [...arr]
      newSteps.push({ array: [...tempArr], active: [], comparing: [], sorted: [] })
      for (let i = 0; i < n - 1; i++) {
        let minIdx = i
        for (let j = i + 1; j < n; j++) {
          newSteps.push({ array: [...tempArr], active: [i, j, minIdx], comparing: [j, minIdx], sorted: Array.from({ length: i }, (_, k) => k) })
          if (tempArr[j] < tempArr[minIdx]) minIdx = j
        }
        if (minIdx !== i) [tempArr[i], tempArr[minIdx]] = [tempArr[minIdx], tempArr[i]]
        newSteps.push({ array: [...tempArr], active: [i, minIdx], comparing: [], sorted: Array.from({ length: i + 1 }, (_, k) => k) })
      }
      newSteps.push({ array: [...tempArr], active: [], comparing: [], sorted: Array.from({ length: n }, (_, k) => k) })
    } else if (algorithm === 'insertion') {
      const n = arr.length
      const tempArr = [...arr]
      newSteps.push({ array: [...tempArr], active: [], comparing: [], sorted: [0] })
      for (let i = 1; i < n; i++) {
        const key = tempArr[i]
        let j = i - 1
        newSteps.push({ array: [...tempArr], active: [i], comparing: [], sorted: Array.from({ length: i }, (_, k) => k) })
        while (j >= 0 && tempArr[j] > key) {
          newSteps.push({ array: [...tempArr], active: [j, j + 1], comparing: [j, j + 1], sorted: Array.from({ length: i }, (_, k) => k).filter(x => x !== j + 1) })
          tempArr[j + 1] = tempArr[j]
          j = j - 1
        }
        tempArr[j + 1] = key
        newSteps.push({ array: [...tempArr], active: [j + 1], comparing: [], sorted: Array.from({ length: i + 1 }, (_, k) => k) })
      }
      newSteps.push({ array: [...tempArr], active: [], comparing: [], sorted: Array.from({ length: n }, (_, k) => k) })
    } else if (algorithm === 'quick') {
      const tempArr = [...arr]
      const quickSort = (l: number, r: number) => {
        if (l >= r) return
        const pivotIdx = Math.floor((l + r) / 2)
        const pivot = tempArr[pivotIdx]
        let i = l, j = r
        newSteps.push({ array: [...tempArr], active: [l, r], comparing: [], sorted: [], pivot: pivotIdx })
        while (i <= j) {
          while (tempArr[i] < pivot) i++
          while (tempArr[j] > pivot) j--
          if (i <= j) {
            newSteps.push({ array: [...tempArr], active: [i, j], comparing: [i, j], sorted: [], pivot: pivotIdx })
            ;[tempArr[i], tempArr[j]] = [tempArr[j], tempArr[i]]
            newSteps.push({ array: [...tempArr], active: [i, j], comparing: [i, j], sorted: [], pivot: pivotIdx })
            i++; j--
          }
        }
        quickSort(l, j)
        quickSort(i, r)
      }
      quickSort(0, tempArr.length - 1)
      newSteps.push({ array: [...tempArr], active: [], comparing: [], sorted: Array.from({ length: tempArr.length }, (_, k) => k) })
    } else if (algorithm === 'merge') {
      const tempArr = [...arr]
      const mergeSortSync = (l: number, r: number) => {
        if (l >= r) return
        const mid = Math.floor((l + r) / 2)
        mergeSortSync(l, mid)
        mergeSortSync(mid + 1, r)
        let i = l, j = mid + 1
        const merged = []
        while (i <= mid && j <= r) {
          newSteps.push({ array: [...tempArr], active: [i, j], comparing: [i, j], sorted: [] })
          if (tempArr[i] <= tempArr[j]) merged.push(tempArr[i++])
          else merged.push(tempArr[j++])
        }
        while (i <= mid) {
          newSteps.push({ array: [...tempArr], active: [i], comparing: [i], sorted: [] })
          merged.push(tempArr[i++])
        }
        while (j <= r) {
          newSteps.push({ array: [...tempArr], active: [j], comparing: [j], sorted: [] })
          merged.push(tempArr[j++])
        }
        for (let k = 0; k < merged.length; k++) {
          tempArr[l + k] = merged[k]
          newSteps.push({ array: [...tempArr], active: [l + k], comparing: [], sorted: [] })
        }
      }
      mergeSortSync(0, tempArr.length - 1)
      newSteps.push({ array: [...tempArr], active: [], comparing: [], sorted: Array.from({ length: tempArr.length }, (_, k) => k) })
    }

    return newSteps
  }, [algorithm, initialArray])

  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const speed = 400

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
        const timer = setTimeout(() => {
          setIsPlaying(false)
        }, 0)
        return () => {
          clearInterval(interval)
          clearTimeout(timer)
        }
      }
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, steps.length, speed])

  const step = steps[currentStep] || { array: initialArray, active: [], comparing: [], sorted: [] }

  const algoTitle = algorithm === 'bubble'
    ? (isRu ? 'Пузырьковая сортировка' : 'Bubble Sort')
    : algorithm === 'selection'
    ? (isRu ? 'Сортировка выбором' : 'Selection Sort')
    : algorithm === 'insertion'
    ? (isRu ? 'Сортировка вставками' : 'Insertion Sort')
    : algorithm === 'quick'
    ? (isRu ? 'Быстрая сортировка (QuickSort)' : 'Quick Sort')
    : (isRu ? 'Сортировка слиянием (MergeSort)' : 'Merge Sort')

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            {isRu ? 'Визуализация' : 'Visualization'}: {algoTitle}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Пошаговое исполнение алгоритма' : 'Step-by-step algorithm execution'}
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
              isPlaying 
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" 
                : "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
            )}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isPlaying ? (isRu ? 'Пауза' : 'Pause') : (isRu ? 'Запуск' : 'Play')}
          </button>
          <button
            onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-30"
            title={isRu ? 'Следующий шаг' : 'Next Step'}
            disabled={currentStep === steps.length - 1}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-center gap-2 h-48 mb-8 px-4">
        <AnimatePresence mode="popLayout">
          {step.array.map((val, idx) => {
            const isComparing = step.comparing.includes(idx)
            const isSorted = step.sorted.includes(idx)
            const isPivot = step.pivot === idx
            
            return (
              <motion.div
                key={`${idx}-${val}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  height: `${(val / Math.max(...initialArray)) * 100}%`,
                  backgroundColor: isPivot
                    ? '#8b5cf6'
                    : isComparing 
                      ? '#f59e0b'
                      : isSorted 
                        ? '#10b981'
                        : '#3b82f6',
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-10 rounded-t-lg relative group shadow-sm"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold font-mono text-muted-foreground">
                  {val}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-4 border-t border-border flex-wrap gap-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{isRu ? 'Ожидание' : 'Idle'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{isRu ? 'Сравнение' : 'Comparing'}</span>
          </div>
          {algorithm === 'quick' && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <span>{isRu ? 'Опорный (Pivot)' : 'Pivot'}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{isRu ? 'Отсортировано' : 'Sorted'}</span>
          </div>
        </div>
        <div>
          {isRu ? `Шаг ${currentStep + 1} из ${steps.length}` : `Step ${currentStep + 1} of ${steps.length}`}
        </div>
      </div>
    </div>
  )
}
