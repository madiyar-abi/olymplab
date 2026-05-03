import { JSDOM } from 'jsdom'

export interface CSESResult {
  status: 'PENDING' | 'TESTING' | 'COMPLETED' | 'ERROR'
  verdict: string | null
  score?: number
}

export class CSESJudge {
  private static cookie: string | null = null

  private static async login() {
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
      const dom = new JSDOM(loginHtml)
      const csrfToken = (dom.window.document.querySelector('input[name="csrf_token"]') as HTMLInputElement)?.value

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

    const dom = new JSDOM(submitHtml)
    const doc = dom.window.document
    const form = doc.querySelector('form')
    
    if (!form) {
       console.warn('[CSES Bot] No form found on submit page. Re-logging...')
       this.cookie = null
       return this.submit(problemId, code, language, retryCount + 1)
    }

    const action = form.getAttribute('action')
    const postUrl = action?.startsWith('http') ? action : `https://cses.fi${action}`
    
    const formData = new FormData()

    // 1. Collect ALL inputs from the form (including CSRF token)
    const inputs = form.querySelectorAll('input')
    inputs.forEach(input => {
      const name = input.getAttribute('name')
      const value = input.getAttribute('value')
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
        const errDom = new JSDOM(errorHtml)
        const errorMessage = errDom.window.document.querySelector('.error')?.textContent || 'Unknown error'
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

    const dom = new JSDOM(html)
    const doc = dom.window.document

    const statusText = doc.querySelector('.verdict')?.textContent?.trim() || ''
    console.log(`[CSES Bot] Submission ${submissionId} status: ${statusText}`)
    
    if (statusText === 'READY' || statusText === 'PENDING' || statusText === 'WAITING' || statusText === '') {
      // Check if it's actually a result page or if we are redirected to something else
      if (!html.includes('Submission details')) {
          console.warn('[CSES Bot] Page does not look like a result page. ID:', submissionId)
          // If we are on the wrong page, maybe the ID is for a different path
      }
      return { status: 'PENDING', verdict: null }
    }

    if (statusText === 'ACCEPTED') {
      return { status: 'COMPLETED', verdict: 'Accepted' }
    }

    const upperStatus = statusText.toUpperCase()
    if (upperStatus.includes('WRONG ANSWER')) return { status: 'COMPLETED', verdict: 'Wrong Answer' }
    if (upperStatus.includes('TIME LIMIT EXCEEDED')) return { status: 'COMPLETED', verdict: 'Time Limit Exceeded' }
    if (upperStatus.includes('COMPILE ERROR')) return { status: 'COMPLETED', verdict: 'Compile Error' }
    if (upperStatus.includes('RUNTIME ERROR')) return { status: 'COMPLETED', verdict: 'Runtime Error' }
    if (upperStatus.includes('MEMORY LIMIT EXCEEDED')) return { status: 'COMPLETED', verdict: 'Memory Limit Exceeded' }

    if (upperStatus.includes('TESTING')) return { status: 'TESTING', verdict: statusText }

    return { status: 'COMPLETED', verdict: statusText }
  }
}

