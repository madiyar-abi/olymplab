import { createClient } from '@supabase/supabase-js'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import * as fs from 'fs'
import * as path from 'path'
import TurndownService from 'turndown'
import { JSDOM } from 'jsdom'

puppeteer.use(StealthPlugin())

// --- Environment Setup ---
const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s]+)=(.*)$/)
    if (match) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
  })
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
})

turndownService.addRule('math-protect', {
  filter: function (node) {
    return node.nodeName === 'SPAN' && node.classList.contains('math-protect')
  },
  replacement: function (content, node) {
    return '$$$' + node.textContent + '$$$'
  }
})

turndownService.addRule('tex-span', {
  filter: function (node) {
    return node.nodeName === 'SPAN' && node.classList.contains('tex-span')
  },
  replacement: function (content, node) {
    return '$$$' + node.textContent + '$$$'
  }
})

turndownService.addRule('tex-equation', {
  filter: function (node) {
    return (node as Element).classList && (node as Element).classList.contains('tex-equation')
  },
  replacement: function (content, node) {
    return '\n\n$$' + node.textContent + '$$\n\n'
  }
})

async function scrapeProblemClean(contestId: string, index: string) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    try {
        const page = await browser.newPage()
        
        // BLOCK MathJax and other heavy assets to keep DOM clean
        await page.setRequestInterception(true)
        page.on('request', (request) => {
            const url = request.url()
            if (url.includes('mathjax') || url.includes('analytics') || url.endsWith('.png') || url.endsWith('.jpg')) {
                request.abort()
            } else {
                request.continue()
            }
        })

        const url = `https://codeforces.com/contest/${contestId}/problem/${index}`
        console.log(`  [Puppeteer] Fetching ${url}...`)
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        
        // Wait for the statement container
        await page.waitForSelector('.problem-statement', { timeout: 10000 })
        
        const data = await page.evaluate(() => {
            const ps = document.querySelector('.problem-statement')
            if (!ps) return null

            // 1. Title & Limits
            const title = ps.querySelector('.header .title')?.textContent?.trim() || ''
            const timeLimit = ps.querySelector('.time-limit')?.textContent?.replace('time limit per test', '').trim() || ''
            const memoryLimit = ps.querySelector('.memory-limit')?.textContent?.replace('memory limit per test', '').trim() || ''

            // 2. Sample I/O
            const sampleInput = ps.querySelector('.sample-test .input pre')?.textContent?.trim() || ''
            const sampleOutput = ps.querySelector('.sample-test .output pre')?.textContent?.trim() || ''

            // 3. Description HTML
            const header = ps.querySelector('.header')
            const samples = ps.querySelector('.sample-tests')
            if (header) header.remove()
            if (samples) samples.remove()

            // Remove MathJax Previews if they got injected
            ps.querySelectorAll('.MathJax_Preview').forEach(p => p.remove())
            ps.querySelectorAll('.MathJax').forEach(p => p.remove())

            // Protect $$$ math by wrapping in <span class="math-protect">
            const walker = document.createTreeWalker(ps, NodeFilter.SHOW_TEXT, null)
            const nodes = []
            let node
            while (node = walker.nextNode()) nodes.push(node)
            
            nodes.forEach(n => {
                if (n.nodeValue && n.nodeValue.includes('$$$')) {
                    const span = document.createElement('span')
                    const parts = n.nodeValue.split('$$$')
                    for (let i=0; i<parts.length; i++) {
                        if (i % 2 === 1) { // It's math
                            const mathSpan = document.createElement('span')
                            mathSpan.className = 'math-protect'
                            mathSpan.textContent = parts[i]
                            span.appendChild(mathSpan)
                        } else {
                            span.appendChild(document.createTextNode(parts[i]))
                        }
                    }
                    n.parentNode?.replaceChild(span, n)
                }
            })

            return {
                title,
                timeLimit,
                memoryLimit,
                sampleInput,
                sampleOutput,
                html: ps.innerHTML
            }
        })

        if (!data) throw new Error('Statement not found')

        // Final cleaning and Markdown conversion
        let markdown = turndownService.turndown(data.html)

        // Post-process the Markdown for math
        markdown = markdown
            // Convert $$$ to $ (inline math)
            .replace(/\${3}/g, '$')
            // Fix spacing around inline math stripped by Turndown
            .replace(/([a-zA-Z0-9)])\$/g, '$1 $')
            .replace(/\$([a-zA-Z0-9(])/g, '$ $1')
            // Fix formatting of headers
            .replace(/# Input/g, '\n\n# Input\n\n')
            .replace(/# Output/g, '\n\n# Output\n\n')
            .replace(/# Note/g, '\n\n# Note\n\n')
            .replace(/# Example/g, '\n\n# Example\n\n')
            .trim()

        return {
            ...data,
            markdown
        }

    } finally {
        await browser.close()
    }
}

async function run() {
    console.log('🚀 Starting Full Clean Re-scrape of Codeforces Problems...')
    
    // Fetch all CF problems
    const { data: problems, error } = await supabase
        .from('problems')
        .select('id, external_id')
        .like('external_id', 'cf-%')

    if (error) {
        console.error('❌ Failed to fetch problems:', error.message)
        return
    }

    if (!problems || problems.length === 0) {
        console.log('No Codeforces problems found.')
        return
    }

    console.log(`Found ${problems.length} CF problems.`)

    for (let i = 0; i < problems.length; i++) {
        const p = problems[i]
        // external_id is usually cf-CONTEST/INDEX, e.g. cf-1900/E
        const match = p.external_id?.match(/^cf-(\d+)\/(.+)$/)
        if (!match) {
            console.log(`⚠️ Skipping invalid external_id: ${p.external_id}`)
            continue
        }

        const contestId = match[1]
        const index = match[2]

        try {
            console.log(`\n[${i + 1}/${problems.length}] Fixing ${p.external_id} (${p.id})...`)
            const data = await scrapeProblemClean(contestId, index)
            
            await supabase.from('problems').update({
                description: data.markdown,
                time_limit: data.timeLimit,
                memory_limit: data.memoryLimit,
                sample_input: data.sampleInput,
                sample_output: data.sampleOutput
            }).eq('id', p.id)
            
            console.log(`  ✅ Successfully updated ${p.external_id}!`)
        } catch (err: any) {
            console.error(`  ❌ Failed ${p.external_id}: ${err.message}`)
        }
        
        // Add a slight delay to avoid getting rate limited or overloading
        await new Promise(r => setTimeout(r, 2000))
    }
    
    console.log('\n🎉 Finished updating all Codeforces problems!')
}

run()
