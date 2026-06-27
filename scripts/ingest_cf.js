"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cheerio = __importStar(require("cheerio"));
// ─── Environment ─────────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^#\s]+)=(.*)$/);
        if (match)
            process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    });
}
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.');
    process.exit(1);
}
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// ─── Puppeteer Stealth ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-var-requires
const puppeteerExtra = require('puppeteer-extra');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());
// ─── Problem Code Parser ──────────────────────────────────────────────────────
function parseProblemCode(code) {
    const match = code.match(/^(\d+)([A-Z]\d*)$/i);
    if (match)
        return { contestId: parseInt(match[1]), index: match[2].toUpperCase() };
    return null;
}
// ─── HTML Helpers ─────────────────────────────────────────────────────────────
function htmlToText(html) {
    let text = html;
    // Replace block elements with newlines
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/(p|div|li|h[1-6])>/gi, '\n\n');
    text = text.replace(/<(p|div|li|h[1-6])[^>]*>/gi, '\n');
    // Remove all remaining tags
    text = text.replace(/<[^>]+>/g, ' ');
    // Decode basic entities
    text = text.replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&times;/g, '×')
        .replace(/&le;/g, '≤')
        .replace(/&ge;/g, '≥');
    // Collapse spaces and excessive newlines
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n[ \t]+/g, '\n');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
}
// ─── Puppeteer Scraper ────────────────────────────────────────────────────────
async function scrapeProblem(browser, contestId, index) {
    const urls = [
        `https://codeforces.com/contest/${contestId}/problem/${index}`,
        `https://codeforces.com/problemset/problem/${contestId}/${index}`,
    ];
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    let html = '';
    try {
        for (const url of urls) {
            console.log(`  [Puppeteer] Navigating to ${url}`);
            try {
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                await page.waitForSelector('.problem-statement', { timeout: 20000 });
                html = await page.content();
                console.log(`  [Puppeteer] ✓ Page loaded (${html.length} bytes).`);
                break;
            }
            catch (err) {
                console.warn(`  [Puppeteer] Failed ${url}: ${err.message.substring(0, 80)}`);
            }
        }
    }
    finally {
        await page.close();
    }
    if (!html)
        throw new Error('Could not load problem page (all URLs failed).');
    const $ = cheerio.load(html);
    // ── Sample I/O ──
    // Modern Codeforces wraps each sample line in <div class="test-example-line">;
    // join those with single newlines. Fall back to raw <pre> text for old
    // problems. (cheerio .text() would concatenate the line-divs with no
    // newlines, e.g. "3","1","3" -> "313", corrupting multi-line samples.)
    const extractSample = (sel) => {
        const $pre = $(sel).first();
        const lineDivs = $pre.find('.test-example-line');
        const text = lineDivs.length > 0
            ? lineDivs.map((_, el) => $(el).text()).get().join('\n')
            : $pre.text();
        return text.trim();
    };
    const sampleInput = extractSample('.problem-statement .sample-test .input pre') || '// No sample input found.';
    const sampleOutput = extractSample('.problem-statement .sample-test .output pre') || '// No sample output found.';
    // ── Title ──
    let title = $('.problem-statement .header .title').text().trim();
    if (!title)
        title = `Problem ${contestId}${index}`;
    // ── Limits ──
    const timeLimit = $('.time-limit').text().replace('time limit per test', '').trim();
    const memoryLimit = $('.memory-limit').text().replace('memory limit per test', '').trim();
    // ── Description ──
    $('.problem-statement .header').remove();
    $('.problem-statement .sample-tests').remove();
    const cleanDescriptionHtml = $('.problem-statement > div').first().html() || '';
    return { title, description: cleanDescriptionHtml, sampleInput, sampleOutput, timeLimit, memoryLimit };
}
// ─── CF API – top 100 ────────────────────────────────────────────────────────
async function fetchTop100Problems() {
    console.log('[CF API] Fetching problemset...');
    const response = await fetch('https://codeforces.com/api/problemset.problems');
    const data = await response.json();
    if (data.status !== 'OK')
        throw new Error('Failed to fetch problemset.');
    const problems = data.result.problems.slice(0, 100);
    console.log(`[CF API] Got ${problems.length} problems.`);
    return problems;
}
// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    let problemsToProcess = [];
    if (args.length > 0) {
        console.log('=== Codeforces Ingestion — Specific Problems ===');
        for (const arg of args) {
            const parsed = parseProblemCode(arg);
            if (parsed)
                problemsToProcess.push(parsed);
            else
                console.warn(`[Warning] Invalid problem code: "${arg}". Skipping.`);
        }
    }
    else {
        console.log('=== Codeforces Ingestion — Top 100 ===');
        problemsToProcess = await fetchTop100Problems();
    }
    // Launch ONE browser for all problems
    console.log('[Browser] Launching Puppeteer Stealth...');
    const browser = await puppeteerExtra.launch({
        headless: false, // Set to false so you can solve CAPTCHAs manually!
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1366,768',
        ],
    });
    console.log('[Browser] Ready.\n');
    let success = 0;
    try {
        for (let idx = 0; idx < problemsToProcess.length; idx++) {
            const { contestId, index, name } = problemsToProcess[idx];
            console.log(`--- [${idx + 1}/${problemsToProcess.length}] ${contestId}${index} ---`);
            try {
                // 1. Scrape via Puppeteer Stealth
                const scraped = await scrapeProblem(browser, contestId, index);
                const title = name || scraped.title;
                console.log(`  [Title]      ${title}`);
                console.log(`  [Sample In]  ${scraped.sampleInput.substring(0, 80)}`);
                console.log(`  [Sample Out] ${scraped.sampleOutput.substring(0, 80)}`);
                // 2. Delete existing problem with this title (simulates upsert without needing UNIQUE constraint)
                await supabase.from('problems').delete().eq('title', title);
                // 3. Insert fresh scraped data
                console.log(`  [DB] Inserting "${title}"…`);
                const DEFAULT_REQUIREMENTS = {
                    algorithms: { level: 0, weight: 0 },
                    data_structures: { level: 0, weight: 0 },
                    complexity: { level: 0, weight: 0 },
                    coding: { level: 0, weight: 0 },
                    debugging: { level: 0, weight: 0 },
                    speed: { level: 0, weight: 0 },
                };
                const { data, error } = await supabase
                    .from('problems')
                    .insert({
                    title,
                    cf_id: `${contestId}${index}`, // e.g., "71A"
                    description: scraped.description,
                    sample_input: scraped.sampleInput,
                    sample_output: scraped.sampleOutput,
                    time_limit: scraped.timeLimit,
                    memory_limit: scraped.memoryLimit,
                    difficulty: 'Unrated',
                    requirements: DEFAULT_REQUIREMENTS,
                })
                    .select();
                if (error)
                    throw error;
                console.log(`  [DB] ✓ Inserted — ID: ${data?.[0]?.id}`);
                success++;
            }
            catch (err) {
                console.error(`  [Error] Failed ${contestId}${index}: ${err.message}. Skipping.`);
            }
            if (idx < problemsToProcess.length - 1) {
                console.log('  [Delay] Sleeping 4s…\n');
                await sleep(4000);
            }
        }
    }
    finally {
        await browser.close();
        console.log('[Browser] Closed.');
    }
    console.log(`\n=== Finished: ${success}/${problemsToProcess.length} problems ingested ===`);
}
main();
