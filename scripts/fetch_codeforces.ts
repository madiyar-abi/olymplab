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

// ─── Mapping config ──────────────────────────────────────────────────────────
const TOPIC_MAP: Record<number, any> = {
  1:  { tags: ['implementation'],                   easy: 800,  medium: 1000, skill: 'coding' },
  2:  { tags: ['implementation', 'strings'],        easy: 800,  medium: 1100, skill: 'coding' },
  3:  { tags: ['implementation', 'brute force'],    easy: 800,  medium: 1200, skill: 'algorithms' },
  4:  { tags: ['implementation', 'data structures'],easy: 800,  medium: 1300, skill: 'coding' },
  5:  { tags: ['sortings'],                         easy: 800,  medium: 1400, skill: 'algorithms' },
  6:  { tags: ['sortings'],                         easy: 1000, medium: 1600, skill: 'algorithms' },
  7:  { tags: ['sortings'],                         easy: 1200, medium: 1800, skill: 'algorithms' },
  8:  { tags: ['data structures', 'trees'],         easy: 1200, medium: 1800, skill: 'data_structures' },
  9:  { tags: ['data structures', 'math'],          easy: 800,  medium: 1400, skill: 'data_structures' },
  10: { tags: ['binary search'],                    easy: 800,  medium: 1500, skill: 'algorithms' },
  11: { tags: ['binary search'],                    easy: 1200, medium: 1800, skill: 'algorithms' },
  12: { tags: ['interactive'],                      easy: 1000, medium: 1800, skill: 'coding' },
  13: { tags: ['sortings', 'data structures'],      easy: 1200, medium: 1800, skill: 'algorithms' },
  14: { tags: ['bitmasks'],                         easy: 800,  medium: 1500, skill: 'logic' },
  15: { tags: ['math', 'number theory'],            easy: 800,  medium: 1600, skill: 'algorithms' },
  16: { tags: ['number theory'],                    easy: 1000, medium: 1800, skill: 'algorithms' },
  17: { tags: ['implementation'],                   easy: 1200, medium: 1800, skill: 'coding' },
  18: { tags: ['data structures', 'trees'],         easy: 1200, medium: 2000, skill: 'data_structures' },
  19: { tags: ['greedy'],                           easy: 800,  medium: 1700, skill: 'logic' },
  20: { tags: ['graphs', 'dfs and similar'],        easy: 1000, medium: 1700, skill: 'algorithms' },
  21: { tags: ['graphs', 'dfs and similar'],        easy: 1200, medium: 1900, skill: 'algorithms' },
  22: { tags: ['shortest paths'],                   easy: 1300, medium: 2000, skill: 'algorithms' },
  23: { tags: ['dsu', 'graphs'],                    easy: 1200, medium: 2000, skill: 'data_structures' },
  24: { tags: ['trees', 'dfs and similar'],         easy: 1300, medium: 2100, skill: 'algorithms' },
  25: { tags: ['dp'],                               easy: 1000, medium: 1900, skill: 'algorithms' },
  26: { tags: ['games'],                            easy: 1000, medium: 2000, skill: 'logic' },
  27: { tags: ['strings'],                          easy: 1000, medium: 1800, skill: 'coding' },
  28: { tags: ['hashing', 'strings'],               easy: 1400, medium: 2200, skill: 'algorithms' },
  29: { tags: ['string suffix structures', 'strings'], easy: 1800, medium: 2600, skill: 'data_structures' },
  30: { tags: ['data structures'],                  easy: 1400, medium: 2200, skill: 'data_structures' },
  31: { tags: ['data structures', 'divide and conquer'], easy: 1800, medium: 2600, skill: 'data_structures' },
  32: { tags: ['geometry'],                         easy: 1000, medium: 2000, skill: 'algorithms' },
  33: { tags: ['geometry'],                         easy: 1800, medium: 2500, skill: 'algorithms' },
  34: { tags: ['math', 'number theory'],            easy: 1500, medium: 2200, skill: 'algorithms' },
  35: { tags: ['math', 'combinatorics'],            easy: 2000, medium: 2600, skill: 'algorithms' },
  36: { tags: ['graphs', 'shortest paths', 'dfs and similar'], easy: 1800, medium: 2500, skill: 'algorithms' },
  37: { tags: ['graph matchings', 'flows'],         easy: 1600, medium: 2400, skill: 'algorithms' },
  38: { tags: ['flows', 'graph matchings'],         easy: 1700, medium: 2500, skill: 'algorithms' },
  39: { tags: ['divide and conquer', 'data structures'], easy: 1800, medium: 2500, skill: 'algorithms' },
  40: { tags: ['data structures', 'trees'],         easy: 2000, medium: 2800, skill: 'data_structures' },
  41: { tags: ['dp'],                               easy: 2000, medium: 2800, skill: 'algorithms' },
  42: { tags: ['dp', 'graphs', 'math'],             easy: 2400, medium: 3000, skill: 'logic' },
  43: { tags: ['dp', 'graphs', 'math', 'data structures'], easy: 2600, medium: 3200, skill: 'logic' },
}

/**
 * Scrapes CF problem page using Puppeteer
 */
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
      console.log(`     [Puppeteer] Navigating to ${url}`)
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
        await page.waitForSelector('.problem-statement', { timeout: 15000 })
        await sleep(500)
        html = await page.content()
        break
      } catch (err: any) {
        // console.warn(`     [Puppeteer] Failed ${url}: ${err.message.substring(0, 50)}`)
      }
    }
  } finally {
    await page.close()
  }

  if (!html) return null

  const $ = cheerio.load(html)
  const $ps = $('.problem-statement')

  const timeLimit = $ps.find('.time-limit').text().replace('time limit per test', '').trim()
  const memoryLimit = $ps.find('.memory-limit').text().replace('memory limit per test', '').trim()
  const sampleInput = $ps.find('.sample-test .input pre').text().trim() || null
  const sampleOutput = $ps.find('.sample-test .output pre').text().trim() || null

  // Remove elements we don't want in the description
  $ps.find('.header, .sample-tests, .input-file, .output-file, .property-title').remove()

  const descriptionMarkdown = htmlToMarkdown($ps.html() || '')

  return { 
    description: descriptionMarkdown, 
    sample_input: sampleInput, 
    sample_output: sampleOutput, 
    time_limit: timeLimit, 
    memory_limit: memoryLimit 
  }
}

async function main() {
  console.log('🌐 Fetching Codeforces Roadmap Problems (V5 — Puppeteer)...')
  
  const { data: topicRows } = await supabase.from('roadmap_topics').select('*').order('order_index')
  if (!topicRows) return
  const topicByIdx: Record<number, any> = {}
  topicRows.forEach(t => topicByIdx[t.order_index] = t)

  // Clear existing Codeforces links to rebalance
  console.log('🧹 Clearing existing Codeforces links for rebalancing...')
  await supabase.from('topic_problems').delete().eq('source', 'codeforces')

  console.log('📡 Fetching CF Problemset API...')
  const response = await fetch('https://codeforces.com/api/problemset.problems')
  const cfData = await response.json() as any
  if (cfData.status !== 'OK') {
    console.error('Failed to fetch CF API')
    return
  }
  const allProblems = cfData.result.problems
  
  const alreadyLinked = new Set<string>()
  const browser = await (puppeteer as any).launch({ headless: true, args: ['--no-sandbox'] })

  try {
    const indices = Object.keys(TOPIC_MAP).map(Number).sort((a, b) => b - a)
    
    for (const idx of indices) {
      const cfg = TOPIC_MAP[idx]
      const topic = topicByIdx[idx]
      if (!topic) continue

      console.log(`\n📚 [${idx}] Processing: ${topic.title}`)
      
      const validProblems = allProblems.filter((p: any) => 
        p.rating && cfg.tags.some((t: string) => (p.tags || []).includes(t)) && !alreadyLinked.has(`codeforces:${p.contestId}/${p.index}`)
      )

      // Pick to reach at least 9-12
      const needed = 12
      const easy = validProblems.filter((p: any) => p.rating <= cfg.easy).slice(0, Math.ceil(needed/3))
      const medium = validProblems.filter((p: any) => p.rating > cfg.easy && p.rating <= cfg.medium).slice(0, Math.ceil(needed/3))
      const hard = validProblems.filter((p: any) => p.rating > cfg.medium).slice(0, Math.ceil(needed/3))

      const candidates = [...easy, ...medium, ...hard].slice(0, needed)
      console.log(`   - Found ${candidates.length} candidates`)

      for (const p of candidates) {
        const sourceId = `${p.contestId}/${p.index}`
        const url = `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`
        const externalId = `cf-${sourceId}`
        
        console.log(`   - Problem: ${p.name} (${sourceId}) [Rating: ${p.rating}]`)
        
        // Check DB
        const { data: existing } = await supabase
          .from('problems')
          .select('id, description')
          .eq('external_id', externalId)
          .single()

        let internalId = existing?.id
        
        if (!existing || !existing.description) {
          console.log(`     🔍 Scraping...`)
          const content = await scrapeProblem(browser, p.contestId, p.index)
          if (!content) {
            console.log(`     ⚠️  Scrape failed.`)
            continue
          }

          const requirements = {
            [cfg.skill]: { level: Math.floor((p.rating - 800) / 25), weight: 1 },
            'coding': { level: 20, weight: 1 }
          }

          const { data: upserted, error: pErr } = await supabase
            .from('problems')
            .upsert({
              external_id: externalId,
              title: `[CF] ${p.name}`,
              description: content.description,
              sample_input: content.sample_input,
              sample_output: content.sample_output,
              difficulty: p.rating <= cfg.easy ? 'Easy' : p.rating <= cfg.medium ? 'Medium' : 'Hard',
              requirements
            }, { onConflict: 'external_id' })
            .select()
            .single()

          if (pErr) {
            console.error(`     ⚠️  DB Error: ${pErr.message}`)
            continue
          }
          internalId = upserted.id
          await sleep(2000) // Politeness
        } else {
          console.log(`     ✅ Already in DB.`)
        }

        const { error: linkErr } = await supabase
          .from('topic_problems')
          .upsert({
            topic_id: topic.id,
            source: 'codeforces',
            source_id: sourceId,
            title: p.name,
            url,
            cf_rating: p.rating,
            difficulty: p.rating <= cfg.easy ? 'easy' : p.rating <= cfg.medium ? 'medium' : 'hard',
            problem_id: internalId,
            tags: p.tags,
            layer: p.rating <= cfg.easy ? 'intro' : p.rating <= cfg.medium ? 'core' : 'mixed'
          }, { onConflict: 'source,source_id' })

        if (!linkErr) {
          alreadyLinked.add(`codeforces:${sourceId}`)
        }
      }
    }
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
