import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Verdict } from '@/types/verdict'

export const runtime = 'nodejs'
export const maxDuration = 60

// A single external-judge status check should never hang the poll request.
const STATUS_TIMEOUT_MS = 25_000
// If an external submission is still unresolved after this long, stop polling
// the judge and mark it FAILED so the UI doesn't spin forever.
const STALE_MS = 6 * 60 * 1000

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

    // Bypass RLS for reads/writes, then manually enforce ownership below.
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceKey)

    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single()

    if (subError || !submission) {
      console.error(`[Poll ${id}] Submission not found:`, subError?.message)
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Ownership enforcement (admin client bypasses RLS, so this is mandatory).
    if (submission.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to view this submission' }, { status: 403 })
    }

    // Already finished — short-circuit.
    if (submission.status === 'COMPLETED') {
      const { data: problem } = await supabaseAdmin
        .from('problems')
        .select('external_id')
        .eq('id', submission.problem_id)
        .single()
      return NextResponse.json({ ...submission, problems: problem })
    }

    const { data: problem } = await supabaseAdmin
      .from('problems')
      .select('external_id')
      .eq('id', submission.problem_id)
      .single()

    const externalId: string | undefined = problem?.external_id ?? undefined
    const isExternal = externalId?.startsWith('cses-') || externalId?.startsWith('cf-')

    // Staleness safety net: stop polling a never-resolving external submission.
    const ageMs = Date.now() - new Date(submission.created_at).getTime()
    const markFailed = async (reason: string) => {
      console.warn(`[Poll ${id}] Resolving stuck submission as FAILED: ${reason}`)
      const { data: updated } = await supabaseAdmin
        .from('submissions')
        .update({ status: 'COMPLETED', verdict: Verdict.FAILED })
        .eq('id', id)
        .select()
        .single()
      return NextResponse.json({ ...(updated ?? submission), status: 'COMPLETED', verdict: Verdict.FAILED, problems: problem })
    }

    if (isExternal && ageMs > STALE_MS) {
      return markFailed(`exceeded ${STALE_MS}ms without a verdict`)
    }

    // ─── External judge polling (CSES / Codeforces share the same shape) ───
    if (isExternal) {
      try {
        const judgeModule = externalId!.startsWith('cses-')
          ? (await import('@/lib/judges/cses')).CSESJudge
          : (await import('@/lib/judges/codeforces')).CodeforcesJudge

        const result = await withTimeout(
          judgeModule.getStatus(String(submission.cf_submission_id)),
          STATUS_TIMEOUT_MS,
          'Judge status',
        )

        if (result.status === 'COMPLETED') {
          const { data: updated } = await supabaseAdmin
            .from('submissions')
            .update({
              status: 'COMPLETED',
              verdict: result.verdict,
              test_case: result.testCase,
              time_ms: result.timeMs,
              memory_kb: result.memoryKb,
            })
            .eq('id', id)
            .select()
            .single()
          console.log(`[Poll ${id}] External verdict=${result.verdict}`)
          return NextResponse.json({ ...updated, problems: problem })
        }

        // Still running — surface progress without persisting a non-final status.
        return NextResponse.json({
          ...submission,
          status: result.status,
          verdict: result.verdict,
          test_case: result.testCase,
          time_ms: result.timeMs,
          memory_kb: result.memoryKb,
          problems: problem,
        })
      } catch (err) {
        console.error(`[Poll ${id}] Judge status error:`, err instanceof Error ? err.message : err)
        // Transient failure: if we've waited too long give up, otherwise keep PENDING.
        if (ageMs > STALE_MS) return markFailed('judge status repeatedly failing')
        return NextResponse.json({ ...submission, problems: problem })
      }
    }

    // Non-external submission that somehow isn't COMPLETED — return as-is.
    return NextResponse.json({ ...submission, problems: problem })
  } catch (error) {
    console.error('[Poll] Internal error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
