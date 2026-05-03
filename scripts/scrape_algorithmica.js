#!/usr/bin/env node
/**
 * scrape_algorithmica.js
 */

'use strict'

const { createClient } = require('@supabase/supabase-js')
const { JSDOM }        = require('jsdom')
const { Readability }  = require('@mozilla/readability')
const TurndownService  = require('turndown')
const fs               = require('fs')
const path             = require('path')
const https            = require('https')
const http             = require('http')

// ─── Load .env.local ────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '../.env.local')
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const m = line.match(/^([^#\s]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TOPIC_URLS = {
  1: [],
  2: [
    'https://ru.algorithmica.org/cs/basic-structures/',
    'https://ru.algorithmica.org/cs/basic-structures/array/',
  ],
  3: [
    'https://ru.algorithmica.org/cs/complexity/',
    'https://ru.algorithmica.org/cs/complexity/asymptotic/',
  ],
  4: [
    'https://ru.algorithmica.org/cs/basic-structures/iterators/',
    'https://ru.algorithmica.org/cs/basic-structures/vector/',
  ],
  5: [
    'https://ru.algorithmica.org/cs/sorting/',
    'https://ru.algorithmica.org/cs/sorting/bubble/',
    'https://ru.algorithmica.org/cs/sorting/selection/',
    'https://ru.algorithmica.org/cs/sorting/insertion/',
  ],
  6: [
    'https://ru.algorithmica.org/cs/sorting/heapsort/',
  ],
  7: [
    'https://ru.algorithmica.org/cs/sorting/counting/',
    'https://ru.algorithmica.org/cs/sorting/radix/',
  ],
  8: [
    'https://ru.algorithmica.org/cs/basic-structures/heap/',
  ],
  9: [
    'https://ru.algorithmica.org/cs/range-queries/',
    'https://ru.algorithmica.org/cs/range-queries/prefix-sum/',
  ],
  10: [
    'https://ru.algorithmica.org/cs/interactive/',
    'https://ru.algorithmica.org/cs/interactive/binary-search/',
  ],
  11: [
    'https://ru.algorithmica.org/cs/interactive/answer-search/',
  ],
  12: [],
  13: [
    'https://ru.algorithmica.org/cs/sequences/',
    'https://ru.algorithmica.org/cs/sequences/compression/',
  ],
  14: [
    'https://ru.algorithmica.org/cs/arithmetic/',
    'https://ru.algorithmica.org/cs/arithmetic/bit-representation/',
    'https://ru.algorithmica.org/cs/set-structures/bitset/',
  ],
  15: [
    'https://ru.algorithmica.org/cs/modular/',
    'https://ru.algorithmica.org/cs/modular/euclid/',
    'https://ru.algorithmica.org/cs/modular/extended-euclid/',
    'https://ru.algorithmica.org/cs/modular/reciprocal/',
    'https://ru.algorithmica.org/cs/algebra/binpow/',
  ],
  16: [
    'https://ru.algorithmica.org/cs/factorization/',
    'https://ru.algorithmica.org/cs/factorization/eratosthenes/',
  ],
  17: [
    'https://ru.algorithmica.org/cs/programming/',
    'https://ru.algorithmica.org/cs/programming/stress-test/',
  ],
  18: [
    'https://ru.algorithmica.org/cs/tree-structures/',
    'https://ru.algorithmica.org/cs/tree-structures/stl-trees/',
  ],
  19: [
    'https://ru.algorithmica.org/cs/combinatorial-optimization/',
    'https://ru.algorithmica.org/cs/combinatorial-optimization/greedy/',
  ],
  20: [
    'https://ru.algorithmica.org/cs/graph-traversals/',
    'https://ru.algorithmica.org/cs/graph-traversals/storing-graphs/',
    'https://ru.algorithmica.org/cs/graph-traversals/dfs/',
    'https://ru.algorithmica.org/cs/graph-traversals/connectivity/',
  ],
  21: [
    'https://ru.algorithmica.org/cs/graph-traversals/bipartite/',
    'https://ru.algorithmica.org/cs/graph-traversals/cycle/',
    'https://ru.algorithmica.org/cs/graph-traversals/topological-sorting/',
  ],
  22: [
    'https://ru.algorithmica.org/cs/shortest-paths/',
    'https://ru.algorithmica.org/cs/shortest-paths/acyclic-paths/',
    'https://ru.algorithmica.org/cs/shortest-paths/bfs/',
    'https://ru.algorithmica.org/cs/shortest-paths/dijkstra/',
  ],
  23: [
    'https://ru.algorithmica.org/cs/set-structures/dsu/',
    'https://ru.algorithmica.org/cs/spanning-trees/',
    'https://ru.algorithmica.org/cs/spanning-trees/safe-edge/',
    'https://ru.algorithmica.org/cs/spanning-trees/kruskal/',
    'https://ru.algorithmica.org/cs/spanning-trees/prim/',
    'https://ru.algorithmica.org/cs/spanning-trees/boruvka/',
  ],
  24: [
    'https://ru.algorithmica.org/cs/trees/',
    'https://ru.algorithmica.org/cs/trees/tree-queries/',
    'https://ru.algorithmica.org/cs/trees/lca-rmq/',
    'https://ru.algorithmica.org/cs/trees/binary-lifting/',
  ],
  25: [
    'https://ru.algorithmica.org/cs/general-dynamic/',
    'https://ru.algorithmica.org/cs/general-dynamic/memoization/',
    'https://ru.algorithmica.org/cs/general-dynamic/segments/',
  ],
  26: [
    'https://ru.algorithmica.org/cs/games/',
    'https://ru.algorithmica.org/cs/games/nim/',
  ],
  27: [
    'https://ru.algorithmica.org/cs/string-searching/',
    'https://ru.algorithmica.org/cs/string-searching/prefix-function/',
    'https://ru.algorithmica.org/cs/string-searching/z-function/',
    'https://ru.algorithmica.org/cs/string-searching/manacher/',
  ],
  28: [
    'https://ru.algorithmica.org/cs/hashing/',
    'https://ru.algorithmica.org/cs/hashing/polynomial/',
    'https://ru.algorithmica.org/cs/hashing/collision/',
    'https://ru.algorithmica.org/cs/hashing/isomorphism/',
  ],
  29: [
    'https://ru.algorithmica.org/cs/string-structures/',
    'https://ru.algorithmica.org/cs/string-structures/trie/',
    'https://ru.algorithmica.org/cs/string-structures/aho-corasick/',
    'https://ru.algorithmica.org/cs/string-structures/palindromic-tree/',
    'https://ru.algorithmica.org/cs/string-structures/suffix-array/',
  ],
  30: [
    'https://ru.algorithmica.org/cs/range-queries/fenwick/',
    'https://ru.algorithmica.org/cs/segment-tree/',
    'https://ru.algorithmica.org/cs/segment-tree/pointers/',
    'https://ru.algorithmica.org/cs/segment-tree/lazy-propagation/',
    'https://ru.algorithmica.org/cs/segment-tree/lazy-initialization/',
  ],
  31: [
    'https://ru.algorithmica.org/cs/range-queries/sparse-table/',
    'https://ru.algorithmica.org/cs/range-queries/sqrt-structures/',
  ],
  32: [
    'https://ru.algorithmica.org/cs/geometry-basic/',
    'https://ru.algorithmica.org/cs/geometry-basic/vectors/',
    'https://ru.algorithmica.org/cs/geometry-basic/products/',
    'https://ru.algorithmica.org/cs/geometry-basic/segments/',
    'https://ru.algorithmica.org/cs/geometry-basic/polygons/',
  ],
  33: [
    'https://ru.algorithmica.org/cs/convex-hulls/',
    'https://ru.algorithmica.org/cs/convex-hulls/jarvis/',
    'https://ru.algorithmica.org/cs/convex-hulls/graham/',
    'https://ru.algorithmica.org/cs/convex-hulls/hull-applications/',
    'https://ru.algorithmica.org/cs/convex-hulls/chan/',
    'https://ru.algorithmica.org/cs/convex-hulls/envelope/',
  ],
  34: [
    'https://ru.algorithmica.org/cs/algebra/',
    'https://ru.algorithmica.org/cs/algebra/matrix/',
    'https://ru.algorithmica.org/cs/algebra/matmul/',
    'https://ru.algorithmica.org/cs/algebra/gauss/',
  ],
  35: [
    'https://ru.algorithmica.org/cs/algebra/polynomials/',
    'https://ru.algorithmica.org/cs/algebra/interpolation/',
    'https://ru.algorithmica.org/cs/algebra/karatsuba/',
    'https://ru.algorithmica.org/cs/algebra/fft/',
  ],
  36: [
    'https://ru.algorithmica.org/cs/graph-traversals/euler-cycle/',
    'https://ru.algorithmica.org/cs/graph-traversals/bridges/',
    'https://ru.algorithmica.org/cs/graph-traversals/scc/',
    'https://ru.algorithmica.org/cs/graph-traversals/2-sat/',
  ],
  37: [
    'https://ru.algorithmica.org/cs/matching/',
    'https://ru.algorithmica.org/cs/matching/berge/',
    'https://ru.algorithmica.org/cs/matching/kuhn/',
    'https://ru.algorithmica.org/cs/matching/matching-problems/',
    'https://ru.algorithmica.org/cs/matching/hall/',
  ],
  38: [
    'https://ru.algorithmica.org/cs/flows/',
    'https://ru.algorithmica.org/cs/flows/mincost-maxflow/',
  ],
  39: [
    'https://ru.algorithmica.org/cs/decomposition/',
    'https://ru.algorithmica.org/cs/decomposition/scanline/',
    'https://ru.algorithmica.org/cs/decomposition/mitm/',
    'https://ru.algorithmica.org/cs/decomposition/sqrt-heuristics/',
    'https://ru.algorithmica.org/cs/decomposition/mo/',
  ],
  40: [
    'https://ru.algorithmica.org/cs/tree-structures/treap/',
    'https://ru.algorithmica.org/cs/tree-structures/implicit/',
    'https://ru.algorithmica.org/cs/persistent/',
    'https://ru.algorithmica.org/cs/persistent/persistent-array/',
    'https://ru.algorithmica.org/cs/persistent/path-copying/',
    'https://ru.algorithmica.org/cs/persistent/persistent-segtree/',
    'https://ru.algorithmica.org/cs/persistent/persistent-treap/',
    'https://ru.algorithmica.org/cs/decomposition/rollback/',
  ],
  41: [
    'https://ru.algorithmica.org/cs/layer-optimizations/',
    'https://ru.algorithmica.org/cs/layer-optimizations/divide-and-conquer/',
    'https://ru.algorithmica.org/cs/layer-optimizations/knuth/',
    'https://ru.algorithmica.org/cs/layer-optimizations/convex-hull-trick/',
    'https://ru.algorithmica.org/cs/layer-optimizations/lagrange/',
  ],
  42: [
    'https://ru.algorithmica.org/cs/factorization/pollard/',
    'https://ru.algorithmica.org/cs/arithmetic/simd/',
    'https://ru.algorithmica.org/cs/numerical/',
    'https://ru.algorithmica.org/cs/numerical/newton/',
    'https://ru.algorithmica.org/cs/numerical/monte-carlo/',
    'https://ru.algorithmica.org/cs/combinatorial-optimization/matroid/',
    'https://ru.algorithmica.org/cs/combinatorial-optimization/annealing/',
  ],
  43: [
    'https://ru.algorithmica.org/cs/spanning-trees/dcp/',
    'https://ru.algorithmica.org/cs/trees/centroid/',
    'https://ru.algorithmica.org/cs/trees/heavy-light/',
    'https://ru.algorithmica.org/cs/programming/bayans/',
  ],
}

function fetchUrl(url, redirects = 0) {
  if (redirects > 5) return Promise.reject(new Error('Too many redirects'))
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OlympLab/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru,en;q=0.5',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = new URL(res.headers.location, url).href
        return resolve(fetchUrl(next, redirects + 1))
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      let data = ''
      res.setEncoding('utf8')
      res.on('data', c => { data += c })
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout: ' + url)) })
  })
}

function buildTurndown() {
  const td = new TurndownService({
    headingStyle:     'atx',
    codeBlockStyle:   'fenced',
    bulletListMarker: '-',
    fence:            '```',
  })
  td.escape = s => s

  function dedent(str) {
    const lines    = str.split('\n')
    const nonEmpty = lines.filter(l => l.trim())
    if (!nonEmpty.length) return str
    const min = Math.min(...nonEmpty.map(l => l.match(/^(\s*)/)[1].length))
    return lines.map(l => l.slice(min)).join('\n').trim()
  }

  const cell = el => el.textContent.trim().replace(/\s+/g, ' ').replace(/\|/g, '\\|')
  td.addRule('tableCell',    { filter: ['th','td'],            replacement: c => c })
  td.addRule('tableRow',     { filter: 'tr',                   replacement: c => c })
  td.addRule('tableSection', { filter: ['thead','tbody','tfoot'], replacement: c => c })
  td.addRule('table', {
    filter: 'table',
    replacement: (_, node) => {
      const rows = Array.from(node.querySelectorAll('tr'))
      if (!rows.length) return ''
      const toRow = tr => Array.from(tr.querySelectorAll('th,td')).map(cell)
      const header = toRow(rows[0])
      if (!header.length) return ''
      const sep  = header.map(() => '---')
      const body = rows.slice(1).map(toRow)
      const fmt  = cells => '| ' + cells.join(' | ') + ' |'
      return '\n\n' + [fmt(header), fmt(sep), ...body.map(fmt)].join('\n') + '\n\n'
    },
  })

  td.addRule('fenced-code-block', {
    filter: node => node.nodeName === 'PRE',
    replacement: (_, node) => {
      const codeEl = node.querySelector('code')
      const raw    = dedent(codeEl ? codeEl.textContent : node.textContent)
      if (!raw) return ''
      const cls   = (node.className || '') + ' ' + (codeEl?.className || '')
      const brush = cls.match(/brush:(\w+)/)
      const lang  = cls.match(/language-(\w+)/)
      const tag   = brush ? brush[1] : lang ? lang[1] : 'cpp'
      return `\n\n\`\`\`${tag}\n${raw}\n\`\`\`\n\n`
    },
  })
  td.addRule('code-in-pre', {
    filter: node => node.nodeName === 'CODE' && node.parentNode?.nodeName === 'PRE',
    replacement: c => c,
  })

  td.addRule('math-script', {
    filter: node =>
      node.nodeName === 'SCRIPT' &&
      (node.getAttribute('type') === 'math/tex' ||
       node.getAttribute('type') === 'math/tex; mode=display'),
    replacement: (c, node) =>
      node.getAttribute('type')?.includes('display') ? `\n$$\n${c}\n$$\n` : `$${c}$`,
  })
  td.addRule('math-inline', {
    filter: node =>
      node.nodeName === 'SPAN' &&
      (node.className.includes('math') || node.className.includes('katex')),
    replacement: c => `$${c}$`,
  })
  td.addRule('math-block', {
    filter: node => node.nodeName === 'DIV' && node.className.includes('math'),
    replacement: c => `\n$$\n${c}\n$$\n`,
  })

  return td
}

async function urlToMarkdown(url, td) {
  const html    = await fetchUrl(url)
  const dom     = new JSDOM(html, { url })
  const doc     = dom.window.document

  const rawTitle = doc.querySelector('title')?.textContent || ''
  const cleanTitle = rawTitle.replace(' - Алгоритмика', '').trim()

  // Pre-clean: Remove anchor links [#] next to headers
  doc.querySelectorAll('a.header-anchor, .header-anchor').forEach(el => el.remove())
  
  // Remove author/metadata if present
  doc.querySelectorAll('.authors, .metadata, .page-meta, .nav-links, .footer, .header, .sidebar, .comments').forEach(el => el.remove())

  // Specific for Algorithmica: remove top bar icons, bottom nav, and sidebar lists
  doc.querySelectorAll('img[src*="/icons/"], img[src*="mc.yandex.ru"], .prev-next, a[href^="../"], .prev-next-links, .book-summary, .book-header').forEach(el => el.remove())

  // Remove any UL that looks like a sidebar (large number of links)
  doc.querySelectorAll('ul').forEach(ul => {
      const links = ul.querySelectorAll('a').length
      const items = ul.querySelectorAll('li').length
      if (items > 15 || (items > 5 && links / items > 0.8)) {
          ul.remove()
      }
  })

  // Remove elements containing arrows (navigation)
  doc.querySelectorAll('p, div, a').forEach(el => {
    const text = el.textContent.trim()
    if (text.startsWith('←') || text.endsWith('→') || text.includes('←') || text.includes('→')) {
      if (text.length < 100 && (el.querySelector('a') || el.tagName === 'A')) {
        el.remove()
      }
    }
  })

  // Remove breadcrumbs and redundant title paragraphs
  doc.querySelectorAll('p, div, span').forEach(el => {
    const text = el.textContent.trim()
    const textLower = text.toLowerCase()
    
    if (text.includes(' / ') && text.length < 50 && el.querySelectorAll('a').length >= 2) {
      el.remove()
    }
  })

  // Remove redundant titles BEFORE Readability
  doc.querySelectorAll('h1, h2, h3, p, div').forEach(el => {
      const text = el.textContent.trim()
      if (text === rawTitle || text === cleanTitle || text.toLowerCase() === (cleanTitle.toLowerCase() + ' - алгоритмика')) {
          el.remove()
      }
  })

  doc.querySelectorAll('p, div, span').forEach(el => {
    const text = el.textContent.toLowerCase()
    if (text.includes('авторы ') || text.includes('автор ') || text.includes('authors ') || text.includes('author ')) {
      if (el.textContent.length < 100) {
        el.remove()
      }
    }
  })

  const reader  = new Readability(doc)
  const article = reader.parse()
  if (!article?.content) throw new Error(`Readability failed for ${url}`)

  let md = td.turndown(article.content)
  
  md = md.replace(/\\\\/g, '\\')
  md = md.replace(/\[\\?#\]\(#.*?\)/g, '')
  md = md.replace(/\[\\?#\]\(http.*?\)/g, '')
  
  // Post-process markdown to remove navigation artifacts
  md = md.split('\n').filter(line => {
      const trimmed = line.trim()
      const lower = trimmed.toLowerCase()
      // Skip lines that are just navigation arrows or breadcrumb-like
      if (trimmed.startsWith('[←') || trimmed.endsWith('→]') || (trimmed.includes('←') && trimmed.includes('→'))) return false
      if (trimmed.includes('←') || trimmed.includes('→')) return false
      if (lower.includes('алгоритмика') && trimmed.length < 50) return false
      if (trimmed === 'Последовательности') return false
      if (trimmed === 'CS') return false
      if (trimmed === '/' || trimmed === '|') return false
      // Breadcrumb pattern: [Text](url) / [Text](url)
      if (trimmed.includes('](') && trimmed.includes(' / ') && trimmed.length < 100) return false
      return true
  }).join('\n')

  md = md.replace(/\n{3,}/g, '\n\n')
  
  // Clean up duplicate titles from the beginning
  md = md.trim()
  const lines = md.split('\n')
  if (lines.length > 0 && lines[0].startsWith('#')) {
      const firstHeading = lines[0].replace(/^#+\s*/, '').trim()
      if (firstHeading.toLowerCase() === cleanTitle.toLowerCase() || 
          cleanTitle.toLowerCase().includes(firstHeading.toLowerCase()) || 
          firstHeading.toLowerCase().includes(cleanTitle.toLowerCase())) {
          md = lines.slice(1).join('\n').trim()
      }
  }

  return `## ${cleanTitle}\n\n${md.trim()}`
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  const [,, fromArg, toArg] = process.argv
  const fromIdx = fromArg ? parseInt(fromArg) : 1
  const toIdx   = toArg   ? parseInt(toArg)   : 43

  const { data: allTopics, error } = await supabase
    .from('roadmap_topics')
    .select('id, title, order_index')
    .order('order_index')

  if (error) {
    console.error('❌ Could not load topics:', error.message)
    process.exit(1)
  }

  const topicMap = {}
  allTopics.forEach(t => { topicMap[t.order_index] = t })

  const td = buildTurndown()

  let success = 0
  let skipped = 0
  let failed  = 0

  for (let idx = fromIdx; idx <= toIdx; idx++) {
    const urls  = TOPIC_URLS[idx]
    const topic = topicMap[idx]

    if (!topic) {
      skipped++
      continue
    }

    if (!urls || urls.length === 0) {
      skipped++
      continue
    }

    console.log(`\n📖 [${idx}/${toIdx}] ${topic.title}`)
    const parts = []
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      try {
        process.stdout.write(`   → ${url.replace('https://ru.algorithmica.org', '')} ... `)
        let md = await urlToMarkdown(url, td)
        
        // If it's the first page and it starts with the topic title, we might want to keep it or remove it
        // since the UI already shows the title.
        const titleMatch = md.match(/^##\s+(.*)\n/)
        if (titleMatch) {
            const heading = titleMatch[1].trim()
            if (heading.toLowerCase() === topic.title.toLowerCase() || heading === 'Введение' || heading === 'Оглавление') {
                md = md.replace(/^##.*\n/, '').trim()
            }
        }

        // Additional cleanup for leftover links with arrows
        md = md.replace(/\[[^\]]*←[^\]]*\]\([^\)]*\)/g, '')
        md = md.replace(/\[[^\]]*→[^\]]*\]\([^\)]*\)/g, '')

        if (md.trim()) {
            parts.push(md.trim())
            console.log(`✓ (${(md.length / 1024).toFixed(1)}KB)`)
        } else {
            console.log('skipped (empty)')
        }
        await sleep(400)
      } catch (err) {
        console.log(`✗ ${err.message}`)
      }
    }

    if (parts.length === 0) {
      failed++
      continue
    }

    const combined = parts.join('\n\n---\n\n')
    const { error: upErr } = await supabase
      .from('roadmap_topics')
      .update({ article_markdown: combined })
      .eq('id', topic.id)

    if (upErr) {
      failed++
    } else {
      success++
    }

    await sleep(300)
  }

  console.log('\n' + '═'.repeat(50))
  console.log(`✅ Success : ${success}`)
  console.log(`⏭️  Skipped : ${skipped}`)
  console.log(`❌ Failed  : ${failed}`)
  console.log('═'.repeat(50) + '\n')
}

main().catch(err => {
  console.error('❌ Fatal:', err)
  process.exit(1)
})
