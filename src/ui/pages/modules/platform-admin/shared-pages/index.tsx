// ─── admin/health/index.tsx ───────────────────────────────────────────────────
// System Health: real-time status of all platform services.
// Actions: manual refresh → GET /api/admin/health

import { useState, useCallback } from 'react';
import {
  Alert, Box, Button, Chip, Divider, IconButton, InputAdornment, LinearProgress,
  Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon          from '@mui/icons-material/Edit';
import ErrorIcon         from '@mui/icons-material/Error';
import HistoryIcon       from '@mui/icons-material/History';
import LanguageIcon      from '@mui/icons-material/Language';
import MonitorHeartIcon  from '@mui/icons-material/MonitorHeart';
import RefreshIcon       from '@mui/icons-material/Refresh';
import SearchIcon        from '@mui/icons-material/Search';
import StorageIcon       from '@mui/icons-material/Storage';
import WarningAmberIcon  from '@mui/icons-material/WarningAmber';
import AddIcon           from '@mui/icons-material/Add';
import CloseIcon         from '@mui/icons-material/Close';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
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

// ─── System Health ────────────────────────────────────────────────────────────

const SERVICES = [
  { id: 1, name: 'Email sending queue',  status: 'operational', latency: 42,   uptime: 99.99 },
  { id: 2, name: 'API gateway',          status: 'operational', latency: 18,   uptime: 99.98 },
  { id: 3, name: 'Contact database',     status: 'operational', latency: 8,    uptime: 100   },
  { id: 4, name: 'Webhook delivery',     status: 'degraded',    latency: 340,  uptime: 98.2  },
  { id: 5, name: 'Analytics pipeline',   status: 'operational', latency: 120,  uptime: 99.95 },
  { id: 6, name: 'Automation engine',    status: 'operational', latency: 65,   uptime: 99.97 },
  { id: 7, name: 'File / media storage', status: 'operational', latency: 22,   uptime: 99.99 },
  { id: 8, name: 'Auth service',         status: 'operational', latency: 12,   uptime: 100   },
];

export function SystemHealthPage() {
  const [services, setServices] = useState(SERVICES);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const fresh = await apiFetch('GET', '/api/admin/health') as typeof SERVICES;
      setServices(fresh);
    } catch { /* use cached */ }
    setRefreshing(false);
  };

  const hasIssues = services.some(s => s.status !== 'operational');
  const statusIcon = (status: string) =>
    status === 'operational' ? <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
    : status === 'degraded'  ? <WarningAmberIcon sx={{ fontSize: 18, color: 'warning.main' }} />
    :                           <ErrorIcon sx={{ fontSize: 18, color: 'error.main' }} />;

  return (
    <Stack spacing={2.5}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={0.3}>
          <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>System health</Typography>
          <Typography variant="body2" color="text.secondary">Real-time status of all platform services and infrastructure.</Typography>
        </Stack>
        <Button variant="outlined" startIcon={<RefreshIcon />} sx={{ borderRadius: 1 }} disabled={refreshing} onClick={handleRefresh}>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </Box>

      {hasIssues
        ? <Alert severity="warning" sx={{ fontSize: 13 }}>Some services are degraded. Our on-call team has been notified.</Alert>
        : <Alert severity="success" sx={{ fontSize: 13 }}>All {services.length} services are operational.</Alert>}

      <Stack spacing={1.5}>
        {services.map(s => (
          <GlassCard key={s.id} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {statusIcon(s.status)}
                <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>Latency</Typography>
                  <Typography variant="body2" fontWeight={600} color={s.latency > 200 ? 'warning.main' : 'text.primary'}>{s.latency}ms</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>Uptime (30d)</Typography>
                  <Typography variant="body2" fontWeight={600}>{s.uptime}%</Typography>
                </Box>
                <Chip label={s.status} size="small" variant="outlined"
                  color={s.status === 'operational' ? 'success' : s.status === 'degraded' ? 'warning' : 'error'}
                  sx={{ fontSize: 11, minWidth: 90, textTransform: 'capitalize' }} />
              </Box>
            </Box>
          </GlassCard>
        ))}
      </Stack>
    </Stack>
  );
}

// ─── admin/logs/index.tsx — Audit Logs ───────────────────────────────────────

type LogLevel = 'info' | 'warning' | 'error';
type AuditLog = { id: number; actor: string; action: string; resource: string; ip: string; level: LogLevel; time: string; };

const SEED_LOGS: AuditLog[] = [
  { id:1,  actor:'alice@acme.com',     action:'Campaign sent',              resource:'Summer Sale Blast',       ip:'41.80.12.34',   level:'info',    time:'Jul 15 · 14:32' },
  { id:2,  actor:'bob@bright.io',     action:'API key generated',          resource:'Production key',          ip:'197.23.44.12',  level:'info',    time:'Jul 15 · 13:20' },
  { id:3,  actor:'system',            action:'Bounce threshold exceeded',  resource:'Winback Campaign Q3',     ip:'—',             level:'warning', time:'Jul 15 · 12:10' },
  { id:4,  actor:'admin@platform.io', action:'Client suspended',           resource:'GreenLeaf Co',            ip:'10.0.0.1',      level:'warning', time:'Jul 14 · 09:00' },
  { id:5,  actor:'carol@techflow.com',action:'Contact list imported',      resource:'2,100 contacts',          ip:'154.66.23.91',  level:'info',    time:'Jul 13 · 16:45' },
  { id:6,  actor:'system',            action:'Failed login attempts x5',   resource:'david@techflow.com',      ip:'203.45.67.12',  level:'error',   time:'Jul 13 · 02:11' },
  { id:7,  actor:'admin@platform.io', action:'Plan changed',               resource:'Acme Corp → Pro',         ip:'10.0.0.1',      level:'info',    time:'Jul 12 · 11:30' },
  { id:8,  actor:'system',            action:'Spam complaint rate exceeded',resource:'Momentum AG',            ip:'—',             level:'error',   time:'Jul 12 · 08:44' },
];

const LOG_COLOR: Record<LogLevel, 'info'|'warning'|'error'> = { info:'info', warning:'warning', error:'error' };

export function AuditLogsPage() {
  const [logs]    = useState<AuditLog[]>(SEED_LOGS);
  const [filter,  setFilter]  = useState<LogLevel | 'all'>('all');
  const [search,  setSearch]  = useState('');

  const displayed = logs.filter(l =>
    (filter === 'all' || l.level === filter) &&
    (search === '' || l.actor.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()) || l.resource.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.3}>
        <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Audit logs</Typography>
        <Typography variant="body2" color="text.secondary">All significant actions across the platform for security and compliance review.</Typography>
      </Stack>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search actor, action, or resource…" value={search} onChange={e => setSearch(e.target.value)} sx={{ flex: 1, maxWidth: 360 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {(['all','info','warning','error'] as const).map(f => (
            <Chip key={f} label={f === 'all' ? 'All' : f} size="small"
              variant={filter === f ? 'filled' : 'outlined'}
              color={filter === f ? (f === 'all' ? 'primary' : LOG_COLOR[f as LogLevel]) : 'default'}
              onClick={() => setFilter(f)} sx={{ cursor: 'pointer', textTransform: 'capitalize', fontSize: 11 }} />
          ))}
        </Box>
      </Box>

      <GlassCard sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
                <TableCell>Actor</TableCell><TableCell>Action</TableCell><TableCell>Resource</TableCell>
                <TableCell>IP</TableCell><TableCell>Level</TableCell><TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayed.map(l => (
                <TableRow key={l.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{l.actor}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={500}>{l.action}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{l.resource}</Typography></TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{l.ip}</Typography></TableCell>
                  <TableCell><Chip label={l.level} color={LOG_COLOR[l.level]} size="small" variant="outlined" sx={{ fontSize: 10, textTransform: 'capitalize' }} /></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{l.time}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>
      {displayed.length > 0 && <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'right' }}>{displayed.length} of {logs.length} log entries</Typography>}
    </Stack>
  );
}

// ─── admin/domains/index.tsx — Global Domains ─────────────────────────────────

type GDomain = { id: number; domain: string; assignedTo: string; spf: boolean; dkim: boolean; dmarc: boolean; status: 'verified'|'pending'|'failed'; addedAt: string; };

const SEED_DOMAINS: GDomain[] = [
  { id:1, domain:'mail.acme.com',      assignedTo:'Acme Corp',    spf:true,  dkim:true,  dmarc:true,  status:'verified', addedAt:'Jan 10, 2025' },
  { id:2, domain:'send.bright.io',     assignedTo:'BrightMedia',  spf:true,  dkim:true,  dmarc:false, status:'pending',  addedAt:'Mar 15, 2025' },
  { id:3, domain:'mail.techflow.com',  assignedTo:'TechFlow Inc', spf:true,  dkim:true,  dmarc:true,  status:'verified', addedAt:'Nov 22, 2024' },
  { id:4, domain:'em.momentum.de',     assignedTo:'Momentum AG',  spf:true,  dkim:true,  dmarc:true,  status:'verified', addedAt:'Sep 16, 2024' },
];

const DOM_STATUS_COLOR: Record<string,'success'|'warning'|'error'> = { verified:'success', pending:'warning', failed:'error' };

export function GlobalDomainsPage() {
  const [domains, setDomains] = useState<GDomain[]>(SEED_DOMAINS);
  const [search, setSearch] = useState('');

  const displayed = domains.filter(d => d.domain.toLowerCase().includes(search.toLowerCase()) || d.assignedTo.toLowerCase().includes(search.toLowerCase()));

  const handleVerify = async (d: GDomain) => {
    try { const u = await apiFetch('POST', `/api/admin/domains/${d.id}/verify`) as GDomain; setDomains(prev => prev.map(x => x.id === d.id ? u : x)); }
    catch { setDomains(prev => prev.map(x => x.id === d.id ? { ...x, status: 'pending' } : x)); }
  };

  const handleDelete = async (d: GDomain) => {
    try { await apiFetch('DELETE', `/api/admin/domains/${d.id}`); } catch {}
    setDomains(prev => prev.filter(x => x.id !== d.id));
  };

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.3}>
        <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Global domains</Typography>
        <Typography variant="body2" color="text.secondary">All verified sending domains across every client account on the platform.</Typography>
      </Stack>
      <TextField size="small" placeholder="Search domain or client…" value={search} onChange={e => setSearch(e.target.value)} sx={{ maxWidth: 340 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
      <GlassCard sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' } }}>
                <TableCell>Domain</TableCell><TableCell>Client</TableCell><TableCell>DNS</TableCell><TableCell>Status</TableCell><TableCell>Added</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayed.map(d => (
                <TableRow key={d.id} hover sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell><Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{d.domain}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{d.assignedTo}</Typography></TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75}>
                      {[['SPF', d.spf],['DKIM', d.dkim],['DMARC', d.dmarc]].map(([label, ok]) => (
                        <Box key={label as string} sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                          {ok ? <CheckCircleIcon sx={{ fontSize: 12, color: 'success.main' }} /> : <ErrorIcon sx={{ fontSize: 12, color: 'error.main' }} />}
                          <Typography variant="caption" color={ok ? 'success.main' : 'error.main'} fontWeight={600}>{label}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell><Chip label={d.status} color={DOM_STATUS_COLOR[d.status]} size="small" variant="outlined" sx={{ fontSize: 11, textTransform: 'capitalize' }} /></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{d.addedAt}</Typography></TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {d.status !== 'verified' && <Button size="small" variant="outlined" sx={{ fontSize: 11, borderRadius: 1 }} onClick={() => handleVerify(d)}>Verify</Button>}
                      <Tooltip title="Remove domain"><IconButton size="small" color="error" onClick={() => handleDelete(d)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </GlassCard>
    </Stack>
  );
}

// ─── admin/infrastructure/index.tsx ──────────────────────────────────────────

const NODES = [
  { id:1, name:'SMTP relay — primary',    region:'af-south-1',   ips:['41.80.12.10','41.80.12.11'], load:62, status:'online'  },
  { id:2, name:'SMTP relay — secondary',  region:'eu-west-1',    ips:['185.220.34.5'],              load:31, status:'online'  },
  { id:3, name:'Queue worker pool',       region:'af-south-1',   ips:['10.0.1.50–60'],              load:74, status:'online'  },
  { id:4, name:'Analytics ingestion',     region:'eu-central-1', ips:['10.0.2.20'],                 load:18, status:'standby' },
  { id:5, name:'Redis cache cluster',     region:'af-south-1',   ips:['10.0.3.10','10.0.3.11'],     load:44, status:'online'  },
  { id:6, name:'Object storage (media)',  region:'us-east-1',    ips:['CDN edge'],                  load:12, status:'online'  },
];

export function InfrastructurePage() {
  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.3}>
        <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Infrastructure</Typography>
        <Typography variant="body2" color="text.secondary">Sending nodes, relay clusters, worker pools, and storage — platform backend overview.</Typography>
      </Stack>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' } }}>
        {[
          { label:'Online nodes',  value: NODES.filter(n => n.status === 'online').length,  color:'success.main' },
          { label:'Standby nodes', value: NODES.filter(n => n.status === 'standby').length, color:'warning.main' },
          { label:'Avg. load',     value: `${Math.round(NODES.reduce((a,n) => a+n.load,0)/NODES.length)}%`, color:undefined },
        ].map(s => (
          <GlassCard key={s.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={s.color ?? 'text.primary'} sx={{ mt: 0.5 }}>{s.value}</Typography>
          </GlassCard>
        ))}
      </Box>
      <Stack spacing={1.5}>
        {NODES.map(n => (
          <GlassCard key={n.id} sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>{n.name}</Typography>
                <Typography variant="caption" color="text.secondary">Region: {n.region} · IPs: {n.ips.join(', ')}</Typography>
              </Box>
              <Chip label={n.status} color={n.status === 'online' ? 'success' : 'warning'} size="small" variant="outlined" sx={{ fontSize: 11, textTransform: 'capitalize' }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LinearProgress variant="determinate" value={n.load} color={n.load >= 80 ? 'error' : n.load >= 60 ? 'warning' : 'primary'} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 48 }}>{n.load}% load</Typography>
            </Box>
          </GlassCard>
        ))}
      </Stack>
    </Stack>
  );
}

// ─── admin/config/index.tsx — Platform Config ─────────────────────────────────

type ConfigItem = { key: string; value: string; group: string; desc: string; };
const CONFIG: ConfigItem[] = [
  { group:'Email limits',  key:'max_emails_per_hour',    value:'10000',   desc:'Maximum emails per hour per client account'             },
  { group:'Email limits',  key:'bounce_threshold_pct',   value:'2.0',     desc:'Auto-pause campaigns above this bounce rate (%)'        },
  { group:'Email limits',  key:'complaint_threshold_pct',value:'0.1',     desc:'Auto-pause above this spam complaint rate (%)'          },
  { group:'Platform',      key:'trial_period_days',      value:'14',      desc:'Days of free trial for newly created accounts'          },
  { group:'Platform',      key:'default_plan',           value:'Starter', desc:'Plan assigned to new accounts on registration'         },
  { group:'Platform',      key:'max_contacts_per_import',value:'10000',   desc:'Maximum contacts per single CSV import'                 },
  { group:'Security',      key:'session_timeout_mins',   value:'60',      desc:'User session timeout in minutes'                       },
  { group:'Security',      key:'mfa_required_admins',    value:'false',   desc:'Require MFA for all Super Admin accounts'              },
  { group:'Security',      key:'api_rate_limit_per_min', value:'300',     desc:'API requests per minute per API key'                   },
];

export function PlatformConfigPage() {
  const [items, setItems]     = useState<ConfigItem[]>(CONFIG);
  const [editItem, setEditItem] = useState<ConfigItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving]   = useState(false);

  const groups = [...new Set(items.map(i => i.group))];

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true);
    try { await apiFetch('PATCH', `/api/admin/config/${editItem.key}`, { value: editValue }); }
    catch { /* offline */ }
    setItems(prev => prev.map(i => i.key === editItem.key ? { ...i, value: editValue } : i));
    setSaving(false); setEditItem(null);
  };

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.3}>
        <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Platform config</Typography>
        <Typography variant="body2" color="text.secondary">Global platform settings — changes take effect immediately for all clients.</Typography>
      </Stack>
      <Alert severity="warning" sx={{ fontSize: 13 }}>Changes affect all clients immediately. Review carefully before saving.</Alert>
      {groups.map(group => (
        <GlassCard key={group} sx={{ overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={700}>{group}</Typography>
          </Box>
          <Table size="small">
            <TableBody>
              {items.filter(i => i.group === group).map(i => (
                <TableRow key={i.key} sx={{ '& td': { fontSize: 13, borderBottom: 1, borderColor: 'divider' } }}>
                  <TableCell sx={{ width: 240 }}><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{i.key}</Typography></TableCell>
                  <TableCell><Chip label={i.value} size="small" variant="outlined" sx={{ fontSize: 11, fontFamily: 'monospace' }} /></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{i.desc}</Typography></TableCell>
                  <TableCell align="right"><Button size="small" variant="outlined" sx={{ fontSize: 11, borderRadius: 1 }} onClick={() => { setEditItem(i); setEditValue(i.value); }}>Edit</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </GlassCard>
      ))}
      <Dialog open={Boolean(editItem)} onClose={() => setEditItem(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={800}>Edit config value</Typography>
            <IconButton size="small" onClick={() => setEditItem(null)}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <Alert severity="warning" sx={{ fontSize: 12 }}>This change affects all clients immediately.</Alert>
            <TextField label={editItem?.key} size="small" fullWidth autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} helperText={editItem?.desc} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setEditItem(null)} variant="outlined" color="inherit" size="small" sx={{ mr: 'auto' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" disabled={saving}>{saving ? 'Saving…' : 'Save value'}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

// ─── admin/compliance/index.tsx ───────────────────────────────────────────────

const COMPLIANCE_ITEMS = [
  { title:'CAN-SPAM compliance',  status:'compliant',   desc:'All campaigns include physical address and unsubscribe link.'                },
  { title:'GDPR compliance',      status:'compliant',   desc:'DPAs in place. Contact deletion + data portability supported.'              },
  { title:'CASL compliance',      status:'review',      desc:'Canadian Anti-Spam Law — consent record audits needed quarterly.'           },
  { title:'DMARC enforcement',    status:'compliant',   desc:'All verified sending domains have DMARC policy = reject.'                   },
  { title:'Data retention policy',status:'compliant',   desc:'Inactive contact data purged automatically after 3 years.'                 },
  { title:'SOC 2 Type II audit',  status:'in-progress', desc:'Annual audit in progress with external auditor. ETA Q4 2025.'              },
  { title:'ISO 27001',            status:'planned',     desc:'Certification targeted for 2026. Gap analysis in progress.'                 },
];

const COMP_COLOR: Record<string,'success'|'warning'|'info'|'default'> = {
  compliant:'success', review:'warning', 'in-progress':'info', planned:'default',
};

export function CompliancePage() {
  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.3}>
        <Typography variant="h5" fontWeight={900} letterSpacing={-0.6}>Compliance</Typography>
        <Typography variant="body2" color="text.secondary">Platform-wide regulatory compliance status and data governance overview.</Typography>
      </Stack>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(4,1fr)' } }}>
        {[
          { label:'Compliant',    value: COMPLIANCE_ITEMS.filter(i=>i.status==='compliant').length,    color:'success.main' },
          { label:'Under review', value: COMPLIANCE_ITEMS.filter(i=>i.status==='review').length,       color:'warning.main' },
          { label:'In progress',  value: COMPLIANCE_ITEMS.filter(i=>i.status==='in-progress').length,  color:'info.main'    },
          { label:'Planned',      value: COMPLIANCE_ITEMS.filter(i=>i.status==='planned').length,      color:'text.secondary'},
        ].map(s => (
          <GlassCard key={s.label} sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            <Typography variant="h5" fontWeight={800} color={s.color} sx={{ mt: 0.5 }}>{s.value}</Typography>
          </GlassCard>
        ))}
      </Box>
      <Stack spacing={1.5}>
        {COMPLIANCE_ITEMS.map(i => (
          <GlassCard key={i.title} sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1, pr: 2 }}>
                <Typography variant="subtitle2" fontWeight={700}>{i.title}</Typography>
                <Typography variant="caption" color="text.secondary">{i.desc}</Typography>
              </Box>
              <Chip label={i.status.replace('-',' ')} color={COMP_COLOR[i.status]} size="small" variant="outlined"
                sx={{ fontSize: 11, textTransform: 'capitalize', flexShrink: 0 }} />
            </Box>
          </GlassCard>
        ))}
      </Stack>
    </Stack>
  );
}