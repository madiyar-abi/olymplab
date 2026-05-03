"use client"

import React, { useMemo, useState, useCallback, useSyncExternalStore } from 'react'
import ReactDOM from 'react-dom'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ContributionGraphProps {
  data: { date: string; count: number }[]
}

interface DayCell {
  date: Date
  dateString: string
  count: number
  isEmpty: boolean   // offset cell (before start) or future cell
}

interface TooltipState {
  anchorX: number  // center-x of the cell in viewport coords
  anchorY: number  // top-y of the cell in viewport coords
  tasksText: string
  dateText: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CELL = 14    // px — cell size
const GAP  = 2     // px — gap between cells

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

// ─── Tooltip rendered in a portal so it never gets clipped ───────────────────
function TooltipPortal({ tip }: { tip: TooltipState | null }) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  if (!mounted || !tip) return null

  const TOOLTIP_W = 200
  const TOOLTIP_H = 40
  const MARGIN    = 10
  const ABOVE_GAP = 10   // gap between cell top and tooltip bottom

  // Position centered above the cell
  let left = tip.anchorX - TOOLTIP_W / 2
  let top  = tip.anchorY - TOOLTIP_H - ABOVE_GAP

  // Clamp within viewport
  left = Math.max(MARGIN, Math.min(left, window.innerWidth  - TOOLTIP_W - MARGIN))
  const flipBelow = top < MARGIN
  if (flipBelow) top = tip.anchorY + CELL + GAP + ABOVE_GAP

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        left: left,
        top:  top,
        width: TOOLTIP_W,
        zIndex: 99999,
        pointerEvents: 'none',
      }}
      className="px-3 py-2 rounded-lg border border-border bg-card shadow-2xl font-mono text-xs whitespace-nowrap"
    >
      <div className="relative z-10 flex items-center gap-1">
        <span className="font-bold text-foreground">{tip.tasksText}</span>
        <span className="text-muted-foreground">on {tip.dateText}</span>
      </div>
      {/* Arrow */}
      {!flipBelow && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-card" />
      )}
      {flipBelow && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-card" />
      )}
    </div>,
    document.body
  )
}

// ─── Cell intensity ───────────────────────────────────────────────────────────
function intensityClass(count: number, isEmpty: boolean) {
  if (isEmpty) return 'bg-transparent border-transparent'
  if (count === 0) return 'bg-secondary/50 border-border/10'
  if (count <= 2)  return 'bg-[#0e4429] border-[#006d32]/30'
  if (count <= 5)  return 'bg-[#006d32] border-[#26a641]/40'
  if (count <= 8)  return 'bg-[#26a641] border-[#39d353]/50'
  return 'bg-[#39d353] border-[#39d353]/60 shadow-[0_0_8px_rgba(57,211,83,0.15)] dark:shadow-[0_0_8px_rgba(57,211,83,0.25)]'
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ContributionGraph({ data }: ContributionGraphProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // ── Build grid ────────────────────────────────────────────────────────────
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start date: exactly 364 days before today (365 days total, inclusive)
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 364)

    // The grid always shows Sun–Sat columns.
    // startDate may not be a Sunday → offset empty cells at the start.
    const startDow = startDate.getDay()  // 0 = Sun … 6 = Sat

    // Grid begins on the Sunday of startDate's week
    const gridStart = new Date(startDate)
    gridStart.setDate(startDate.getDate() - startDow)

    // Grid ends on the Saturday of today's week
    const todayDow = today.getDay()
    const gridEnd = new Date(today)
    gridEnd.setDate(today.getDate() + (6 - todayDow))

    // Count map
    const countMap = new Map<string, number>()
    data.forEach(d => countMap.set(d.date, d.count))

    // Build weeks
    const weeksArr: DayCell[][] = []
    const monthsArr: { label: string; colIndex: number }[] = []
    let seenMonth = -1
    const cur = new Date(gridStart)

    while (cur <= gridEnd) {
      const week: DayCell[] = []
      for (let d = 0; d < 7; d++) {
        const isBeforeStart = cur < startDate
        const isAfterToday  = cur > today

        const tzOff = cur.getTimezoneOffset() * 60000
        const dateStr = new Date(cur.getTime() - tzOff).toISOString().split('T')[0]

        const month = cur.getMonth()
        if (d === 0 && !isBeforeStart && !isAfterToday && month !== seenMonth) {
          monthsArr.push({ label: MONTH_NAMES[month], colIndex: weeksArr.length })
          seenMonth = month
        }

        week.push({
          date: new Date(cur),
          dateString: dateStr,
          count: countMap.get(dateStr) ?? 0,
          isEmpty: isBeforeStart || isAfterToday,
        })
        cur.setDate(cur.getDate() + 1)
      }
      weeksArr.push(week)
    }

    return { weeks: weeksArr, monthLabels: monthsArr }
  }, [data])

  // ── Tooltip handlers ──────────────────────────────────────────────────────
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>, day: DayCell) => {
    if (day.isEmpty) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const tasksText = day.count === 1 ? '1 задача' : `${day.count} задач`
    const dateText  = day.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
    setTooltip({
      anchorX: rect.left + rect.width / 2,
      anchorY: rect.top,
      tasksText,
      dateText,
    })
  }, [])

  const handleMouseLeave = useCallback(() => setTooltip(null), [])

  // ── Render ────────────────────────────────────────────────────────────────
  const COL_W = CELL + GAP   // column width including gap

  return (
    <>
      <TooltipPortal tip={tooltip} />

      <div className="w-full overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="inline-flex flex-col min-w-max px-1">

          {/* Month labels */}
          <div className="flex mb-2 ml-[28px]" style={{ position: 'relative', height: 16 }}>
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="absolute text-[11px] text-muted-foreground font-mono"
                style={{ left: m.colIndex * COL_W }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-0.5">
            {/* Day-of-week labels — Mon / Wed / Fri */}
            <div
              className="flex flex-col mr-1.5"
              style={{ gap: GAP, width: 24 }}
            >
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => (
                <div
                  key={day}
                  className="text-[10px] text-muted-foreground font-mono text-right leading-none flex items-center justify-end"
                  style={{ height: CELL }}
                >
                  {/* Show Mon (1), Wed (3), Fri (5) */}
                  {(i === 1 || i === 3 || i === 5) ? day : ''}
                </div>
              ))}
            </div>

            {/* Columns (weeks) */}
            <div className="flex" style={{ gap: GAP }}>
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col" style={{ gap: GAP }}>
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      onMouseEnter={day.isEmpty ? undefined : (e) => handleMouseEnter(e, day)}
                      onMouseLeave={day.isEmpty ? undefined : handleMouseLeave}
                      className={cn(
                        'rounded-sm border transition-all duration-200',
                        !day.isEmpty && 'cursor-default hover:scale-110 hover:border-primary/40',
                        intensityClass(day.count, day.isEmpty)
                      )}
                      style={{ width: CELL, height: CELL }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
