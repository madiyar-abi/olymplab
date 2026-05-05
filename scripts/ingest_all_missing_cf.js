/**
 * ingest_all_missing_cf.js (V2 — Puppeteer Stealth)
 * ──────────────────────────────────────────────
 * 1. Finds all topic_problems with source='codeforces' and problem_id=null.
 * 2. Scrapes them from Codeforces using Puppeteer Stealth.
 * 3. Creates internal 'problems' entries.
 * 4. Updates 'topic_problems' with the new problem_id.
 */

'use strict'

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const TurndownService = require('turndown')
const puppeteerExtra = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

puppeteerExtra.use(StealthPlugin())

// ─── Load .env.local ────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '../.env.local')
const envFile = fs.readFileSync(envPath, 'utf8')
envFile.split('\n').forEach(line => {
  const m = line.match(/^([^#\s]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function scrapeProblem(page, url) {
  try {
    console.log(`  [Puppeteer] Navigating to ${url}`)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
    
    // Check for CAPTCHA
    const html = await page.content()
    if (html.includes('h-captcha') || html.includes('g-recaptcha')) {
        console.warn('  [Puppeteer] ⚠️ CAPTCHA detected. Please solve it in the browser if possible.')
        await sleep(10000) // Give time to solve if non-headless
    }

    await page.waitForSelector('.problem-statement', { timeout: 10000 })
    const content = await page.content()
    const $ = cheerio.load(content)

    const statement = $('.problem-statement')
    if (statement.length === 0) return null

    const timeLimit = statement.find('.time-limit').text().replace('time limit per test', '').trim()
    const memoryLimit = statement.find('.memory-limit').text().replace('memory limit per test', '').trim()

    // ─── Surgical Cleanup ───
    // Remove headers, samples, and mathjax visual layers before conversion
    statement.find('.header, .sample-tests, .input-file, .output-file, .property-title').remove()
    statement.find('.MathJax_Preview, .MathJax, .MathJax_Display, .MJX_Assistive_MathML, .MathJax_SVG').remove()

    const fullMarkdown = td.turndown(statement.html() || '')

    const sampleInput = $('.sample-test .input pre').text().trim() || null
    const sampleOutput = $('.sample-test .output pre').text().trim() || null

    return {
      description: fullMarkdown,
      sample_input: sampleInput,
      sample_output: sampleOutput,
      time_limit: timeLimit,
      memory_limit: memoryLimit
    }
  } catch (e) {
    console.error(`  [Puppeteer] ❌ Failed to scrape ${url}:`, e.message)
    return null
  }
}

async function main() {
  console.log('🔍 Finding missing CF problems...')
  const { data: missing, error } = await supabase
    .from('topic_problems')
    .select('*')
    .eq('source', 'codeforces')
    .is('problem_id', null)

  if (error) {
    console.error('Error fetching missing problems:', error)
    return
  }

  console.log(`🚀 Found ${missing.length} problems to ingest.`)

  if (missing.length === 0) return

  console.log('[Browser] Launching Puppeteer Stealth...')
  const browser = await puppeteerExtra.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })

  let successCount = 0
  try {
    for (let i = 0; i < missing.length; i++) {
      const p = missing[i]
      console.log(`\n[${i+1}/${missing.length}] Processing: ${p.title} (${p.source_id})`)

      const content = await scrapeProblem(page, p.url)
      if (!content) {
          console.warn(`   ⚠️ Skipping ${p.title} - could not scrape.`)
          continue
      }

      const externalId = `cf-${p.source_id}`
      const requirements = {
        'algorithms': { level: Math.floor((p.cf_rating - 800) / 25), weight: 1 },
        'coding': { level: 20, weight: 1 }
      }

      // 1. Upsert into 'problems'
      const { data: internalProblem, error: pErr } = await supabase
        .from('problems')
        .upsert({
          external_id: externalId,
          title: p.title,
          description: content.description,
          sample_input: content.sample_input,
          sample_output: content.sample_output,
          difficulty: p.cf_rating <= 1200 ? 'Easy' : p.cf_rating <= 1600 ? 'Medium' : 'Hard',
          rating: p.cf_rating,
          requirements
        }, { onConflict: 'external_id' })
        .select()
        .single()

      if (pErr) {
        console.error(`     ❌ Problem upsert failed:`, pErr.message)
        continue
      }

      // 2. Link in 'topic_problems'
      const { error: linkErr } = await supabase
        .from('topic_problems')
        .update({ problem_id: internalProblem.id })
        .eq('id', p.id)

      if (linkErr) {
          console.error(`     ❌ Linking failed:`, linkErr.message)
      } else {
          console.log(`     ✅ Successfully ingested and linked.`)
          successCount++
      }

      await sleep(3000) // Respect rate limits
    }
  } finally {
    await browser.close()
  }

  console.log(`\n🎉 Finished! Ingested ${successCount}/${missing.length} problems.`)
}

main().catch(console.error)
