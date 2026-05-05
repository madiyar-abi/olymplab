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

// ─── Puppeteer Stealth ────────────────────────────────────────────────────────
puppeteer.use(StealthPlugin())

// ─── Problem Code Parser ──────────────────────────────────────────────────────
function parseProblemCode(code: string) {
  const match = code.match(/^(\d+)([A-Z]\d*)$/i)
  if (match) return { contestId: parseInt(match[1]), index: match[2].toUpperCase() }
  return null
}

// ─── Puppeteer Scraper ────────────────────────────────────────────────────────
async function scrapeProblem(browser: any, contestId: number, index: string) {
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
        
        // Wait a bit for MathJax if present
        await sleep(1000)
        
        html = await page.content()
        console.log(`  [Puppeteer] ✓ Page loaded (${html.length} bytes).`)
        break
      } catch (err: any) {
        console.warn(`  [Puppeteer] Failed ${url}: ${err.message.substring(0, 80)}`)
      }
    }
  } finally {
    await page.close()
  }

  if (!html) throw new Error('Could not load problem page (all URLs failed).')

  const $ = cheerio.load(html)
  const $ps = $('.problem-statement')

  // 1. Title & Limits
  const title = $ps.find('.header .title').text().trim() || `Problem ${contestId}${index}`
  const timeLimit = $ps.find('.time-limit').text().replace('time limit per test', '').trim()
  const memoryLimit = $ps.find('.memory-limit').text().replace('memory limit per test', '').trim()

  // 2. Sample I/O (handled as raw text)
  const sampleInput = $ps.find('.sample-test .input pre').text().trim() || '// No sample input found.'
  const sampleOutput = $ps.find('.sample-test .output pre').text().trim() || '// No sample output found.'

  // 3. Mathematical Extraction & Cleaning (Surgical)
  // Remove visual/assistive layers to prevent duplication in final markdown
  $ps.find('.MathJax_Preview, .MathJax, .MathJax_Display, .MJX_Assistive_MathML, .MathJax_SVG').remove()

  // Convert MathJax scripts to clean LaTeX spans before conversion
  $ps.find('script[type="math/tex"]').each((i, el) => {
    const tex = $(el).text().trim()
    $(el).replaceWith(`<span class="tex-span">${tex}</span>`)
  })
  
  $ps.find('script[type="math/tex; mode=display"]').each((i, el) => {
    const tex = $(el).text().trim()
    $(el).replaceWith(`<div class="tex-graphics" alt="${tex}"></div>`)
  })

  // 4. Extract Note (Codeforces specific)
  const $note = $ps.find('.note')
  let noteMarkdown = ''
  if ($note.length > 0) {
    // Convert note MathJax before conversion
    $note.find('script[type="math/tex"]').each((i, el) => {
      const tex = $(el).text().trim()
      $(el).replaceWith(`<span class="tex-span">${tex}</span>`)
    })
    $note.find('script[type="math/tex; mode=display"]').each((i, el) => {
      const tex = $(el).text().trim()
      $(el).replaceWith(`<div class="tex-graphics" alt="${tex}"></div>`)
    })
    
    noteMarkdown = htmlToMarkdown($note.html() || '')
    $note.remove() // Remove it so it doesn't appear in description if it was inside
  }

  // 5. Cleanup non-description headers
  $ps.find('.header, .sample-tests, .input-file, .output-file, .property-title').remove()

  // 6. Convert to Markdown using the expert converter
  const descriptionMarkdown = htmlToMarkdown($ps.html() || '')

  return { 
    title, 
    description: descriptionMarkdown, 
    note: noteMarkdown,
    sampleInput, 
    sampleOutput, 
    timeLimit, 
    memoryLimit 
  }
}

// ─── CF API – top 100 ────────────────────────────────────────────────────────
async function fetchTop100Problems(): Promise<{ contestId: number; index: string; name: string }[]> {
  console.log('[CF API] Fetching problemset...');
  const response = await fetch('https://codeforces.com/api/problemset.problems');
  const data = await response.json() as any;
  if (data.status !== 'OK') throw new Error('Failed to fetch problemset.');
  const problems = data.result.problems.slice(0, 100);
  console.log(`[CF API] Got ${problems.length} problems.`);
  return problems;
}

// ─── Main Execution ──────────────────────────────────────────────────────────
async function main() {
  const codes = process.argv.slice(2)
  
  if (codes.length === 0) {
    console.log('No problem codes provided. Usage: node scripts/ingest_cf.js 71A 158A ...')
    return
  }

  console.log(`=== Codeforces Ingestion — Specific Problems ===`)
  const browser = await (puppeteer as any).launch({ headless: true, args: ['--no-sandbox'] })

  try {
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i]
      const parsed = parseProblemCode(code)
      
      console.log(`\n--- [${i+1}/${codes.length}] ${code} ---`)
      
      if (!parsed) {
        console.error(`  [Error] Invalid problem code: ${code}`)
        continue
      }

      try {
        const scraped = await scrapeProblem(browser, parsed.contestId, parsed.index)
        
        console.log(`  [Title]      ${scraped.title}`)
        console.log(`  [Sample In]  ${scraped.sampleInput.substring(0, 50)}...`)
        console.log(`  [Sample Out] ${scraped.sampleOutput.substring(0, 50)}...`)
        if (scraped.note) console.log(`  [Note]       Found (${scraped.note.length} chars)`)

        // ── Supabase Insertion ──
        console.log(`  [DB] Inserting "${scraped.title}"…`)
        
        const { data, error } = await supabase
          .from('problems')
          .upsert({
            external_id: `cf-${parsed.contestId}/${parsed.index}`,
            title: `[CF] ${scraped.title}`,
            description: scraped.description,
            note: scraped.note,
            difficulty: 'Medium',
            requirements: {
              algorithms: { level: 40, weight: 1 },
              logic: { level: 40, weight: 1 }
            },
            sample_input: scraped.sampleInput,
            sample_output: scraped.sampleOutput,
            time_limit: scraped.timeLimit,
            memory_limit: scraped.memoryLimit,
          }, { onConflict: 'external_id' })
          .select('id')
          .single()

        if (error) {
          console.error(`  [DB Error] ${error.message}`)
        } else {
          console.log(`  [DB] ✓ Inserted — ID: ${data.id}`)
        }

        // Politely wait between problems
        if (i < codes.length - 1) {
          console.log(`  [Delay] Sleeping 4s…`)
          await sleep(4000)
        }
      } catch (err: any) {
        console.error(`  [Error] ${err.message}`)
      }
    }
  } finally {
    await browser.close()
    console.log(`\n[Browser] Closed.`)
  }

  console.log(`\n=== Finished: ${codes.length}/${codes.length} problems ingested ===`)
}

main().catch(console.error)
