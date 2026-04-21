// src/ui/pages/modules/sending/warming/index.tsx
//
// IP Warming — /app/sending/warming
//
// Features:
//  - Active warm-up plans per IP with day-by-day ramp schedule
//  - Progress bar showing current day vs. total warm-up period
//  - Daily send limit, actual sent, and health status per day
//  - Start / pause / reset warm-up plan
//  - Add IP to warming pool
//  - Inline guidance on what IP warming is and why it matters

import { useState, useMemo, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Divider, IconButton, LinearProgress,
  Menu, MenuItem, Snackbar, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { GlassCard } from '../../../../dashboard/GlassCard';
import { useAuth } from '../../../../../state/auth/useAuth';
import { Role } from '../../../../../types/auth';

const API = () => (import.meta as any).env?.VITE_API_URL;
async function apiFetch(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API()}${path}`, { method, credentials: 'include', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(res.statusText);
  if (res.status === 204) return undefined;
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

type WarmingStatus = 'active' | 'paused' | 'completed' | 'pending';

type WarmingDay = {
  day: number;
  limit: number;        // emails allowed that day
  sent: number;         // actual sent (0 = future)
  bounceRate?: number;  // % — shown for past days
  openRate?: number;
};

type WarmingPlan = {
  id: string;
  ipAddress: string;
  label: string;
  status: WarmingStatus;
  currentDay: number;
  totalDays: number;
  schedule: WarmingDay[];
  startedAt: string;
  estimatedCompletion: string;
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<WarmingStatus, { label: string; color: 'success' | 'warning' | 'default' | 'info'; icon: React.ReactNode }> = {
  active: { label: 'Active', color: 'success', icon: <LocalFireDepartmentIcon sx={{ fontSize: 13 }} /> },
  paused: { label: 'Paused', color: 'warning', icon: <PauseCircleIcon sx={{ fontSize: 13 }} /> },
  completed: { label: 'Completed', color: 'info', icon: <CheckCircleIcon sx={{ fontSize: 13 }} /> },
  pending: { label: 'Pending', color: 'default', icon: <TrendingUpIcon sx={{ fontSize: 13 }} /> },
};

// ─── Seed — standard 30-day ramp schedule ─────────────────────────────────────

function buildSchedule(currentDay: number): WarmingDay[] {
  const limits = [
    200, 500, 1_000, 2_000, 5_000,
    10_000, 20_000, 40_000, 70_000, 100_000,
    150_000, 200_000, 250_000, 300_000, 350_000,
    400_000, 450_000, 500_000, 550_000, 600_000,
    650_000, 700_000, 750_000, 800_000, 850_000,
    900_000, 950_000, 1_000_000, 1_000_000, 1_000_000,
  ];
  return limits.map((limit, i) => {
    const day = i + 1;
    const isPast = day < currentDay;
    const isToday = day === currentDay;
    return {
      day,
      limit,
      sent: isPast ? Math.floor(limit * (0.85 + Math.random() * 0.14)) : isToday ? Math.floor(limit * 0.6) : 0,
      bounceRate: isPast ? parseFloat((Math.random() * 0.8).toFixed(2)) : undefined,
      openRate: isPast ? parseFloat((18 + Math.random() * 14).toFixed(1)) : undefined,
    };
  });
}

const INITIAL_PLANS: WarmingPlan[] = [
  {
    id: 'wp_01', ipAddress: '198.51.100.42', label: 'Primary IP',
    status: 'active', currentDay: 14, totalDays: 30,
    schedule: buildSchedule(14),
    startedAt: '2025-07-01', estimatedCompletion: '2025-07-30',
  },
  {
    id: 'wp_02', ipAddress: '203.0.113.17', label: 'Secondary IP',
    status: 'paused', currentDay: 6, totalDays: 30,
    schedule: buildSchedule(6),
    startedAt: '2025-07-09', estimatedCompletion: '2025-08-07',
  },
  {
    id: 'wp_03', ipAddress: '192.0.2.88', label: 'Bulk IP',
    status: 'completed', currentDay: 30, totalDays: 30,
    schedule: buildSchedule(30),
    startedAt: '2025-06-01', estimatedCompletion: '2025-06-30',
  },
];

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ─── Schedule mini-chart ──────────────────────────────────────────────────────

function ScheduleChart({ plan }: { plan: WarmingPlan }) {
  const visible = plan.schedule.slice(0, plan.currentDay + 2); // past + today + 2 future
  const max = Math.max(...visible.map(d => d.limit));
  return (
    <Box sx={{ display: 'flex', gap: 0.3, alignItems: 'flex-end', height: 36, mt: 1 }}>
      {visible.map(d => {
        const h = Math.max(4, (d.limit / max) * 36);
        const past = d.day < plan.currentDay;
        const today = d.day === plan.currentDay;
        return (
          <Tooltip key={d.day} title={`Day ${d.day}: ${fmtNum(d.limit)} limit${d.sent > 0 ? ` · ${fmtNum(d.sent)} sent` : ''}`}>
            <Box sx={{
              width: 6, height: h, borderRadius: 0.5, flexShrink: 0,
              bgcolor: today ? 'primary.main' : past ? 'success.light' : 'action.selected',
              opacity: today ? 1 : past ? 0.8 : 0.4,
            }} />
          </Tooltip>
        );
      })}
    </Box>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, canEdit, onToggle, onDelete }: {
  plan: WarmingPlan;
  canEdit: boolean;
  onToggle: (p: WarmingPlan) => void;
  onDelete: (p: WarmingPlan) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const cfg = STATUS_CFG[plan.status];
  const progress = Math.round((plan.currentDay / plan.totalDays) * 100);
  const today = plan.schedule[plan.currentDay - 1];

  return (
    <GlassCard sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
            <Typography variant="subtitle2" fontWeight={800}>{plan.ipAddress}</Typography>
            <Typography variant="caption" color="text.disabled">·</Typography>
            <Typography variant="caption" color="text.secondary">{plan.label}</Typography>
          </Box>
          <Chip
            icon={cfg.icon as any}
            label={cfg.label}
            color={cfg.color} size="small" variant="outlined"
            sx={{ fontSize: 11, height: 22, '& .MuiChip-icon': { fontSize: 13, ml: 0.5 } }} />
        </Box>
        {canEdit && (
          <IconButton size="small" onClick={e => setAnchor(e.currentTarget)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        )}
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
          PaperProps={{ sx: { minWidth: 175, boxShadow: 4 } }}>
          {plan.status !== 'completed' && (
            <MenuItem dense onClick={() => { onToggle(plan); setAnchor(null); }}>
              {plan.status === 'active'
                ? <><PauseCircleIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Pause warming</>
                : <><PlayCircleIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Resume warming</>}
            </MenuItem>
          )}
          <Divider />
          <MenuItem dense sx={{ color: 'error.main' }} onClick={() => { onDelete(plan); setAnchor(null); }}>
            <DeleteOutlineIcon sx={{ fontSize: 16, mr: 1.5 }} /> Remove plan
          </MenuItem>
        </Menu>
      </Box>

      {/* Progress */}
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Day {plan.currentDay} of {plan.totalDays}
          </Typography>
          <Typography variant="caption" color="text.secondary">{progress}% complete</Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress}
          color={plan.status === 'completed' ? 'success' : plan.status === 'paused' ? 'warning' : 'primary'}
          sx={{ height: 6, borderRadius: 1 }} />
      </Box>

      {/* Today stats */}
      {today && plan.status !== 'completed' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mt: 2 }}>
          {[
            { label: "Today's limit", value: fmtNum(today.limit) },
            { label: 'Sent today', value: today.sent > 0 ? fmtNum(today.sent) : '—' },
            { label: 'Est. done', value: plan.estimatedCompletion },
          ].map(s => (
            <Box key={s.label}>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: 10 }}>{s.label}</Typography>
              <Typography variant="body2" fontWeight={700}>{s.value}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {plan.status === 'completed' && (
        <Box sx={{ mt: 1.5 }}>
          <Alert severity="success" sx={{ fontSize: 12, py: 0.5 }}>
            Warm-up complete. This IP is ready for full-volume sending.
          </Alert>
        </Box>
      )}

      {/* Mini chart */}
      <ScheduleChart plan={plan} />

      {/* Expand schedule */}
      <Button size="small" endIcon={<MoreVertIcon sx={{ fontSize: 14 }} />}
        onClick={() => setExpanded(v => !v)}
        sx={{ mt: 1.5, fontSize: 11, color: 'text.secondary', p: 0, minWidth: 0, textTransform: 'none' }}>
        {expanded ? 'Hide' : 'View'} full schedule
      </Button>

      {expanded && (
        <Box sx={{ mt: 1.5, maxHeight: 260, overflow: 'auto', borderRadius: 1, border: 1, borderColor: 'divider' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 11, color: 'text.disabled', bgcolor: 'background.paper' } }}>
                <TableCell>Day</TableCell>
                <TableCell align="right">Limit</TableCell>
                <TableCell align="right">Sent</TableCell>
                <TableCell align="right">Open rate</TableCell>
                <TableCell align="right">Bounce rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plan.schedule.map(d => {
                const isToday = d.day === plan.currentDay;
                const isPast = d.day < plan.currentDay;
                return (
                  <TableRow key={d.day} sx={{
                    bgcolor: isToday ? 'primary.50' : 'transparent',
                    '& td': { fontSize: 12, borderBottom: 1, borderColor: 'divider' },
                  }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {isToday && <LocalFireDepartmentIcon sx={{ fontSize: 12, color: 'primary.main' }} />}
                        <Typography variant="caption" fontWeight={isToday ? 700 : 400}>
                          Day {d.day}{isToday ? ' (today)' : ''}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right"><Typography variant="caption">{fmtNum(d.limit)}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color={d.sent > 0 ? 'text.primary' : 'text.disabled'}>
                        {d.sent > 0 ? fmtNum(d.sent) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color={d.openRate ? 'success.main' : 'text.disabled'}>
                        {d.openRate ? `${d.openRate}%` : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption"
                        color={d.bounceRate != null ? (d.bounceRate > 0.5 ? 'error.main' : 'text.secondary') : 'text.disabled'}>
                        {d.bounceRate != null ? `${d.bounceRate}%` : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
    </GlassCard>
  );
}

// ─── Add IP dialog ────────────────────────────────────────────────────────────

function AddIpDialog({ open, onClose, onAdded }: {
  open: boolean; onClose: () => void;
  onAdded: (p: WarmingPlan) => void;
}) {
  const [ip, setIp] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip.trim())) { setError('Enter a valid IPv4 address'); return; }
    setSaving(true);
    const plan: WarmingPlan = {
      id: `wp_${Date.now()}`,
      ipAddress: ip.trim(),
      label: label.trim() || 'New IP',
      status: 'active',
      currentDay: 1,
      totalDays: 30,
      schedule: buildSchedule(1),
      startedAt: new Date().toISOString().slice(0, 10),
      estimatedCompletion: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    };
    try { await apiFetch('POST', '/api/sending/warming', { ipAddress: ip, label }); } catch { }
    setSaving(false);
    onAdded(plan);
    setIp(''); setLabel(''); setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: .5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>Add IP to warming</Typography>
            <Typography variant="caption" color="text.secondary">Start a 30-day ramp-up schedule</Typography>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <TextField label="IP address" placeholder="e.g. 198.51.100.42" value={ip}
            onChange={e => { setIp(e.target.value); setError(''); }}
            error={Boolean(error)} helperText={error} fullWidth autoFocus />
          <TextField label="Label (optional)" placeholder="e.g. Primary IP, Bulk IP"
            value={label} onChange={e => setLabel(e.target.value)} fullWidth />
          <Alert severity="info" sx={{ fontSize: 12 }}>
            The standard warm-up schedule ramps from <strong>200 emails/day</strong> on day 1 to <strong>1M/day</strong> by day 30. Actual sends are throttled automatically.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
        <Button onClick={handleAdd} variant="contained" size="small" disabled={saving || !ip.trim()}>
          {saving ? 'Adding…' : 'Start warm-up'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── SendingWarmingPage ───────────────────────────────────────────────────────

export function SendingWarmingPage() {
  const { user } = useAuth();
  const canEdit = user?.role !== Role.CLIENT_USER;

  const [plans, setPlans] = useState<WarmingPlan[]>(INITIAL_PLANS);
  const [addOpen, setAddOpen] = useState(false);
  const [toDelete, setToDelete] = useState<WarmingPlan | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const handleToggle = useCallback(async (p: WarmingPlan) => {
    const next: WarmingStatus = p.status === 'active' ? 'paused' : 'active';
    try { await apiFetch('PATCH', `/api/sending/warming/${p.id}`, { status: next }); } catch { }
    setPlans(prev => prev.map(x => x.id === p.id ? { ...x, status: next } : x));
    setSnack(`Warm-up ${next === 'active' ? 'resumed' : 'paused'} for ${p.ipAddress}.`);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await apiFetch('DELETE', `/api/sending/warming/${toDelete.id}`); } catch { }
    setPlans(prev => prev.filter(x => x.id !== toDelete.id));
    setToDelete(null);
    setSnack('Warming plan removed.');
  }, [toDelete]);

  const counts = useMemo(() => ({
    active: plans.filter(p => p.status === 'active').length,
    paused: plans.filter(p => p.status === 'paused').length,
    completed: plans.filter(p => p.status === 'completed').length,
  }), [plans]);

  return (
    <Stack spacing={2.5}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>IP warming</Typography>
          <Typography variant="body2" color="text.secondary">
            Gradually ramp up sending volume to build IP reputation and maximise deliverability.
          </Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => setAddOpen(true)}>
            Add IP
          </Button>
        )}
      </Box>

      {/* What is IP warming */}
      <Alert severity="info" icon={<LocalFireDepartmentIcon />} sx={{ fontSize: 13 }}>
        <strong>What is IP warming?</strong> New sending IPs have no reputation with inbox providers.
        Sending large volumes immediately triggers spam filters. A warm-up plan gradually increases
        your daily send limit over 30 days, building trust with Gmail, Outlook, Yahoo, and others.
      </Alert>

      {/* Summary */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3,1fr)' } }}>
        {[
          { label: 'Active warm-ups', value: counts.active, color: 'success.main' },
          { label: 'Paused', value: counts.paused, color: 'warning.main' },
          { label: 'Completed IPs', value: counts.completed, color: 'info.main' },
        ].map(s => (
          <GlassCard key={s.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={s.color} sx={{ mt: 0.5 }}>{s.value}</Typography>
          </GlassCard>
        ))}
      </Box>

      {/* Plans grid */}
      {plans.length === 0 ? (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <LocalFireDepartmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No warming plans</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Add an IP address to begin a 30-day warm-up schedule.
          </Typography>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>Add IP</Button>
          )}
        </GlassCard>
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)', xl: 'repeat(3,1fr)' } }}>
          {plans.map(p => (
            <PlanCard key={p.id} plan={p} canEdit={canEdit} onToggle={handleToggle} onDelete={setToDelete} />
          ))}
        </Box>
      )}

      {/* Dialogs */}
      <AddIpDialog open={addOpen} onClose={() => setAddOpen(false)}
        onAdded={p => { setPlans(prev => [p, ...prev]); setSnack(`Warm-up started for ${p.ipAddress}.`); }} />

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Remove warming plan?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The warm-up plan for <strong>{toDelete?.ipAddress}</strong> ({toDelete?.label}) will be removed.
            The IP will no longer have its daily limit managed automatically.
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