import type { Person } from '../types';
import { pool } from '../db';

export async function addPersonToInteraction(
  interactionId: string,
  personId: string
): Promise<void> {
  await pool.query(
    `INSERT INTO interaction_person (interaction_id, person_id)
     VALUES ($1, $2)
     ON CONFLICT (interaction_id, person_id) DO NOTHING`,
    [interactionId, personId]
  );
}

export async function removePersonFromInteraction(
  interactionId: string,
  personId: string
): Promise<void> {
  await pool.query(
    'DELETE FROM interaction_person WHERE interaction_id = $1 AND person_id = $2',
    [interactionId, personId]
  );
}

export async function listPeopleForInteraction(
  interactionId: string
): Promise<Person[]> {
  const sql = `
    SELECT p.id, p.name, p.context, p.source, p.created_at
    FROM interaction_person ip
    JOIN person p ON p.id = ip.person_id
    WHERE ip.interaction_id = $1
    ORDER BY p.name ASC
  `;
  const { rows } = await pool.query(sql, [interactionId]);
  return rows;
}
