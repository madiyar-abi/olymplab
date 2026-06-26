'use client'

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import {
  ReactFlow, Background, BackgroundVariant, Controls,
  ReactFlowProvider, useReactFlow, useNodesState, useEdgesState, addEdge,
  Connection, Node, Edge, NodeProps, EdgeProps, Handle, Position,
  BaseEdge, EdgeLabelRenderer, getStraightPath, MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTranslations } from 'next-intl'
import { ArrowRight, Hash, Trash2, Plus, Copy, Check, Spline } from 'lucide-react'
import { AlgorithmType, runBFS, runDFS, runDijkstra } from '@/utils/graphAlgorithms'
import { useGraphSimulation } from '@/hooks/useGraphSimulation'
import { PlaybackControls } from '@/components/graph-editor/PlaybackControls'

type NodeData = {
  label: string
  isCurrent?: boolean
  isVisited?: boolean
  isStart?: boolean
  distance?: number
}
type EdgeData = { weight?: number }

// ── Shared editor state for the custom node/edge renderers ───────────────────
interface EditorCtx {
  weighted: boolean
  editingEdgeId: string | null
  setEditingEdgeId: (id: string | null) => void
  setEdgeWeight: (id: string, weight: number) => void
}
const EditorContext = createContext<EditorCtx | null>(null)
const useEditor = () => useContext(EditorContext)!

const ACTIVE = '#3b82f6'
const IDLE = 'rgba(120,140,180,0.45)'

// ── Custom node ──────────────────────────────────────────────────────────────
const handleCls =
  '!w-2.5 !h-2.5 !bg-primary !border-2 !border-background !opacity-30 ' +
  'group-hover:!opacity-100 !transition-opacity !shadow-[0_0_6px_rgba(59,130,246,0.6)]'

function GraphNode({ data, selected }: NodeProps) {
  const d = data as NodeData

  const base =
    'group relative w-12 h-12 rounded-full flex flex-col items-center justify-center ' +
    'font-semibold text-sm tabular-nums select-none cursor-grab border ' +
    'transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out active:scale-95'

  const state = d.isCurrent
    ? 'bg-amber-400 border-amber-300/80 text-neutral-950 shadow-[0_0_0_4px_rgba(251,191,36,0.18),0_0_24px_rgba(251,191,36,0.45)]'
    : d.isVisited
    ? 'bg-emerald-500 border-emerald-300/70 text-neutral-950 shadow-[0_0_0_4px_rgba(16,185,129,0.16),0_0_20px_rgba(16,185,129,0.35)]'
    : d.isStart
    ? 'bg-card border-primary text-foreground shadow-[0_0_0_4px_rgba(59,130,246,0.16),0_0_22px_rgba(59,130,246,0.4)]'
    : selected
    ? 'bg-card border-primary/70 text-foreground shadow-[0_0_0_3px_rgba(59,130,246,0.14)]'
    : 'bg-card border-white/15 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.45)] hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-[0_0_0_4px_rgba(59,130,246,0.1),0_0_18px_rgba(59,130,246,0.28)]'

  return (
    <div className={`${base} ${state}`}>
      <Handle type="target" position={Position.Top} className={handleCls} />
      {d.isStart && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary ring-2 ring-background shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
      )}
      <span className="leading-none pointer-events-none">{d.label}</span>
      {d.distance !== undefined && (
        <span className="text-[9px] font-medium opacity-70 leading-none mt-0.5 pointer-events-none">
          {d.distance === Infinity ? '∞' : d.distance}
        </span>
      )}
      <Handle type="source" position={Position.Bottom} className={handleCls} />
    </div>
  )
}

// ── Custom edge (straight, with an editable weight chip) ─────────────────────
function WeightedEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd, style, data }: EdgeProps) {
  const ctx = useEditor()
  const [path, lx, ly] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  const weight = (data as EdgeData | undefined)?.weight ?? 1
  const editing = ctx.editingEdgeId === id

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {ctx.weighted && (
        <EdgeLabelRenderer>
          <div
            className="absolute nodrag nopan"
            style={{ transform: `translate(-50%,-50%) translate(${lx}px,${ly}px)`, pointerEvents: 'all' }}
          >
            {editing ? (
              <input
                autoFocus
                type="number"
                defaultValue={weight}
                onFocus={(e) => e.target.select()}
                onBlur={(e) => { ctx.setEdgeWeight(id, Number(e.target.value) || 0); ctx.setEditingEdgeId(null) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { ctx.setEdgeWeight(id, Number((e.target as HTMLInputElement).value) || 0); ctx.setEditingEdgeId(null) }
                  if (e.key === 'Escape') ctx.setEditingEdgeId(null)
                }}
                className="w-12 text-center bg-card border border-primary rounded-md text-xs font-mono text-foreground outline-none px-1 py-0.5"
              />
            ) : (
              <button
                onClick={() => ctx.setEditingEdgeId(id)}
                className="bg-card/85 text-foreground/80 px-2 py-0.5 rounded-md text-xs border border-border font-mono font-semibold shadow-lg backdrop-blur-sm hover:border-primary/60 hover:text-foreground transition-colors cursor-pointer"
              >
                {weight}
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const nodeTypes = { graphNode: GraphNode }
const edgeTypes = { weighted: WeightedEdge }

// ── Seed graph ───────────────────────────────────────────────────────────────
const SEED_NODES: Node[] = [
  { id: '1', type: 'graphNode', position: { x: 0, y: 0 }, data: { label: '1' } },
  { id: '2', type: 'graphNode', position: { x: 176, y: -96 }, data: { label: '2' } },
  { id: '3', type: 'graphNode', position: { x: 352, y: 0 }, data: { label: '3' } },
  { id: '4', type: 'graphNode', position: { x: 176, y: 128 }, data: { label: '4' } },
  { id: '5', type: 'graphNode', position: { x: 352, y: 208 }, data: { label: '5' } },
]
const SEED_EDGES: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'weighted', data: { weight: 4 } },
  { id: 'e1-4', source: '1', target: '4', type: 'weighted', data: { weight: 2 } },
  { id: 'e2-3', source: '2', target: '3', type: 'weighted', data: { weight: 5 } },
  { id: 'e4-3', source: '4', target: '3', type: 'weighted', data: { weight: 8 } },
  { id: 'e4-5', source: '4', target: '5', type: 'weighted', data: { weight: 6 } },
  { id: 'e3-5', source: '3', target: '5', type: 'weighted', data: { weight: 3 } },
]

const snap = (v: number) => Math.round(v / 16) * 16

// ── Canvas ───────────────────────────────────────────────────────────────────
function Canvas() {
  const tg = useTranslations('GraphEditor')
  const { screenToFlowPosition } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(SEED_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(SEED_EDGES)

  const [directed, setDirected] = useState(false)
  const [weighted, setWeighted] = useState(true)
  const [algo, setAlgo] = useState<AlgorithmType>('BFS')
  const [startId, setStartId] = useState<string | null>('1')
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const nextId = useRef(6)

  // Start node falls back to the first node if the chosen one was deleted.
  const effectiveStart = useMemo(
    () => (nodes.some((n) => n.id === startId) ? startId : nodes[0]?.id ?? null),
    [nodes, startId],
  )

  // ── Mutations ──
  const addNode = useCallback(
    (pos: { x: number; y: number }) => {
      const id = String(nextId.current++)
      setNodes((ns) => [...ns, { id, type: 'graphNode', position: { x: snap(pos.x), y: snap(pos.y) }, data: { label: id } }])
    },
    [setNodes],
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!(e.target as HTMLElement).classList.contains('react-flow__pane')) return
      addNode(screenToFlowPosition({ x: e.clientX, y: e.clientY }))
    },
    [addNode, screenToFlowPosition],
  )

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge({ ...c, type: 'weighted', data: { weight: 1 } }, eds)),
    [setEdges],
  )

  const setEdgeWeight = useCallback(
    (id: string, weight: number) =>
      setEdges((es) => es.map((e) => (e.id === id ? { ...e, data: { ...e.data, weight } } : e))),
    [setEdges],
  )

  const clearAll = useCallback(() => {
    setNodes([])
    setEdges([])
    setStartId(null)
    nextId.current = 1
  }, [setNodes, setEdges])

  const copyEdges = useCallback(() => {
    const text = edges
      .map((e) => `${e.source} ${e.target}${weighted ? ` ${(e.data as EdgeData | undefined)?.weight ?? 1}` : ''}`)
      .join('\n')
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [edges, weighted])

  // ── Algorithm frames (recompute only on topology / start / algo change) ──
  const topoKey = useMemo(
    () =>
      JSON.stringify({
        n: nodes.map((n) => n.id),
        e: edges.map((e) => [e.source, e.target, (e.data as EdgeData | undefined)?.weight ?? 1]),
        s: effectiveStart,
        a: algo,
      }),
    [nodes, edges, effectiveStart, algo],
  )

  const frames = useMemo(() => {
    if (nodes.length === 0 || !effectiveStart) return []
    if (algo === 'BFS') return runBFS(nodes, edges, effectiveStart)
    if (algo === 'DFS') return runDFS(nodes, edges, effectiveStart)
    return runDijkstra(nodes, edges, effectiveStart)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topoKey])

  const sim = useGraphSimulation(frames)

  // ── Display overlays (algorithm highlight + directed markers) ──
  const displayNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isStart: n.id === effectiveStart,
          isCurrent: sim.currentFrame?.currentNodeId === n.id,
          isVisited: sim.currentFrame?.visitedNodeIds.includes(n.id) ?? false,
          distance: sim.currentFrame?.distances?.[n.id],
        },
      })),
    [nodes, effectiveStart, sim.currentFrame],
  )

  const displayEdges = useMemo(
    () =>
      edges.map((e) => {
        const active = sim.currentFrame?.activeEdgeIds.includes(e.id) ?? false
        return {
          ...e,
          type: 'weighted',
          animated: active,
          markerEnd: directed
            ? { type: MarkerType.ArrowClosed, width: 18, height: 18, color: active ? ACTIVE : IDLE }
            : undefined,
          style: { stroke: active ? ACTIVE : IDLE, strokeWidth: active ? 2.5 : 1.5, transition: 'stroke .2s ease' },
        }
      }),
    [edges, directed, sim.currentFrame],
  )

  const ctx: EditorCtx = { weighted, editingEdgeId, setEditingEdgeId, setEdgeWeight }

  return (
    <EditorContext.Provider value={ctx}>
      <div className="w-full h-full relative" onDoubleClick={handleDoubleClick}>
        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, n) => setStartId(n.id)}
          onEdgeDoubleClick={(_, e) => setEditingEdgeId(e.id)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'weighted' }}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          colorMode="dark"
          snapToGrid
          snapGrid={[16, 16]}
          deleteKeyCode={['Backspace', 'Delete']}
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
          style={{ background: 'transparent' }}
        >
          <Background variant={BackgroundVariant.Dots} color="rgba(120,140,180,0.12)" gap={28} size={1} />
          <Controls
            showInteractive={false}
            className="!rounded-xl !overflow-hidden !bg-card/70 !backdrop-blur-xl !border !border-border !shadow-2xl !shadow-black/40 [&>button]:!bg-transparent [&>button]:!text-muted-foreground [&>button:hover]:!bg-primary/10 [&>button:hover]:!text-primary [&>button]:!border-border/60 [&>button]:!transition-colors"
          />
        </ReactFlow>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Spline className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground font-mono">{tg('emptyTitle')}</p>
          </div>
        )}

        {/* Floating toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-card/70 backdrop-blur-xl border border-border shadow-2xl shadow-black/40">
          <ToolToggle active={directed} onClick={() => setDirected((v) => !v)} icon={<ArrowRight className="w-3.5 h-3.5" />} label={tg('directed')} />
          <ToolToggle active={weighted} onClick={() => setWeighted((v) => !v)} icon={<Hash className="w-3.5 h-3.5" />} label={tg('weighted')} />
          <span className="w-px h-5 bg-border mx-0.5" />
          <ToolButton onClick={() => addNode(screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }))} icon={<Plus className="w-3.5 h-3.5" />} label={tg('addNode')} />
          <ToolButton onClick={copyEdges} icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />} label={copied ? tg('copied') : tg('copyEdges')} />
          <ToolButton onClick={clearAll} icon={<Trash2 className="w-3.5 h-3.5" />} label={tg('clear')} danger />
        </div>

        {/* Hint */}
        <div className="absolute bottom-4 left-4 z-10 hidden md:block max-w-xs text-[10px] leading-relaxed text-muted-foreground/70 font-mono pointer-events-none">
          {tg('hint')}
        </div>

        {/* Playback bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20" style={{ width: 'calc(100% - 32px)', maxWidth: 760 }}>
          <PlaybackControls
            isPlaying={sim.isPlaying}
            onPlay={sim.play}
            onPause={sim.pause}
            onReset={sim.reset}
            onStepForward={sim.stepForward}
            onStepBackward={sim.stepBackward}
            speed={sim.speed}
            onSpeedChange={sim.setSpeed}
            selectedAlgorithm={algo}
            onAlgorithmChange={setAlgo}
            currentFrameIndex={sim.currentFrameIndex}
            totalFrames={sim.totalFrames}
            description={sim.currentFrame?.description}
          />
        </div>
      </div>
    </EditorContext.Provider>
  )
}

// ── Toolbar primitives ───────────────────────────────────────────────────────
function ToolToggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-medium transition-all ${
        active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ToolButton({ onClick, icon, label, danger }: { onClick: () => void; icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-medium transition-all ${
        danger ? 'text-muted-foreground hover:bg-red-500/10 hover:text-red-500' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

export default function GraphEditorClient() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-background text-foreground overflow-hidden">
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
    </div>
  )
}
