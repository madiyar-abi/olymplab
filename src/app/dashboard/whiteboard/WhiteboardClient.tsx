'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { 
  Pencil, 
  Eraser, 
  Trash2, 
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Tool = 'pencil' | 'eraser'

type Point = { x: number; y: number }
type Path = {
  points: Point[]
  color: string
  lineWidth: number
}

export default function WhiteboardClient() {
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
      ctx.moveTo(path.points[0].x, path.points[0].y)
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y)
      }
      
      ctx.strokeStyle = path.color
      ctx.lineWidth = path.lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
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
    const eraserRadius = 15 // Tolerance for erasing

    setPaths(prevPaths => prevPaths.filter(path => {
      // Check if any point in the path is within the eraser radius
      for (const pt of path.points) {
        const dx = pt.x - x
        const dy = pt.y - y
        if (Math.sqrt(dx * dx + dy * dy) <= eraserRadius) {
          return false // Remove this path
        }
      }
      return true // Keep this path
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
        points: [coords],
        color,
        lineWidth
      })
      setIsDrawing(true)
    } else if (tool === 'eraser') {
      erasePathsAt(coords.x, coords.y)
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
    }
  }

  const stopInteraction = () => {
    if (isDrawing) {
      if (tool === 'pencil' && currentPath) {
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
          <h1 className="text-3xl font-bold text-foreground tracking-tight font-mono">Whiteboard</h1>
          <p className="text-muted-foreground font-mono text-xs mt-1">Sketch your logic and map out algorithms.</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={downloadImage}
            className="p-2 rounded-lg bg-secondary/50 border border-border text-muted-foreground hover:text-foreground transition-colors"
            title="Download PNG"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={clearCanvas}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
            title="Clear All"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Toolbar */}
        <div className="w-16 flex flex-col items-center py-4 bg-card border border-border rounded-2xl space-y-4 shadow-sm">
          <ToolButton 
            active={tool === 'pencil'} 
            onClick={() => setTool('pencil')} 
            icon={<Pencil className="w-5 h-5" />} 
            label="Draw"
          />
          <ToolButton 
            active={tool === 'eraser'} 
            onClick={() => setTool('eraser')} 
            icon={<Eraser className="w-5 h-5" />} 
            label="Erase"
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
          
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold font-mono text-muted-foreground uppercase">Size</span>
            {[2, 4, 8].map((s) => (
              <button
                key={s}
                onClick={() => setLineWidth(s)}
                className={cn(
                  "rounded-full bg-muted transition-all",
                  lineWidth === s ? "w-4 h-4 bg-primary" : "w-2 h-2 hover:bg-muted-foreground"
                )}
              />
            ))}
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
