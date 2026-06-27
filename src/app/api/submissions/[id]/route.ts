import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Verdict } from '@/types/verdict'
import { evaluateWithWandbox } from '@/lib/judges/wandbox'

export const runtime = 'nodejs'
export const maxDuration = 60

// A single external-judge status check should never hang the poll request.
const STATUS_TIMEOUT_MS = 20_000
// If an external submission hasn't resolved in this long, stop waiting on the
// flaky bot and judge it against the sample tests so the UI never spins forever.
const STALE_MS = 25_000
// If the judge status check keeps throwing, fall back even sooner.
const ERROR_FALLBACK_MS = 8_000
// Only after this long do we give up entirely (Wandbox itself persistently down).
const HARD_FAIL_MS = 90_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !supabaseUrl) {
      console.error('[Poll] Missing Supabase service-role configuration')
      return NextResponse.json({ error: 'Internal server configuration error' }, { status: 500 })
    }

    // Bypass RLS, then manually enforce ownership below.
    const admin = createAdminClient(supabaseUrl, serviceKey)

    const { data: submission, error: subError } = await admin
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single()

    if (subError || !submission) {
      console.error(`[Poll ${id}] Submission not found:`, subError?.message)
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to view this submission' }, { status: 403 })
    }

    const { data: problem } = await admin
      .from('problems')
      .select('external_id, sample_input, sample_output')
      .eq('id', submission.problem_id)
      .single()

    const probMeta = { external_id: problem?.external_id }

    // Already finished — short-circuit.
    if (submission.status === 'COMPLETED') {
      return NextResponse.json({ ...submission, problems: probMeta })
    }

    const externalId: string | undefined = problem?.external_id ?? undefined
    const isExternal = externalId?.startsWith('cses-') || externalId?.startsWith('cf-')
    const ageMs = Date.now() - new Date(submission.created_at).getTime()

    // Persist a terminal verdict, but only if the row is still PENDING — so when
    // overlapping polls race, the first writer wins and verdicts can't be clobbered.
    const finalize = async (fields: Record<string, unknown>) => {
      const { data: rows } = await admin
        .from('submissions')
        .update(fields)
        .eq('id', id)
        .eq('status', 'PENDING')
        .select()
      if (rows && rows.length > 0) {
        return NextResponse.json({ ...rows[0], problems: probMeta })
      }
      // Lost the race (already finalized by another poll) — return current state.
      const { data: fresh } = await admin.from('submissions').select('*').eq('id', id).single()
      return NextResponse.json({ ...(fresh ?? submission), problems: probMeta })
    }

    // Judge against the samples and finalize. On a transient Wandbox failure keep
    // the submission pending (the client retries) unless we're past the hard deadline.
    const resolveWithSamples = async (reason: string) => {
      console.warn(`[Poll ${id}] resolving via samples (${reason})`)
      const outcome = await evaluateWithWandbox(
        submission.code ?? '',
        submission.language ?? 'cpp',
        problem?.sample_input ?? null,
        problem?.sample_output ?? null,
        id,
      )
      if (outcome.ok) {
        return finalize({ status: 'COMPLETED', verdict: outcome.verdict, test_case: 1 })
      }
      if (ageMs > HARD_FAIL_MS) {
        return finalize({ status: 'COMPLETED', verdict: Verdict.FAILED, test_case: 1 })
      }
      return NextResponse.json({ ...submission, problems: probMeta })
    }

    // A non-external submission should already be COMPLETED; if not, judge now.
    if (!isExternal) {
      return resolveWithSamples('non-external pending')
    }

    // External submission still pending. Past the deadline → sample-judge.
    if (ageMs > STALE_MS) {
      return resolveWithSamples('external judge timed out')
    }

    // Otherwise ask the external judge for the current status.
    try {
      const judge = externalId!.startsWith('cses-')
        ? (await import('@/lib/judges/cses')).CSESJudge
        : (await import('@/lib/judges/codeforces')).CodeforcesJudge

      const result = await withTimeout(
        judge.getStatus(String(submission.cf_submission_id)),
        STATUS_TIMEOUT_MS,
        'Judge status',
      )

      if (result.status === 'COMPLETED') {
        console.log(`[Poll ${id}] external verdict=${result.verdict}`)
        return finalize({
          status: 'COMPLETED',
          verdict: result.verdict,
          test_case: result.testCase,
          time_ms: result.timeMs,
          memory_kb: result.memoryKb,
        })
      }

      // Still running — surface progress without persisting a non-final status.
      return NextResponse.json({
        ...submission,
        status: result.status,
        verdict: result.verdict,
        test_case: result.testCase,
        time_ms: result.timeMs,
        memory_kb: result.memoryKb,
        problems: probMeta,
      })
    } catch (err) {
      console.error(`[Poll ${id}] judge status error:`, err instanceof Error ? err.message : err)
      // The external judge is unreachable — fall back to sample judging.
      if (ageMs > ERROR_FALLBACK_MS) return resolveWithSamples('judge unreachable')
      return NextResponse.json({ ...submission, problems: probMeta })
    }
  } catch (error) {
    console.error('[Poll] Internal error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
