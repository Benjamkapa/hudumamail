// src/ui/pages/modules/automations/triggers/index.tsx
//
// ─── WHAT IS A TRIGGER? ──────────────────────────────────────────────────────
//
// A Trigger is the "listener" that watches for a specific event and then
// enrols a contact into one or more automation flows.
//
// Think of it like this:
//   TRIGGER (an event happens) → FLOW (a sequence of emails runs)
//
// Triggers decouple the event source from the flow logic, so you can
// attach multiple flows to the same trigger, or swap flows without
// changing the event source.
//
// Examples:
//
//   contact.subscribed ──→ "Welcome Series" flow
//                      └──→ "New subscriber notification to sales" flow
//
//   ecommerce.purchase ──→ "Post-purchase Flow"
//
//   form.submitted ──→ "Lead nurture sequence"
//
// A trigger has:
//   • name         — human-readable label e.g. "New subscriber"
//   • event        — the machine event string e.g. "contact.subscribed"
//   • linkedFlows  — how many flows are listening to this trigger
//   • active       — whether it is currently firing
//   • source       — where the event comes from (Platform, API, Webhook, Integration)
//
// Actions on this page:
//   Create  → POST /api/automations/triggers
//   Edit    → PUT  /api/automations/triggers/:id
//   Toggle active/inactive → PATCH /api/automations/triggers/:id
//   Delete  → DELETE /api/automations/triggers/:id

import { useState, useCallback, useMemo } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Divider, FormControl, FormHelperText,
  IconButton, InputAdornment, InputLabel, MenuItem, Select,
  Stack, Switch, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import BoltIcon          from '@mui/icons-material/Bolt';
import CloseIcon         from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon          from '@mui/icons-material/Edit';
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

type TriggerSource = 'Platform' | 'API' | 'Webhook' | 'Integration';

type Trigger = {
  id: number; name: string; event: string; description: string;
  source: TriggerSource; linkedFlows: number; active: boolean; firedToday: number; createdAt: string;
};

type TriggerForm = { name: string; event: string; description: string; source: TriggerSource; };
type Errors      = Partial<Record<keyof TriggerForm, string>>;

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: Trigger[] = [
  { id: 1, name: 'New subscriber',      event: 'contact.subscribed',       description: 'Fires when a contact is added to any list',             source: 'Platform',    linkedFlows: 2, active: true,  firedToday: 34,  createdAt: 'Jun 1, 2025'  },
  { id: 2, name: 'Purchase completed',  event: 'ecommerce.purchase',       description: 'Fires on a confirmed purchase from the connected store', source: 'Integration', linkedFlows: 1, active: true,  firedToday: 12,  createdAt: 'Jun 15, 2025' },
  { id: 3, name: 'Link clicked',        event: 'campaign.link_clicked',    description: 'Fires when a contact clicks any link in a campaign',    source: 'Platform',    linkedFlows: 1, active: false, firedToday: 0,   createdAt: 'Jul 1, 2025'  },
  { id: 4, name: 'Form submitted',      event: 'form.submitted',           description: 'Fires when a contact submits an embedded signup form',  source: 'Platform',    linkedFlows: 0, active: false, firedToday: 0,   createdAt: 'Jul 14, 2025' },
  { id: 5, name: 'Cart abandoned',      event: 'ecommerce.cart_abandoned', description: 'Fires when a cart session expires without checkout',    source: 'Integration', linkedFlows: 1, active: true,  firedToday: 8,   createdAt: 'Jul 10, 2025' },
  { id: 6, name: 'API custom event',    event: 'custom.event',             description: 'Fires when your backend POSTs to the events endpoint',  source: 'API',         linkedFlows: 0, active: false, firedToday: 0,   createdAt: 'Jul 15, 2025' },
];

const EVENTS = [
  { label: 'Contact subscribed',    event: 'contact.subscribed'       },
  { label: 'Contact unsubscribed',  event: 'contact.unsubscribed'     },
  { label: 'Purchase completed',    event: 'ecommerce.purchase'       },
  { label: 'Cart abandoned',        event: 'ecommerce.cart_abandoned' },
  { label: 'No open in 90 days',    event: 'contact.inactive_90d'     },
  { label: 'Birthday date match',   event: 'contact.birthday'         },
  { label: 'Link clicked in email', event: 'campaign.link_clicked'    },
  { label: 'Form submitted',        event: 'form.submitted'           },
  { label: 'Tag added to contact',  event: 'contact.tag_added'        },
  { label: 'Custom API event',      event: 'custom.event'             },
];

const SOURCES: TriggerSource[] = ['Platform', 'API', 'Webhook', 'Integration'];
const SOURCE_COLOR: Record<TriggerSource, 'primary'|'secondary'|'warning'|'success'> = {
  Platform: 'primary', API: 'secondary', Webhook: 'warning', Integration: 'success',
};
const EMPTY: TriggerForm = { name: '', event: '', description: '', source: 'Platform' };

function validate(f: TriggerForm): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name  = 'Trigger name is required';
  if (!f.event)       e.event = 'Select an event type';
  return e;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function TriggerModal({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void; editing: Trigger | null;
  onSaved: (t: Trigger, isEdit: boolean) => void;
}) {
  const [form, setForm]     = useState<TriggerForm>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const [last, setLast] = useState<Trigger | null>(null);
  if (open && editing !== last) {
    setLast(editing);
    setErrors({});
    setForm(editing
      ? { name: editing.name, event: editing.event, description: editing.description, source: editing.source }
      : EMPTY);
  }

  const set = useCallback((k: keyof TriggerForm, v: string) => {
    setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined }));
  }, []);

  const handleClose = () => { setForm(EMPTY); setErrors({}); onClose(); };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await apiFetch('PUT', `/api/automations/triggers/${editing.id}`, form) as Trigger;
        onSaved(updated, true);
      } else {
        const created = await apiFetch('POST', '/api/automations/triggers', { ...form, active: false }) as Trigger;
        onSaved(created, false);
      }
      handleClose();
    } catch {
      if (editing) {
        onSaved({ ...editing, ...form }, true);
      } else {
        onSaved({ id: Date.now(), ...form, active: false, linkedFlows: 0, firedToday: 0, createdAt: 'Just now' }, false);
      }
      handleClose();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 1 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>{editing ? 'Edit trigger' : 'New trigger'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {editing ? `Editing "${editing.name}"` : 'Define the event that will start automation flows'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <TextField label="Trigger name" placeholder="e.g. New subscriber" autoFocus
            value={form.name} onChange={e => set('name', e.target.value)}
            error={Boolean(errors.name)} helperText={errors.name ?? 'A human-readable label for this trigger'}
            fullWidth />

          <FormControl fullWidth error={Boolean(errors.event)}>
            <InputLabel>Event type</InputLabel>
            <Select value={form.event} label="Event type" onChange={e => set('event', e.target.value)}>
              {EVENTS.map(ev => (
                <MenuItem key={ev.event} value={ev.event}>
                  <Box>
                    <Typography variant="body2">{ev.label}</Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', fontSize: 11 }}>{ev.event}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.event ?? 'The platform event this trigger listens for'}</FormHelperText>
          </FormControl>

          <TextField label="Description (optional)" placeholder="e.g. Fires when a contact is added to any list"
            value={form.description} onChange={e => set('description', e.target.value)}
            fullWidth multiline rows={2} />

          <FormControl fullWidth>
            <InputLabel>Event source</InputLabel>
            <Select value={form.source} label="Event source" onChange={e => set('source', e.target.value as TriggerSource)}>
              <MenuItem value="Platform">Platform — fired by BulkEmail internally</MenuItem>
              <MenuItem value="API">API — your backend fires it via REST</MenuItem>
              <MenuItem value="Webhook">Webhook — incoming POST from a third party</MenuItem>
              <MenuItem value="Integration">Integration — from a connected app (Shopify etc.)</MenuItem>
            </Select>
            <FormHelperText>Where does this event originate?</FormHelperText>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={saving}
          startIcon={<BoltIcon fontSize="small" />}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create trigger'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AutomationTriggersPage() {
  const { user } = useAuth();
  const canEdit  = user?.role !== Role.CLIENT_USER;

  const [triggers,  setTriggers]  = useState<Trigger[]>(SEED);
  const [search,    setSearch]    = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Trigger | null>(null);
  const [toDelete,  setToDelete]  = useState<Trigger | null>(null);

  const displayed = useMemo(() =>
    triggers.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.event.toLowerCase().includes(search.toLowerCase())
    ), [triggers, search]);

  const handleSaved = useCallback((t: Trigger, isEdit: boolean) => {
    setTriggers(prev => isEdit ? prev.map(x => x.id === t.id ? t : x) : [t, ...prev]);
  }, []);

  const handleToggle = useCallback(async (t: Trigger) => {
    try { await apiFetch('PATCH', `/api/automations/triggers/${t.id}`, { active: !t.active }); } catch {}
    setTriggers(prev => prev.map(x => x.id === t.id ? { ...x, active: !x.active } : x));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await apiFetch('DELETE', `/api/automations/triggers/${toDelete.id}`); } catch {}
    setTriggers(prev => prev.filter(t => t.id !== toDelete.id));
    setToDelete(null);
  }, [toDelete]);

  const totalFiredToday = triggers.reduce((a, t) => a + t.firedToday, 0);

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Triggers</Typography>
          <Typography variant="body2" color="text.secondary">
            Event listeners that enrol contacts into automation flows when a condition is met.
          </Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => { setEditing(null); setModalOpen(true); }}>
            New trigger
          </Button>
        )}
      </Box>

      {/* Summary */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' } }}>
        {[
          { label: 'Active triggers',  value: triggers.filter(t=>t.active).length,                          color: 'success.main' },
          { label: 'Total triggers',   value: triggers.length,                                               color: undefined      },
          { label: 'Fired today',      value: totalFiredToday.toLocaleString(),                              color: undefined      },
          { label: 'Linked flows',     value: triggers.reduce((a,t)=>a+t.linkedFlows,0).toLocaleString(),   color: undefined      },
        ].map(s => (
          <GlassCard key={s.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={s.color ?? 'text.primary'} sx={{ mt: 0.5 }}>{s.value}</Typography>
          </GlassCard>
        ))}
      </Box>

      <TextField size="small" placeholder="Search triggers…" value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
        sx={{ maxWidth: 340 }} />

      {displayed.length === 0 && (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <BoltIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No triggers found</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {search ? 'Try a different search.' : 'Create a trigger to start automation flows based on contact behaviour.'}
          </Typography>
          {canEdit && !search && (
            <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1 }}
              onClick={() => { setEditing(null); setModalOpen(true); }}>New trigger</Button>
          )}
        </GlassCard>
      )}

      {displayed.length > 0 && (
        <GlassCard sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell>Trigger</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell align="center">Linked flows</TableCell>
                  <TableCell align="right">Fired today</TableCell>
                  <TableCell align="center">Active</TableCell>
                  <TableCell>Created</TableCell>
                  {canEdit && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(t => (
                  <TableRow key={t.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{t.name}</Typography>
                      <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block', maxWidth: 190 }}>{t.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'action.selected', px: 0.75, py: 0.25, borderRadius: 0.75, whiteSpace: 'nowrap' }}>
                        {t.event}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={t.source} color={SOURCE_COLOR[t.source]} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    </TableCell>
                    <TableCell align="center">
                      {t.linkedFlows > 0
                        ? <Chip label={`${t.linkedFlows} flow${t.linkedFlows !== 1 ? 's' : ''}`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                        : <Typography variant="caption" color="text.disabled">None</Typography>}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={t.firedToday > 0 ? 600 : 400} color={t.firedToday > 0 ? 'text.primary' : 'text.disabled'}>
                        {t.firedToday > 0 ? t.firedToday.toLocaleString() : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Switch size="small" checked={t.active} onChange={() => handleToggle(t)} disabled={!canEdit} />
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{t.createdAt}</Typography></TableCell>
                    {canEdit && (
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit trigger">
                            <IconButton size="small" onClick={() => { setEditing(t); setModalOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete trigger">
                            <IconButton size="small" color="error" onClick={() => setToDelete(t)}><DeleteOutlineIcon fontSize="small" /></IconButton>
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
          {displayed.length} of {triggers.length} triggers
        </Typography>
      )}

      <TriggerModal open={modalOpen} editing={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={handleSaved} />

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete trigger?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>"{toDelete?.name}"</strong> will be permanently deleted.
            {toDelete && toDelete.linkedFlows > 0 && (
              <> It is currently linked to <strong>{toDelete.linkedFlows} flow{toDelete.linkedFlows > 1 ? 's' : ''}</strong> — those flows will no longer receive this event.</>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" size="small">Delete trigger</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}