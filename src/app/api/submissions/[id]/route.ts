import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    // Bypass RLS for SELECT just like we did for INSERT, since the table's RLS is overly restrictive
    const supabaseAdmin = createAdminClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: submission, error } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single() as { data: any; error: any }

    if (error || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Security check: ensure the authenticated user owns this submission
    if (submission.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to view this submission' }, { status: 403 })
    }

    if (submission.status === 'COMPLETED') {
      return NextResponse.json(submission)
    }

    const CF_HANDLE = process.env.CF_HANDLE
    if (!CF_HANDLE) {
      console.error('[Submission Polling] Missing CF_HANDLE')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    if (!submission.cf_submission_id) {
      return NextResponse.json(submission)
    }

    // Hit the public Codeforces user.status API (no signature needed)
    const cfRes = await fetch(`https://codeforces.com/api/user.status?handle=${CF_HANDLE}&from=1&count=5`)
    const cfData = await cfRes.json()

    if (cfData.status !== 'OK') {
      console.error('[Submission Polling] Failed to fetch CF status')
      return NextResponse.json(submission) // Just return current state, don't fail the poll
    }

    // Find the exact submission in the recent list
    const cfSub = cfData.result.find((s: any) => s.id === submission.cf_submission_id)

    if (!cfSub) {
      // If it's not in the top 5, it might be heavily delayed or we submit too fast.
      // For now, we just return current state.
      return NextResponse.json(submission)
    }

    // Check CF Verdict
    if (cfSub.verdict === 'TESTING' || !cfSub.verdict) {
      return NextResponse.json({
        ...submission,
        status: 'TESTING',
        verdict: null,
      })
    }

    // It is finished! Map the verdict.
    const formatVerdict = (v: string) => {
      if (v === 'OK') return 'Accepted'
      return v.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
    }

    const finalVerdict = formatVerdict(cfSub.verdict)

    // Update the DB - use type assertion to bypass strict Supabase types
    const result = await ((supabaseAdmin
      .from('submissions') as any)
      .update({
        status: 'COMPLETED',
        verdict: finalVerdict,
      })
      .eq('id', id)
      .select()
      .single() as unknown as Promise<{ data: any; error: any }>
    )
    
    const { data: updated, error: updateError } = result

    if (!updateError && updated) {
      return NextResponse.json(updated)
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error('[Submission Polling] Internal error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
