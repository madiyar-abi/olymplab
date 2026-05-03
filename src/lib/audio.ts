'use client'

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

/**
 * Plays a premium-feeling success sound using the Web Audio API.
 * This is a clean, Apple-like "Success" chime.
 */
export const playSuccessSound = () => {
  if (typeof window === 'undefined') return

  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  const audioContext = new AudioContextClass()
  
  const playTone = (freq: number, startTime: number, duration: number, volume: number) => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(freq, startTime)
    
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start(startTime)
    oscillator.stop(startTime + duration)
  }

  const now = audioContext.currentTime
  
  // A two-note chime (E6 to G6) for a "premium" feel
  playTone(1318.51, now, 0.5, 0.1) // E6
  playTone(1567.98, now + 0.1, 0.6, 0.08) // G6
}
