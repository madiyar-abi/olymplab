import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { parseCfProblemIdentifier, scrapeCodeforcesProblemRu } from '../src/lib/codeforces/scraper'

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const m = line.match(/^([^#\s]+)=(.*)$/)
      if (m) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
    })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('Fetching all problems and topic problems from Supabase...')
  const { data: allProblems, error: pErr } = await supabase
    .from('problems')
    .select('id, title, title_ru, description_ru, sample_input, sample_output, external_id, cf_id')

  if (pErr || !allProblems) {
    console.error('Failed to fetch problems:', pErr)
    process.exit(1)
  }

  const { data: topicProblems } = await supabase
    .from('topic_problems')
    .select('problem_id')

  const topicSet = new Set((topicProblems || []).map((t: any) => t.problem_id))

  // Find all problems needing repair
  const candidates: Array<{
    id: string
    title: string
    externalId: string | null
    cfId: string | null
    sampleInput: string | null
    sampleOutput: string | null
    hasRu: boolean
    brokenSample: boolean
    inTopic: boolean
    contestId: string
    index: string
  }> = []

  for (const p of allProblems) {
    const cf = parseCfProblemIdentifier(p.external_id, p.cf_id, p.title)
    if (!cf) continue

    const hasRu = Boolean(p.description_ru && p.description_ru.length > 20)
    const brokenSample = Boolean(p.sample_input && !p.sample_input.includes('\n') && p.sample_input.length > 5)

    if (!hasRu || brokenSample) {
      candidates.push({
        id: p.id,
        title: p.title,
        externalId: p.external_id,
        cfId: p.cf_id,
        sampleInput: p.sample_input,
        sampleOutput: p.sample_output,
        hasRu,
        brokenSample,
        inTopic: topicSet.has(p.id),
        contestId: cf.contestId,
        index: cf.index,
      })
    }
  }

  // Sort candidates:
  // 1. In topic + broken sample (highest priority)
  // 2. Broken sample
  // 3. In topic + missing Ru
  // 4. Missing Ru
  candidates.sort((a, b) => {
    const scoreA = (a.inTopic ? 10 : 0) + (a.brokenSample ? 5 : 0)
    const scoreB = (b.inTopic ? 10 : 0) + (b.brokenSample ? 5 : 0)
    return scoreB - scoreA
  })

  console.log(`Found ${candidates.length} candidates needing repair/translation.`)
  console.log(`- Topic problems with broken samples: ${candidates.filter((c) => c.inTopic && c.brokenSample).length}`)
  console.log(`- Total problems with broken samples: ${candidates.filter((c) => c.brokenSample).length}`)
  console.log(`- Total missing Russian descriptions: ${candidates.filter((c) => !c.hasRu).length}`)

  let done = 0
  let success = 0
  let failed = 0

  // Process sequentially to be polite to Codeforces and avoid 429
  for (const item of candidates) {
    done++
    const tag = `[${done}/${candidates.length}] ${item.contestId}/${item.index} (${item.title.slice(0, 30)})`
    try {
      const res = await scrapeCodeforcesProblemRu(item.contestId, item.index)
      if (!res || !res.descriptionRu) {
        console.warn(`${tag} -> Scrape returned empty description`)
        failed++
        continue
      }

      const updateData: Record<string, any> = {
        title_ru: res.titleRu,
        description_ru: res.descriptionRu,
      }
      if (res.sampleInput) updateData.sample_input = res.sampleInput
      if (res.sampleOutput) updateData.sample_output = res.sampleOutput

      const { error: uErr } = await supabase
        .from('problems')
        .update(updateData)
        .eq('id', item.id)

      if (uErr) {
        console.error(`${tag} -> Supabase update failed:`, uErr.message)
        failed++
      } else {
        const inLines = res.sampleInput?.split('\n').length || 0
        console.log(`${tag} -> OK (samples: ${inLines} lines, ruLen: ${res.descriptionRu.length})`)
        success++
      }
    } catch (err: any) {
      console.error(`${tag} -> Error:`, err.message?.slice(0, 80))
      failed++
    }
  }

  console.log(`\nBatch repair finished. Success: ${success}, Failed: ${failed}, Total: ${done}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal batch repair error:', err)
  process.exit(1)
})
