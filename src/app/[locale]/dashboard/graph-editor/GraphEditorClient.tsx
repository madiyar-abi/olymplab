'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, addEdge,
  Connection, BackgroundVariant, Node, Edge, NodeChange,
  ReactFlowProvider, useReactFlow,
  BaseEdge, EdgeLabelRenderer, getStraightPath, EdgeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import CustomNode from '@/components/GraphEditor/CustomNode'
import { parseGraphData, IndexMode } from '@/utils/graphParser'
import { PlaybackControls } from '@/components/graph-editor/PlaybackControls'
import { useGraphSimulation } from '@/hooks/useGraphSimulation'
import { AlgorithmType, runBFS, runDFS, runDijkstra } from '@/utils/graphAlgorithms'

type GraphType = 'undirected' | 'directed'

const DEFAULT_EDGES = '1 2 5\n1 4 2\n1 5 10\n2 3 3\n2 5 1\n3 4 7\n4 5 4'

// ── Straight edge with weight label ──────────────────────────────────────────
function StraightEdge({ id, sourceX, sourceY, targetX, targetY, style, markerEnd, label }: EdgeProps) {
  const [path, lx, ly] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute nodrag nopan"
            style={{ transform: `translate(-50%,-50%) translate(${lx}px,${ly}px)` }}
          >
            <span className="bg-neutral-900 text-neutral-300 px-2 py-0.5 rounded-md text-xs border border-neutral-700 font-mono font-semibold shadow">
              {label as string}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const nodeTypes = { custom: CustomNode }
const edgeTypes = { straight: StraightEdge }

// ── ReactFlow canvas (needs provider context) ─────────────────────────────────
interface FlowCanvasProps {
  parsedNodes: Node[]
  parsedEdges: Edge[]
}

function FlowCanvas({ parsedNodes, parsedEdges }: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(parsedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(parsedEdges)
  const [selectedAlgo, setSelectedAlgo]  = useState<AlgorithmType>('BFS')

  const { fitView }  = useReactFlow()
  const draggedPos   = useRef<Map<string, { x: number; y: number }>>(new Map())
  const prevIdsKey   = useRef('')

  // Sync parsed → internal state, preserving dragged positions
  useEffect(() => {
    const idsKey = parsedNodes.map(n => n.id).sort().join(',')
    const reset  = idsKey !== prevIdsKey.current
    prevIdsKey.current = idsKey

    if (reset) {
      draggedPos.current.clear()
      setNodes(parsedNodes)
      setEdges(parsedEdges)
      setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 50)
    } else {
      setNodes(prev => {
        const posMap = new Map(prev.map(n => [n.id, n.position]))
        return parsedNodes.map(n => ({
          ...n,
          position: draggedPos.current.get(n.id) ?? posMap.get(n.id) ?? n.position,
        }))
      })
      setEdges(parsedEdges)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedNodes, parsedEdges])

  const handleNodesChange = useCallback((changes: NodeChange<Node>[]) => {
    changes.forEach((c) => {
      if (c.type === 'position' && c.position) draggedPos.current.set(c.id, c.position)
    })
    onNodesChange(changes)
  }, [onNodesChange])

  const onConnect = useCallback(
    (conn: Connection) => setEdges(eds => addEdge({ ...conn, type: 'straight' }, eds)),
    [setEdges],
  )

  // Algorithm frames
  const frames = useMemo(() => {
    if (nodes.length === 0) return []
    const start = nodes[0].id
    switch (selectedAlgo) {
      case 'BFS':      return runBFS(nodes, edges, start)
      case 'DFS':      return runDFS(nodes, edges, start)
      case 'Dijkstra': return runDijkstra(nodes, edges, start)
      default:         return []
    }
  }, [nodes, edges, selectedAlgo])

  const sim = useGraphSimulation(frames)

  // Overlay algorithm highlights
  const displayNodes = useMemo(() =>
    nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        isCurrent: sim.currentFrame?.currentNodeId === n.id,
        isVisited: sim.currentFrame?.visitedNodeIds.includes(n.id) ?? false,
        distance:  sim.currentFrame?.distances?.[n.id],
      },
    })),
  [nodes, sim.currentFrame])

  const displayEdges = useMemo(() =>
    edges.map(e => {
      const active = sim.currentFrame?.activeEdgeIds.includes(e.id) ?? false
      return {
        ...e,
        type:     'straight',
        animated: active,
        style: {
          stroke:      active ? '#818cf8' : 'rgba(113,113,122,0.5)',
          strokeWidth: active ? 2.5 : 2,
        },
      }
    }),
  [edges, sim.currentFrame])

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'straight' }}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        colorMode="dark"
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        deleteKeyCode="Delete"
        style={{ background: 'transparent' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="rgba(255,255,255,0.04)" gap={24} size={1.5} />
        <Controls
          showInteractive={false} showFitView showZoom
          className="!bg-neutral-900/90 !border-neutral-700/50 !shadow-xl [&>button]:!bg-neutral-900 [&>button]:!text-neutral-400 [&>button:hover]:!bg-neutral-800 [&>button]:!border-neutral-700/50"
        />
        <MiniMap
          nodeColor={n => { const d = n.data as { isCurrent?: boolean; isVisited?: boolean }; return d.isCurrent ? '#fbbf24' : d.isVisited ? '#34d399' : '#404040' }}
          maskColor="rgba(0,0,0,0.5)"
          style={{ background: '#171717', border: '1px solid rgba(64,64,64,0.5)', borderRadius: 8 }}
        />
      </ReactFlow>

      {/* Playback bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
           style={{ width: 'calc(100% - 32px)', maxWidth: 760 }}>
        <PlaybackControls
          isPlaying={sim.isPlaying}
          onPlay={sim.play}
          onPause={sim.pause}
          onReset={sim.reset}
          onStepForward={sim.stepForward}
          onStepBackward={sim.stepBackward}
          speed={sim.speed}
          onSpeedChange={sim.setSpeed}
          selectedAlgorithm={selectedAlgo}
          onAlgorithmChange={setSelectedAlgo}
          currentFrameIndex={sim.currentFrameIndex}
          totalFrames={sim.totalFrames}
          description={sim.currentFrame?.description}
        />
      </div>
    </div>
  )
}

// ── Main exported component ───────────────────────────────────────────────────
export default function GraphEditorClient() {
  const [graphType, setGraphType] = useState<GraphType>('undirected')
  const [indexMode, setIndexMode] = useState<IndexMode>('1-index')
  const [nodeCount, setNodeCount] = useState(5)
  const [inputText, setInputText] = useState(DEFAULT_EDGES)

  const { nodes: parsedNodes, edges: parsedEdges } = useMemo(
    () => parseGraphData(inputText, nodeCount, indexMode, graphType === 'directed'),
    [inputText, nodeCount, indexMode, graphType],
  )

  const lines = inputText.split('\n')
  const edgeCount = lines.filter(l => l.trim().length > 0).length

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-neutral-950 text-white overflow-hidden">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 border-r border-neutral-800 flex flex-col overflow-hidden">

        {/* Controls */}
        <div className="p-4 space-y-4 border-b border-neutral-800">

          {/* Graph type */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Type</p>
            <div className="flex rounded-lg overflow-hidden border border-neutral-700 text-xs font-mono">
              {(['undirected', 'directed'] as GraphType[]).map(t => (
                <button key={t} id={`graph-type-${t}`} onClick={() => setGraphType(t)}
                  className={`flex-1 py-1.5 capitalize transition-colors ${graphType === t ? 'bg-neutral-100 text-neutral-900 font-bold' : 'bg-transparent text-neutral-400 hover:bg-neutral-800'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Index mode */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Index</p>
            <div className="flex rounded-lg overflow-hidden border border-neutral-700 text-xs font-mono">
              {(['0-index', '1-index'] as IndexMode[]).map(m => (
                <button key={m} id={`index-mode-${m}`} onClick={() => setIndexMode(m)}
                  className={`flex-1 py-1.5 transition-colors ${indexMode === m ? 'bg-neutral-100 text-neutral-900 font-bold' : 'bg-transparent text-neutral-400 hover:bg-neutral-800'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Node count */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Nodes</p>
              <span className="text-sm font-mono font-bold text-violet-400 tabular-nums">{nodeCount}</span>
            </div>
            <input
              id="node-count-slider"
              type="range" min={1} max={20} value={nodeCount}
              onChange={e => setNodeCount(Number(e.target.value))}
              className="w-full h-1.5 rounded-full cursor-pointer"
              style={{ background: `linear-gradient(to right, #7c3aed ${((nodeCount - 1) / 19) * 100}%, #404040 ${((nodeCount - 1) / 19) * 100}%)` }}
            />
            <div className="flex justify-between">
              <span className="text-[9px] font-mono text-neutral-600">1</span>
              <span className="text-[9px] font-mono text-neutral-600">20</span>
            </div>
          </div>
        </div>

        {/* Graph data textarea */}
        <div className="p-4 flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Graph Data</p>
            <span className="text-[9px] font-mono text-neutral-600">{edgeCount} edge{edgeCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex flex-1 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 font-mono text-[11px]">
            {/* Line numbers */}
            <div className="flex flex-col py-2 px-2 text-right select-none border-r border-neutral-800 min-w-[2.25rem]"
                 style={{ lineHeight: '1.5rem' }}>
              {lines.map((_, i) => (
                <span key={i} className="text-neutral-600" style={{ fontSize: 10 }}>{i + 1}</span>
              ))}
            </div>
            <textarea
              id="edges-input"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-transparent text-neutral-300 resize-none outline-none p-2 leading-6"
              spellCheck={false}
              placeholder="u v w"
              style={{ fontSize: 11 }}
            />
          </div>
          <p className="text-[9px] text-neutral-600 font-mono">One edge per line. Weight optional.</p>
        </div>

        {/* Tips */}
        <div className="px-4 pb-4 space-y-1.5 border-t border-neutral-800 pt-3">
          {['Drag nodes to rearrange', 'Scroll to zoom · Drag to pan', 'Delete key removes selected'].map(tip => (
            <p key={tip} className="text-[9px] text-neutral-600 font-mono flex items-center gap-1.5">
              <span className="text-indigo-500">◈</span>{tip}
            </p>
          ))}
        </div>
      </div>

      {/* ── Canvas ────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative bg-neutral-950">
        <ReactFlowProvider>
          <FlowCanvas parsedNodes={parsedNodes} parsedEdges={parsedEdges} />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
