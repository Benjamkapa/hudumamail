// src/ui/pages/modules/campaigns/ab-tests/index.tsx
import { useState, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Divider, FormControl, FormHelperText,
  IconButton, InputLabel, LinearProgress, MenuItem, Select,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ScienceIcon from '@mui/icons-material/Science';

import { GlassCard } from '../../../../dashboard/GlassCard';
import { useAuth } from '../../../../../state/auth/useAuth';
import { Role } from '../../../../../types/auth';

const BASE = () => (import.meta as any).env?.VITE_API_URL;

type ABStatus = 'draft' | 'running' | 'completed';

type ABTest = {
  id: number; name: string; listName: string; splitPct: number;
  status: ABStatus;
  variantA: { subject: string; openRate: number; sent: number };
  variantB: { subject: string; openRate: number; sent: number };
  winner: 'A' | 'B' | null; startedAt: string;
};

type ABForm = { name: string; listName: string; subjectA: string; subjectB: string; splitPct: string };
type Errors = Partial<Record<keyof ABForm, string>>;

const SEED: ABTest[] = [
  {
    id: 1, name: 'Subject line — Summer Sale', listName: 'All Subscribers', splitPct: 50, status: 'completed',
    variantA: { subject: '☀️ Summer deals — up to 50% off', openRate: 34.2, sent: 2105 },
    variantB: { subject: '🔥 Limited time: 50% off everything', openRate: 41.8, sent: 2105 },
    winner: 'B', startedAt: 'Jul 10, 2025'
  },
  {
    id: 2, name: 'From-name test — Newsletter', listName: 'Newsletter List', splitPct: 50, status: 'running',
    variantA: { subject: 'Weekly digest from Acme Team', openRate: 38.1, sent: 750 },
    variantB: { subject: 'Weekly digest from Alex @ Acme', openRate: 35.4, sent: 750 },
    winner: null, startedAt: 'Jul 14, 2025'
  },
  {
    id: 3, name: 'CTA test — Onboarding email', listName: 'New Signups', splitPct: 50, status: 'draft',
    variantA: { subject: 'Welcome — get started today', openRate: 0, sent: 0 },
    variantB: { subject: "Welcome — here's your first step", openRate: 0, sent: 0 },
    winner: null, startedAt: '—'
  },
];

const LISTS = ['All Subscribers', 'Active Users', 'Newsletter List', 'New Signups', 'VIP Customers'];
const EMPTY: ABForm = { name: '', listName: '', subjectA: '', subjectB: '', splitPct: '50' };
const STATUS_COLOR: Record<ABStatus, 'success' | 'info' | 'default'> = { completed: 'success', running: 'info', draft: 'default' };

function validate(f: ABForm): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = 'Required';
  if (!f.listName) e.listName = 'Select a list';
  if (!f.subjectA.trim()) e.subjectA = 'Required';
  if (!f.subjectB.trim()) e.subjectB = 'Required';
  else if (f.subjectA === f.subjectB) e.subjectB = 'Variants must differ';
  const pct = Number(f.splitPct);
  if (isNaN(pct) || pct < 10 || pct > 90) e.splitPct = 'Must be between 10 and 90';
  return e;
}

function ABModal({ open, onClose, onSaved }: {
  open: boolean; onClose: () => void;
  onSaved: (t: ABTest) => void;
}) {
  const [form, setForm] = useState<ABForm>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = useCallback((k: keyof ABForm, v: string) => {
    setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined }));
  }, []);

  const handleClose = () => { setForm(EMPTY); setErrors({}); onClose(); };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const res = await fetch(`${BASE()}/api/campaigns/ab-tests`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, splitPct: Number(form.splitPct), status: 'draft' }),
      });
      if (res.ok) { onSaved(await res.json()); handleClose(); setSaving(false); return; }
    } catch { }
    const fallback: ABTest = {
      id: Date.now(), name: form.name, listName: form.listName,
      splitPct: Number(form.splitPct), status: 'draft',
      variantA: { subject: form.subjectA, openRate: 0, sent: 0 },
      variantB: { subject: form.subjectB, openRate: 0, sent: 0 },
      winner: null, startedAt: '—',
    };
    onSaved(fallback);
    handleClose(); setSaving(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: .5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>New A/B test</Typography>
            <Typography variant="caption" color="text.secondary">Test two subject lines to find what works best</Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <TextField label="Test name" placeholder="e.g. Subject line test — July promo" autoFocus
            value={form.name} onChange={e => set('name', e.target.value)}
            error={Boolean(errors.name)} helperText={errors.name ?? 'Internal name for this test'} fullWidth />
          <FormControl fullWidth error={Boolean(errors.listName)}>
            <InputLabel>Contact list</InputLabel>
            <Select value={form.listName} label="Contact list" onChange={e => set('listName', e.target.value)}>
              {LISTS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </Select>
            <FormHelperText>{errors.listName ?? 'Both variants will be sent to this list'}</FormHelperText>
          </FormControl>
          <Box sx={{ p: 2, bgcolor: 'action.selected', borderRadius: 1.5 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Variants
            </Typography>
            <Stack spacing={2}>
              <TextField label="Variant A — subject line"
                value={form.subjectA} onChange={e => set('subjectA', e.target.value)}
                error={Boolean(errors.subjectA)} helperText={errors.subjectA} fullWidth size="small" />
              <TextField label="Variant B — subject line"
                value={form.subjectB} onChange={e => set('subjectB', e.target.value)}
                error={Boolean(errors.subjectB)} helperText={errors.subjectB} fullWidth size="small" />
            </Stack>
          </Box>
          <TextField label="Split percentage per variant"
            value={form.splitPct} onChange={e => set('splitPct', e.target.value)}
            type="number" inputProps={{ min: 10, max: 90 }}
            error={Boolean(errors.splitPct)} helperText={errors.splitPct ?? 'e.g. 50 = 50 / 50 split between A and B'}
            fullWidth />
          <Alert severity="info" sx={{ fontSize: 13 }}>
            The winning variant is determined by open rate. The remaining {100 - Number(form.splitPct || 0)}% of contacts will receive the winner after the test period.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={saving}
          startIcon={<ScienceIcon fontSize="small" />}>
          {saving ? 'Creating…' : 'Create A/B test'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function CampaignsAbTestsPage() {
  const { user } = useAuth();
  const canEdit = user?.role !== Role.CLIENT_USER;

  const [tests, setTests] = useState<ABTest[]>(SEED);
  const [modalOpen, setModalOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ABTest | null>(null);

  const handleSaved = useCallback((t: ABTest) => {
    setTests(prev => [t, ...prev]);
  }, []);

  const handleLaunch = useCallback(async (t: ABTest) => {
    try {
      const res = await fetch(`${BASE()}/api/campaigns/ab-tests/${t.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'running' }),
      });
      if (res.ok) { setTests(prev => prev.map(x => x.id === t.id ? { ...x, status: 'running', startedAt: new Date().toLocaleDateString() } : x)); return; }
    } catch { }
    setTests(prev => prev.map(x => x.id === t.id ? { ...x, status: 'running', startedAt: new Date().toLocaleDateString() } : x));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await fetch(`${BASE()}/api/campaigns/ab-tests/${toDelete.id}`, { method: 'DELETE', credentials: 'include' }); } catch { }
    setTests(prev => prev.filter(t => t.id !== toDelete.id));
    setToDelete(null);
  }, [toDelete]);

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>A/B Tests</Typography>
            <Chip label="Beta" size="small" sx={{ bgcolor: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 700, height: 20 }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Test subject lines and sender names to optimise open rates.
          </Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => setModalOpen(true)}>
            New A/B test
          </Button>
        )}
      </Box>

      <Alert severity="info" sx={{ fontSize: 13 }}>
        A/B tests split your audience to compare two variants. The winning variant is selected automatically by open rate after the test window.
      </Alert>

      {tests.length === 0 && (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <ScienceIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No A/B tests yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>Create your first test to start optimising campaigns.</Typography>
          {canEdit && <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1 }} onClick={() => setModalOpen(true)}>New A/B test</Button>}
        </GlassCard>
      )}

      {tests.map(test => (
        <GlassCard key={test.id} sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{test.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {test.listName} · {test.splitPct}/{100 - test.splitPct} split · Started {test.startedAt}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Chip label={test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                color={STATUS_COLOR[test.status]} size="small" variant="outlined" />
              {canEdit && test.status === 'draft' && (
                <Tooltip title="Launch test">
                  <IconButton size="small" color="primary" onClick={() => handleLaunch(test)}>
                    <PlayArrowIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canEdit && (
                <Tooltip title="Delete test">
                  <IconButton size="small" color="error" onClick={() => setToDelete(test)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {(['A', 'B'] as const).map(v => {
              const variant = v === 'A' ? test.variantA : test.variantB;
              const isWinner = test.winner === v;
              return (
                <Box key={v} sx={{ p: 2, borderRadius: 1.5, border: 2, borderColor: isWinner ? 'success.main' : 'divider', position: 'relative' }}>
                  {isWinner && (
                    <Chip label="Winner 🏆" color="success" size="small"
                      sx={{ position: 'absolute', top: -11, right: 10, fontSize: 10, height: 22 }} />
                  )}
                  <Typography variant="caption" fontWeight={700} color="text.secondary"
                    sx={{ letterSpacing: '0.08em' }}>
                    VARIANT {v}
                  </Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5, mb: 1.5 }}>
                    {variant.subject}
                  </Typography>
                  {variant.sent > 0 ? (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Open rate</Typography>
                        <Typography variant="caption" fontWeight={700}
                          color={isWinner ? 'success.main' : 'text.primary'}>
                          {variant.openRate}%
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={variant.openRate}
                        color={isWinner ? 'success' : 'primary'}
                        sx={{ height: 5, borderRadius: 2, mb: 0.75 }} />
                      <Typography variant="caption" color="text.disabled">
                        {variant.sent.toLocaleString()} recipients
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="caption" color="text.disabled" fontStyle="italic">
                      Not sent yet
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </GlassCard>
      ))}

      <ABModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={handleSaved} />

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete A/B test?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>"{toDelete?.name}"</strong> will be permanently deleted.
            {toDelete?.status === 'running' && ' The active test will be stopped immediately.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" size="small">Delete</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}