'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, SkipForward, Pause } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useTheme } from '@/components/shared/ThemeProvider'
import { cn } from '@/lib/utils'

export default function DijkstraVisualizer() {
  const locale = useLocale()
  const isRu = locale === 'ru'
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const nodes = [
    { id: 0, x: 40, y: 120 },
    { id: 1, x: 120, y: 50 },
    { id: 2, x: 120, y: 190 },
    { id: 3, x: 200, y: 50 },
    { id: 4, x: 200, y: 190 },
    { id: 5, x: 260, y: 120 },
  ]

  const edges = useMemo(() => [
    { from: 0, to: 1, w: 4 }, { from: 0, to: 2, w: 2 },
    { from: 1, to: 2, w: 1 }, { from: 1, to: 3, w: 5 },
    { from: 2, to: 3, w: 8 }, { from: 2, to: 4, w: 10 },
    { from: 3, to: 4, w: 2 },
    { from: 3, to: 5, w: 3 }, { from: 4, to: 5, w: 5 },
  ], [])

  const steps = useMemo(() => {
    const newSteps: { dist: number[], visited: boolean[], active: number | null, msg: string }[] = []
    const d = new Array(6).fill(Infinity)
    const v = new Array(6).fill(false)
    d[0] = 0
    
    newSteps.push({
      dist: [...d],
      visited: [...v],
      active: null,
      msg: isRu
        ? "Начинаем из вершины 0. Расстояние до неё = 0."
        : "Starting from vertex 0. Distance to it = 0."
    })

    for (let i = 0; i < 6; i++) {
      let u = -1
      for (let j = 0; j < 6; j++) {
        if (!v[j] && (u === -1 || d[j] < d[u])) u = j
      }

      if (u === -1 || d[u] === Infinity) break
      
      v[u] = true
      newSteps.push({
        dist: [...d],
        visited: [...v],
        active: u,
        msg: isRu
          ? `Выбираем ближайшую вершину ${u} с расстоянием ${d[u]}.`
          : `Selecting nearest vertex ${u} with distance ${d[u]}.`
      })

      for (const edge of edges) {
        if (edge.from === u || edge.to === u) {
          const neighbor = edge.from === u ? edge.to : edge.from
          if (d[u] + edge.w < d[neighbor]) {
            d[neighbor] = d[u] + edge.w
            newSteps.push({
              dist: [...d],
              visited: [...v],
              active: u,
              msg: isRu
                ? `Релаксация: обновляем расстояние до вершины ${neighbor}: ${d[neighbor]}.`
                : `Relaxation: updating distance to vertex ${neighbor}: ${d[neighbor]}.`
            })
          }
        }
      }
    }

    return newSteps
  }, [edges, isRu])

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
      interval = setInterval(() => setCurrentStep((s) => s + 1), 1000)
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

  const step = steps[currentStep] || { dist: [], visited: [], active: null, msg: "" }

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            {isRu ? 'Алгоритм Дейкстры' : "Dijkstra's Algorithm"}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Поиск кратчайшего пути во взвешенном графе' : 'Shortest path search in a weighted graph'}
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
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-30"
            disabled={currentStep === steps.length - 1}
            title={isRu ? 'Следующий шаг' : 'Next Step'}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative h-[250px] w-full flex justify-center mb-8 bg-muted/20 rounded-xl pt-4 overflow-hidden">
        <svg width="300" height="200" viewBox="0 0 300 250" className="overflow-visible">
          {edges.map((edge, i) => {
            const f = nodes.find(n => n.id === edge.from)!
            const t = nodes.find(n => n.id === edge.to)!
            return (
              <g key={i}>
                <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke={isDark ? '#3f3f46' : '#cbd5e1'} strokeWidth="1.5" />
                <text x={(f.x+t.x)/2} y={(f.y+t.y)/2-5} textAnchor="middle" className="fill-muted-foreground text-[8px] font-mono">{edge.w}</text>
              </g>
            )
          })}
          {nodes.map(node => (
            <g key={node.id}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r="14"
                animate={{
                  fill: step.active === node.id ? '#f59e0b' : step.visited[node.id] ? '#0ea5e9' : (isDark ? '#18181b' : '#f4f4f5'),
                  stroke: step.active === node.id ? '#fbbf24' : (isDark ? '#3f3f46' : '#d4d4d8')
                }}
                strokeWidth="2"
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={step.active === node.id || step.visited[node.id] ? '#ffffff' : (isDark ? '#ffffff' : '#09090b')}
                className="text-[9px] font-bold font-mono"
              >
                {node.id}
              </text>
              <text
                x={node.x}
                y={node.y+22}
                textAnchor="middle"
                className="fill-sky-500 dark:fill-sky-400 text-[8px] font-bold font-mono"
              >
                {step.dist[node.id] === Infinity ? '∞' : step.dist[node.id]}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="bg-muted/40 p-4 rounded-xl border border-border font-mono text-xs text-muted-foreground min-h-[60px]">
        <span className="text-sky-500 font-bold mr-2">LOG:</span>
        <span className="text-foreground">{step.msg}</span>
      </div>
    </div>
  )
}
