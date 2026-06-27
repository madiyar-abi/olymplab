// Runs once when the server process boots. KaTeX emits an unconditional
// console.warn("No character metrics ...") during SSR for any glyph without
// font metrics (e.g. stray spaces in Codeforces math). It's harmless but floods
// the server log, so filter just that message.
export async function register() {
  const g = globalThis as typeof globalThis & { __katexWarnPatched?: boolean }
  if (g.__katexWarnPatched) return
  g.__katexWarnPatched = true

  const original = console.warn.bind(console)
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('No character metrics')) return
    original(...args)
  }
}
