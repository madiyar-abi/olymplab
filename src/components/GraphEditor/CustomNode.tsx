'use client'
import { Handle, NodeProps, Position } from '@xyflow/react'

const CENTER: React.CSSProperties = {
  top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  opacity: 0, pointerEvents: 'none',
  border: 'none', background: 'transparent',
  width: 1, height: 1,
}

export default function CustomNode({ data, selected }: NodeProps) {
  const d = data as { label: string; isCurrent?: boolean; isVisited?: boolean; distance?: number }

  const base = 'w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 font-bold text-base select-none cursor-grab transition-all duration-200 relative'

  const state = d.isCurrent
    ? 'bg-amber-400 border-amber-300 text-black ring-4 ring-offset-2 ring-offset-neutral-950 ring-amber-400/70'
    : d.isVisited
    ? 'bg-emerald-600 border-emerald-400 text-white ring-4 ring-offset-2 ring-offset-neutral-950 ring-emerald-500/60'
    : selected
    ? 'bg-neutral-800 border-indigo-400 text-white ring-4 ring-offset-2 ring-offset-neutral-950 ring-indigo-500/50'
    : 'bg-neutral-800 border-neutral-500 text-white hover:border-neutral-300'

  return (
    <div className={`${base} ${state}`}>
      <Handle type="target"  position={Position.Top}    style={CENTER} />
      <span style={{ lineHeight: 1 }}>{d.label}</span>
      {d.distance !== undefined && (
        <span className="text-[9px] font-semibold opacity-70 leading-none mt-0.5">
          {d.distance === Infinity ? '∞' : d.distance}
        </span>
      )}
      <Handle type="source" position={Position.Bottom} style={CENTER} />
    </div>
  )
}
