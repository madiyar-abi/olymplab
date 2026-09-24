'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, RotateCcw } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useTheme } from '@/components/shared/ThemeProvider'

interface BSTNode {
  val: number
  left: BSTNode | null
  right: BSTNode | null
  x: number
  y: number
}

export default function BSTVisualizer() {
  const locale = useLocale()
  const isRu = locale === 'ru'
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [nodes, setNodes] = useState<number[]>([50, 30, 70, 20, 40, 60, 80])
  const [inputValue, setInputValue] = useState(45)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [visualSteps, setVisualSteps] = useState<{ nodes: number[], active: number | null, msg: string }[]>([])
  const speed = 800

  // Build tree structure for rendering
  const buildTreeForRender = (currentNodes: number[]) => {
    if (currentNodes.length === 0) return null
    const root: BSTNode = { val: currentNodes[0], left: null, right: null, x: 150, y: 40 }
    
    for (let i = 1; i < currentNodes.length; i++) {
      let curr = root
      let level = 1
      while (true) {
        if (currentNodes[i] < curr.val) {
          if (!curr.left) {
            curr.left = { val: currentNodes[i], left: null, right: null, x: curr.x - 80 / Math.pow(1.5, level), y: curr.y + 50 }
            break
          }
          curr = curr.left
        } else {
          if (!curr.right) {
            curr.right = { val: currentNodes[i], left: null, right: null, x: curr.x + 80 / Math.pow(1.5, level), y: curr.y + 50 }
            break
          }
          curr = curr.right
        }
        level++
      }
    }
    return root
  }

  const startInsertion = () => {
    if (nodes.includes(inputValue)) return
    
    const steps: { nodes: number[], active: number | null, msg: string }[] = []
    const firstVal = nodes[0]
    
    steps.push({
      nodes: [...nodes],
      active: firstVal,
      msg: isRu
        ? `Начинаем поиск места для ${inputValue} с корня ${firstVal}`
        : `Searching place for ${inputValue} starting at root ${firstVal}`
    })
    
    const tempNodes = [...nodes]
    const root = buildTreeForRender(tempNodes)
    let curr = root
    
    while (curr) {
      if (inputValue < curr.val) {
        if (!curr.left) {
          steps.push({
            nodes: [...nodes],
            active: curr.val,
            msg: isRu
              ? `${inputValue} < ${curr.val}, левого потомка нет. Вставляем сюда.`
              : `${inputValue} < ${curr.val}, no left child. Inserting here.`
          })
          break
        }
        curr = curr.left
        steps.push({
          nodes: [...nodes],
          active: curr.val,
          msg: isRu
            ? `${inputValue} < ${curr.val}, идем влево к ${curr.val}`
            : `${inputValue} < ${curr.val}, moving left to ${curr.val}`
        })
      } else {
        if (!curr.right) {
          steps.push({
            nodes: [...nodes],
            active: curr.val,
            msg: isRu
              ? `${inputValue} > ${curr.val}, правого потомка нет. Вставляем сюда.`
              : `${inputValue} > ${curr.val}, no right child. Inserting here.`
          })
          break
        }
        curr = curr.right
        steps.push({
          nodes: [...nodes],
          active: curr.val,
          msg: isRu
            ? `${inputValue} > ${curr.val}, идем вправо к ${curr.val}`
            : `${inputValue} > ${curr.val}, moving right to ${curr.val}`
        })
      }
    }
    
    setVisualSteps(steps)
    setCurrentStep(0)
    setIsPlaying(true)
    
    setTimeout(() => {
       setNodes(prev => [...prev, inputValue])
       setInputValue(Math.floor(Math.random() * 90) + 10)
    }, steps.length * speed)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && visualSteps.length > 0) {
      if (currentStep < visualSteps.length - 1) {
        interval = setInterval(() => setCurrentStep(s => s + 1), speed)
      } else {
        setTimeout(() => setIsPlaying(false), 0)
      }
    }
    return () => clearInterval(interval)
  }, [isPlaying, currentStep, visualSteps.length])

  const reset = () => {
    setNodes([50, 30, 70, 20, 40, 60, 80])
    setVisualSteps([])
    setCurrentStep(0)
    setIsPlaying(false)
  }

  const step = visualSteps[currentStep] || {
    nodes: nodes,
    active: null,
    msg: isRu ? "Готов к вставке" : "Ready for insertion"
  }
  const tree = buildTreeForRender(step.nodes)

  const renderEdges = (node: BSTNode | null): React.ReactNode[] => {
    if (!node) return []
    let edges: React.ReactNode[] = []
    if (node.left) {
      edges.push(<line key={`l-${node.val}`} x1={node.x} y1={node.y} x2={node.left.x} y2={node.left.y} stroke={isDark ? "#3f3f46" : "#cbd5e1"} strokeWidth="1.5" />)
      edges = [...edges, ...renderEdges(node.left)]
    }
    if (node.right) {
      edges.push(<line key={`r-${node.val}`} x1={node.x} y1={node.y} x2={node.right.x} y2={node.right.y} stroke={isDark ? "#3f3f46" : "#cbd5e1"} strokeWidth="1.5" />)
      edges = [...edges, ...renderEdges(node.right)]
    }
    return edges
  }

  const renderNodes = (node: BSTNode | null): React.ReactNode[] => {
    if (!node) return []
    const isActive = step.active === node.val
    let list: React.ReactNode[] = [
      <g key={`n-${node.val}`}>
        <motion.circle 
          layout 
          cx={node.x} cy={node.y} r="14" 
          animate={{
            fill: isActive ? '#f59e0b' : (isDark ? '#18181b' : '#f4f4f5'),
            stroke: isActive ? '#fbbf24' : (isDark ? '#3f3f46' : '#d4d4d8'),
            scale: isActive ? 1.2 : 1
          }}
          strokeWidth="2" 
        />
        <text
          x={node.x}
          y={node.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isActive ? '#ffffff' : (isDark ? '#ffffff' : '#09090b')}
          className="text-[9px] font-bold font-mono"
        >
          {node.val}
        </text>
      </g>
    ]
    if (node.left) list = [...list, ...renderNodes(node.left)]
    if (node.right) list = [...list, ...renderNodes(node.right)]
    return list
  }

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
            {isRu ? 'Дерево поиска (BST)' : 'Binary Search Tree (BST)'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Binary Search Tree — левое меньше, правое больше' : 'Binary Search Tree — left is smaller, right is greater'}
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
            onClick={startInsertion} 
            disabled={isPlaying || nodes.length >= 15}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> {isRu ? `Вставить ${inputValue}` : `Insert ${inputValue}`}
          </button>
        </div>
      </div>

      <div className="relative h-[250px] w-full flex justify-center bg-muted/20 rounded-xl mb-6 overflow-hidden">
        <svg width="300" height="250" className="overflow-visible">
          {renderEdges(tree)}
          {renderNodes(tree)}
        </svg>
      </div>

      <div className="bg-muted/40 p-3 rounded-xl border border-border font-mono text-[11px] text-muted-foreground">
        <span className="text-sky-500 font-bold mr-2">LOG:</span>{step.msg}
      </div>
    </div>
  )
}
