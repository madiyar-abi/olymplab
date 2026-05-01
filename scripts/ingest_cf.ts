import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';


// ─── Environment ─────────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  });
}

const SUPABASE_URL         = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Puppeteer Stealth ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-var-requires
const puppeteerExtra = require('puppeteer-extra');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const StealthPlugin  = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

// ─── Problem Code Parser ──────────────────────────────────────────────────────
function parseProblemCode(code: string) {
  const match = code.match(/^(\d+)([A-Z]\d*)$/i);
  if (match) return { contestId: parseInt(match[1]), index: match[2].toUpperCase() };
  return null;
}

// ─── HTML Helpers ─────────────────────────────────────────────────────────────
function htmlToText(html: string): string {
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



interface ScrapeResult {
  title: string;
  description: string;
  sampleInput: string;
  sampleOutput: string;
  timeLimit: string;
  memoryLimit: string;
}

// ─── Puppeteer Scraper ────────────────────────────────────────────────────────
async function scrapeProblem(
  browser: any,
  contestId: number,
  index: string
): Promise<ScrapeResult> {
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
      } catch (err: any) {
        console.warn(`  [Puppeteer] Failed ${url}: ${err.message.substring(0, 80)}`);
      }
    }
  } finally {
    await page.close();
  }

  if (!html) throw new Error('Could not load problem page (all URLs failed).');

  const $ = cheerio.load(html);

  // ── Sample I/O ──
  const sampleInputHtml = $('.problem-statement .sample-test .input pre').html();
  const sampleOutputHtml = $('.problem-statement .sample-test .output pre').html();
  
  const sampleInput = sampleInputHtml ? htmlToText(sampleInputHtml) : '// No sample input found.';
  const sampleOutput = sampleOutputHtml ? htmlToText(sampleOutputHtml) : '// No sample output found.';

  // ── Title ──
  let title = $('.problem-statement .header .title').text().trim();
  if (!title) title = `Problem ${contestId}${index}`;

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
async function fetchTop100Problems(): Promise<{ contestId: number; index: string; name: string }[]> {
  console.log('[CF API] Fetching problemset...');
  const response = await fetch('https://codeforces.com/api/problemset.problems');
  const data = await response.json() as any;
  if (data.status !== 'OK') throw new Error('Failed to fetch problemset.');
  const problems = data.result.problems.slice(0, 100);
  console.log(`[CF API] Got ${problems.length} problems.`);
  return problems;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  let problemsToProcess: { contestId: number; index: string; name?: string }[] = [];

  if (args.length > 0) {
    console.log('=== Codeforces Ingestion — Specific Problems ===');
    for (const arg of args) {
      const parsed = parseProblemCode(arg);
      if (parsed) problemsToProcess.push(parsed);
      else console.warn(`[Warning] Invalid problem code: "${arg}". Skipping.`);
    }
  } else {
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
          algorithms:      { level: 0, weight: 0 },
          data_structures: { level: 0, weight: 0 },
          complexity:      { level: 0, weight: 0 },
          coding:          { level: 0, weight: 0 },
          debugging:       { level: 0, weight: 0 },
          speed:           { level: 0, weight: 0 },
        };
        
        const { data, error } = await supabase
          .from('problems')
          .insert({
            title,
            cf_id:         `${contestId}${index}`, // e.g., "71A"
            description:   scraped.description,
            sample_input:  scraped.sampleInput,
            sample_output: scraped.sampleOutput,
            time_limit:    scraped.timeLimit,
            memory_limit:  scraped.memoryLimit,
            difficulty:    'Unrated',
            requirements:  DEFAULT_REQUIREMENTS,
          })
          .select();

        if (error) throw error;
        console.log(`  [DB] ✓ Inserted — ID: ${data?.[0]?.id}`);
        success++;

      } catch (err: any) {
        console.error(`  [Error] Failed ${contestId}${index}: ${err.message}. Skipping.`);
      }

      if (idx < problemsToProcess.length - 1) {
        console.log('  [Delay] Sleeping 4s…\n');
        await sleep(4000);
      }
    }
  } finally {
    await browser.close();
    console.log('[Browser] Closed.');
  }

  console.log(`\n=== Finished: ${success}/${problemsToProcess.length} problems ingested ===`);
}

main();
