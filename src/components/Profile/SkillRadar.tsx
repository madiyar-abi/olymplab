'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { SkillAxes } from '@/types/database'
import { Cpu } from 'lucide-react'

interface SkillRadarProps {
  skills: Partial<Record<SkillAxes, number>>
}

interface AxisConfig {
  key: SkillAxes
  color: string
  ringColor: string
}

const AXES: AxisConfig[] = [
  { key: 'algorithms', color: '#38bdf8', ringColor: 'text-sky-400' },
  { key: 'data_structures', color: '#818cf8', ringColor: 'text-indigo-400' },
  { key: 'complexity', color: '#c084fc', ringColor: 'text-violet-400' },
  { key: 'coding', color: '#f472b6', ringColor: 'text-pink-400' },
  { key: 'debugging', color: '#fb7185', ringColor: 'text-rose-400' },
  { key: 'speed', color: '#fbbf24', ringColor: 'text-amber-400' },
  { key: 'logic', color: '#34d399', ringColor: 'text-emerald-400' },
  { key: 'math', color: '#22d3ee', ringColor: 'text-cyan-400' },
  { key: 'graphs', color: '#60a5fa', ringColor: 'text-blue-400' },
]

const SIZE = 380
const CENTER = SIZE / 2
const MAX_RADIUS = 135
const NUM_AXES = AXES.length

function getCoordinates(index: number, ratio: number) {
  const angle = (index * 2 * Math.PI) / NUM_AXES - Math.PI / 2
  const x = CENTER + MAX_RADIUS * ratio * Math.cos(angle)
  const y = CENTER + MAX_RADIUS * ratio * Math.sin(angle)
  return { x, y }
}

export default function SkillRadar({ skills }: SkillRadarProps) {
  const t = useTranslations('Profile')
  const tProblems = useTranslations('Problems')
  const [hoveredAxis, setHoveredAxis] = useState<SkillAxes | null>(null)

  // Calculate coordinates for web rings and values
  const webLevels = [0.25, 0.5, 0.75, 1.0]

  // Polygon points for user's skills
  const points = useMemo(() => {
    return AXES.map((axis, i) => {
      const rawVal = skills[axis.key] ?? 35 // fallback baseline if new account
      const normalized = Math.max(10, Math.min(100, rawVal)) / 100
      const { x, y } = getCoordinates(i, normalized)
      return `${x},${y}`
    }).join(' ')
  }, [skills])

  // Average score
  const avgScore = useMemo(() => {
    const values = AXES.map(a => skills[a.key] ?? 35)
    const sum = values.reduce((acc, v) => acc + v, 0)
    return Math.round(sum / AXES.length)
  }, [skills])

  const levelBadge = useMemo(() => {
    if (avgScore >= 85) return { label: t('levelMaster'), color: 'text-red-400 border-red-500/30 bg-red-500/10' }
    if (avgScore >= 65) return { label: t('levelExpert'), color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' }
    if (avgScore >= 45) return { label: t('levelSpecialist'), color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' }
    return { label: t('levelNovice'), color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' }
  }, [avgScore, t])

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-foreground font-mono uppercase tracking-widest">
              {t('skillRadarTitle')}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {t('skillRadarSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">{t('overallProficiency')}</p>
            <p className="text-xl font-bold font-mono text-foreground">{avgScore}<span className="text-xs text-muted-foreground">/100</span></p>
          </div>
          <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold font-mono uppercase tracking-wider ${levelBadge.color}`}>
            {levelBadge.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Radar SVG Visualizer */}
        <div className="lg:col-span-6 flex justify-center items-center relative py-4">
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="overflow-visible select-none max-w-full h-auto drop-shadow-2xl"
          >
            <defs>
              <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#d97706" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="0.02" />
              </radialGradient>
              <linearGradient id="polyStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>

            {/* Concentric grid webs */}
            {webLevels.map((lvl) => {
              const ringPoints = AXES.map((_, i) => {
                const { x, y } = getCoordinates(i, lvl)
                return `${x},${y}`
              }).join(' ')

              return (
                <polygon
                  key={lvl}
                  points={ringPoints}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border/40"
                  strokeDasharray={lvl === 1.0 ? 'none' : '3,3'}
                />
              )
            })}

            {/* Axis spokes */}
            {AXES.map((axis, i) => {
              const { x, y } = getCoordinates(i, 1.0)
              const isHovered = hoveredAxis === axis.key
              return (
                <line
                  key={axis.key}
                  x1={CENTER}
                  y1={CENTER}
                  x2={x}
                  y2={y}
                  stroke={isHovered ? axis.color : 'currentColor'}
                  strokeWidth={isHovered ? 1.5 : 1}
                  className={isHovered ? '' : 'text-border/40'}
                />
              )
            })}

            {/* User skill polygon with animation */}
            <motion.polygon
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
              points={points}
              fill="url(#radarGlow)"
              stroke="url(#polyStroke)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Axis points & labels */}
            {AXES.map((axis, i) => {
              const val = skills[axis.key] ?? 35
              const ratio = Math.max(10, Math.min(100, val)) / 100
              const coord = getCoordinates(i, ratio)
              const labelCoord = getCoordinates(i, 1.22)
              const isHovered = hoveredAxis === axis.key

              return (
                <g
                  key={axis.key}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredAxis(axis.key)}
                  onMouseLeave={() => setHoveredAxis(null)}
                >
                  {/* Point marker */}
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={isHovered ? 6 : 4}
                    fill={axis.color}
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />

                  {/* Axis Label */}
                  <text
                    x={labelCoord.x}
                    y={labelCoord.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-[10px] font-mono font-bold transition-all duration-200 ${
                      isHovered ? 'fill-amber-400 font-extrabold text-[11px]' : 'fill-muted-foreground'
                    }`}
                  >
                    {tProblems(`skills.${axis.key}`)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Breakdown List */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase pb-2 border-b border-border/40">
            <span>Skill Dimension</span>
            <span>Mastery Score</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {AXES.map((axis) => {
              const val = Math.round(skills[axis.key] ?? 35)
              const isHovered = hoveredAxis === axis.key

              return (
                <div
                  key={axis.key}
                  onMouseEnter={() => setHoveredAxis(axis.key)}
                  onMouseLeave={() => setHoveredAxis(null)}
                  className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col gap-1.5 cursor-pointer ${
                    isHovered
                      ? 'border-amber-500/40 bg-secondary/80 shadow-md'
                      : 'border-border/60 bg-secondary/30 hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: axis.color }}
                      />
                      <span className="font-semibold text-foreground">
                        {tProblems(`skills.${axis.key}`)}
                      </span>
                    </div>
                    <span className="font-bold text-foreground tabular-nums">
                      {val}<span className="text-[10px] text-muted-foreground">/100</span>
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/40">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: axis.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
