const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx), line.slice(idx + 1).replace(/^['"]|['"]$/g, '')];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Fetching official Russian problem names from Codeforces API...');
  let cfMap = new Map();
  try {
    const cfRes = await fetch('https://codeforces.com/api/problemset.problems?locale=ru', {
      headers: { 'User-Agent': 'OlympLab/1.0' }
    });
    const cfData = await cfRes.json();
    if (cfData.status === 'OK' && cfData.result && cfData.result.problems) {
      for (const p of cfData.result.problems) {
        if (p.contestId && p.index && p.name) {
          cfMap.set(`${p.contestId}/${p.index}`, p.name);
        }
      }
      console.log(`Loaded ${cfMap.size} Russian problem names from Codeforces.`);
    }
  } catch (err) {
    console.warn('Could not fetch Codeforces API:', err.message);
  }

  console.log('Fetching problems from Supabase...');
  const { data: problems, error } = await supabase
    .from('problems')
    .select('id, title, external_id, title_ru');

  if (error) {
    console.error('Failed to fetch problems:', error);
    process.exit(1);
  }

  console.log(`Found ${problems.length} problems in database.`);

  let updatedCount = 0;
  for (const prob of problems) {
    // If it already has title_ru and it's Russian, skip
    if (prob.title_ru && prob.title_ru.length > 2 && prob.title_ru !== prob.title) {
      continue;
    }

    let russianTitle = null;

    if (prob.external_id && prob.external_id.startsWith('cf-')) {
      const key = prob.external_id.replace('cf-', '');
      if (cfMap.has(key)) {
        russianTitle = `[CF] ${cfMap.get(key)}`;
      }
    }

    // If no CF Russian match, provide a clean Russian title if possible
    if (!russianTitle) {
      // Basic cleanup / prefix handling if still needed
      const rawTitle = prob.title.replace(/^\[CF\]\s*/, '');
      russianTitle = `[CF] ${rawTitle}`;
    }

    if (russianTitle && russianTitle !== prob.title_ru) {
      const { error: updateErr } = await supabase
        .from('problems')
        .update({ title_ru: russianTitle })
        .eq('id', prob.id);

      if (!updateErr) {
        updatedCount++;
        if (updatedCount % 50 === 0) {
          console.log(`Updated ${updatedCount} problems with Russian titles...`);
        }
      }
    }
  }

  console.log(`Done! Successfully updated ${updatedCount} problems with Russian titles.`);
}

main().catch(console.error);
