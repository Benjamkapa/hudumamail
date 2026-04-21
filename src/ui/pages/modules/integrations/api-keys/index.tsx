// src/ui/pages/modules/integrations/api-keys/index.tsx
//
// API Keys — /app/integrations/api-keys
//
// Features:
//  - List API keys with name, prefix, scopes, last used, created by
//  - Create key: name + scope selection → show full key once on creation (never again)
//  - Revoke key (with confirmation)
//  - Copy key prefix / full key on creation
//  - Scope groups: read-only, read-write, admin
//  - Role-aware (CLIENT_USER = read only)

import { useState, useMemo, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Divider, FormControl, FormControlLabel,
  FormGroup, FormHelperText, IconButton, InputAdornment, Menu, MenuItem,
  Snackbar, Stack, Switch, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyIcon from '@mui/icons-material/Key';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { GlassCard } from '../../../../dashboard/GlassCard';
import { useAuth } from '../../../../../state/auth/useAuth';
import { Role } from '../../../../../types/auth';

// ─── API ──────────────────────────────────────────────────────────────────────

const API = () => (import.meta as any).env?.VITE_API_URL;
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

type ScopeId =
  | 'contacts:read' | 'contacts:write'
  | 'campaigns:read' | 'campaigns:write'
  | 'templates:read' | 'templates:write'
  | 'sending:read' | 'sending:write'
  | 'analytics:read'
  | 'webhooks:read' | 'webhooks:write'
  | 'admin';

type ApiKey = {
  id: string;
  name: string;
  prefix: string;          // e.g. "sk_live_xK9m"
  scopes: ScopeId[];
  createdBy: string;
  createdAt: string;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  active: boolean;
};

type KeyForm = {
  name: string;
  scopes: ScopeId[];
};

type FormErrors = Partial<Record<keyof KeyForm, string>>;

// ─── Scope catalogue ──────────────────────────────────────────────────────────

const SCOPE_GROUPS: { label: string; color: string; scopes: { id: ScopeId; desc: string }[] }[] = [
  {
    label: 'Contacts', color: '#6366f1',
    scopes: [
      { id: 'contacts:read', desc: 'List and retrieve contacts' },
      { id: 'contacts:write', desc: 'Create, update and delete contacts' },
    ],
  },
  {
    label: 'Campaigns', color: '#0ea5e9',
    scopes: [
      { id: 'campaigns:read', desc: 'List and retrieve campaigns' },
      { id: 'campaigns:write', desc: 'Create, update, send and delete campaigns' },
    ],
  },
  {
    label: 'Templates', color: '#8b5cf6',
    scopes: [
      { id: 'templates:read', desc: 'List and retrieve templates' },
      { id: 'templates:write', desc: 'Create, update and delete templates' },
    ],
  },
  {
    label: 'Sending', color: '#f97316',
    scopes: [
      { id: 'sending:read', desc: 'View sending domains and IP status' },
      { id: 'sending:write', desc: 'Manage sending domains, IPs, and webhooks' },
    ],
  },
  {
    label: 'Analytics', color: '#22c55e',
    scopes: [
      { id: 'analytics:read', desc: 'Read campaign and contact analytics' },
    ],
  },
  {
    label: 'Webhooks', color: '#ec4899',
    scopes: [
      { id: 'webhooks:read', desc: 'List webhook endpoints and delivery logs' },
      { id: 'webhooks:write', desc: 'Create, update and delete webhooks' },
    ],
  },
  {
    label: 'Admin', color: '#ef4444',
    scopes: [
      { id: 'admin', desc: 'Full access to all resources — use with caution' },
    ],
  },
];

const ALL_SCOPES: ScopeId[] = SCOPE_GROUPS.flatMap(g => g.scopes.map(s => s.id));

const SCOPE_COLOR: Record<ScopeId, string> = Object.fromEntries(
  SCOPE_GROUPS.flatMap(g => g.scopes.map(s => [s.id, g.color]))
) as Record<ScopeId, string>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateKeyPrefix(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return 'sk_live_' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateFullKey(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const suffix = Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}_${suffix}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtRelative(iso: string | null) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(iso);
}

function validateForm(form: KeyForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Key name is required';
  if (form.scopes.length === 0) errors.scopes = 'Select at least one scope';
  return errors;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_KEYS: ApiKey[] = [
  {
    id: 'key_01',
    name: 'Production — Zapier',
    prefix: 'sk_live_xK9m',
    scopes: ['contacts:read', 'contacts:write', 'campaigns:read'],
    createdBy: 'Alice Morgan',
    createdAt: '2025-02-14T10:00:00Z',
    lastUsedAt: '2025-07-15T08:44:00Z',
    lastUsedIp: '104.21.44.71',
    active: true,
  },
  {
    id: 'key_02',
    name: 'Analytics dashboard',
    prefix: 'sk_live_mP3n',
    scopes: ['analytics:read', 'campaigns:read', 'contacts:read'],
    createdBy: 'Bob Fletcher',
    createdAt: '2025-04-01T09:00:00Z',
    lastUsedAt: '2025-07-14T22:11:00Z',
    lastUsedIp: '172.67.32.18',
    active: true,
  },
  {
    id: 'key_03',
    name: 'CRM sync — HubSpot',
    prefix: 'sk_live_rQ7t',
    scopes: ['contacts:read', 'contacts:write', 'webhooks:read', 'webhooks:write'],
    createdBy: 'Alice Morgan',
    createdAt: '2025-05-20T11:00:00Z',
    lastUsedAt: '2025-07-15T07:02:00Z',
    lastUsedIp: '34.120.50.44',
    active: true,
  },
  {
    id: 'key_04',
    name: 'Internal admin script',
    prefix: 'sk_live_vW2k',
    scopes: ['admin'],
    createdBy: 'Alice Morgan',
    createdAt: '2025-01-08T08:00:00Z',
    lastUsedAt: '2025-06-30T14:00:00Z',
    lastUsedIp: '10.0.0.4',
    active: false,
  },
  {
    id: 'key_05',
    name: 'Mobile app — read only',
    prefix: 'sk_live_hB5s',
    scopes: ['contacts:read', 'campaigns:read', 'analytics:read'],
    createdBy: 'Kate Russo',
    createdAt: '2025-07-01T09:00:00Z',
    lastUsedAt: null,
    lastUsedIp: null,
    active: true,
  },
];

const EMPTY_FORM: KeyForm = { name: '', scopes: [] };

// ─── Scope chips ──────────────────────────────────────────────────────────────

function ScopeChip({ scope }: { scope: ScopeId }) {
  const color = SCOPE_COLOR[scope];
  return (
    <Chip label={scope} size="small"
      sx={{
        fontSize: 10, height: 18, fontWeight: 600, fontFamily: 'monospace',
        bgcolor: color + '18', color, border: `1px solid ${color}40`,
      }} />
  );
}

// ─── Create key dialog ────────────────────────────────────────────────────────

function CreateKeyDialog({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (key: ApiKey, fullKey: string) => void;
}) {
  const [step, setStep] = useState(0);   // 0 = form, 1 = reveal
  const [form, setForm] = useState<KeyForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState<{ key: ApiKey; full: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setStep(0); setForm(EMPTY_FORM); setErrors({});
    setNewKey(null); setCopied(false);
    onClose();
  };

  const toggleScope = (s: ScopeId) => {
    setForm(prev => ({
      ...prev,
      scopes: prev.scopes.includes(s)
        ? prev.scopes.filter(x => x !== s)
        : [...prev.scopes, s],
    }));
    setErrors(prev => ({ ...prev, scopes: undefined }));
  };

  const handleCreate = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);

    const prefix = generateKeyPrefix();
    const fullKey = generateFullKey(prefix);
    const now = new Date().toISOString();
    const key: ApiKey = {
      id: `key_${Date.now()}`,
      name: form.name.trim(),
      prefix,
      scopes: form.scopes,
      createdBy: 'You',
      createdAt: now,
      lastUsedAt: null,
      lastUsedIp: null,
      active: true,
    };

    try { await apiFetch('POST', '/api/integrations/api-keys', { name: key.name, scopes: key.scopes }); } catch { }
    setSaving(false);
    setNewKey({ key, full: fullKey });
    setStep(1);
    onCreated(key, fullKey);
  };

  const handleCopy = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey.full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: .5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {step === 0 ? 'Create API key' : '🔑 Save your API key'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {step === 0
                ? 'Give your key a name and choose which resources it can access'
                : 'Copy it now — you won\'t be able to see it again'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />

      {/* Step 0: form */}
      {step === 0 && (
        <>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={2.5}>
              <TextField
                label="Key name" placeholder="e.g. Production — Zapier"
                value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: undefined })); }}
                error={Boolean(errors.name)} helperText={errors.name ?? 'A human-readable label for this key'}
                fullWidth autoFocus />

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" fontWeight={700} color={errors.scopes ? 'error' : 'text.secondary'}
                    sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Permissions (scopes)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" sx={{ fontSize: 11, p: 0, textTransform: 'none' }}
                      onClick={() => setForm(p => ({ ...p, scopes: ALL_SCOPES }))}>All</Button>
                    <Button size="small" sx={{ fontSize: 11, p: 0, textTransform: 'none' }}
                      onClick={() => setForm(p => ({ ...p, scopes: [] }))}>None</Button>
                  </Box>
                </Box>
                {errors.scopes && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>{errors.scopes}</Typography>
                )}
                <Stack spacing={1.5}>
                  {SCOPE_GROUPS.map(g => (
                    <Box key={g.label}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: g.color }} />
                        <Typography variant="caption" fontWeight={700} color="text.secondary"
                          sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {g.label}
                        </Typography>
                      </Box>
                      <FormGroup>
                        {g.scopes.map(s => (
                          <FormControlLabel
                            key={s.id}
                            control={
                              <Switch size="small"
                                checked={form.scopes.includes(s.id)}
                                onChange={() => toggleScope(s.id)} />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{s.id}</Typography>
                                <Typography variant="caption" color="text.disabled">{s.desc}</Typography>
                              </Box>
                            }
                            sx={{ ml: 0, mb: 0.25 }}
                          />
                        ))}
                      </FormGroup>
                    </Box>
                  ))}
                </Stack>
              </Box>

              {form.scopes.includes('admin') && (
                <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ fontSize: 12 }}>
                  The <strong>admin</strong> scope grants full access to all resources. Only use this for trusted internal tools.
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={handleClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained" size="small" disabled={saving}
              startIcon={<KeyIcon fontSize="small" />}>
              {saving ? 'Creating…' : 'Create key'}
            </Button>
          </DialogActions>
        </>
      )}

      {/* Step 1: reveal */}
      {step === 1 && newKey && (
        <>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={2.5}>
              <Alert severity="warning" sx={{ fontSize: 13 }}>
                <strong>This is the only time you'll see this key.</strong> Copy it now and store it securely (e.g. in a password manager or environment variable). It cannot be retrieved later.
              </Alert>

              <Box sx={{ p: 2, bgcolor: '#0f172a', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{
                  fontFamily: 'monospace', fontSize: 12,
                  color: '#86efac', wordBreak: 'break-all', lineHeight: 1.7,
                }}>
                  {newKey.full}
                </Typography>
              </Box>

              <Button
                variant="contained"
                color={copied ? 'success' : 'primary'}
                startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                onClick={handleCopy}
                fullWidth>
                {copied ? 'Copied!' : 'Copy API key'}
              </Button>

              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}
                  sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Key summary
                </Typography>
                {[
                  { label: 'Name', value: newKey.key.name },
                  { label: 'Prefix', value: newKey.key.prefix + '_••••' },
                  { label: 'Scopes', value: newKey.key.scopes.join(', ') },
                ].map(r => (
                  <Box key={r.label} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ minWidth: 56 }}>{r.label}</Typography>
                    <Typography variant="caption" fontWeight={500} sx={{ fontFamily: r.label === 'Prefix' || r.label === 'Scopes' ? 'monospace' : 'inherit' }}>
                      {r.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} variant="contained" size="small" fullWidth>
              I've saved my key — close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

// ─── Revoke dialog ────────────────────────────────────────────────────────────

function RevokeDialog({ apiKey, onConfirm, onCancel }: {
  apiKey: ApiKey | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={Boolean(apiKey)} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>Revoke API key?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <strong>"{apiKey?.name}"</strong> (<code style={{ fontFamily: 'monospace' }}>{apiKey?.prefix}_••••</code>) will be permanently revoked.
          Any systems using this key will immediately lose access and cannot be restored — you'll need to create a new key.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined" size="small">Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error" size="small">Revoke key</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── IntegrationsApiKeysPage ──────────────────────────────────────────────────

export function IntegrationsApiKeysPage() {
  const { user } = useAuth();
  const canEdit = user?.role !== Role.CLIENT_USER;

  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [toRevoke, setToRevoke] = useState<ApiKey | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<{ el: HTMLElement; key: ApiKey } | null>(null);

  const displayed = useMemo(() => {
    const q = search.toLowerCase();
    return keys.filter(k =>
      k.name.toLowerCase().includes(q) ||
      k.prefix.toLowerCase().includes(q) ||
      k.scopes.some(s => s.includes(q))
    );
  }, [keys, search]);

  const handleCreated = useCallback((key: ApiKey) => {
    setKeys(prev => [key, ...prev]);
  }, []);

  const handleRevoke = useCallback(async () => {
    if (!toRevoke) return;
    try { await apiFetch('DELETE', `/api/integrations/api-keys/${toRevoke.id}`); } catch { }
    setKeys(prev => prev.filter(k => k.id !== toRevoke.id));
    setToRevoke(null);
    setSnack(`"${toRevoke.name}" has been revoked.`);
  }, [toRevoke]);

  const counts = useMemo(() => ({
    total: keys.length,
    active: keys.filter(k => k.active).length,
    unused: keys.filter(k => k.active && !k.lastUsedAt).length,
    admin: keys.filter(k => k.scopes.includes('admin')).length,
  }), [keys]);

  return (
    <Stack spacing={2.5}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>API keys</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage keys that allow external systems to access this tenant's resources via the REST API.
          </Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => setCreateOpen(true)}>
            Create key
          </Button>
        )}
      </Box>

      {/* Summary */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' } }}>
        {[
          { label: 'Active keys', value: counts.active, color: 'success.main' },
          { label: 'Total keys', value: counts.total, color: undefined },
          { label: 'Never used', value: counts.unused, color: counts.unused > 0 ? 'warning.main' : undefined },
          { label: 'Admin scope', value: counts.admin, color: counts.admin > 0 ? 'error.main' : undefined },
        ].map(s => (
          <GlassCard key={s.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={s.color ?? 'text.primary'} sx={{ mt: 0.5 }}>
              {s.value}
            </Typography>
          </GlassCard>
        ))}
      </Box>

      {/* Best-practice tip */}
      <Alert severity="info" sx={{ fontSize: 13 }}>
        <strong>Security tips:</strong> Use the minimum scopes needed. Rotate keys regularly. Never commit keys to source control — use environment variables instead.
      </Alert>

      {/* Search */}
      <TextField size="small" placeholder="Search by name, prefix or scope…" value={search}
        onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
        sx={{ maxWidth: 360 }} />

      {/* Table */}
      {displayed.length === 0 ? (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <KeyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No API keys found</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {search ? 'Try a different search term.' : 'Create your first API key to allow external access.'}
          </Typography>
          {canEdit && !search && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              Create key
            </Button>
          )}
        </GlassCard>
      ) : (
        <GlassCard sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                  <TableCell sx={{ pl: 2 }}>Name</TableCell>
                  <TableCell>Key prefix</TableCell>
                  <TableCell>Scopes</TableCell>
                  <TableCell>Created by</TableCell>
                  <TableCell align="right">Last used</TableCell>
                  <TableCell align="right">Created</TableCell>
                  <TableCell align="right">Status</TableCell>
                  {canEdit && <TableCell sx={{ pr: 1.5 }} />}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(k => (
                  <TableRow key={k.id} hover
                    sx={{
                      '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' },
                      opacity: k.active ? 1 : 0.55
                    }}>
                    <TableCell sx={{ pl: 2 }}>
                      <Typography variant="body2" fontWeight={600}>{k.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>
                          {k.prefix}_••••
                        </Typography>
                        <Tooltip title="Copy prefix">
                          <IconButton size="small" onClick={() => { navigator.clipboard.writeText(k.prefix); setSnack('Prefix copied.'); }}>
                            <ContentCopyIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {k.scopes.includes('admin')
                          ? <ScopeChip scope="admin" />
                          : k.scopes.slice(0, 3).map(s => <ScopeChip key={s} scope={s} />)}
                        {!k.scopes.includes('admin') && k.scopes.length > 3 && (
                          <Typography variant="caption" color="text.disabled">+{k.scopes.length - 3}</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{k.createdBy}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="caption" color={!k.lastUsedAt ? 'text.disabled' : 'text.secondary'}>
                          {fmtRelative(k.lastUsedAt)}
                        </Typography>
                        {k.lastUsedIp && (
                          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontFamily: 'monospace', fontSize: 10 }}>
                            {k.lastUsedIp}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">{fmtDate(k.createdAt)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={k.active ? 'Active' : 'Revoked'}
                        color={k.active ? 'success' : 'default'}
                        size="small" variant="outlined"
                        sx={{ fontSize: 10, height: 20 }} />
                    </TableCell>
                    {canEdit && (
                      <TableCell align="right" sx={{ pr: 1 }}>
                        {k.active && (
                          <Tooltip title="Revoke key">
                            <IconButton size="small" color="error" onClick={() => setToRevoke(k)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
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
          Showing {displayed.length} of {keys.length} keys
        </Typography>
      )}

      <CreateKeyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
      <RevokeDialog
        apiKey={toRevoke}
        onConfirm={handleRevoke}
        onCancel={() => setToRevoke(null)}
      />
      <Snackbar open={Boolean(snack)} autoHideDuration={3500} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnack(null)}>{snack}</Alert>
      </Snackbar>
    </Stack>
  );
}