import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  console.log('Finding broken problems (title starting with "Problem " or description with "Just a moment...")...');
  
  const { data, error } = await supabase
    .from('problems')
    .select('id, title')
    .or("title.ilike.Problem %,description.ilike.Just a moment%");
  
  if (error) {
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No broken ghost problems found!');
    return;
  }

  console.log(`Found ${data.length} ghost problems to delete.`);
  for (const p of data) {
    console.log(`Deleting: ${p.title} (${p.id})`);
    await supabase.from('problems').delete().eq('id', p.id);
  }
  
  console.log('Cleanup complete!');
}
main();
