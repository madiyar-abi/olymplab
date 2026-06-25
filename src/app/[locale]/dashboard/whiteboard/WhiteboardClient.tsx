'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { 
  Pencil, 
  Eraser, 
  Trash2, 
  Download,
  Square,
  Circle,
  Minus,
  MoveRight
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type Tool = 'pencil' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'arrow'

type Point = { x: number; y: number }
type Path = {
  type: 'path' | 'rectangle' | 'circle' | 'line' | 'arrow'
  points: Point[]
  color: string
  lineWidth: number
}

export default function WhiteboardClient() {
  const t = useTranslations('Whiteboard')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pencil')
  const [color, setColor] = useState('#3b82f6') // primary blue
  const [lineWidth, setLineWidth] = useState(3)

  // Drawing state
  const [paths, setPaths] = useState<Path[]>([])
  const [currentPath, setCurrentPath] = useState<Path | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Rendering function
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Render all saved paths
    const allPaths = currentPath ? [...paths, currentPath] : paths

    for (const path of allPaths) {
      if (path.points.length === 0) continue

      ctx.beginPath()
      ctx.strokeStyle = path.color
      ctx.lineWidth = path.lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (path.type === 'path') {
        ctx.moveTo(path.points[0].x, path.points[0].y)
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y)
        }
      } else if (path.type === 'rectangle' && path.points.length === 2) {
        const [start, end] = path.points
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y)
      } else if (path.type === 'circle' && path.points.length === 2) {
        const [start, end] = path.points
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI)
      } else if (path.type === 'line' && path.points.length === 2) {
        const [start, end] = path.points
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
      } else if (path.type === 'arrow' && path.points.length === 2) {
        const [start, end] = path.points
        const headlen = 15 * (path.lineWidth / 3)
        const angle = Math.atan2(end.y - start.y, end.x - start.x)
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6))
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6))
      }
      
      ctx.stroke()
    }
  }, [paths, currentPath])

  // Initial resize and render
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }

    renderCanvas()
  }, [renderCanvas])

  // Re-render when paths change
  useEffect(() => {
    renderCanvas()
  }, [paths, currentPath, renderCanvas])

  // Erasing logic: removes the entire path if the mouse is close to it
  const erasePathsAt = (x: number, y: number) => {
    const eraserRadius = 15

    setPaths(prevPaths => prevPaths.filter(path => {
      if (path.type === 'path') {
        // Check if any point in the freehand path is within eraser radius
        for (const pt of path.points) {
          const dx = pt.x - x
          const dy = pt.y - y
          if (Math.sqrt(dx * dx + dy * dy) <= eraserRadius) return false
        }
        return true
      }

      // For shapes: check if eraser touches any of the 2 defining points or the bounding box
      if (path.points.length >= 2) {
        const [start, end] = path.points
        const minX = Math.min(start.x, end.x) - eraserRadius
        const maxX = Math.max(start.x, end.x) + eraserRadius
        const minY = Math.min(start.y, end.y) - eraserRadius
        const maxY = Math.max(start.y, end.y) + eraserRadius
        // Check if eraser is inside the bounding box of the shape
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) return false
      }
      return true
    }))
  }


  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    let x, y
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = (e as React.MouseEvent).clientX - rect.left
      y = (e as React.MouseEvent).clientY - rect.top
    }
    return { x, y }
  }

  const startInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e)
    if (!coords) return

    if (tool === 'pencil') {
      setCurrentPath({
        type: 'path',
        points: [coords],
        color,
        lineWidth
      })
      setIsDrawing(true)
    } else if (tool === 'eraser') {
      erasePathsAt(coords.x, coords.y)
      setIsDrawing(true)
    } else {
      setCurrentPath({
        type: tool as Path['type'],
        points: [coords, coords],
        color,
        lineWidth
      })
      setIsDrawing(true)
    }
  }

  const interact = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const coords = getCoordinates(e)
    if (!coords) return

    if (tool === 'pencil' && currentPath) {
      setCurrentPath(prev => {
        if (!prev) return null
        return {
          ...prev,
          points: [...prev.points, coords]
        }
      })
    } else if (tool === 'eraser') {
      erasePathsAt(coords.x, coords.y)
    } else if (currentPath) {
      setCurrentPath(prev => {
        if (!prev) return null
        return {
          ...prev,
          points: [prev.points[0], coords]
        }
      })
    }
  }

  const stopInteraction = () => {
    if (isDrawing) {
      if (currentPath) {
        setPaths(prev => [...prev, currentPath])
        setCurrentPath(null)
      }
      setIsDrawing(false)
    }
  }

  const clearCanvas = () => {
    setPaths([])
    setCurrentPath(null)
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const link = document.createElement('a')
      link.download = 'whiteboard-capture.png'
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      <header className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight font-mono">{t('title')}</h1>
          <p className="text-muted-foreground font-mono text-xs mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
           <button
            onClick={downloadImage}
            className="p-2 rounded-lg bg-secondary/50 border border-border text-muted-foreground hover:text-foreground transition-colors"
            title={t('downloadPng')}
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
            title={t('clearAll')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Toolbar */}
        <div className="w-16 flex flex-col items-center py-4 bg-card border border-border rounded-2xl space-y-4 shadow-sm overflow-y-auto no-scrollbar">
          <ToolButton
            active={tool === 'pencil'}
            onClick={() => setTool('pencil')}
            icon={<Pencil className="w-5 h-5" />}
            label={t('draw')}
          />
          <ToolButton
            active={tool === 'eraser'}
            onClick={() => setTool('eraser')}
            icon={<Eraser className="w-5 h-5" />}
            label={t('erase')}
          />
          <div className="h-px w-8 bg-border my-1" />
          <ToolButton
            active={tool === 'rectangle'}
            onClick={() => setTool('rectangle')}
            icon={<Square className="w-5 h-5" />}
            label={t('rectangle')}
          />
          <ToolButton
            active={tool === 'circle'}
            onClick={() => setTool('circle')}
            icon={<Circle className="w-5 h-5" />}
            label={t('circle')}
          />
          <ToolButton
            active={tool === 'line'}
            onClick={() => setTool('line')}
            icon={<Minus className="w-5 h-5" />}
            label={t('line')}
          />
          <ToolButton
            active={tool === 'arrow'}
            onClick={() => setTool('arrow')}
            icon={<MoveRight className="w-5 h-5" />}
            label={t('arrow')}
          />
          
          <div className="h-px w-8 bg-border my-2" />

          {/* Color Palette */}
          {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ffffff'].map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pencil'); }}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                color === c ? "border-primary scale-125" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}

          <div className="h-px w-8 bg-border my-2" />
          
          <div className="flex flex-col items-center">
            <div className="h-32 w-8 flex items-center justify-center">
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={lineWidth} 
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="appearance-none w-24 h-1.5 bg-white/10 rounded-full outline-none cursor-pointer -rotate-90 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
              />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-4">{t('size')}</span>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden relative shadow-inner group">
          <canvas
            ref={canvasRef}
            onMouseDown={startInteraction}
            onMouseMove={interact}
            onMouseUp={stopInteraction}
            onMouseLeave={stopInteraction}
            onTouchStart={startInteraction}
            onTouchMove={interact}
            onTouchEnd={stopInteraction}
            className={cn(
              "w-full h-full touch-none",
              tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'
            )}
          />
          
          {/* Grid Background Overlay (Visual Only) */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
            <div className="absolute inset-0" style={{ 
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', 
              backgroundSize: '30px 30px' 
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2.5 rounded-xl transition-all duration-200 group relative",
        active 
          ? "bg-primary text-primary-foreground shadow-md" 
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
      title={label}
    >
      {icon}
      {!active && (
        <span className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-border uppercase tracking-widest font-mono">
          {label}
        </span>
      )}
    </button>
  )
}
