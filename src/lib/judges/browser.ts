import type { Browser } from 'puppeteer-core'

// On Vercel/Lambda there is no system Chromium and puppeteer's bundled binary
// can't run, so we launch @sparticuz/chromium's Lambda-compatible build via
// puppeteer-core. Locally (mac/dev) that binary won't run, so we fall back to
// the full `puppeteer` package and its own Chromium. Force either path with
// USE_SERVERLESS_CHROMIUM=1 / 0 when testing.
function isServerlessRuntime(): boolean {
  if (process.env.USE_SERVERLESS_CHROMIUM === '1') return true
  if (process.env.USE_SERVERLESS_CHROMIUM === '0') return false
  return (
    !!process.env.VERCEL ||
    !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
    !!process.env.AWS_EXECUTION_ENV ||
    !!process.env.FUNCTIONS_WORKER_RUNTIME
  )
}

/**
 * Launch a headless Chromium with the stealth plugin applied (needed to clear
 * Codeforces' Cloudflare check). Returns a puppeteer-core Browser in both modes.
 */
export async function launchStealthBrowser(): Promise<Browser> {
  const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default

  if (isServerlessRuntime()) {
    const chromium = (await import('@sparticuz/chromium')).default
    const { addExtra } = await import('puppeteer-extra')
    const puppeteerCore = (await import('puppeteer-core')).default
    const puppeteer = addExtra(puppeteerCore as unknown as Parameters<typeof addExtra>[0])
    puppeteer.use(StealthPlugin())

    console.log('[Browser] Launching @sparticuz/chromium (serverless)')
    const browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
    })
    return browser as unknown as Browser
  }

  // Local development: full puppeteer with its own Chromium.
  console.log('[Browser] Launching bundled puppeteer Chromium (local)')
  const puppeteer = (await import('puppeteer-extra')).default
  puppeteer.use(StealthPlugin())
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  return browser as unknown as Browser
}
