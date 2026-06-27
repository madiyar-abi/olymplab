import { Verdict } from '@/types/verdict'

// Wandbox can be slow or rate-limited; without an explicit timeout a hung
// connection would block the whole serverless function.
const WANDBOX_TIMEOUT_MS = 20_000

// Map our internal language ids to Wandbox compiler identifiers.
const WANDBOX_COMPILERS: Record<string, string> = {
  cpp: 'gcc-head',
  python: 'cpython-head',
  python3: 'cpython-head',
  java: 'openjdk-head',
  rust: 'rust-head',
  go: 'go-head',
  javascript: 'nodejs-head',
  js: 'nodejs-head',
}

/** Normalize stdout for comparison: CRLF→LF, strip trailing spaces per line and trailing blank lines. */
function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n+$/g, '')
}

/** Whitespace-insensitive comparison key for presentation-error detection. */
function tokenize(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

export type WandboxOutcome =
  | { ok: true; verdict: string }
  | { ok: false; httpStatus: number; error: string }

/**
 * Synchronously evaluate a submission against the problem's sample I/O via the
 * Wandbox API. Used both for the instant-judge path and as a fast fallback when
 * an external bot (Codeforces/CSES) can't be reached or never resolves.
 */
export async function evaluateWithWandbox(
  code: string,
  language: string,
  sampleInput: string | null,
  sampleOutput: string | null,
  reqId: string,
): Promise<WandboxOutcome> {
  const cleanInput = (sampleInput || '').replace(/\n\s*\n/g, '\n').trim()
  const expectedOutput = normalizeOutput(sampleOutput || '')
  const compiler = WANDBOX_COMPILERS[language?.toLowerCase()] ?? WANDBOX_COMPILERS.cpp

  console.log(`[Wandbox ${reqId}] eval lang=${language} compiler=${compiler}`)

  let wData: {
    status?: string
    signal?: string
    compiler_error?: string
    compiler_message?: string
    program_error?: string
    program_message?: string
    program_output?: string
  }

  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), WANDBOX_TIMEOUT_MS)
  try {
    const res = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compiler, code, stdin: cleanInput }),
      signal: ac.signal,
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[Wandbox ${reqId}] HTTP ${res.status}:`, body.slice(0, 500))
      return {
        ok: false,
        httpStatus: 502,
        error: 'Code execution engine (Wandbox) is temporarily unavailable. Please try again.',
      }
    }

    wData = await res.json()
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    console.error(`[Wandbox ${reqId}] ${aborted ? 'timed out' : 'fetch failed'}:`, err)
    return {
      ok: false,
      httpStatus: 504,
      error: aborted
        ? 'The execution engine took too long to respond. Please try again.'
        : 'Could not reach the code execution engine. Please try again.',
    }
  } finally {
    clearTimeout(timer)
  }

  // Determine verdict from the Wandbox result.
  let verdict: string
  if (wData.status !== '0') {
    const compileErr = wData.compiler_error || wData.compiler_message || ''
    verdict = compileErr.trim() ? Verdict.CE : Verdict.RE
    console.log(`[Wandbox ${reqId}] verdict=${verdict} status=${wData.status} signal=${wData.signal ?? '-'}`)
  } else {
    const actual = normalizeOutput(wData.program_output ?? wData.program_message ?? '')
    if (actual === expectedOutput) {
      verdict = Verdict.AC
    } else if (tokenize(actual) === tokenize(expectedOutput)) {
      verdict = Verdict.PE
    } else {
      verdict = Verdict.WA
      console.log(`[Wandbox ${reqId}] WA expected=${JSON.stringify(expectedOutput).slice(0, 160)} got=${JSON.stringify(actual).slice(0, 160)}`)
    }
  }

  return { ok: true, verdict }
}
