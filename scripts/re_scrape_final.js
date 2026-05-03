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

// Advanced Escaping Logic (Senior Grade)
turndownService.escape = (text) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/`/g, '\\`')
      .replace(/[\[\]]/g, (m) => `\\${m}`)
}

async function scrapeProblem(externalId) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    })
    
    try {
        const page = await browser.newPage()
        await page.setRequestInterception(true)
        page.on('request', (request) => {
            const url = request.url()
            // Block everything that's not HTML to prevent MathJax / JS interference
            if (url.includes('mathjax') || url.includes('analytics') || url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.css') || url.endsWith('.js')) {
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

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
        
        const data = await page.evaluate((extId) => {
            const isCF = extId.startsWith('cf-');
            const ps = document.querySelector(isCF ? '.problem-statement' : '.content');
            if (!ps) return null

            // SURGICAL CLEANUP in DOM before string extraction
            if (isCF) {
                const header = ps.querySelector('.header');
                const samples = ps.querySelector('.sample-tests');
                if (header) header.remove();
                if (samples) samples.remove();
                
                // Convert CF specific spans to markers
                ps.querySelectorAll('.tex-span').forEach(el => {
                    const tex = el.textContent.trim();
                    el.replaceWith(document.createTextNode(` [MATH_INLINE]${tex}[END_MATH] `));
                });
                ps.querySelectorAll('.tex-graphics').forEach(el => {
                    const tex = el.getAttribute('alt') || el.textContent.trim();
                    el.replaceWith(document.createTextNode(`\n\n[MATH_BLOCK]${tex}[END_MATH]\n\n`));
                });
                ps.querySelectorAll('.tex-font-style-tt').forEach(el => {
                    const text = el.textContent.trim();
                    el.replaceWith(document.createTextNode(` [CODE_TT]${text}[END_CODE] `));
                });
            } else {
                // CSES CLEANUP
                // CSES statement is between <h1> and <center>
                const info = ps.querySelector('.info');
                if (info) info.remove();
            }

            return { html: ps.innerHTML }
        }, externalId)

        if (!data) throw new Error('Statement extraction failed')

        let markdown = turndownService.turndown(data.html)

        // FINAL POLISH (The "Diamond" pass)
        markdown = markdown
            // 0. Normalize Whitespace (remove thin spaces, non-breaking spaces, etc.)
            .replace(/[\u00a0\u1680​\u180e\u2000-\u200a\u2028\u2029\u202f\u205f​\u3000\ufeff]/g, ' ')
            // 1. Unescape common artifacts
            .replace(/\\([!\[\]()_*`~])/g, '$1')
            // 2. Restore CF Markers
            .replace(/\[MATH_INLINE\]([\s\S]+?)\[END_MATH\]/g, (m, p1) => `$${p1.trim()}$`)
            .replace(/\[MATH_BLOCK\]([\s\S]+?)\[END_MATH\]/g, (m, p1) => `\n\n$$\n${p1.trim()}\n$$\n\n`)
            .replace(/\[CODE_TT\]([\s\S]+?)\[END_CODE\]/g, (m, p1) => ` \`${p1.trim()}\` `)
            // 3. Handle raw $$$...$$$ and $$...$$
            .replace(/\${3}([\s\S]+?)\${3}/g, '\n\n$$$1$$\n\n')
            .replace(/\${2}([\s\S]+?)\${2}/g, '$$1$')
            // 4. Robust Spacing
            .replace(/([^ \n])\$/g, '$1 $') // space before $
            .replace(/\$([^ \n.,!?;:()])/g, '$ $1') // space after $
            .replace(/\$\s+/g, '$').replace(/\s+\$/g, '$') // tight wrap inside
            // 5. LaTeX Normalization
            .replace(/\\\\/g, '\\')
            .replace(/\\le(?![a-z])/g, '\\leq').replace(/\\ge(?![a-z])/g, '\\geq').replace(/\\ldots/g, '\\dots')
            // 6. Fix Headers layout
            .replace(/(#+ [^\n]+)\n([^\n#])/g, '$1\n\n$2')
            // 7. Cleaning multi-lines
            .replace(/\n{3,}/g, '\n\n')
            .trim()

        return markdown

    } finally {
        await browser.close()
    }
}

async function run() {
    console.log('💎 MASTER RE-SCRAPE STARTING...')
    const { data: problems } = await supabase.from('problems')
        .select('id, title, external_id')
        .not('external_id', 'is', null);

    console.log(`Processing ${problems.length} problems...`);

    let count = 0;
    for (const p of problems) {
        try {
            console.log(`[${++count}/${problems.length}] ${p.title}...`);
            const markdown = await scrapeProblem(p.external_id)
            
            await supabase.from('problems').update({ description: markdown }).eq('id', p.id)
            
            // Sleep to avoid rate limits
            await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
            console.error(`  ❌ Error ${p.title}: ${err.message}`);
        }
    }
    console.log('✨ ALL TASKS COMPLETED BEAUTIFULLY!');
}

run()
