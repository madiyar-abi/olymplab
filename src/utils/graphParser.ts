import { Node, Edge, MarkerType } from '@xyflow/react'

export type IndexMode = '0-index' | '1-index'

function circleLayout(n: number, cx = 380, cy = 280) {
  if (n === 0) return []
  if (n === 1) return [{ x: cx, y: cy }]
  const r = Math.max(100, Math.min(220, 60 + n * 16))
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })
}

export function parseGraphData(
  raw: string,
  nodeCount: number,
  indexMode: IndexMode,
  isDirected: boolean,
): { nodes: Node[]; edges: Edge[] } {
  const offset    = indexMode === '1-index' ? 1 : 0
  const positions = circleLayout(nodeCount)

  const nodes: Node[] = Array.from({ length: nodeCount }, (_, i) => ({
    id:       `${i}`,
    type:     'custom',
    position: positions[i] ?? { x: 0, y: 0 },
    data:     { label: `${i + offset}` },
  }))

  const validIds = new Set(nodes.map(n => n.id))

  const edges: Edge[] = raw
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .flatMap((line, idx) => {
      const [uRaw, vRaw, wRaw] = line.split(/\s+/)
      if (!uRaw || !vRaw) return []

      const uId = `${parseInt(uRaw, 10) - offset}`
      const vId = `${parseInt(vRaw, 10) - offset}`
      if (!validIds.has(uId) || !validIds.has(vId) || uId === vId) return []

      const w = wRaw ? parseFloat(wRaw) : NaN

      return [{
        id:        `e-${uId}-${vId}-${idx}`,
        source:    uId,
        target:    vId,
        type:      'straight',
        label:     !isNaN(w) ? `${w}` : undefined,
        data:      { weight: isNaN(w) ? 1 : w },
        markerEnd: isDirected ? {
          type: MarkerType.ArrowClosed,
          width: 16, height: 16,
          color: 'rgba(113,113,122,0.7)',
        } : undefined,
      } as Edge]
    })

  return { nodes, edges }
}
