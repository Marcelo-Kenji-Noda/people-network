import { Pool } from 'pg';
import { config } from 'dotenv';

// Ensure environment variables from .env are loaded before reading them
config();

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
const user = process.env.DB_USER || 'postgres';
const db = process.env.DB_NAME || 'people_network';
const password = process.env.DB_PASSWORD ?? '';

const connectionString = `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;

export const pool = new Pool({
  connectionString,
});

export async function checkConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT 1');
    if (rows.length) {
      console.log('Database connection OK');
    }
  } finally {
    client.release();
  }
}
