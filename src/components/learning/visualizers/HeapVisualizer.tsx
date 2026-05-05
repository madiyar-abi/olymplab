'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HeapVisualizer() {
  const [heapArray, setHeapArray] = useState<number[]>([90, 70, 80, 40, 50, 60, 30])
  const [inputValue, setInputValue] = useState(95)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const speed = 800

  const steps = useMemo(() => {
    const newSteps: { array: number[], active: number[], comparing: number[], msg: string }[] = []
    const arr = [...heapArray]
    
    newSteps.push({ array: [...arr], active: [], comparing: [], msg: "Начальное состояние кучи" })
    
    // Logic for steps is tricky because we want to show the INSERTION of a NEW element
    // But the component state 'heapArray' already includes it if we are not careful.
    // Let's assume we are visualizing the LAST insertion if it happened, 
    // or just showing the current state if no insertion is active.
    return newSteps
  }, [heapArray])

  // Actually, let's redefine how this works. We want to CLICK 'Insert' and it generates steps for THAT insertion.
  const [visualSteps, setVisualSteps] = useState<{ array: number[], active: number[], comparing: number[], msg: string }[]>([])

  const generateInsertSteps = (val: number) => {
    const newSteps: { array: number[], active: number[], comparing: number[], msg: string }[] = []
    const arr = [...heapArray, val]
    let curr = arr.length - 1
    
    newSteps.push({ array: [...arr], active: [curr], comparing: [], msg: `Вставляем ${val} в конец массива (индекс ${curr})` })

    while (curr > 0) {
      const parent = Math.floor((curr - 1) / 2)
      newSteps.push({ array: [...arr], active: [curr], comparing: [curr, parent], msg: `Сравниваем ${arr[curr]} с родителем ${arr[parent]}` })
      
      if (arr[curr] > arr[parent]) {
        [arr[curr], arr[parent]] = [arr[parent], arr[curr]]
        newSteps.push({ array: [...arr], active: [parent], comparing: [curr, parent], msg: `Sift Up: ${arr[parent]} > ${arr[curr]}, меняем местами` })
        curr = parent
      } else {
        newSteps.push({ array: [...arr], active: [], comparing: [], msg: `${arr[curr]} <= ${arr[parent]}, свойство кучи соблюдено` })
        break
      }
    }
    
    setVisualSteps(newSteps)
    setCurrentStep(0)
    setIsPlaying(true)
    setHeapArray(arr) // Update the base array for next insertion
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

  const step = visualSteps[currentStep] || { array: heapArray, active: [], comparing: [], msg: "Готов к вставке" }

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Визуализация: Max-Heap (Sift Up)
          </h4>
          <p className="text-xs text-muted-foreground mt-1">Процесс вставки нового элемента</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={reset} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><RotateCcw className="w-4 h-4" /></button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            disabled={visualSteps.length === 0}
            className={cn("p-2 rounded-lg transition-colors", isPlaying ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground hover:bg-muted")}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => generateInsertSteps(inputValue)}
            disabled={isPlaying || heapArray.length >= 15}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold bg-emerald-500 text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Вставить {inputValue}
          </button>
        </div>
      </div>

      <div className="relative h-[220px] w-full flex justify-center bg-muted/20 rounded-xl mb-6">
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
                stroke={step.comparing.includes(idx) && step.comparing.includes(parentIdx) ? "#f59e0b" : "#3f3f46"} 
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
                    fill: isActive ? '#10b981' : isComparing ? '#f59e0b' : '#18181b',
                    stroke: isActive ? '#34d399' : isComparing ? '#fbbf24' : '#3f3f46',
                    scale: isActive || isComparing ? 1.2 : 1
                  }}
                  strokeWidth="2"
                />
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" className="fill-white text-[9px] font-bold font-mono">
                  {val}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <span className="text-[10px] font-bold text-muted-foreground uppercase mr-2 self-center">Массив:</span>
          {step.array.map((val, idx) => (
            <div 
              key={idx} 
              className={cn(
                "w-8 h-8 flex items-center justify-center border rounded font-mono text-xs font-bold transition-all",
                step.active.includes(idx) ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" :
                step.comparing.includes(idx) ? "bg-amber-500/20 border-amber-500 text-amber-500" :
                "bg-background border-border text-muted-foreground"
              )}
            >
              {val}
            </div>
          ))}
        </div>
        <div className="bg-muted/30 p-3 rounded-xl border border-border font-mono text-[11px] text-muted-foreground">
          <span className="text-sky-500 font-bold mr-2">LOG:</span>{step.msg}
        </div>
      </div>
    </div>
  )
}

