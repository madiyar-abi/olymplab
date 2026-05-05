'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GraphNode {
  id: number
  x: number
  y: number
}

interface GraphEdge {
  from: number
  to: number
}

interface GraphVisualizerProps {
  type?: 'bfs' | 'dfs'
}

export default function GraphVisualizer({ type = 'bfs' }: GraphVisualizerProps) {
  const nodes: GraphNode[] = [
    { id: 0, x: 150, y: 50 },
    { id: 1, x: 80, y: 120 },
    { id: 2, x: 220, y: 120 },
    { id: 3, x: 40, y: 200 },
    { id: 4, x: 120, y: 200 },
    { id: 5, x: 180, y: 200 },
    { id: 6, x: 260, y: 200 },
  ]

  const edges: GraphEdge[] = useMemo(() => [
    { from: 0, to: 1 }, { from: 0, to: 2 },
    { from: 1, to: 3 }, { from: 1, to: 4 },
    { from: 2, to: 5 }, { from: 2, to: 6 },
  ], [])

  const steps = useMemo(() => {
    const newSteps: { visited: number[], active: number | null, queue: number[] }[] = []
    
    newSteps.push({ visited: [], active: null, queue: [0] })

    if (type === 'bfs') {
      const q_bfs = [0]
      const discovered = new Set<number>()
      const processed = new Set<number>()
      discovered.add(0)
      
      while (q_bfs.length > 0) {
        newSteps.push({ visited: Array.from(processed), active: null, queue: [...q_bfs] })
        const curr = q_bfs.shift()!
        newSteps.push({ visited: Array.from(processed), active: curr, queue: [...q_bfs] })
        
        const neighbors = edges.filter(e => e.from === curr).map(e => e.to)
        for (const neighbor of neighbors) {
          if (!discovered.has(neighbor)) {
            discovered.add(neighbor)
            q_bfs.push(neighbor)
            newSteps.push({ visited: Array.from(processed), active: curr, queue: [...q_bfs] })
          }
        }
        processed.add(curr)
        newSteps.push({ visited: Array.from(processed), active: null, queue: [...q_bfs] })
      }
    } else {
      const visited_dfs = new Set<number>()
      const processed_dfs = new Set<number>()
      
      const dfs = (curr: number) => {
        visited_dfs.add(curr)
        newSteps.push({ visited: Array.from(processed_dfs), active: curr, queue: [] })
        
        const neighbors = edges.filter(e => e.from === curr).map(e => e.to)
        for (const neighbor of neighbors) {
          if (!visited_dfs.has(neighbor)) {
            dfs(neighbor)
            newSteps.push({ visited: Array.from(processed_dfs), active: curr, queue: [] })
          }
        }
        processed_dfs.add(curr)
        newSteps.push({ visited: Array.from(processed_dfs), active: null, queue: [] })
      }
      dfs(0)
    }

    return newSteps
  }, [type, edges])

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
    if (isPlaying && currentStep < steps.length - 1) {
      interval = setInterval(() => {
        setCurrentStep((s) => s + 1)
      }, 600)
    } else if (isPlaying) {
      const timer = setTimeout(() => {
        setIsPlaying(false)
      }, 0)
      return () => {
        clearInterval(interval)
        clearTimeout(timer)
      }
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, steps.length])

  const step = steps[currentStep] || { visited: [], active: null, queue: [] }

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Визуализация: {type === 'bfs' ? 'Обход в ширину (BFS)' : 'Обход в глубину (DFS)'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">Порядок посещения вершин графа</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
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
            {isPlaying ? 'Пауза' : 'Запуск'}
          </button>
          <button
            onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            disabled={currentStep === steps.length - 1}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative h-[250px] w-full flex justify-center mb-8 bg-muted/20 rounded-xl overflow-hidden pt-4">
        <svg width="300" height="200" viewBox="0 0 300 250" className="overflow-visible">
          {/* Edges */}
          {edges.map((edge, i) => {
            const fromNode = nodes.find(n => n.id === edge.from)!
            const toNode = nodes.find(n => n.id === edge.to)!
            const isFromVisited = step.visited.includes(edge.from) || step.active === edge.from
            const isToVisited = step.visited.includes(edge.to) || step.active === edge.to
            const isVisited = isFromVisited && isToVisited
            
            return (
              <line
                key={i}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isVisited ? '#0ea5e9' : (isFromVisited || isToVisited) ? '#0891b2' : '#3f3f46'}
                strokeWidth="2"
                strokeDasharray={isVisited ? "0" : "4 2"}
                className="transition-colors duration-500"
              />
            )
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isVisited = step.visited.includes(node.id)
            const isActive = step.active === node.id
            const isInQueue = step.queue.includes(node.id)

            return (
              <g key={node.id}>
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r="18"
                  animate={{
                    fill: isActive ? '#f59e0b' : isVisited ? '#0ea5e9' : isInQueue ? '#0891b2' : '#18181b',
                    stroke: isActive ? '#fbbf24' : isVisited ? '#38bdf8' : isInQueue ? '#0ea5e9' : '#3f3f46',
                    scale: isActive ? 1.2 : 1,
                  }}
                  strokeWidth="2"
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-[10px] font-bold font-mono pointer-events-none"
                >
                  {node.id}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground border-t border-border pt-4 flex-wrap">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#18181b] border border-[#3f3f46]" /> Не посещено</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#0891b2]" /> В очереди</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Активна</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" /> Посещено</div>
      </div>
    </div>
  )
}
