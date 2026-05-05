import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { htmlToMarkdown } from '../src/lib/converter'
import * as fs from 'fs'
import * as path from 'path'

// ─── Environment Setup ────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s]+)=(.*)$/)
    if (match) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
  })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

puppeteer.use(StealthPlugin())

async function scrapeProblem(browser: any, contestId: string, index: string) {
  const urls = [
    `https://codeforces.com/contest/${contestId}/problem/${index}`,
    `https://codeforces.com/problemset/problem/${contestId}/${index}`,
  ]

  const page = await browser.newPage()
  await page.setViewport({ width: 1366, height: 768 })

  let html = ''
  try {
    for (const url of urls) {
      console.log(`     [Puppeteer] Navigating to ${url}`)
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
        await page.waitForSelector('.problem-statement', { timeout: 15000 })
        await sleep(500)
        html = await page.content()
        break
      } catch (err: any) {}
    }
  } finally {
    await page.close()
  }

  if (!html) return null

  const $ = cheerio.load(html)
  const $ps = $('.problem-statement')

  const sampleInput = $ps.find('.sample-test .input pre').text().trim() || null
  const sampleOutput = $ps.find('.sample-test .output pre').text().trim() || null

  // Surgical Cleanup
  $ps.find('.MathJax_Preview, .MathJax, .MathJax_Display, .MJX_Assistive_MathML, .MathJax_SVG').remove()
  $ps.find('.header, .sample-tests, .input-file, .output-file, .property-title').remove()

  const descriptionMarkdown = htmlToMarkdown($ps.html() || '')

  return { 
    description: descriptionMarkdown, 
    sample_input: sampleInput, 
    sample_output: sampleOutput
  }
}

function parseCfId(cfId: string) {
    const match = cfId.match(/^(\d+)([A-Z]\d*)$/i)
    if (match) return { contestId: match[1], index: match[2].toUpperCase() }
    return null
}

async function fix() {
  console.log('🔍 Identifying problems to fix...')
  const { data: allProblems, error } = await supabase
    .from('problems')
    .select('id, title, description, external_id, cf_id')
    .like('title', '[CF]%')

  if (error) { console.error(error); return; }

  const toFix = allProblems.filter(p => !p.description || (!p.description.includes('Input') && !p.description.includes('Входные данные')))
  console.log(`🚀 Found ${toFix.length} problems to fix.`)

  if (toFix.length === 0) return

  const browser = await (puppeteer as any).launch({ headless: true, args: ['--no-sandbox'] })

  try {
    for (let i = 0; i < toFix.length; i++) {
      const p = toFix[i]
      let contestId = '', index = ''

      if (p.external_id && p.external_id.startsWith('cf-')) {
          const parts = p.external_id.replace('cf-', '').split('/')
          contestId = parts[0]
          index = parts[1]
      } else if (p.cf_id) {
          const parsed = parseCfId(p.cf_id)
          if (parsed) {
              contestId = parsed.contestId
              index = parsed.index
          }
      }

      if (!contestId || !index) {
          console.log(`[${i+1}/${toFix.length}] ⚠️ Skipping ${p.title} - could not determine CF ID.`)
          continue
      }

      console.log(`[${i+1}/${toFix.length}] Fixing: ${p.title} (${contestId}${index})...`)

      try {
        const content = await scrapeProblem(browser, contestId, index)
        if (!content) {
            console.warn(`   ⚠️ Scrape failed.`)
            continue
        }

        const updates: any = { description: content.description }
        if (content.sample_input) updates.sample_input = content.sample_input
        if (content.sample_output) updates.sample_output = content.sample_output
        
        // Attempt to set external_id if missing
        if (!p.external_id) {
            const externalId = `cf-${contestId}/${index}`
            // Check if another problem already has this external_id
            const { data: existing } = await supabase
                .from('problems')
                .select('id')
                .eq('external_id', externalId)
                .single()
            
            if (!existing) {
                updates.external_id = externalId
            } else {
                console.log(`   ℹ️ Another problem already has external_id ${externalId}. Just updating description.`)
            }
        }

        const { error: upErr } = await supabase
          .from('problems')
          .update(updates)
          .eq('id', p.id)

        if (upErr) {
            console.error(`   ❌ DB Error: ${upErr.message}`)
        } else {
            console.log(`   ✅ Fixed!`)
        }
      } catch (err: any) {
          console.error(`   ❌ Error: ${err.message}`)
      }

      // Respect rate limits
      await sleep(2000)
    }
  } finally {
    await browser.close()
  }
}

fix().catch(console.error)
