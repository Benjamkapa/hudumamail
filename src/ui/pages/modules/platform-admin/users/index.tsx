// src/ui/pages/modules/admin/users/index.tsx
// All platform users across all client accounts — SUPER_ADMIN only.
// Actions: create user + assign to client, toggle active/inactive, delete.

import { useState, useCallback, useMemo } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, Divider, FormControl, FormHelperText, IconButton, InputAdornment,
  InputLabel, MenuItem, Select, Stack, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import CloseIcon         from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon          from '@mui/icons-material/Edit';
import PeopleAltIcon     from '@mui/icons-material/PeopleAlt';
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

type UserRole = 'SUPER_ADMIN' | 'CLIENT_ADMIN' | 'CLIENT_USER';
type PlatUser = {
  id: number; name: string; email: string; role: UserRole;
  clientName: string; clientId: number; active: boolean; lastLogin: string; createdAt: string;
};
type UserForm = { name: string; email: string; role: UserRole; clientId: string; };
type Errs = Partial<Record<keyof UserForm, string>>;

const CLIENTS_REF = [
  { id: 1, name: 'Acme Corp' }, { id: 2, name: 'BrightMedia' },
  { id: 3, name: 'TechFlow Inc' }, { id: 4, name: 'GreenLeaf Co' },
  { id: 5, name: 'NovaStar Ltd' }, { id: 6, name: 'Momentum AG' },
];

const SEED: PlatUser[] = [
  { id:1, name:'Alice Johnson',  email:'alice@acme.com',     role:'CLIENT_ADMIN', clientName:'Acme Corp',    clientId:1, active:true,  lastLogin:'2 min ago',   createdAt:'Jan 5, 2025'  },
  { id:2, name:'Bob Martinez',   email:'bob@acme.com',      role:'CLIENT_USER',  clientName:'Acme Corp',    clientId:1, active:true,  lastLogin:'1 hour ago',  createdAt:'Feb 12, 2025' },
  { id:3, name:'Carol Davis',    email:'carol@bright.io',   role:'CLIENT_ADMIN', clientName:'BrightMedia',  clientId:2, active:true,  lastLogin:'Yesterday',   createdAt:'Mar 12, 2025' },
  { id:4, name:'David Lee',      email:'david@techflow.com',role:'CLIENT_USER',  clientName:'TechFlow Inc', clientId:3, active:true,  lastLogin:'Today',       createdAt:'Nov 20, 2024' },
  { id:5, name:'Emma Wilson',    email:'emma@novastar.net', role:'CLIENT_ADMIN', clientName:'NovaStar Ltd', clientId:5, active:false, lastLogin:'2 weeks ago', createdAt:'Jul 10, 2025' },
  { id:6, name:'Frank Oduya',    email:'frank@momentum.de', role:'CLIENT_USER',  clientName:'Momentum AG',  clientId:6, active:true,  lastLogin:'5 min ago',   createdAt:'Sep 14, 2024' },
  { id:7, name:'Platform Admin', email:'admin@platform.io', role:'SUPER_ADMIN',  clientName:'Platform',     clientId:0, active:true,  lastLogin:'Just now',    createdAt:'Jan 1, 2025'  },
];

const ROLE_COLOR: Record<UserRole, string> = { SUPER_ADMIN:'#7c3aed', CLIENT_ADMIN:'#0284c7', CLIENT_USER:'#16a34a' };

const EMPTY: UserForm = { name:'', email:'', role:'CLIENT_USER', clientId:'' };

function validate(f: UserForm): Errs {
  const e: Errs = {};
  if (!f.name.trim()) e.name = 'Required';
  if (!f.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Valid email required';
  if (f.role !== 'SUPER_ADMIN' && !f.clientId) e.clientId = 'Assign to a client';
  return e;
}

function UserModal({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void; editing: PlatUser | null;
  onSaved: (u: PlatUser, isEdit: boolean) => void;
}) {
  const [form, setForm] = useState<UserForm>(EMPTY);
  const [errors, setErrors] = useState<Errs>({});
  const [saving, setSaving] = useState(false);

  const [last, setLast] = useState<PlatUser | null>(null);
  if (open && editing !== last) {
    setLast(editing);
    setErrors({});
    setForm(editing ? { name: editing.name, email: editing.email, role: editing.role, clientId: String(editing.clientId) } : EMPTY);
  }

  const set = useCallback((k: keyof UserForm, v: string) => {
    setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined }));
  }, []);

  const handleClose = () => { setForm(EMPTY); setErrors({}); onClose(); };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const clientRef = CLIENTS_REF.find(c => String(c.id) === form.clientId);
    const payload = { ...form, clientId: Number(form.clientId) || 0 };
    try {
      if (editing) {
        const u = await apiFetch('PUT', `/api/admin/users/${editing.id}`, payload) as PlatUser;
        onSaved(u, true);
      } else {
        const u = await apiFetch('POST', '/api/admin/users', payload) as PlatUser;
        onSaved(u, false);
      }
      handleClose();
    } catch {
      if (editing) {
        onSaved({ ...editing, ...form, clientId: Number(form.clientId) || 0, clientName: clientRef?.name ?? editing.clientName }, true);
      } else {
        onSaved({ id: Date.now(), ...form, clientId: Number(form.clientId) || 0, clientName: clientRef?.name ?? 'Platform', active: true, lastLogin: 'Never', createdAt: 'Just now' }, false);
      }
      handleClose();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: .5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>{editing ? 'Edit user' : 'Create user'}</Typography>
            <Typography variant="caption" color="text.secondary">{editing ? `Editing ${editing.name}` : 'Add a user and assign them to a client account'}</Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <TextField label="Full name" size="small" fullWidth autoFocus value={form.name} onChange={e => set('name', e.target.value)} error={Boolean(errors.name)} helperText={errors.name} />
          <TextField label="Email address" size="small" fullWidth type="email" value={form.email} onChange={e => set('email', e.target.value)} error={Boolean(errors.email)} helperText={errors.email ?? (editing ? 'Email cannot be changed' : undefined)} disabled={Boolean(editing)} />
          <FormControl fullWidth size="small">
            <InputLabel>Role</InputLabel>
            <Select value={form.role} label="Role" onChange={e => set('role', e.target.value as UserRole)}>
              <MenuItem value="SUPER_ADMIN">Super Admin — full platform access</MenuItem>
              <MenuItem value="CLIENT_ADMIN">Client Admin — full access within their account</MenuItem>
              <MenuItem value="CLIENT_USER">Client User — limited, read + send campaigns</MenuItem>
            </Select>
          </FormControl>
          {form.role !== 'SUPER_ADMIN' && (
            <FormControl fullWidth size="small" error={Boolean(errors.clientId)}>
              <InputLabel>Assign to client</InputLabel>
              <Select value={form.clientId} label="Assign to client" onChange={e => set('clientId', e.target.value)}>
                {CLIENTS_REF.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
              </Select>
              <FormHelperText>{errors.clientId}</FormHelperText>
            </FormControl>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={saving} startIcon={<PeopleAltIcon fontSize="small" />}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AllUsersPage() {
  const [users, setUsers] = useState<PlatUser[]>(SEED);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlatUser | null>(null);
  const [toDelete, setToDelete] = useState<PlatUser | null>(null);

  const displayed = useMemo(() => {
    let list = [...users];
    if (search) { const q = search.toLowerCase(); list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.clientName.toLowerCase().includes(q)); }
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    return list;
  }, [users, search, roleFilter]);

  const handleSaved = useCallback((u: PlatUser, isEdit: boolean) => {
    setUsers(prev => isEdit ? prev.map(x => x.id === u.id ? u : x) : [u, ...prev]);
  }, []);

  const handleToggle = useCallback(async (u: PlatUser) => {
    try { await apiFetch('PATCH', `/api/admin/users/${u.id}`, { active: !u.active }); } catch {}
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: !x.active } : x));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await apiFetch('DELETE', `/api/admin/users/${toDelete.id}`); } catch {}
    setUsers(prev => prev.filter(u => u.id !== toDelete.id));
    setToDelete(null);
  }, [toDelete]);

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>All users</Typography>
          <Typography variant="body2" color="text.secondary">{users.length} users across all client accounts.</Typography>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }} onClick={() => { setEditing(null); setModalOpen(true); }}>Create user</Button>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' } }}>
        {[
          { label: 'Total users',    value: users.length                                     },
          { label: 'Active',         value: users.filter(u => u.active).length               },
          { label: 'Inactive',       value: users.filter(u => !u.active).length              },
          { label: 'Super admins',   value: users.filter(u => u.role === 'SUPER_ADMIN').length },
        ].map(s => (
          <GlassCard key={s.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>{s.value}</Typography>
          </GlassCard>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search by name, email, or client…" value={search} onChange={e => setSearch(e.target.value)} sx={{ flex: 1, maxWidth: 360 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
        <TextField select size="small" label="Role" value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All roles</MenuItem>
          <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
          <MenuItem value="CLIENT_ADMIN">Client Admin</MenuItem>
          <MenuItem value="CLIENT_USER">Client User</MenuItem>
        </TextField>
      </Box>

      <GlassCard sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
                <TableCell>User</TableCell><TableCell>Role</TableCell><TableCell>Client</TableCell>
                <TableCell align="center">Active</TableCell><TableCell>Last login</TableCell><TableCell>Created</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayed.map(u => (
                <TableRow key={u.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={u.role.replace('_', ' ')} size="small" variant="outlined" sx={{ fontSize: 10, color: ROLE_COLOR[u.role], borderColor: ROLE_COLOR[u.role] }} />
                  </TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{u.clientName}</Typography></TableCell>
                  <TableCell align="center"><Switch size="small" checked={u.active} onChange={() => handleToggle(u)} /></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{u.lastLogin}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{u.createdAt}</Typography></TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Edit user"><IconButton size="small" onClick={() => { setEditing(u); setModalOpen(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete user"><IconButton size="small" color="error" onClick={() => setToDelete(u)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>

      {displayed.length > 0 && <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'right' }}>Showing {displayed.length} of {users.length} users</Typography>}

      <UserModal open={modalOpen} editing={editing} onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={handleSaved} />

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete user?</DialogTitle>
        <DialogContent>
          <DialogContentText><strong>{toDelete?.name}</strong> ({toDelete?.email}) will be permanently deleted and lose all access.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" size="small">Delete user</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}