
const { createClient } = require('@supabase/supabase-js')
const https = require('https')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TOPIC_MAP = {
  1:  { tags: ['implementation'],                   skill: 'coding' },
  2:  { tags: ['implementation', 'strings'],        skill: 'coding' },
  3:  { tags: ['*special'],                         skill: 'algorithms' },
  4:  { tags: ['implementation', 'data structures'],skill: 'coding' },
  5:  { tags: ['sortings'],                         skill: 'algorithms' },
  6:  { tags: ['sortings'],                         skill: 'algorithms' },
  7:  { tags: ['sortings'],                         skill: 'algorithms' },
  8:  { tags: ['data structures', 'trees'],         skill: 'data_structures' },
  9:  { tags: ['data structures', 'math'],          skill: 'data_structures' },
  10: { tags: ['binary search'],                    skill: 'algorithms' },
  11: { tags: ['binary search'],                    skill: 'algorithms' },
  12: { tags: ['interactive'],                      skill: 'coding' },
  13: { tags: ['sortings', 'data structures'],      skill: 'algorithms' },
  14: { tags: ['bitmasks'],                         skill: 'logic' },
  15: { tags: ['math', 'number theory'],            skill: 'algorithms' },
  16: { tags: ['number theory'],                    skill: 'algorithms' },
  17: { tags: ['implementation'],                   skill: 'coding' },
  18: { tags: ['data structures', 'trees'],         skill: 'data_structures' },
  19: { tags: ['greedy'],                           skill: 'logic' },
  20: { tags: ['graphs', 'dfs and similar'],        skill: 'algorithms' },
  21: { tags: ['graphs'],                           skill: 'algorithms' },
  22: { tags: ['shortest paths'],                   skill: 'algorithms' },
  23: { tags: ['dsu'],                              skill: 'data_structures' },
  24: { tags: ['trees'],                            skill: 'algorithms' },
  25: { tags: ['dp'],                               skill: 'algorithms' },
  26: { tags: ['games'],                            skill: 'logic' },
  27: { tags: ['strings'],                          skill: 'coding' },
  28: { tags: ['hashing', 'strings'],               skill: 'algorithms' },
  29: { tags: ['string suffix structures'],         skill: 'data_structures' },
  30: { tags: ['data structures'],                  skill: 'data_structures' },
  31: { tags: ['data structures'],                  skill: 'data_structures' },
  32: { tags: ['geometry'],                         skill: 'algorithms' },
  33: { tags: ['geometry'],                         skill: 'algorithms' },
  34: { tags: ['math'],                             skill: 'algorithms' },
  35: { tags: ['math'],                             skill: 'algorithms' },
  36: { tags: ['graphs'],                           skill: 'algorithms' },
  37: { tags: ['graph matchings'],                  skill: 'algorithms' },
  38: { tags: ['flows'],                            skill: 'algorithms' },
  39: { tags: ['divide and conquer'],               skill: 'algorithms' },
  40: { tags: ['data structures'],                  skill: 'data_structures' },
  41: { tags: ['dp'],                               skill: 'algorithms' },
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
  console.log('🚀 Linking remaining unlinked problems...')

  // 1. Fetch unlinked problems
  const { data: allLinks } = await supabase.from('topic_problems').select('problem_id, source, source_id')
  const linkedIds = new Set(allLinks.filter(l => l.problem_id).map(l => l.problem_id))
  const usedSourceIds = new Set(allLinks.map(l => `${l.source}:${l.source_id}`))

  const { data: unlinkedProblems } = await supabase.from('problems').select('*')
  const problemsToLink = unlinkedProblems.filter(p => !linkedIds.has(p.id))
  console.log(`📦 Found ${problemsToLink.length} unlinked problems in the database.`)

  // 2. Fetch roadmap topics
  const { data: topics } = await supabase.from('roadmap_topics').select('id, title, order_index')
  const topicByIdx = {}
  topics.forEach(t => topicByIdx[t.order_index] = t)

  // 3. CF Metadata
  console.log('🌐 Fetching CF metadata...')
  const cfApi = await fetchUrl('https://codeforces.com/api/problemset.problems')
  const cfData = JSON.parse(cfApi)
  const cfMetadata = {}
  if (cfData.status === 'OK') {
      cfData.result.problems.forEach(p => {
          cfMetadata[`${p.contestId}/${p.index}`] = p
      })
  }

  let count = 0
  for (const p of problemsToLink) {
    let source = 'codeforces'
    let sourceId = ''
    
    if (p.external_id && p.external_id.startsWith('cf-')) {
        sourceId = p.external_id.replace('cf-', '')
    } else if (p.external_id && p.external_id.startsWith('cses-')) {
        source = 'cses'
        sourceId = p.external_id.replace('cses-', '')
    } else if (p.cf_id) {
        sourceId = p.cf_id
    } else {
        continue // Skip unknown sources
    }

    if (usedSourceIds.has(`${source}:${sourceId}`)) continue

    // Find best topic
    const meta = cfMetadata[sourceId]
    let targetTopicIdx = -1

    if (meta && meta.tags) {
        // Find topic matching most tags
        for (const idx of Object.keys(TOPIC_MAP)) {
            const cfg = TOPIC_MAP[idx]
            if (cfg.tags.some(t => meta.tags.includes(t))) {
                targetTopicIdx = idx
                break // Take first match
            }
        }
    }

    // Fallback: search in title/description
    if (targetTopicIdx === -1) {
        if (p.title.toLowerCase().includes('sort')) targetTopicIdx = 5
        else if (p.title.toLowerCase().includes('string')) targetTopicIdx = 2
        else if (p.title.toLowerCase().includes('math')) targetTopicIdx = 15
        else if (p.title.toLowerCase().includes('graph')) targetTopicIdx = 20
        else if (p.title.toLowerCase().includes('dp') || p.description.toLowerCase().includes('dynamic programming')) targetTopicIdx = 25
    }

    // If still nothing, skip or put in Topic 1
    if (targetTopicIdx === -1) targetTopicIdx = 1

    const topic = topicByIdx[targetTopicIdx]
    if (!topic) continue

    const { error } = await supabase.from('topic_problems').insert({
        topic_id: topic.id,
        source,
        source_id: sourceId,
        title: p.title.replace('[CF] ', '').replace('[CSES] ', ''),
        url: source === 'codeforces' ? `https://codeforces.com/problemset/problem/${sourceId}` : `https://cses.fi/problemset/task/${sourceId}`,
        difficulty: p.difficulty.toLowerCase() === 'easy' ? 'easy' : p.difficulty.toLowerCase() === 'hard' ? 'hard' : 'medium',
        problem_id: p.id,
        cf_rating: meta ? meta.rating : null,
        tags: meta ? meta.tags : []
    })

    if (!error) {
        count++
        usedSourceIds.add(`${source}:${sourceId}`)
    }
  }

  console.log(`✅ Successfully linked ${count} more problems!`)
}

main().catch(console.error)
