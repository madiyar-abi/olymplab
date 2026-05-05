'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, RotateCcw, Info, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Node {
  id: number
  parent: number
  rank: number
}

export default function DSUVisualizer() {
  const [nodes, setNodes] = useState<Node[]>(() => 
    Array.from({ length: 8 }, (_, i) => ({ id: i, parent: i, rank: 0 }))
  )
  const [history, setHistory] = useState<string[]>([])
  const [activeNode, setActiveNode] = useState<number | null>(null)
  const [pathNodes, setPathNodes] = useState<number[]>([])

  const find = (id: number, currentNodes: Node[]): { root: number, path: number[] } => {
    const path: number[] = []
    let curr = id
    while (currentNodes[curr].parent !== curr) {
      path.push(curr)
      curr = currentNodes[curr].parent
    }
    path.push(curr)
    return { root: curr, path }
  }

  const handleFind = (id: number) => {
    const { root, path } = find(id, nodes)
    setPathNodes(path)
    setActiveNode(id)
    setHistory(prev => [`Find(${id}) -> Root is ${root}`, ...prev].slice(0, 5))
    
    // Path compression visualization (optional, maybe just show the find)
    setTimeout(() => {
      setPathNodes([])
      setActiveNode(null)
    }, 2000)
  }

  const handleUnion = (id1: number, id2: number) => {
    if (id1 === id2) return

    setNodes(prev => {
      const next = [...prev]
      const root1 = find(id1, next).root
      const root2 = find(id2, next).root

      if (root1 !== root2) {
        if (next[root1].rank < next[root2].rank) {
          next[root1].parent = root2
        } else if (next[root1].rank > next[root2].rank) {
          next[root2].parent = root1
        } else {
          next[root2].parent = root1
          next[root1].rank += 1
        }
        setHistory(prevHist => [`Union(${id1}, ${id2}) -> Root ${root2} joined to ${root1}`, ...prevHist].slice(0, 5))
      } else {
        setHistory(prevHist => [`Union(${id1}, ${id2}) -> Already in same set`, ...prevHist].slice(0, 5))
      }
      return next
    })
  }

  const reset = () => {
    setNodes(Array.from({ length: 8 }, (_, i) => ({ id: i, parent: i, rank: 0 })))
    setHistory([])
    setPathNodes([])
    setActiveNode(null)
  }

  // Group nodes into trees for better layout
  const trees = useMemo(() => {
    const roots = nodes.filter(n => n.parent === n.id).map(n => n.id)
    return roots.map(rootId => {
      const members: number[] = []
      const stack = [rootId]
      while (stack.length > 0) {
        const curr = stack.pop()!
        members.push(curr)
        nodes.forEach(n => {
          if (n.parent === curr && n.id !== curr) {
            stack.push(n.id)
          }
        })
      }
      return { rootId, members }
    })
  }, [nodes])

  return (
    <div className="not-prose my-8 p-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Визуализация: DSU (Система непересекающихся множеств)
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Операции Find и Union с оптимизацией по рангу
          </p>
        </div>
        <button
          onClick={reset}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Canvas */}
        <div className="lg:col-span-3 min-h-[300px] relative bg-zinc-950/50 rounded-xl border border-zinc-800 p-8 flex flex-wrap items-start justify-center gap-12">
          {trees.map((tree) => (
            <div key={tree.rootId} className="flex flex-col items-center">
              <TreeBranch 
                nodes={nodes} 
                currId={tree.rootId} 
                onFind={handleFind}
                onUnion={handleUnion}
                activeNode={activeNode}
                pathNodes={pathNodes}
              />
            </div>
          ))}
        </div>

        {/* Info & History */}
        <div className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-xl border border-border">
            <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-3 flex items-center gap-2">
              <Info className="w-3 h-3" />
              Подсказка
            </h5>
            <p className="text-xs text-foreground leading-relaxed">
              Нажмите на узел, чтобы выполнить <b>Find</b>. 
              Перетащите один узел на другой, чтобы выполнить <b>Union</b>.
            </p>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border border-border flex-1">
            <h5 className="text-[10px] font-bold text-muted-foreground uppercase mb-3">История операций</h5>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {history.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[11px] font-mono text-muted-foreground border-l border-sky-500/30 pl-2 py-1"
                  >
                    {item}
                  </motion.div>
                ))}
              </AnimatePresence>
              {history.length === 0 && (
                <div className="text-[10px] text-muted-foreground/50 italic">История пуста</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TreeBranch({ 
  nodes, 
  currId, 
  onFind, 
  onUnion,
  activeNode,
  pathNodes,
  depth = 0 
}: { 
  nodes: Node[], 
  currId: number, 
  onFind: (id: number) => void,
  onUnion: (id1: number, id2: number) => void,
  activeNode: number | null,
  pathNodes: number[],
  depth?: number
}) {
  const children = nodes.filter(n => n.parent === currId && n.id !== currId)
  const isActive = activeNode === currId
  const isPath = pathNodes.includes(currId)

  return (
    <div className="flex flex-col items-center gap-8">
      <motion.div
        layout
        onClick={() => onFind(currId)}
        onDragOver={(e: React.DragEvent) => e.preventDefault()}
        onDrop={(e: React.DragEvent) => {
          const draggedIdStr = e.dataTransfer.getData('nodeId')
          if (!draggedIdStr) return
          const draggedId = parseInt(draggedIdStr)
          onUnion(draggedId, currId)
        }}
        draggable
        {...({ onDragStart: (e: React.DragEvent) => e.dataTransfer.setData('nodeId', currId.toString()) } as any)}
        animate={{
          scale: isActive ? 1.2 : 1,
          backgroundColor: isActive ? '#f59e0b' : isPath ? '#0ea5e9' : '#18181b',
          borderColor: isActive ? '#f59e0b' : isPath ? '#0ea5e9' : '#3f3f46',
        }}
        className={cn(
          "w-10 h-10 rounded-full border flex items-center justify-center text-xs font-mono font-bold cursor-pointer transition-all shadow-lg",
          isActive || isPath ? "text-white" : "text-foreground"
        )}
      >
        {currId}
      </motion.div>

      {children.length > 0 && (
        <div className="flex items-start gap-8 relative">
          {/* Connector Line to Children */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] h-px bg-zinc-800" />
          
          {children.map((child) => (
            <div key={child.id} className="relative flex flex-col items-center">
              <div className="absolute -top-8 w-px h-8 bg-zinc-800" />
              <TreeBranch 
                nodes={nodes} 
                currId={child.id} 
                onFind={onFind}
                onUnion={onUnion}
                activeNode={activeNode}
                pathNodes={pathNodes}
                depth={depth + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
