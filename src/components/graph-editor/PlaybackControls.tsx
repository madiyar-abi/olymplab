import React from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { AlgorithmType } from '../../utils/graphAlgorithms';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  selectedAlgorithm: AlgorithmType;
  onAlgorithmChange: (algo: AlgorithmType) => void;
  currentFrameIndex: number;
  totalFrames: number;
  description?: string;
}

const ALGORITHMS: AlgorithmType[] = ['BFS', 'DFS', 'Dijkstra'];

const ALGO_COLORS: Record<AlgorithmType, string> = {
  BFS:      '#6366f1',
  DFS:      '#f59e0b',
  Dijkstra: '#10b981',
};

export function PlaybackControls({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  onStepForward,
  onStepBackward,
  speed,
  onSpeedChange,
  selectedAlgorithm,
  onAlgorithmChange,
  currentFrameIndex,
  totalFrames,
  description
}: PlaybackControlsProps) {
  const progress = totalFrames > 0 ? ((currentFrameIndex + 1) / totalFrames) * 100 : 0;
  const accentColor = ALGO_COLORS[selectedAlgorithm];

  return (
    <div
      style={{
        background: 'rgba(9,9,11,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(63,63,70,0.7)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset',
        overflow: 'hidden',
      }}
    >
      {/* Progress bar at top */}
      <div className="relative h-0.5 w-full" style={{ background: 'rgba(63,63,70,0.5)' }}>
        <div
          className="absolute top-0 left-0 h-full transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(to right, ${accentColor}aa, ${accentColor})`,
            boxShadow: `0 0 8px ${accentColor}80`,
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3">

        {/* Algorithm selector */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest hidden sm:block">
            Algorithm
          </span>
          <div className="flex rounded-lg overflow-hidden border border-zinc-700/60 text-[11px] font-mono">
            {ALGORITHMS.map(algo => (
              <button
                key={algo}
                id={`algo-${algo.toLowerCase()}`}
                onClick={() => onAlgorithmChange(algo)}
                className="px-3 py-1 transition-all duration-200"
                style={{
                  background: selectedAlgorithm === algo ? ALGO_COLORS[algo] + '22' : 'transparent',
                  color: selectedAlgorithm === algo ? ALGO_COLORS[algo] : '#71717a',
                  fontWeight: selectedAlgorithm === algo ? 700 : 400,
                  borderRight: algo !== 'Dijkstra' ? '1px solid rgba(63,63,70,0.6)' : 'none',
                }}
              >
                {algo}
              </button>
            ))}
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-1">
          <button
            id="playback-reset"
            onClick={onReset}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all duration-200"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-zinc-700/60 mx-1" />

          <button
            id="playback-backward"
            onClick={onStepBackward}
            className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
            disabled={currentFrameIndex === 0}
            title="Step Backward"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            id="playback-play"
            onClick={isPlaying ? onPause : onPlay}
            className="w-9 h-9 flex items-center justify-center rounded-full font-bold text-black transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg ml-0.5 mr-0.5"
            style={{
              background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor})`,
              boxShadow: `0 4px 16px ${accentColor}55`,
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause className="w-4 h-4 fill-current" />
              : <Play className="w-4 h-4 fill-current ml-0.5" />
            }
          </button>

          <button
            id="playback-forward"
            onClick={onStepForward}
            className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
            disabled={currentFrameIndex === totalFrames - 1 || totalFrames === 0}
            title="Step Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Speed + frame counter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest hidden sm:block">
              Speed
            </span>
            <input
              id="speed-slider"
              type="range"
              min="100"
              max="2000"
              step="100"
              value={2100 - speed}
              onChange={(e) => onSpeedChange(2100 - Number(e.target.value))}
              className="w-20 cursor-pointer"
              style={{
                height: 4,
                appearance: 'none',
                background: `linear-gradient(to right, ${accentColor}aa ${((2100 - speed - 100) / 1900) * 100}%, rgba(63,63,70,0.6) ${((2100 - speed - 100) / 1900) * 100}%)`,
                outline: 'none',
                borderRadius: 4,
              }}
            />
            <span className="text-[9px] font-mono text-zinc-500 w-8 tabular-nums">
              {(speed / 1000).toFixed(1)}s
            </span>
          </div>

          <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
            {totalFrames > 0 ? `${currentFrameIndex + 1} / ${totalFrames}` : '0 / 0'}
          </span>
        </div>
      </div>

      {/* Description bar */}
      {description && (
        <div
          className="px-5 pb-3 flex items-center gap-2"
          style={{ marginTop: -4 }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
          />
          <span className="text-[10px] font-mono truncate" style={{ color: accentColor + 'cc' }}>
            {description}
          </span>
        </div>
      )}
    </div>
  );
}
