import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient, SupabaseClient } from '@supabase/supabase-js'
import { Problem } from '@/app/[locale]/dashboard/problems/[id]/IDEClient'

import { Verdict } from '@/types/verdict'

// The external judges use Puppeteer + cheerio which require the Node.js runtime
// (not Edge). maxDuration gives Wandbox / the CF bot room to respond before the
// serverless platform kills the function.
export const runtime = 'nodejs'
export const maxDuration = 60

// Wandbox can be slow or rate-limited; without an explicit timeout a hung
// connection would block the whole function until the platform 504s it, so the
// client never receives a submission id. Abort well inside maxDuration.
const WANDBOX_TIMEOUT_MS = 25_000

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

type WandboxOutcome =
  | { ok: true; verdict: string }
  | { ok: false; httpStatus: number; error: string }

/**
 * Synchronously evaluate a submission against the problem's sample I/O via the
 * Wandbox API. Used both for the instant-judge path and as a graceful fallback
 * when an external bot (Codeforces/CSES) is unreachable in production.
 */
async function evaluateWithWandbox(
  code: string,
  language: string,
  sampleInput: string | null,
  sampleOutput: string | null,
  reqId: string,
): Promise<WandboxOutcome> {
  const cleanInput = (sampleInput || '').replace(/\n\s*\n/g, '\n').trim()
  const expectedOutput = normalizeOutput(sampleOutput || '')
  const compiler = WANDBOX_COMPILERS[language?.toLowerCase()] ?? WANDBOX_COMPILERS.cpp

  console.log(`[Submit ${reqId}] Wandbox eval lang=${language} compiler=${compiler}`)

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
      console.error(`[Submit ${reqId}] Wandbox HTTP ${res.status}:`, body.slice(0, 500))
      return {
        ok: false,
        httpStatus: 502,
        error: 'Code execution engine (Wandbox) is temporarily unavailable. Please try again.',
      }
    }

    wData = await res.json()
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    console.error(`[Submit ${reqId}] Wandbox ${aborted ? 'timed out' : 'fetch failed'}:`, err)
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
    console.log(`[Submit ${reqId}] Verdict=${verdict} status=${wData.status} signal=${wData.signal ?? '-'}`)
  } else {
    const actual = normalizeOutput(wData.program_output ?? wData.program_message ?? '')
    if (actual === expectedOutput) {
      verdict = Verdict.AC
    } else if (tokenize(actual) === tokenize(expectedOutput)) {
      verdict = Verdict.PE
    } else {
      verdict = Verdict.WA
      console.log(`[Submit ${reqId}] WA expected=${JSON.stringify(expectedOutput).slice(0, 200)} got=${JSON.stringify(actual).slice(0, 200)}`)
    }
  }

  return { ok: true, verdict }
}

function getAdminClient(): SupabaseClient {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(request: Request) {
  const reqId = Math.random().toString(36).slice(2, 8)
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { problemId, code, language } = await request.json()

    if (!problemId || !code || !language) {
      return NextResponse.json({ error: 'Missing problemId, code, or language.' }, { status: 400 })
    }

    // 1. Fetch Problem Data (Sample Input/Output + External Info)
    const { data: probData, error: probErr } = await supabase
      .from('problems')
      .select('id, title, description, difficulty, requirements, sample_input, sample_output, external_id')
      .eq('id', problemId)
      .single()

    if (probErr || !probData) {
      return NextResponse.json({ error: 'Problem not found in database.' }, { status: 404 })
    }

    const problem = probData as unknown as Problem

    // Insert a final, COMPLETED submission (instant judge / fallback path).
    const insertCompleted = async (verdict: string) => {
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('submissions')
        .insert({
          user_id: user.id,
          problem_id: problemId,
          cf_submission_id: Math.floor(Math.random() * 10000000),
          code,
          language,
          status: 'COMPLETED',
          verdict,
          test_case: 1,
          time_ms: null,
          memory_kb: null,
        })
        .select('id')
        .single()
      if (error) throw error
      return data.id
    }

    // ─── Case 1: CSES Submission via Bot (fall back to Wandbox if unavailable) ───
    if (problem.external_id?.startsWith('cses-')) {
      try {
        const { CSESJudge } = await import('@/lib/judges/cses')
        const csesTaskId = problem.external_id.replace('cses-', '')
        const csesSubmissionId = await CSESJudge.submit(csesTaskId, code, language)

        const admin = getAdminClient()
        const { data, error } = await admin
          .from('submissions')
          .insert({
            user_id: user.id,
            problem_id: problemId,
            cf_submission_id: csesSubmissionId, // Reuse field for the CSES submission id
            code,
            language,
            status: 'PENDING',
            verdict: null,
          })
          .select('id')
          .single()

        if (error) throw error
        console.log(`[Submit ${reqId}] CSES bot accepted submission=${data.id}`)
        return NextResponse.json({ submission_id: data.id, status: 'PENDING' })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.warn(`[Submit ${reqId}] CSES bot unavailable, falling back to Wandbox: ${message}`)
        const outcome = await evaluateWithWandbox(code, language, problem.sample_input, problem.sample_output, reqId)
        if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.httpStatus })
        const id = await insertCompleted(outcome.verdict)
        return NextResponse.json({ submission_id: id, status: 'COMPLETED', verdict: outcome.verdict, judged: 'samples' })
      }
    }

    // ─── Case 2: Codeforces Submission via Bot (fall back to Wandbox if unavailable) ───
    if (problem.external_id?.startsWith('cf-')) {
      try {
        const { CodeforcesJudge } = await import('@/lib/judges/codeforces')
        const cfPart = problem.external_id.replace('cf-', '') // e.g., "123/A"
        const [contestId, problemIndex] = cfPart.split('/')

        if (!contestId || !problemIndex) {
          throw new Error(`Invalid Codeforces external_id format: ${problem.external_id}`)
        }

        const cfSubmissionId = await CodeforcesJudge.submit(contestId, problemIndex, code, language)

        const admin = getAdminClient()
        const { data, error } = await admin
          .from('submissions')
          .insert({
            user_id: user.id,
            problem_id: problemId,
            cf_submission_id: cfSubmissionId,
            code,
            language,
            status: 'PENDING',
            verdict: null,
          })
          .select('id')
          .single()

        if (error) throw error
        console.log(`[Submit ${reqId}] CF bot accepted submission=${data.id} cfId=${cfSubmissionId}`)
        return NextResponse.json({ submission_id: data.id, status: 'PENDING' })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        // The CF bot needs a headless browser to clear Cloudflare, which is not
        // available in serverless deploys. Rather than failing the submission,
        // judge it against the sample tests so the user still gets a verdict.
        console.warn(`[Submit ${reqId}] CF bot unavailable, falling back to Wandbox: ${message}`)
        const outcome = await evaluateWithWandbox(code, language, problem.sample_input, problem.sample_output, reqId)
        if (!outcome.ok) return NextResponse.json({ error: outcome.error }, { status: outcome.httpStatus })
        const id = await insertCompleted(outcome.verdict)
        return NextResponse.json({ submission_id: id, status: 'COMPLETED', verdict: outcome.verdict, judged: 'samples' })
      }
    }

    // ─── Case 3: Local Evaluation (Wandbox instant judge) ───────────
    const outcome = await evaluateWithWandbox(code, language, problem.sample_input, problem.sample_output, reqId)
    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.httpStatus })
    }

    let submissionId: string
    try {
      submissionId = await insertCompleted(outcome.verdict)
    } catch (error) {
      console.error(`[Submit ${reqId}] Supabase insert error:`, error)
      return NextResponse.json({ error: 'Database error while saving submission' }, { status: 500 })
    }

    console.log(`[Submit ${reqId}] Local evaluation complete: submission=${submissionId} verdict=${outcome.verdict}`)
    return NextResponse.json({ submission_id: submissionId, status: 'COMPLETED', verdict: outcome.verdict })
  } catch (error) {
    console.error(`[Submit ${reqId}] Internal error:`, error)
    return NextResponse.json({ error: 'Internal Server Error during submission evaluation' }, { status: 500 })
  }
}
