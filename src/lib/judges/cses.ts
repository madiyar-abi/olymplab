import { Verdict } from '@/types/verdict'

export interface CSESResult {
  status: 'PENDING' | 'TESTING' | 'COMPLETED' | 'ERROR'
  verdict: Verdict | string | null
  score?: number
  testCase?: number
  timeMs?: number
  memoryKb?: number
}

export class CSESJudge {
  private static cookie: string | null = null

  private static async login() {
    const cheerio = await import('cheerio')
    const username = process.env.CSES_USERNAME
    const password = process.env.CSES_PASSWORD

    if (!username || !password) {
      throw new Error('CSES credentials missing in .env.local (CSES_USERNAME, CSES_PASSWORD)')
    }

    console.log('[CSES Bot] Attempting login for:', username)

    try {
      const loginPage = await fetch('https://cses.fi/login', {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      })
      
      const cookieMap = new Map<string, string>()
      loginPage.headers.getSetCookie().forEach(c => {
        const kv = c.split(';')[0]
        const eqIdx = kv.indexOf('=')
        if (eqIdx !== -1) {
          cookieMap.set(kv.substring(0, eqIdx).trim(), kv.substring(eqIdx + 1).trim())
        }
      })

      const loginHtml = await loginPage.text()
      const $ = cheerio.load(loginHtml)
      const csrfToken = $('input[name="csrf_token"]').val() as string

      if (!csrfToken) {
        throw new Error('Could not find CSRF token on login page')
      }

      const loginRes = await fetch('https://cses.fi/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': Array.from(cookieMap.entries()).map(([k, v]) => `${k}=${v}`).join('; '),
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://cses.fi/login',
        },
        body: new URLSearchParams({
          csrf_token: csrfToken,
          nick: username,
          pass: password,
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
      
      if (!this.cookie.includes('PHPSESSID')) {
        console.error('[CSES Bot] Login failed - PHPSESSID not found in cookies')
        throw new Error('CSES Login Failed')
      }

      console.log('[CSES Bot] Login successful')
    } catch (err) {
      console.error('[CSES Bot] Login error:', err)
      throw err
    }
  }

  static async submit(problemId: string, code: string, language: string = 'cpp', retryCount = 0): Promise<string> {
    if (retryCount > 1) {
      throw new Error('CSES Submission failed after multiple retries.')
    }
    
    if (!this.cookie) await this.login()

    console.log(`[CSES Bot] Submitting to task ${problemId} (Attempt ${retryCount + 1})...`)

    const submitUrl = `https://cses.fi/problemset/submit/${problemId}/`
    const submitPage = await fetch(submitUrl, {
      headers: { 
        'Cookie': this.cookie!, 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    })
    const submitHtml = await submitPage.text()
    
    if (submitHtml.includes('login') && submitHtml.includes('nick')) {
       console.log('[CSES Bot] Session expired. Re-logging...')
       this.cookie = null
       return this.submit(problemId, code, language, retryCount + 1)
    }

    const cheerio = await import('cheerio')
    const $ = cheerio.load(submitHtml)
    const form = $('form').first()
    
    if (form.length === 0) {
       console.warn('[CSES Bot] No form found on submit page. Re-logging...')
       this.cookie = null
       return this.submit(problemId, code, language, retryCount + 1)
    }

    const action = form.attr('action')
    const postUrl = action?.startsWith('http') ? action : `https://cses.fi${action}`
    
    const formData = new FormData()

    // 1. Collect ALL inputs from the form (including CSRF token)
    form.find('input').each((_, input) => {
      const name = $(input).attr('name')
      const value = $(input).attr('value')
      if (name && value && name !== 'file' && name !== 'lang' && name !== 'option' && name !== 'task') {
        formData.append(name, value)
      }
    })

    // 2. Set task, lang and option
    formData.append('task', problemId)
    
    // Map internal language to CSES lang and option
    let csesLang = 'C++'
    let csesOption = 'C++17'

    const langLower = language.toLowerCase()
    if (langLower.includes('python')) {
      csesLang = 'Python3'
      csesOption = 'CPython3'
    } else if (langLower.includes('java')) {
      csesLang = 'Java'
      csesOption = ''
    } else if (langLower.includes('rust')) {
      csesLang = 'Rust'
      csesOption = ''
    } else if (langLower.includes('node') || langLower.includes('js') || langLower.includes('javascript')) {
      csesLang = 'Node.js'
      csesOption = ''
    }

    formData.append('lang', csesLang)
    formData.append('option', csesOption)
    
    // 3. Add file
    const extension = langLower.includes('python') ? 'py' : langLower.includes('java') ? 'java' : langLower.includes('rust') ? 'rs' : langLower.includes('node') ? 'js' : 'cpp'
    const blob = new Blob([code], { type: 'text/plain' })
    formData.append('file', blob, `solution.${extension}`)

    console.log(`[CSES Bot] POSTing to ${postUrl}...`)

    const res = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Cookie': this.cookie!,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': submitUrl,
        'Origin': 'https://cses.fi',
      },
      body: formData,
      redirect: 'manual'
    })

    const location = res.headers.get('location')
    console.log('[CSES Bot] Redirect location:', location)
    
    if (!location || (!location.includes('result') && !location.includes('view'))) {
      const status = res.status
      console.error('[CSES Bot] Submit failed. Status:', status)
      
      const errorHtml = await res.text()
      if (errorHtml.includes('error')) {
        const cheerio = await import('cheerio')
        const $ = cheerio.load(errorHtml)
        const errorMessage = $('.error').text() || 'Unknown error'
        console.error('[CSES Bot] CSES Error Message:', errorMessage)
        
        if (errorMessage.toLowerCase().includes('login') || errorMessage.toLowerCase().includes('csrf') || errorMessage.toLowerCase().includes('session')) {
          this.cookie = null
          return this.submit(problemId, code, language, retryCount + 1)
        }
        throw new Error(errorMessage)
      }
      
      throw new Error(`CSES Submission failed: ${status}`)
    }

    // Extract ID from /problemset/result/ID/ or /course/view/ID/ or /course/result/ID/
    const pathParts = location.split('/').filter(p => p.length > 0)
    const submissionId = pathParts[pathParts.length - 1]
    console.log('[CSES Bot] Submitted successfully! ID:', submissionId)
    return submissionId
  }

  static async getStatus(submissionId: string, retryCount = 0): Promise<CSESResult> {
    if (retryCount > 1) {
        return { status: 'ERROR', verdict: 'Failed to fetch status after retries' }
    }

    if (!this.cookie) await this.login()

    const url = submissionId.includes('/') ? `https://cses.fi${submissionId}` : `https://cses.fi/problemset/result/${submissionId}/`
    
    const res = await fetch(url, {
      headers: { 
        'Cookie': this.cookie!, 
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      }
    })
    const html = await res.text()

    if (html.includes('login') && html.includes('nick')) {
        console.log('[CSES Bot] getStatus session expired. Re-logging...')
        this.cookie = null
        return this.getStatus(submissionId, retryCount + 1)
    }

    const cheerio = await import('cheerio')
    const $ = cheerio.load(html)

    const statusText = $('.verdict').first().text().trim() || ''
    console.log(`[CSES Bot] Submission ${submissionId} status: ${statusText}`)
    
    if (statusText === 'READY' || statusText === 'PENDING' || statusText === 'WAITING' || statusText === '') {
      return { status: 'PENDING', verdict: null }
    }

    // Scrape stats from test results
    let maxTime = 0
    let maxMemory = 0
    let lastTestCase = 0

    $('tr').each((_, row) => {
        const text = $(row).text() || ''
        if (text.includes('test') && (text.includes('s /') || text.includes('MB'))) {
            const timeMatch = text.match(/(\d+\.\d+)\s*s/)
            const memMatch = text.match(/(\d+\.\d+)\s*MB/)
            const testMatch = text.match(/test\s*(\d+)/)

            if (timeMatch) maxTime = Math.max(maxTime, Math.round(parseFloat(timeMatch[1]) * 1000))
            if (memMatch) maxMemory = Math.max(maxMemory, Math.round(parseFloat(memMatch[1]) * 1024))
            if (testMatch) lastTestCase = Math.max(lastTestCase, parseInt(testMatch[1]))
        }
    })

    const upperStatus = statusText.toUpperCase()
    let verdict: string = statusText
    let status: 'PENDING' | 'TESTING' | 'COMPLETED' | 'ERROR' = 'COMPLETED'

    if (upperStatus === 'ACCEPTED') verdict = Verdict.AC
    else if (upperStatus.includes('WRONG ANSWER')) verdict = Verdict.WA
    else if (upperStatus.includes('TIME LIMIT EXCEEDED')) verdict = Verdict.TLE
    else if (upperStatus.includes('COMPILE ERROR')) verdict = Verdict.CE
    else if (upperStatus.includes('RUNTIME ERROR')) verdict = Verdict.RE
    else if (upperStatus.includes('MEMORY LIMIT EXCEEDED')) verdict = Verdict.MLE
    else if (upperStatus.includes('TESTING')) {
        status = 'TESTING'
        verdict = statusText
    }

    return {
        status,
        verdict,
        testCase: lastTestCase,
        timeMs: maxTime,
        memoryKb: maxMemory
    }
  }
}
