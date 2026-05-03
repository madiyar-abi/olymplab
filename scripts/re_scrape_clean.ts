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

// Prevent over-escaping
const originalEscape = turndownService.escape
turndownService.escape = (text: string) => {
    return originalEscape(text)
      .replace(/\\\[/g, '[')
      .replace(/\\\]/g, ']')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\_/g, '_')
      .replace(/\\\*/g, '*')
}

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
            // We need to keep the structure but clean it
            // Remove header and sample tests from the main container before capturing HTML
            const header = ps.querySelector('.header')
            const samples = ps.querySelector('.sample-tests')
            if (header) header.remove()
            if (samples) samples.remove()

            // Pre-process LaTeX spans (Codeforces uses tex-span and $$$)
            // But if we blocked MathJax, it might just be raw $$$text$$$
            
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
            // Convert $$$...$$$ to $$...$$
            .replace(/\${3}([\s\S]+?)\${3}/g, '\n\n$$$1$$\n\n')
            // Convert $$...$$ to $...$
            .replace(/\${2}([\s\S]+?)\${2}/g, '$$1$')
            // Ensure no spaces inside delimiters
            .replace(/\$\s+([^\$]+?)\s+\$/g, '$$$1$$')
            .replace(/\$\s+([^\$]+?)\$/g, '$$$1$$')
            .replace(/\$([^\$]+?)\s+\$/g, '$$$1$$')
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
    console.log('🚀 Starting Clean Re-scrape...')
    
    // Let's target specific problems first to verify
    const problemsToFix = [
        { id: 'e7a6b36f-936f-47d5-89f4-953af689778f', contestId: '1900', index: 'E' }, // Counting Is Fun
    ]

    for (const p of problemsToFix) {
        try {
            console.log(`Fixing ${p.id}...`)
            const data = await scrapeProblemClean(p.contestId, p.index)
            
            await supabase.from('problems').update({
                description: data.markdown,
                time_limit: data.timeLimit,
                memory_limit: data.memoryLimit,
                sample_input: data.sampleInput,
                sample_output: data.sampleOutput
            }).eq('id', p.id)
            
            console.log(`  ✅ Successfully updated!`)
            console.log('--- NEW DESCRIPTION PREVIEW ---')
            console.log(data.markdown.substring(0, 500))
        } catch (err: any) {
            console.error(`  ❌ Failed: ${err.message}`)
        }
    }
}

run()
