'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause, Zap } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useTheme } from '@/components/shared/ThemeProvider'
import { cn } from '@/lib/utils'

const NODES = [
  { id: 0, x: 50, y: 100, label: 'S' },
  { id: 1, x: 150, y: 40, label: '1' },
  { id: 2, x: 150, y: 160, label: '2' },
  { id: 3, x: 250, y: 100, label: 'T' },
]

const INITIAL_EDGES = [
  { from: 0, to: 1, cap: 10 },
  { from: 0, to: 2, cap: 5 },
  { from: 1, to: 2, cap: 15 },
  { from: 1, to: 3, cap: 5 },
  { from: 2, to: 3, cap: 10 },
]

export default function MaxFlowVisualizer() {
  const locale = useLocale()
  const isRu = locale === 'ru'
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const steps = useMemo(() => {
    const newSteps: { 
      flow: Record<string, number>, 
      path: number[] | null, 
      activeEdge: {from: number, to: number} | null,
      msg: string,
      totalFlow: number
    }[] = []

    const currentFlow: Record<string, number> = {}
    INITIAL_EDGES.forEach((_, i) => currentFlow[i] = 0)
    let totalMaxFlow = 0

    newSteps.push({ 
      flow: { ...currentFlow }, 
      path: null, 
      activeEdge: null, 
      msg: isRu ? "Находим максимальный поток из S в T." : "Finding maximum flow from S to T.", 
      totalFlow: 0 
    })

    const findPath = (f: Record<string, number>): { path: number[], edgeIndices: number[], minCap: number } | null => {
      const q: { node: number, path: number[], edgeIndices: number[], minCap: number }[] = [{ node: 0, path: [0], edgeIndices: [], minCap: Infinity }]
      const visited = new Set([0])
      
      while (q.length > 0) {
        const { node, path, edgeIndices, minCap } = q.shift()!
        if (node === 3) return { path, edgeIndices, minCap }
        
        INITIAL_EDGES.forEach((e, idx) => {
          if (e.from === node && !visited.has(e.to) && e.cap - f[idx] > 0) {
            visited.add(e.to)
            q.push({ 
              node: e.to, 
              path: [...path, e.to], 
              edgeIndices: [...edgeIndices, idx], 
              minCap: Math.min(minCap, e.cap - f[idx]) 
            })
          }
        })
      }
      return null
    }

    let augmentingPath = findPath(currentFlow)
    while (augmentingPath) {
      const { path, edgeIndices, minCap } = augmentingPath
      newSteps.push({ 
        flow: { ...currentFlow }, 
        path, 
        activeEdge: null, 
        msg: isRu 
          ? `Найден увеличивающий путь: ${path.join(' -> ')} с пропускной способностью ${minCap}` 
          : `Found augmenting path: ${path.join(' -> ')} with residual capacity ${minCap}`, 
        totalFlow: totalMaxFlow 
      })
      
      edgeIndices.forEach(idx => {
        currentFlow[idx] += minCap
        newSteps.push({ 
          flow: { ...currentFlow }, 
          path, 
          activeEdge: { from: INITIAL_EDGES[idx].from, to: INITIAL_EDGES[idx].to }, 
          msg: isRu 
            ? `Увеличиваем поток по ребру (${INITIAL_EDGES[idx].from} -> ${INITIAL_EDGES[idx].to}) на ${minCap}` 
            : `Augmenting flow on edge (${INITIAL_EDGES[idx].from} -> ${INITIAL_EDGES[idx].to}) by ${minCap}`, 
          totalFlow: totalMaxFlow 
        })
      })
      
      totalMaxFlow += minCap
      newSteps.push({ 
        flow: { ...currentFlow }, 
        path: null, 
        activeEdge: null, 
        msg: isRu ? `Текущий суммарный поток: ${totalMaxFlow}` : `Current total flow: ${totalMaxFlow}`, 
        totalFlow: totalMaxFlow 
      })
      
      augmentingPath = findPath(currentFlow)
    }

    newSteps.push({ 
      flow: { ...currentFlow }, 
      path: null, 
      activeEdge: null, 
      msg: isRu ? `Поиск завершен. Максимальный поток = ${totalMaxFlow}` : `Completed. Maximum flow = ${totalMaxFlow}`, 
      totalFlow: totalMaxFlow 
    })

    return newSteps
  }, [isRu])

  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

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
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            {isRu ? 'Максимальный поток (Max Flow)' : 'Max Flow'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Алгоритм Эдмондса-Карпа (BFS для поиска путей)' : 'Edmonds-Karp Algorithm (BFS pathfinding)'}
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

      <div className="relative h-[220px] w-full flex justify-center mb-8 bg-muted/20 rounded-xl pt-4">
        <svg width="300" height="200" viewBox="0 0 300 200" className="overflow-visible">
          {/* Edges */}
          {INITIAL_EDGES.map((edge, i) => {
            const f = NODES.find(n => n.id === edge.from)!
            const t = NODES.find(n => n.id === edge.to)!
            const flow = step.flow[i] || 0
            const isPath = step.path?.includes(edge.from) && step.path?.includes(edge.to) && step.path.indexOf(edge.to) === step.path.indexOf(edge.from) + 1
            const isActive = step.activeEdge?.from === edge.from && step.activeEdge?.to === edge.to

            return (
              <g key={i}>
                <line 
                  x1={f.x} y1={f.y} x2={t.x} y2={t.y} 
                  stroke={isActive ? '#f59e0b' : isPath ? '#0ea5e9' : (isDark ? '#3f3f46' : '#cbd5e1')} 
                  strokeWidth={isActive ? "4" : "2"} 
                  className="transition-all duration-300" 
                />
                {/* Flow indicator */}
                <rect 
                  x={(f.x+t.x)/2 - 15} 
                  y={(f.y+t.y)/2 - 8} 
                  width="30" 
                  height="12" 
                  rx="4" 
                  fill={isDark ? "#18181b" : "#ffffff"} 
                  stroke={isDark ? "#3f3f46" : "#cbd5e1"} 
                  strokeWidth="1" 
                />
                <text 
                  x={(f.x+t.x)/2} 
                  y={(f.y+t.y)/2+1} 
                  textAnchor="middle" 
                  className={cn("text-[7px] font-mono font-bold", isDark ? "fill-white" : "fill-zinc-800")}
                >
                  {flow}/{edge.cap}
                </text>
              </g>
            )
          })}

          {/* Nodes */}
          {NODES.map(node => {
            const isInPath = step.path?.includes(node.id)
            return (
              <g key={node.id}>
                <motion.circle 
                  cx={node.x} cy={node.y} r="15" 
                  animate={{ 
                    fill: isInPath ? '#0ea5e9' : (isDark ? '#18181b' : '#f4f4f5'), 
                    stroke: isInPath ? '#38bdf8' : (isDark ? '#3f3f46' : '#cbd5e1') 
                  }} 
                  strokeWidth="2" 
                />
                <text 
                  x={node.x} 
                  y={node.y} 
                  textAnchor="middle" 
                  dominantBaseline="middle" 
                  className={cn("text-[10px] font-bold font-mono", isInPath ? "fill-white" : (isDark ? "fill-white" : "fill-zinc-800"))}
                >
                  {node.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="bg-muted/30 p-4 rounded-xl border border-border font-mono text-xs text-muted-foreground flex justify-between items-center">
        <div><span className="text-sky-500 font-bold mr-2">LOG:</span>{step.msg}</div>
        <div className="text-xs font-bold text-foreground shrink-0 ml-4">
          {isRu ? 'Поток:' : 'Flow:'} <span className="text-amber-500">{step.totalFlow}</span>
        </div>
      </div>
    </div>
  )
}
