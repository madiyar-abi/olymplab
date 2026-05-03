import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code, stdin, language = 'cpp' } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing required field: code.' }, { status: 400 });
    }

    // Map internal language to Wandbox compiler
    let compiler = 'gcc-head' // Default C++
    const langLower = language.toLowerCase()
    if (langLower.includes('python')) compiler = 'cpython-head'
    else if (langLower.includes('java')) compiler = 'openjdk-head'
    else if (langLower.includes('node') || langLower.includes('js')) compiler = 'nodejs-head'
    else if (langLower.includes('rust')) compiler = 'rust-head'

    // Wandbox API
    const response = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler,
        code: code,
        stdin: stdin || '',
      }),
    });

    console.log('[Execute] Wandbox Response Status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('[Execute] Wandbox API error:', response.status, text);
      return NextResponse.json(
        { error: `Wandbox API error (${response.status}): ${text}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    console.log('[Execute] Wandbox Data:', JSON.stringify(data, null, 2));

    // Wandbox returns status "0" on success. Output is in program_message.
    // Errors are in compiler_error or program_error.
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
