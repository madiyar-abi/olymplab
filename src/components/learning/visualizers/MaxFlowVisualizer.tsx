'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function MaxFlowVisualizer() {
  const nodes = [
    { id: 0, x: 50, y: 100, label: 'S' },
    { id: 1, x: 150, y: 40, label: '1' },
    { id: 2, x: 150, y: 160, label: '2' },
    { id: 3, x: 250, y: 100, label: 'T' },
  ]

  const initialEdges = [
    { from: 0, to: 1, cap: 10 },
    { from: 0, to: 2, cap: 5 },
    { from: 1, to: 2, cap: 15 },
    { from: 1, to: 3, cap: 5 },
    { from: 2, to: 3, cap: 10 },
  ]

  const steps = useMemo(() => {
    const newSteps: { 
      flow: Record<string, number>, 
      path: number[] | null, 
      activeEdge: {from: number, to: number} | null,
      msg: string,
      totalFlow: number
    }[] = []

    const currentFlow: Record<string, number> = {}
    initialEdges.forEach((_, i) => currentFlow[i] = 0)
    let totalMaxFlow = 0

    newSteps.push({ flow: { ...currentFlow }, path: null, activeEdge: null, msg: "Находим максимальный поток из S в T.", totalFlow: 0 })

    const findPath = (f: Record<string, number>): { path: number[], edgeIndices: number[], minCap: number } | null => {
      // Simple BFS for augmenting path
      const q: { node: number, path: number[], edgeIndices: number[], minCap: number }[] = [{ node: 0, path: [0], edgeIndices: [], minCap: Infinity }]
      const visited = new Set([0])
      
      while (q.length > 0) {
        const { node, path, edgeIndices, minCap } = q.shift()!
        if (node === 3) return { path, edgeIndices, minCap }
        
        initialEdges.forEach((e, idx) => {
          if (e.from === node && !visited.has(e.to) && e.cap - f[idx] > 0) {
            visited.add(e.to)
            q.push({ 
              node: e.to, 
              path: [...path, e.to], 
              edgeIndices: [...edgeIndices, idx], 
              minCap: Math.min(minCap, e.cap - f[idx]) 
            })
          }
          // Note: Simple visualizer doesn't show reverse edges for simplicity of UI
        })
      }
      return null
    }

    let augmentingPath = findPath(currentFlow)
    while (augmentingPath) {
      const { path, edgeIndices, minCap } = augmentingPath
      newSteps.push({ flow: { ...currentFlow }, path, activeEdge: null, msg: `Найден увеличивающий путь: ${path.join(' -> ')} с пропускной способностью ${minCap}`, totalFlow: totalMaxFlow })
      
      edgeIndices.forEach(idx => {
        currentFlow[idx] += minCap
        newSteps.push({ flow: { ...currentFlow }, path, activeEdge: { from: initialEdges[idx].from, to: initialEdges[idx].to }, msg: `Увеличиваем поток по ребру (${initialEdges[idx].from} -> ${initialEdges[idx].to}) на ${minCap}`, totalFlow: totalMaxFlow })
      })
      
      totalMaxFlow += minCap
      newSteps.push({ flow: { ...currentFlow }, path: null, activeEdge: null, msg: `Текущий суммарный поток: ${totalMaxFlow}`, totalFlow: totalMaxFlow })
      
      augmentingPath = findPath(currentFlow)
    }

    newSteps.push({ flow: { ...currentFlow }, path: null, activeEdge: null, msg: `Поиск завершен. Максимальный поток = ${totalMaxFlow}`, totalFlow: totalMaxFlow })

    return newSteps
  }, [])

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
            Максимальный поток (Max Flow)
          </h4>
          <p className="text-xs text-muted-foreground mt-1">Алгоритм Эдмондса-Карпа (BFS для поиска путей)</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => { setCurrentStep(0); setIsPlaying(false); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all", isPlaying ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" : "bg-primary text-primary-foreground shadow-sm hover:opacity-90")}>
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />} {isPlaying ? 'Пауза' : 'Запуск'}
          </button>
          <button onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors" disabled={currentStep === steps.length - 1}><SkipForward className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="relative h-[220px] w-full flex justify-center mb-8 bg-muted/20 rounded-xl pt-4">
        <svg width="300" height="200" viewBox="0 0 300 200" className="overflow-visible">
          {/* Edges */}
          {initialEdges.map((edge, i) => {
            const f = nodes.find(n => n.id === edge.from)!
            const t = nodes.find(n => n.id === edge.to)!
            const flow = step.flow[i] || 0
            const isPath = step.path?.includes(edge.from) && step.path?.includes(edge.to) && step.path.indexOf(edge.to) === step.path.indexOf(edge.from) + 1
            const isActive = step.activeEdge?.from === edge.from && step.activeEdge?.to === edge.to

            return (
              <g key={i}>
                <line 
                  x1={f.x} y1={f.y} x2={t.x} y2={t.y} 
                  stroke={isActive ? '#f59e0b' : isPath ? '#0ea5e9' : '#3f3f46'} 
                  strokeWidth={isActive ? "4" : "2"} 
                  className="transition-all duration-300" 
                />
                {/* Flow indicator */}
                <rect x={(f.x+t.x)/2 - 15} y={(f.y+t.y)/2 - 8} width="30" height="12" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
                <text x={(f.x+t.x)/2} y={(f.y+t.y)/2+1} textAnchor="middle" className="fill-white text-[7px] font-mono font-bold">
                  {flow}/{edge.cap}
                </text>
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map(node => (
            <g key={node.id}>
              <motion.circle 
                cx={node.x} cy={node.y} r="15" 
                animate={{ 
                  fill: step.path?.includes(node.id) ? '#0ea5e9' : '#18181b', 
                  stroke: step.path?.includes(node.id) ? '#38bdf8' : '#3f3f46' 
                }} 
                strokeWidth="2" 
              />
              <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="middle" className="fill-white text-[10px] font-bold font-mono">
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between">
        <div className="bg-muted/30 p-3 rounded-xl border border-border/50 font-mono text-[11px] text-muted-foreground flex-1 mr-4">
          <span className="text-sky-500 font-bold mr-2">LOG:</span>{step.msg}
        </div>
        <div className="bg-sky-500/10 border border-sky-500/30 p-3 rounded-xl min-w-[120px] text-center">
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Total Flow</div>
          <div className="text-xl font-black text-sky-500 font-mono">{step.totalFlow}</div>
        </div>
      </div>
    </div>
  )
}
