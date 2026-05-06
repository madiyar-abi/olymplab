'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  EdgeProps,
  Connection,
  BackgroundVariant,
  NodeProps,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PlaybackControls } from './PlaybackControls';
import { useGraphSimulation } from '../../hooks/useGraphSimulation';
import { AlgorithmType, runBFS, runDFS, runDijkstra } from '../../utils/graphAlgorithms';

interface GraphVisualizerProps {
  initialNodes: Node[];
  initialEdges: Edge[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Node — pure Tailwind, root element IS the circle, no wrapper divs
// ─────────────────────────────────────────────────────────────────────────────
function CustomNode({ data, selected }: NodeProps) {
  const d = data as {
    label: string;
    isCurrent?: boolean;
    isVisited?: boolean;
    distance?: number;
  };

  // Determine visual state
  const isCurrent = !!d.isCurrent;
  const isVisited  = !!d.isVisited;

  // Base classes — the root div IS the circle
  const base = 'w-14 h-14 rounded-full flex flex-col items-center justify-center font-bold text-base select-none cursor-grab transition-all duration-200';

  // State-driven classes
  const stateClasses = isCurrent
    ? 'bg-amber-400 border-2 border-amber-300 text-black ring-4 ring-offset-2 ring-offset-zinc-950 ring-amber-400/70 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
    : isVisited
    ? 'bg-emerald-600 border-2 border-emerald-400 text-white ring-4 ring-offset-2 ring-offset-zinc-950 ring-emerald-500/60 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
    : selected
    ? 'bg-zinc-800 border-2 border-indigo-400 text-white ring-4 ring-offset-2 ring-offset-zinc-950 ring-indigo-500/50'
    : 'bg-zinc-800 border-2 border-zinc-600 text-white shadow-lg hover:border-zinc-400';

  return (
    <div className={`${base} ${stateClasses}`}>
      {/* Invisible target handle — full area */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 !w-14 !h-14 !rounded-full !border-none !bg-transparent !top-0 !left-0"
      />

      {/* Label */}
      <span style={{ lineHeight: 1 }}>{d.label}</span>

      {/* Dijkstra distance sub-label */}
      {d.distance !== undefined && (
        <span className="text-[9px] font-semibold opacity-70 leading-none mt-0.5">
          {d.distance === Infinity ? '∞' : d.distance}
        </span>
      )}

      {/* Invisible source handle — full area */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 !w-14 !h-14 !rounded-full !border-none !bg-transparent !bottom-0 !left-0"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Edge — strict STRAIGHT lines, clean weight label
// ─────────────────────────────────────────────────────────────────────────────
function StraightEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  style = {},
  markerEnd,
  label,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX, sourceY,
    targetX, targetY,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute nodrag nopan"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          >
            <span className="bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded-md text-xs border border-zinc-700 font-mono font-semibold shadow-md">
              {label as string}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = { default: CustomNode };
const edgeTypes = { straight: StraightEdge };

// ─────────────────────────────────────────────────────────────────────────────
// Inner component (needs ReactFlow context)
// ─────────────────────────────────────────────────────────────────────────────
function GraphVisualizerInner({ initialNodes, initialEdges }: GraphVisualizerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('BFS');

  const { fitView } = useReactFlow();
  const userMoved   = useRef(false);
  const prevCount   = useRef(initialNodes.length);

  // Sync without blowing away user-dragged positions
  useEffect(() => {
    const newCount = initialNodes.length;
    if (newCount !== prevCount.current) {
      userMoved.current = false;
      setNodes(initialNodes);
      setEdges(initialEdges);
      prevCount.current = newCount;
      setTimeout(() => fitView({ padding: 0.3, duration: 400 }), 50);
    } else if (!userMoved.current) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    } else {
      setNodes(prev => {
        const map = new Map(initialNodes.map(n => [n.id, n.data]));
        return prev.map(n => ({ ...n, data: map.get(n.id) ?? n.data }));
      });
      setEdges(initialEdges);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialEdges]);

  const handleNodesChange = (changes: any) => {
    if (changes.some((c: any) => c.type === 'position' && c.dragging)) {
      userMoved.current = true;
    }
    onNodesChange(changes);
  };

  const onConnect = useCallback(
    (conn: Connection) =>
      setEdges(eds =>
        addEdge({ ...conn, type: 'straight' }, eds)
      ),
    [setEdges]
  );

  // Build algorithm frames
  const frames = useMemo(() => {
    if (nodes.length === 0) return [];
    const start = nodes[0].id;
    switch (selectedAlgorithm) {
      case 'BFS':      return runBFS(nodes, edges, start);
      case 'DFS':      return runDFS(nodes, edges, start);
      case 'Dijkstra': return runDijkstra(nodes, edges, start);
      default:         return [];
    }
  }, [nodes, edges, selectedAlgorithm]);

  const {
    currentFrame, currentFrameIndex, isPlaying, speed, setSpeed,
    play, pause, reset, stepForward, stepBackward, totalFrames,
  } = useGraphSimulation(frames);

  // Merge algorithm state into nodes
  const highlightedNodes = useMemo(() =>
    nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        isCurrent: currentFrame?.currentNodeId === n.id,
        isVisited: currentFrame?.visitedNodeIds.includes(n.id) ?? false,
        distance:  currentFrame?.distances?.[n.id],
      },
    })),
  [nodes, currentFrame]);

  // Merge algorithm state into edges — force type="straight"
  const highlightedEdges = useMemo(() =>
    edges.map(e => {
      const active      = currentFrame?.activeEdgeIds.includes(e.id) ?? false;
      const activeColor = '#818cf8'; // indigo-400
      const idleColor   = 'rgba(113,113,122,0.6)'; // zinc-500/60

      let markerEnd = e.markerEnd;
      if (typeof markerEnd === 'object' && markerEnd !== null) {
        markerEnd = { ...(markerEnd as object), color: active ? activeColor : idleColor } as any;
      }

      return {
        ...e,
        type: 'straight',       // ← ALWAYS straight
        animated: active,
        style: {
          stroke:      active ? activeColor : idleColor,
          strokeWidth: active ? 2.5 : 2,
          transition:  'stroke 0.25s ease, stroke-width 0.25s ease',
        },
        markerEnd,
      };
    }),
  [edges, currentFrame]);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={highlightedNodes}
        edges={highlightedEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'straight' }}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        colorMode="dark"
        nodesDraggable
        nodesConnectable
        elementsSelectable
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        minZoom={0.15}
        maxZoom={4}
        deleteKeyCode="Delete"
        style={{ background: 'transparent' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="rgba(255,255,255,0.035)"
          gap={28}
          size={1.5}
        />
        <Controls
          showInteractive={false}
          showFitView
          showZoom
          className="!bg-zinc-900/90 !border-zinc-700/50 !shadow-2xl [&>button]:!bg-zinc-900 [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-800 [&>button:hover]:!text-white [&>button]:!border-zinc-700/50"
        />
        <MiniMap
          nodeColor={n => {
            const d = n.data as any;
            if (d.isCurrent) return '#f59e0b';
            if (d.isVisited) return '#10b981';
            return '#3f3f46';
          }}
          maskColor="rgba(0,0,0,0.55)"
          style={{
            background: '#18181b',
            border: '1px solid rgba(63,63,70,0.5)',
            borderRadius: 8,
          }}
          nodeStrokeWidth={2}
        />
      </ReactFlow>

      {/* Playback bar — floating at the bottom */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20"
           style={{ width: 'calc(100% - 40px)', maxWidth: 780 }}>
        <PlaybackControls
          isPlaying={isPlaying}
          onPlay={play}
          onPause={pause}
          onReset={reset}
          onStepForward={stepForward}
          onStepBackward={stepBackward}
          speed={speed}
          onSpeedChange={setSpeed}
          selectedAlgorithm={selectedAlgorithm}
          onAlgorithmChange={setSelectedAlgorithm}
          currentFrameIndex={currentFrameIndex}
          totalFrames={totalFrames}
          description={currentFrame?.description}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public export — wrapped in ReactFlowProvider
// ─────────────────────────────────────────────────────────────────────────────
export function GraphVisualizer(props: GraphVisualizerProps) {
  return (
    <ReactFlowProvider>
      <GraphVisualizerInner {...props} />
    </ReactFlowProvider>
  );
}
