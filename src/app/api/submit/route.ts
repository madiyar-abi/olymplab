import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Problem } from '@/app/dashboard/problems/[id]/IDEClient'

import { Verdict } from '@/types/verdict'

export async function POST(request: Request) {
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
      return NextResponse.json(
        { error: 'Missing problemId, code, or language.' },
        { status: 400 }
      )
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

    // ─── Case 1: CSES Submission via Bot ──────────────────────────
    if (problem.external_id?.startsWith('cses-')) {
      try {
        const { CSESJudge } = await import('@/lib/judges/cses')
        const csesTaskId = problem.external_id.replace('cses-', '')
        const csesSubmissionId = await CSESJudge.submit(csesTaskId, code, language)

        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await supabaseAdmin
          .from('submissions')
          .insert({
            user_id: user.id,
            problem_id: problemId,
            cf_submission_id: csesSubmissionId, // Reuse field for CSES ID
            code,
            language,
            status: 'PENDING',
            verdict: null,
          })
          .select('id')
          .single()

        if (error) {
          console.error('[CSES Submit] Supabase Error:', JSON.stringify(error, null, 2))
          throw error
        }
        console.log('[External Judge] Success, submission ID:', data.id)
        return NextResponse.json({ submission_id: data.id, status: 'PENDING' })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[CSES Submit] Error:', message, err)
        return NextResponse.json({ error: `CSES Bot Error: ${message}` }, { status: 500 })
      }
    }

    // ─── Case 2: Codeforces Submission via Bot ─────────────────────
    if (problem.external_id?.startsWith('cf-')) {
      try {
        const { CodeforcesJudge } = await import('@/lib/judges/codeforces')
        const cfPart = problem.external_id.replace('cf-', '') // e.g., "123/A"
        const [contestId, problemIndex] = cfPart.split('/')
        
        if (!contestId || !problemIndex) {
          throw new Error(`Invalid Codeforces external_id format: ${problem.external_id}`)
        }

        const cfSubmissionId = await CodeforcesJudge.submit(contestId, problemIndex, code, language)

        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await supabaseAdmin
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

        if (error) {
          console.error('[CF Submit] Supabase Error:', JSON.stringify(error, null, 2))
          throw error
        }
        console.log('[External Judge] Success, submission ID:', data.id)
        return NextResponse.json({ submission_id: data.id, status: 'PENDING' })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[CF Submit] Error:', message, err)
        return NextResponse.json({ error: `Codeforces Bot Error: ${message}` }, { status: 500 })
      }
    }

    // ─── Case 2: Local Evaluation (Wandbox) ────────────────────────
    // Clean up test cases
    const cleanInput = (problem.sample_input || '').replace(/\n\s*\n/g, '\n').trim()
    const cleanOutput = (problem.sample_output || '').replace(/\n\s*\n/g, '\n').trim()


    // Map language to Wandbox compiler
    let compiler = 'gcc-head' // Default C++
    if (language === 'python' || language === 'python3') compiler = 'cpython-head'
    if (language === 'java') compiler = 'openjdk-head'
    if (language === 'javascript' || language === 'js') compiler = 'nodejs-head'

    console.log(`[Virtual Judge] Evaluating submission for problem ${problemId} via Wandbox...`)

    // 2. Evaluate using Wandbox
    const wandboxRes = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler,
        code,
        stdin: cleanInput,
      }),
    })

    if (!wandboxRes.ok) {
      console.error('[Virtual Judge] Wandbox API error:', await wandboxRes.text())
      return NextResponse.json({ error: 'Code execution engine (Wandbox) unavailable' }, { status: 502 })
    }

    const wData = await wandboxRes.json()

    // 3. Determine Verdict
    let verdict: string = Verdict.TESTING
    
    // Wandbox errors
    if (wData.status !== '0') {
      // Compilation or Runtime error
      const errText = wData.compiler_error || wData.program_error || ''
      if (errText.toLowerCase().includes('error:')) {
        verdict = Verdict.CE
      } else {
        verdict = Verdict.RE
      }
    } else {
      // Run completed successfully, check output
      const rawStdout = wData.program_message || ''
      const cleanStdout = rawStdout.trim().replace(/\r\n/g, '\n')
      
      if (cleanStdout === cleanOutput) {
        verdict = Verdict.AC
      } else {
        verdict = Verdict.WA
        console.log('[Virtual Judge] Expected:', JSON.stringify(cleanOutput))
        console.log('[Virtual Judge] Received:', JSON.stringify(cleanStdout))
      }
    }

    // 4. Insert into Submissions Table with final verdict using Service Role to bypass RLS
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const timeMs = wData.cpu_time ? Math.round(parseFloat(wData.cpu_time) * 1000) : null
    const memoryKb = wData.memory ? Math.floor(parseInt(wData.memory) / 1024) : null

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        user_id: user.id,
        problem_id: problemId,
        cf_submission_id: Math.floor(Math.random() * 10000000), // Mock ID since we aren't using CF
        code,
        language,
        status: 'COMPLETED',
        verdict: verdict,
        test_case: 1,
        time_ms: timeMs,
        memory_kb: memoryKb,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Submit] Supabase insert error:', error)
      return NextResponse.json({ error: 'Database error while saving submission' }, { status: 500 })
    }

    console.log('[Local Evaluation] Success, submission ID:', data.id)
    return NextResponse.json({ submission_id: data.id, verdict })
  } catch (error) {
    console.error('[Submit] Internal error:', error)
    return NextResponse.json({ error: 'Internal Server Error during submission evaluation' }, { status: 500 })
  }
}
