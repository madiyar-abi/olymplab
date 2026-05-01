#!/usr/bin/env node
/**
 * Article Ingestion Script
 * Usage:
 *   node scripts/ingest_article.js <topicId> <url>
 *   node scripts/ingest_article.js 1 https://cp-algorithms.com/algebra/binary-search.html
 *
 * topicId: either a Supabase UUID or a numeric order_index (1-15)
 */

const { createClient } = require('@supabase/supabase-js')
const { JSDOM } = require('jsdom')
const { Readability } = require('@mozilla/readability')
const TurndownService = require('turndown')
const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
const envPath = path.resolve(__dirname, '../.env.local')
const envFile = fs.readFileSync(envPath, 'utf8')
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#\s]+)=(.*)$/)
  if (match) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
})

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const [,, topicId, articleUrl] = process.argv

if (!topicId || !articleUrl) {
  console.error('❌  Usage: node scripts/ingest_article.js <topicId> <url>')
  console.error('       topicId = Supabase UUID  OR  numeric order_index (1-15)')
  console.error('       url     = full article URL (https://...)')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isUUID(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OlympLab/1.0; +https://olymplab.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
      },
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location))
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} fetching ${url}`))
      }
      let data = ''
      res.setEncoding('utf8')
      res.on('data', chunk => { data += chunk })
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timed out')) })
  })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // 1. Resolve topic row
  console.log(`\n🔍 Looking up topic: "${topicId}"`)
  let query = supabase.from('roadmap_topics').select('id, title, order_index')

  if (isUUID(topicId)) {
    query = query.eq('id', topicId)
  } else if (/^\d+$/.test(topicId)) {
    query = query.eq('order_index', parseInt(topicId))
  } else {
    console.error('❌  topicId must be a UUID or a number (1-15)')
    process.exit(1)
  }

  const { data: rows, error: fetchErr } = await query.limit(1)

  if (fetchErr || !rows || rows.length === 0) {
    console.error('❌  Topic not found:', fetchErr?.message ?? 'no match')
    process.exit(1)
  }

  const topic = rows[0]
  console.log(`✅ Found topic: [${topic.order_index}] ${topic.title}`)

  // 2. Fetch HTML
  console.log(`\n🌐 Fetching: ${articleUrl}`)
  let html
  try {
    html = await fetchUrl(articleUrl)
    console.log(`   Downloaded ${(html.length / 1024).toFixed(1)} KB`)
  } catch (err) {
    console.error('❌  Failed to fetch URL:', err.message)
    process.exit(1)
  }

  // 3. Extract main content with Readability
  let doc
  try {
    doc = new JSDOM(html, { url: articleUrl })
  } catch (err) {
    console.error('❌  Failed to parse HTML:', err.message)
    process.exit(1)
  }

  const reader = new Readability(doc.window.document)
  const article = reader.parse()

  if (!article || !article.content) {
    console.error('❌  Readability could not extract article content from this page.')
    console.error('    Try a different URL or a more article-like page.')
    process.exit(1)
  }

  console.log(`\n📰 Extracted: "${article.title}"`)
  console.log(`   Content length: ${(article.content.length / 1024).toFixed(1)} KB`)

  // 4. Convert HTML → Markdown
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    fence: '```',
  })

  // ⚠️ Disable escaping — preserves LaTeX and code characters
  td.escape = (string) => string

  // ---------------------------------------------------------------------------
  // Dedent helper — removes common leading whitespace from all non-empty lines
  // ---------------------------------------------------------------------------
  function dedent(str) {
    const lines = str.split('\n')
    const nonEmpty = lines.filter(l => l.trim().length > 0)
    if (nonEmpty.length === 0) return str
    const minIndent = Math.min(...nonEmpty.map(l => l.match(/^(\s*)/)[1].length))
    const dedented = lines.map(l => l.slice(minIndent)).join('\n').trim()
    if (minIndent === 0) {
      return dedented
        .split('\n')
        .map(l => l.startsWith(' ') && !l.startsWith('  ') ? l.slice(1) : l)
        .join('\n')
    }
    return dedented
  }

  // ---------------------------------------------------------------------------
  // Table → GFM pipe-table rule
  // ---------------------------------------------------------------------------
  function cellText(cell) {
    // Collapse whitespace and escape pipe characters inside cells
    return cell.textContent.trim().replace(/\s+/g, ' ').replace(/\|/g, '\\|')
  }

  // Suppress default handling of inner table elements
  td.addRule('tableCell', {
    filter: ['th', 'td'],
    replacement: (content) => content,
  })
  td.addRule('tableRow', {
    filter: 'tr',
    replacement: (content) => content,
  })
  td.addRule('tableSection', {
    filter: ['thead', 'tbody', 'tfoot'],
    replacement: (content) => content,
  })

  td.addRule('table', {
    filter: 'table',
    replacement: (content, node) => {
      const allRows = Array.from(node.querySelectorAll('tr'))
      if (allRows.length === 0) return content

      const toRow = (tr) =>
        Array.from(tr.querySelectorAll('th, td')).map(cellText)

      // First row → header; rest → body
      const headerCells = toRow(allRows[0])
      if (headerCells.length === 0) return content

      const separator = headerCells.map(() => '---')
      const bodyRows  = allRows.slice(1).map(toRow)

      const fmt = (cells) => '| ' + cells.join(' | ') + ' |'
      const lines = [
        fmt(headerCells),
        fmt(separator),
        ...bodyRows.map(fmt),
      ]
      return '\n\n' + lines.join('\n') + '\n\n'
    },
  })

  // Handle <pre><code> blocks explicitly (metanit.com, many tutorial sites)
  td.addRule('fenced-code-block', {
    filter: (node) => node.nodeName === 'PRE',
    replacement: (content, node) => {
      const codeEl = node.querySelector('code')
      const raw = dedent(codeEl ? codeEl.textContent : node.textContent)
      if (!raw) return ''

      // Detect language from class names
      const cls = (node.className || '') + ' ' + (codeEl?.className || '')

      // metanit.com console output blocks
      if (node.className === 'consoletext' || node.parentNode?.className === 'console') {
        return `\n\n\`\`\`console\n${raw}\n\`\`\`\n\n`
      }

      // metanit brush:cpp, brush:python etc.
      const brushMatch = cls.match(/brush:(\w+)/)
      if (brushMatch) {
        return `\n\n\`\`\`${brushMatch[1]}\n${raw}\n\`\`\`\n\n`
      }

      // standard language-X classes
      const langMatch = cls.match(/language-(\w+)/)
      if (langMatch) {
        return `\n\n\`\`\`${langMatch[1]}\n${raw}\n\`\`\`\n\n`
      }

      // default: assume cpp for algorithm tutorial sites
      return `\n\n\`\`\`cpp\n${raw}\n\`\`\`\n\n`
    },
  })


  // Handle <code> inside <pre> (avoid double processing)
  td.addRule('code-in-pre', {
    filter: (node) => node.nodeName === 'CODE' && node.parentNode?.nodeName === 'PRE',
    replacement: (content) => content,
  })

  // MathJax <script> tags
  td.addRule('math-script', {
    filter: (node) =>
      node.nodeName === 'SCRIPT' &&
      (node.getAttribute('type') === 'math/tex' ||
        node.getAttribute('type') === 'math/tex; mode=display'),
    replacement: (content, node) => {
      const isDisplay = node.getAttribute('type')?.includes('display')
      return isDisplay ? `\n$$\n${content}\n$$\n` : `$${content}$`
    },
  })

  // Inline math spans
  td.addRule('math-inline', {
    filter: (node) =>
      node.nodeName === 'SPAN' &&
      (node.className.includes('math') || node.className.includes('katex')),
    replacement: (content) => `$${content}$`,
  })

  // Block math divs
  td.addRule('math-block', {
    filter: (node) =>
      node.nodeName === 'DIV' && node.className.includes('math'),
    replacement: (content) => `\n$$\n${content}\n$$\n`,
  })

  let markdown = td.turndown(article.content)

  // Clean up double-escaped backslashes
  markdown = markdown.replace(/\\\\/g, '\\')

  console.log(`   Markdown length: ${(markdown.length / 1024).toFixed(1)} KB`)

  // 5. Save to Supabase

  console.log(`\n💾 Saving to Supabase topic id=${topic.id}...`)
  const { error: updateErr } = await supabase
    .from('roadmap_topics')
    .update({ article_markdown: markdown })
    .eq('id', topic.id)

  if (updateErr) {
    console.error('❌  Supabase update failed:', updateErr.message)
    process.exit(1)
  }

  console.log(`\n✅ Success! Article "${article.title}" saved to topic [${topic.order_index}] ${topic.title}`)
  console.log(`   Preview the article at: http://localhost:3000/dashboard/learning/${topic.id}\n`)
}

main().catch(err => {
  console.error('❌  Unexpected error:', err)
  process.exit(1)
})
