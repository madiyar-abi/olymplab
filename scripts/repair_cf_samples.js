// Repair corrupted Codeforces sample I/O in place.
//
//   node scripts/repair_cf_samples.js
//
// Older ingestion stored multi-line samples with their newlines stripped
// (Codeforces wraps each sample line in <div class="test-example-line"> and
// cheerio .text() concatenates them), so e.g. "3\n1\n3" was saved as "313",
// making correct solutions fail with WA on the sample diff.
//
// This pulls every cf-* problem from the DB, re-scrapes just the samples with
// the corrected extraction, and updates the rows whose samples actually changed.
// Runs non-headless so you can clear any Cloudflare/CAPTCHA challenge manually.

const { createClient } = require('@supabase/supabase-js')
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
const puppeteerExtra = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

// ── env ──
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([^#\s]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
  })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

puppeteerExtra.use(StealthPlugin())

// Same extraction as the fixed ingester: join the per-line divs with newlines,
// falling back to raw <pre> text for legacy problems.
function extractSample($, sel) {
  const $pre = $(sel).first()
  const lineDivs = $pre.find('.test-example-line')
  const text = lineDivs.length > 0
    ? lineDivs.map((_, el) => $(el).text()).get().join('\n')
    : $pre.text()
  return text.trim()
}

// 'cf-1234/A' -> { contestId: '1234', index: 'A' }
function parseExternalId(externalId) {
  const m = String(externalId).match(/^cf-(\d+)\/([A-Za-z]\d*)$/)
  return m ? { contestId: m[1], index: m[2] } : null
}

async function scrapeSamples(browser, contestId, index) {
  const urls = [
    `https://codeforces.com/contest/${contestId}/problem/${index}`,
    `https://codeforces.com/problemset/problem/${contestId}/${index}`,
  ]
  const page = await browser.newPage()
  await page.setViewport({ width: 1366, height: 768 })
  let html = ''
  try {
    for (const url of urls) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
        await page.waitForSelector('.problem-statement', { timeout: 20000 })
        html = await page.content()
        break
      } catch (err) {
        console.warn(`    [scrape] failed ${url}: ${String(err.message).slice(0, 80)}`)
      }
    }
  } finally {
    await page.close()
  }
  if (!html) throw new Error('could not load problem page')
  const $ = cheerio.load(html)
  return {
    sampleInput: extractSample($, '.problem-statement .sample-test .input pre'),
    sampleOutput: extractSample($, '.problem-statement .sample-test .output pre'),
  }
}

async function main() {
  console.log('[Repair] Fetching Codeforces problems…')
  const { data: problems, error } = await supabase
    .from('problems')
    .select('id, external_id, sample_input, sample_output')
    .like('external_id', 'cf-%')
    .order('external_id')

  if (error) {
    console.error('[Repair] DB fetch error:', error.message)
    process.exit(1)
  }
  console.log(`[Repair] ${problems.length} problem(s) to check.\n`)

  console.log('[Browser] Launching Puppeteer Stealth (non-headless — solve any CAPTCHA manually)…\n')
  const browser = await puppeteerExtra.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1366,768'],
  })

  let fixed = 0
  let skipped = 0
  let failed = 0
  try {
    for (let i = 0; i < problems.length; i++) {
      const p = problems[i]
      const tag = `[${i + 1}/${problems.length}] ${p.external_id}`
      const parsed = parseExternalId(p.external_id)
      if (!parsed) {
        console.warn(`${tag} — unparseable external_id, skipping`)
        skipped++
        continue
      }
      try {
        const { sampleInput, sampleOutput } = await scrapeSamples(browser, parsed.contestId, parsed.index)
        if (!sampleInput || !sampleOutput) {
          console.warn(`${tag} — no samples found on page, skipping`)
          skipped++
          continue
        }
        if (sampleInput === p.sample_input && sampleOutput === p.sample_output) {
          console.log(`${tag} — already correct`)
          skipped++
          continue
        }
        const { error: upErr } = await supabase
          .from('problems')
          .update({ sample_input: sampleInput, sample_output: sampleOutput })
          .eq('id', p.id)
        if (upErr) {
          console.error(`${tag} — update error: ${upErr.message}`)
          failed++
          continue
        }
        console.log(`${tag} — ✓ fixed`)
        fixed++
      } catch (err) {
        console.error(`${tag} — ${String(err.message).slice(0, 100)}`)
        failed++
      }
      await sleep(1200) // be polite to Codeforces
    }
  } finally {
    await browser.close()
  }

  console.log(`\n[Repair] Done. fixed=${fixed} skipped=${skipped} failed=${failed}`)
  process.exit(0)
}

main()
