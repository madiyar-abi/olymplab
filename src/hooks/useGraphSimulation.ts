import { useState, useEffect, useCallback, useRef } from 'react';
import { SimulationFrame } from '../utils/graphAlgorithms';

export function useGraphSimulation(frames: SimulationFrame[]) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800); // ms per frame

  // Reset playback when a new set of frames is loaded. Using the "adjust state
  // during render" pattern (vs. an effect) avoids a cascading re-render.
  const [prevFrames, setPrevFrames] = useState(frames);
  if (frames !== prevFrames) {
    setPrevFrames(frames);
    setCurrentFrameIndex(0);
    setIsPlaying(false);
  }

  // Mirror the index into a ref so the interval callback can read the latest
  // value without restarting the interval on every frame change.
  const indexRef = useRef(currentFrameIndex);
  useEffect(() => {
    indexRef.current = currentFrameIndex;
  }, [currentFrameIndex]);

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
    if (!isPlaying) return;
    const id = setInterval(() => {
      // Stop at the last frame. Setting state here is inside a timer callback,
      // not synchronously in the effect body, so it doesn't cascade.
      if (indexRef.current >= frames.length - 1) {
        setIsPlaying(false);
        return;
      }
      setCurrentFrameIndex((prev) => Math.min(prev + 1, frames.length - 1));
    }, speed);
    return () => clearInterval(id);
  }, [isPlaying, frames.length, speed]);

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
