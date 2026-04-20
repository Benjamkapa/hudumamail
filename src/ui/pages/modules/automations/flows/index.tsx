// src/ui/pages/modules/automations/flows/index.tsx
//
// ─── WHAT IS AN AUTOMATION FLOW? ─────────────────────────────────────────────
//
// A "Flow" is a pre-built email sequence that runs automatically whenever
// a contact meets a specific trigger condition — no manual work needed.
//
// Real-world examples:
//
//   ┌─ TRIGGER: "Contact subscribed"
//   │   Day 0  → "Welcome to Acme! Here's how to get started"
//   │   Day 3  → "Did you know you can do X? Here's a guide"
//   └─  Day 7  → "You've been with us a week — meet the team"
//
//   ┌─ TRIGGER: "Purchase completed"
//   │   Instant → "Thank you for your order #12345"
//   └─  Day 5   → "How is your product? Leave a review"
//
//   ┌─ TRIGGER: "No email opened in 90 days"
//   │   Day 0  → "We miss you — here's 20% off"
//   └─  Day 7  → "Last chance — your discount expires tomorrow"
//
// A flow has:
//   • name        — internal label
//   • trigger     — the event that enrols a contact
//   • steps       — the email steps inside the flow (managed in flow editor)
//   • status      — draft (building), active (running), paused (stopped)
//   • enrolled    — contacts currently progressing through the flow
//   • completed   — contacts who have finished every step

import { useState, useCallback, useMemo } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Divider, FormControl, FormHelperText,
  IconButton, InputAdornment, InputLabel, MenuItem, Select,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import AccountTreeIcon   from '@mui/icons-material/AccountTree';
import CloseIcon         from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon          from '@mui/icons-material/Edit';
import PauseIcon         from '@mui/icons-material/Pause';
import PlayArrowIcon     from '@mui/icons-material/PlayArrow';
import SearchIcon        from '@mui/icons-material/Search';
import OpenInNewIcon     from '@mui/icons-material/OpenInNew';

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

type FlowStatus = 'active' | 'paused' | 'draft';

type Flow = {
  id: number; name: string; description: string;
  trigger: string; triggerEvent: string;
  status: FlowStatus; steps: number;
  enrolled: number; completed: number; conversionRate: number;
  createdAt: string;
};

type FlowForm = { name: string; description: string; trigger: string; triggerEvent: string; };
type Errors   = Partial<Record<keyof FlowForm, string>>;

const SEED: Flow[] = [
  { id: 1, name: 'Welcome Series',     description: '3-email onboarding sequence for new subscribers', trigger: 'Contact subscribed',    triggerEvent: 'contact.subscribed',       status: 'active', steps: 3, enrolled: 1240, completed: 980,  conversionRate: 12.4, createdAt: 'Jun 1, 2025'  },
  { id: 2, name: 'Post-purchase Flow', description: 'Thank you + upsell emails after a purchase',      trigger: 'Purchase completed',    triggerEvent: 'ecommerce.purchase',       status: 'active', steps: 2, enrolled: 430,  completed: 210,  conversionRate: 8.7,  createdAt: 'Jun 15, 2025' },
  { id: 3, name: 'Win-back Sequence',  description: "Re-engage contacts who haven't opened in 90 days",trigger: 'No open in 90 days',   triggerEvent: 'contact.inactive_90d',     status: 'paused', steps: 4, enrolled: 870,  completed: 340,  conversionRate: 4.2,  createdAt: 'May 20, 2025' },
  { id: 4, name: 'Birthday Campaign',  description: 'Automated birthday email with a special discount', trigger: 'Birthday date match',  triggerEvent: 'contact.birthday',         status: 'draft',  steps: 1, enrolled: 0,    completed: 0,    conversionRate: 0,    createdAt: 'Jul 14, 2025' },
  { id: 5, name: 'Cart Abandonment',   description: 'Remind contacts who left items in their cart',     trigger: 'Cart abandoned',       triggerEvent: 'ecommerce.cart_abandoned', status: 'draft',  steps: 2, enrolled: 0,    completed: 0,    conversionRate: 0,    createdAt: 'Jul 15, 2025' },
];

const TRIGGERS = [
  { label: 'Contact subscribed',    event: 'contact.subscribed'       },
  { label: 'Contact unsubscribed',  event: 'contact.unsubscribed'     },
  { label: 'Purchase completed',    event: 'ecommerce.purchase'       },
  { label: 'Cart abandoned',        event: 'ecommerce.cart_abandoned' },
  { label: 'No open in 90 days',    event: 'contact.inactive_90d'     },
  { label: 'Birthday date match',   event: 'contact.birthday'         },
  { label: 'Link clicked in email', event: 'campaign.link_clicked'    },
  { label: 'Form submitted',        event: 'form.submitted'           },
  { label: 'Tag added to contact',  event: 'contact.tag_added'        },
  { label: 'Custom event',          event: 'custom.event'             },
];

const EMPTY: FlowForm = { name: '', description: '', trigger: '', triggerEvent: '' };
const STATUS_COLOR: Record<FlowStatus, 'success'|'warning'|'default'> = { active:'success', paused:'warning', draft:'default' };

function validate(f: FlowForm): Errors {
  const e: Errors = {};
  if (!f.name.trim())  e.name        = 'Flow name is required';
  if (!f.triggerEvent) e.triggerEvent = 'Select a trigger event';
  return e;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function FlowModal({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void; editing: Flow | null;
  onSaved: (f: Flow, isEdit: boolean) => void;
}) {
  const [form, setForm]     = useState<FlowForm>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const [last, setLast] = useState<Flow | null>(null);
  if (open && editing !== last) {
    setLast(editing);
    setErrors({});
    setForm(editing
      ? { name: editing.name, description: editing.description, trigger: editing.trigger, triggerEvent: editing.triggerEvent }
      : EMPTY);
  }

  const set = useCallback((k: keyof FlowForm, v: string) => {
    setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined }));
  }, []);

  const handleClose = () => { setForm(EMPTY); setErrors({}); onClose(); };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await apiFetch('PUT', `/api/automations/flows/${editing.id}`, form) as Flow;
        onSaved(updated, true);
      } else {
        const created = await apiFetch('POST', '/api/automations/flows', { ...form, status: 'draft' }) as Flow;
        onSaved(created, false);
      }
      handleClose();
    } catch {
      if (editing) {
        onSaved({ ...editing, ...form }, true);
      } else {
        onSaved({ id: Date.now(), ...form, status: 'draft', steps: 0, enrolled: 0, completed: 0, conversionRate: 0, createdAt: 'Just now' }, false);
      }
      handleClose();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: .5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>{editing ? 'Edit flow' : 'New automation flow'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {editing ? `Editing "${editing.name}"` : 'Create a flow — then add email steps in the flow editor'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <TextField label="Flow name" placeholder="e.g. Welcome Series" autoFocus
            value={form.name} onChange={e => set('name', e.target.value)}
            error={Boolean(errors.name)} helperText={errors.name ?? 'A short, descriptive name for this automation'}
            fullWidth />
          <TextField label="Description (optional)" placeholder="e.g. 3-email onboarding sequence for new subscribers"
            value={form.description} onChange={e => set('description', e.target.value)}
            fullWidth multiline rows={2} helperText="Helps your team understand what this flow does" />
          <FormControl fullWidth error={Boolean(errors.triggerEvent)}>
            <InputLabel>Trigger event</InputLabel>
            <Select value={form.triggerEvent} label="Trigger event"
              onChange={e => {
                const found = TRIGGERS.find(t => t.event === e.target.value);
                set('triggerEvent', e.target.value);
                if (found) set('trigger', found.label);
              }}>
              {TRIGGERS.map(t => (
                <MenuItem key={t.event} value={t.event}>
                  <Box>
                    <Typography variant="body2">{t.label}</Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', fontSize: 11 }}>{t.event}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{errors.triggerEvent ?? 'The event that automatically enrols a contact into this flow'}</FormHelperText>
          </FormControl>
          <Alert severity="info" sx={{ fontSize: 13 }}>
            After creating, open the <strong>flow editor</strong> to add email steps, time delays, and conditions between steps.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={saving}
          startIcon={<AccountTreeIcon fontSize="small" />}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create flow'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AutomationFlowsPage () {
  const { user } = useAuth();
  const canEdit  = user?.role !== Role.CLIENT_USER;

  const [flows,     setFlows]     = useState<Flow[]>(SEED);
  const [search,    setSearch]    = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Flow | null>(null);
  const [toDelete,  setToDelete]  = useState<Flow | null>(null);

  const displayed = useMemo(() =>
    flows.filter(f =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.trigger.toLowerCase().includes(search.toLowerCase())
    ), [flows, search]);

  const handleSaved = useCallback((f: Flow, isEdit: boolean) => {
    setFlows(prev => isEdit ? prev.map(x => x.id === f.id ? f : x) : [f, ...prev]);
  }, []);

  const handleToggle = useCallback(async (f: Flow) => {
    const next: FlowStatus = f.status === 'active' ? 'paused' : 'active';
    try { await apiFetch('PATCH', `/api/automations/flows/${f.id}`, { status: next }); } catch {}
    setFlows(prev => prev.map(x => x.id === f.id ? { ...x, status: next } : x));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await apiFetch('DELETE', `/api/automations/flows/${toDelete.id}`); } catch {}
    setFlows(prev => prev.filter(f => f.id !== toDelete.id));
    setToDelete(null);
  }, [toDelete]);

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Automation flows</Typography>
          <Typography variant="body2" color="text.secondary">
            Multi-step email sequences that run automatically when contacts meet a trigger condition.
          </Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => { setEditing(null); setModalOpen(true); }}>
            New flow
          </Button>
        )}
      </Box>

      {/* Summary */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' } }}>
        {[
          { label: 'Active flows',       value: flows.filter(f=>f.status==='active').length,          color: 'success.main' },
          { label: 'Total flows',        value: flows.length,                                          color: undefined      },
          { label: 'Contacts enrolled',  value: flows.reduce((a,f)=>a+f.enrolled,0).toLocaleString(), color: undefined      },
          { label: 'Completed journeys', value: flows.reduce((a,f)=>a+f.completed,0).toLocaleString(),color: undefined      },
        ].map(s => (
          <GlassCard key={s.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={s.color ?? 'text.primary'} sx={{ mt: 0.5 }}>{s.value}</Typography>
          </GlassCard>
        ))}
      </Box>

      <TextField size="small" placeholder="Search flows…" value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
        sx={{ maxWidth: 340 }} />

      {displayed.length === 0 && (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <AccountTreeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No flows found</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {search ? 'Try a different search.' : 'Create your first automation flow to nurture contacts automatically.'}
          </Typography>
          {canEdit && !search && (
            <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1 }}
              onClick={() => { setEditing(null); setModalOpen(true); }}>New flow</Button>
          )}
        </GlassCard>
      )}

      {displayed.length > 0 && (
        <GlassCard sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell>Flow</TableCell>
                  <TableCell>Trigger event</TableCell>
                  <TableCell align="center">Steps</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Enrolled</TableCell>
                  <TableCell align="right">Completed</TableCell>
                  <TableCell align="right">Conv. rate</TableCell>
                  <TableCell>Created</TableCell>
                  {canEdit && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(f => (
                  <TableRow key={f.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{f.name}</Typography>
                      <Typography variant="caption" color="text.disabled" noWrap sx={{ display: 'block', maxWidth: 200 }}>{f.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{f.trigger}</Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontFamily: 'monospace', fontSize: 10 }}>{f.triggerEvent}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`${f.steps} step${f.steps !== 1 ? 's' : ''}`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={f.status.charAt(0).toUpperCase()+f.status.slice(1)}
                        color={STATUS_COLOR[f.status]} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    </TableCell>
                    <TableCell align="right">{f.enrolled.toLocaleString()}</TableCell>
                    <TableCell align="right">{f.completed.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color={f.conversionRate > 0 ? 'success.main' : 'text.disabled'} fontWeight={f.conversionRate > 0 ? 600 : 400}>
                        {f.conversionRate > 0 ? `${f.conversionRate}%` : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{f.createdAt}</Typography></TableCell>
                    {canEdit && (
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Open flow editor"><IconButton size="small"><OpenInNewIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Edit flow details">
                            <IconButton size="small" onClick={() => { setEditing(f); setModalOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title={f.status === 'active' ? 'Pause flow' : 'Activate flow'}>
                            <IconButton size="small" onClick={() => handleToggle(f)}>
                              {f.status === 'active' ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete flow">
                            <IconButton size="small" color="error" onClick={() => setToDelete(f)}><DeleteOutlineIcon fontSize="small" /></IconButton>
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
          {displayed.length} of {flows.length} flows
        </Typography>
      )}

      <FlowModal open={modalOpen} editing={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={handleSaved} />

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete flow?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>"{toDelete?.name}"</strong> will be permanently deleted.
            {toDelete && toDelete.enrolled > 0 && (
              <> <strong>{toDelete.enrolled.toLocaleString()} enrolled contacts</strong> will stop receiving emails from this flow immediately.</>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" size="small">Delete flow</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}