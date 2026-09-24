import { NextResponse } from 'next/server';
import { executeLocally } from '@/lib/executor/localRunner';

export async function POST(request: Request) {
  try {
    const { code, stdin, language = 'cpp' } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing required field: code.' }, { status: 400 });
    }

    // 1. Try ultra-fast local runner first (typically 40ms - 600ms)
    const localResult = executeLocally(code, stdin, language);
    if (localResult) {
      return NextResponse.json({
        stdout: localResult.stdout,
        stderr: localResult.stderr,
        code: localResult.code,
        durationMs: localResult.durationMs,
      });
    }

    // 2. Fallback to Wandbox if local compilers are unavailable or language is unsupported
    let compiler = 'gcc-13.2.0' // Use stable fast GCC
    const langLower = language.toLowerCase()
    if (langLower.includes('python')) compiler = 'cpython-head'
    else if (langLower.includes('java')) compiler = 'openjdk-head'
    else if (langLower.includes('node') || langLower.includes('js') || langLower.includes('javascript')) compiler = 'nodejs-head'
    else if (langLower.includes('rust')) compiler = 'rust-head'
    else if (langLower.includes('go')) compiler = 'go-head'

    const response = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler,
        code: code,
        stdin: stdin || '',
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[Execute] Wandbox API error:', response.status, text);
      return NextResponse.json(
        { error: `Wandbox API error (${response.status}): ${text}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const stdout = data.program_message || '';
    const stderr = data.compiler_error || data.program_error || '';
    const exitCode = data.status === '0' ? 0 : 1;

    return NextResponse.json({
      stdout: stdout,
      stderr: stderr,
      code: exitCode,
    });

  } catch (error) {
    console.error('[Execute] Internal error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
