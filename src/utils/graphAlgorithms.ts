import { Node, Edge } from '@xyflow/react';

export interface SimulationFrame {
  currentNodeId: string | null;
  visitedNodeIds: string[];
  activeEdgeIds: string[];
  queueIds?: string[];
  stackIds?: string[];
  distances?: Record<string, number>;
  description: string;
}

export type AlgorithmType = 'BFS' | 'DFS' | 'Dijkstra';

export function runBFS(nodes: Node[], edges: Edge[], startNodeId: string): SimulationFrame[] {
  const frames: SimulationFrame[] = [];
  const adj: Record<string, string[]> = {};
  
  nodes.forEach(node => {
    adj[node.id] = [];
  });
  
  edges.forEach(edge => {
    adj[edge.source].push(edge.target);
    // Also add reverse direction for undirected-style traversal
    if (adj[edge.target] !== undefined) {
      adj[edge.target].push(edge.source);
    }
  });

  const visited = new Set<string>();
  const queue: string[] = [startNodeId];
  visited.add(startNodeId);

  frames.push({
    currentNodeId: startNodeId,
    visitedNodeIds: Array.from(visited),
    activeEdgeIds: [],
    queueIds: [...queue],
    description: `Starting BFS from node ${startNodeId}`,
  });

  while (queue.length > 0) {
    const u = queue.shift()!;
    
    frames.push({
      currentNodeId: u,
      visitedNodeIds: Array.from(visited),
      activeEdgeIds: [],
      queueIds: [...queue],
      description: `Visiting node ${u}`,
    });

    for (const v of adj[u]) {
      const edgeId = edges.find(e => e.source === u && e.target === v)?.id || '';
      
      if (!visited.has(v)) {
        visited.add(v);
        queue.push(v);
        
        frames.push({
          currentNodeId: u,
          visitedNodeIds: Array.from(visited),
          activeEdgeIds: [edgeId],
          queueIds: [...queue],
          description: `Exploring edge ${u} -> ${v}, adding ${v} to queue`,
        });
      } else {
        frames.push({
          currentNodeId: u,
          visitedNodeIds: Array.from(visited),
          activeEdgeIds: [edgeId],
          queueIds: [...queue],
          description: `Edge ${u} -> ${v} leads to already visited node ${v}`,
        });
      }
    }
  }

  frames.push({
    currentNodeId: null,
    visitedNodeIds: Array.from(visited),
    activeEdgeIds: [],
    queueIds: [],
    description: 'BFS completed',
  });

  return frames;
}

export function runDFS(nodes: Node[], edges: Edge[], startNodeId: string): SimulationFrame[] {
  const frames: SimulationFrame[] = [];
  const adj: Record<string, string[]> = {};
  
  nodes.forEach(node => {
    adj[node.id] = [];
  });
  
  edges.forEach(edge => {
    adj[edge.source].push(edge.target);
  });

  const visited = new Set<string>();
  
  function dfs(u: string) {
    visited.add(u);
    frames.push({
      currentNodeId: u,
      visitedNodeIds: Array.from(visited),
      activeEdgeIds: [],
      description: `Visiting node ${u}`,
    });

    for (const v of adj[u]) {
      const edgeId = edges.find(e => e.source === u && e.target === v)?.id || '';
      
      if (!visited.has(v)) {
        frames.push({
          currentNodeId: u,
          visitedNodeIds: Array.from(visited),
          activeEdgeIds: [edgeId],
          description: `Moving from ${u} to ${v}`,
        });
        dfs(v);
        // Backtracking
        frames.push({
          currentNodeId: u,
          visitedNodeIds: Array.from(visited),
          activeEdgeIds: [],
          description: `Backtracked to ${u}`,
        });
      } else {
        frames.push({
          currentNodeId: u,
          visitedNodeIds: Array.from(visited),
          activeEdgeIds: [edgeId],
          description: `Edge ${u} -> ${v} points to already visited node`,
        });
      }
    }
  }

  dfs(startNodeId);
  
  frames.push({
    currentNodeId: null,
    visitedNodeIds: Array.from(visited),
    activeEdgeIds: [],
    description: 'DFS completed',
  });

  return frames;
}

export function runDijkstra(nodes: Node[], edges: Edge[], startNodeId: string): SimulationFrame[] {
  const frames: SimulationFrame[] = [];
  const adj: Record<string, { to: string; weight: number; edgeId: string }[]> = {};
  
  nodes.forEach(node => {
    adj[node.id] = [];
  });
  
  edges.forEach(edge => {
    const weight = typeof edge.data?.weight === 'number' ? edge.data.weight : 1;
    adj[edge.source].push({ to: edge.target, weight, edgeId: edge.id });
  });

  const distances: Record<string, number> = {};
  nodes.forEach(node => {
    distances[node.id] = Infinity;
  });
  distances[startNodeId] = 0;

  const visited = new Set<string>();
  const pq: { id: string; dist: number }[] = [{ id: startNodeId, dist: 0 }];

  frames.push({
    currentNodeId: null,
    visitedNodeIds: [],
    activeEdgeIds: [],
    distances: { ...distances },
    description: `Initialized distances. Start node ${startNodeId} distance set to 0.`,
  });

  while (pq.length > 0) {
    // Sort to simulate Priority Queue
    pq.sort((a, b) => a.dist - b.dist);
    const { id: u, dist: d } = pq.shift()!;

    if (visited.has(u)) continue;
    visited.add(u);

    frames.push({
      currentNodeId: u,
      visitedNodeIds: Array.from(visited),
      activeEdgeIds: [],
      distances: { ...distances },
      description: `Processing node ${u} with current shortest distance ${d}`,
    });

    for (const { to: v, weight, edgeId } of adj[u]) {
      if (visited.has(v)) continue;

      const newDist = d + weight;
      const isRelaxed = newDist < distances[v];
      
      if (isRelaxed) {
        distances[v] = newDist;
        pq.push({ id: v, dist: newDist });
      }

      frames.push({
        currentNodeId: u,
        visitedNodeIds: Array.from(visited),
        activeEdgeIds: [edgeId],
        distances: { ...distances },
        description: isRelaxed 
          ? `Relaxed edge ${u} -> ${v}: new distance to ${v} is ${newDist}`
          : `Edge ${u} -> ${v} does not provide a shorter path to ${v}`,
      });
    }
  }

  frames.push({
    currentNodeId: null,
    visitedNodeIds: Array.from(visited),
    activeEdgeIds: [],
    distances: { ...distances },
    description: 'Dijkstra completed',
  });

  return frames;
}
