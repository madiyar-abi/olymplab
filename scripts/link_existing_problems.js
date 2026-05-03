
const { createClient } = require('@supabase/supabase-js')
const https = require('https')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TOPIC_MAP = {
  1:  { tags: ['implementation'],                   easy: 800,  medium: 1000, skill: 'coding' },
  2:  { tags: ['implementation', 'strings'],        easy: 800,  medium: 1100, skill: 'coding' },
  3:  { tags: ['*special'],                         easy: 1200, medium: 1700, skill: 'algorithms' },
  4:  { tags: ['implementation', 'data structures'],easy: 800,  medium: 1300, skill: 'coding' },
  5:  { tags: ['sortings'],                         easy: 800,  medium: 1400, skill: 'algorithms' },
  6:  { tags: ['sortings'],                         easy: 1000, medium: 1600, skill: 'algorithms' },
  7:  { tags: ['sortings'],                         easy: 1200, medium: 1800, skill: 'algorithms' },
  8:  { tags: ['data structures', 'trees'],         easy: 1200, medium: 1800, skill: 'data_structures' },
  9:  { tags: ['data structures', 'math'],          easy: 800,  medium: 1400, skill: 'data_structures' },
  10: { tags: ['binary search'],                    easy: 800,  medium: 1500, skill: 'algorithms' },
  11: { tags: ['binary search'],                    easy: 1200, medium: 1800, skill: 'algorithms' },
  12: { tags: ['interactive'],                      easy: 1000, medium: 1600, skill: 'coding' },
  13: { tags: ['sortings', 'data structures'],      easy: 1200, medium: 1800, skill: 'algorithms' },
  14: { tags: ['bitmasks'],                         easy: 800,  medium: 1500, skill: 'logic' },
  15: { tags: ['math', 'number theory'],            easy: 800,  medium: 1600, skill: 'algorithms' },
  16: { tags: ['number theory'],                    easy: 1000, medium: 1800, skill: 'algorithms' },
  17: { tags: ['implementation'],                   easy: 1200, medium: 1800, skill: 'coding' },
  18: { tags: ['data structures', 'trees'],         easy: 1200, medium: 1900, skill: 'data_structures' },
  19: { tags: ['greedy'],                           easy: 800,  medium: 1700, skill: 'logic' },
  20: { tags: ['graphs', 'dfs and similar'],        easy: 1000, medium: 1700, skill: 'algorithms' },
  21: { tags: ['graphs'],                           easy: 1200, medium: 1800, skill: 'algorithms' },
  22: { tags: ['shortest paths'],                   easy: 1300, medium: 2000, skill: 'algorithms' },
  23: { tags: ['dsu'],                              easy: 1200, medium: 1900, skill: 'data_structures' },
  24: { tags: ['trees'],                            easy: 1300, medium: 2100, skill: 'algorithms' },
  25: { tags: ['dp'],                               easy: 1000, medium: 1900, skill: 'algorithms' },
  26: { tags: ['games'],                            easy: 1000, medium: 2000, skill: 'logic' },
  27: { tags: ['strings'],                          easy: 1000, medium: 1800, skill: 'coding' },
  28: { tags: ['hashing', 'strings'],               easy: 1400, medium: 2200, skill: 'algorithms' },
  29: { tags: ['string suffix structures'],         easy: 1800, medium: 2600, skill: 'data_structures' },
  30: { tags: ['data structures'],                  easy: 1400, medium: 2200, skill: 'data_structures' },
  31: { tags: ['data structures'],                  easy: 1800, medium: 2600, skill: 'data_structures' },
  32: { tags: ['geometry'],                         easy: 1000, medium: 2000, skill: 'algorithms' },
  33: { tags: ['geometry'],                         easy: 1800, medium: 2500, skill: 'algorithms' },
  34: { tags: ['math'],                             easy: 1500, medium: 2200, skill: 'algorithms' },
  35: { tags: ['math'],                             easy: 2000, medium: 2600, skill: 'algorithms' },
  36: { tags: ['graphs'],                           easy: 1800, medium: 2500, skill: 'algorithms' },
  37: { tags: ['graph matchings'],                  easy: 1600, medium: 2400, skill: 'algorithms' },
  38: { tags: ['flows'],                            easy: 1700, medium: 2500, skill: 'algorithms' },
  39: { tags: ['divide and conquer'],               easy: 1800, medium: 2500, skill: 'algorithms' },
  40: { tags: ['data structures'],                  easy: 2000, medium: 2800, skill: 'data_structures' },
  41: { tags: ['dp'],                               easy: 2000, medium: 2800, skill: 'algorithms' },
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

async function main() {
  console.log('🚀 Starting linking process...')

  // 1. Fetch internal problems
  console.log('📦 Fetching internal problems...')
  const { data: internalProblems } = await supabase.from('problems').select('id, external_id, cf_id, title')
  const problemByExtId = {}
  internalProblems.forEach(p => { 
    if (p.external_id) problemByExtId[p.external_id] = p 
    if (p.cf_id) problemByExtId[`cf-${p.cf_id}`] = p
  })
  console.log(`✅ Loaded ${internalProblems.length} internal problems.`)

  // 2. Fetch roadmap topics
  console.log('📚 Fetching roadmap topics...')
  const { data: topicRows } = await supabase.from('roadmap_topics').select('id, title, order_index')
  const topicByIdx = {}
  topicRows.forEach(t => topicByIdx[t.order_index] = t)
  console.log(`✅ Loaded ${topicRows.length} topics.`)

  // 3. Fetch CF Problemset (for metadata)
  console.log('🌐 Fetching CF Problemset metadata...')
  let cfProblems = []
  try {
    const cfApi = await fetchUrl('https://codeforces.com/api/problemset.problems')
    const cfData = JSON.parse(cfApi)
    if (cfData.status === 'OK') {
      cfProblems = cfData.result.problems
      console.log(`✅ Loaded ${cfProblems.length} CF problems metadata.`)
    }
  } catch (e) {
    console.warn('⚠️ Could not fetch CF API, using internal data only.')
  }

  let linkedCount = 0
  const usedProblems = new Set()

  // Pre-load already linked problems from DB to avoid conflicts
  const { data: alreadyLinked } = await supabase.from('topic_problems').select('source, source_id')
  alreadyLinked?.forEach(lp => usedProblems.add(`${lp.source}:${lp.source_id}`))

  for (const idx of Object.keys(TOPIC_MAP)) {
    const cfg = TOPIC_MAP[idx]
    const topic = topicByIdx[idx]
    if (!topic) continue

    console.log(`\n🔗 Linking for Topic [${idx}]: ${topic.title}`)

    // Find all CF problems matching this topic's tags
    const matchingCf = cfProblems.filter(p => 
      p.rating && cfg.tags.some(t => (p.tags || []).includes(t))
    )

    // Intersect with what we have in DB and NOT used yet
    const linkable = matchingCf.map(p => ({
        ...p,
        internal: problemByExtId[`cf-${p.contestId}/${p.index}`] || problemByExtId[`cf-${p.contestId}${p.index}`]
    })).filter(p => p.internal && !usedProblems.has(`codeforces:${p.contestId}/${p.index}`))

    console.log(`   - Found ${linkable.length} NEW internally available candidates.`)

    // Pick 3 Easy, 3 Medium, 3 Hard
    const easy = linkable.filter(p => p.rating <= cfg.easy).slice(0, 3)
    const medium = linkable.filter(p => p.rating > cfg.easy && p.rating <= cfg.medium).slice(0, 3)
    const hard = linkable.filter(p => p.rating > cfg.medium).slice(0, 3)

    const candidates = [...easy, ...medium, ...hard]

    for (const p of candidates) {
      const sourceId = `${p.contestId}/${p.index}`
      const url = `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`
      
      const { error } = await supabase
        .from('topic_problems')
        .insert({
          topic_id: topic.id,
          source: 'codeforces',
          source_id: sourceId,
          title: p.name,
          url,
          cf_rating: p.rating,
          difficulty: p.rating <= cfg.easy ? 'easy' : p.rating <= cfg.medium ? 'medium' : 'hard',
          problem_id: p.internal.id,
          tags: p.tags,
          layer: p.rating <= cfg.easy ? 'intro' : p.rating <= cfg.medium ? 'core' : 'mixed'
        })

      if (!error) {
          linkedCount++
          usedProblems.add(`codeforces:${sourceId}`)
      } else {
          console.error(`      ❌ Link failed for ${p.name}:`, error.message)
      }
    }
  }

  console.log(`\n✨ Finished! Linked ${linkedCount} tasks across all topics.`)
}

main().catch(console.error)
