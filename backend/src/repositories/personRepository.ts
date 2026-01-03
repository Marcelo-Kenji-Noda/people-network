import type { Person, PersonSource } from '../types';

import { pool } from '../db';

export async function createPerson(
  name: string,
  source: PersonSource,
  context: string | null = null
): Promise<Person> {
  const sql = `
    INSERT INTO person (name, source, context)
    VALUES ($1, $2, $3)
    RETURNING id, name, context, source, created_at
  `;
  const { rows } = await pool.query(sql, [name, source, context]);
  return rows[0];
}

export async function getPersonById(id: string): Promise<Person | null> {
  const { rows } = await pool.query(
    'SELECT id, name, context, source, created_at FROM person WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

export async function listPeople(): Promise<Person[]> {
  const { rows } = await pool.query(
    'SELECT id, name, context, source, created_at FROM person ORDER BY name ASC'
  );
  return rows;
}

export async function updatePerson(
  id: string,
  fields: Partial<Pick<Person, 'name' | 'context' | 'source'>>
): Promise<Person | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (fields.name !== undefined) {
    updates.push(`name = $${idx++}`);
    values.push(fields.name);
  }
  if (fields.context !== undefined) {
    updates.push(`context = $${idx++}`);
    values.push(fields.context);
  }
  if (fields.source !== undefined) {
    updates.push(`source = $${idx++}`);
    values.push(fields.source);
  }

  if (updates.length === 0) {
    return getPersonById(id);
  }

  const sql = `
    UPDATE person
    SET ${updates.join(', ')}
    WHERE id = $${idx}
    RETURNING id, name, context, source, created_at
  `;
  values.push(id);
  const { rows } = await pool.query(sql, values);
  return rows[0] ?? null;
}

export async function deletePerson(id: string): Promise<void> {
  await pool.query('DELETE FROM person WHERE id = $1', [id]);
}
