const { createClient } = require('@supabase/supabase-js')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs')
const path = require('path')
const TurndownService = require('turndown')

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
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
})

const originalEscape = turndownService.escape
turndownService.escape = (text) => {
    return originalEscape(text)
      .replace(/\\\[/g, '[')
      .replace(/\\\]/g, ']')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\_/g, '_')
      .replace(/\\\*/g, '*')
}

async function scrapeProblemClean(externalId) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    try {
        const page = await browser.newPage()
        await page.setRequestInterception(true)
        page.on('request', (request) => {
            const url = request.url()
            if (url.includes('mathjax') || url.includes('analytics') || url.includes('ads') || url.endsWith('.png') || url.endsWith('.jpg')) {
                request.abort()
            } else {
                request.continue()
            }
        })

        let url = '';
        if (externalId.startsWith('cf-')) {
            const parts = externalId.replace('cf-', '').split('/');
            url = `https://codeforces.com/contest/${parts[0]}/problem/${parts[1]}`;
        } else if (externalId.startsWith('cses-')) {
            const id = externalId.replace('cses-', '');
            url = `https://cses.fi/problemset/task/${id}`;
        }

        console.log(`  [Puppeteer] Fetching ${url}...`)
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        
        const data = await page.evaluate((extId) => {
            const isCF = extId.startsWith('cf-');
            const ps = document.querySelector(isCF ? '.problem-statement' : '.content');
            if (!ps) return null

            if (isCF) {
                const title = ps.querySelector('.header .title')?.textContent?.trim() || ''
                const timeLimit = ps.querySelector('.time-limit')?.textContent?.replace('time limit per test', '').trim() || ''
                const memoryLimit = ps.querySelector('.memory-limit')?.textContent?.replace('memory limit per test', '').trim() || ''
                const sampleInput = Array.from(ps.querySelectorAll('.sample-test .input pre')).map(el => el.innerText.trim()).join('\n\n---\n\n');
                const sampleOutput = Array.from(ps.querySelectorAll('.sample-test .output pre')).map(el => el.innerText.trim()).join('\n\n---\n\n');

                const header = ps.querySelector('.header')
                const samples = ps.querySelector('.sample-tests')
                if (header) header.remove()
                if (samples) samples.remove()

                return { title, timeLimit, memoryLimit, sampleInput, sampleOutput, html: ps.innerHTML }
            } else {
                // CSES Logic
                const title = document.querySelector('title')?.textContent?.split('-')[0].trim() || ''
                const info = document.querySelector('.info')?.innerText || ''
                const timeLimit = info.match(/Time limit:\s*(.*)/)?.[1]?.trim() || ''
                const memoryLimit = info.match(/Memory limit:\s*(.*)/)?.[1]?.trim() || ''
                
                // Samples in CSES are often in pre tags
                const samples = Array.from(document.querySelectorAll('pre')).filter(el => !el.classList.contains('input') && !el.classList.contains('output'));
                // This is crude, but CSES is simpler
                
                return { title, timeLimit, memoryLimit, sampleInput: '', sampleOutput: '', html: ps.innerHTML }
            }
        }, externalId)

        if (!data) throw new Error('Statement not found')

        let markdown = turndownService.turndown(data.html)

        markdown = markdown
            .replace(/\${3}([\s\S]+?)\${3}/g, '\n\n$$$1$$\n\n')
            .replace(/\${2}([\s\S]+?)\${2}/g, '$$1$')
            // Aggressive spacing fix
            .replace(/([a-zA-Z0-9.,;:!?)\]])\$/g, '$1 $')
            .replace(/\$([a-zA-Z0-9(\[])/g, '$ $1')
            // Tight wrap
            .replace(/\$\s+([^\$]+?)\s+\$/g, '$$$1$$')
            .replace(/\$\s+([^\$]+?)\$/g, '$$$1$$')
            .replace(/\$([^\$]+?)\s+\$/g, '$$$1$$')
            .replace(/\\(le|ge|times|dots|min|max|log|approx|neq|pm|sum|prod|alpha|beta|gamma|delta|epsilon|phi|pi|theta|infty)(?![^$]*\$)/g, '$\\$1$')
            .replace(/# Input/g, '\n\n# Input\n\n')
            .replace(/# Output/g, '\n\n# Output\n\n')
            .replace(/# Note/g, '\n\n# Note\n\n')
            .replace(/# Example/g, '\n\n# Example\n\n')
            .trim()

        return { ...data, markdown }

    } finally {
        await browser.close()
    }
}

async function run() {
    console.log('🚀 Starting Clean Re-scrape Batch...')
    const { data: problems } = await supabase.from('problems')
        .select('id, title, external_id')
        .not('external_id', 'is', null);

    console.log(`Found ${problems.length} problems with external IDs.`);

    for (const p of problems) {
        if (!p.external_id) continue;
        try {
            console.log(`Fixing [${p.title}] (${p.id})...`)
            const data = await scrapeProblemClean(p.external_id)
...
            await supabase.from('problems').update({
                description: data.markdown,
                time_limit: data.timeLimit || undefined,
                memory_limit: data.memoryLimit || undefined,
            }).eq('id', p.id)
            
            console.log(`  ✅ Updated!`)
        } catch (err) {
            console.error(`  ❌ Failed: ${err.message}`)
        }
    }
}

run()
