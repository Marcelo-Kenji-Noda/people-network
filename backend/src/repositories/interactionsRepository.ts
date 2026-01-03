import type { Interaction } from '../types';
import { addPersonToInteraction } from './interactionPersonRepository';
import { pool } from '../db';

export async function getInteractionById(id: string): Promise<Interaction | null> {
  const { rows } = await pool.query(
    'SELECT id, date, created_at FROM interaction WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

export async function getOrCreateInteractionByDate(date: string): Promise<Interaction> {
  const sql = `
    INSERT INTO interaction (date)
    VALUES ($1)
    ON CONFLICT (date) DO NOTHING
    RETURNING id, date, created_at
  `;
  const { rows } = await pool.query(sql, [date]);
  if (rows.length > 0) return rows[0];

  const { rows: existing } = await pool.query(
    'SELECT id, date, created_at FROM interaction WHERE date = $1',
    [date]
  );
  return existing[0];
}

export async function createInteractionWithPeople(
  date: string,
  personIds: string[]
): Promise<Interaction> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertSql = `
      INSERT INTO interaction (date)
      VALUES ($1)
      ON CONFLICT (date) DO NOTHING
      RETURNING id, date, created_at
    `;
    const insertRes = await client.query(insertSql, [date]);

    let interaction: Interaction;
    if (insertRes.rows.length > 0) {
      interaction = insertRes.rows[0];
    } else {
      const { rows } = await client.query(
        'SELECT id, date, created_at FROM interaction WHERE date = $1',
        [date]
      );
      interaction = rows[0];
    }

    // Add people relations (idempotent)
    for (const pid of personIds) {
      await client.query(
        `INSERT INTO interaction_person (interaction_id, person_id)
         VALUES ($1, $2)
         ON CONFLICT (interaction_id, person_id) DO NOTHING`,
        [interaction.id, pid]
      );
    }

    await client.query('COMMIT');
    return interaction;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function listInteractions(): Promise<Interaction[]> {
  const { rows } = await pool.query(
    'SELECT id, date, created_at FROM interaction ORDER BY date DESC'
  );
  return rows;
}

export async function removeInteraction(id: string): Promise<void> {
  await pool.query('DELETE FROM interaction WHERE id = $1', [id]);
}
