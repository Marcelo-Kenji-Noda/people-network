import { useEffect, useState } from 'react';
import { createGroup, getGroups } from '../services/api';
import { createPerson, deletePerson as apiDeletePerson, getPeople, updatePerson } from '../services/api';
import { Alert, Autocomplete, Box, Button, IconButton, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import TableSortLabel from '@mui/material/TableSortLabel';
import DeleteIcon from '@mui/icons-material/Delete';

interface Person {
  id: string;
  name: string;
  context: string | null;
  source: 'manual' | 'contacts';
  created_at: string;
}
interface Group { group_id: string; group_name: string; color?: string }

export default function People() {
  const [list, setList] = useState<Person[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Create form state
  const [name, setName] = useState('');
  const [groupInput, setGroupInput] = useState('');

  // Edit form helpers
  const [groupInputById, setGroupInputById] = useState<Record<string, string>>({});
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);

  // Filters
  const [nameFilter, setNameFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [nameSort, setNameSort] = useState<'asc' | 'desc'>('asc');

  // Snapshot of last loaded values to detect changes
  const [originalById, setOriginalById] = useState<Record<string, { name: string; context: string | null; source: Person['source'] }>>({});

  // UX state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [lastDeleted, setLastDeleted] = useState<Person | null>(null);

  const load = async () => {
    try {
      const [people, gs] = await Promise.all([getPeople(), getGroups()]);
      setList(people);
      setGroups(gs);
      setOriginalById(Object.fromEntries(people.map((p) => [p.id, { name: p.name, context: p.context, source: p.source }])));
    } catch {
      setMessage('Failed to load people or groups.');
    }
  };

  useEffect(() => { load(); }, []);

  const ensureGroupExists = async (groupName: string) => {
    if (!groups.find((g) => g.group_name.toLowerCase() === groupName.toLowerCase())) {
      await createGroup({ group_name: groupName });
      const gs = await getGroups();
      setGroups(gs);
    }
  };

  const onCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      let finalContext: string | null = null;
      if (groupInput.trim()) {
        finalContext = groupInput.trim();
        await ensureGroupExists(finalContext);
      }
      await createPerson({ name: name.trim(), context: finalContext, source: 'manual' });
      setName('');
      setGroupInput('');
      await load();
      setMessage('Person created.');
    } catch {
      setMessage('Failed to create person.');
    } finally {
      setSaving(false);
    }
  };
  // (legacy) onUpdate removed; using onUpdateIfChanged instead

  // Persist only if something actually changed; save on blur for name/group/source
  const onUpdateIfChanged = async (p: Person) => {
    const orig = originalById[p.id];
    const rawGroup = (groupInputById[p.id] ?? (p.context ?? '')).trim();
    const finalContext = rawGroup ? rawGroup : null;

    const changedName = (p.name ?? '').trim() !== (orig?.name ?? '');
    const changedSource = p.source !== (orig?.source ?? 'manual');
    const changedContext = (finalContext ?? null) !== (orig?.context ?? null);

    if (!changedName && !changedSource && !changedContext) {
      return; // No-op
    }

    setSaving(true);
    setMessage('');
    try {
      if (finalContext) await ensureGroupExists(finalContext);
      await updatePerson(p.id, { name: (p.name ?? '').trim(), context: finalContext, source: p.source });
      await load();
      setMessage('Person updated.');
    } catch {
      setMessage('Failed to update person.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p: Person) => {
    setSaving(true);
    setMessage('');
    try {
      await apiDeletePerson(p.id);
      setLastDeleted(p);
      await load();
      setMessage('Person deleted.');
    } catch {
      setMessage('Failed to delete person.');
    } finally {
      setSaving(false);
    }
  };

  const onUndoDelete = async () => {
    if (!lastDeleted) return;
    setSaving(true);
    setMessage('');
    try {
      const ctx = lastDeleted.context?.trim() || null;
      if (ctx) await ensureGroupExists(ctx);
      await createPerson({ name: lastDeleted.name, context: ctx, source: lastDeleted.source });
      setLastDeleted(null);
      await load();
      setMessage('Undo successful.');
    } catch {
      setMessage('Failed to undo delete.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>People Configuration</Typography>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Autocomplete
            freeSolo
            options={groups.map((g) => g.group_name)}
            value={groupInput}
            onChange={(_, val) => setGroupInput(val ?? '')}
            onInputChange={(_, val) => setGroupInput(val)}
            renderInput={(params) => <TextField {...params} fullWidth label="Group" placeholder="Select an existing group or type to create" />}
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 200 } }}>
          <Button variant="contained" onClick={onCreate} disabled={saving || !name.trim()} fullWidth sx={{ height: 56 }}>
            {saving ? 'Saving…' : 'Add'}
          </Button>
        </Box>
        </Stack>
      </Box>

      {/* Filters */}
      <Box sx={{ maxWidth: 720, mx: 'auto', mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label="Filter by name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
          <Autocomplete
            freeSolo
            options={groups.map((g) => g.group_name)}
            value={groupFilter}
            onChange={(_, val) => setGroupFilter(val ?? '')}
            onInputChange={(_, val) => setGroupFilter(val)}
            renderInput={(params) => (
              <TextField {...params} fullWidth label="Filter by group" placeholder="Choose group or type" />
            )}
          />
        </Stack>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 8, p: 0 }} />
              <TableCell sx={{ userSelect: 'none' }}>
                <TableSortLabel
                  active
                  direction={nameSort}
                  onClick={() => setNameSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Source</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list
              .filter((p) => {
                const nf = nameFilter.trim().toLowerCase();
                const gf = groupFilter.trim().toLowerCase();
                const nameOk = nf ? p.name.toLowerCase().includes(nf) : true;
                const groupOk = gf ? (p.context ?? '').toLowerCase().includes(gf) : true;
                return nameOk && groupOk;
              })
              .sort((a, b) => {
                const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
                return nameSort === 'asc' ? cmp : -cmp;
              })
              .map((p) => (
              <TableRow key={p.id} hover>
                {(() => {
                  const currentGroupName = (groupInputById[p.id] ?? (p.context ?? '')).trim();
                  const color = groups.find((g) => g.group_name === currentGroupName)?.color || '#9e9e9e';
                  return (
                    <TableCell sx={{ width: 8, p: 0, bgcolor: color }} />
                  );
                })()}
                <TableCell sx={{ width: '30%' }}>
                  {editingNameId === p.id ? (
                    <TextField
                      autoFocus
                      fullWidth
                      label="Name"
                      value={p.name}
                      onChange={(e) => setList((prev) => prev.map((x) => x.id === p.id ? { ...x, name: e.target.value } : x))}
                      onBlur={() => { setEditingNameId(null); onUpdateIfChanged(p); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    />
                  ) : (
                    <Typography sx={{ cursor: 'pointer' }} onClick={() => setEditingNameId(p.id)}>
                      {p.name || '—'}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ width: '35%' }}>
                  {editingGroupId === p.id ? (
                    <Autocomplete
                      freeSolo
                      options={groups.map((g) => g.group_name)}
                      value={groupInputById[p.id] ?? (p.context ?? '')}
                      onChange={(_, val) => { setGroupInputById((prev) => ({ ...prev, [p.id]: (val ?? '') })); }}
                      onInputChange={(_, val) => setGroupInputById((prev) => ({ ...prev, [p.id]: val }))}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          label="Group"
                          placeholder="Select group or type new"
                          autoFocus
                          onBlur={() => { setEditingGroupId(null); onUpdateIfChanged(p); }}
                        />
                      )}
                    />
                  ) : (
                    <Typography sx={{ cursor: 'pointer' }} onClick={() => setEditingGroupId(p.id)}>
                      {(p.context ?? '') || '—'}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ width: '20%' }}>
                  {editingSourceId === p.id ? (
                    <Select
                      fullWidth
                      value={p.source}
                      onChange={(e) => {
                        const newSource = e.target.value as Person['source'];
                        setList((prev) => prev.map((x) => x.id === p.id ? { ...x, source: newSource } : x));
                      }}
                      onBlur={() => { setEditingSourceId(null); onUpdateIfChanged(p); }}
                    >
                      <MenuItem value="manual">manual</MenuItem>
                      <MenuItem value="contacts">contacts</MenuItem>
                    </Select>
                  ) : (
                    <Typography sx={{ cursor: 'pointer' }} onClick={() => setEditingSourceId(p.id)}>
                      {p.source}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ width: '15%' }}>
                  <IconButton aria-label="delete" color="error" onClick={() => onDelete(p)} disabled={saving}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {message && <Alert sx={{ mt: 2 }} severity="info">{message}</Alert>}
      {lastDeleted && (
        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography>Deleted {lastDeleted.name}.</Typography>
          <Button onClick={onUndoDelete} disabled={saving} variant="outlined">Undo</Button>
        </Box>
      )}
    </Box>
  );
}
