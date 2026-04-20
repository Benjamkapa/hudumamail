// src/ui/pages/modules/audience/contacts/index.tsx
//
// ─── WHAT IS THE CONTACTS PAGE? ──────────────────────────────────────────────
//
// Contacts are the people you send emails to.  Every email campaign,
// automation flow, and segment operates on contacts.
//
// A contact has:
//   • email address (required, unique)
//   • first / last name
//   • phone (optional)
//   • list membership — which contact list(s) they belong to
//   • status:
//       subscribed   → can receive emails
//       unsubscribed → opted out, excluded from all campaigns
//       bounced      → their email address is invalid / unreachable
//   • tags — free-form labels e.g. "vip", "customer", "lead"
//   • custom fields — any extra data (not shown here yet)
//
// Actions:
//   Add contact     → POST /api/contacts
//   Edit contact    → PUT  /api/contacts/:id
//   Delete contact  → DELETE /api/contacts/:id
//   Import CSV      → POST /api/contacts/import  (file upload)
//   Export          → GET  /api/contacts/export

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
import DownloadIcon      from '@mui/icons-material/Download';
import EditIcon          from '@mui/icons-material/Edit';
import PeopleIcon        from '@mui/icons-material/People';
import SearchIcon        from '@mui/icons-material/Search';
import UploadIcon        from '@mui/icons-material/Upload';

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

type ContactStatus = 'subscribed' | 'unsubscribed' | 'bounced';

type Contact = {
  id: number;
  firstName: string; lastName: string;
  email: string; phone: string;
  listName: string;
  status: ContactStatus;
  tags: string[];
  addedAt: string;
};

type ContactForm = {
  firstName: string; lastName: string;
  email: string; phone: string;
  listName: string; tags: string;
};

type Errors = Partial<Record<keyof ContactForm, string>>;

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: Contact[] = [
  { id: 1,  firstName: 'Alice',   lastName: 'Johnson',  email: 'alice@example.com',    phone: '+254700001111', listName: 'All Subscribers', status: 'subscribed',   tags: ['vip','customer'],      addedAt: 'Jul 12, 2025' },
  { id: 2,  firstName: 'Bob',     lastName: 'Martinez', email: 'bob@acmecorp.com',      phone: '',             listName: 'Active Users',    status: 'subscribed',   tags: [],                      addedAt: 'Jul 10, 2025' },
  { id: 3,  firstName: 'Carol',   lastName: 'Smith',    email: 'carol@email.com',       phone: '',             listName: 'VIP Customers',   status: 'unsubscribed', tags: ['churned'],             addedAt: 'Jun 30, 2025' },
  { id: 4,  firstName: 'David',   lastName: 'Lee',      email: 'dlee@company.io',       phone: '+254700004444', listName: 'New Signups',     status: 'subscribed',   tags: ['onboarding'],          addedAt: 'Jul 15, 2025' },
  { id: 5,  firstName: 'Emma',    lastName: 'Wilson',   email: 'emma@domain.net',       phone: '',             listName: 'All Subscribers', status: 'bounced',      tags: [],                      addedAt: 'Jun 20, 2025' },
  { id: 6,  firstName: 'Frank',   lastName: 'Oduya',    email: 'frank@startup.co',      phone: '+254722333444', listName: 'New Signups',     status: 'subscribed',   tags: ['lead'],                addedAt: 'Jul 16, 2025' },
  { id: 7,  firstName: 'Grace',   lastName: 'Kamau',    email: 'grace@nonprofit.org',   phone: '',             listName: 'Newsletter List', status: 'subscribed',   tags: [],                      addedAt: 'Jul 1, 2025'  },
  { id: 8,  firstName: 'Henry',   lastName: 'Mwangi',   email: 'henry@enterprise.com',  phone: '+254711222333', listName: 'Active Users',    status: 'subscribed',   tags: ['vip'],                 addedAt: 'Jun 25, 2025' },
];

const LISTS = ['All Subscribers','Active Users','Inactive 90d','Newsletter List','New Signups','VIP Customers','Churned Users'];
const STATUS_COLOR: Record<ContactStatus, 'success'|'warning'|'error'> = {
  subscribed: 'success', unsubscribed: 'warning', bounced: 'error',
};
const STATUS_OPTIONS: ContactStatus[] = ['subscribed', 'unsubscribed', 'bounced'];
const EMPTY: ContactForm = { firstName: '', lastName: '', email: '', phone: '', listName: '', tags: '' };

function validate(f: ContactForm): Errors {
  const e: Errors = {};
  if (!f.firstName.trim())  e.firstName = 'First name is required';
  if (!f.email.trim())      e.email     = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address';
  if (!f.listName)          e.listName  = 'Select a contact list';
  return e;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ContactModal({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void; editing: Contact | null;
  onSaved: (c: Contact, isEdit: boolean) => void;
}) {
  const [form, setForm]     = useState<ContactForm>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const [last, setLast] = useState<Contact | null>(null);
  if (open && editing !== last) {
    setLast(editing);
    setErrors({});
    setForm(editing
      ? { firstName: editing.firstName, lastName: editing.lastName, email: editing.email,
          phone: editing.phone, listName: editing.listName, tags: editing.tags.join(', ') }
      : EMPTY);
  }

  const set = useCallback((k: keyof ContactForm, v: string) => {
    setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined }));
  }, []);

  const handleClose = () => { setForm(EMPTY); setErrors({}); onClose(); };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = { ...form, tags, status: editing?.status ?? 'subscribed' };
    try {
      if (editing) {
        const updated = await apiFetch('PUT', `/api/contacts/${editing.id}`, payload) as Contact;
        onSaved(updated, true);
      } else {
        const created = await apiFetch('POST', '/api/contacts', payload) as Contact;
        onSaved(created, false);
      }
      handleClose();
    } catch {
      if (editing) {
        onSaved({ ...editing, ...form, tags }, true);
      } else {
        onSaved({ id: Date.now(), ...form, tags, status: 'subscribed', addedAt: 'Just now' }, false);
      }
      handleClose();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: .5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>{editing ? 'Edit contact' : 'Add contact'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {editing ? `Editing ${editing.firstName} ${editing.lastName}` : 'Add a new contact to your list'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="First name" autoFocus value={form.firstName}
              onChange={e => set('firstName', e.target.value)}
              error={Boolean(errors.firstName)} helperText={errors.firstName} fullWidth size="small" />
            <TextField label="Last name" value={form.lastName}
              onChange={e => set('lastName', e.target.value)} fullWidth size="small" />
          </Box>
          <TextField label="Email address" type="email" value={form.email}
            onChange={e => set('email', e.target.value)}
            error={Boolean(errors.email)} 
            helperText={editing ? 'Email cannot be changed after creation' : errors.email}
            fullWidth size="small" disabled={Boolean(editing)} />
          <TextField label="Phone number (optional)" placeholder="+254 7XX XXX XXX"
            value={form.phone} onChange={e => set('phone', e.target.value)} fullWidth size="small" />
          <FormControl fullWidth size="small" error={Boolean(errors.listName)}>
            <InputLabel>Contact list</InputLabel>
            <Select value={form.listName} label="Contact list"
              onChange={e => set('listName', e.target.value)}>
              {LISTS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </Select>
            <FormHelperText>{errors.listName ?? 'The primary list this contact belongs to'}</FormHelperText>
          </FormControl>
          <TextField label="Tags (comma-separated)" placeholder="e.g. vip, customer, lead"
            value={form.tags} onChange={e => set('tags', e.target.value)}
            fullWidth size="small"
            helperText="Free-form labels for segmentation and filtering" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={saving}
          startIcon={<PeopleIcon fontSize="small" />}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add contact'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ContactsPage() {
  const { user } = useAuth();
  const canEdit  = user?.role !== Role.CLIENT_USER;

  const [contacts,     setContacts]     = useState<Contact[]>(SEED);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [listFilter,   setListFilter]   = useState('all');
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editing,      setEditing]      = useState<Contact | null>(null);
  const [toDelete,     setToDelete]     = useState<Contact | null>(null);

  const displayed = useMemo(() => {
    let list = [...contacts];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    if (listFilter   !== 'all') list = list.filter(c => c.listName === listFilter);
    return list;
  }, [contacts, search, statusFilter, listFilter]);

  const handleSaved = useCallback((c: Contact, isEdit: boolean) => {
    setContacts(prev => isEdit ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev]);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await apiFetch('DELETE', `/api/contacts/${toDelete.id}`); } catch {}
    setContacts(prev => prev.filter(c => c.id !== toDelete.id));
    setToDelete(null);
  }, [toDelete]);

  const handleExport = async () => {
    try {
      const res = await fetch(`${API()}/api/contacts/export`, { credentials: 'include' });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'contacts.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { /* show toast in production */ }
  };

  const counts = {
    subscribed:   contacts.filter(c => c.status === 'subscribed').length,
    unsubscribed: contacts.filter(c => c.status === 'unsubscribed').length,
    bounced:      contacts.filter(c => c.status === 'bounced').length,
  };

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Contacts</Typography>
          <Typography variant="body2" color="text.secondary">
            {contacts.length.toLocaleString()} contacts across all lists.
          </Typography>
        </Stack>
        {canEdit && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ borderRadius: 1 }}
              onClick={handleExport}>Export CSV</Button>
            <Button variant="outlined" startIcon={<UploadIcon />} component="label" sx={{ borderRadius: 1 }}>
              Import CSV
              <input type="file" accept=".csv" hidden onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData(); fd.append('file', file);
                try {
                  await fetch(`${API()}/api/contacts/import`, { method: 'POST', credentials: 'include', body: fd });
                } catch {}
                e.target.value = '';
              }} />
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
              onClick={() => { setEditing(null); setModalOpen(true); }}>
              Add contact
            </Button>
          </Stack>
        )}
      </Box>

      {/* Status summary */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3,1fr)' } }}>
        {([
          { key: 'subscribed',   label: 'Subscribed',   color: 'success.main' },
          { key: 'unsubscribed', label: 'Unsubscribed', color: 'warning.main' },
          { key: 'bounced',      label: 'Bounced',      color: 'error.main'   },
        ] as const).map(s => (
          <GlassCard key={s.key} sx={{ p: 2, cursor: 'pointer',
            outline: statusFilter === s.key ? 2 : 0,
            outlineColor: 'primary.main',
          }} onClick={() => setStatusFilter(statusFilter === s.key ? 'all' : s.key)}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={s.color} sx={{ mt: 0.5 }}>
              {counts[s.key].toLocaleString()}
            </Typography>
          </GlassCard>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search by name, email, or tag…" value={search}
          onChange={e => setSearch(e.target.value)} sx={{ flex: 1, maxWidth: 340 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
        <TextField select size="small" label="Status" value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)} sx={{ minWidth: 150 }}>
          <MenuItem value="all">All statuses</MenuItem>
          {STATUS_OPTIONS.map(s => (
            <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="List" value={listFilter}
          onChange={e => setListFilter(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All lists</MenuItem>
          {LISTS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
        </TextField>
      </Box>

      {/* Empty */}
      {displayed.length === 0 && (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No contacts found</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {search || statusFilter !== 'all' || listFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Add your first contact or import a CSV to get started.'}
          </Typography>
          {canEdit && !search && statusFilter === 'all' && listFilter === 'all' && (
            <Stack direction="row" spacing={1} justifyContent="center">
              <Button variant="outlined" startIcon={<UploadIcon />} sx={{ borderRadius: 1 }} component="label">
                Import CSV <input type="file" accept=".csv" hidden />
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1 }}
                onClick={() => { setEditing(null); setModalOpen(true); }}>Add contact</Button>
            </Stack>
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
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>List</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell>Added</TableCell>
                  {canEdit && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(c => (
                  <TableRow key={c.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{c.firstName} {c.lastName}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="caption">{c.email}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{c.phone || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={c.listName} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={c.status} color={STATUS_COLOR[c.status]} size="small" variant="outlined"
                        sx={{ fontSize: 11, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {c.tags.length > 0
                          ? c.tags.map(t => <Chip key={t} label={t} size="small" sx={{ fontSize: 10, height: 18 }} />)
                          : <Typography variant="caption" color="text.disabled">—</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{c.addedAt}</Typography>
                    </TableCell>
                    {canEdit && (
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit contact">
                            <IconButton size="small" onClick={() => { setEditing(c); setModalOpen(true); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete contact">
                            <IconButton size="small" color="error" onClick={() => setToDelete(c)}>
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
          Showing {displayed.length} of {contacts.length} contacts
        </Typography>
      )}

      <ContactModal open={modalOpen} editing={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={handleSaved} />

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete contact?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{toDelete?.firstName} {toDelete?.lastName}</strong> ({toDelete?.email}) will be permanently deleted from all lists.
            This cannot be undone. If they re-subscribe later they will be treated as a new contact.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" size="small">Delete contact</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}