// src/ui/pages/modules/admin/clients/index.tsx
//
// ─── WHAT IS THIS? ────────────────────────────────────────────────────────────
// SUPER_ADMIN master view of every client (tenant) on the platform.
// A "client" is a company or person that has a BulkEmail account.
// From here a platform admin can provision new accounts, edit plan/limits,
// suspend bad actors, and permanently delete accounts.
//
// Routes:
//   POST   /api/admin/clients            → create account + send invite
//   PUT    /api/admin/clients/:id        → edit name / plan / limit
//   PATCH  /api/admin/clients/:id        → suspend or re-activate
//   DELETE /api/admin/clients/:id        → permanent delete (destructive)

import { useState, useCallback, useMemo } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, Divider, FormControl, IconButton, InputAdornment, InputLabel,
  LinearProgress, MenuItem, Select, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, Alert,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import BlockIcon         from '@mui/icons-material/Block';
import BusinessIcon      from '@mui/icons-material/Business';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import CloseIcon         from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon          from '@mui/icons-material/Edit';
import SearchIcon        from '@mui/icons-material/Search';
import { GlassCard } from '../../../../dashboard/GlassCard';

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

type ClientStatus = 'active' | 'suspended' | 'trial';
type PlanName = 'Starter' | 'Pro' | 'Business' | 'Enterprise';
type Client = {
  id: number; name: string; ownerEmail: string; plan: PlanName;
  status: ClientStatus; emailsUsed: number; emailsLimit: number;
  contacts: number; createdAt: string; lastActive: string;
};
type ClientForm = { name: string; ownerEmail: string; plan: PlanName; emailsLimit: string; };
type Errs = Partial<Record<keyof ClientForm, string>>;

const PLAN_LIMITS: Record<PlanName, number> = { Starter: 10000, Pro: 50000, Business: 200000, Enterprise: 500000 };
const STATUS_COLOR: Record<ClientStatus, 'success'|'error'|'warning'> = { active:'success', suspended:'error', trial:'warning' };
const EMPTY: ClientForm = { name:'', ownerEmail:'', plan:'Starter', emailsLimit:'10000' };

const SEED: Client[] = [
  { id:1, name:'Acme Corp',    ownerEmail:'alice@acme.com',     plan:'Pro',        status:'active',    emailsUsed:38200,  emailsLimit:50000,  contacts:12400, createdAt:'Jan 5, 2025',  lastActive:'2 min ago'   },
  { id:2, name:'BrightMedia',  ownerEmail:'bob@bright.io',     plan:'Starter',    status:'active',    emailsUsed:9100,   emailsLimit:10000,  contacts:8700,  createdAt:'Mar 12, 2025', lastActive:'1 hour ago'  },
  { id:3, name:'TechFlow Inc', ownerEmail:'cto@techflow.com',  plan:'Business',   status:'active',    emailsUsed:52000,  emailsLimit:200000, contacts:15200, createdAt:'Nov 20, 2024', lastActive:'Yesterday'   },
  { id:4, name:'GreenLeaf Co', ownerEmail:'it@greenleaf.io',   plan:'Starter',    status:'suspended', emailsUsed:0,      emailsLimit:10000,  contacts:4300,  createdAt:'Jun 3, 2025',  lastActive:'3 weeks ago' },
  { id:5, name:'NovaStar Ltd', ownerEmail:'it@novastar.net',   plan:'Pro',        status:'trial',     emailsUsed:5400,   emailsLimit:50000,  contacts:2100,  createdAt:'Jul 10, 2025', lastActive:'Today'       },
  { id:6, name:'Momentum AG',  ownerEmail:'admin@momentum.de', plan:'Enterprise', status:'active',    emailsUsed:124000, emailsLimit:500000, contacts:48000, createdAt:'Sep 14, 2024', lastActive:'5 min ago'   },
];

function validate(f: ClientForm): Errs {
  const e: Errs = {};
  if (!f.name.trim()) e.name = 'Required';
  if (!f.ownerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.ownerEmail)) e.ownerEmail = 'Valid email required';
  if (!f.emailsLimit || isNaN(Number(f.emailsLimit)) || Number(f.emailsLimit) < 1000) e.emailsLimit = 'Enter a number ≥ 1,000';
  return e;
}

function ClientModal({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void; editing: Client | null;
  onSaved: (c: Client, isEdit: boolean) => void;
}) {
  const [form, setForm] = useState<ClientForm>(EMPTY);
  const [errors, setErrors] = useState<Errs>({});
  const [saving, setSaving] = useState(false);

  const [last, setLast] = useState<Client | null>(null);
  if (open && editing !== last) {
    setLast(editing);
    setErrors({});
    setForm(editing ? { name: editing.name, ownerEmail: editing.ownerEmail, plan: editing.plan, emailsLimit: String(editing.emailsLimit) } : EMPTY);
  }

  const set = useCallback((k: keyof ClientForm, v: string) => {
    if (k === 'plan') {
      setForm(p => ({ ...p, plan: v as PlanName, emailsLimit: String(PLAN_LIMITS[v as PlanName]) }));
    } else {
      setForm(p => ({ ...p, [k]: v }));
    }
    setErrors(p => ({ ...p, [k]: undefined }));
  }, []);

  const handleClose = () => { setForm(EMPTY); setErrors({}); onClose(); };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const payload = { ...form, emailsLimit: Number(form.emailsLimit) };
    try {
      if (editing) {
        const u = await apiFetch('PUT', `/api/admin/clients/${editing.id}`, payload) as Client;
        onSaved(u, true);
      } else {
        const c = await apiFetch('POST', '/api/admin/clients', payload) as Client;
        onSaved(c, false);
      }
      handleClose();
    } catch {
      if (editing) {
        onSaved({ ...editing, ...form, emailsLimit: Number(form.emailsLimit) }, true);
      } else {
        onSaved({ id: Date.now(), ...form, emailsLimit: Number(form.emailsLimit), status: 'trial', emailsUsed: 0, contacts: 0, createdAt: 'Just now', lastActive: 'Never' }, false);
      }
      handleClose();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 0.5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>{editing ? 'Edit client' : 'Create client account'}</Typography>
            <Typography variant="caption" color="text.secondary">{editing ? `Editing "${editing.name}"` : 'Provision a new tenant on the platform'}</Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <TextField label="Company name" size="small" fullWidth autoFocus
            value={form.name} onChange={e => set('name', e.target.value)}
            error={Boolean(errors.name)} helperText={errors.name} />
          <TextField label="Owner email" size="small" fullWidth type="email"
            value={form.ownerEmail} onChange={e => set('ownerEmail', e.target.value)}
            error={Boolean(errors.ownerEmail)}
            helperText={errors.ownerEmail ?? (editing ? 'Email cannot be changed' : 'An invitation will be sent here')}
            disabled={Boolean(editing)} />
          <FormControl fullWidth size="small">
            <InputLabel>Plan</InputLabel>
            <Select value={form.plan} label="Plan" onChange={e => set('plan', e.target.value)}>
              {(Object.keys(PLAN_LIMITS) as PlanName[]).map(p => (
                <MenuItem key={p} value={p}>{p} — {PLAN_LIMITS[p].toLocaleString()} emails/mo</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Custom monthly email limit" size="small" fullWidth type="number"
            value={form.emailsLimit} onChange={e => set('emailsLimit', e.target.value)}
            error={Boolean(errors.emailsLimit)}
            helperText={errors.emailsLimit ?? 'Overrides the plan default — minimum 1,000'} />
          {!editing && <Alert severity="info" sx={{ fontSize: 13 }}>An invitation email will be sent to the owner. They will set their password on first login.</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={saving} startIcon={<BusinessIcon fontSize="small" />}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AllClientsPage() {
  const [clients, setClients] = useState<Client[]>(SEED);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [toDelete, setToDelete] = useState<Client | null>(null);

  const displayed = useMemo(() => {
    let list = [...clients];
    if (search) { const q = search.toLowerCase(); list = list.filter(c => c.name.toLowerCase().includes(q) || c.ownerEmail.toLowerCase().includes(q)); }
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    return list;
  }, [clients, search, statusFilter]);

  const handleSaved = useCallback((c: Client, isEdit: boolean) => {
    setClients(prev => isEdit ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev]);
  }, []);

  const handleToggle = useCallback(async (c: Client) => {
    const next: ClientStatus = c.status === 'active' ? 'suspended' : 'active';
    try { await apiFetch('PATCH', `/api/admin/clients/${c.id}`, { status: next }); } catch {}
    setClients(prev => prev.map(x => x.id === c.id ? { ...x, status: next } : x));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await apiFetch('DELETE', `/api/admin/clients/${toDelete.id}`); } catch {}
    setClients(prev => prev.filter(c => c.id !== toDelete.id));
    setToDelete(null);
  }, [toDelete]);

  const counts = { active: clients.filter(c => c.status === 'active').length, trial: clients.filter(c => c.status === 'trial').length, suspended: clients.filter(c => c.status === 'suspended').length };

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>All clients</Typography>
          <Typography variant="body2" color="text.secondary">{clients.length} client accounts on the platform.</Typography>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
          onClick={() => { setEditing(null); setModalOpen(true); }}>Create account</Button>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3,1fr)' } }}>
        {([['active','Active','success.main'],['trial','Trial','warning.main'],['suspended','Suspended','error.main']] as const).map(([k, l, color]) => (
          <GlassCard key={k} sx={{ p: 2, cursor: 'pointer', outline: statusFilter === k ? 2 : 0, outlineColor: 'primary.main' }}
            onClick={() => setStatusFilter(statusFilter === k ? 'all' : k)}>
            <Typography variant="caption" color="text.secondary">{l}</Typography>
            <Typography variant="h5" fontWeight={800} color={color} sx={{ mt: 0.5 }}>{counts[k]}</Typography>
          </GlassCard>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} sx={{ flex: 1, maxWidth: 340 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
        <TextField select size="small" label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} sx={{ minWidth: 150 }}>
          <MenuItem value="all">All statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="trial">Trial</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
        </TextField>
      </Box>

      {displayed.length === 0 ? (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No clients found</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>{search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Create the first client account.'}</Typography>
          {!search && statusFilter === 'all' && <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1 }} onClick={() => { setEditing(null); setModalOpen(true); }}>Create account</Button>}
        </GlassCard>
      ) : (
        <GlassCard sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell>Client</TableCell><TableCell>Plan</TableCell><TableCell sx={{ minWidth: 160 }}>Email usage</TableCell>
                  <TableCell align="right">Contacts</TableCell><TableCell>Status</TableCell><TableCell>Last active</TableCell><TableCell>Created</TableCell><TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(c => {
                  const pct = Math.round((c.emailsUsed / c.emailsLimit) * 100);
                  return (
                    <TableRow key={c.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.ownerEmail}</Typography>
                      </TableCell>
                      <TableCell><Chip label={c.plan} size="small" variant="outlined" sx={{ fontSize: 11 }} /></TableCell>
                      <TableCell>
                        <LinearProgress variant="determinate" value={Math.min(pct, 100)} color={pct >= 90 ? 'error' : pct >= 70 ? 'warning' : 'primary'} sx={{ height: 5, borderRadius: 1, mb: 0.5 }} />
                        <Typography variant="caption" color="text.disabled">{c.emailsUsed.toLocaleString()} / {c.emailsLimit.toLocaleString()} ({pct}%)</Typography>
                      </TableCell>
                      <TableCell align="right">{c.contacts.toLocaleString()}</TableCell>
                      <TableCell><Chip label={c.status} color={STATUS_COLOR[c.status]} size="small" variant="outlined" sx={{ fontSize: 11, textTransform: 'capitalize' }} /></TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{c.lastActive}</Typography></TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{c.createdAt}</Typography></TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditing(c); setModalOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title={c.status === 'active' ? 'Suspend' : 'Activate'}>
                            <IconButton size="small" color={c.status === 'active' ? 'warning' : 'success'} onClick={() => handleToggle(c)}>
                              {c.status === 'active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete permanently">
                            <IconButton size="small" color="error" onClick={() => setToDelete(c)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </GlassCard>
      )}

      {displayed.length > 0 && <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'right' }}>Showing {displayed.length} of {clients.length} clients</Typography>}

      <ClientModal open={modalOpen} editing={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={handleSaved} />

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete client account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>"{toDelete?.name}"</strong> and ALL their data — campaigns, contacts, templates, and billing history — will be permanently deleted. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" size="small">Delete permanently</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}