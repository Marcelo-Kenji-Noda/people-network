import { createGroup, deleteGroup, getGroups, updateGroup } from '../services/api';
import { useEffect, useState } from 'react';
import { Alert, Box, Button, IconButton, Paper, Popover, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { HexColorPicker } from 'react-colorful';

interface GroupContext { group_id: string; group_name: string; color: string }

export default function Groups() {
  const [groups, setGroups] = useState<GroupContext[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [originalById, setOriginalById] = useState<Record<string, { group_name: string; color: string }>>({});
  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLElement | null>(null);
  const [colorEditingId, setColorEditingId] = useState<string | null>(null);
  const [tempColorById, setTempColorById] = useState<Record<string, string>>({});

  const openColorPicker = (event: React.MouseEvent<HTMLElement>, g: GroupContext) => {
    setColorEditingId(g.group_id);
    setTempColorById((prev) => ({ ...prev, [g.group_id]: g.color }));
    setColorAnchorEl(event.currentTarget);
  };

  const closeColorPicker = () => {
    setColorEditingId(null);
    setColorAnchorEl(null);
  };

  const load = async () => {
    try {
      const data = await getGroups();
      setGroups(data);
      setOriginalById(Object.fromEntries(data.map((g) => [g.group_id, { group_name: g.group_name, color: g.color }])));
    } catch {
      setMessage('Failed to load groups.');
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      await createGroup({ group_name: name.trim() });
      setName('');
      await load();
      setMessage('Group created.');
    } catch {
      setMessage('Failed to create group.');
    } finally {
      setSaving(false);
    }
  };

  const onUpdateIfChanged = async (g: GroupContext) => {
    const newName = (g.group_name ?? '').trim();
    const newColor = g.color;
    if (!newName) return;
    const orig = originalById[g.group_id];
    const changedName = newName !== (orig?.group_name ?? '');
    const changedColor = newColor !== (orig?.color ?? '');
    if (!changedName && !changedColor) return; // no change
    setSaving(true);
    setMessage('');
    try {
      await updateGroup(g.group_id, { group_name: changedName ? newName : undefined, color: changedColor ? newColor : undefined });
      await load();
      setMessage('Group updated.');
    } catch {
      setMessage('Failed to update group.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (g: GroupContext) => {
    setSaving(true);
    setMessage('');
    try {
      await deleteGroup(g.group_id);
      await load();
      setMessage('Group deleted.');
    } catch {
      setMessage('Failed to delete group.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Groups</Typography>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField fullWidth label="Group name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button fullWidth variant="contained" onClick={onCreate} disabled={saving || !name.trim()} sx={{ height: 56 }}>
            {saving ? 'Saving…' : 'Add'}
          </Button>
        </Stack>
      </Box>
      {/* Search */}
      <Box sx={{ maxWidth: 720, mx: 'auto', mb: 2 }}>
        <TextField fullWidth label="Filter by group" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Group</TableCell>
              <TableCell>Color</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups
              .filter((g) => {
                const f = filter.trim().toLowerCase();
                return f ? g.group_name.toLowerCase().includes(f) : true;
              })
              .map((g) => (
                <TableRow key={g.group_id} hover>
                  <TableCell sx={{ width: '70%' }}>
                    {editingId === g.group_id ? (
                      <TextField
                        autoFocus
                        fullWidth
                        label="Group name"
                        value={g.group_name}
                        onChange={(e) => setGroups((prev) => prev.map((x) => x.group_id === g.group_id ? { ...x, group_name: e.target.value } : x))}
                        onBlur={() => { setEditingId(null); onUpdateIfChanged(g); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      />
                    ) : (
                      <Typography sx={{ cursor: 'pointer' }} onClick={() => setEditingId(g.group_id)}>
                        {g.group_name || '—'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ width: '20%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        role="button"
                        aria-label="Pick color"
                        onClick={(e) => openColorPicker(e, g)}
                        sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: g.color, border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
                      />
                    </Box>
                    <Popover
                      open={colorEditingId === g.group_id}
                      anchorEl={colorAnchorEl}
                      onClose={closeColorPicker}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    >
                      <Box sx={{ p: 2, width: 220 }}>
                        <HexColorPicker
                          color={tempColorById[g.group_id] ?? g.color}
                          onChange={(color) => setTempColorById((prev) => ({ ...prev, [g.group_id]: color }))}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                          <Button size="small" onClick={closeColorPicker}>Cancel</Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              const color = tempColorById[g.group_id] ?? g.color;
                              setGroups((prev) => prev.map((x) => x.group_id === g.group_id ? { ...x, color } : x));
                              onUpdateIfChanged({ ...g, color });
                              closeColorPicker();
                            }}
                          >
                            Save
                          </Button>
                        </Box>
                      </Box>
                    </Popover>
                  </TableCell>
                  <TableCell align="right" sx={{ width: '10%' }}>
                    <IconButton aria-label="delete" color="error" onClick={() => onDelete(g)} disabled={saving}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      {message && <Alert sx={{ mt: 2 }} severity="info">{message}</Alert>}
    </Box>
  );
}
