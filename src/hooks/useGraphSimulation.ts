import { useState, useEffect, useCallback, useRef } from 'react';
import { SimulationFrame } from '../utils/graphAlgorithms';

export function useGraphSimulation(frames: SimulationFrame[]) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800); // ms per frame
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const play = useCallback(() => {
    if (frames.length === 0) return;
    if (currentFrameIndex >= frames.length - 1) {
      setCurrentFrameIndex(0);
    }
    setIsPlaying(true);
  }, [currentFrameIndex, frames.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrameIndex(0);
  }, []);

  const stepForward = useCallback(() => {
    if (frames.length === 0) return;
    setCurrentFrameIndex((prev) => Math.min(prev + 1, frames.length - 1));
  }, [frames.length]);

  const stepBackward = useCallback(() => {
    setCurrentFrameIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const seek = useCallback((index: number) => {
    if (frames.length === 0) return;
    setCurrentFrameIndex(Math.max(0, Math.min(index, frames.length - 1)));
  }, [frames.length]);

  useEffect(() => {
    if (isPlaying && currentFrameIndex < frames.length - 1) {
      timerRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (currentFrameIndex >= frames.length - 1) {
        setIsPlaying(false);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentFrameIndex, frames.length, speed]);

  // Reset index if frames change
  useEffect(() => {
    setCurrentFrameIndex(0);
    setIsPlaying(false);
  }, [frames]);

  return {
    currentFrame: frames[currentFrameIndex] || null,
    currentFrameIndex,
    isPlaying,
    speed,
    setSpeed,
    play,
    pause,
    reset,
    stepForward,
    stepBackward,
    seek,
    isAtEnd: frames.length > 0 && currentFrameIndex === frames.length - 1,
    isAtStart: currentFrameIndex === 0,
    totalFrames: frames.length,
  };
}
