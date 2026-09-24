'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, Pause, Plus } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useTheme } from '@/components/shared/ThemeProvider'
import { cn } from '@/lib/utils'

export default function HeapVisualizer() {
  const locale = useLocale()
  const isRu = locale === 'ru'
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [heapArray, setHeapArray] = useState<number[]>([90, 70, 80, 40, 50, 60, 30])
  const [inputValue, setInputValue] = useState(95)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const speed = 800

  const [visualSteps, setVisualSteps] = useState<{ array: number[], active: number[], comparing: number[], msg: string }[]>([])

  const generateInsertSteps = (val: number) => {
    const newSteps: { array: number[], active: number[], comparing: number[], msg: string }[] = []
    const arr = [...heapArray, val]
    let curr = arr.length - 1
    
    newSteps.push({
      array: [...arr],
      active: [curr],
      comparing: [],
      msg: isRu
        ? `Вставляем ${val} в конец массива (индекс ${curr})`
        : `Inserting ${val} at the end of array (index ${curr})`
    })

    while (curr > 0) {
      const parent = Math.floor((curr - 1) / 2)
      newSteps.push({
        array: [...arr],
        active: [curr],
        comparing: [curr, parent],
        msg: isRu
          ? `Сравниваем ${arr[curr]} с родителем ${arr[parent]}`
          : `Comparing ${arr[curr]} with parent ${arr[parent]}`
      })
      
      if (arr[curr] > arr[parent]) {
        [arr[curr], arr[parent]] = [arr[parent], arr[curr]]
        newSteps.push({
          array: [...arr],
          active: [parent],
          comparing: [curr, parent],
          msg: isRu
            ? `Sift Up: ${arr[parent]} > ${arr[curr]}, меняем местами`
            : `Sift Up: swap elements ${arr[parent]} and ${arr[curr]}`
        })
        curr = parent
      } else {
        newSteps.push({
          array: [...arr],
          active: [],
          comparing: [],
          msg: isRu
            ? `${arr[curr]} <= ${arr[parent]}, свойство кучи соблюдено`
            : `${arr[curr]} <= ${arr[parent]}, heap invariant holds`
        })
        break
      }
    }
    
    setVisualSteps(newSteps)
    setCurrentStep(0)
    setIsPlaying(true)
    setHeapArray(arr)
    setInputValue(v => Math.max(10, (v + 7) % 100))
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && visualSteps.length > 0) {
      if (currentStep < visualSteps.length - 1) {
        interval = setInterval(() => setCurrentStep(s => s + 1), speed)
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
  }, [isPlaying, currentStep, visualSteps.length])

  const step = visualSteps[currentStep] || {
    array: heapArray,
    active: [],
    comparing: [],
    msg: isRu ? "Готов к вставке" : "Ready for insertion"
  }

  const getNodePos = (idx: number) => {
    const level = Math.floor(Math.log2(idx + 1))
    const posInLevel = idx - (Math.pow(2, level) - 1)
    const totalInLevel = Math.pow(2, level)
    const width = 300
    const x = (width / (totalInLevel + 1)) * (posInLevel + 1)
    const y = 40 + level * 50
    return { x, y }
  }

  const reset = () => {
    setHeapArray([90, 70, 80, 40, 50, 60, 30])
    setVisualSteps([])
    setCurrentStep(0)
    setIsPlaying(false)
  }

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            {isRu ? 'Визуализация: Max-Heap (Sift Up)' : 'Visualization: Max-Heap (Sift Up)'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Процесс вставки нового элемента' : 'Process of inserting a new element'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            title={isRu ? 'Сброс' : 'Reset'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            disabled={visualSteps.length === 0}
            className={cn("p-2 rounded-lg transition-colors", isPlaying ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground hover:bg-muted")}
            title={isPlaying ? (isRu ? 'Пауза' : 'Pause') : (isRu ? 'Запуск' : 'Play')}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => generateInsertSteps(inputValue)}
            disabled={isPlaying || heapArray.length >= 15}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold bg-emerald-500 text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> {isRu ? `Вставить ${inputValue}` : `Insert ${inputValue}`}
          </button>
        </div>
      </div>

      <div className="relative h-[220px] w-full flex justify-center bg-muted/20 rounded-xl mb-6 overflow-hidden">
        <svg width="300" height="220" className="overflow-visible">
          {step.array.map((val, idx) => {
            if (idx === 0) return null
            const parentIdx = Math.floor((idx - 1) / 2)
            const parentPos = getNodePos(parentIdx)
            const nodePos = getNodePos(idx)
            return (
              <line 
                key={`line-${idx}-${val}`} 
                x1={parentPos.x} y1={parentPos.y} 
                x2={nodePos.x} y2={nodePos.y} 
                stroke={step.comparing.includes(idx) && step.comparing.includes(parentIdx) ? "#f59e0b" : (isDark ? "#3f3f46" : "#cbd5e1")} 
                strokeWidth="2" 
              />
            )
          })}
          {step.array.map((val, idx) => {
            const pos = getNodePos(idx)
            const isActive = step.active.includes(idx)
            const isComparing = step.comparing.includes(idx)
            return (
              <g key={`node-${idx}-${val}`}>
                <motion.circle
                  layout
                  cx={pos.x} cy={pos.y} r="14"
                  animate={{
                    fill: isActive ? '#10b981' : isComparing ? '#f59e0b' : (isDark ? '#18181b' : '#f4f4f5'),
                    stroke: isActive ? '#34d399' : isComparing ? '#fbbf24' : (isDark ? '#3f3f46' : '#d4d4d8'),
                    scale: isActive || isComparing ? 1.2 : 1
                  }}
                  strokeWidth="2"
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isActive || isComparing ? '#ffffff' : (isDark ? '#ffffff' : '#09090b')}
                  className="text-[9px] font-bold font-mono"
                >
                  {val}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 p-3 bg-muted/40 rounded-lg border border-border">
          <span className="text-[10px] font-bold text-muted-foreground uppercase mr-2 self-center">
            {isRu ? 'Массив:' : 'Array:'}
          </span>
          {step.array.map((val, idx) => (
            <div 
              key={idx} 
              className={cn(
                "w-8 h-8 flex items-center justify-center border rounded font-mono text-xs font-bold transition-all shadow-sm",
                step.active.includes(idx) ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" :
                step.comparing.includes(idx) ? "bg-amber-500/20 border-amber-500 text-amber-500" :
                "bg-background border-border text-foreground"
              )}
            >
              {val}
            </div>
          ))}
        </div>
        <div className="bg-muted/40 p-3 rounded-xl border border-border font-mono text-[11px] text-muted-foreground">
          <span className="text-sky-500 font-bold mr-2">LOG:</span>
          <span className="text-foreground">{step.msg}</span>
        </div>
      </div>
    </div>
  )
}
