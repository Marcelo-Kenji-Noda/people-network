import { Client } from 'pg';
import { config } from 'dotenv';

config();

async function main() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
  const user = process.env.DB_USER || 'postgres';
  const db = process.env.DB_NAME || 'postgres';
  const password = process.env.DB_PASSWORD ?? '';
  console.log('Attempting direct client connect with params:', { host, port, user, db, passwordType: typeof password });
  const client = new Client({ host, port, user, database: db, password });
  try {
    await client.connect();
    const res = await client.query('SELECT version()');
    console.log('Connected. Version:', res.rows[0].version);
  } catch (e) {
    console.error('Direct client connect failed:', e);
  } finally {
    await client.end();
  }
}

main();
