'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function KnapsackVisualizer() {
  const items = useMemo(() => [
    { w: 2, v: 3 },
    { w: 3, v: 4 },
    { w: 4, v: 5 },
    { w: 5, v: 8 },
  ], [])
  const capacity = 5

  const steps = useMemo(() => {
    const newSteps: { dp: number[][], i: number, j: number, msg: string, activeCells: {i: number, j: number}[] }[] = []
    const currentDp = Array.from({ length: items.length + 1 }, () => new Array(capacity + 1).fill(0))
    
    newSteps.push({ dp: currentDp.map(r => [...r]), i: -1, j: -1, msg: "Инициализация таблицы DP нулями.", activeCells: [] })

    for (let i = 1; i <= items.length; i++) {
      const { w, v } = items[i - 1]
      for (let j = 0; j <= capacity; j++) {
        const prev = currentDp[i - 1][j]
        const activeCells = [{ i: i - 1, j }]
        
        if (j >= w) {
          const take = currentDp[i - 1][j - w] + v
          activeCells.push({ i: i - 1, j: j - w })
          if (take > prev) {
            currentDp[i][j] = take
            newSteps.push({ dp: currentDp.map(r => [...r]), i, j, msg: `Предмет ${i} (w=${w}, v=${v}): берем его. DP[${i}][${j}] = DP[${i-1}][${j-w}] + ${v} = ${take}`, activeCells })
          } else {
            currentDp[i][j] = prev
            newSteps.push({ dp: currentDp.map(r => [...r]), i, j, msg: `Предмет ${i} (w=${w}, v=${v}): не берем. DP[${i}][${j}] = DP[${i-1}][${j}] = ${prev}`, activeCells })
          }
        } else {
          currentDp[i][j] = prev
          newSteps.push({ dp: currentDp.map(r => [...r]), i, j, msg: `Предмет ${i} (w=${w}, v=${v}): слишком тяжелый. DP[${i}][${j}] = DP[${i-1}][${j}] = ${prev}`, activeCells })
        }
      }
    }

    // Backtracking
    let currW = capacity
    const picked: number[] = []
    newSteps.push({ dp: currentDp.map(r => [...r]), i: -1, j: -1, msg: "Начинаем обратный ход для поиска предметов.", activeCells: [] })
    
    for (let i = items.length; i > 0; i--) {
      if (currentDp[i][currW] !== currentDp[i - 1][currW]) {
        picked.push(i)
        const oldW = currW
        currW -= items[i - 1].w
        newSteps.push({ 
          dp: currentDp.map(r => [...r]), 
          i, 
          j: oldW, 
          msg: `Значение изменилось: предмет ${i} был взят. Новый вес: ${currW}`, 
          activeCells: [{ i, j: oldW }, { i: i - 1, j: currW }] 
        })
      } else {
        newSteps.push({ 
          dp: currentDp.map(r => [...r]), 
          i, 
          j: currW, 
          msg: `Значение не изменилось: предмет ${i} не брали.`, 
          activeCells: [{ i, j: currW }, { i: i - 1, j: currW }] 
        })
      }
    }
    
    newSteps.push({ 
      dp: currentDp.map(r => [...r]), 
      i: -1, 
      j: -1, 
      msg: `Готово! Выбранные предметы: ${picked.join(', ')}. Итоговая ценность: ${currentDp[items.length][capacity]}`, 
      activeCells: picked.map(p => ({ i: p, j: 0 })) // Hack to highlight picked items
    })

    return newSteps
  }, [items, capacity])

  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentStep(0)
    }, 0)
    return () => clearTimeout(timer)
  }, [steps])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && currentStep < steps.length - 1) {
      interval = setInterval(() => setCurrentStep((s) => s + 1), 600)
    } else if (isPlaying) {
      setTimeout(() => setIsPlaying(false), 0)
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, steps.length])

  const step = steps[currentStep] || { dp: [], i: -1, j: -1, msg: "", activeCells: [] }

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Задача о рюкзаке (DP)</h4>
          <p className="text-xs text-muted-foreground mt-1">Заполнение таблицы динамики</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setCurrentStep(0); setIsPlaying(false); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all", isPlaying ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" : "bg-primary text-primary-foreground shadow-sm hover:opacity-90")}>
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />} {isPlaying ? 'Пауза' : 'Запуск'}
          </button>
          <button onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors" disabled={currentStep === steps.length - 1}><SkipForward className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse font-mono text-[10px]">
          <thead>
            <tr>
              <th className="p-2 border border-border bg-muted/50">i \ j</th>
              {Array.from({ length: capacity + 1 }, (_, j) => (
                <th key={j} className="p-2 border border-border bg-muted/50">{j}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {step.dp.map((row, i) => (
              <tr key={i}>
                <td className="p-2 border border-border bg-muted/30 font-bold">{i === 0 ? 'Start' : `Itm ${i}`}</td>
                {row.map((val, j) => {
                  const isActive = step.i === i && step.j === j
                  const isDependency = step.activeCells.some(c => c.i === i && c.j === j)
                  return (
                    <motion.td
                      key={j}
                      animate={{
                        backgroundColor: isActive ? '#f59e0b' : isDependency ? '#0ea5e920' : 'transparent',
                        color: isActive ? '#ffffff' : 'inherit',
                      }}
                      className={cn("p-2 border border-border text-center transition-colors", isDependency && "border-sky-500/50")}
                    >
                      {val}
                    </motion.td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-muted/30 p-4 rounded-xl border border-border/50 font-mono text-xs text-muted-foreground"><span className="text-sky-500 font-bold mr-2">LOG:</span>{step.msg}</div>
    </div>
  )
}
