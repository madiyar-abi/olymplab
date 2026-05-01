import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

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

    // 1. Fetch Problem Data (Sample Input/Output)
    const { data: probData, error: probErr } = await supabase
      .from('problems')
      .select('id, sample_input, sample_output')
      .eq('id', problemId)
      .single()

    if (probErr || !probData) {
      return NextResponse.json({ error: 'Problem not found in database.' }, { status: 404 })
    }

    // Clean up Codeforces test cases (remove double newlines from Cheerio HTML extraction)
    const cleanInput = (probData.sample_input || '').replace(/\n\s*\n/g, '\n').trim()
    const cleanOutput = (probData.sample_output || '').replace(/\n\s*\n/g, '\n').trim()

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
    let verdict = 'Testing'
    
    // Wandbox errors
    if (wData.status !== '0') {
      // Compilation or Runtime error
      const errText = wData.compiler_error || wData.program_error || ''
      if (errText.toLowerCase().includes('error:')) {
        verdict = 'Compilation Error'
      } else {
        verdict = 'Runtime Error'
      }
    } else {
      // Run completed successfully, check output
      const rawStdout = wData.program_message || ''
      const cleanStdout = rawStdout.trim().replace(/\r\n/g, '\n')
      
      if (cleanStdout === cleanOutput) {
        verdict = 'Accepted'
      } else {
        verdict = 'Wrong Answer'
        console.log('[Virtual Judge] Expected:', JSON.stringify(cleanOutput))
        console.log('[Virtual Judge] Received:', JSON.stringify(cleanStdout))
      }
    }

    // 4. Insert into Submissions Table with final verdict using Service Role to bypass RLS
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Submit] Supabase insert error:', error)
      return NextResponse.json({ error: 'Database error while saving submission' }, { status: 500 })
    }

    return NextResponse.json({ submission_id: data.id, verdict })
  } catch (error) {
    console.error('[Submit] Internal error:', error)
    return NextResponse.json({ error: 'Internal Server Error during submission evaluation' }, { status: 500 })
  }
}
