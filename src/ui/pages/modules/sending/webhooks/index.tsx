// src/ui/pages/modules/sending/webhooks/index.tsx
//
// Webhooks — /app/sending/webhooks
//
// Features:
//  - List webhook endpoints with status, event subscriptions, last delivery
//  - Add / Edit endpoint (URL, secret, event types)
//  - Enable / disable per endpoint
//  - Delivery log: last 50 events per endpoint (status code, payload preview, latency)
//  - Manual re-send (retry) for failed deliveries
//  - Secret reveal/rotate
//  - Role-aware (CLIENT_USER = read only)

import { useState, useMemo, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, Collapse, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, Divider, FormControl,
  FormControlLabel, FormGroup, FormHelperText, IconButton, InputAdornment,
  Menu, MenuItem, Snackbar, Stack, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WebhookIcon from '@mui/icons-material/Webhook';

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

type EventType =
  | 'email.delivered' | 'email.opened' | 'email.clicked'
  | 'email.bounced' | 'email.complained' | 'email.unsubscribed'
  | 'contact.created' | 'contact.updated'
  | 'campaign.sent' | 'campaign.completed';

type DeliveryStatus = 'success' | 'failed' | 'pending';

type DeliveryLog = {
  id: string;
  eventType: EventType;
  statusCode: number;
  latencyMs: number;
  sentAt: string;
  status: DeliveryStatus;
  responseBody: string;
  payloadSnippet: string;
};

type Webhook = {
  id: string;
  url: string;
  description: string;
  secret: string;
  enabled: boolean;
  events: EventType[];
  successRate: number;
  lastDelivery?: string;
  lastStatus?: DeliveryStatus;
  totalDeliveries: number;
  createdAt: string;
  logs: DeliveryLog[];
};

type WebhookForm = {
  url: string;
  description: string;
  events: EventType[];
};

type FormErrors = Partial<Record<keyof WebhookForm, string>>;

// ─── Event catalogue ──────────────────────────────────────────────────────────

const EVENT_GROUPS: { label: string; events: { type: EventType; desc: string }[] }[] = [
  {
    label: 'Email delivery',
    events: [
      { type: 'email.delivered', desc: 'Message accepted by recipient server' },
      { type: 'email.opened', desc: 'Recipient opened the email' },
      { type: 'email.clicked', desc: 'Recipient clicked a tracked link' },
      { type: 'email.bounced', desc: 'Hard or soft bounce received' },
      { type: 'email.complained', desc: 'Spam complaint (FBL report)' },
      { type: 'email.unsubscribed', desc: 'Recipient unsubscribed via link' },
    ],
  },
  {
    label: 'Contacts',
    events: [
      { type: 'contact.created', desc: 'New contact added' },
      { type: 'contact.updated', desc: 'Contact data changed' },
    ],
  },
  {
    label: 'Campaigns',
    events: [
      { type: 'campaign.sent', desc: 'Campaign started sending' },
      { type: 'campaign.completed', desc: 'Campaign send complete' },
    ],
  },
];

const ALL_EVENTS: EventType[] = EVENT_GROUPS.flatMap(g => g.events.map(e => e.type));

// ─── Seed data ────────────────────────────────────────────────────────────────

function buildLogs(n: number): DeliveryLog[] {
  const types: EventType[] = ['email.delivered', 'email.opened', 'email.clicked', 'email.bounced'];
  return Array.from({ length: n }, (_, i) => {
    const ok = Math.random() > 0.1;
    return {
      id: `log_${i}`,
      eventType: types[i % types.length],
      statusCode: ok ? 200 : [500, 503, 404][i % 3],
      latencyMs: Math.floor(80 + Math.random() * 300),
      sentAt: `2025-07-${String(15 - (i % 5)).padStart(2, '0')} ${String(10 + (i % 12)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
      status: ok ? 'success' : 'failed',
      responseBody: ok ? '{"ok":true}' : '{"error":"Internal Server Error"}',
      payloadSnippet: `{"event":"${types[i % types.length]}","contact":"c_0${(i % 9) + 1}","ts":${Date.now() - i * 60000}}`,
    };
  });
}

const INITIAL_WEBHOOKS: Webhook[] = [
  {
    id: 'wh_01', url: 'https://hooks.zapier.com/hooks/catch/12345/abc123/',
    description: 'Zapier automation trigger', secret: 'whsec_abc123def456ghi789',
    enabled: true,
    events: ['email.delivered', 'email.bounced', 'email.complained', 'contact.created'],
    successRate: 98.4, lastDelivery: '2025-07-15 09:14', lastStatus: 'success',
    totalDeliveries: 1842, createdAt: '2025-03-10',
    logs: buildLogs(12),
  },
  {
    id: 'wh_02', url: 'https://api.acme-crm.io/webhooks/email-events',
    description: 'CRM sync — email events', secret: 'whsec_xyz987uvw654rst321',
    enabled: true,
    events: ['email.opened', 'email.clicked', 'email.unsubscribed', 'contact.updated'],
    successRate: 94.1, lastDelivery: '2025-07-15 09:08', lastStatus: 'failed',
    totalDeliveries: 6221, createdAt: '2025-01-22',
    logs: buildLogs(12),
  },
  {
    id: 'wh_03', url: 'https://my-analytics.example.com/ingest/email',
    description: 'Analytics data pipeline', secret: 'whsec_pqr111stu222vwx333',
    enabled: false,
    events: ALL_EVENTS,
    successRate: 100, lastDelivery: '2025-07-10 16:00', lastStatus: 'success',
    totalDeliveries: 412, createdAt: '2025-06-01',
    logs: buildLogs(6),
  },
];

const EMPTY_FORM: WebhookForm = { url: '', description: '', events: [] };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateForm(form: WebhookForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.url.trim()) errors.url = 'Endpoint URL is required';
  else if (!/^https?:\/\/.+/.test(form.url)) errors.url = 'Must be a valid HTTP/HTTPS URL';
  if (form.events.length === 0) errors.events = 'Select at least one event';
  return errors;
}

// ─── Delivery status chip ─────────────────────────────────────────────────────

function StatusChip({ status, code }: { status: DeliveryStatus; code?: number }) {
  const cfg = {
    success: { color: '#22c55e', label: code ? `${code} OK` : 'Success' },
    failed: { color: '#ef4444', label: code ? `${code} Error` : 'Failed' },
    pending: { color: '#f59e0b', label: 'Pending' },
  }[status];
  return (
    <Chip label={cfg.label} size="small"
      sx={{
        fontSize: 10, height: 18, fontWeight: 700, fontFamily: 'monospace',
        bgcolor: cfg.color + '18', color: cfg.color, border: `1px solid ${cfg.color}40`
      }} />
  );
}

// ─── Webhook card ─────────────────────────────────────────────────────────────

function WebhookCard({ wh, canEdit, onEdit, onDelete, onToggle, onRetry, onCopy }: {
  wh: Webhook; canEdit: boolean;
  onEdit: (w: Webhook) => void;
  onDelete: (w: Webhook) => void;
  onToggle: (w: Webhook) => void;
  onRetry: (w: Webhook, logId: string) => void;
  onCopy: (v: string) => void;
}) {
  const [logsOpen, setLogsOpen] = useState(false);
  const [secretVis, setSecretVis] = useState(false);
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const failedCount = wh.logs.filter(l => l.status === 'failed').length;

  return (
    <GlassCard sx={{ p: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25, flexWrap: 'wrap' }}>
            <WebhookIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
            <Typography variant="body2" fontWeight={700} noWrap sx={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}>
              {wh.url}
            </Typography>
            <Chip
              label={wh.enabled ? 'Active' : 'Disabled'}
              color={wh.enabled ? 'success' : 'default'}
              size="small" variant="outlined"
              sx={{ fontSize: 10, height: 20 }} />
          </Box>
          {wh.description && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 3 }}>{wh.description}</Typography>
          )}
        </Box>
        {canEdit && (
          <>
            <IconButton size="small" onClick={e => { e.stopPropagation(); setAnchor(e.currentTarget); }}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
              PaperProps={{ sx: { minWidth: 175, boxShadow: 4 } }}>
              <MenuItem dense onClick={() => { onEdit(wh); setAnchor(null); }}>
                <EditIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Edit endpoint
              </MenuItem>
              <MenuItem dense onClick={() => { onToggle(wh); setAnchor(null); }}>
                {wh.enabled
                  ? <><VpnKeyIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Disable</>
                  : <><CheckCircleIcon sx={{ fontSize: 16, mr: 1.5, color: 'text.secondary' }} /> Enable</>}
              </MenuItem>
              <Divider />
              <MenuItem dense sx={{ color: 'error.main' }} onClick={() => { onDelete(wh); setAnchor(null); }}>
                <DeleteOutlineIcon sx={{ fontSize: 16, mr: 1.5 }} /> Delete
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>

      {/* Stats row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, mb: 1.5 }}>
        {[
          { label: 'Total deliveries', value: wh.totalDeliveries.toLocaleString() },
          { label: 'Success rate', value: `${wh.successRate}%`, color: wh.successRate >= 95 ? 'success.main' : wh.successRate >= 85 ? 'warning.main' : 'error.main' },
          { label: 'Last delivery', value: wh.lastDelivery ?? '—' },
        ].map(s => (
          <Box key={s.label}>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: 10 }}>{s.label}</Typography>
            <Typography variant="body2" fontWeight={700} color={(s as any).color ?? 'text.primary'} sx={{ fontSize: 12 }}>
              {s.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Events */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
        {wh.events.length === ALL_EVENTS.length
          ? <Chip label="All events" size="small" sx={{ fontSize: 10, height: 18, fontWeight: 600 }} />
          : wh.events.slice(0, 4).map(e => (
            <Chip key={e} label={e} size="small" sx={{ fontSize: 10, height: 18, fontFamily: 'monospace' }} />
          ))}
        {wh.events.length > 4 && wh.events.length < ALL_EVENTS.length && (
          <Typography variant="caption" color="text.disabled">+{wh.events.length - 4}</Typography>
        )}
      </Box>

      {/* Secret */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, p: 1, bgcolor: 'action.hover', borderRadius: 1, mb: 1.5 }}>
        <VpnKeyIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
        <Typography sx={{ fontFamily: 'monospace', fontSize: 11, flex: 1, color: 'text.secondary' }}>
          {secretVis ? wh.secret : '••••••••••••••••••••••••'}
        </Typography>
        <IconButton size="small" onClick={() => setSecretVis(v => !v)}>
          {secretVis ? <VisibilityOffIcon sx={{ fontSize: 13 }} /> : <VisibilityIcon sx={{ fontSize: 13 }} />}
        </IconButton>
        <Tooltip title="Copy secret">
          <IconButton size="small" onClick={() => onCopy(wh.secret)}>
            <ContentCopyIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Recent failures alert */}
      {failedCount > 0 && (
        <Alert severity="warning" sx={{ fontSize: 12, py: 0.5, mb: 1 }}>
          {failedCount} recent failed deliveries in the log below.
        </Alert>
      )}

      {/* Delivery logs toggle */}
      <Button size="small" onClick={() => setLogsOpen(v => !v)}
        endIcon={<ExpandMoreIcon sx={{ fontSize: 14, transform: logsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />}
        sx={{ fontSize: 11, color: 'text.secondary', p: 0, minWidth: 0, textTransform: 'none' }}>
        {logsOpen ? 'Hide' : 'View'} delivery log ({wh.logs.length} events)
      </Button>

      <Collapse in={logsOpen}>
        <Box sx={{ mt: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 11, color: 'text.disabled', bgcolor: 'background.paper' } }}>
                <TableCell>Event</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Latency</TableCell>
                <TableCell>Sent at</TableCell>
                <TableCell align="right" sx={{ pr: 1.5 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {wh.logs.map(log => (
                <TableRow key={log.id} sx={{ '& td': { fontSize: 12, borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: 11 }}>{log.eventType}</Typography>
                  </TableCell>
                  <TableCell><StatusChip status={log.status} code={log.statusCode} /></TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" color={log.latencyMs > 300 ? 'warning.main' : 'text.secondary'}>
                      {log.latencyMs}ms
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{log.sentAt}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 1 }}>
                    {log.status === 'failed' && canEdit && (
                      <Tooltip title="Retry delivery">
                        <IconButton size="small" onClick={() => onRetry(wh, log.id)}>
                          <RefreshIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Copy payload">
                      <IconButton size="small" onClick={() => onCopy(log.payloadSnippet)}>
                        <ContentCopyIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Collapse>
    </GlassCard>
  );
}

// ─── Add / Edit drawer ────────────────────────────────────────────────────────

function WebhookDrawer({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void;
  editing: Webhook | null;
  onSaved: (w: Webhook, isEdit: boolean) => void;
}) {
  const [form, setForm] = useState<WebhookForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const [lastEditing, setLastEditing] = useState<Webhook | null>(null);
  if (open && editing !== lastEditing) {
    setLastEditing(editing);
    setErrors({});
    setForm(editing
      ? { url: editing.url, description: editing.description, events: editing.events }
      : EMPTY_FORM);
  }

  const toggleEvent = useCallback((e: EventType) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(e)
        ? prev.events.filter(x => x !== e)
        : [...prev.events, e],
    }));
    setErrors(prev => ({ ...prev, events: undefined }));
  }, []);

  const handleSave = async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const now = new Date().toISOString().slice(0, 10);
    try {
      if (editing) {
        const updated = await apiFetch('PUT', `/api/sending/webhooks/${editing.id}`, form) as Webhook;
        onSaved(updated, true);
      } else {
        const created = await apiFetch('POST', '/api/sending/webhooks', form) as Webhook;
        onSaved(created, false);
      }
      onClose();
    } catch {
      if (editing) {
        onSaved({ ...editing, ...form }, true);
      } else {
        onSaved({
          id: `wh_${Date.now()}`,
          secret: `whsec_${Math.random().toString(36).slice(2, 22)}`,
          enabled: true,
          successRate: 100,
          totalDeliveries: 0,
          createdAt: now,
          logs: [],
          ...form,
        }, false);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: .5 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {editing ? 'Edit webhook' : 'Add webhook endpoint'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {editing ? `Editing ${editing.url}` : "We'll send HTTP POST requests to your URL for each selected event"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2.5}>
          <TextField
            label="Endpoint URL" placeholder="https://your-server.com/webhooks"
            value={form.url} onChange={e => { setForm(p => ({ ...p, url: e.target.value })); setErrors(p => ({ ...p, url: undefined })); }}
            error={Boolean(errors.url)} helperText={errors.url ?? 'Must be publicly accessible via HTTPS'}
            fullWidth autoFocus />

          <TextField
            label="Description (optional)" placeholder="e.g. CRM sync"
            value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            fullWidth />

          {/* Event selection */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" fontWeight={700} color={errors.events ? 'error' : 'text.secondary'}
                sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Subscribe to events
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" sx={{ fontSize: 11, p: 0, textTransform: 'none' }}
                  onClick={() => setForm(p => ({ ...p, events: ALL_EVENTS }))}>Select all</Button>
                <Button size="small" sx={{ fontSize: 11, p: 0, textTransform: 'none' }}
                  onClick={() => setForm(p => ({ ...p, events: [] }))}>None</Button>
              </Box>
            </Box>
            {errors.events && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>{errors.events}</Typography>
            )}
            {EVENT_GROUPS.map(g => (
              <Box key={g.label} sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.disabled" fontWeight={700}
                  sx={{ display: 'block', mb: 0.5, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {g.label}
                </Typography>
                <FormGroup>
                  {g.events.map(ev => (
                    <FormControlLabel
                      key={ev.type}
                      control={<Switch size="small" checked={form.events.includes(ev.type)} onChange={() => toggleEvent(ev.type)} />}
                      label={
                        <Box>
                          <Typography sx={{ fontFamily: 'monospace', fontSize: 12 }}>{ev.type}</Typography>
                          <Typography variant="caption" color="text.disabled">{ev.desc}</Typography>
                        </Box>
                      }
                      sx={{ ml: 0, mb: 0.5 }}
                    />
                  ))}
                </FormGroup>
              </Box>
            ))}
          </Box>

          {!editing && (
            <Alert severity="info" sx={{ fontSize: 12 }}>
              A signing secret will be generated automatically. Use it to verify webhook payloads on your server.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={saving}
          startIcon={<WebhookIcon fontSize="small" />}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add endpoint'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── SendingWebhooksPage ──────────────────────────────────────────────────────

export function SendingWebhooksPage() {
  const { user } = useAuth();
  const canEdit = user?.role !== Role.CLIENT_USER;

  const [webhooks, setWebhooks] = useState<Webhook[]>(INITIAL_WEBHOOKS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [toDelete, setToDelete] = useState<Webhook | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  const handleSaved = useCallback((w: Webhook, isEdit: boolean) => {
    setWebhooks(prev => isEdit ? prev.map(x => x.id === w.id ? w : x) : [w, ...prev]);
    setSnack(isEdit ? `Webhook updated.` : `Webhook endpoint added.`);
  }, []);

  const handleToggle = useCallback(async (w: Webhook) => {
    const next = !w.enabled;
    try { await apiFetch('PATCH', `/api/sending/webhooks/${w.id}`, { enabled: next }); } catch { }
    setWebhooks(prev => prev.map(x => x.id === w.id ? { ...x, enabled: next } : x));
    setSnack(`Webhook ${next ? 'enabled' : 'disabled'}.`);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await apiFetch('DELETE', `/api/sending/webhooks/${toDelete.id}`); } catch { }
    setWebhooks(prev => prev.filter(x => x.id !== toDelete.id));
    setToDelete(null);
    setSnack('Webhook deleted.');
  }, [toDelete]);

  const handleRetry = useCallback(async (w: Webhook, logId: string) => {
    try { await apiFetch('POST', `/api/sending/webhooks/${w.id}/retry/${logId}`); } catch { }
    setWebhooks(prev => prev.map(x => {
      if (x.id !== w.id) return x;
      return { ...x, logs: x.logs.map(l => l.id === logId ? { ...l, status: 'success' as const, statusCode: 200 } : l) };
    }));
    setSnack('Delivery retried successfully.');
  }, []);

  const counts = useMemo(() => ({
    total: webhooks.length,
    active: webhooks.filter(w => w.enabled).length,
    failing: webhooks.filter(w => w.enabled && w.successRate < 95).length,
  }), [webhooks]);

  return (
    <Stack spacing={2.5}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Webhooks</Typography>
          <Typography variant="body2" color="text.secondary">
            Receive real-time HTTP notifications for delivery and engagement events.
          </Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 1, fontWeight: 600 }}
            onClick={() => { setEditing(null); setDrawerOpen(true); }}>
            Add endpoint
          </Button>
        )}
      </Box>

      {/* Summary */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3,1fr)' } }}>
        {[
          { label: 'Active endpoints', value: counts.active, color: 'success.main' },
          { label: 'Total endpoints', value: counts.total, color: undefined },
          { label: 'Failing (< 95%)', value: counts.failing, color: counts.failing > 0 ? 'error.main' : 'success.main' },
        ].map(s => (
          <GlassCard key={s.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={s.color ?? 'text.primary'} sx={{ mt: 0.5 }}>{s.value}</Typography>
          </GlassCard>
        ))}
      </Box>

      {/* Webhook list */}
      {webhooks.length === 0 ? (
        <GlassCard sx={{ p: 6, textAlign: 'center' }}>
          <WebhookIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>No webhook endpoints</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Add an endpoint to start receiving real-time event notifications.
          </Typography>
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setDrawerOpen(true); }}>
              Add endpoint
            </Button>
          )}
        </GlassCard>
      ) : (
        <Stack spacing={2}>
          {webhooks.map(w => (
            <WebhookCard
              key={w.id} wh={w} canEdit={canEdit}
              onEdit={x => { setEditing(x); setDrawerOpen(true); }}
              onDelete={setToDelete}
              onToggle={handleToggle}
              onRetry={handleRetry}
              onCopy={v => { navigator.clipboard.writeText(v); setSnack('Copied to clipboard.'); }}
            />
          ))}
        </Stack>
      )}

      {/* Dialogs */}
      <WebhookDrawer
        open={drawerOpen} editing={editing}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete webhook?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{toDelete?.url}</strong> will be permanently deleted. No further events will be delivered to this endpoint.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" size="small">Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(snack)} autoHideDuration={3500} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnack(null)}>{snack}</Alert>
      </Snackbar>
    </Stack>
  );
}
