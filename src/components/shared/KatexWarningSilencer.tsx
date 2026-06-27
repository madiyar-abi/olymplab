'use client'

import { useEffect } from 'react'

let patched = false

/**
 * KaTeX emits an unconditional `console.warn("No character metrics ...")` for
 * every glyph it can't find font metrics for (e.g. stray spaces in Codeforces
 * math). It's harmless — rendering is unaffected — but it floods the console.
 * Filter out just that message; everything else passes through untouched.
 */
export function KatexWarningSilencer() {
  useEffect(() => {
    if (patched) return
    patched = true
    const original = console.warn.bind(console)
    console.warn = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].startsWith('No character metrics')) return
      original(...args)
    }
  }, [])
  return null
}
