import { Verdict } from '@/types/verdict'

export interface CFResult {
  status: 'PENDING' | 'TESTING' | 'COMPLETED' | 'ERROR'
  verdict: Verdict | string | null
  testCase?: number
  timeMs?: number
  memoryKb?: number
}

export class CodeforcesJudge {
  private static cookie: string | null = null

  private static async login() {
    const cheerio = await import('cheerio')
    const handle = process.env.CF_HANDLE
    const password = process.env.CF_PASSWORD

    if (!handle || !password) {
      throw new Error('Codeforces credentials missing in .env.local (CF_HANDLE, CF_PASSWORD)')
    }

    console.log('[CF Bot] Attempting login for:', handle)

    // 1. Get CSRF token from login page
    const enterPage = await fetch('https://codeforces.com/enter', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    })

    const cookieMap = new Map<string, string>()
    enterPage.headers.getSetCookie().forEach(c => {
      const kv = c.split(';')[0]
      const eqIdx = kv.indexOf('=')
      if (eqIdx !== -1) {
        cookieMap.set(kv.substring(0, eqIdx).trim(), kv.substring(eqIdx + 1).trim())
      }
    })

    const enterHtml = await enterPage.text()
    const $ = cheerio.load(enterHtml)
    const csrfToken = $('input[name="csrf_token"]').val() as string

    if (!csrfToken) {
      throw new Error('Could not find CSRF token on Codeforces login page')
    }

    // 2. Perform Login
    const loginRes = await fetch('https://codeforces.com/enter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; '),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://codeforces.com/enter',
      },
      body: new URLSearchParams({
        csrf_token: csrfToken,
        action: 'enter',
        handle: handle,
        password: password,
        remember: 'on'
      }),
      redirect: 'manual'
    })

    loginRes.headers.getSetCookie().forEach(c => {
      const kv = c.split(';')[0]
      const eqIdx = kv.indexOf('=')
      if (eqIdx !== -1) {
        cookieMap.set(kv.substring(0, eqIdx).trim(), kv.substring(eqIdx + 1).trim())
      }
    })

    this.cookie = Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ')

    if (!this.cookie.includes('39ce7')) { // A common part of CF session cookie
        // verify login by checking if 'logout' exists on home page
        const homeRes = await fetch('https://codeforces.com', {
            headers: { 'Cookie': this.cookie!, 'User-Agent': 'Mozilla/5.0' }
        })
        const homeHtml = await homeRes.text()
        if (!homeHtml.includes('logout')) {
            console.error('[CF Bot] Login failed - "logout" link not found')
            throw new Error('Codeforces Login Failed')
        }
    }

    console.log('[CF Bot] Login successful')
  }

  static async submit(contestId: string, problemIndex: string, code: string, language = 'cpp', retryCount = 0): Promise<string> {
    if (retryCount > 1) {
      throw new Error('Codeforces Submission failed after multiple retries.')
    }

    if (!this.cookie) await this.login()

    console.log(`[CF Bot] Submitting to ${contestId}${problemIndex} (Attempt ${retryCount + 1})...`)

    const submitUrl = `https://codeforces.com/contest/${contestId}/submit`
    const submitPage = await fetch(submitUrl, {
      headers: {
        'Cookie': this.cookie!,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    })
    const submitHtml = await submitPage.text()

    if (submitHtml.includes('/enter') && submitHtml.includes('handle')) {
       console.log('[CF Bot] Session expired. Re-logging...')
       this.cookie = null
       return this.submit(contestId, problemIndex, code, language, retryCount + 1)
    }

    const cheerio = await import('cheerio')
    const $ = cheerio.load(submitHtml)
    const csrfToken = $('input[name="csrf_token"]').val() as string

    if (!csrfToken) {
       console.warn('[CF Bot] No CSRF token found on submit page. Re-logging...')
       this.cookie = null
       return this.submit(contestId, problemIndex, code, language, retryCount + 1)
    }

    // Prepare multipart form data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2)
    const parts: string[] = []

    // Map our internal language names to Codeforces programTypeId
    const CF_LANG_MAP: Record<string, string> = {
      cpp:    '89', // GNU G++20 13.2
      python: '70', // PyPy 3.10 (faster) | use '31' for CPython 3.8
      java:   '87', // Java 21 64bit
      rust:   '75', // Rust 2021
    }
    const programTypeId = CF_LANG_MAP[language] ?? '89'

    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="csrf_token"\r\n\r\n${csrfToken}\r\n`)
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="ftaa"\r\n\r\n\r\n`)
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="bfaa"\r\n\r\n\r\n`)
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="submittedProblemIndex"\r\n\r\n${problemIndex}\r\n`)
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="programTypeId"\r\n\r\n${programTypeId}\r\n`)
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="source"\r\n\r\n${code}\r\n`)
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="tabSize"\r\n\r\n4\r\n`)
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="_tta"\r\n\r\n37\r\n`)
    parts.push(`--${boundary}--\r\n`)

    const body = parts.join('')

    const res = await fetch(`${submitUrl}?csrf_token=${csrfToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Cookie': this.cookie!,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': submitUrl,
      },
      body,
      redirect: 'manual'
    })

    const location = res.headers.get('location')
    if (!location || !location.includes('my')) {
      console.error('[CF Bot] Submit failed. Status:', res.status)
      // If it failed, it might be because of "You have submitted exactly the same code before"
      const text = await res.text()
      if (text.includes('exactly the same code')) {
          console.warn('[CF Bot] Exactly the same code submitted.')
          // We still need a submission ID. We can fetch the latest from user.status.
      } else {
        throw new Error(`Codeforces Submission failed: ${res.status}`)
      }
    }

    // To get the submission ID, we'll use the API for the latest submission of the handle
    await new Promise(r => setTimeout(r, 2000)) // Wait for CF to register
    const statusRes = await fetch(`https://codeforces.com/api/user.status?handle=${process.env.CF_HANDLE}&from=1&count=1`)
    const statusData = await statusRes.json()
    
    if (statusData.status === 'OK' && statusData.result.length > 0) {
        return statusData.result[0].id.toString()
    }

    throw new Error('Could not retrieve submission ID from Codeforces API')
  }

  static async getStatus(submissionId: string): Promise<CFResult> {
    const res = await fetch(`https://codeforces.com/api/user.status?handle=${process.env.CF_HANDLE}&from=1&count=10`)
    const data = await res.json()
    
    if (data.status !== 'OK') {
        throw new Error('Failed to fetch status from Codeforces API')
    }

    const submission = data.result.find((s: { id: { toString: () => string } }) => s.id.toString() === submissionId)

    if (!submission) {
        return { status: 'PENDING', verdict: null }
    }

    const verdict = submission.verdict

    if (!verdict || verdict === 'TESTING') {
      return { status: 'TESTING', verdict: `Testing on test ${submission.passedTestCount + 1}` }
    }

    const VERDICT_MAP: Record<string, Verdict> = {
      'OK': Verdict.AC,
      'WRONG_ANSWER': Verdict.WA,
      'TIME_LIMIT_EXCEEDED': Verdict.TLE,
      'MEMORY_LIMIT_EXCEEDED': Verdict.MLE,
      'RUNTIME_ERROR': Verdict.RE,
      'COMPILATION_ERROR': Verdict.CE,
      'CHALLENGED': Verdict.CHALLENGED,
      'SKIPPED': Verdict.SKIPPED,
      'PARTIAL': Verdict.PARTIAL,
      'PRESENTATION_ERROR': Verdict.PE,
      'IDLENESS_LIMIT_EXCEEDED': Verdict.TLE, // Map to TLE as it's a time limit issue
      'SECURITY_VIOLATED': Verdict.RE,
      'CRASHED': Verdict.RE,
      'INPUT_PREPARATION_FAILED': Verdict.FAILED,
      'FAILED': Verdict.FAILED
    }

    return {
      status: 'COMPLETED',
      verdict: VERDICT_MAP[verdict] || verdict
    }
    }
}
