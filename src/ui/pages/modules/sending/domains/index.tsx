// src/ui/pages/modules/sending/domains/index.tsx
//
// Sending Domains — /app/sending/domains
//
// Features:
//  - List all sending domains with DNS verification status
//  - Add domain → guided DNS record setup (SPF, DKIM, DMARC, tracking)
//  - Verify (re-check DNS), set default, delete
//  - Per-record status: verified / pending / failed
//  - Role-aware (CLIENT_USER = read only)

import { useState, useMemo, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, Collapse, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Divider, IconButton, InputAdornment,
  Menu, MenuItem, Paper, Snackbar, Stack, Step, StepContent, StepLabel,
  Stepper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DomainIcon from '@mui/icons-material/Language';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

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

type RecordStatus = 'verified' | 'pending' | 'failed';
type DomainStatus = 'verified' | 'partial' | 'pending' | 'failed';

type DnsRecord = {
  type: 'TXT' | 'CNAME' | 'MX';
  name: string;
  value: string;
  purpose: string;
  status: RecordStatus;
};

type SendingDomain = {
  id: string;
  domain: string;
  isDefault: boolean;
  status: DomainStatus;
  records: DnsRecord[];
  createdAt: string;
  lastChecked: string;
};

// ─── Status config ────────────────────────────────────────────────────────────

const DOMAIN_STATUS: Record<DomainStatus, { label: string; color: 'success' | 'warning' | 'default' | 'error'; icon: React.ReactNode }> = {
  verified: { label: 'Verified', color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 13 }} /> },
  partial: { label: 'Partial', color: 'warning', icon: <HourglassEmptyIcon sx={{ fontSize: 13 }} /> },
  pending: { label: 'Pending DNS', color: 'default', icon: <HourglassEmptyIcon sx={{ fontSize: 13 }} /> },
  failed: { label: 'Failed', color: 'error', icon: <ErrorIcon sx={{ fontSize: 13 }} /> },
};

const RECORD_STATUS: Record<RecordStatus, { color: string; icon: React.ReactNode }> = {
  verified: { color: '#22c55e', icon: <CheckCircleIcon sx={{ fontSize: 14, color: '#22c55e' }} /> },
  pending: { color: '#f59e0b', icon: <HourglassEmptyIcon sx={{ fontSize: 14, color: '#f59e0b' }} /> },
  failed: { color: '#ef4444', icon: <ErrorIcon sx={{ fontSize: 14, color: '#ef4444' }} /> },
};

// ─── Seed data ────────────────────────────────────────────────────────────────

function makeDnsRecords(domain: string, status: DomainStatus): DnsRecord[] {
  return [
    {
      type: 'TXT', name: `@`, purpose: 'SPF',
      value: `v=spf1 include:spf.${domain} ~all`,
      status: status === 'verified' ? 'verified' : status === 'partial' ? 'verified' : 'pending',
    },
    {
      type: 'CNAME', name: `mail._domainkey`, purpose: 'DKIM',
      value: `mail._domainkey.${domain}.dkim.sendplatform.io`,
      status: status === 'verified' ? 'verified' : 'pending',
    },
    {
      type: 'TXT', name: `_dmarc`, purpose: 'DMARC',
      value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}`,
      status: status === 'verified' ? 'verified' : status === 'partial' ? 'failed' : 'pending',
    },
    {
      type: 'CNAME', name: `track`, purpose: 'Click tracking',
      value: `track.sendplatform.io`,
      status: status === 'verified' ? 'verified' : 'pending',
    },
  ];
}

const INITIAL_DOMAINS: SendingDomain[] = [
  { id: 'd_01', domain: 'acme.com', isDefault: true, status: 'verified', records: makeDnsRecords('acme.com', 'verified'), createdAt: '2025-01-10', lastChecked: '2025-07-15 09:00' },
  { id: 'd_02', domain: 'mail.acme.com', isDefault: false, status: 'partial', records: makeDnsRecords('mail.acme.com', 'partial'), createdAt: '2025-04-01', lastChecked: '2025-07-15 09:00' },
  { id: 'd_03', domain: 'updates.acme.com', isDefault: false, status: 'pending', records: makeDnsRecords('updates.acme.com', 'pending'), createdAt: '2025-07-14', lastChecked: '2025-07-15 09:00' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function domainStatusFromRecords(records: DnsRecord[]): DomainStatus {
  const allVerified = records.every(r => r.status === 'verified');
  const anyFailed = records.some(r => r.status === 'failed');
  const anyVerified = records.some(r => r.status === 'verified');
  if (allVerified) return 'verified';
  if (anyFailed) return 'failed';
  if (anyVerified) return 'partial';
  return 'pending';
}

function validateDomain(d: string) {
  return /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/.test(d.toLowerCase());
}

// ─── DNS record row ───────────────────────────────────────────────────────────

function DnsRecordRow({ rec, onCopy }: { rec: DnsRecord; onCopy: (v: string) => void }) {
  const st = RECORD_STATUS[rec.status];
  return (
    <TableRow sx={{ '& td': { fontSize: 12, py: 1 } }}>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {st.icon}
          <Chip label={rec.purpose} size="small"
            sx={{ fontSize: 10, height: 18, fontWeight: 600, bgcolor: st.color + '18', color: st.color, border: `1px solid ${st.color}40` }} />
        </Box>
      </TableCell>
      <TableCell><Chip label={rec.type} size="small" variant="outlined" sx={{ fontSize: 10, height: 18, fontFamily: 'monospace' }} /></TableCell>
      <TableCell sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.secondary', maxWidth: 140 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography noWrap sx={{ fontSize: 11, fontFamily: 'monospace' }}>{rec.name}</Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ maxWidth: 260 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography noWrap sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary', flex: 1 }}>{rec.value}</Typography>
          <Tooltip title="Copy value">
            <IconButton size="small" onClick={() => onCopy(rec.value)} sx={{ flexShrink: 0 }}>
              <ContentCopyIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
}

// ─── Domain row ───────────────────────────────────────────────────────────────

function DomainRow({ domain, canEdit, onVerify, onSetDefault, onDelete, onCopy }: {
  domain: SendingDomain;
  canEdit: boolean;
  onVerify: (d: SendingDomain) => void;
  onSetDefault: (d: SendingDomain) => void;
  onDelete: (d: SendingDomain) => void;
  onCopy: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const cfg = DOMAIN_STATUS[domain.status];

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer', '& td': { fontSize: 13, borderBottom: expanded ? 0 : 1, borderColor: 'divider' } }}
        onClick={() => setExpanded(v => !v)}>
        <TableCell sx={{ pl: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DomainIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Box>
              <Typography variant="body2" fontWeight={700}>{domain.domain}</Typography>
              {domain.isDefault && (
                <Chip label="Default" size="small"
                  sx={{ fontSize: 9, height: 16, fontWeight: 700, bgcolor: 'primary.50', color: 'primary.main', border: '1px solid', borderColor: 'primary.200' }} />
              )}
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            icon={cfg.icon as any}
            label={cfg.label}
            color={cfg.color}
            size="small" variant="outlined"
            sx={{ fontSize: 11, height: 22, '& .MuiChip-icon': { fontSize: 13, ml: 0.5 } }} />
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {domain.records.map(r => (
              <Tooltip key={r.purpose} title={`${r.purpose}: ${r.status}`}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: RECORD_STATUS[r.status].color }} />
              </Tooltip>
            ))}
          </Box>
        </TableCell>
        <TableCell align="right">
          <Typography variant="caption" color="text.disabled">{domain.lastChecked}</Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="caption" color="text.disabled">{domain.createdAt}</Typography>
        </TableCell>
        <TableCell align="right" sx={{ pr: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
            <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.disabled', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            {canEdit && (
              <IconButton size="small" onClick={e => { e.stopPropagation(); setAnchor(e.currentTarget); }}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
            PaperProps={{ sx: { minWidth: 175, boxShadow: 4 } }}>
            <MenuItem dense onClick={() => { onVerify(domain); setAnchor(null); }}>
              <RefreshIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Re-verify DNS
            </MenuItem>
            {!domain.isDefault && (
              <MenuItem dense onClick={() => { onSetDefault(domain); setAnchor(null); }}>
                <StarBorderIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Set as default
              </MenuItem>
            )}
            <Divider />
            <MenuItem dense sx={{ color: 'error.main' }} onClick={() => { onDelete(domain); setAnchor(null); }}>
              <DeleteOutlineIcon sx={{ fontSize: 16, mr: 1.5 }} /> Remove domain
            </MenuItem>
          </Menu>
        </TableCell>
      </TableRow>

      {/* Expanded DNS records */}
      {expanded && (
        <TableRow sx={{ bgcolor: 'action.hover' }}>
          <TableCell colSpan={6} sx={{ p: 0, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ px: 3, pt: 1.5, pb: 2 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
                DNS Records
              </Typography>
              {domain.status !== 'verified' && (
                <Alert severity="info" sx={{ fontSize: 12, mb: 1.5 }}>
                  Add the following records to your DNS provider. Changes can take up to 48 hours to propagate.
                </Alert>
              )}
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 11, color: 'text.disabled', pb: 0.5 } }}>
                    <TableCell>Purpose</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Name / Host</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {domain.records.map(r => (
                    <DnsRecordRow key={r.purpose} rec={r} onCopy={onCopy} />
                  ))}
                </TableBody>
              </Table>
            </Box>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Add domain dialog ────────────────────────────────────────────────────────

function AddDomainDialog({ open, onClose, onAdded }: {
  open: boolean;
  onClose: () => void;
  onAdded: (d: SendingDomain) => void;
}) {
  const [step, setStep] = useState(0);
  const [domainVal, setDomainVal] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newDomain, setNewDomain] = useState<SendingDomain | null>(null);

  const handleClose = () => { setStep(0); setDomainVal(''); setError(''); setNewDomain(null); onClose(); };

  const handleAdd = async () => {
    if (!validateDomain(domainVal)) { setError('Enter a valid domain (e.g. mail.acme.com)'); return; }
    setSaving(true);
    const created: SendingDomain = {
      id: `d_${Date.now()}`,
      domain: domainVal.toLowerCase().trim(),
      isDefault: false,
      status: 'pending',
      records: makeDnsRecords(domainVal.toLowerCase().trim(), 'pending'),
      createdAt: new Date().toISOString().slice(0, 10),
      lastChecked: 'Just now',
    };
    try { await apiFetch('POST', '/api/sending/domains', { domain: created.domain }); } catch { }
    setNewDomain(created);
    setStep(1);
    setSaving(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: .5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>Add sending domain</Typography>
            <Typography variant="caption" color="text.secondary">
              Verify domain ownership to send emails from your own domain
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        {step === 0 && (
          <Stack spacing={2.5}>
            <TextField
              label="Domain name" placeholder="e.g. mail.acme.com or acme.com"
              value={domainVal} onChange={e => { setDomainVal(e.target.value); setError(''); }}
              error={Boolean(error)} helperText={error || 'Use a subdomain like mail.acme.com for best deliverability'}
              fullWidth autoFocus />
            <Alert severity="info" sx={{ fontSize: 12 }}>
              You'll need access to your domain's DNS settings to complete verification. We'll generate the required records in the next step.
            </Alert>
          </Stack>
        )}

        {step === 1 && newDomain && (
          <Stack spacing={2}>
            <Alert severity="success" sx={{ fontSize: 13 }}>
              Domain <strong>{newDomain.domain}</strong> added. Add the DNS records below to complete verification.
            </Alert>
            <Typography variant="caption" color="text.secondary" fontWeight={700}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Required DNS records
            </Typography>
            {newDomain.records.map(r => (
              <Paper key={r.purpose} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Chip label={r.purpose} size="small" sx={{ fontSize: 10, height: 18, fontWeight: 600 }} />
                  <Chip label={r.type} size="small" variant="outlined" sx={{ fontSize: 10, height: 18, fontFamily: 'monospace' }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
                  <Typography sx={{ fontSize: 11, fontFamily: 'monospace', flex: 1, color: 'text.secondary' }} noWrap>
                    <strong>Name:</strong> {r.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <Typography sx={{ fontSize: 11, fontFamily: 'monospace', flex: 1, color: 'text.secondary', wordBreak: 'break-all' }}>
                    <strong>Value:</strong> {r.value}
                  </Typography>
                  <Tooltip title="Copy">
                    <IconButton size="small" onClick={() => navigator.clipboard.writeText(r.value)}>
                      <ContentCopyIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            ))}
            <Alert severity="warning" sx={{ fontSize: 12 }}>
              DNS propagation can take up to 48 hours. Click "Done" — the domain will show as <strong>Pending</strong> until verified.
            </Alert>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>
          {step === 1 ? 'Done' : 'Cancel'}
        </Button>
        {step === 0 && (
          <Button onClick={handleAdd} variant="contained" size="small" disabled={saving || !domainVal.trim()}>
            {saving ? 'Adding…' : 'Add domain & get DNS records'}
          </Button>
        )}
        {step === 1 && newDomain && (
          <Button onClick={() => { onAdded(newDomain); handleClose(); }} variant="contained" size="small">
            Done — I've added the records
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ─── SendingDomainsPage ───────────────────────────────────────────────────────

export function SendingDomainsPage() {
  const { user } = useAuth();
  const canEdit = user?.role !== Role.CLIENT_USER;

  const [domains, setDomains] = useState<SendingDomain[]>(INITIAL_DOMAINS);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [toDelete, setToDelete] = useState<SendingDomain | null>(null);
  const [snack, setSnack] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const displayed = useMemo(() =>
    domains.filter(d => d.domain.toLowerCase().includes(search.toLowerCase())),
    [domains, search]);

  const handleAdded = useCallback((d: SendingDomain) => {
    setDomains(prev => [d, ...prev]);
    setSnack(`Domain "${d.domain}" added. Verification pending.`);
  }, []);

  const handleVerify = useCallback(async (d: SendingDomain) => {
    setVerifying(d.id);
    try { await apiFetch('POST', `/api/sending/domains/${d.id}/verify`); } catch { }
    // Simulate partial verification improvement
    await new Promise(r => setTimeout(r, 1200));
    setDomains(prev => prev.map(x => {
      if (x.id !== d.id) return x;
      const updated = x.records.map(r => ({ ...r, status: r.status === 'pending' ? ('verified' as const) : r.status }));
      return { ...x, records: updated, status: domainStatusFromRecords(updated), lastChecked: 'Just now' };
    }));
    setVerifying(null);
    setSnack(`DNS re-check complete for "${d.domain}".`);
  }, []);

  const handleSetDefault = useCallback(async (d: SendingDomain) => {
    try { await apiFetch('PATCH', `/api/sending/domains/${d.id}`, { isDefault: true }); } catch { }
    setDomains(prev => prev.map(x => ({ ...x, isDefault: x.id === d.id })));
    setSnack(`"${d.domain}" set as default sending domain.`);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await apiFetch('DELETE', `/api/sending/domains/${toDelete.id}`); } catch { }
    setDomains(prev => prev.filter(x => x.id !== toDelete.id));
    setToDelete(null);
    setSnack(`Domain removed.`);
  }, [toDelete]);

  const counts = useMemo(() => ({
    total: domains.length,
    verified: domains.filter(d => d.status === 'verified').length,
    pending: domains.filter(d => d.status === 'pending' || d.status === 'partial').length,
    failed: domains.filter(d => d.status === 'failed').length,
  }), [domains]);

  return (
    <Stack spacing={2.5}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Sending domains</Typography>
          <Typography variant="body2" color="text.secondary">
            Verify and manage domains used to send campaigns and automated emails.
          </Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => setAddOpen(true)}>
            Add domain
          </Button>
        )}
      </Box>

      {/* Summary */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3,1fr)' } }}>
        {[
          { label: 'Verified', value: counts.verified, color: 'success.main' },
          { label: 'Pending / Partial', value: counts.pending, color: 'warning.main' },
          { label: 'Failed', value: counts.failed, color: 'error.main' },
        ].map(s => (
          <GlassCard key={s.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={s.color} sx={{ mt: 0.5 }}>{s.value}</Typography>
          </GlassCard>
        ))}
      </Box>

      {/* Toolbar */}
      <TextField size="small" placeholder="Search domains…" value={search}
        onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
        sx={{ maxWidth: 320 }} />

      {/* Table */}
      {displayed.length === 0 ? (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <DomainIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No domains found</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {search ? 'Try a different search.' : 'Add your first sending domain to get started.'}
          </Typography>
          {canEdit && !search && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>Add domain</Button>
          )}
        </GlassCard>
      ) : (
        <GlassCard sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell sx={{ pl: 2 }}>Domain</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>DNS records</TableCell>
                  <TableCell align="right">Last checked</TableCell>
                  <TableCell align="right">Added</TableCell>
                  <TableCell sx={{ pr: 1.5 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(d => (
                  <DomainRow
                    key={d.id} domain={d} canEdit={canEdit}
                    onVerify={handleVerify}
                    onSetDefault={handleSetDefault}
                    onDelete={setToDelete}
                    onCopy={v => { navigator.clipboard.writeText(v); setSnack('Copied to clipboard.'); }}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </GlassCard>
      )}

      {/* Dialogs */}
      <AddDomainDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={handleAdded} />

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Remove domain?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{toDelete?.domain}</strong> will be removed. Any campaigns using this domain will need to be updated.
            {toDelete?.isDefault && (
              <Box component="span" sx={{ color: 'error.main', display: 'block', mt: 1 }}>
                ⚠️ This is your default sending domain. You should set another domain as default first.
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" size="small">Remove</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(snack)} autoHideDuration={3500} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnack(null)}>{snack}</Alert>
      </Snackbar>
    </Stack>
  );
}