'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause, Search, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SegmentTreeVisualizer({ initialArray = [5, 8, 6, 3, 2, 7, 2, 6] }) {
  const [mode, setMode] = useState<'build' | 'query'>('build')
  const [queryRange, setQueryRange] = useState({ l: 2, r: 6 })

  const treeData = useMemo(() => {
    const tree = new Array(initialArray.length * 4).fill(null)
    const bounds = new Array(initialArray.length * 4).fill(null)
    
    const build = (node: number, l: number, r: number) => {
      bounds[node] = { l, r }
      if (l === r) {
        tree[node] = initialArray[l]
        return
      }
      const mid = Math.floor((l + r) / 2)
      build(node * 2, l, mid)
      build(node * 2 + 1, mid + 1, r)
      tree[node] = tree[node * 2] + tree[node * 2 + 1]
    }
    build(1, 0, initialArray.length - 1)
    return { tree, bounds }
  }, [initialArray])

  const steps = useMemo(() => {
    const newSteps: { activeNodes: number[], selectedNodes: number[], skippedNodes: number[], msg: string, tree: (number|null)[] }[] = []
    
    if (mode === 'build') {
      const tree = new Array(initialArray.length * 4).fill(null)
      const build = (node: number, l: number, r: number) => {
        newSteps.push({ activeNodes: [node], selectedNodes: [], skippedNodes: [], msg: `Строим узел ${node} для отрезка [${l}, ${r}]`, tree: [...tree] })
        if (l === r) {
          tree[node] = initialArray[l]
          newSteps.push({ activeNodes: [node], selectedNodes: [], skippedNodes: [], msg: `Лист: узел ${node} = ${tree[node]} (A[${l}])`, tree: [...tree] })
          return
        }
        const mid = Math.floor((l + r) / 2)
        build(node * 2, l, mid)
        build(node * 2 + 1, mid + 1, r)
        tree[node] = tree[node * 2] + tree[node * 2 + 1]
        newSteps.push({ activeNodes: [node, node*2, node*2+1], selectedNodes: [], skippedNodes: [], msg: `Суммируем детей: узел ${node} = ${tree[node*2]} + ${tree[node*2+1]} = ${tree[node]}`, tree: [...tree] })
      }
      build(1, 0, initialArray.length - 1)
      newSteps.push({ activeNodes: [], selectedNodes: [], skippedNodes: [], msg: "Построение дерева отрезков завершено.", tree: [...tree] })
    } else {
      const { tree, bounds } = treeData
      const selected: number[] = []
      const skipped: number[] = []
      
      const query = (node: number, l: number, r: number, qL: number, qR: number): number => {
        newSteps.push({ activeNodes: [node], selectedNodes: [...selected], skippedNodes: [...skipped], msg: `Запрос в узле ${node} [${l}, ${r}] для диапазона [${qL}, ${qR}]`, tree: [...tree] })
        
        if (qL <= l && r <= qR) {
          selected.push(node)
          newSteps.push({ activeNodes: [], selectedNodes: [...selected], skippedNodes: [...skipped], msg: `Узел ${node} [${l}, ${r}] полностью внутри [${qL}, ${qR}]. Берем значение ${tree[node]}.`, tree: [...tree] })
          return tree[node]
        }
        
        if (r < qL || l > qR) {
          skipped.push(node)
          newSteps.push({ activeNodes: [], selectedNodes: [...selected], skippedNodes: [...skipped], msg: `Узел ${node} [${l}, ${r}] полностью вне [${qL}, ${qR}]. Пропускаем.`, tree: [...tree] })
          return 0
        }
        
        const mid = Math.floor((l + r) / 2)
        const leftRes = query(node * 2, l, mid, qL, qR)
        const rightRes = query(node * 2 + 1, mid + 1, r, qL, qR)
        const res = leftRes + rightRes
        newSteps.push({ activeNodes: [node], selectedNodes: [...selected], skippedNodes: [...skipped], msg: `Возвращаемся в узел ${node}. Сумма из поддеревьев: ${res}`, tree: [...tree] })
        return res
      }
      query(1, 0, initialArray.length - 1, queryRange.l, queryRange.r)
    }

    return newSteps
  }, [initialArray, mode, queryRange, treeData])

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
        interval = setInterval(() => setCurrentStep(s => s + 1), 800)
      } else {
        setIsPlaying(false)
      }
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, steps.length])

  const step = steps[currentStep] || { activeNodes: [], selectedNodes: [], skippedNodes: [], msg: "", tree: [] }

  const getNodePos = (node: number) => {
    const level = Math.floor(Math.log2(node))
    const posInLevel = node - Math.pow(2, level)
    const totalInLevel = Math.pow(2, level)
    const width = 800
    const x = (width / (totalInLevel + 1)) * (posInLevel + 1)
    const y = 40 + level * 60
    return { x, y }
  }

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* ... (header same) */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Дерево отрезков: {mode === 'build' ? 'Построение' : 'Запрос'}
          </h4>
          <div className="flex items-center gap-3 mt-1">
             <div className="flex bg-muted rounded-lg p-0.5">
               <button onClick={() => setMode('build')} className={cn("px-2 py-0.5 text-[10px] font-bold rounded-md transition-all", mode === 'build' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>BUILD</button>
               <button onClick={() => setMode('query')} className={cn("px-2 py-0.5 text-[10px] font-bold rounded-md transition-all", mode === 'query' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>QUERY</button>
             </div>
             {mode === 'query' && (
               <span className="text-[10px] text-muted-foreground font-mono">Range: [{queryRange.l}, {queryRange.r}]</span>
             )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setCurrentStep(0); setIsPlaying(false); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all", isPlaying ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" : "bg-sky-500 text-white shadow-sm hover:opacity-90")}>
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />} {isPlaying ? 'Пауза' : 'Запуск'}
          </button>
          <button onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors" disabled={currentStep === steps.length - 1}><SkipForward className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="relative h-[300px] w-full flex justify-center bg-muted/20 rounded-xl mb-6 overflow-x-auto pt-4">
        <svg width="800" height="280" viewBox="0 0 800 280" className="overflow-visible min-w-[800px]">
          {treeData.tree.map((val, idx) => {
            if (val === null || idx === 1) return null
            const parentIdx = Math.floor(idx / 2)
            const parentPos = getNodePos(parentIdx)
            const nodePos = getNodePos(idx)
            return (
              <line 
                key={`line-${idx}`} 
                x1={parentPos.x} y1={parentPos.y} 
                x2={nodePos.x} y2={nodePos.y} 
                stroke={step.selectedNodes.includes(idx) ? "#10b981" : step.activeNodes.includes(idx) ? "#0ea5e9" : "#3f3f46"} 
                strokeWidth={step.selectedNodes.includes(idx) ? "3" : "1.5"}
                className="transition-all duration-300"
              />
            )
          })}
          {treeData.tree.map((val, idx) => {
            if (val === null) return null
            const pos = getNodePos(idx)
            const isActive = step.activeNodes.includes(idx)
            const isSelected = step.selectedNodes.includes(idx)
            const isSkipped = step.skippedNodes.includes(idx)
            
            const displayVal = mode === 'build' ? step.tree[idx] : val
            if (displayVal === null && mode === 'build') return null

            return (
              <g key={`node-${idx}`}>
                <motion.circle
                  cx={pos.x} cy={pos.y} r="15"
                  animate={{
                    fill: isSelected ? '#10b981' : isSkipped ? '#3f3f46' : isActive ? '#0ea5e9' : '#18181b',
                    stroke: isSelected ? '#34d399' : isSkipped ? '#52525b' : isActive ? '#38bdf8' : '#3f3f46',
                    scale: isActive || isSelected ? 1.2 : 1,
                    opacity: isSkipped ? 0.3 : 1
                  }}
                  strokeWidth="2"
                />
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" className="fill-white text-[9px] font-bold font-mono">
                  {displayVal}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 text-[9px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" /> Активный узел</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Выбран для суммы</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#3f3f46] opacity-30" /> Пропущен</div>
        </div>
        <div className="bg-muted/30 p-3 rounded-xl border border-border/50 font-mono text-[11px] text-muted-foreground">
          <span className="text-sky-500 font-bold mr-2">LOG:</span>{step.msg}
        </div>
      </div>
    </div>
  )
}

