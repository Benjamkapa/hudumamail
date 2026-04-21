// src/ui/pages/modules/audience/suppression/index.tsx
//
// ─── WHAT IS A SUPPRESSION LIST? ─────────────────────────────────────────────
//
// A Suppression List is a set of email addresses that are PERMANENTLY EXCLUDED
// from every campaign sent through your account — no matter which list they
// are on, no matter which campaign you send.
//
// Contacts are added to suppression for 4 reasons:
//
//   UNSUBSCRIBED  → the contact clicked "unsubscribe" in an email.
//                   This is automatic and legally required (CAN-SPAM, GDPR).
//
//   BOUNCED       → the email address is invalid or the inbox is full.
//                   Hard bounces (invalid address) are auto-suppressed.
//                   Continuing to send to bounced addresses harms your
//                   sender reputation with ISPs.
//
//   COMPLAINT     → the contact marked your email as spam.
//                   ISPs (Gmail, Outlook) report this back via feedback loops.
//                   Complaint rates above 0.1% can get your account suspended.
//
//   MANUAL        → you explicitly suppressed the address yourself
//                   (e.g. a known bad address, a competitor, a test account).
//
// Why this matters for deliverability:
//   ISPs track your bounce rate and complaint rate.  If these are high,
//   your emails go to spam for EVERYONE, not just the problem addresses.
//   Keeping a clean suppression list protects your ability to reach inboxes.
//
// Actions:
//   Add manually    → POST   /api/contacts/suppression
//   Import list     → POST   /api/contacts/suppression/import
//   Remove (DANGER) → DELETE /api/contacts/suppression/:id
//     ⚠ Only remove if you have explicit re-opt-in consent.
//       Removing a suppression and emailing them again can result in
//       abuse complaints and account suspension.

import { useState, useCallback, useMemo } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Divider, IconButton, InputAdornment,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import UploadIcon from '@mui/icons-material/Upload';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { GlassCard } from '../../../../dashboard/GlassCard';
import { useAuth } from '../../../../../state/auth/useAuth';
import { Role } from '../../../../../types/auth';

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

type SuppressionReason = 'unsubscribed' | 'bounced' | 'complaint' | 'manual';

type Suppressed = {
  id: number; email: string;
  reason: SuppressionReason;
  addedAt: string; addedBy: string;
};

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: Suppressed[] = [
  { id: 1, email: 'nomore@example.com', reason: 'unsubscribed', addedAt: 'Jul 14, 2025', addedBy: 'Auto (unsubscribe link)' },
  { id: 2, email: 'optout@personal.net', reason: 'unsubscribed', addedAt: 'Jul 13, 2025', addedBy: 'Auto (unsubscribe link)' },
  { id: 3, email: 'bounce@fakeemail.io', reason: 'bounced', addedAt: 'Jul 12, 2025', addedBy: 'Auto (hard bounce)' },
  { id: 4, email: 'invalid@notreal.xyz', reason: 'bounced', addedAt: 'Jul 11, 2025', addedBy: 'Auto (hard bounce)' },
  { id: 5, email: 'spam@reporter.com', reason: 'complaint', addedAt: 'Jul 10, 2025', addedBy: 'Auto (spam complaint)' },
  { id: 6, email: 'junk@markasabuse.io', reason: 'complaint', addedAt: 'Jul 9, 2025', addedBy: 'Auto (spam complaint)' },
  { id: 7, email: 'competitor@rival.com', reason: 'manual', addedAt: 'Jul 8, 2025', addedBy: 'admin@acme.com' },
  { id: 8, email: 'test+seed@internal.com', reason: 'manual', addedAt: 'Jul 7, 2025', addedBy: 'admin@acme.com' },
];

const REASON_COLOR: Record<SuppressionReason, 'warning' | 'error' | 'default'> = {
  unsubscribed: 'warning', bounced: 'error', complaint: 'error', manual: 'default',
};

const REASON_DESCRIPTIONS: Record<SuppressionReason, string> = {
  unsubscribed: 'Contact clicked unsubscribe — legally cannot be emailed',
  bounced: 'Email address is invalid or unreachable (hard bounce)',
  complaint: 'Contact marked your email as spam — ISP feedback loop',
  manual: 'Manually suppressed by an account admin',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AudienceSuppressionPage() {
  const { user } = useAuth();
  const canEdit = user?.role !== Role.CLIENT_USER;

  const [items, setItems] = useState<Suppressed[]>(SEED);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toRemove, setToRemove] = useState<Suppressed | null>(null);

  const displayed = useMemo(() =>
    items.filter(i =>
      i.email.toLowerCase().includes(search.toLowerCase()) ||
      i.reason.includes(search.toLowerCase())
    ), [items, search]);

  const counts = {
    unsubscribed: items.filter(i => i.reason === 'unsubscribed').length,
    bounced: items.filter(i => i.reason === 'bounced').length,
    complaint: items.filter(i => i.reason === 'complaint').length,
    manual: items.filter(i => i.reason === 'manual').length,
  };

  const handleAdd = async () => {
    if (!emailInput.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setEmailError('Enter a valid email address');
      return;
    }
    if (items.some(i => i.email.toLowerCase() === emailInput.toLowerCase())) {
      setEmailError('This email is already suppressed');
      return;
    }
    setSaving(true);
    try {
      const created = await apiFetch('POST', '/api/contacts/suppression', { email: emailInput, reason: 'manual' }) as Suppressed;
      setItems(prev => [created, ...prev]);
    } catch {
      setItems(prev => [{
        id: Date.now(), email: emailInput, reason: 'manual',
        addedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        addedBy: user?.email ?? 'admin',
      }, ...prev]);
    } finally { setSaving(false); setEmailInput(''); setAddOpen(false); }
  };

  const handleRemove = useCallback(async () => {
    if (!toRemove) return;
    try { await apiFetch('DELETE', `/api/contacts/suppression/${toRemove.id}`); } catch { }
    setItems(prev => prev.filter(i => i.id !== toRemove.id));
    setToRemove(null);
  }, [toRemove]);

  return (
    <Stack spacing={2.5}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Suppression lists</Typography>
          <Typography variant="body2" color="text.secondary">
            Contacts permanently excluded from every campaign — unsubscribes, bounces, and complaints.
          </Typography>
        </Stack>
        {canEdit && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<UploadIcon />} component="label" sx={{ borderRadius: 1 }}>
              Import list
              <input type="file" accept=".csv,.txt" hidden onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData(); fd.append('file', file);
                try { await fetch(`${API()}/api/contacts/suppression/import`, { method: 'POST', credentials: 'include', body: fd }); } catch { }
                e.target.value = '';
              }} />
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
              onClick={() => { setEmailInput(''); setEmailError(''); setAddOpen(true); }}>
              Add email
            </Button>
          </Stack>
        )}
      </Box>

      {/* Warning */}
      <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ fontSize: 13 }}>
        <strong>Never remove suppressions without explicit re-opt-in consent.</strong> Emailing an unsubscribed or bounced address can result in spam complaints, blacklisting, and legal liability under CAN-SPAM and GDPR.
      </Alert>

      {/* Reason summary */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' } }}>
        {([
          { key: 'unsubscribed', label: 'Unsubscribed', color: 'warning.main' },
          { key: 'bounced', label: 'Bounced', color: 'error.main' },
          { key: 'complaint', label: 'Complaints', color: 'error.main' },
          { key: 'manual', label: 'Manual', color: 'text.primary' },
        ] as const).map(s => (
          <GlassCard key={s.key} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={s.color} sx={{ mt: 0.5 }}>
              {counts[s.key].toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, display: 'block', mt: 0.25 }}>
              {REASON_DESCRIPTIONS[s.key as SuppressionReason].split(' — ')[0]}
            </Typography>
          </GlassCard>
        ))}
      </Box>

      {/* Search */}
      <TextField size="small" placeholder="Search by email or reason…" value={search}
        onChange={e => setSearch(e.target.value)} sx={{ maxWidth: 340 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />

      {/* Empty */}
      {displayed.length === 0 && (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <BlockIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No suppressed addresses</Typography>
          <Typography variant="body2" color="text.secondary">
            {search ? 'No results for that search.' : 'Unsubscribes, bounces, and complaints will appear here automatically.'}
          </Typography>
        </GlassCard>
      )}

      {/* Table */}
      {displayed.length > 0 && (
        <GlassCard sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell>Email address</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Why</TableCell>
                  <TableCell>Added</TableCell>
                  <TableCell>Added by</TableCell>
                  {canEdit && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayed.map(i => (
                  <TableRow key={i.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                    <TableCell><Typography variant="body2">{i.email}</Typography></TableCell>
                    <TableCell>
                      <Chip label={i.reason} color={REASON_COLOR[i.reason]} size="small" variant="outlined"
                        sx={{ fontSize: 11, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {REASON_DESCRIPTIONS[i.reason]}
                      </Typography>
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{i.addedAt}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{i.addedBy}</Typography></TableCell>
                    {canEdit && (
                      <TableCell align="right">
                        <Tooltip title="Remove suppression — only if re-opt-in confirmed">
                          <Button size="small" color="error" variant="outlined" sx={{ fontSize: 11, borderRadius: 1 }}
                            onClick={() => setToRemove(i)}>
                            Remove
                          </Button>
                        </Tooltip>
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
          {displayed.length} of {items.length} suppressed addresses
        </Typography>
      )}

      {/* Add modal */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={800}>Suppress email address</Typography>
            <IconButton size="small" onClick={() => setAddOpen(false)}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <TextField label="Email address" type="email" autoFocus fullWidth size="small"
              placeholder="contact@example.com"
              value={emailInput} onChange={e => { setEmailInput(e.target.value); setEmailError(''); }}
              error={Boolean(emailError)} helperText={emailError} />
            <Alert severity="warning" sx={{ fontSize: 12 }}>
              This email will be permanently excluded from <strong>all future campaigns</strong>. Only use for addresses you have a legitimate reason to suppress.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setAddOpen(false)} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" size="small" disabled={saving}
            startIcon={<BlockIcon fontSize="small" />}>
            {saving ? 'Suppressing…' : 'Suppress email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove confirm */}
      <Dialog open={Boolean(toRemove)} onClose={() => setToRemove(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Remove suppression?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{toRemove?.email}</strong> will be allowed to receive campaigns again.
            <br /><br />
            <strong>⚠ Only proceed if you have explicit, documented re-opt-in consent from this person.</strong> Removing a suppression without consent can result in spam complaints, legal liability, and account suspension.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToRemove(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleRemove} variant="contained" color="error" size="small">
            Remove suppression
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}