import { Alert, Autocomplete, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { getInteractionPeople, getPeople, removeInteractionPerson, saveInteraction } from '../services/api';
import { useEffect, useMemo, useState } from 'react';

interface Person {
  id: string;
  name: string;
  context: string | null;
  source: 'manual' | 'contacts';
  created_at: string;
}

function formatToday(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function Home() {
  const [date, setDate] = useState<string>(formatToday());
  const [people, setPeople] = useState<Person[]>([]);
  const [interacted, setInteracted] = useState<Person[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  async function refreshLists(d: string) {
    try {
      const [all, byDate] = await Promise.all([getPeople(), getInteractionPeople(d)]);
      setPeople(all);
      setInteracted(byDate);
    } catch {
      setMessage('Failed to load people or interactions.');
    }
  }

  useEffect(() => {
    refreshLists(date);
  }, [date]);

  const handleSelectChange = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const canSave = useMemo(() => date && selectedIds.length > 0 && !saving, [date, selectedIds, saving]);

  const onSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await saveInteraction(date, selectedIds);
      setSelectedIds([]);
      await refreshLists(date);
      setMessage('Interaction saved.');
    } catch (e) {
      setMessage('Failed to save interaction.');
    } finally {
      setSaving(false);
    }
  };

  const availablePeople = useMemo(() => {
    const interactedIds = new Set(interacted.map(p => p.id));
    return people.filter(p => !interactedIds.has(p.id));
  }, [people, interacted]);

  const onUndo = async (personId: string) => {
    setSaving(true);
    setMessage('');
    try {
      await removeInteractionPerson(date, personId);
      await refreshLists(date);
      setMessage('Undo successful.');
    } catch {
      setMessage('Failed to undo interaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Daily Interaction</Typography>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: '100%', sm: 220 } }}
          />
          <Autocomplete
            multiple
            options={availablePeople}
            value={availablePeople.filter((p) => selectedIds.includes(p.id))}
            onChange={(_, newValue) => handleSelectChange(newValue.map((p) => p.id))}
            getOptionLabel={(p) => `${p.name}${p.context ? ` — ${p.context}` : ''}`}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            renderTags={() => null}
            renderInput={(params) => <TextField {...params} label="Select people…" placeholder="Type to search" />}
            sx={{ flex: 1, minWidth: { xs: '100%', sm: 400 } }}
          />
        </Stack>
        {/* Selected chips placed outside the input for better layout */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {availablePeople
            .filter((p) => selectedIds.includes(p.id))
            .map((option) => (
              <Chip
                key={option.id}
                label={option.name}
                onDelete={() => handleSelectChange(selectedIds.filter((id) => id !== option.id))}
              />
            ))}
        </Box>
        <Button onClick={onSave} disabled={!canSave || saving} variant="contained" fullWidth>{saving ? 'Saving…' : 'Save'}</Button>
      </Box>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Interacted on {date}</Typography>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Group</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Source</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {interacted.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: 8 }}>{p.name}</td>
                <td style={{ padding: 8 }}>{p.context ?? ''}</td>
                <td style={{ padding: 8 }}>{p.source}</td>
                <td style={{ padding: 8 }}>
                  <Button size="small" variant="outlined" color="error" disabled={saving} onClick={() => onUndo(p.id)}>Undo</Button>
                </td>
              </tr>
            ))}
            {interacted.length === 0 && (
              <tr>
                <td style={{ padding: 8 }} colSpan={4}>No interactions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Box>
      {message && <Alert sx={{ mt: 2 }} severity="info">{message}</Alert>}
    </Box>
  );
}
