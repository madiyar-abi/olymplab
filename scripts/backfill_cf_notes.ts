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

async function scrapeNote(browser: any, externalId: string) {
  const match = externalId.match(/^cf-(\d+)\/(.+)$/)
  if (!match) return null

  const contestId = match[1]
  const index = match[2]

  const urls = [
    `https://codeforces.com/contest/${contestId}/problem/${index}`,
    `https://codeforces.com/problemset/problem/${contestId}/${index}`,
  ]

  const page = await browser.newPage()
  await page.setViewport({ width: 1366, height: 768 })

  let html = ''
  try {
    for (const url of urls) {
      console.log(`  [Puppeteer] Navigating to ${url}`)
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
        await page.waitForSelector('.problem-statement', { timeout: 20000 })
        await sleep(1000)
        html = await page.content()
        break
      } catch (err: any) {
        console.warn(`  [Puppeteer] Failed ${url}: ${err.message.substring(0, 80)}`)
      }
    }
  } finally {
    await page.close()
  }

  if (!html) return null

  const $ = cheerio.load(html)
  const $ps = $('.problem-statement')
  const $note = $ps.find('.note')

  if ($note.length === 0) return ''

  // Convert MathJax scripts to clean LaTeX spans
  $note.find('script[type="math/tex"]').each((i, el) => {
    const tex = $(el).text().trim()
    $(el).replaceWith(`<span class="tex-span">${tex}</span>`)
  })
  $note.find('script[type="math/tex; mode=display"]').each((i, el) => {
    const tex = $(el).text().trim()
    $(el).replaceWith(`<div class="tex-graphics" alt="${tex}"></div>`)
  })

  return htmlToMarkdown($note.html() || '')
}

async function main() {
  console.log('=== Backfilling Codeforces Notes ===')
  
  const { data: problems, error } = await supabase
    .from('problems')
    .select('id, external_id, title')
    .like('external_id', 'cf-%')
    // We want to update problems that don't have a note yet
    // Since we just added the column, they should all be null
    .is('note', null)

  if (error) {
    console.error('Error fetching problems:', error.message)
    return
  }

  console.log(`Found ${problems.length} problems to check.`)

  const browser = await (puppeteer as any).launch({ headless: true, args: ['--no-sandbox'] })

  try {
    for (let i = 0; i < problems.length; i++) {
      const p = problems[i]
      console.log(`\n[${i+1}/${problems.length}] Checking ${p.title} (${p.external_id})...`)
      
      try {
        const note = await scrapeNote(browser, p.external_id!)
        
        if (note !== null) {
          console.log(`  Found note (${note.length} chars). Updating DB...`)
          const { error: updateError } = await supabase
            .from('problems')
            .update({ note })
            .eq('id', p.id)

          if (updateError) {
            console.error(`  [DB Error] ${updateError.message}`)
          } else {
            console.log(`  [DB] ✓ Updated.`)
          }
        } else {
          console.log('  No note found or failed to scrape.')
        }

        // Sleep to be polite to CF
        if (i < problems.length - 1) {
          console.log('  Sleeping 5s...')
          await sleep(5000)
        }
      } catch (err: any) {
        console.error(`  [Error] ${err.message}`)
      }
    }
  } finally {
    await browser.close()
  }

  console.log('\n=== Backfill Finished ===')
}

main().catch(console.error)
