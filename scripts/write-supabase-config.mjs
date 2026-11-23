import { mkdirSync, writeFileSync } from 'node:fs';

const config = {
  url: process.env.SUPABASE_URL ?? '',
  anonKey: process.env.SUPABASE_ANON_KEY ?? ''
};

mkdirSync('public', { recursive: true });
writeFileSync('public/supabase-config.json', `${JSON.stringify(config)}\n`, 'utf8');
