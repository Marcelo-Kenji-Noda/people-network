import { readFileSync, readdirSync } from 'fs';

import { Client } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config();

async function run() {
  console.log('DB env summary:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    name: process.env.DB_NAME,
    passwordType: typeof process.env.DB_PASSWORD,
  });
  const dir = resolve(process.cwd(), 'migrations');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || 'postgres',
    database: process.env.DB_NAME || 'people_network',
    password: process.env.DB_PASSWORD ?? '',
  });
  await client.connect();
  for (const f of files) {
    const full = resolve(dir, f);
    const sql = readFileSync(full, 'utf-8');
    console.log(`Applying migration ${f}...`);
    await client.query(sql);
  }
  console.log('All migrations applied successfully.');
  await client.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
