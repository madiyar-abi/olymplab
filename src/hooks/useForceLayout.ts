/**
 * useForceLayout
 *
 * Computes a physics-based (d3-force) layout for a ReactFlow graph.
 * Runs the simulation synchronously to completion so there is no
 * per-tick state thrash, then returns node positions as a stable Map.
 *
 * Usage:
 *   const { computeLayout } = useForceLayout()
 *   const laidOutNodes = computeLayout(nodes, edges, 800, 600)
 */
import { useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';

// ─── Internal d3 types ────────────────────────────────────────────────────────

interface SimNode extends SimulationNodeDatum {
  id: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string;
  target: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** How many simulation ticks to run before we snapshot positions */
const TICKS = 300;

/** Radius used for collision avoidance — should be ≥ half the node visual size */
const COLLISION_RADIUS = 44;

/** Target edge length in pixels */
const LINK_DISTANCE = 130;

/** Negative = repulsion.  Tune this to control how spread out the graph is. */
const CHARGE_STRENGTH = -700;

// ─── Core layout function (pure, no React) ────────────────────────────────────

/**
 * Given ReactFlow nodes + edges, runs a d3-force simulation and returns
 * a *new* nodes array with updated `position` values.
 *
 * We seed positions from the existing `node.position` values so that
 * subsequent calls (e.g. when only edges change) don't reset user-dragged
 * nodes — the simulation will nudge them gently rather than teleport them.
 *
 * @param nodes      Current ReactFlow node array
 * @param edges      Current ReactFlow edge array
 * @param cx         Horizontal center of the viewport (pixels)
 * @param cy         Vertical center of the viewport (pixels)
 * @param resetSeed  If true, scatter nodes randomly first (used by "Reset Layout")
 */
export function computeForceLayout(
  nodes: Node[],
  edges: Edge[],
  cx = 400,
  cy = 300,
  resetSeed = false,
): Node[] {
  if (nodes.length === 0) return nodes;

  // ── 1. Build d3 simulation nodes ──────────────────────────────────────────
  const simNodes: SimNode[] = nodes.map((n, i) => {
    let x: number;
    let y: number;

    if (resetSeed || (n.position.x === 0 && n.position.y === 0)) {
      // Place on a small jittered circle so nodes don't start stacked
      const angle = (2 * Math.PI * i) / nodes.length;
      const r     = 60 + Math.random() * 20;
      x = cx + r * Math.cos(angle);
      y = cy + r * Math.sin(angle);
    } else {
      // Seed from existing position — sim will nudge, not teleport
      x = n.position.x + (resetSeed ? 0 : Math.random() * 2 - 1);
      y = n.position.y + (resetSeed ? 0 : Math.random() * 2 - 1);
    }

    return { id: n.id, x, y };
  });

  const idSet = new Set(simNodes.map(n => n.id));

  // ── 2. Build d3 simulation links ──────────────────────────────────────────
  const simLinks: SimLink[] = edges
    .map(e => ({
      source: typeof e.source === 'string' ? e.source : (e.source as any).id as string,
      target: typeof e.target === 'string' ? e.target : (e.target as any).id as string,
    }))
    // Drop links that reference missing nodes (prevents d3 crash)
    .filter(l => idSet.has(l.source) && idSet.has(l.target));

  // ── 3. Configure & run simulation ─────────────────────────────────────────
  const simulation = forceSimulation<SimNode>(simNodes)
    // Repulsion — push nodes apart
    .force('charge', forceManyBody<SimNode>().strength(CHARGE_STRENGTH))
    // Attraction — pull connected nodes toward target distance
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id(d => d.id)
        .distance(LINK_DISTANCE)
        .strength(0.6),
    )
    // Gravity — keep the whole graph near the center
    .force('center', forceCenter<SimNode>(cx, cy).strength(0.08))
    // Weak X/Y centering to prevent drift on sparse graphs
    .force('x', forceX<SimNode>(cx).strength(0.04))
    .force('y', forceY<SimNode>(cy).strength(0.04))
    // Collision — ensure nodes don't overlap
    .force('collide', forceCollide<SimNode>(COLLISION_RADIUS).strength(0.9))
    // Don't start the async ticker
    .stop();

  // Run to convergence synchronously (no React re-renders during this)
  for (let i = 0; i < TICKS; i++) {
    simulation.tick();
  }

  // ── 4. Map positions back to ReactFlow nodes ───────────────────────────────
  const posMap = new Map<string, { x: number; y: number }>(
    simNodes.map(n => [n.id, { x: n.x ?? cx, y: n.y ?? cy }]),
  );

  return nodes.map(n => ({
    ...n,
    position: posMap.get(n.id) ?? n.position,
  }));
}

// ─── React hook wrapper ────────────────────────────────────────────────────────

/**
 * Thin React wrapper — exposes `computeLayout` as a stable callback so
 * it can be called imperatively (e.g. from "Reset Layout" button handler)
 * without triggering needless re-renders.
 */
export function useForceLayout() {
  const computeLayout = useCallback(
    (
      nodes: Node[],
      edges: Edge[],
      cx?: number,
      cy?: number,
      resetSeed?: boolean,
    ) => computeForceLayout(nodes, edges, cx, cy, resetSeed),
    [],
  );

  return { computeLayout };
}
