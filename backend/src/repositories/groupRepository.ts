import { pool } from '../db';

export interface GroupContext {
  group_id: string;
  group_name: string;
  color: string;
}

export async function listGroups(): Promise<GroupContext[]> {
  const { rows } = await pool.query('SELECT group_id, group_name, color FROM group_context ORDER BY group_name ASC');
  return rows;
}

export async function createGroup(group_name: string, color: string = '#9e9e9e'): Promise<GroupContext> {
  const sql = `INSERT INTO group_context (group_name, color) VALUES ($1, $2) RETURNING group_id, group_name, color`;
  const { rows } = await pool.query(sql, [group_name, color]);
  return rows[0];
}

export async function getGroup(group_id: string): Promise<GroupContext | null> {
  const { rows } = await pool.query('SELECT group_id, group_name, color FROM group_context WHERE group_id = $1', [group_id]);
  return rows[0] ?? null;
}

export async function updateGroup(
  group_id: string,
  fields: { group_name?: string; color?: string }
): Promise<GroupContext | null> {
  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;
  if (fields.group_name !== undefined) {
    updates.push(`group_name = $${idx++}`);
    params.push(fields.group_name);
  }
  if (fields.color !== undefined) {
    updates.push(`color = $${idx++}`);
    params.push(fields.color);
  }
  if (updates.length === 0) return (await getGroup(group_id));
  params.push(group_id);
  const sql = `UPDATE group_context SET ${updates.join(', ')} WHERE group_id = $${idx} RETURNING group_id, group_name, color`;
  const { rows } = await pool.query(sql, params);
  return rows[0] ?? null;
}

export async function deleteGroup(group_id: string): Promise<void> {
  await pool.query('DELETE FROM group_context WHERE group_id = $1', [group_id]);
}
