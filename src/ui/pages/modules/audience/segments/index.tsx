// src/ui/pages/modules/audience/segments/index.tsx
//
// ─── WHAT IS A SEGMENT? ──────────────────────────────────────────────────────
//
// A Segment is a dynamic, automatically-updated group of contacts that
// meet a set of conditions.  Unlike a static list, a segment recalculates
// its members whenever you use it.
//
// Examples:
//   "High-value subscribers"  → contacts who opened > 5 campaigns
//   "Inactive 90 days"        → contacts with no open in the last 90 days
//   "Recent sign-ups"         → contacts added in the last 30 days
//   "VIP buyers"              → contacts tagged "vip" AND purchased at least once
//
// Segments are used to:
//   • Target specific audiences in campaigns (send only to this segment)
//   • Trigger automation flows (enrol contacts who enter a segment)
//   • Analyse behaviour (how many contacts match this condition?)
//
// A segment has:
//   • name        — human label
//   • conditions  — the filter rules (supports AND logic for multiple conditions)
//   • count       — number of contacts currently matching (dynamic)
//   • lastRefreshed — when the count was last recalculated
//
// Actions:
//   Create  → POST   /api/segments
//   Edit    → PUT    /api/segments/:id
//   Refresh → POST   /api/segments/:id/refresh  (recalculate count)
//   Delete  → DELETE /api/segments/:id

import { useState, useCallback, useMemo } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Divider, FormControl, FormHelperText,
  IconButton, InputAdornment, InputLabel, MenuItem, Select,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import CloseIcon         from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon          from '@mui/icons-material/Edit';
import FilterListIcon    from '@mui/icons-material/FilterList';
import RefreshIcon       from '@mui/icons-material/Refresh';
import SearchIcon        from '@mui/icons-material/Search';

import { GlassCard } from '../../../../dashboard/GlassCard';
import { useAuth }   from '../../../../../state/auth/useAuth';
import { Role }      from '../../../../../types/auth';

const API = () => (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3000';
async function apiFetch(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API()}${path}`, {
    method, credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(res.statusText);
  if (res.status === 204) return undefined;
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ConditionField    = 'opened_campaigns' | 'last_open_days' | 'added_days_ago' | 'click_rate' | 'tag' | 'list' | 'status' | 'country';
type ConditionOperator = 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains' | 'not_contains';

type Condition = {
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
};

type Segment = {
  id: number; name: string; description: string;
  conditions: Condition[];
  conditionSummary: string; // human-readable e.g. "Opened > 5 campaigns"
  count: number; lastRefreshed: string;
};

type SegmentForm = {
  name: string; description: string;
  field: ConditionField; operator: ConditionOperator; value: string;
};

type Errors = Partial<Record<keyof SegmentForm, string>>;

// ─── Condition options ────────────────────────────────────────────────────────

const FIELDS: { value: ConditionField; label: string }[] = [
  { value: 'opened_campaigns', label: 'Campaigns opened (count)'  },
  { value: 'last_open_days',   label: 'Days since last open'      },
  { value: 'added_days_ago',   label: 'Days since contact added'  },
  { value: 'click_rate',       label: 'Overall click rate (%)'    },
  { value: 'tag',              label: 'Has tag'                   },
  { value: 'list',             label: 'Belongs to list'           },
  { value: 'status',           label: 'Subscription status'       },
  { value: 'country',          label: 'Country'                   },
];

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'greater_than',  label: 'is greater than'  },
  { value: 'less_than',     label: 'is less than'     },
  { value: 'equals',        label: 'is equal to'      },
  { value: 'not_equals',    label: 'is not equal to'  },
  { value: 'contains',      label: 'contains'         },
  { value: 'not_contains',  label: 'does not contain' },
];

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: Segment[] = [
  { id: 1, name: 'High-value subscribers', description: 'Contacts who are actively engaged with campaigns',
    conditions: [{ field: 'opened_campaigns', operator: 'greater_than', value: '5' }],
    conditionSummary: 'Campaigns opened > 5', count: 1240, lastRefreshed: 'Jul 14, 2025' },
  { id: 2, name: 'Inactive 90 days', description: 'Contacts who have not opened any email in 90 days',
    conditions: [{ field: 'last_open_days', operator: 'greater_than', value: '90' }],
    conditionSummary: 'Days since last open > 90', count: 870, lastRefreshed: 'Jul 13, 2025' },
  { id: 3, name: 'Recent sign-ups', description: 'Contacts added to the system in the last 30 days',
    conditions: [{ field: 'added_days_ago', operator: 'less_than', value: '30' }],
    conditionSummary: 'Added less than 30 days ago', count: 430, lastRefreshed: 'Jul 15, 2025' },
  { id: 4, name: 'Clicked any link', description: 'Contacts with a click rate above 0 across all campaigns',
    conditions: [{ field: 'click_rate', operator: 'greater_than', value: '0' }],
    conditionSummary: 'Click rate > 0%', count: 2100, lastRefreshed: 'Jul 10, 2025' },
  { id: 5, name: 'VIP customers', description: 'Contacts tagged as VIP',
    conditions: [{ field: 'tag', operator: 'equals', value: 'vip' }],
    conditionSummary: 'Tag equals "vip"', count: 312, lastRefreshed: 'Jul 12, 2025' },
];

const EMPTY_FORM: SegmentForm = { name: '', description: '', field: 'opened_campaigns', operator: 'greater_than', value: '' };

function validate(f: SegmentForm): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name  = 'Segment name is required';
  if (!f.value.trim()) e.value = 'Enter a value for the condition';
  return e;
}

function buildSummary(f: SegmentForm): string {
  const fieldLabel    = FIELDS.find(x => x.value === f.field)?.label ?? f.field;
  const operatorLabel = OPERATORS.find(x => x.value === f.operator)?.label ?? f.operator;
  return `${fieldLabel} ${operatorLabel} "${f.value}"`;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function SegmentModal({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void; editing: Segment | null;
  onSaved: (s: Segment, isEdit: boolean) => void;
}) {
  const [form, setForm]     = useState<SegmentForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const [last, setLast] = useState<Segment | null>(null);
  if (open && editing !== last) {
    setLast(editing);
    setErrors({});
    if (editing) {
      const c = editing.conditions[0];
      setForm({
        name: editing.name, description: editing.description,
        field:    (c?.field    ?? 'opened_campaigns') as ConditionField,
        operator: (c?.operator ?? 'greater_than')     as ConditionOperator,
        value:    c?.value ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }

  const set = useCallback((k: keyof SegmentForm, v: string) => {
    setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined }));
  }, []);

  const handleClose = () => { setForm(EMPTY_FORM); setErrors({}); onClose(); };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const conditions: Condition[] = [{ field: form.field, operator: form.operator, value: form.value }];
    const payload = { name: form.name, description: form.description, conditions };
    try {
      if (editing) {
        const updated = await apiFetch('PUT', `/api/segments/${editing.id}`, payload) as Segment;
        onSaved(updated, true);
      } else {
        const created = await apiFetch('POST', '/api/segments', payload) as Segment;
        onSaved(created, false);
      }
      handleClose();
    } catch {
      const fallback: Segment = editing
        ? { ...editing, name: form.name, description: form.description, conditions, conditionSummary: buildSummary(form) }
        : { id: Date.now(), name: form.name, description: form.description, conditions, conditionSummary: buildSummary(form), count: 0, lastRefreshed: 'Just now' };
      onSaved(fallback, Boolean(editing));
      handleClose();
    } finally { setSaving(false); }
  };

  const conditionPreview = form.value ? buildSummary(form) : null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: .5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>{editing ? 'Edit segment' : 'New segment'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {editing ? `Editing "${editing.name}"` : 'Define a condition — matching contacts update automatically'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <TextField label="Segment name" placeholder="e.g. High-value subscribers" autoFocus
            value={form.name} onChange={e => set('name', e.target.value)}
            error={Boolean(errors.name)} helperText={errors.name ?? 'A descriptive name for this audience group'}
            fullWidth size="small" />
          <TextField label="Description (optional)"
            placeholder="e.g. Contacts who opened more than 5 campaigns"
            value={form.description} onChange={e => set('description', e.target.value)}
            fullWidth size="small" multiline rows={2} />

          {/* Condition builder */}
          <Box sx={{ p: 2, bgcolor: 'action.selected', borderRadius: 1.5 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Condition
            </Typography>
            <Stack spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Field</InputLabel>
                <Select value={form.field} label="Field" onChange={e => set('field', e.target.value as ConditionField)}>
                  {FIELDS.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Operator</InputLabel>
                <Select value={form.operator} label="Operator" onChange={e => set('operator', e.target.value as ConditionOperator)}>
                  {OPERATORS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Value" placeholder="e.g. 5" size="small" fullWidth
                value={form.value} onChange={e => set('value', e.target.value)}
                error={Boolean(errors.value)} helperText={errors.value} />
            </Stack>
            {conditionPreview && (
              <Box sx={{ mt: 1.5, p: 1.25, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">Preview: </Typography>
                <Typography variant="caption" fontWeight={600}>{conditionPreview}</Typography>
              </Box>
            )}
          </Box>

          <Alert severity="info" sx={{ fontSize: 13 }}>
            Segment membership is dynamic — contacts enter or leave this segment automatically as their data changes.
            Multi-condition segments (AND/OR logic) will be available in a future release.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={saving}
          startIcon={<FilterListIcon fontSize="small" />}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create segment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SegmentsPage() {
  const { user } = useAuth();
  const canEdit  = user?.role !== Role.CLIENT_USER;

  const [segments,  setSegments]  = useState<Segment[]>(SEED);
  const [search,    setSearch]    = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Segment | null>(null);
  const [toDelete,  setToDelete]  = useState<Segment | null>(null);

  const displayed = useMemo(() =>
    segments.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.conditionSummary.toLowerCase().includes(search.toLowerCase())
    ), [segments, search]);

  const handleSaved = useCallback((s: Segment, isEdit: boolean) => {
    setSegments(prev => isEdit ? prev.map(x => x.id === s.id ? s : x) : [s, ...prev]);
  }, []);

  const handleRefresh = useCallback(async (s: Segment) => {
    try {
      const updated = await apiFetch('POST', `/api/segments/${s.id}/refresh`) as Segment;
      setSegments(prev => prev.map(x => x.id === s.id ? updated : x));
    } catch {
      // Simulate a count update offline
      setSegments(prev => prev.map(x => x.id === s.id
        ? { ...x, lastRefreshed: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
        : x));
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await apiFetch('DELETE', `/api/segments/${toDelete.id}`); } catch {}
    setSegments(prev => prev.filter(s => s.id !== toDelete.id));
    setToDelete(null);
  }, [toDelete]);

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Segments</Typography>
          <Typography variant="body2" color="text.secondary">
            Dynamic contact groups that update automatically based on behaviour and attributes.
          </Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => { setEditing(null); setModalOpen(true); }}>
            New segment
          </Button>
        )}
      </Box>

      <TextField size="small" placeholder="Search segments…" value={search}
        onChange={e => setSearch(e.target.value)} sx={{ maxWidth: 340 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />

      {/* Empty */}
      {displayed.length === 0 && (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <FilterListIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No segments found</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {search ? 'Try a different search.' : 'Create a segment to target specific groups of contacts precisely.'}
          </Typography>
          {canEdit && !search && (
            <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1 }}
              onClick={() => { setEditing(null); setModalOpen(true); }}>New segment</Button>
          )}
        </GlassCard>
      )}

      {/* Table */}
      {displayed.length > 0 && (
        <GlassCard sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell>Segment</TableCell>
                  <TableCell>Condition</TableCell>
                  <TableCell align="right">Matching contacts</TableCell>
                  <TableCell>Last refreshed</TableCell>
                  {canEdit && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(s => (
                  <TableRow key={s.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{s.name}</Typography>
                      {s.description && (
                        <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block', maxWidth: 210 }}>
                          {s.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'action.selected', px: 0.75, py: 0.25, borderRadius: 0.75 }}>
                        {s.conditionSummary}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>{s.count.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{s.lastRefreshed}</Typography>
                    </TableCell>
                    {canEdit && (
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Refresh count">
                            <IconButton size="small" onClick={() => handleRefresh(s)}>
                              <RefreshIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit segment">
                            <IconButton size="small" onClick={() => { setEditing(s); setModalOpen(true); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete segment">
                            <IconButton size="small" color="error" onClick={() => setToDelete(s)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </GlassCard>
      )}

      {displayed.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'right' }}>
          {displayed.length} of {segments.length} segments
        </Typography>
      )}

      <SegmentModal open={modalOpen} editing={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={handleSaved} />

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete segment?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>"{toDelete?.name}"</strong> will be permanently deleted. Contacts in this segment will not be affected — only the segment definition is removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" size="small">Delete segment</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}