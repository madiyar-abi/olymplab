import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[Submission Polling] Polling for ID:', id)
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Bypass RLS for SELECT just like we did for INSERT, since the table's RLS is overly restrictive
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceKey || !supabaseUrl) {
      console.error('[Submission Polling] Missing environment variables')
      return NextResponse.json({ error: 'Internal server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createAdminClient(supabaseUrl, serviceKey)

    const { data: submission, error: subError } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single()

    if (subError || !submission) {
      console.error('[Submission Polling] Error fetching submission:', subError, 'ID:', id)
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Security check: ensure the authenticated user owns this submission
    if (submission.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to view this submission' }, { status: 403 })
    }

    // Fetch problem data separately to avoid join ambiguity/issues
    const { data: problem } = await supabaseAdmin
      .from('problems')
      .select('external_id')
      .eq('id', submission.problem_id)
      .single()

    if (submission.status === 'COMPLETED') {
      return NextResponse.json({ ...submission, problems: problem })
    }

    // ─── Case 1: CSES Polling ──────────────────────────────────
    if (problem?.external_id?.startsWith('cses-')) {
      try {
        const { CSESJudge } = await import('@/lib/judges/cses')
        const result = await CSESJudge.getStatus(String(submission.cf_submission_id))

        if (result.status === 'COMPLETED') {
          const { data: updated } = await supabaseAdmin
            .from('submissions')
            .update({
              status: 'COMPLETED',
              verdict: result.verdict,
            })
            .eq('id', id)
            .select()
            .single()
          return NextResponse.json({ ...updated, problems: problem })
        } else {
          return NextResponse.json({ ...submission, status: result.status, verdict: result.verdict, problems: problem })
        }

      } catch (err) {
        console.error('[CSES Polling] Error:', err)
        return NextResponse.json({ ...submission, problems: problem })
      }
    }

    // ─── Case 2: Codeforces Polling ─────────────────────────────
    if (problem?.external_id?.startsWith('cf-')) {
      try {
        const { CodeforcesJudge } = await import('@/lib/judges/codeforces')
        const result = await CodeforcesJudge.getStatus(String(submission.cf_submission_id))

        if (result.status === 'COMPLETED') {
          const { data: updated } = await supabaseAdmin
            .from('submissions')
            .update({
              status: 'COMPLETED',
              verdict: result.verdict,
            })
            .eq('id', id)
            .select()
            .single()
          return NextResponse.json({ ...updated, problems: problem })
        } else {
          return NextResponse.json({ ...submission, status: result.status, verdict: result.verdict, problems: problem })
        }
      } catch (err) {
        console.error('[CF Polling] Error:', err)
        return NextResponse.json({ ...submission, problems: problem })
      }
    }

    // Fallback for cases not handled above
    return NextResponse.json({ ...submission, problems: problem })
  } catch (error) {
    console.error('[Submission Polling] Internal error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
