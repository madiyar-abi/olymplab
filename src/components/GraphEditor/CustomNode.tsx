'use client'
import { Handle, NodeProps, Position } from '@xyflow/react'

// Small, hover-revealed connection points. Keeping them at the top/bottom edges
// (rather than covering the node) means dragging the node body rearranges it,
// while dragging from a handle starts an edge — both feel intuitive.
const handleClass =
  '!w-2.5 !h-2.5 !border-2 !border-background !bg-primary !opacity-0 ' +
  'group-hover:!opacity-100 !transition-opacity !duration-200 !shadow-[0_0_8px_rgba(59,130,246,0.6)]'

export default function CustomNode({ data, selected }: NodeProps) {
  const d = data as { label: string; isCurrent?: boolean; isVisited?: boolean; distance?: number }

  const base =
    'group relative w-12 h-12 rounded-full flex flex-col items-center justify-center ' +
    'font-semibold text-sm tabular-nums select-none cursor-grab border ' +
    'transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out ' +
    'active:cursor-grabbing active:scale-95'

  // Default is a calm dark disc; hover / selected / algorithm states layer in a
  // soft glow instead of thick rings.
  const state = d.isCurrent
    ? 'bg-amber-400 border-amber-300/80 text-neutral-950 shadow-[0_0_0_4px_rgba(251,191,36,0.18),0_0_24px_rgba(251,191,36,0.45)]'
    : d.isVisited
    ? 'bg-emerald-500 border-emerald-300/70 text-neutral-950 shadow-[0_0_0_4px_rgba(16,185,129,0.16),0_0_20px_rgba(16,185,129,0.35)]'
    : selected
    ? 'bg-card border-primary/70 text-foreground shadow-[0_0_0_4px_rgba(59,130,246,0.16),0_0_22px_rgba(59,130,246,0.4)]'
    : 'bg-card border-white/15 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.45)] ' +
      'hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-[0_0_0_4px_rgba(59,130,246,0.1),0_0_18px_rgba(59,130,246,0.28)]'

  return (
    <div className={`${base} ${state}`}>
      <Handle type="target" position={Position.Top} className={handleClass} />
      <span className="leading-none pointer-events-none">{d.label}</span>
      {d.distance !== undefined && (
        <span className="text-[9px] font-medium opacity-70 leading-none mt-0.5 pointer-events-none">
          {d.distance === Infinity ? '∞' : d.distance}
        </span>
      )}
      <Handle type="source" position={Position.Bottom} className={handleClass} />
    </div>
  )
}
