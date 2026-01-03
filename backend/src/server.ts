import { checkConnection, pool } from './db';
import { createGroup, deleteGroup, getGroup, listGroups, updateGroup } from './repositories/groupRepository';
import { createPerson, deletePerson, listPeople, updatePerson } from './repositories/personRepository';

import { config } from 'dotenv';
import cors from 'cors';
import { createInteractionWithPeople } from './repositories/interactionsRepository';
import { listPeopleForInteraction, removePersonFromInteraction } from './repositories/interactionPersonRepository';
import express from 'express';

config();

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.get('/health', async (_req, res) => {
  try {
    await checkConnection();
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'error', db: 'unreachable' });
  }
});

// People API
app.get('/api/people', async (_req, res) => {
  try {
    const people = await listPeople();
    res.json(people);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list people' });
  }
});

app.post('/api/people', async (req, res) => {
  try {
    const { name, context = null, source = 'manual' } = req.body || {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    if (context !== null && typeof context !== 'string') {
      return res.status(400).json({ error: 'context must be string or null' });
    }
    if (source !== 'manual' && source !== 'contacts') {
      return res.status(400).json({ error: 'source must be manual or contacts' });
    }
    const person = await createPerson(name.trim(), source, context);
    res.status(201).json(person);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create person' });
  }
});

app.put('/api/people/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, context, source } = req.body || {};
    const fields: any = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name must be non-empty string' });
      fields.name = name.trim();
    }
    if (context !== undefined) {
      if (context !== null && typeof context !== 'string') return res.status(400).json({ error: 'context must be string or null' });
      fields.context = context;
    }
    if (source !== undefined) {
      if (source !== 'manual' && source !== 'contacts') return res.status(400).json({ error: 'invalid source' });
      fields.source = source;
    }
    const updated = await updatePerson(id, fields);
    if (!updated) return res.status(404).json({ error: 'person not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update person' });
  }
});

  app.delete('/api/people/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deletePerson(id);
      res.status(204).send();
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete person' });
    }
  });

// Interactions API
app.post('/api/interactions', async (req, res) => {
  try {
    const { date, personIds } = req.body || {};
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'date (YYYY-MM-DD) is required' });
    }
    const ids: string[] = Array.isArray(personIds) ? personIds.map(String) : [];
    const interaction = await createInteractionWithPeople(date, ids);
    res.status(201).json(interaction);
  } catch (e) {
    res.status(500).json({ error: 'Failed to save interaction' });
  }
});

// List people for a specific interaction date
app.get('/api/interactions/:date/people', async (req, res) => {
  try {
    const { date } = req.params;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'date (YYYY-MM-DD) is required' });
    }
    const { rows } = await pool.query('SELECT id FROM interaction WHERE date = $1', [date]);
    if (rows.length === 0) return res.json([]);
    const people = await listPeopleForInteraction(rows[0].id);
    res.json(people);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list interaction people' });
  }
});

// Remove a person from a specific interaction date (undo)
app.delete('/api/interactions/:date/people/:personId', async (req, res) => {
  try {
    const { date, personId } = req.params;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'date (YYYY-MM-DD) is required' });
    }
    if (!personId || typeof personId !== 'string') {
      return res.status(400).json({ error: 'personId is required' });
    }
    const { rows } = await pool.query('SELECT id FROM interaction WHERE date = $1', [date]);
    if (rows.length === 0) return res.status(404).json({ error: 'interaction not found for date' });
    const interactionId = rows[0].id as string;
    await removePersonFromInteraction(interactionId, personId);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Failed to remove person from interaction' });
  }
});

// Stats API
app.get('/api/stats', async (req, res) => {
  try {
    const filter = (req.query.filter as string) || 'all';
    const period = (req.query.period as string) || '';
    let where = '';
    const params: any[] = [];
    if (filter === 'year' && /^\d{4}$/.test(period)) {
      const y = Number(period);
      const start = `${y}-01-01`;
      const end = `${y + 1}-01-01`;
      where = 'WHERE i.date >= $1 AND i.date < $2';
      params.push(start, end);
    } else if (filter === 'month' && /^\d{4}-\d{2}$/.test(period)) {
      const [ys, ms] = period.split('-');
      const y = Number(ys);
      const m = Number(ms);
      const start = `${y}-${String(m).padStart(2, '0')}-01`;
      const endMonth = m === 12 ? 1 : m + 1;
      const endYear = m === 12 ? y + 1 : y;
      const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
      where = 'WHERE i.date >= $1 AND i.date < $2';
      params.push(start, end);
    }

    const perDaySql = `
      SELECT i.date::text AS date, COUNT(ip.person_id)::int AS count
      FROM interaction i
      JOIN interaction_person ip ON ip.interaction_id = i.id
      ${where}
      GROUP BY i.date
      ORDER BY i.date DESC
    `;
    const topSql = `
      SELECT p.id AS person_id, p.name, COUNT(*)::int AS count
      FROM interaction_person ip
      JOIN interaction i ON i.id = ip.interaction_id
      JOIN person p ON p.id = ip.person_id
      ${where}
      GROUP BY p.id, p.name
      ORDER BY count DESC, p.name ASC
      LIMIT 10
    `;

    const perDayRes = await pool.query(perDaySql, params);
    const topRes = await pool.query(topSql, params);
    res.json({ perDay: perDayRes.rows, top: topRes.rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// Groups API
app.get('/api/groups', async (_req, res) => {
  try {
    const groups = await listGroups();
    res.json(groups);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list groups' });
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const { group_name, color } = req.body || {};
    if (!group_name || typeof group_name !== 'string' || !group_name.trim()) {
      return res.status(400).json({ error: 'group_name is required' });
    }
    if (color !== undefined && typeof color !== 'string') {
      return res.status(400).json({ error: 'color must be a string if provided' });
    }
    const created = await createGroup(group_name.trim(), color ?? '#9e9e9e');
    res.status(201).json(created);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

app.put('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { group_name, color } = req.body || {};
    const exists = await getGroup(id);
    if (!exists) return res.status(404).json({ error: 'group not found' });
    const fields: any = {};
    if (group_name !== undefined) {
      if (typeof group_name !== 'string' || !group_name.trim()) return res.status(400).json({ error: 'group_name must be non-empty string' });
      fields.group_name = group_name.trim();
    }
    if (color !== undefined) {
      if (typeof color !== 'string') return res.status(400).json({ error: 'color must be a string' });
      fields.color = color;
    }
    const updated = await updateGroup(id, fields);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update group' });
  }
});

app.delete('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const exists = await getGroup(id);
    if (!exists) return res.status(404).json({ error: 'group not found' });
    await deleteGroup(id);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
