#!/usr/bin/env node
/**
 * seed_curated.js
 * ───────────────
 * Inserts hand-picked problems from CSES and AtCoder Educational DP
 * into the `topic_problems` table.
 *
 * These platforms have no public API, so the list is maintained manually.
 *
 * Usage:
 *   node scripts/seed_curated.js              # insert/update all
 *   node scripts/seed_curated.js cses         # only CSES
 *   node scripts/seed_curated.js atcoder      # only AtCoder DP
 */

'use strict'

const { createClient } = require('@supabase/supabase-js')
const fs   = require('fs')
const path = require('path')

// ─── Load .env.local ────────────────────────────────────────────────────────
fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8')
  .split('\n')
  .forEach(line => {
    const m = line.match(/^([^#\s]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
  })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─── Curated problem lists ───────────────────────────────────────────────────
// topic_order_index maps to the order_index column in roadmap_topics.
// layer: 'intro' | 'core' | 'mixed'
// difficulty: 'easy' | 'medium' | 'hard'

const CSES = [
  // ── Sorting and searching (topic 5: Простые сортировки) ──────────────────
  { topic: 5,  source_id: '1621', title: 'Distinct Numbers',           difficulty: 'easy',   layer: 'intro' },
  { topic: 5,  source_id: '1084', title: 'Apartments',                 difficulty: 'easy',   layer: 'intro' },
  { topic: 5,  source_id: '1090', title: 'Ferris Wheel',               difficulty: 'easy',   layer: 'intro' },
  { topic: 5,  source_id: '1091', title: 'Concert Tickets',            difficulty: 'medium', layer: 'core'  },
  { topic: 5,  source_id: '1619', title: 'Restaurant Customers',       difficulty: 'medium', layer: 'core'  },
  { topic: 5,  source_id: '1620', title: 'Movie Festival',             difficulty: 'medium', layer: 'core'  },

  // ── Binary Search (topic 10) ──────────────────────────────────────────────
  { topic: 10, source_id: '1085', title: 'Array Division',             difficulty: 'easy',   layer: 'intro' },
  { topic: 10, source_id: '1086', title: 'Factory Machines',           difficulty: 'medium', layer: 'core'  },
  { topic: 10, source_id: '1668', title: 'Missing Coin Sum',           difficulty: 'easy',   layer: 'intro' },

  // ── Prefix sums (topic 9) ─────────────────────────────────────────────────
  { topic: 9,  source_id: '1646', title: 'Static Range Sum Queries',   difficulty: 'easy',   layer: 'intro' },
  { topic: 9,  source_id: '1648', title: 'Dynamic Range Sum Queries',  difficulty: 'medium', layer: 'core'  },
  { topic: 9,  source_id: '1649', title: 'Static Range Minimum Queries', difficulty: 'medium', layer: 'core' },
  { topic: 9,  source_id: '1650', title: 'Dynamic Range Minimum Queries', difficulty: 'hard', layer: 'core' },

  // ── Graph traversals (topic 20) ───────────────────────────────────────────
  { topic: 20, source_id: '1192', title: 'Counting Rooms',             difficulty: 'easy',   layer: 'intro' },
  { topic: 20, source_id: '1193', title: 'Labyrinth',                  difficulty: 'easy',   layer: 'intro' },
  { topic: 20, source_id: '1666', title: 'Building Roads',             difficulty: 'easy',   layer: 'core'  },
  { topic: 20, source_id: '1668', title: 'Message Route',              difficulty: 'medium', layer: 'core'  },
  { topic: 20, source_id: '1669', title: 'Building Teams',             difficulty: 'medium', layer: 'core'  },
  { topic: 20, source_id: '1671', title: 'Round Trip',                 difficulty: 'medium', layer: 'core'  },
  { topic: 20, source_id: '1678', title: 'Monsters',                   difficulty: 'medium', layer: 'mixed' },

  // ── Shortest paths (topic 22) ─────────────────────────────────────────────
  { topic: 22, source_id: '1671', title: 'Shortest Routes I',          difficulty: 'easy',   layer: 'intro' },
  { topic: 22, source_id: '1672', title: 'Shortest Routes II',         difficulty: 'medium', layer: 'core'  },
  { topic: 22, source_id: '1673', title: 'High Score',                 difficulty: 'medium', layer: 'core'  },
  { topic: 22, source_id: '1174', title: 'Flight Discount',            difficulty: 'hard',   layer: 'mixed' },

  // ── DSU (topic 23) ────────────────────────────────────────────────────────
  { topic: 23, source_id: '1676', title: 'Road Reparation',            difficulty: 'easy',   layer: 'intro' },
  { topic: 23, source_id: '1679', title: 'Road Construction',          difficulty: 'medium', layer: 'core'  },
  { topic: 23, source_id: '1683', title: 'Planets and Kingdoms',       difficulty: 'medium', layer: 'core'  },

  // ── Trees (topic 24) ──────────────────────────────────────────────────────
  { topic: 24, source_id: '1674', title: 'Tree Distances I',           difficulty: 'medium', layer: 'core'  },
  { topic: 24, source_id: '1675', title: 'Tree Distances II',          difficulty: 'hard',   layer: 'core'  },
  { topic: 24, source_id: '1688', title: 'Path Queries',               difficulty: 'hard',   layer: 'mixed' },

  // ── Dynamic Programming (topic 25) ───────────────────────────────────────
  { topic: 25, source_id: '1633', title: 'Dice Combinations',          difficulty: 'easy',   layer: 'intro' },
  { topic: 25, source_id: '1634', title: 'Minimizing Coins',           difficulty: 'easy',   layer: 'intro' },
  { topic: 25, source_id: '1635', title: 'Coin Combinations I',        difficulty: 'easy',   layer: 'core'  },
  { topic: 25, source_id: '1636', title: 'Coin Combinations II',       difficulty: 'medium', layer: 'core'  },
  { topic: 25, source_id: '1637', title: 'Removing Digits',            difficulty: 'medium', layer: 'core'  },
  { topic: 25, source_id: '1638', title: 'Grid Paths',                 difficulty: 'medium', layer: 'core'  },
  { topic: 25, source_id: '1639', title: 'Book Shop',                  difficulty: 'medium', layer: 'core'  },
  { topic: 25, source_id: '1640', title: 'Array Description',          difficulty: 'hard',   layer: 'core'  },
  { topic: 25, source_id: '1641', title: 'Counting Towers',            difficulty: 'hard',   layer: 'mixed' },
  { topic: 25, source_id: '1745', title: 'Edit Distance',              difficulty: 'medium', layer: 'core'  },

  // ── Strings (topic 27) ───────────────────────────────────────────────────
  { topic: 27, source_id: '1731', title: 'Word Combinations',          difficulty: 'medium', layer: 'core'  },
  { topic: 27, source_id: '1753', title: 'String Matching',            difficulty: 'easy',   layer: 'intro' },
  { topic: 27, source_id: '1732', title: 'Finding Borders',            difficulty: 'medium', layer: 'core'  },
  { topic: 27, source_id: '1733', title: 'Finding Periods',            difficulty: 'medium', layer: 'core'  },

  // ── Range queries / Segment tree (topic 30) ───────────────────────────────
  { topic: 30, source_id: '1648', title: 'Dynamic Range Sum Queries',  difficulty: 'easy',   layer: 'intro' },
  { topic: 30, source_id: '1649', title: 'Dynamic Range Minimum Queries', difficulty: 'medium', layer: 'core' },
  { topic: 30, source_id: '1650', title: 'Dynamic Range Minimum Queries II', difficulty: 'hard', layer: 'core' },

  // ── Geometry (topic 32) ──────────────────────────────────────────────────
  { topic: 32, source_id: '2189', title: 'Point Location Test',        difficulty: 'easy',   layer: 'intro' },
  { topic: 32, source_id: '2190', title: 'Line Segment Intersection',  difficulty: 'medium', layer: 'core'  },
  { topic: 32, source_id: '2191', title: 'Polygon Area',               difficulty: 'easy',   layer: 'intro' },
  { topic: 32, source_id: '2192', title: 'Point in Polygon',           difficulty: 'medium', layer: 'core'  },
  { topic: 32, source_id: '2193', title: 'Polygon Lattice Points',     difficulty: 'medium', layer: 'core'  },
  { topic: 32, source_id: '2194', title: 'Minimum Euclidean Distance', difficulty: 'hard',   layer: 'mixed' },
  { topic: 32, source_id: '2195', title: 'Convex Hull',                difficulty: 'hard',   layer: 'core'  },

  // ── Matching (topic 37) ──────────────────────────────────────────────────
  { topic: 37, source_id: '1696', title: 'School Dance',               difficulty: 'medium', layer: 'intro' },
  { topic: 37, source_id: '1694', title: 'Download Speed',             difficulty: 'medium', layer: 'core'  },
]

// ─── AtCoder Educational DP (topic 25 — Динамическое программирование) ───────
const ATCODER_DP = [
  { letter: 'A', title: 'Frog 1',             difficulty: 'easy',   layer: 'intro' },
  { letter: 'B', title: 'Frog 2',             difficulty: 'easy',   layer: 'intro' },
  { letter: 'C', title: 'Vacation',           difficulty: 'easy',   layer: 'intro' },
  { letter: 'D', title: 'Knapsack 1',         difficulty: 'medium', layer: 'core'  },
  { letter: 'E', title: 'Knapsack 2',         difficulty: 'medium', layer: 'core'  },
  { letter: 'F', title: 'LCS',                difficulty: 'medium', layer: 'core'  },
  { letter: 'G', title: 'Longest Path',       difficulty: 'medium', layer: 'core'  },
  { letter: 'H', title: 'Grid 1',             difficulty: 'medium', layer: 'core'  },
  { letter: 'I', title: 'Coins',              difficulty: 'hard',   layer: 'core'  },
  { letter: 'J', title: 'Stones',             difficulty: 'hard',   layer: 'mixed' },
  { letter: 'K', title: 'Stones (interval)',  difficulty: 'hard',   layer: 'mixed' },
  { letter: 'L', title: 'Deque',              difficulty: 'hard',   layer: 'mixed' },
  { letter: 'M', title: 'Candies',            difficulty: 'hard',   layer: 'core'  },
  { letter: 'N', title: 'Slimes',             difficulty: 'hard',   layer: 'core'  },
  { letter: 'O', title: 'Matching',           difficulty: 'hard',   layer: 'mixed' },
  { letter: 'P', title: 'Independent Set',    difficulty: 'hard',   layer: 'mixed' },
  { letter: 'Q', title: 'Flowers',            difficulty: 'hard',   layer: 'mixed' },
  { letter: 'R', title: 'Walk',               difficulty: 'hard',   layer: 'mixed' },
  { letter: 'S', title: 'Digit Sum',          difficulty: 'hard',   layer: 'mixed' },
  { letter: 'T', title: 'Permutation',        difficulty: 'hard',   layer: 'mixed' },
  { letter: 'U', title: 'Grouping',           difficulty: 'hard',   layer: 'mixed' },
  { letter: 'V', title: 'Subtree',            difficulty: 'hard',   layer: 'mixed' },
  { letter: 'W', title: 'Intervals',          difficulty: 'hard',   layer: 'mixed' },
  { letter: 'X', title: 'Tower',              difficulty: 'hard',   layer: 'mixed' },
  { letter: 'Y', title: 'Grid 2',             difficulty: 'hard',   layer: 'mixed' },
  { letter: 'Z', title: 'Frog 3',             difficulty: 'hard',   layer: 'mixed' },
]

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const [,, filterSource] = process.argv

  // Load topic rows
  const { data: topicRows, error } = await supabase
    .from('roadmap_topics')
    .select('id, order_index')
  if (error) { console.error('❌ Topics:', error.message); process.exit(1) }

  const topicById = {}
  topicRows.forEach(t => { topicById[t.order_index] = t })

  let total = 0

  // ── CSES ──────────────────────────────────────────────────────────────────
  if (!filterSource || filterSource === 'cses') {
    console.log('\n📘 Seeding CSES problems...')
    for (const p of CSES) {
      const topic = topicById[p.topic]
      if (!topic) { console.log(`  ⚠️  No topic for order_index=${p.topic}`); continue }

      const { error: err } = await supabase
        .from('topic_problems')
        .upsert({
          topic_id:   topic.id,
          source:     'cses',
          source_id:  p.source_id,
          title:      p.title,
          url:        `https://cses.fi/problemset/task/${p.source_id}`,
          cf_rating:  null,
          difficulty: p.difficulty,
          layer:      p.layer,
          tags:       [],
        }, { onConflict: 'source,source_id' })

      if (err) console.log(`  ⚠️  ${p.title}: ${err.message}`)
      else { process.stdout.write('.'); total++ }
    }
    console.log(`\n   ✅ ${CSES.length} CSES problems seeded`)
  }

  // ── AtCoder Educational DP ────────────────────────────────────────────────
  if (!filterSource || filterSource === 'atcoder') {
    console.log('\n🟧 Seeding AtCoder Educational DP...')
    const dpTopic = topicById[25]
    if (!dpTopic) {
      console.log('  ⚠️  No topic with order_index=25 (DP)')
    } else {
      for (const p of ATCODER_DP) {
        const sourceId = `dp-${p.letter.toLowerCase()}`
        const url      = `https://atcoder.jp/contests/dp/tasks/dp_${p.letter.toLowerCase()}`

        const { error: err } = await supabase
          .from('topic_problems')
          .upsert({
            topic_id:   dpTopic.id,
            source:     'atcoder',
            source_id:  sourceId,
            title:      `${p.letter}. ${p.title}`,
            url,
            cf_rating:  null,
            difficulty: p.difficulty,
            layer:      p.layer,
            tags:       ['dp'],
          }, { onConflict: 'source,source_id' })

        if (err) console.log(`  ⚠️  ${p.title}: ${err.message}`)
        else { process.stdout.write('.'); total++ }
      }
      console.log(`\n   ✅ ${ATCODER_DP.length} AtCoder DP problems seeded`)
    }
  }

  console.log(`\n✅ Total upserted: ${total}\n`)
}

main().catch(err => {
  console.error('❌ Fatal:', err)
  process.exit(1)
})
