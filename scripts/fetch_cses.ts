import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

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

// ─── Turndown Setup ──────────────────────────────────────────────────────────
const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// Avoid escaping LaTeX characters
td.addRule('math', {
  filter: (node: HTMLElement) => {
    // CSES often uses 1 \le n \le 10^5 directly in text
    // We want to detect if a text node or element contains backslashes
    return false; // We'll handle this via global replacement after conversion
  },
  replacement: (content: string) => content
});

// ─── Constants ────────────────────────────────────────────────────────────────
const CSES_TASKS = [
  { id: '1621', topic: 5,  diff: 'easy',   layer: 'intro' },
  { id: '1084', topic: 5,  diff: 'easy',   layer: 'intro' },
  { id: '1090', topic: 5,  diff: 'easy',   layer: 'intro' },
  { id: '1091', topic: 5,  diff: 'medium', layer: 'core'  },
  { id: '1619', topic: 5,  diff: 'medium', layer: 'core'  },
  { id: '1620', topic: 5,  diff: 'medium', layer: 'core'  },
  { id: '1085', topic: 10, diff: 'easy',   layer: 'intro' },
  { id: '1086', topic: 10, diff: 'medium', layer: 'core'  },
  { id: '1668', topic: 10, diff: 'easy',   layer: 'intro' },
  { id: '1646', topic: 9,  diff: 'easy',   layer: 'intro' },
  { id: '1648', topic: 9,  diff: 'medium', layer: 'core'  },
  { id: '1192', topic: 20, diff: 'easy',   layer: 'intro' },
  { id: '1193', topic: 20, diff: 'easy',   layer: 'intro' },
  { id: '1666', topic: 20, diff: 'easy',   layer: 'core'  },
  { id: '1633', topic: 25, diff: 'easy',   layer: 'intro' },
  { id: '1634', topic: 25, diff: 'easy',   layer: 'intro' },
  { id: '1753', topic: 27, diff: 'easy',   layer: 'intro' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function fetchUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OlympLab/1.0' }
  });
  return res.text();
}

function cleanMarkdownMath(md: string): string {
  return md
    // Fix escaped backslashes in common LaTeX commands
    .replace(/\\le/g, '$\\le$')
    .replace(/\\ge/g, '$\\ge$')
    .replace(/\\times/g, '$\\times$')
    .replace(/\\dots/g, '$\\dots$')
    // Fix variables often used in CSES
    .replace(/([^a-zA-Z0-9$])([nmk])([^a-zA-Z0-9$])/g, '$1$$$2$$$3')
    .replace(/([^a-zA-Z0-9$])(x_i)([^a-zA-Z0-9$])/g, '$1$$$2$$$3')
    // Remove triple escapes that Turndown sometimes does
    .replace(/\\\\\\/g, '\\')
    .replace(/\\\\/g, '\\')
    .trim();
}

async function scrapeCSES(id: string) {
  const url = `https://cses.fi/problemset/task/${id}`;
  const html = await fetchUrl(url);
  const $ = cheerio.load(html);

  // Pre-clean: remove navigation, sidebars, etc.
  $('.nav, .sidebar, .header, .footer').remove();
  $('.banner').remove();

  const content = $('.content');
  if (!content.length) return null;

  // 1. Title
  let title = $('title').text().replace('CSES - ', '').trim();
  title = title.replace(/\[CSES\]/g, '').trim();

  // 2. Samples
  // CSES structure: <h2>Example</h2><p>Input:</p><pre>...</pre><p>Output:</p><pre>...</pre>
  let sampleInput = '';
  let sampleOutput = '';

  const exampleHeader = $('h2:contains("Example")');
  if (exampleHeader.length) {
    const inputLabel = exampleHeader.nextAll('p:contains("Input:")').first();
    sampleInput = inputLabel.next('pre').text().trim();
    
    const outputLabel = exampleHeader.nextAll('p:contains("Output:")').first();
    sampleOutput = outputLabel.next('pre').text().trim();
  }

  // 3. Description
  const mdDiv = $('.md');
  // Remove Example section from description
  const mdHtml = mdDiv.html() || '';
  const $md = cheerio.load(mdHtml);
  
  // Remove anything from "Example" header onwards
  let foundExample = false;
  $md('body').contents().each((_, el) => {
    if ($(el).is('h2') && $(el).text().includes('Example')) {
      foundExample = true;
    }
    if (foundExample) {
      $(el).remove();
    }
  });

  let markdown = td.turndown($md('body').html() || '');
  markdown = cleanMarkdownMath(markdown);

  return {
    title,
    description: markdown,
    sampleInput,
    sampleOutput
  };
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting Robust CSES Ingestion...');

  const { data: topicRows } = await supabase.from('roadmap_topics').select('*');
  const topicByOrder = (topicRows || []).reduce((acc, t) => {
    acc[t.order_index] = t;
    return acc;
  }, {} as any);

  for (const task of CSES_TASKS) {
    console.log(`\nProcessing Task ${task.id}...`);
    const scraped = await scrapeCSES(task.id);
    if (!scraped) {
      console.error(`  ❌ Failed to scrape ${task.id}`);
      continue;
    }

    const topic = topicByOrder[task.topic];
    if (!topic) {
      console.error(`  ⚠️ Topic not found for order_index ${task.topic}`);
      continue;
    }

    // 1. Upsert into 'problems'
    const { data: pData, error: pErr } = await supabase
      .from('problems')
      .upsert({
        external_id: `cses-${task.id}`,
        title: `[CSES] ${scraped.title}`,
        description: scraped.description,
        sample_input: scraped.sampleInput,
        sample_output: scraped.sampleOutput,
        difficulty: task.diff.charAt(0).toUpperCase() + task.diff.slice(1),
        requirements: {
          algorithms: { level: 30, weight: 1 },
          coding: { level: 40, weight: 1 }
        }
      }, { onConflict: 'external_id' })
      .select()
      .single();

    if (pErr) {
      console.error(`  ⚠️ Problem upsert failed: ${pErr.message}`);
      continue;
    }

    // 2. Link in 'topic_problems'
    const { error: tpErr } = await supabase
      .from('topic_problems')
      .upsert({
        topic_id: topic.id,
        source: 'cses',
        source_id: task.id,
        title: scraped.title,
        url: `https://cses.fi/problemset/task/${task.id}`,
        difficulty: task.diff,
        problem_id: pData.id,
        layer: task.layer
      }, { onConflict: 'source,source_id' });

    if (tpErr) {
      console.error(`  ⚠️ topic_problems upsert failed: ${tpErr.message}`);
    } else {
      console.log(`  ✅ Successfully ingested "${scraped.title}"`);
    }

    await sleep(1000);
  }

  console.log('\n✨ CSES Ingestion Complete.');
}

main().catch(console.error);
